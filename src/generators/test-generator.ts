/**
 * Test Generator
 * Generates Jest + React Testing Library tests for components
 */

import { ParsedComponent, ComponentProp } from '../types/generator';

export class TestGenerator {
  /**
   * Generate test file for a component
   */
  generateTests(component: ParsedComponent): string {
    const componentName = this.ensureValidComponentName(component.name);
    const imports = this.generateImports(componentName);
    const testCases = this.generateTestCases(component, componentName);

    return `${imports}

describe('${componentName}', () => {
${testCases}
});
`;
  }

  /**
   * Generate import statements
   */
  private generateImports(componentName: string): string {
    return `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from './${componentName}';`;
  }

  /**
   * Generate test cases based on component type
   */
  private generateTestCases(component: ParsedComponent, componentName: string): string {
    const tests: string[] = [];

    // Basic render test
    tests.push(this.generateRenderTest(component, componentName));

    // Props tests
    tests.push(...this.generatePropsTests(component, componentName));

    // Interaction tests based on component type
    tests.push(...this.generateInteractionTests(component, componentName));

    // Accessibility tests
    tests.push(this.generateAccessibilityTest(component, componentName));

    // Snapshot test
    tests.push(this.generateSnapshotTest(component, componentName));

    return tests.join('\n\n');
  }

  /**
   * Generate basic render test
   */
  private generateRenderTest(component: ParsedComponent, componentName: string): string {
    const defaultProps = this.getDefaultPropsForTest(component.props);

    return `  it('renders without crashing', () => {
    render(<${componentName}${defaultProps} />);
  });`;
  }

