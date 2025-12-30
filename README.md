# Figma to Code Agent

An AI-powered agent that converts Figma designs into production-ready React/TypeScript components with modular code structure and comprehensive tests.

## Features

- **AI-Powered Analysis**: Uses Claude to intelligently analyze designs and identify components, patterns, and styles
- **React + TypeScript**: Generates modern, type-safe React components
- **Tailwind CSS**: Converts designs to Tailwind utility classes (also supports CSS Modules and styled-components)
- **Comprehensive Testing**: Auto-generates Jest + React Testing Library tests for all components
- **Modular Structure**: Creates well-organized, reusable component architecture
- **Design Tokens**: Extracts colors, typography, and spacing into design tokens
- **CLI Interface**: Easy-to-use command-line tool

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/figma-to-code-agent.git
cd figma-to-code-agent

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file with your API keys:

```env
# Get from: https://www.figma.com/developers/api#access-tokens
FIGMA_ACCESS_TOKEN=your_figma_token_here

# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_key_here
```

## Usage

### CLI Commands

#### Convert a Figma Design

```bash
# Basic usage
npm run dev -- convert "https://www.figma.com/file/ABC123/my-design"

# With options
npm run dev -- convert "https://www.figma.com/file/ABC123/my-design" \
  --output ./src/components \
  --styling tailwind \
  --no-tests
```

#### Convert a Specific Frame

```bash
# Include node-id in the URL
npm run dev -- convert "https://www.figma.com/file/ABC123/my-design?node-id=1:234"
```

#### Initialize Configuration

```bash
npm run dev -- init
```

#### Validate Connection

```bash
npm run dev -- validate "https://www.figma.com/file/ABC123/my-design"
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./output` |
| `-s, --styling <type>` | Styling: `tailwind`, `css-modules`, `styled-components` | `tailwind` |
| `--no-tests` | Skip test generation | `false` |
| `--no-ai` | Disable AI analysis | `false` |
| `-t, --figma-token <token>` | Figma access token | env var |
| `-a, --api-key <key>` | Anthropic API key | env var |

### Programmatic Usage

```typescript
import { FigmaToCodeAgent } from 'figma-to-code-agent';

const agent = new FigmaToCodeAgent({
  figmaAccessToken: 'your-figma-token',
  anthropicApiKey: 'your-anthropic-key',
  outputDir: './output',
  styling: 'tailwind',
  generateTests: true,
  useAI: true,
});

const result = await agent.convert(
  'https://www.figma.com/file/ABC123/my-design',
  (progress) => {
    console.log(`${progress.stage}: ${progress.message} (${progress.progress}%)`);
  }
);

if (result.success) {
  console.log('Generated files:', result.files);
} else {
  console.error('Errors:', result.errors);
}
```

## Generated Output Structure

```
output/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Card/
│   │   ├── Card.tsx
│   │   ├── Card.test.tsx
│   │   └── index.ts
│   └── index.ts
├── styles/
│   ├── variables.css
│   └── global.css
└── tailwind.config.js
```

## Component Types

The agent recognizes and generates appropriate code for:

- **button** - Interactive buttons with variants
- **input** - Form inputs with validation
- **card** - Content containers
- **modal** - Dialogs and popups
- **navbar** - Navigation headers
- **footer** - Page footers
- **form** - Form containers
- **list** - Repeated item containers
- **link** - Anchor elements
- **image** - Image elements
- **text** - Typography elements
- **container** - Generic containers

## How It Works

1. **Fetch Design**: Retrieves the Figma file via REST API
2. **AI Analysis**: Claude analyzes the design structure, identifies components and patterns
3. **Parse Structure**: Converts Figma nodes to an intermediate representation
4. **Generate Code**: Creates React components with proper props and styling
5. **Generate Tests**: Creates comprehensive test suites
6. **Write Files**: Outputs organized file structure

## Development

```bash
# Run in development mode
npm run dev -- convert <figma-url>

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## Architecture

```
src/
├── agent/           # Main orchestrator
├── ai/              # Claude AI integration
├── figma/           # Figma API client
├── generators/      # Code generators
│   ├── component-generator.ts
│   ├── style-generator.ts
│   └── test-generator.ts
├── parser/          # Design parser
├── types/           # TypeScript interfaces
├── cli.ts           # CLI entry point
└── index.ts         # Library entry point
```

## Limitations

- Complex animations are not supported
- Image assets need to be manually downloaded
- Some complex Figma features may require manual adjustments
- Works best with well-organized Figma files using auto-layout

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.
