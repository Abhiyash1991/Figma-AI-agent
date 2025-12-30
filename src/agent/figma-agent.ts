/**
 * Figma to Code Agent
 * Main orchestrator that coordinates the conversion pipeline
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { FigmaClient } from '../figma/client';
import { ClaudeClient } from '../ai/claude-client';
import { DesignParser } from '../parser/design-parser';
import { ComponentGenerator } from '../generators/component-generator';
import { StyleGenerator } from '../generators/style-generator';
import { TestGenerator } from '../generators/test-generator';
import { FigmaNode, FigmaFile } from '../types/figma';
import {
  GeneratorConfig,
  GenerationResult,
  GeneratedFile,
  ParsedComponent,
  DesignAnalysis,
  ComponentTreeNode,
} from '../types/generator';

export interface AgentConfig {
  figmaAccessToken: string;
  anthropicApiKey: string;
  outputDir: string;
  styling?: 'tailwind' | 'css-modules' | 'styled-components';
  generateTests?: boolean;
  useAI?: boolean;
}

export interface ConversionProgress {
  stage: string;
  progress: number;
  message: string;
}

export type ProgressCallback = (progress: ConversionProgress) => void;

export class FigmaToCodeAgent {
  private figmaClient: FigmaClient;
  private claudeClient: ClaudeClient;
  private designParser: DesignParser;
  private componentGenerator: ComponentGenerator;
  private styleGenerator: StyleGenerator;
  private testGenerator: TestGenerator;
  private config: AgentConfig;
  private generatorConfig: GeneratorConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.figmaClient = new FigmaClient({ accessToken: config.figmaAccessToken });
    this.claudeClient = new ClaudeClient({ apiKey: config.anthropicApiKey });
    this.designParser = new DesignParser();

    this.generatorConfig = {
      outputDir: config.outputDir,
      framework: 'react',
      styling: config.styling || 'tailwind',
      typescript: true,
      generateTests: config.generateTests !== false,
      generateStories: false,
    };

    this.componentGenerator = new ComponentGenerator(this.generatorConfig);
    this.styleGenerator = new StyleGenerator();
    this.testGenerator = new TestGenerator();
  }

  /**
   * Convert a Figma design to code
   */
  async convert(
    figmaInput: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: false,
      files: [],
      errors: [],
      warnings: [],
      componentTree: { name: 'root', path: '', children: [] },
    };

    try {
      // Step 1: Parse Figma input
      this.reportProgress(onProgress, 'parsing', 0, 'Parsing Figma input...');
      const fileKey = FigmaClient.extractFileKey(figmaInput);
      const nodeId = FigmaClient.extractNodeId(figmaInput);

      // Step 2: Fetch Figma file
      this.reportProgress(onProgress, 'fetching', 10, 'Fetching Figma design...');
      const figmaFile = await this.figmaClient.getFile(fileKey);

      // Step 3: Get the target node
      this.reportProgress(onProgress, 'analyzing', 20, 'Analyzing design structure...');
      let targetNode: FigmaNode;

      if (nodeId) {
        const nodes = await this.figmaClient.getFileNodes(fileKey, [nodeId]);
        const nodeData = nodes[nodeId];
        if (!nodeData) {
          throw new Error(`Node ${nodeId} not found in file`);
        }
        targetNode = nodeData.document;
      } else {
        // Use the first page's first frame
        const firstPage = figmaFile.document.children[0];
        if (!firstPage || !firstPage.children?.length) {
          throw new Error('No content found in Figma file');
        }
        targetNode = firstPage.children[0];
      }

      // Step 4: Analyze with AI (optional)
      let designAnalysis: DesignAnalysis | null = null;
      if (this.config.useAI !== false) {
        this.reportProgress(onProgress, 'ai-analysis', 30, 'AI analyzing design patterns...');
        try {
          designAnalysis = await this.claudeClient.analyzeDesign(targetNode);
        } catch (error: any) {
          result.warnings.push(`AI analysis failed, falling back to rule-based parsing: ${error.message}`);
        }
      }

      // Step 5: Parse design
      this.reportProgress(onProgress, 'parsing', 40, 'Parsing design components...');
      const parsedComponent = this.designParser.parseNode(targetNode);

      // Merge AI analysis if available
      if (designAnalysis) {
        this.mergeAIAnalysis(parsedComponent, designAnalysis);
      }

      // Step 6: Generate code
      this.reportProgress(onProgress, 'generating', 50, 'Generating React components...');
      const generatedFiles = await this.generateAllFiles(parsedComponent, designAnalysis);
      result.files = generatedFiles;

      // Step 7: Write files
      this.reportProgress(onProgress, 'writing', 80, 'Writing files to disk...');
      await this.writeFiles(generatedFiles);

      // Step 8: Build component tree
      result.componentTree = this.buildComponentTree(parsedComponent, this.config.outputDir);

      // Step 9: Generate index files
      this.reportProgress(onProgress, 'indexing', 90, 'Creating index files...');
      await this.generateIndexFiles(result.componentTree);

      result.success = true;
      this.reportProgress(onProgress, 'complete', 100, 'Conversion complete!');

    } catch (error: any) {
      result.errors.push(error.message);
      this.reportProgress(onProgress, 'error', 0, `Error: ${error.message}`);
    }

    return result;
  }

  /**
   * Generate all files for a component tree
   */
  private async generateAllFiles(
    component: ParsedComponent,
    analysis: DesignAnalysis | null
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate main component
    files.push(...this.generateComponentFiles(component));

    // Generate child components recursively
    for (const child of component.children) {
      if (this.shouldBeComponent(child)) {
        files.push(...await this.generateAllFiles(child, null));
      }
    }

    // Generate design tokens if analysis is available
    if (analysis) {
      files.push(...this.generateDesignTokenFiles(analysis));
    }

    return files;
  }

  /**
   * Generate files for a single component
   */
  private generateComponentFiles(component: ParsedComponent): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const componentName = this.sanitizeName(component.name);
    const componentDir = path.join(this.config.outputDir, 'components', componentName);

    // Component file
    const componentCode = this.componentGenerator.generateComponent(component);
    files.push({
      path: path.join(componentDir, `${componentName}.tsx`),
      content: componentCode,
      type: 'component',
    });

    // Style file (if using CSS modules)
    if (this.generatorConfig.styling === 'css-modules') {
      const styleCode = this.styleGenerator.generateCSSModule(component);
      files.push({
        path: path.join(componentDir, `${componentName}.module.css`),
        content: styleCode,
        type: 'style',
      });
    }

    // Test file
    if (this.generatorConfig.generateTests) {
      const testCode = this.testGenerator.generateTests(component);
      files.push({
        path: path.join(componentDir, `${componentName}.test.tsx`),
        content: testCode,
        type: 'test',
      });
    }

    // Component index file
    files.push({
      path: path.join(componentDir, 'index.ts'),
      content: `export { ${componentName} } from './${componentName}';\nexport type { ${componentName}Props } from './${componentName}';\n`,
      type: 'index',
    });

    return files;
  }

  /**
   * Generate design token files
   */
  private generateDesignTokenFiles(analysis: DesignAnalysis): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const tokensDir = path.join(this.config.outputDir, 'styles');

    // CSS Variables
    const cssVariables = this.styleGenerator.generateCSSVariables(
      analysis.colorPalette,
      analysis.typography,
      analysis.spacing
    );
    files.push({
      path: path.join(tokensDir, 'variables.css'),
      content: cssVariables,
      type: 'style',
    });

    // Global styles
    const globalStyles = this.styleGenerator.generateGlobalStyles();
    files.push({
      path: path.join(tokensDir, 'global.css'),
      content: globalStyles,
      type: 'style',
    });

    // Tailwind config (if using Tailwind)
    if (this.generatorConfig.styling === 'tailwind') {
      const tailwindConfig = this.styleGenerator.generateTailwindConfig(
        analysis.colorPalette,
        analysis.typography,
        analysis.spacing
      );
      files.push({
        path: path.join(this.config.outputDir, 'tailwind.config.js'),
        content: tailwindConfig,
        type: 'style',
      });
    }

    return files;
  }

  /**
   * Write generated files to disk
   */
  private async writeFiles(files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      await fs.ensureDir(path.dirname(file.path));
      await fs.writeFile(file.path, file.content, 'utf-8');
    }
  }

  /**
   * Build component tree structure
   */
  private buildComponentTree(component: ParsedComponent, basePath: string): ComponentTreeNode {
    const componentName = this.sanitizeName(component.name);
    const componentPath = path.join(basePath, 'components', componentName);

    const node: ComponentTreeNode = {
      name: componentName,
      path: componentPath,
      children: [],
    };

    for (const child of component.children) {
      if (this.shouldBeComponent(child)) {
        node.children.push(this.buildComponentTree(child, basePath));
      }
    }

    return node;
  }

  /**
   * Generate index files for easy imports
   */
  private async generateIndexFiles(tree: ComponentTreeNode): Promise<void> {
    const componentsDir = path.join(this.config.outputDir, 'components');

    // Collect all component names
    const componentNames: string[] = [];
    const collectNames = (node: ComponentTreeNode) => {
      componentNames.push(node.name);
      node.children.forEach(collectNames);
    };
    collectNames(tree);

    // Generate main index
    const indexContent = componentNames
      .map((name) => `export { ${name} } from './${name}';`)
      .join('\n');

    await fs.ensureDir(componentsDir);
    await fs.writeFile(
      path.join(componentsDir, 'index.ts'),
      indexContent + '\n',
      'utf-8'
    );
  }

  /**
   * Check if a parsed component should be a separate component
   */
  private shouldBeComponent(component: ParsedComponent): boolean {
    // Simple text nodes shouldn't be components
    if (component.type === 'text' && component.children.length === 0) {
      return false;
    }

    // Components with children or complex structure should be components
    if (component.children.length > 0) {
      return true;
    }

    // Interactive elements should be components
    if (component.isInteractive) {
      return true;
    }

    // Specific component types should be components
    const componentTypes = ['button', 'input', 'card', 'modal', 'navbar', 'footer', 'form'];
    return componentTypes.includes(component.type);
  }

  /**
   * Merge AI analysis results into parsed component
   */
  private mergeAIAnalysis(component: ParsedComponent, analysis: DesignAnalysis): void {
    // Find matching component from analysis
    const match = analysis.components.find(
      (c) => c.name.toLowerCase() === component.name.toLowerCase() ||
             c.id === component.id
    );

    if (match) {
      // Merge props
      for (const prop of match.props) {
        if (!component.props.find((p) => p.name === prop.name)) {
          component.props.push(prop);
        }
      }

      // Use AI-detected type if different
      if (match.type !== 'custom' && component.type === 'custom') {
        component.type = match.type;
      }
    }

    // Recursively merge children
    for (const child of component.children) {
      this.mergeAIAnalysis(child, analysis);
    }
  }

  /**
   * Sanitize component name
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'C$&')
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    callback: ProgressCallback | undefined,
    stage: string,
    progress: number,
    message: string
  ): void {
    if (callback) {
      callback({ stage, progress, message });
    }
  }
}
