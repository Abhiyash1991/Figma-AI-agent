/**
 * React Component Generator
 * Generates React TypeScript components from parsed designs
 */

import { ParsedComponent, ParsedStyles, ComponentProp, GeneratorConfig } from '../types/generator';

export class ComponentGenerator {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Generate React component code
   */
  generateComponent(component: ParsedComponent): string {
    const componentName = this.ensureValidComponentName(component.name);
    const propsInterface = this.generatePropsInterface(componentName, component.props);
    const imports = this.generateImports(component);
    const componentBody = this.generateComponentBody(component, componentName);

    return `${imports}

${propsInterface}

${componentBody}
`;
  }

  /**
   * Generate imports section
   */
  private generateImports(component: ParsedComponent): string {
    const imports: string[] = ["import React from 'react';"];

    if (this.config.styling === 'css-modules') {
      imports.push(`import styles from './${component.name}.module.css';`);
    }

    if (this.config.styling === 'styled-components') {
      imports.push("import styled from 'styled-components';");
    }

    // Add child component imports
    const childImports = this.getChildComponentImports(component);
    imports.push(...childImports);

    return imports.join('\n');
  }

  /**
   * Get imports for child components
   */
  private getChildComponentImports(component: ParsedComponent): string[] {
    const imports: string[] = [];
    const processedNames = new Set<string>();

    const processChildren = (children: ParsedComponent[]) => {
      for (const child of children) {
        if (child.type !== 'text' && child.children.length > 0) {
          const childName = this.ensureValidComponentName(child.name);
          if (!processedNames.has(childName) && childName !== this.ensureValidComponentName(component.name)) {
            imports.push(`import { ${childName} } from './${childName}';`);
            processedNames.add(childName);
          }
        }
        if (child.children.length > 0) {
          processChildren(child.children);
        }
      }
    };

    processChildren(component.children);
    return imports;
  }

  /**
   * Generate TypeScript props interface
   */
  private generatePropsInterface(componentName: string, props: ComponentProp[]): string {
    const propLines = props.map((prop) => {
      const optional = prop.required ? '' : '?';
      const comment = prop.description ? `  /** ${prop.description} */\n` : '';
      return `${comment}  ${prop.name}${optional}: ${prop.type};`;
    });

    return `export interface ${componentName}Props {
${propLines.join('\n')}
}`;
  }

  /**
   * Generate component body
   */
  private generateComponentBody(component: ParsedComponent, componentName: string): string {
    const defaultProps = this.getDefaultProps(component.props);
    const destructuredProps = this.getDestructuredProps(component.props);
    const jsxContent = this.generateJSX(component);

    return `export const ${componentName}: React.FC<${componentName}Props> = ({
${destructuredProps}
}) => {
  return (
${this.indentCode(jsxContent, 4)}
  );
};

${defaultProps ? `${componentName}.defaultProps = {
${defaultProps}
};` : ''}`;
  }

  /**
   * Generate JSX for component
   */
  private generateJSX(component: ParsedComponent, depth: number = 0): string {
    const tag = this.getHTMLTag(component);
    const className = this.generateClassName(component);
    const attributes = this.generateAttributes(component);
    const styleAttr = this.config.styling === 'tailwind' ? '' : this.generateInlineStyle(component.styles);

    const openTag = `<${tag}${className}${attributes}${styleAttr}>`;
    const closeTag = `</${tag}>`;

    // Self-closing tags
    if (['img', 'input', 'br', 'hr'].includes(tag)) {
      return `<${tag}${className}${attributes}${styleAttr} />`;
    }

    // Text content
    if (component.text) {
      return `${openTag}${this.escapeJSX(component.text)}${closeTag}`;
    }

    // Children
    if (component.children.length === 0) {
      if (component.props.some((p) => p.name === 'children')) {
        return `${openTag}{children}${closeTag}`;
      }
      return `${openTag}${closeTag}`;
    }

    const childrenJSX = component.children
      .map((child) => this.generateJSX(child, depth + 1))
      .join('\n');

    return `${openTag}
${this.indentCode(childrenJSX, 2)}
${closeTag}`;
  }

  /**
   * Get HTML tag for component type
   */
  private getHTMLTag(component: ParsedComponent): string {
    switch (component.type) {
      case 'button':
        return 'button';
      case 'input':
        return 'input';
      case 'text':
        return 'span';
      case 'image':
        return 'img';
      case 'link':
        return 'a';
      case 'list':
        return 'ul';
      case 'navbar':
        return 'nav';
      case 'footer':
        return 'footer';
      case 'form':
        return 'form';
      case 'modal':
        return 'dialog';
      default:
        return 'div';
    }
  }

