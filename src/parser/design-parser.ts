/**
 * Design Parser
 * Converts Figma nodes into ParsedComponent structures
 */

import { FigmaNode, Color, Paint, TextStyle, Effect } from '../types/figma';
import { ParsedComponent, ParsedStyles, ComponentType, ComponentProp } from '../types/generator';

export class DesignParser {
  /**
   * Parse a Figma node tree into ParsedComponent structure
   */
  parseNode(node: FigmaNode, depth: number = 0): ParsedComponent {
    const componentType = this.inferComponentType(node);
    const styles = this.extractStyles(node);
    const props = this.extractProps(node, componentType);

    const parsedComponent: ParsedComponent = {
      id: node.id,
      name: this.sanitizeComponentName(node.name),
      type: componentType,
      props,
      styles,
      children: [],
      isInteractive: this.isInteractiveComponent(node, componentType),
    };

    // Add text content for text nodes
    if (node.type === 'TEXT' && node.characters) {
      parsedComponent.text = node.characters;
    }

    // Recursively parse children
    if (node.children && node.children.length > 0) {
      parsedComponent.children = node.children
        .filter((child) => child.visible !== false)
        .map((child) => this.parseNode(child, depth + 1));
    }

    return parsedComponent;
  }

  /**
   * Infer component type from Figma node
   */
  private inferComponentType(node: FigmaNode): ComponentType {
    const nameLower = node.name.toLowerCase();

    // Check name-based patterns
    if (nameLower.includes('button') || nameLower.includes('btn')) return 'button';
    if (nameLower.includes('input') || nameLower.includes('textfield') || nameLower.includes('text field')) return 'input';
    if (nameLower.includes('card')) return 'card';
    if (nameLower.includes('modal') || nameLower.includes('dialog') || nameLower.includes('popup')) return 'modal';
    if (nameLower.includes('nav') || nameLower.includes('header') || nameLower.includes('menu')) return 'navbar';
    if (nameLower.includes('footer')) return 'footer';
    if (nameLower.includes('form')) return 'form';
    if (nameLower.includes('list') || nameLower.includes('grid')) return 'list';
    if (nameLower.includes('link') || nameLower.includes('anchor')) return 'link';
    if (nameLower.includes('icon') || nameLower.includes('svg')) return 'icon';
    if (nameLower.includes('image') || nameLower.includes('img') || nameLower.includes('photo')) return 'image';

    // Check node type
    if (node.type === 'TEXT') return 'text';
    if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'ELLIPSE' || node.type === 'LINE') return 'icon';
    if (node.type === 'RECTANGLE' && !node.children?.length) {
      // Check if it might be a button (small rectangle with rounded corners)
      if (node.cornerRadius && node.cornerRadius > 0) {
        const bbox = node.absoluteBoundingBox;
        if (bbox && bbox.height < 60 && bbox.width < 300) {
          return 'button';
        }
      }
      return 'container';
    }

    // FRAME, GROUP, COMPONENT, INSTANCE are containers
    if (['FRAME', 'GROUP', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET', 'SECTION'].includes(node.type)) {
      // Check if it's a button-like component (small frame with text child)
      if (node.children?.length === 1 && node.children[0].type === 'TEXT') {
        const bbox = node.absoluteBoundingBox;
        if (bbox && bbox.height < 60 && bbox.width < 300) {
          return 'button';
        }
      }
      return 'container';
    }

    return 'custom';
  }

  /**
   * Extract styles from Figma node
   */
  private extractStyles(node: FigmaNode): ParsedStyles {
    const styles: ParsedStyles = {};

    // Layout styles
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      styles.display = 'flex';
      styles.flexDirection = node.layoutMode === 'VERTICAL' ? 'column' : 'row';

      if (node.primaryAxisAlignItems) {
        styles.justifyContent = this.mapAlignmentToCSS(node.primaryAxisAlignItems);
      }
      if (node.counterAxisAlignItems) {
        styles.alignItems = this.mapAlignmentToCSS(node.counterAxisAlignItems);
      }
      if (node.itemSpacing) {
        styles.gap = `${node.itemSpacing}px`;
      }
    }

