import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SignInView } from './sign-in-view';
import { SignUpView } from './sign-up-view';

// Mock Clerk components
vi.mock('@clerk/nextjs', () => ({
  SignIn: vi.fn(({ routing }) => <div data-testid="clerk-signin" data-routing={routing}>SignIn Component</div>),
  SignUp: vi.fn(({ routing }) => <div data-testid="clerk-signup" data-routing={routing}>SignUp Component</div>),
}));

describe('Authentication Views', () => {
  describe('SignInView', () => {
    it('should render the SignIn component with hash routing', () => {
      render(<SignInView />);
      const signInElement = screen.getByTestId('clerk-signin');
      expect(signInElement).toBeInTheDocument();
      expect(signInElement).toHaveAttribute('data-routing', 'hash');
    });
  });

  describe('SignUpView', () => {
    it('should render the SignUp component with hash routing', () => {
      render(<SignUpView />);
      const signUpElement = screen.getByTestId('clerk-signup');
      expect(signUpElement).toBeInTheDocument();
      expect(signUpElement).toHaveAttribute('data-routing', 'hash');
    });
  });
});
