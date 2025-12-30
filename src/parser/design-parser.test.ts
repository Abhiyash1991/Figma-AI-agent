import { DesignParser } from './design-parser';
import { FigmaNode } from '../types/figma';

describe('DesignParser', () => {
  let parser: DesignParser;

  beforeEach(() => {
    parser = new DesignParser();
  });

  describe('parseNode', () => {
    it('parses a simple text node', () => {
      const node: FigmaNode = {
        id: '1:1',
        name: 'Hello Text',
        type: 'TEXT',
        characters: 'Hello World',
        visible: true,
      };

      const result = parser.parseNode(node);

      expect(result.id).toBe('1:1');
      expect(result.name).toBe('HelloText');
      expect(result.type).toBe('text');
      expect(result.text).toBe('Hello World');
    });

    it('parses a button component', () => {
      const node: FigmaNode = {
        id: '1:2',
        name: 'Primary Button',
        type: 'FRAME',
        visible: true,
        children: [
          {
            id: '1:3',
            name: 'Label',
            type: 'TEXT',
            characters: 'Click me',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
        cornerRadius: 8,
      };

      const result = parser.parseNode(node);

      expect(result.name).toBe('PrimaryButton');
      expect(result.type).toBe('button');
      expect(result.isInteractive).toBe(true);
    });

    it('parses a frame with auto-layout as flex container', () => {
      const node: FigmaNode = {
        id: '1:4',
        name: 'Container',
        type: 'FRAME',
        visible: true,
        layoutMode: 'HORIZONTAL',
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER',
        itemSpacing: 16,
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        children: [],
      };

      const result = parser.parseNode(node);

      expect(result.styles.display).toBe('flex');
      expect(result.styles.flexDirection).toBe('row');
      expect(result.styles.justifyContent).toBe('center');
      expect(result.styles.alignItems).toBe('center');
      expect(result.styles.gap).toBe('16px');
      expect(result.styles.padding).toBe('20px 20px 20px 20px');
    });

    it('extracts background color', () => {
      const node: FigmaNode = {
        id: '1:5',
        name: 'Box',
        type: 'RECTANGLE',
        visible: true,
        fills: [
          {
            type: 'SOLID',
            visible: true,
            color: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
          },
        ],
      };

      const result = parser.parseNode(node);

      expect(result.styles.backgroundColor).toBe('#3366cc');
    });

    it('extracts border radius', () => {
      const node: FigmaNode = {
        id: '1:6',
        name: 'Rounded Box',
        type: 'RECTANGLE',
        visible: true,
        cornerRadius: 12,
      };

      const result = parser.parseNode(node);

      expect(result.styles.borderRadius).toBe('12px');
    });

    it('handles individual corner radii', () => {
      const node: FigmaNode = {
        id: '1:7',
        name: 'Mixed Rounded',
        type: 'RECTANGLE',
        visible: true,
        rectangleCornerRadii: [8, 8, 0, 0],
      };

      const result = parser.parseNode(node);

      expect(result.styles.borderRadius).toBe('8px 8px 0px 0px');
    });

    it('parses input component', () => {
      const node: FigmaNode = {
        id: '1:8',
        name: 'Email Input',
        type: 'FRAME',
        visible: true,
        children: [],
      };

      const result = parser.parseNode(node);

      expect(result.type).toBe('input');
      expect(result.props).toContainEqual(
        expect.objectContaining({ name: 'value', type: 'string' })
      );
      expect(result.props).toContainEqual(
        expect.objectContaining({ name: 'placeholder', type: 'string' })
      );
    });

    it('parses card component', () => {
      const node: FigmaNode = {
        id: '1:9',
        name: 'Product Card',
        type: 'FRAME',
        visible: true,
        children: [
          { id: '1:10', name: 'Image', type: 'RECTANGLE' },
          { id: '1:11', name: 'Title', type: 'TEXT', characters: 'Product Name' },
        ],
      };

      const result = parser.parseNode(node);

      expect(result.type).toBe('card');
      expect(result.children.length).toBe(2);
    });

    it('parses navbar component', () => {
      const node: FigmaNode = {
        id: '1:12',
        name: 'Navigation Bar',
        type: 'FRAME',
        visible: true,
        children: [],
      };

      const result = parser.parseNode(node);

      expect(result.type).toBe('navbar');
    });

    it('filters out invisible nodes', () => {
      const node: FigmaNode = {
        id: '1:13',
        name: 'Container',
        type: 'FRAME',
        visible: true,
        children: [
          { id: '1:14', name: 'Visible', type: 'TEXT', visible: true, characters: 'Hi' },
          { id: '1:15', name: 'Hidden', type: 'TEXT', visible: false, characters: 'Bye' },
        ],
      };

      const result = parser.parseNode(node);

      expect(result.children.length).toBe(1);
      expect(result.children[0].name).toBe('Visible');
    });

    it('extracts text styles', () => {
      const node: FigmaNode = {
        id: '1:16',
        name: 'Styled Text',
        type: 'TEXT',
        characters: 'Hello',
        style: {
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: 600,
          lineHeightPx: 32,
          textAlignHorizontal: 'CENTER',
        },
      };

      const result = parser.parseNode(node);

      expect(result.styles.fontFamily).toBe("'Inter', sans-serif");
      expect(result.styles.fontSize).toBe('24px');
      expect(result.styles.fontWeight).toBe('600');
      expect(result.styles.lineHeight).toBe('32px');
      expect(result.styles.textAlign).toBe('center');
    });

    it('extracts drop shadow', () => {
      const node: FigmaNode = {
        id: '1:17',
        name: 'Shadow Box',
        type: 'RECTANGLE',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            radius: 10,
            offset: { x: 0, y: 4 },
            color: { r: 0, g: 0, b: 0, a: 0.25 },
          },
        ],
      };

      const result = parser.parseNode(node);

      expect(result.styles.boxShadow).toContain('0px 4px 10px');
    });

    it('handles strokes as borders', () => {
      const node: FigmaNode = {
        id: '1:18',
        name: 'Bordered Box',
        type: 'RECTANGLE',
        strokes: [
          {
            type: 'SOLID',
            visible: true,
            color: { r: 0.8, g: 0.2, b: 0.2, a: 1 },
          },
        ],
        strokeWeight: 2,
      };

      const result = parser.parseNode(node);

      expect(result.styles.borderWidth).toBe('2px');
      expect(result.styles.borderStyle).toBe('solid');
    });
  });

  describe('component type inference', () => {
    const testCases: Array<{ name: string; expected: string }> = [
      { name: 'Submit Button', expected: 'button' },
      { name: 'Primary Btn', expected: 'button' },
      { name: 'Email Input Field', expected: 'input' },
      { name: 'User Card', expected: 'card' },
      { name: 'Login Modal', expected: 'modal' },
      { name: 'Main Navigation', expected: 'navbar' },
      { name: 'Page Footer', expected: 'footer' },
      { name: 'Contact Form', expected: 'form' },
      { name: 'Item List', expected: 'list' },
      { name: 'Learn More Link', expected: 'link' },
      { name: 'Profile Icon', expected: 'icon' },
      { name: 'Hero Image', expected: 'image' },
    ];

    testCases.forEach(({ name, expected }) => {
      it(`identifies "${name}" as ${expected}`, () => {
        const node: FigmaNode = {
          id: '1:0',
          name,
          type: 'FRAME',
          children: [],
        };

        const result = parser.parseNode(node);
        expect(result.type).toBe(expected);
      });
    });
  });
});