    // Padding
    if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
      const pt = node.paddingTop || 0;
      const pr = node.paddingRight || 0;
      const pb = node.paddingBottom || 0;
      const pl = node.paddingLeft || 0;
      styles.padding = `${pt}px ${pr}px ${pb}px ${pl}px`;
    }

    // Size
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      // Use relative sizing for auto-layout children
      if (node.layoutAlign === 'STRETCH') {
        styles.width = '100%';
      } else if (node.primaryAxisSizingMode !== 'AUTO') {
        styles.width = `${width}px`;
      }
      if (node.counterAxisSizingMode !== 'AUTO') {
        styles.height = `${height}px`;
      }
    }

    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find((f) => f.visible !== false);
      if (fill) {
        if (fill.type === 'SOLID' && fill.color) {
          styles.backgroundColor = this.colorToRgba(fill.color, fill.opacity);
        } else if (fill.type.startsWith('GRADIENT_') && fill.gradientStops) {
          styles.backgroundImage = this.gradientToCSS(fill);
        }
      }
    }

    // Border radius
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    } else if (node.rectangleCornerRadii) {
      const [tl, tr, br, bl] = node.rectangleCornerRadii;
      styles.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
    }

    // Border/Stroke
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes.find((s) => s.visible !== false);
      if (stroke && stroke.color) {
        styles.borderWidth = `${node.strokeWeight}px`;
        styles.borderColor = this.colorToRgba(stroke.color, stroke.opacity);
        styles.borderStyle = 'solid';
      }
    }

    // Effects (shadows)
    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects.filter(
        (e) => (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') && e.visible !== false
      );
      if (shadows.length > 0) {
        styles.boxShadow = shadows.map((s) => this.effectToBoxShadow(s)).join(', ');
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      styles.opacity = String(node.opacity);
    }

    // Text styles
    if (node.type === 'TEXT' && node.style) {
      Object.assign(styles, this.extractTextStyles(node.style));
    }

    return styles;
  }

  /**
   * Extract text-specific styles
   */
  private extractTextStyles(textStyle: TextStyle): Partial<ParsedStyles> {
    const styles: Partial<ParsedStyles> = {};

    if (textStyle.fontFamily) {
      styles.fontFamily = `'${textStyle.fontFamily}', sans-serif`;
    }
    if (textStyle.fontSize) {
      styles.fontSize = `${textStyle.fontSize}px`;
    }
    if (textStyle.fontWeight) {
      styles.fontWeight = String(textStyle.fontWeight);
    }
    if (textStyle.lineHeightPx) {
      styles.lineHeight = `${textStyle.lineHeightPx}px`;
    }
    if (textStyle.letterSpacing) {
      styles.letterSpacing = `${textStyle.letterSpacing}px`;
    }
    if (textStyle.textAlignHorizontal) {
      styles.textAlign = textStyle.textAlignHorizontal.toLowerCase();
    }
    if (textStyle.textCase) {
      const caseMap: Record<string, string> = {
        UPPER: 'uppercase',
        LOWER: 'lowercase',
        TITLE: 'capitalize',
      };
      if (caseMap[textStyle.textCase]) {
        styles.textTransform = caseMap[textStyle.textCase];
      }
    }
    if (textStyle.textDecoration) {
      const decoMap: Record<string, string> = {
        UNDERLINE: 'underline',
        STRIKETHROUGH: 'line-through',
      };
      if (decoMap[textStyle.textDecoration]) {
        styles.textDecoration = decoMap[textStyle.textDecoration];
      }
    }

    return styles;
  }

  /**
   * Extract props for component
   */
  private extractProps(node: FigmaNode, componentType: ComponentType): ComponentProp[] {
    const props: ComponentProp[] = [];

    // Common props based on component type
    switch (componentType) {
      case 'button':
        props.push(
          { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
          { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
          { name: 'variant', type: "'primary' | 'secondary' | 'outline'", required: false, defaultValue: "'primary'" },
          { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, defaultValue: "'md'" }
        );
        if (node.type === 'TEXT' || (node.children?.length === 1 && node.children[0].type === 'TEXT')) {
          props.push({ name: 'children', type: 'React.ReactNode', required: true });
        }
        break;

      case 'input':
        props.push(
          { name: 'value', type: 'string', required: false },
          { name: 'onChange', type: '(value: string) => void', required: false },
          { name: 'placeholder', type: 'string', required: false },
          { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
          { name: 'error', type: 'string', required: false },
          { name: 'label', type: 'string', required: false }
        );
        break;

      case 'card':
        props.push(
          { name: 'children', type: 'React.ReactNode', required: true },
          { name: 'onClick', type: '() => void', required: false },
          { name: 'hoverable', type: 'boolean', required: false, defaultValue: 'false' }
        );
        break;

      case 'modal':
        props.push(
          { name: 'isOpen', type: 'boolean', required: true },
          { name: 'onClose', type: '() => void', required: true },
          { name: 'title', type: 'string', required: false },
          { name: 'children', type: 'React.ReactNode', required: true }
        );
        break;

      case 'text':
        props.push(
          { name: 'children', type: 'React.ReactNode', required: true },
          { name: 'as', type: "'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'", required: false, defaultValue: "'p'" }
        );
        break;

      case 'image':
        props.push(
          { name: 'src', type: 'string', required: true },
          { name: 'alt', type: 'string', required: true },
          { name: 'width', type: 'number | string', required: false },
          { name: 'height', type: 'number | string', required: false }
        );
        break;

      case 'link':
        props.push(
          { name: 'href', type: 'string', required: true },
          { name: 'children', type: 'React.ReactNode', required: true },
          { name: 'target', type: "'_blank' | '_self'", required: false },
          { name: 'onClick', type: '() => void', required: false }
        );
        break;

      case 'list':
        props.push(
          { name: 'items', type: 'T[]', required: true },
          { name: 'renderItem', type: '(item: T, index: number) => React.ReactNode', required: true },
          { name: 'keyExtractor', type: '(item: T, index: number) => string', required: false }
        );
        break;

      default:
        props.push({ name: 'children', type: 'React.ReactNode', required: false });
        props.push({ name: 'className', type: 'string', required: false });
    }

    // Add component properties from Figma if available
    if (node.componentProperties) {
      Object.entries(node.componentProperties).forEach(([key, prop]) => {
        const propName = this.sanitizePropName(key);
        if (!props.find((p) => p.name === propName)) {
          props.push({
            name: propName,
            type: prop.type === 'BOOLEAN' ? 'boolean' : 'string',
            required: false,
            defaultValue: String(prop.value),
          });
        }
      });
    }

    return props;
  }

  /**
   * Check if component should be interactive
   */
  private isInteractiveComponent(node: FigmaNode, componentType: ComponentType): boolean {
    const interactiveTypes: ComponentType[] = ['button', 'input', 'link', 'modal'];
    if (interactiveTypes.includes(componentType)) return true;

    // Check name for interactive hints
    const nameLower = node.name.toLowerCase();
    return nameLower.includes('click') || nameLower.includes('hover') || nameLower.includes('tap');
  }

  /**
   * Sanitize component name to valid identifier
   */
  private sanitizeComponentName(name: string): string {
    // Remove special characters and convert to PascalCase
    return name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Sanitize prop name to valid identifier
   */
  private sanitizePropName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, '_$&')
      .replace(/^(.)/, (c) => c.toLowerCase());
  }

  /**
   * Convert Figma color to rgba string
   */
  private colorToRgba(color: Color, opacity?: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = opacity ?? color.a ?? 1;

    if (a === 1) {
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  /**
   * Convert Figma gradient to CSS
   */
  private gradientToCSS(paint: Paint): string {
    if (!paint.gradientStops || !paint.gradientHandlePositions) {
      return '';
    }

    const stops = paint.gradientStops
      .map((stop) => `${this.colorToRgba(stop.color)} ${Math.round(stop.position * 100)}%`)
      .join(', ');

    if (paint.type === 'GRADIENT_LINEAR') {
      const [start, end] = paint.gradientHandlePositions;
      const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;
      return `linear-gradient(${angle.toFixed(0)}deg, ${stops})`;
    }

    if (paint.type === 'GRADIENT_RADIAL') {
      return `radial-gradient(circle, ${stops})`;
    }

    return `linear-gradient(${stops})`;
  }

  /**
   * Convert Figma effect to box-shadow CSS
   */
  private effectToBoxShadow(effect: Effect): string {
    const color = effect.color ? this.colorToRgba(effect.color) : 'rgba(0, 0, 0, 0.25)';
    const x = effect.offset?.x || 0;
    const y = effect.offset?.y || 0;
    const blur = effect.radius || 0;
    const spread = effect.spread || 0;
    const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';

    return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  }

  /**
   * Map Figma alignment to CSS
   */
  private mapAlignmentToCSS(alignment: string): string {
    const map: Record<string, string> = {
      MIN: 'flex-start',
      MAX: 'flex-end',
      CENTER: 'center',
      SPACE_BETWEEN: 'space-between',
      BASELINE: 'baseline',
    };
    return map[alignment] || 'flex-start';
  }
}
