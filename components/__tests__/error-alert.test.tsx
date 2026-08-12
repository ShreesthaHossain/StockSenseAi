import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from '../error-alert';

describe('ErrorAlert', () => {
  it('should render error message', () => {
    render(<ErrorAlert error="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorAlert error="Test error" onRetry={onRetry} />);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorAlert error="Test error" />);
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorAlert error="Test error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show user-friendly message for known errors', () => {
    render(<ErrorAlert error="Missing ticker" />);
    expect(screen.getByText('Please enter a valid stock ticker symbol.')).toBeInTheDocument();
  });

  it('should show user-friendly message for invalid ticker format', () => {
    render(<ErrorAlert error="Invalid ticker format. Use 1-5 uppercase letters (e.g., AAPL, GOOGL)" />);
    expect(screen.getByText('Invalid ticker format. Use 1-5 uppercase letters (e.g., AAPL, GOOGL).')).toBeInTheDocument();
  });

  it('should show user-friendly message for not enough data', () => {
    render(<ErrorAlert error="Not enough data (25 days available). Need at least 30 days." />);
    expect(screen.getByText("We don't have enough historical data for this stock. Try a different ticker.")).toBeInTheDocument();
  });
});