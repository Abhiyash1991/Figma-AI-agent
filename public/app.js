/**
 * Figma to Code Agent - Frontend Application
 */

// State
let currentJobId = null;
let pollingInterval = null;
let generatedFiles = [];

// DOM Elements
const stepInput = document.getElementById('step-input');
const stepProgress = document.getElementById('step-progress');
const stepResults = document.getElementById('step-results');
const stepError = document.getElementById('step-error');
const configModal = document.getElementById('config-modal');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkConfiguration();
});

/**
 * Check if server is configured with API keys
 */
async function checkConfiguration() {
  try {
    const response = await fetch('/api/config/status');
    const config = await response.json();

    if (!config.configured) {
      showConfigModal(config);
    }
  } catch (error) {
    console.error('Failed to check configuration:', error);
  }
}

/**
 * Show configuration modal
 */
function showConfigModal(config) {
  const statusHtml = `
    <div class="config-item">
      <span>Figma Token</span>
      <span class="status ${config.figmaToken ? 'configured' : 'missing'}">
        ${config.figmaToken ? '✓ Configured' : '✗ Missing'}
      </span>
    </div>
    <div class="config-item">
      <span>Anthropic Key</span>
      <span class="status ${config.anthropicKey ? 'configured' : 'missing'}">
        ${config.anthropicKey ? '✓ Configured' : '✗ Missing'}
      </span>
    </div>
  `;

  document.getElementById('config-status').innerHTML = statusHtml;
  configModal.classList.remove('hidden');
}

/**
 * Close configuration modal
 */
function closeConfigModal() {
  configModal.classList.add('hidden');
}

/**
 * Start the conversion process
 */
async function startConversion() {
  const figmaUrl = document.getElementById('figma-url').value.trim();
  const styling = document.getElementById('styling').value;
  const generateTests = document.getElementById('generate-tests').checked;
  const useAI = document.getElementById('use-ai').checked;

  // Validate URL
  if (!figmaUrl) {
    alert('Please enter a Figma URL');
    return;
  }

  if (!figmaUrl.includes('figma.com') && !isValidFileKey(figmaUrl)) {
    alert('Please enter a valid Figma URL or file key');
    return;
  }

  // Show progress view
  showStep('progress');
  resetProgressUI();

  try {
    // Start conversion
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        figmaUrl,
        styling,
        generateTests,
        useAI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start conversion');
    }

    currentJobId = data.jobId;

    // Start polling for progress
    startPolling();

  } catch (error) {
    showError(error.message);
  }
}

/**
 * Check if string is a valid Figma file key
 */
