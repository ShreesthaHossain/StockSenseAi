/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toHaveTextContent(text: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(className: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string): R;
      toHavePlaceholderText(text: string): R;
      toHaveAltText(text: string): R;
      toHaveTitle(text: string): R;
      toHaveRole(role: string, options?: { level?: number }): R;
      toHaveAccessibleName(name: string): R;
      toHaveAccessibleErrorMessage(message: string): R;
      toBeEmpty(): R;
      toBeHidden(): R;
      toBeVisible(): R;
      toHaveFocus(): R;
      toHaveTextContent(text: string | RegExp): R;
      toContainElement(child: HTMLElement): R;
      toHaveStyle(style: Record<string, string>): R;
      toBeInDocument(): R;
    }
  }
}

export {};