import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SDOMLViewer from '../components/SDOMLViewer';
import { mockAxios } from '../setupTests'; 
import userEvent from '@testing-library/user-event';

describe('SDOMLViewer Component', () => {
  const mockOnNavigate = jest.fn();
  const BACKEND_URL = 'http://localhost:5000';

  beforeEach(() => {
    mockAxios.reset(); 
    mockOnNavigate.mockClear(); 
  });

  test('renders initial state and fetches general prediction and AR evolution on mount', async () => {
    const mockGeneralPrediction = { prediction: 'High', probability: 0.85, timestamp: Date.now() };
    const mockArEvolution = { active_region_id: 'AR123', predicted_evolution: 'Growth', timestamp: Date.now() };

    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict`).reply(200, mockGeneralPrediction);
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict_ar_evolution`).reply(200, mockArEvolution);

    render(<SDOMLViewer onNavigate={mockOnNavigate} />);

   
    expect(screen.getByText('SDO Machine Learning for Space Weather Forecasting')).toBeInTheDocument();
 
    expect(screen.getByRole('button', { name: /Predict General Flare/i })).toBeInTheDocument();
    expect(screen.getByText('Classify Active Region Evolution')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(`Status: ${mockGeneralPrediction.prediction}`)).toBeInTheDocument();
    });
    expect(screen.getByText(`Probability: ${mockGeneralPrediction.probability * 100}%`)).toBeInTheDocument();

   
    await waitFor(() => {
      expect(screen.getByText(`Predicted Evolution: ${mockArEvolution.predicted_evolution}`)).toBeInTheDocument();
    });
  });

  test('displays error for general ML prediction fetch failure', async () => {
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict`).reply(500, { error: 'General ML Error' });
   
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict_ar_evolution`).reply(200, { predicted_evolution: 'Stable' });

    render(<SDOMLViewer onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Error: General ML Error')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Status:')).not.toBeInTheDocument();
  });

  test('displays error for AR evolution classification fetch failure', async () => {

    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict`).reply(200, { prediction: 'Low' });
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict_ar_evolution`).reply(500, { error: 'AR Error' });

    render(<SDOMLViewer onNavigate={mockOnNavigate} />);

    
    await waitFor(() => {
      expect(screen.getByText('Error: AR Error')).toBeInTheDocument();
    });
  
    expect(screen.queryByText('Predicted Evolution:')).not.toBeInTheDocument();
  });

  test('clicking "Back to Home" navigates correctly', async () => {
    
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict`).reply(200, {});
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict_ar_evolution`).reply(200, {});

    render(<SDOMLViewer onNavigate={mockOnNavigate} />);
    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    await userEvent.click(backButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('home');
  });

  test('input changes trigger state updates for AR evolution features', async () => {
 
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict`).reply(200, { prediction: 'Neutral' });
    mockAxios.onGet(`${BACKEND_URL}/api/ml_predict_ar_evolution`).reply(200, { predicted_evolution: 'Initial' });

    render(<SDOMLViewer onNavigate={mockOnNavigate} />);

    const magneticFluxInput = screen.getByLabelText(/Magnetic Flux Change:/i);
    const areaChangeInput = screen.getByLabelText(/Area Change:/i);
    const gradientValueInput = screen.getByLabelText(/Gradient Value:/i);

 
    expect(magneticFluxInput).toHaveValue(0.6);
    expect(areaChangeInput).toHaveValue(100);
    expect(gradientValueInput).toHaveValue(0.7);

  
    await userEvent.clear(magneticFluxInput); 
    expect(magneticFluxInput).toHaveValue(null); 
    await userEvent.type(magneticFluxInput, '1.23');
    expect(magneticFluxInput).toHaveValue(1.23);

    await userEvent.clear(areaChangeInput); 
    expect(areaChangeInput).toHaveValue(null); 
    await userEvent.type(areaChangeInput, '250');
    expect(areaChangeInput).toHaveValue(250);

    
    await userEvent.clear(gradientValueInput); 
    expect(gradientValueInput).toHaveValue(null); 
    await userEvent.type(gradientValueInput, '0.9');
    expect(gradientValueInput).toHaveValue(0.9);
  });
});