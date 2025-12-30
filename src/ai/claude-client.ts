/**
 * Claude AI Client
 * Handles AI-powered design analysis and code generation
 */

import Anthropic from '@anthropic-ai/sdk';
import { FigmaNode } from '../types/figma';
import { ParsedComponent, DesignAnalysis, ComponentType, ParsedStyles } from '../types/generator';

export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
}

export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(config: ClaudeClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  /**
   * Analyze a Figma design and extract component structure
   */
  async analyzeDesign(node: FigmaNode, context?: string): Promise<DesignAnalysis> {
    const prompt = `You are an expert frontend developer analyzing a Figma design to convert it into React components.

Analyze the following Figma node structure and identify:
1. Components that should be created (buttons, cards, inputs, etc.)
2. The component hierarchy and relationships
3. Color palette used
4. Typography styles
5. Spacing patterns

Figma Node Structure:
${JSON.stringify(node, null, 2)}

${context ? `Additional Context: ${context}` : ''}

Respond with a JSON object matching this TypeScript interface:

interface DesignAnalysis {
  components: Array<{
    id: string;
    name: string;
    type: 'container' | 'text' | 'button' | 'input' | 'image' | 'icon' | 'link' | 'list' | 'card' | 'modal' | 'navbar' | 'footer' | 'form' | 'custom';
    props: Array<{ name: string; type: string; required: boolean; defaultValue?: string; description?: string }>;
    styles: object;
    children: Array<...>;
    text?: string;
    isInteractive: boolean;
  }>;
  colorPalette: Array<{ name: string; value: string; usage: string }>;
  typography: Array<{ name: string; fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string; usage: string }>;
  spacing: Array<{ name: string; value: string }>;
}

Important guidelines:
- Use semantic component types (button for clickable elements, input for form fields, etc.)
- Identify reusable components that appear multiple times
- Extract actual color values in hex or rgba format
- Convert pixel values to rem for typography (base 16px)
- Group similar spacing values into tokens

Return ONLY valid JSON, no additional text.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      throw new Error(`Failed to parse Claude response as JSON: ${content.text}`);
    }
  }

  /**
   * Generate React component code from parsed component
   */
  async generateComponentCode(
    component: ParsedComponent,
    options: { styling: 'tailwind' | 'css-modules' | 'styled-components'; typescript: boolean }
  ): Promise<{ componentCode: string; styleCode?: string; typesCode?: string }> {
    const prompt = `You are an expert React developer. Generate a production-ready React component based on this parsed component structure.

Component Structure:
${JSON.stringify(component, null, 2)}

Requirements:
- Framework: React
- Styling: ${options.styling}
- Language: ${options.typescript ? 'TypeScript' : 'JavaScript'}
- Make the component fully accessible (ARIA attributes, semantic HTML)
- Add proper prop types/interfaces
- Use functional components with hooks
- Follow React best practices
- Make styles responsive where appropriate

${options.styling === 'tailwind' ? 'Use Tailwind CSS classes directly in className attributes.' : ''}
${options.styling === 'css-modules' ? 'Use CSS Modules with a separate .module.css file.' : ''}
${options.styling === 'styled-components' ? 'Use styled-components for styling.' : ''}

Respond with a JSON object:
{
  "componentCode": "// Full component code here",
  "styleCode": "// CSS/styled-components code if applicable",
  "typesCode": "// Type definitions if using TypeScript and complex types"
}

Return ONLY valid JSON, no additional text.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    try {
      let jsonStr = content.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      throw new Error(`Failed to parse Claude response as JSON: ${content.text}`);
    }
  }

  /**
   * Generate test code for a component
   */
  async generateTestCode(
    componentName: string,
    componentCode: string,
    props: Array<{ name: string; type: string; required: boolean }>
  ): Promise<string> {
    const prompt = `You are an expert React testing developer. Generate comprehensive tests for this React component.

Component Name: ${componentName}
Component Code:
${componentCode}

Props: ${JSON.stringify(props, null, 2)}

Requirements:
- Use Jest and React Testing Library
- Test all props and their variations
- Test user interactions (clicks, inputs, etc.)
- Test accessibility
- Test edge cases
- Use TypeScript
- Follow testing best practices

Generate complete test code that covers:
1. Rendering with default props
2. Rendering with all prop variations
3. User interaction tests
4. Accessibility tests
5. Edge cases

Return ONLY the test code, no additional explanation.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract code from markdown if present
    let code = content.text;
    const codeMatch = code.match(/```(?:typescript|tsx|javascript|jsx)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      code = codeMatch[1];
    }

    return code.trim();
  }

  /**
   * Intelligently identify component type from Figma node
   */
  async identifyComponentType(node: FigmaNode): Promise<ComponentType> {
    const prompt = `Analyze this Figma node and determine what type of UI component it represents.

Node:
${JSON.stringify({
  name: node.name,
  type: node.type,
  characters: node.characters,
  children: node.children?.map((c) => ({ name: c.name, type: c.type })),
}, null, 2)}

Respond with exactly one of these component types:
container, text, button, input, image, icon, link, list, card, modal, navbar, footer, form, custom

Consider:
- Node name often indicates purpose (e.g., "Button", "Card", "Input")
- TEXT nodes with short text in rectangles are often buttons
- Frames with input-like names are inputs
- Frames with many children might be containers, cards, or lists
- Navigation-related frames are navbar/footer

Return ONLY the component type, nothing else.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return 'custom';
    }

    const type = content.text.trim().toLowerCase() as ComponentType;
    const validTypes: ComponentType[] = [
      'container', 'text', 'button', 'input', 'image', 'icon',
      'link', 'list', 'card', 'modal', 'navbar', 'footer', 'form', 'custom'
    ];

    return validTypes.includes(type) ? type : 'custom';
  }
}
