import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing page hero heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/elevate your/i);
  expect(headingElement).toBeInTheDocument();
});
