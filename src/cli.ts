#!/usr/bin/env node

/**
 * Figma to Code CLI
 * Command-line interface for the Figma to Code Agent
 */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs-extra';
import { FigmaToCodeAgent, ConversionProgress } from './agent/figma-agent';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('figma-to-code')
  .description('Convert Figma designs to React/TypeScript code with AI assistance')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert a Figma design to React components')
  .argument('<figma-url>', 'Figma file URL or file key')
  .option('-o, --output <directory>', 'Output directory', './output')
  .option('-s, --styling <type>', 'Styling approach (tailwind, css-modules, styled-components)', 'tailwind')
  .option('--no-tests', 'Skip test file generation')
  .option('--no-ai', 'Disable AI analysis (use rule-based parsing only)')
  .option('-t, --figma-token <token>', 'Figma access token (or set FIGMA_ACCESS_TOKEN env var)')
  .option('-a, --api-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY env var)')
  .action(async (figmaUrl: string, options: any) => {
    const spinner = ora('Initializing...').start();

    try {
      // Validate tokens
      const figmaToken = options.figmaToken || process.env.FIGMA_ACCESS_TOKEN;
      const anthropicKey = options.apiKey || process.env.ANTHROPIC_API_KEY;

      if (!figmaToken) {
        spinner.fail(chalk.red('Figma access token is required'));
        console.log(chalk.yellow('\nSet FIGMA_ACCESS_TOKEN environment variable or use --figma-token flag'));
        console.log(chalk.gray('Get your token from: https://www.figma.com/developers/api#access-tokens'));
        process.exit(1);
      }

      if (!anthropicKey && options.ai !== false) {
        spinner.fail(chalk.red('Anthropic API key is required for AI analysis'));
        console.log(chalk.yellow('\nSet ANTHROPIC_API_KEY environment variable or use --api-key flag'));
        console.log(chalk.gray('Or use --no-ai to disable AI analysis'));
        process.exit(1);
      }

      // Create output directory
      const outputDir = path.resolve(options.output);
      await fs.ensureDir(outputDir);

      // Initialize agent
      const agent = new FigmaToCodeAgent({
        figmaAccessToken: figmaToken,
        anthropicApiKey: anthropicKey || '',
        outputDir,
        styling: options.styling,
        generateTests: options.tests !== false,
        useAI: options.ai !== false,
      });

      // Convert with progress updates
      const result = await agent.convert(figmaUrl, (progress: ConversionProgress) => {
        spinner.text = `${progress.message} (${progress.progress}%)`;
      });

      if (result.success) {
        spinner.succeed(chalk.green('Conversion complete!'));

        console.log('\n' + chalk.bold('Generated Files:'));
        console.log(chalk.gray('─'.repeat(50)));

        // Group files by type
        const filesByType: Record<string, string[]> = {};
        for (const file of result.files) {
          if (!filesByType[file.type]) {
            filesByType[file.type] = [];
          }
          filesByType[file.type].push(file.path);
        }

        for (const [type, files] of Object.entries(filesByType)) {
          console.log(chalk.cyan(`\n${type.charAt(0).toUpperCase() + type.slice(1)}s:`));
          for (const file of files) {
            console.log(chalk.gray(`  • ${path.relative(process.cwd(), file)}`));
          }
        }

        // Print component tree
        console.log('\n' + chalk.bold('Component Tree:'));
        console.log(chalk.gray('─'.repeat(50)));
        printTree(result.componentTree, 0);

        // Print warnings
        if (result.warnings.length > 0) {
          console.log('\n' + chalk.yellow('Warnings:'));
          for (const warning of result.warnings) {
            console.log(chalk.yellow(`  ⚠ ${warning}`));
          }
        }

        console.log('\n' + chalk.green('✓ Output saved to: ' + outputDir));
        console.log(chalk.gray('\nNext steps:'));
        console.log(chalk.gray('  1. cd ' + options.output));
        console.log(chalk.gray('  2. Install dependencies in your React project'));
        console.log(chalk.gray('  3. Import components from ./components'));

      } else {
        spinner.fail(chalk.red('Conversion failed'));
        for (const error of result.errors) {
          console.log(chalk.red(`  ✗ ${error}`));
        }
        process.exit(1);
      }

    } catch (error: any) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new project with Figma to Code configuration')
  .option('-d, --directory <path>', 'Project directory', '.')
  .action(async (options: any) => {
    const spinner = ora('Creating configuration files...').start();

    try {
      const projectDir = path.resolve(options.directory);
      await fs.ensureDir(projectDir);

      // Create .env.example
      const envExample = `# Figma API Token
# Get it from: https://www.figma.com/developers/api#access-tokens
FIGMA_ACCESS_TOKEN=your_figma_token_here

# Anthropic API Key
# Get it from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_key_here

# Output directory (optional)
OUTPUT_DIR=./src/components
`;

      await fs.writeFile(path.join(projectDir, '.env.example'), envExample);

      // Create figma-to-code.config.js
      const configFile = `module.exports = {
  // Output directory for generated components
  outputDir: './src/components',

  // Styling approach: 'tailwind', 'css-modules', or 'styled-components'
  styling: 'tailwind',

  // Generate test files
  generateTests: true,

  // Use AI for intelligent analysis
  useAI: true,
};
`;

      await fs.writeFile(path.join(projectDir, 'figma-to-code.config.js'), configFile);

      spinner.succeed(chalk.green('Configuration files created!'));

      console.log('\n' + chalk.bold('Created files:'));
      console.log(chalk.gray(`  • ${path.join(projectDir, '.env.example')}`));
      console.log(chalk.gray(`  • ${path.join(projectDir, 'figma-to-code.config.js')}`));

      console.log('\n' + chalk.yellow('Next steps:'));
      console.log(chalk.gray('  1. Copy .env.example to .env and fill in your API keys'));
      console.log(chalk.gray('  2. Customize figma-to-code.config.js as needed'));
      console.log(chalk.gray('  3. Run: figma-to-code convert <figma-url>'));

    } catch (error: any) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate Figma URL and API tokens')
  .argument('<figma-url>', 'Figma file URL to validate')
  .option('-t, --figma-token <token>', 'Figma access token')
  .action(async (figmaUrl: string, options: any) => {
    const spinner = ora('Validating...').start();

    try {
      const figmaToken = options.figmaToken || process.env.FIGMA_ACCESS_TOKEN;

      if (!figmaToken) {
        spinner.fail(chalk.red('Figma access token is required'));
        process.exit(1);
      }

      // Import FigmaClient to validate
      const { FigmaClient } = await import('./figma/client');

      const fileKey = FigmaClient.extractFileKey(figmaUrl);
      spinner.text = `Validating file key: ${fileKey}`;

      const client = new FigmaClient({ accessToken: figmaToken });
      const file = await client.getFile(fileKey);

      spinner.succeed(chalk.green('Validation successful!'));

      console.log('\n' + chalk.bold('File Information:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`  Name: ${chalk.cyan(file.name)}`);
      console.log(`  Last Modified: ${chalk.gray(file.lastModified)}`);
      console.log(`  Version: ${chalk.gray(file.version)}`);

      const pageCount = file.document.children.length;
      console.log(`  Pages: ${chalk.cyan(pageCount)}`);

      // List pages
      console.log('\n' + chalk.bold('Pages:'));
      for (const page of file.document.children) {
        const frameCount = page.children?.length || 0;
        console.log(`  • ${page.name} (${frameCount} frames)`);
      }

    } catch (error: any) {
      spinner.fail(chalk.red(`Validation failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Print component tree
 */
function printTree(node: { name: string; children: any[] }, depth: number): void {
  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '' : '├─ ';
  console.log(chalk.cyan(`${indent}${prefix}${node.name}`));

  for (let i = 0; i < node.children.length; i++) {
    printTree(node.children[i], depth + 1);
  }
}

program.parse();
