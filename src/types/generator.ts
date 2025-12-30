/**
 * Code Generator Types
 */

export interface GeneratorConfig {
  outputDir: string;
  framework: 'react';
  styling: 'tailwind' | 'css-modules' | 'styled-components';
  typescript: boolean;
  generateTests: boolean;
  generateStories: boolean;
  componentPrefix?: string;
}

export interface ParsedComponent {
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

export type ComponentType =
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

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface ParsedStyles {
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  padding?: string;
  margin?: string;

  // Sizing
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;

  // Border
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  color?: string;
  textTransform?: string;
  textDecoration?: string;

  // Effects
  boxShadow?: string;
  opacity?: string;

  // Position
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;

  // Overflow
  overflow?: string;

  // Cursor
  cursor?: string;
}

export interface ComponentVariant {
  name: string;
  props: Record<string, string | boolean>;
  styles: Partial<ParsedStyles>;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'style' | 'test' | 'story' | 'types' | 'index';
}

export interface GenerationResult {
  success: boolean;
  files: GeneratedFile[];
  errors: string[];
  warnings: string[];
  componentTree: ComponentTreeNode;
}

export interface ComponentTreeNode {
  name: string;
  path: string;
  children: ComponentTreeNode[];
}

export interface DesignAnalysis {
  components: ParsedComponent[];
  colorPalette: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  breakpoints?: BreakpointToken[];
}

export interface ColorToken {
  name: string;
  value: string;
  usage: string;
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  usage: string;
}

export interface SpacingToken {
  name: string;
  value: string;
}

export interface BreakpointToken {
  name: string;
  minWidth: string;
}
