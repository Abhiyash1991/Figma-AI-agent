/**
 * Style Generator
 * Generates CSS/Tailwind styles from parsed designs
 */

import { ParsedComponent, ParsedStyles, ColorToken, TypographyToken, SpacingToken } from '../types/generator';

export class StyleGenerator {
  /**
   * Generate CSS Module file content
   */
  generateCSSModule(component: ParsedComponent): string {
    let css = '';
    css += this.generateCSSForComponent(component, '');
    return css;
  }

  /**
   * Generate CSS for a component and its children
   */
  private generateCSSForComponent(component: ParsedComponent, parentSelector: string): string {
    const className = this.toKebabCase(component.name);
    const selector = parentSelector ? `${parentSelector} .${className}` : `.${className}`;

    let css = `${selector} {\n${this.stylesToCSS(component.styles)}}\n\n`;

    // Generate CSS for children
    for (const child of component.children) {
      css += this.generateCSSForComponent(child, selector);
    }

    // Add hover states for interactive components
    if (component.isInteractive) {
      css += `${selector}:hover {\n  opacity: 0.9;\n  cursor: pointer;\n}\n\n`;
      css += `${selector}:focus {\n  outline: 2px solid #0066cc;\n  outline-offset: 2px;\n}\n\n`;
    }

    return css;
  }

  /**
   * Convert ParsedStyles to CSS string
   */
  private stylesToCSS(styles: ParsedStyles): string {
    const cssLines: string[] = [];

    // Map TypeScript camelCase to CSS kebab-case
    const styleMap: Record<string, string> = {
      display: 'display',
      flexDirection: 'flex-direction',
      justifyContent: 'justify-content',
      alignItems: 'align-items',
      gap: 'gap',
      padding: 'padding',
      margin: 'margin',
      width: 'width',
      height: 'height',
      minWidth: 'min-width',
      maxWidth: 'max-width',
      minHeight: 'min-height',
      maxHeight: 'max-height',
      backgroundColor: 'background-color',
      backgroundImage: 'background-image',
      borderRadius: 'border-radius',
      borderWidth: 'border-width',
      borderColor: 'border-color',
      borderStyle: 'border-style',
      fontFamily: 'font-family',
      fontSize: 'font-size',
      fontWeight: 'font-weight',
      lineHeight: 'line-height',
      letterSpacing: 'letter-spacing',
      textAlign: 'text-align',
      color: 'color',
      textTransform: 'text-transform',
      textDecoration: 'text-decoration',
      boxShadow: 'box-shadow',
      opacity: 'opacity',
      position: 'position',
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
      zIndex: 'z-index',
      overflow: 'overflow',
      cursor: 'cursor',
    };

    for (const [key, cssProperty] of Object.entries(styleMap)) {
      const value = styles[key as keyof ParsedStyles];
      if (value) {
        cssLines.push(`  ${cssProperty}: ${value};`);
      }
    }

    return cssLines.join('\n') + '\n';
  }

  /**
   * Generate Tailwind config additions
   */
  generateTailwindConfig(
    colors: ColorToken[],
    typography: TypographyToken[],
    spacing: SpacingToken[]
  ): string {
    const colorConfig = colors.reduce((acc, color) => {
      acc[this.toKebabCase(color.name)] = color.value;
      return acc;
    }, {} as Record<string, string>);

    const fontSizeConfig = typography.reduce((acc, typo) => {
      acc[this.toKebabCase(typo.name)] = [
        typo.fontSize,
        { lineHeight: typo.lineHeight, fontWeight: typo.fontWeight },
      ];
      return acc;
    }, {} as Record<string, any>);

    const spacingConfig = spacing.reduce((acc, space) => {
      acc[this.toKebabCase(space.name)] = space.value;
      return acc;
    }, {} as Record<string, string>);

    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorConfig, null, 8).replace(/"/g, "'")},
      fontSize: ${JSON.stringify(fontSizeConfig, null, 8).replace(/"/g, "'")},
      spacing: ${JSON.stringify(spacingConfig, null, 8).replace(/"/g, "'")},
    },
  },
  plugins: [],
};
`;
  }

  /**
   * Generate CSS variables from design tokens
   */
  generateCSSVariables(
    colors: ColorToken[],
    typography: TypographyToken[],
    spacing: SpacingToken[]
  ): string {
    let css = ':root {\n';

    // Colors
    css += '  /* Colors */\n';
    for (const color of colors) {
      css += `  --color-${this.toKebabCase(color.name)}: ${color.value};\n`;
    }

    // Typography
    css += '\n  /* Typography */\n';
    for (const typo of typography) {
      css += `  --font-${this.toKebabCase(typo.name)}-size: ${typo.fontSize};\n`;
      css += `  --font-${this.toKebabCase(typo.name)}-weight: ${typo.fontWeight};\n`;
      css += `  --font-${this.toKebabCase(typo.name)}-line-height: ${typo.lineHeight};\n`;
    }

    // Spacing
    css += '\n  /* Spacing */\n';
    for (const space of spacing) {
      css += `  --spacing-${this.toKebabCase(space.name)}: ${space.value};\n`;
    }

    css += '}\n';
    return css;
  }

  /**
   * Generate global CSS reset/base styles
   */
  generateGlobalStyles(): string {
    return `/* CSS Reset & Base Styles */
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

#root, #__next {
  isolation: isolate;
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid var(--color-primary, #0066cc);
  outline-offset: 2px;
}

/* Utility classes */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;
  }

  /**
   * Utility: Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}