  /**
   * Generate props-based tests
   */
  private generatePropsTests(component: ParsedComponent, componentName: string): string[] {
    const tests: string[] = [];

    for (const prop of component.props) {
      if (prop.name === 'children') {
        tests.push(`  it('renders children correctly', () => {
    render(
      <${componentName}${this.getRequiredPropsExcept(component.props, 'children')}>
        <span data-testid="child">Test Child</span>
      </${componentName}>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });`);
      } else if (prop.name === 'disabled') {
        tests.push(`  it('handles disabled state', () => {
    render(<${componentName}${this.getDefaultPropsForTest(component.props)} disabled />);
    const element = screen.getByRole('button');
    expect(element).toBeDisabled();
  });`);
      } else if (prop.name === 'className') {
        tests.push(`  it('applies custom className', () => {
    const { container } = render(
      <${componentName}${this.getDefaultPropsForTest(component.props)} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });`);
      } else if (prop.name === 'variant' && prop.type.includes('|')) {
        const variants = prop.type.match(/'([^']+)'/g)?.map((v) => v.replace(/'/g, '')) || [];
        for (const variant of variants.slice(0, 3)) {
          tests.push(`  it('renders ${variant} variant correctly', () => {
    render(<${componentName}${this.getDefaultPropsForTest(component.props)} variant="${variant}" />);
    // Verify variant-specific styling/behavior
  });`);
        }
      }
    }

    return tests;
  }

  /**
   * Generate interaction tests
   */
  private generateInteractionTests(component: ParsedComponent, componentName: string): string[] {
    const tests: string[] = [];
    const defaultProps = this.getDefaultPropsForTest(component.props);

    switch (component.type) {
      case 'button':
        tests.push(`  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<${componentName}${defaultProps} onClick={handleClick}>Click me</${componentName}>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = jest.fn();
    render(<${componentName}${defaultProps} onClick={handleClick} disabled>Click me</${componentName}>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });`);
        break;

      case 'input':
        tests.push(`  it('calls onChange when value changes', async () => {
    const handleChange = jest.fn();
    render(<${componentName} onChange={handleChange} placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    await userEvent.type(input, 'Hello');

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays the provided value', () => {
    render(<${componentName} value="Test value" onChange={jest.fn()} />);

    const input = screen.getByDisplayValue('Test value');
    expect(input).toBeInTheDocument();
  });

  it('shows error state when error prop is provided', () => {
    render(<${componentName} error="This field is required" onChange={jest.fn()} />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });`);
        break;

      case 'modal':
        tests.push(`  it('renders when isOpen is true', () => {
    render(
      <${componentName} isOpen={true} onClose={jest.fn()} title="Test Modal">
        Modal content
      </${componentName}>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <${componentName} isOpen={false} onClose={jest.fn()} title="Test Modal">
        Modal content
      </${componentName}>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = jest.fn();
    render(
      <${componentName} isOpen={true} onClose={handleClose} title="Test Modal">
        Modal content
      </${componentName}>
    );

    await userEvent.click(screen.getByLabelText(/close/i));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });`);
        break;

      case 'link':
        tests.push(`  it('renders with correct href', () => {
    render(<${componentName} href="https://example.com">Link text</${componentName}>);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('opens in new tab when target is _blank', () => {
    render(<${componentName} href="https://example.com" target="_blank">Link text</${componentName}>);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });`);
        break;

      case 'form':
        tests.push(`  it('calls onSubmit when form is submitted', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    render(
      <${componentName} onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </${componentName}>
    );

    await userEvent.click(screen.getByRole('button'));
    expect(handleSubmit).toHaveBeenCalled();
  });`);
        break;

      default:
        if (component.isInteractive) {
          tests.push(`  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<${componentName}${defaultProps} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });`);
        }
    }

    return tests;
  }

  /**
   * Generate accessibility test
   */
  private generateAccessibilityTest(component: ParsedComponent, componentName: string): string {
    const defaultProps = this.getDefaultPropsForTest(component.props);

    return `  it('is accessible', async () => {
    const { container } = render(<${componentName}${defaultProps}${component.type === 'button' || component.type === 'text' ? '>Test content</' + componentName + '>' : ' />'}

    // Basic accessibility checks
    // For more comprehensive testing, consider using jest-axe
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      expect(element).toBeVisible();
    });
  });

  it('supports keyboard navigation', async () => {
    render(<${componentName}${defaultProps}${component.type === 'button' || component.type === 'text' ? '>Test content</' + componentName + '>' : ' />'}

    // Tab to the component
    await userEvent.tab();

    // Verify focus is received (for interactive elements)
    ${component.isInteractive ? "expect(document.activeElement?.tagName).not.toBe('BODY');" : '// Non-interactive component - verify structure'}
  });`;
  }

  /**
   * Generate snapshot test
   */
  private generateSnapshotTest(component: ParsedComponent, componentName: string): string {
    const defaultProps = this.getDefaultPropsForTest(component.props);

    return `  it('matches snapshot', () => {
    const { container } = render(<${componentName}${defaultProps}${component.type === 'button' || component.type === 'text' ? '>Test content</' + componentName + '>' : ' />'}
    expect(container.firstChild).toMatchSnapshot();
  });`;
  }

  /**
   * Get default props string for tests
   */
  private getDefaultPropsForTest(props: ComponentProp[]): string {
    const requiredProps = props.filter((p) => p.required && p.name !== 'children');
    if (requiredProps.length === 0) return '';

    const propsStr = requiredProps
      .map((p) => {
        const value = this.getTestValueForProp(p);
        return ` ${p.name}={${value}}`;
      })
      .join('');

    return propsStr;
  }

  /**
   * Get required props except a specific one
   */
  private getRequiredPropsExcept(props: ComponentProp[], except: string): string {
    const requiredProps = props.filter((p) => p.required && p.name !== except);
    if (requiredProps.length === 0) return '';

    const propsStr = requiredProps
      .map((p) => {
        const value = this.getTestValueForProp(p);
        return ` ${p.name}={${value}}`;
      })
      .join('');

    return propsStr;
  }

  /**
   * Get test value for a prop based on its type
   */
  private getTestValueForProp(prop: ComponentProp): string {
    const typeLower = prop.type.toLowerCase();

    if (typeLower.includes('string')) return '"test"';
    if (typeLower.includes('number')) return '42';
    if (typeLower.includes('boolean')) return 'true';
    if (typeLower.includes('() =>') || typeLower.includes('function')) return 'jest.fn()';
    if (typeLower.includes('react.reactnode')) return '"test content"';
    if (prop.type.includes('|')) {
      const firstOption = prop.type.match(/'([^']+)'/);
      if (firstOption) return `"${firstOption[1]}"`;
    }

    return '{}';
  }

  /**
   * Ensure valid component name
   */
  private ensureValidComponentName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
}
