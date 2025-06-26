import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; 
import App from '../App';
import { mockAxios } from '../setupTests'; 


jest.mock('../components/Header', () => () => <div data-testid="header">Mock Header</div>);
jest.mock('../components/DatePicker', () => ({ selectedDate, handleDateChange }) => (
  <div data-testid="date-picker">
    Mock DatePicker
    <input type="date" value={selectedDate} onChange={handleDateChange} data-testid="date-input" />
  </div>
));
jest.mock('../components/ApodViewer', () => ({ loading, error, apodData, onNavigate }) => (
  <div data-testid="apod-viewer">Mock ApodViewer - {loading ? 'Loading' : error ? 'Error' : 'Data'}</div>
));
jest.mock('../components/Footer', () => () => <div data-testid="footer">Mock Footer</div>);
jest.mock('../components/HomePage', () => ({ onNavigate }) => (
  <div data-testid="home-page">
    Mock Home Page
    <button onClick={() => onNavigate('apod')} data-testid="nav-apod-button">Go APOD</button>
    <button onClick={() => onNavigate('neows')} data-testid="nav-neows-button">Go NEOWS</button>
    <button onClick={() => onNavigate('ml-prediction')} data-testid="nav-ml-prediction-button">Go ML</button>
  </div>
));
jest.mock('../components/NEOViewer', () => ({ onNavigate }) => (
  <div data-testid="neo-viewer">Mock NEOViewer</div>
));
jest.mock('../components/MLPredictionViewer', () => ({ loading, error, predictionData, onNavigate }) => (
  <div data-testid="ml-prediction-viewer">Mock MLPredictionViewer - {loading ? 'Loading' : error ? 'Error' : 'Data'}</div>
));
jest.mock('../components/MLGraphsViewer', () => ({ onNavigate }) => (
  <div data-testid="ml-graphs-viewer">Mock MLGraphsViewer</div>
));

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test to ensure test isolation
    mockAxios.reset();
  });

  test('renders HomePage by default', () => {
    render(<App />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('apod-viewer')).not.toBeInTheDocument(); // Ensure other pages are not rendered
  });

  test('navigates to APOD page when APOD button is clicked', async () => {
    render(<App />);
    userEvent.click(screen.getByTestId('nav-apod-button'));

    // Wait for the APOD page content to appear
    await waitFor(() => {
      expect(screen.getByTestId('apod-viewer')).toBeInTheDocument();
    });
    expect(screen.getByTestId('header')).toBeInTheDocument(); // Header should be visible on APOD page
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  test('fetches APOD data on APOD page load', async () => {
    const mockApodData = {
      title: 'Mock APOD',
      date: '2023-01-01',
      url: 'http://mock.url/image.jpg',
      explanation: 'Mock explanation',
      media_type: 'image',
    };

    // Mock successful APOD API call
    mockAxios.onGet('http://localhost:5000/api/apod', { params: { date: new Date().toISOString().split('T')[0] } }).reply(200, mockApodData);

    render(<App />);
    userEvent.click(screen.getByTestId('nav-apod-button'));

    await waitFor(() => {
      expect(screen.getByTestId('apod-viewer')).toHaveTextContent('Mock ApodViewer - Data');
    });
  });

  test('displays APOD error message when API fetch fails', async () => {
    mockAxios.onGet('http://localhost:5000/api/apod').reply(500, { message: 'Failed to fetch' });

    render(<App />);
    userEvent.click(screen.getByTestId('nav-apod-button'));

    await waitFor(() => {
      expect(screen.getByTestId('apod-viewer')).toHaveTextContent('Mock ApodViewer - Error');
    });
  });

  test('navigates to ML Prediction page when button is clicked', async () => {
    render(<App />);
    userEvent.click(screen.getByTestId('nav-ml-prediction-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ml-prediction-viewer')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('header')).not.toBeInTheDocument(); // Header should NOT be visible here
  });

  test('fetches ML Prediction data on ML Prediction page load', async () => {
    const mockMLPredictionData = {
      prediction: 123.45,
      prediction_formatted_offset: "00:02:03",
      predicted_peak_time: "10:00:00",
      timestamp: Date.now()
    };

    mockAxios.onPost('http://localhost:5000/api/ml_predict').reply(200, mockMLPredictionData);

    render(<App />);
    userEvent.click(screen.getByTestId('nav-ml-prediction-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ml-prediction-viewer')).toHaveTextContent('Mock MLPredictionViewer - Data');
    });
  });

  test('displays ML Prediction error message when API fetch fails', async () => {
    mockAxios.onPost('http://localhost:5000/api/ml_predict').reply(500, { error: 'ML Error' });

    render(<App />);
    userEvent.click(screen.getByTestId('nav-ml-prediction-button'));

    await waitFor(() => {
      expect(screen.getByTestId('ml-prediction-viewer')).toHaveTextContent('Mock MLPredictionViewer - Error');
    });
  });
});