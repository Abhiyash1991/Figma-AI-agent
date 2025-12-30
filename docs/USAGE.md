# Usage Guide

This guide covers common use cases and workflows for the Figma-to-Code Agent.

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Conversion](#basic-conversion)
- [Converting Specific Frames](#converting-specific-frames)
- [Styling Options](#styling-options)
- [Programmatic Usage](#programmatic-usage)
- [Customizing Output](#customizing-output)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

1. **Node.js 18+** installed
2. **Figma Access Token** - Get from [Figma Settings](https://www.figma.com/developers/api#access-tokens)
3. **Anthropic API Key** - Get from [Anthropic Console](https://console.anthropic.com/)

### Installation

```bash
# Clone and install
git clone https://github.com/yourusername/figma-to-code-agent.git
cd figma-to-code-agent
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys
```

### Quick Start

```bash
# Convert a Figma design
npm run dev -- convert "https://www.figma.com/file/YOUR_FILE_KEY/Your-Design"
```

---

## Basic Conversion

### From Figma URL

```bash
# Full URL from Figma
npm run dev -- convert "https://www.figma.com/file/ABC123/My-Design"

# Or just the file key
npm run dev -- convert "ABC123"
```

### Specifying Output Directory

```bash
npm run dev -- convert "https://figma.com/file/ABC123/design" \
  --output ./src/components
```

### Skipping Tests

```bash
npm run dev -- convert "https://figma.com/file/ABC123/design" \
  --no-tests
```

### Without AI (Rule-Based Only)

```bash
npm run dev -- convert "https://figma.com/file/ABC123/design" \
  --no-ai
```

---

## Converting Specific Frames

### Using Node ID

To convert a specific frame, include the `node-id` parameter:

```bash
# Copy the URL from Figma when you have a frame selected
npm run dev -- convert "https://www.figma.com/file/ABC123/design?node-id=1:234"
```

### Finding Node IDs

1. Open your Figma file
2. Select the frame you want to convert
3. Copy the URL - it will include `node-id=X:Y`

---

## Styling Options

### Tailwind CSS (Default)

```bash
npm run dev -- convert "URL" --styling tailwind
```

Generates components with Tailwind classes:
```tsx
<div className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-lg">
```

### CSS Modules

```bash
npm run dev -- convert "URL" --styling css-modules
```

Generates components with CSS Modules:
```tsx
import styles from './Card.module.css';
<div className={styles.card}>
```

### Styled Components

```bash
npm run dev -- convert "URL" --styling styled-components
```

Generates components with styled-components:
```tsx
const Card = styled.div`
  display: flex;
  padding: 24px;
`;
```

---

## Programmatic Usage

### Basic Usage

```typescript
import { FigmaToCodeAgent } from 'figma-to-code-agent';

async function convertDesign() {
  const agent = new FigmaToCodeAgent({
    figmaAccessToken: process.env.FIGMA_ACCESS_TOKEN!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    outputDir: './src/components',
    styling: 'tailwind',
    generateTests: true,
  });

  const result = await agent.convert('https://figma.com/file/ABC123/design');

  if (result.success) {
    console.log('Generated files:', result.files.map(f => f.path));
  } else {
    console.error('Errors:', result.errors);
  }
}
```

### With Progress Tracking

```typescript
const result = await agent.convert(figmaUrl, (progress) => {
  // Update UI with progress
  progressBar.setValue(progress.progress);
  statusText.setText(progress.message);

  console.log(`[${progress.stage}] ${progress.message} (${progress.progress}%)`);
});
```

### Using Individual Components

```typescript
import { FigmaClient, DesignParser, ComponentGenerator } from 'figma-to-code-agent';

// Fetch from Figma
const figma = new FigmaClient({ accessToken: token });
const file = await figma.getFile('ABC123');

// Parse the design
const parser = new DesignParser();
const parsed = parser.parseNode(file.document.children[0].children[0]);

// Generate code
const generator = new ComponentGenerator({
  outputDir: './output',
  framework: 'react',
  styling: 'tailwind',
  typescript: true,
  generateTests: true,
  generateStories: false,
});

const code = generator.generateComponent(parsed);
console.log(code);
```

---

## Customizing Output

### Project Configuration File

Create `figma-to-code.config.js`:

```javascript
module.exports = {
  outputDir: './src/components',
  styling: 'tailwind',
  generateTests: true,
  useAI: true,

  // Custom component prefix
  componentPrefix: 'UI',

  // Custom naming convention
  naming: {
    components: 'PascalCase',
    files: 'PascalCase',
    cssClasses: 'kebab-case',
  },
};
```

### Custom Output Structure

The default output structure is:

```
output/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── index.ts
└── styles/
    ├── variables.css
    └── global.css
```

---

## Best Practices

### Figma Design Preparation

1. **Use Auto Layout**: Components with auto-layout convert to flexbox more accurately
2. **Name Layers Semantically**: Use names like "Primary Button", "Email Input" - the AI uses these
3. **Consistent Spacing**: Use consistent spacing values (8px grid recommended)
4. **Component Structure**: Group related elements into frames
5. **Avoid Deep Nesting**: Keep hierarchy reasonable (3-4 levels max)

### Component Naming in Figma

Good names the AI recognizes:
- `Primary Button` → Button component
- `Email Input Field` → Input component
- `Product Card` → Card component
- `Navigation Header` → Navbar component
- `Login Modal` → Modal component

### Organizing Large Files

For large Figma files:
1. Convert specific frames using `node-id`
2. Convert one page at a time
3. Group related components together

---

## Troubleshooting

### Common Errors

#### "Invalid Figma access token"

```
Error: Invalid Figma access token or insufficient permissions
```

**Solution**:
1. Check your token in `.env`
2. Ensure token has read access to the file
3. Generate a new token if expired

#### "Figma file not found"

```
Error: Figma file not found: ABC123
```

**Solution**:
1. Verify the file URL/key
2. Check if you have access to the file
3. File might be deleted or moved

#### "AI analysis failed"

```
Warning: AI analysis failed, falling back to rule-based parsing
```

**Solution**:
1. Check your Anthropic API key
2. Verify API quota
3. Use `--no-ai` flag to skip AI analysis

### Complex Designs

For complex designs that don't convert well:

1. **Simplify the structure**: Break into smaller components
2. **Use clear naming**: Help the AI understand component types
3. **Check auto-layout**: Ensure proper layout settings
4. **Manual adjustments**: Some designs need post-conversion tweaks

### Performance Issues

For large files:

```bash
# Convert specific frame instead of whole file
npm run dev -- convert "URL?node-id=specific:frame"

# Disable AI for faster processing
npm run dev -- convert "URL" --no-ai
```

---

## Examples

See the [examples](../examples/) directory for:

- Basic button component
- Form with inputs
- Card layout
- Navigation bar
- Complete page layout

Each example includes:
- Sample Figma JSON
- Generated React component
- Generated tests
- Expected output
