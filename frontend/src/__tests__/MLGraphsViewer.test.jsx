import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MLGraphsViewer from '../components/MLGraphsViewer';

describe('MLGraphsViewer Component', () => {
  const mockOnNavigate = jest.fn();

  test('renders title, intro, and all graph cards', () => {
    render(<MLGraphsViewer onNavigate={mockOnNavigate} />);

    expect(screen.getByText('Solar Flare Prediction Model Performance')).toBeInTheDocument();
    expect(screen.getByText(/These visualizations provide insights/i)).toBeInTheDocument();

    
    expect(screen.getByText('Model Training History')).toBeInTheDocument();
    expect(screen.getByAltText('Model Training History Plot')).toBeInTheDocument();

    expect(screen.getByText('Actual vs. Predicted Values')).toBeInTheDocument();
    expect(screen.getByAltText('Actual vs. Predicted Peak Offsets Plot')).toBeInTheDocument();

    expect(screen.getByText('Residuals Analysis')).toBeInTheDocument();
    expect(screen.getByAltText('Residuals Plot')).toBeInTheDocument();


    expect(screen.getByRole('button', { name: /Back to ML Prediction/i })).toBeInTheDocument();
  });

  test('calls onNavigate with "ml-prediction" when back button is clicked', () => {
    render(<MLGraphsViewer onNavigate={mockOnNavigate} />);
    userEvent.click(screen.getByRole('button', { name: /Back to ML Prediction/i }));
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    expect(mockOnNavigate).toHaveBeenCalledWith('ml-prediction');
  });

  test('image onError fallback works', () => {
    render(<MLGraphsViewer onNavigate={mockOnNavigate} />);
    const graphImage = screen.getByAltText('Model Training History Plot');
    

    fireEvent.error(graphImage);

    expect(graphImage).toHaveAttribute('src', expect.stringContaining('placehold.co'));
    expect(graphImage).toHaveAttribute('alt', 'Graph not available');
  });
});