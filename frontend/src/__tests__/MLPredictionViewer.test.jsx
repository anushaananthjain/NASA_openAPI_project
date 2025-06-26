import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MLPredictionViewer from '../components/MLPredictionViewer';

describe('MLPredictionViewer Component', () => {
  const mockOnNavigate = jest.fn();

  test('renders loading state correctly', () => {
    render(<MLPredictionViewer loading={true} error={null} predictionData={null} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Fetching ML prediction...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); 
  });

  test('renders error state correctly and "Back to Home" button', () => {
    const errorMessage = 'ML backend is not running.';
    render(<MLPredictionViewer loading={false} error={errorMessage} predictionData={null} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Please ensure your Python ML backend is running and accessible.')).toBeInTheDocument();
    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    expect(backButton).toBeInTheDocument();
    userEvent.click(backButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('home');
  });

  test('renders prediction data correctly when available', () => {
    const mockPredictionData = {
      prediction: 345.678,
      prediction_formatted_offset: "00:05:45",
      predicted_peak_time: "14:30:00",
      timestamp: Date.now(), 
    };
    render(<MLPredictionViewer loading={false} error={null} predictionData={mockPredictionData} onNavigate={mockOnNavigate} />);

    expect(screen.getByText('Solar Flare Peak Time Prediction')).toBeInTheDocument();
    expect(screen.getByText(/Prediction Details:/i)).toBeInTheDocument();
    expect(screen.getByText(`Predicted Offset (seconds): ${mockPredictionData.prediction.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`Predicted Offset (HH:MM:SS): ${mockPredictionData.prediction_formatted_offset}`)).toBeInTheDocument();
    expect(screen.getByText(`Predicted Absolute Peak Time: ${mockPredictionData.predicted_peak_time}`)).toBeInTheDocument();
    expect(screen.getByText(`Timestamp: ${new Date(mockPredictionData.timestamp).toLocaleString()}`)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Model Graphs/i })).toBeInTheDocument();
  });

  test('renders "No prediction data available" message when data is null', () => {
    render(<MLPredictionViewer loading={false} error={null} predictionData={null} onNavigate={mockOnNavigate} />);
    expect(screen.getByText(/No prediction data available/i)).toBeInTheDocument();
  });

  test('calls onNavigate to home and ml-graphs when respective buttons are clicked', () => {
    const mockPredictionData = {
      prediction: 123.45, prediction_formatted_offset: "00:02:03", predicted_peak_time: "10:00:00", timestamp: Date.now()
    };
    render(<MLPredictionViewer loading={false} error={null} predictionData={mockPredictionData} onNavigate={mockOnNavigate} />);

    const backToHomeButton = screen.getByRole('button', { name: /Back to Home/i });
    const viewModelGraphsButton = screen.getByRole('button', { name: /View Model Graphs/i });

    userEvent.click(backToHomeButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('home');

    userEvent.click(viewModelGraphsButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('ml-graphs');
  });
});