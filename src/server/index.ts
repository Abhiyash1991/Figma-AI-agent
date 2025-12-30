/**
 * Web Server for Figma to Code Agent
 * Provides a simple UI for non-technical users
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import { FigmaToCodeAgent } from '../agent/figma-agent';
import { GenerationResult } from '../types/generator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Store conversion progress for polling
const conversionProgress: Map<string, {
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  result?: GenerationResult;
  error?: string;
}> = new Map();

// Generate unique job ID
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Check if API keys are configured
 */
app.get('/api/config/status', (req, res) => {
  const hasFigmaToken = !!process.env.FIGMA_ACCESS_TOKEN;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  res.json({
    configured: hasFigmaToken && hasAnthropicKey,
    figmaToken: hasFigmaToken,
    anthropicKey: hasAnthropicKey,
  });
});

/**
 * Start a conversion job
 */
app.post('/api/convert', async (req, res) => {
  const { figmaUrl, styling = 'tailwind', generateTests = true, useAI = true } = req.body;

  if (!figmaUrl) {
    return res.status(400).json({ error: 'Figma URL is required' });
  }

  const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!figmaToken) {
    return res.status(500).json({ error: 'Figma access token not configured on server' });
  }

  if (!anthropicKey && useAI) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server' });
  }

  const jobId = generateJobId();

  // Initialize job status
  conversionProgress.set(jobId, {
    status: 'pending',
    progress: 0,
    message: 'Starting conversion...',
  });

  // Start conversion in background
  processConversion(jobId, {
    figmaUrl,
    styling,
    generateTests,
    useAI,
    figmaToken,
    anthropicKey: anthropicKey || '',
  });

  res.json({ jobId, message: 'Conversion started' });
});

/**
 * Get conversion progress
 */
app.get('/api/convert/:jobId/status', (req, res) => {
  const { jobId } = req.params;
  const status = conversionProgress.get(jobId);

  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(status);
});

/**
 * Get generated files for a completed job
 */
app.get('/api/convert/:jobId/files', (req, res) => {
  const { jobId } = req.params;
  const status = conversionProgress.get(jobId);

  if (!status) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (status.status !== 'complete') {
    return res.status(400).json({ error: 'Conversion not complete' });
  }

  res.json({
    files: status.result?.files || [],
    componentTree: status.result?.componentTree,
  });
});

/**
 * Process conversion in background
 */
async function processConversion(
  jobId: string,
  options: {
    figmaUrl: string;
    styling: 'tailwind' | 'css-modules' | 'styled-components';
    generateTests: boolean;
    useAI: boolean;
    figmaToken: string;
    anthropicKey: string;
  }
) {
  try {
    conversionProgress.set(jobId, {
      status: 'processing',
      progress: 5,
      message: 'Initializing agent...',
    });

    const outputDir = path.join(__dirname, '../../output', jobId);

    const agent = new FigmaToCodeAgent({
      figmaAccessToken: options.figmaToken,
      anthropicApiKey: options.anthropicKey,
      outputDir,
      styling: options.styling,
      generateTests: options.generateTests,
      useAI: options.useAI,
    });

    const result = await agent.convert(options.figmaUrl, (progress) => {
      conversionProgress.set(jobId, {
        status: 'processing',
        progress: progress.progress,
        message: progress.message,
      });
    });

    if (result.success) {
      conversionProgress.set(jobId, {
        status: 'complete',
        progress: 100,
        message: 'Conversion complete!',
        result,
      });
    } else {
      conversionProgress.set(jobId, {
        status: 'error',
        progress: 0,
        message: 'Conversion failed',
        error: result.errors.join(', '),
      });
    }
  } catch (error: any) {
    conversionProgress.set(jobId, {
      status: 'error',
      progress: 0,
      message: 'Conversion failed',
      error: error.message,
    });
  }
}

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎨 Figma to Code Agent - Web UI                        ║
║                                                           ║
║   Open in your browser:                                   ║
║   http://localhost:${PORT}                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