  /**
   * Generate className attribute
   */
  private generateClassName(component: ParsedComponent): string {
    if (this.config.styling === 'tailwind') {
      const tailwindClasses = this.stylesToTailwind(component.styles);
      return tailwindClasses ? ` className="${tailwindClasses}"` : '';
    }

    if (this.config.styling === 'css-modules') {
      return ` className={styles.${this.toCamelCase(component.name)}}`;
    }

    return ` className="${this.toKebabCase(component.name)}"`;
  }

  /**
   * Generate element attributes
   */
  private generateAttributes(component: ParsedComponent): string {
    const attrs: string[] = [];

    switch (component.type) {
      case 'button':
        attrs.push('type="button"');
        attrs.push('onClick={onClick}');
        attrs.push('disabled={disabled}');
        break;
      case 'input':
        attrs.push('value={value}');
        attrs.push('onChange={(e) => onChange?.(e.target.value)}');
        attrs.push('placeholder={placeholder}');
        attrs.push('disabled={disabled}');
        break;
      case 'image':
        attrs.push('src={src}');
        attrs.push('alt={alt}');
        break;
      case 'link':
        attrs.push('href={href}');
        attrs.push('target={target}');
        break;
      case 'modal':
        attrs.push('open={isOpen}');
        break;
    }

    if (component.isInteractive && component.type !== 'button' && component.type !== 'link') {
      attrs.push('role="button"');
      attrs.push('tabIndex={0}');
    }

    return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  }

  /**
   * Generate inline style object
   */
  private generateInlineStyle(styles: ParsedStyles): string {
    const styleEntries = Object.entries(styles).filter(([_, value]) => value);
    if (styleEntries.length === 0) return '';

    const styleObj = styleEntries
      .map(([key, value]) => `${key}: '${value}'`)
      .join(', ');

    return ` style={{ ${styleObj} }}`;
  }

  /**
   * Convert ParsedStyles to Tailwind classes
   */
  private stylesToTailwind(styles: ParsedStyles): string {
    const classes: string[] = [];

    // Display & Flex
    if (styles.display === 'flex') {
      classes.push('flex');
      if (styles.flexDirection === 'column') classes.push('flex-col');
      if (styles.justifyContent) classes.push(this.justifyToTailwind(styles.justifyContent));
      if (styles.alignItems) classes.push(this.alignToTailwind(styles.alignItems));
      if (styles.gap) classes.push(this.gapToTailwind(styles.gap));
    }

    // Padding
    if (styles.padding) classes.push(this.paddingToTailwind(styles.padding));

    // Width & Height
    if (styles.width) classes.push(this.sizeToTailwind('w', styles.width));
    if (styles.height) classes.push(this.sizeToTailwind('h', styles.height));

    // Background
    if (styles.backgroundColor) classes.push(this.bgColorToTailwind(styles.backgroundColor));

    // Border radius
    if (styles.borderRadius) classes.push(this.borderRadiusToTailwind(styles.borderRadius));

    // Border
    if (styles.borderWidth) {
      classes.push('border');
      if (styles.borderColor) classes.push(this.borderColorToTailwind(styles.borderColor));
    }

    // Typography
    if (styles.fontSize) classes.push(this.fontSizeToTailwind(styles.fontSize));
    if (styles.fontWeight) classes.push(this.fontWeightToTailwind(styles.fontWeight));
    if (styles.textAlign) classes.push(`text-${styles.textAlign}`);
    if (styles.color) classes.push(this.textColorToTailwind(styles.color));

    // Shadow
    if (styles.boxShadow) classes.push(this.shadowToTailwind(styles.boxShadow));

    // Opacity
    if (styles.opacity) classes.push(`opacity-${Math.round(parseFloat(styles.opacity) * 100)}`);

    // Cursor
    if (styles.cursor) classes.push(`cursor-${styles.cursor}`);

    return classes.join(' ');
  }

