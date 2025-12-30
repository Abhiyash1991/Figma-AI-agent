import { ComponentGenerator } from './component-generator';
import { ParsedComponent, GeneratorConfig } from '../types/generator';

describe('ComponentGenerator', () => {
  let generator: ComponentGenerator;
  const defaultConfig: GeneratorConfig = {
    outputDir: './output',
    framework: 'react',
    styling: 'tailwind',
    typescript: true,
    generateTests: true,
    generateStories: false,
  };

  beforeEach(() => {
    generator = new ComponentGenerator(defaultConfig);
  });

  describe('generateComponent', () => {
    it('generates a basic button component', () => {
      const component: ParsedComponent = {
        id: '1:1',
        name: 'PrimaryButton',
        type: 'button',
        props: [
          { name: 'onClick', type: '() => void', required: false },
          { name: 'children', type: 'React.ReactNode', required: true },
        ],
        styles: {
          backgroundColor: '#3366cc',
          borderRadius: '8px',
          padding: '12px 24px',
        },
        children: [],
        isInteractive: true,
      };

      const result = generator.generateComponent(component);

      expect(result).toContain("import React from 'react'");
      expect(result).toContain('interface PrimaryButtonProps');
      expect(result).toContain('onClick?: () => void');
      expect(result).toContain('children: React.ReactNode');
      expect(result).toContain('export const PrimaryButton');
      expect(result).toContain('<button');
      expect(result).toContain('type="button"');
    });

    it('generates Tailwind classes', () => {
      const component: ParsedComponent = {
        id: '1:2',
        name: 'Card',
        type: 'card',
        props: [{ name: 'children', type: 'React.ReactNode', required: true }],
        styles: {
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 16px 16px 16px',
          borderRadius: '12px',
          gap: '8px',
        },
        children: [],
        isInteractive: false,
      };

      const result = generator.generateComponent(component);

      expect(result).toContain('className="');
      expect(result).toContain('flex');
      expect(result).toContain('flex-col');
      expect(result).toContain('rounded-xl');
    });

    it('generates component with children', () => {
      const component: ParsedComponent = {
        id: '1:3',
        name: 'Container',
        type: 'container',
        props: [],
        styles: {},
        children: [
          {
            id: '1:4',
            name: 'Title',
            type: 'text',
            props: [],
            styles: { fontSize: '24px', fontWeight: '700' },
            children: [],
            text: 'Hello World',
            isInteractive: false,
          },
        ],
        isInteractive: false,
      };

      const result = generator.generateComponent(component);

      expect(result).toContain('Hello World');
    });

    it('generates input component with proper props', () => {
      const component: ParsedComponent = {
        id: '1:5',
        name: 'TextInput',
        type: 'input',
        props: [
          { name: 'value', type: 'string', required: false },
          { name: 'onChange', type: '(value: string) => void', required: false },
          { name: 'placeholder', type: 'string', required: false },
        ],
        styles: {
          borderWidth: '1px',
          borderRadius: '4px',
          padding: '8px 12px',
        },
        children: [],
        isInteractive: true,
      };

      const result = generator.generateComponent(component);

      expect(result).toContain('<input');
      expect(result).toContain('value={value}');
      expect(result).toContain('onChange=');
      expect(result).toContain('placeholder={placeholder}');
    });

    it('adds accessibility attributes for interactive elements', () => {
      const component: ParsedComponent = {
        id: '1:6',
        name: 'ClickableCard',
        type: 'card',
        props: [],
        styles: {},
        children: [],
        isInteractive: true,
      };

      const result = generator.generateComponent(component);

      expect(result).toContain('role="button"');
      expect(result).toContain('tabIndex={0}');
    });

    it('uses correct HTML tags for component types', () => {
      const testCases: Array<{ type: ParsedComponent['type']; expectedTag: string }> = [
        { type: 'button', expectedTag: '<button' },
        { type: 'input', expectedTag: '<input' },
        { type: 'link', expectedTag: '<a' },
        { type: 'navbar', expectedTag: '<nav' },
        { type: 'footer', expectedTag: '<footer' },
        { type: 'form', expectedTag: '<form' },
        { type: 'container', expectedTag: '<div' },
        { type: 'text', expectedTag: '<span' },
      ];

      testCases.forEach(({ type, expectedTag }) => {
        const component: ParsedComponent = {
          id: '1:0',
          name: 'Test',
          type,
          props: [],
          styles: {},
          children: [],
          isInteractive: false,
        };

        const result = generator.generateComponent(component);
        expect(result).toContain(expectedTag);
      });
    });
  });

  describe('CSS Modules styling', () => {
    it('uses CSS Modules class references', () => {
      const cssModuleGenerator = new ComponentGenerator({
        ...defaultConfig,
        styling: 'css-modules',
      });

      const component: ParsedComponent = {
        id: '1:7',
        name: 'StyledBox',
        type: 'container',
        props: [],
        styles: { backgroundColor: '#fff' },
        children: [],
        isInteractive: false,
      };

      const result = cssModuleGenerator.generateComponent(component);

      expect(result).toContain("import styles from './StyledBox.module.css'");
      expect(result).toContain('className={styles.');
    });
  });
});