function isValidFileKey(str) {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Start polling for job status
 */
function startPolling() {
  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/convert/${currentJobId}/status`);
      const status = await response.json();

      updateProgressUI(status);

      if (status.status === 'complete') {
        stopPolling();
        await loadResults();
      } else if (status.status === 'error') {
        stopPolling();
        showError(status.error || 'Conversion failed');
      }

    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 500);
}

/**
 * Stop polling
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

/**
 * Update progress UI
 */
function updateProgressUI(status) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent');

  progressFill.style.width = `${status.progress}%`;
  progressText.textContent = status.message;
  progressPercent.textContent = `${status.progress}%`;

  // Update status steps
  const stages = ['fetching', 'analyzing', 'ai-analysis', 'generating', 'writing'];
  const currentStageIndex = getStageIndex(status.message);

  stages.forEach((stage, index) => {
    const stepEl = document.querySelector(`[data-step="${stage}"]`);
    const iconEl = stepEl.querySelector('.status-icon');

    stepEl.classList.remove('active', 'complete');
    iconEl.classList.remove('active', 'complete');

    if (index < currentStageIndex) {
      stepEl.classList.add('complete');
      iconEl.classList.add('complete');
    } else if (index === currentStageIndex) {
      stepEl.classList.add('active');
      iconEl.classList.add('active');
    }
  });
}

/**
 * Get stage index from message
 */
function getStageIndex(message) {
  const msg = message.toLowerCase();
  if (msg.includes('fetching')) return 0;
  if (msg.includes('analyzing design') || msg.includes('parsing')) return 1;
  if (msg.includes('ai')) return 2;
  if (msg.includes('generating')) return 3;
  if (msg.includes('writing') || msg.includes('indexing') || msg.includes('complete')) return 4;
  return 0;
}

/**
 * Reset progress UI
 */
function resetProgressUI() {
  document.getElementById('progress-fill').style.width = '0%';
  document.getElementById('progress-text').textContent = 'Starting...';
  document.getElementById('progress-percent').textContent = '0%';

  document.querySelectorAll('.status-step').forEach(step => {
    step.classList.remove('active', 'complete');
    step.querySelector('.status-icon').classList.remove('active', 'complete');
  });
}

/**
 * Load and display results
 */
async function loadResults() {
  try {
    const response = await fetch(`/api/convert/${currentJobId}/files`);
    const data = await response.json();

    generatedFiles = data.files;

    // Update stats
    document.getElementById('files-count').textContent = data.files.length;
    document.getElementById('components-count').textContent =
      data.files.filter(f => f.type === 'component').length;
    document.getElementById('tests-count').textContent =
      data.files.filter(f => f.type === 'test').length;

    // Build file tree
    buildFileTree(data.files);

    // Show first file
    if (data.files.length > 0) {
      showFileContent(data.files[0]);
    }

    showStep('results');

  } catch (error) {
    showError('Failed to load results: ' + error.message);
  }
}

/**
 * Build file tree UI
 */
function buildFileTree(files) {
  const container = document.getElementById('file-tree');

  const html = files.map((file, index) => {
    const fileName = file.path.split('/').pop();
    const icon = getFileIcon(file.type);

    return `
      <div class="file-item ${index === 0 ? 'active' : ''}" onclick="selectFile(${index})">
        <span class="icon">${icon}</span>
        <span class="name">${fileName}</span>
        <span class="type ${file.type}">${file.type}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Get file icon based on type
 */
function getFileIcon(type) {
  const icons = {
    component: '⚛️',
    test: '🧪',
    style: '🎨',
    types: '📝',
    index: '📄',
  };
  return icons[type] || '📄';
}

/**
 * Select a file to preview
 */
function selectFile(index) {
  // Update active state
  document.querySelectorAll('.file-item').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  // Show file content
  showFileContent(generatedFiles[index]);
}

/**
 * Show file content in preview
 */
function showFileContent(file) {
  const codeContent = document.getElementById('code-content');
  codeContent.textContent = file.content;
}

/**
 * Download all generated files
 */
function downloadFiles() {
  if (generatedFiles.length === 0) return;

  // Create a simple text file with all content
  let content = '// Generated by Figma to Code Agent\n\n';

  generatedFiles.forEach(file => {
    content += `// ============================================\n`;
    content += `// File: ${file.path}\n`;
    content += `// ============================================\n\n`;
    content += file.content;
    content += '\n\n';
  });

  // Download
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'figma-generated-code.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Show error state
 */
function showError(message) {
  document.getElementById('error-message').textContent = message;
  showStep('error');
}

/**
 * Show a specific step
 */
function showStep(step) {
  stepInput.classList.add('hidden');
  stepProgress.classList.add('hidden');
  stepResults.classList.add('hidden');
  stepError.classList.add('hidden');

  switch (step) {
    case 'input':
      stepInput.classList.remove('hidden');
      break;
    case 'progress':
      stepProgress.classList.remove('hidden');
      break;
    case 'results':
      stepResults.classList.remove('hidden');
      break;
    case 'error':
      stepError.classList.remove('hidden');
      break;
  }
}

/**
 * Reset form to initial state
 */
function resetForm() {
  stopPolling();
  currentJobId = null;
  generatedFiles = [];
  document.getElementById('figma-url').value = '';
  showStep('input');
}