  /**
   * Tailwind conversion helpers
   */
  private justifyToTailwind(value: string): string {
    const map: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      center: 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    };
    return map[value] || 'justify-start';
  }

  private alignToTailwind(value: string): string {
    const map: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      center: 'items-center',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    };
    return map[value] || 'items-start';
  }

  private gapToTailwind(value: string): string {
    const px = parseInt(value);
    const scale = Math.round(px / 4);
    return `gap-${scale}`;
  }

  private paddingToTailwind(value: string): string {
    const parts = value.split(' ').map((v) => parseInt(v));
    if (parts.length === 1) {
      return `p-${Math.round(parts[0] / 4)}`;
    }
    if (parts.length === 4) {
      const [t, r, b, l] = parts.map((p) => Math.round(p / 4));
      if (t === b && l === r) {
        return `py-${t} px-${l}`;
      }
      return `pt-${t} pr-${r} pb-${b} pl-${l}`;
    }
    return `p-${Math.round(parts[0] / 4)}`;
  }

  private sizeToTailwind(prefix: 'w' | 'h', value: string): string {
    if (value === '100%') return `${prefix}-full`;
    if (value === 'auto') return `${prefix}-auto`;
    const px = parseInt(value);
    if (px <= 96 * 4) {
      return `${prefix}-${Math.round(px / 4)}`;
    }
    return `${prefix}-[${value}]`;
  }

  private bgColorToTailwind(color: string): string {
    // For now, use arbitrary values; could map to Tailwind palette
    return `bg-[${color}]`;
  }

  private borderRadiusToTailwind(value: string): string {
    const px = parseInt(value);
    if (px === 0) return 'rounded-none';
    if (px <= 2) return 'rounded-sm';
    if (px <= 4) return 'rounded';
    if (px <= 6) return 'rounded-md';
    if (px <= 8) return 'rounded-lg';
    if (px <= 12) return 'rounded-xl';
    if (px <= 16) return 'rounded-2xl';
    if (px <= 24) return 'rounded-3xl';
    if (px >= 9999) return 'rounded-full';
    return `rounded-[${value}]`;
  }

  private borderColorToTailwind(color: string): string {
    return `border-[${color}]`;
  }

  private fontSizeToTailwind(value: string): string {
    const px = parseInt(value);
    if (px <= 12) return 'text-xs';
    if (px <= 14) return 'text-sm';
    if (px <= 16) return 'text-base';
    if (px <= 18) return 'text-lg';
    if (px <= 20) return 'text-xl';
    if (px <= 24) return 'text-2xl';
    if (px <= 30) return 'text-3xl';
    if (px <= 36) return 'text-4xl';
    if (px <= 48) return 'text-5xl';
    return `text-[${value}]`;
  }

  private fontWeightToTailwind(value: string): string {
    const weight = parseInt(value);
    if (weight <= 100) return 'font-thin';
    if (weight <= 200) return 'font-extralight';
    if (weight <= 300) return 'font-light';
    if (weight <= 400) return 'font-normal';
    if (weight <= 500) return 'font-medium';
    if (weight <= 600) return 'font-semibold';
    if (weight <= 700) return 'font-bold';
    if (weight <= 800) return 'font-extrabold';
    return 'font-black';
  }

  private textColorToTailwind(color: string): string {
    return `text-[${color}]`;
  }

  private shadowToTailwind(shadow: string): string {
    if (shadow.includes('inset')) return 'shadow-inner';
    const blur = shadow.match(/(\d+)px/g)?.[2];
    if (blur) {
      const px = parseInt(blur);
      if (px <= 2) return 'shadow-sm';
      if (px <= 6) return 'shadow';
      if (px <= 15) return 'shadow-md';
      if (px <= 25) return 'shadow-lg';
      if (px <= 50) return 'shadow-xl';
      return 'shadow-2xl';
    }
    return 'shadow';
  }

  /**
   * Get default props string
   */
  private getDefaultProps(props: ComponentProp[]): string {
    const defaults = props
      .filter((p) => p.defaultValue && !p.required)
      .map((p) => `  ${p.name}: ${p.defaultValue},`);
    return defaults.join('\n');
  }

  /**
   * Get destructured props string
   */
  private getDestructuredProps(props: ComponentProp[]): string {
    return props.map((p) => `  ${p.name},`).join('\n');
  }

  /**
   * Utility functions
   */
  private ensureValidComponentName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  private toCamelCase(str: string): string {
    return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/^./, (c) => c.toLowerCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  private escapeJSX(text: string): string {
    return text.replace(/[{}<>]/g, (char) => {
      const escapes: Record<string, string> = { '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' };
      return escapes[char] || char;
    });
  }

  private indentCode(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return code.split('\n').map((line) => indent + line).join('\n');
  }
}
