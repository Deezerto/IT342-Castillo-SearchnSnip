import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => children,
  GoogleLogin: () => <div data-testid="google-login" />
}));

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, 'Test', '/');
});

test('renders landing page hero heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/elevate your/i);
  expect(headingElement).toBeInTheDocument();
});

test('redirects unauthenticated access to login', async () => {
  window.history.pushState({}, 'Protected', '/dashboard');

  render(<App />);

  expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
});
