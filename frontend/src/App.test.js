import { render, screen } from '@testing-library/react';
import App from './App';

test('make sure get started button is present', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Get Started/i);
  expect(buttonElement).toBeInTheDocument();
});
