# API Documentation

This document provides detailed API documentation for the Figma-to-Code Agent.

## Table of Contents

- [FigmaToCodeAgent](#figmatocodeagent)
- [FigmaClient](#figmaclient)
- [ClaudeClient](#claudeclient)
- [DesignParser](#designparser)
- [ComponentGenerator](#componentgenerator)
- [StyleGenerator](#stylegenerator)
- [TestGenerator](#testgenerator)

---

## FigmaToCodeAgent

The main orchestrator that coordinates the entire conversion pipeline.

### Constructor

```typescript
import { FigmaToCodeAgent } from 'figma-to-code-agent';

const agent = new FigmaToCodeAgent(config: AgentConfig);
```

### AgentConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `figmaAccessToken` | `string` | Yes | - | Figma API access token |
| `anthropicApiKey` | `string` | Yes | - | Anthropic API key for Claude |
| `outputDir` | `string` | Yes | - | Directory for generated files |
| `styling` | `'tailwind' \| 'css-modules' \| 'styled-components'` | No | `'tailwind'` | Styling approach |
| `generateTests` | `boolean` | No | `true` | Generate test files |
| `useAI` | `boolean` | No | `true` | Use AI for analysis |

### Methods

#### `convert(figmaInput: string, onProgress?: ProgressCallback): Promise<GenerationResult>`

Converts a Figma design to React components.

**Parameters:**
- `figmaInput`: Figma file URL or file key
- `onProgress`: Optional callback for progress updates

**Returns:** `GenerationResult` object

```typescript
interface GenerationResult {
  success: boolean;
  files: GeneratedFile[];
  errors: string[];
  warnings: string[];
  componentTree: ComponentTreeNode;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'style' | 'test' | 'story' | 'types' | 'index';
}
```

**Example:**

```typescript
const result = await agent.convert(
  'https://www.figma.com/file/ABC123/my-design',
  (progress) => {
    console.log(`${progress.stage}: ${progress.progress}%`);
  }
);

if (result.success) {
  console.log(`Generated ${result.files.length} files`);
}
```

---

## FigmaClient

Handles communication with the Figma REST API.

### Constructor

```typescript
import { FigmaClient } from 'figma-to-code-agent';

const client = new FigmaClient({ accessToken: 'your-token' });
```

### Methods

#### `getFile(fileKey: string): Promise<FigmaFile>`

Fetches a complete Figma file.

```typescript
const file = await client.getFile('ABC123xyz');
console.log(file.name); // "My Design"
console.log(file.document.children); // Pages
```

#### `getFileNodes(fileKey: string, nodeIds: string[]): Promise<Record<string, { document: FigmaNode }>>`

Fetches specific nodes from a file.

```typescript
const nodes = await client.getFileNodes('ABC123', ['1:234', '5:678']);
const node = nodes['1:234'].document;
```

#### `getImages(fileKey: string, nodeIds: string[], options?): Promise<Record<string, string>>`

Gets rendered images for nodes.

```typescript
const images = await client.getImages('ABC123', ['1:234'], {
  format: 'png',
  scale: 2
});
console.log(images['1:234']); // Image URL
```

### Static Methods

#### `FigmaClient.extractFileKey(figmaUrl: string): string`

Extracts file key from a Figma URL.

```typescript
FigmaClient.extractFileKey('https://figma.com/file/ABC123/design');
// Returns: 'ABC123'
```

#### `FigmaClient.extractNodeId(figmaUrl: string): string | null`

Extracts node ID from a Figma URL.

```typescript
FigmaClient.extractNodeId('https://figma.com/file/ABC123/design?node-id=1:234');
// Returns: '1:234'
```

---

## ClaudeClient

Handles AI-powered design analysis using Claude.

### Constructor

```typescript
import { ClaudeClient } from 'figma-to-code-agent';

const claude = new ClaudeClient({
  apiKey: 'your-anthropic-key',
  model: 'claude-sonnet-4-20250514' // optional
});
```

### Methods

#### `analyzeDesign(node: FigmaNode, context?: string): Promise<DesignAnalysis>`

Analyzes a Figma node structure and identifies components.

```typescript
const analysis = await claude.analyzeDesign(figmaNode);
console.log(analysis.components);    // Identified components
console.log(analysis.colorPalette);  // Extracted colors
console.log(analysis.typography);    // Typography tokens
console.log(analysis.spacing);       // Spacing tokens
```

#### `generateComponentCode(component, options): Promise<{ componentCode, styleCode?, typesCode? }>`

Generates React component code from parsed component.

```typescript
const code = await claude.generateComponentCode(parsedComponent, {
  styling: 'tailwind',
  typescript: true
});
console.log(code.componentCode);
```

#### `generateTestCode(componentName, componentCode, props): Promise<string>`

Generates test code for a component.

```typescript
const testCode = await claude.generateTestCode('Button', buttonCode, buttonProps);
```

---

## DesignParser

Converts Figma nodes into an intermediate representation.

### Constructor

```typescript
import { DesignParser } from 'figma-to-code-agent';

const parser = new DesignParser();
```

### Methods

#### `parseNode(node: FigmaNode, depth?: number): ParsedComponent`

Parses a Figma node tree into ParsedComponent structure.

```typescript
const parsed = parser.parseNode(figmaNode);

console.log(parsed.name);      // Component name
console.log(parsed.type);      // 'button', 'input', 'card', etc.
console.log(parsed.props);     // Inferred props
console.log(parsed.styles);    // Extracted styles
console.log(parsed.children);  // Child components
```

**ParsedComponent Interface:**

```typescript
interface ParsedComponent {
  id: string;
  name: string;
  type: ComponentType;
  props: ComponentProp[];
  styles: ParsedStyles;
  children: ParsedComponent[];
  text?: string;
  isInteractive: boolean;
  variants?: ComponentVariant[];
}
```

---

## ComponentGenerator

Generates React TypeScript components.

### Constructor

```typescript
import { ComponentGenerator } from 'figma-to-code-agent';

const generator = new ComponentGenerator({
  outputDir: './output',
  framework: 'react',
  styling: 'tailwind',
  typescript: true,
  generateTests: true,
  generateStories: false
});
```

### Methods

#### `generateComponent(component: ParsedComponent): string`

Generates React component code.

```typescript
const componentCode = generator.generateComponent(parsedComponent);
// Returns complete React component with imports, interface, and JSX
```

---

## StyleGenerator

Generates CSS styles and design tokens.

### Constructor

```typescript
import { StyleGenerator } from 'figma-to-code-agent';

const styleGen = new StyleGenerator();
```

### Methods

#### `generateCSSModule(component: ParsedComponent): string`

Generates CSS Module file content.

```typescript
const css = styleGen.generateCSSModule(component);
```

#### `generateTailwindConfig(colors, typography, spacing): string`

Generates Tailwind configuration with design tokens.

```typescript
const config = styleGen.generateTailwindConfig(colors, typography, spacing);
```

#### `generateCSSVariables(colors, typography, spacing): string`

Generates CSS custom properties from design tokens.

```typescript
const cssVars = styleGen.generateCSSVariables(colors, typography, spacing);
// :root { --color-primary: #3366cc; ... }
```

#### `generateGlobalStyles(): string`

Generates CSS reset and base styles.

---

## TestGenerator

Generates Jest + React Testing Library tests.

### Constructor

```typescript
import { TestGenerator } from 'figma-to-code-agent';

const testGen = new TestGenerator();
```

### Methods

#### `generateTests(component: ParsedComponent): string`

Generates comprehensive test file for a component.

```typescript
const testCode = testGen.generateTests(parsedComponent);
// Returns complete test file with render, interaction, and accessibility tests
```

---

## Type Definitions

### FigmaNode

```typescript
interface FigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: BoundingBox;
  fills?: Paint[];
  strokes?: Paint[];
  effects?: Effect[];
  // ... see src/types/figma.ts for complete definition
}
```

### ComponentType

```typescript
type ComponentType =
  | 'container'
  | 'text'
  | 'button'
  | 'input'
  | 'image'
  | 'icon'
  | 'link'
  | 'list'
  | 'card'
  | 'modal'
  | 'navbar'
  | 'footer'
  | 'form'
  | 'custom';
```

### ParsedStyles

```typescript
interface ParsedStyles {
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  padding?: string;
  backgroundColor?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  boxShadow?: string;
  // ... see src/types/generator.ts for complete definition
}
```

---

## Error Handling

All methods may throw errors. Common error types:

```typescript
try {
  await agent.convert(figmaUrl);
} catch (error) {
  if (error.message.includes('Invalid Figma access token')) {
    // Handle auth error
  } else if (error.message.includes('not found')) {
    // Handle not found error
  } else {
    // Handle other errors
  }
}
```

---

## Progress Callback

Track conversion progress:

```typescript
interface ConversionProgress {
  stage: string;
  progress: number;  // 0-100
  message: string;
}

agent.convert(url, (progress: ConversionProgress) => {
  updateProgressBar(progress.progress);
  setStatusMessage(progress.message);
});
```

Progress stages:
- `parsing` (0-10%)
- `fetching` (10-20%)
- `analyzing` (20-30%)
- `ai-analysis` (30-40%)
- `generating` (50-80%)
- `writing` (80-90%)
- `indexing` (90-100%)
- `complete` (100%)
