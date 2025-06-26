import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import NEOViewer from '../components/NEOViewer';

// Mock Chart.js components to prevent rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Bar: () => null,
  Scatter: () => null,
}));

// Mock axios to control API responses
jest.mock('axios');

describe('NEOViewer Component', () => {
  const mockOnNavigate = jest.fn();

  // Mock Date.prototype.toISOString to control the default dates
  const MOCK_DATE = '2023-01-01T12:00:00.000Z';
  const realDateToISOString = Date.prototype.toISOString;

  beforeAll(() => {
    Date.prototype.toISOString = jest.fn(() => MOCK_DATE);
  });

  afterAll(() => {
    Date.prototype.toISOString = realDateToISOString;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNeoData = {
  element_count: 5, 
    "2023-01-01": [
      { id: '1', name: 'Asteroid One', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 100 } }, close_approach_data: [{ miss_distance: { kilometers: '100000' } }] },
      { id: '2', name: 'Asteroid Two', is_potentially_hazardous_asteroid: false, estimated_diameter: { meters: { estimated_diameter_max: 50 } }, close_approach_data: [{ miss_distance: { kilometers: '200000' } }] },
      { id: '3', name: 'Asteroid Three', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 150 } }, close_approach_data: [{ miss_distance: { kilometers: '50000' } }] },
    ],
    "2023-01-02": [
      { id: '4', name: 'Asteroid Four', is_potentially_hazardous_asteroid: false, estimated_diameter: { meters: { estimated_diameter_max: 75 } }, close_approach_data: [{ miss_distance: { kilometers: '300000' } }] },
      { id: '5', name: 'Asteroid Five', is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 120 } }, close_approach_data: [{ miss_distance: { kilometers: '80000' } }] },
    ],
  }
});
  test('renders loading state initially', () => {
    axios.get.mockR
    axios.get.mockImplementationOnce(() => new Promise(() => {})); 
    render(<NEOViewer onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Loading Near Earth Objects...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders error state correctly and "Back to Home" button', async () => {
    const errorMessage = 'Failed to fetch NEO data';
    axios.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

    render(<NEOViewer onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Please check your network connection or try again later.')).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    expect(backButton).toBeInTheDocument();
    userEvent.click(backButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('home');
  });

  test('fetches and displays NEO data with initial dates', async () => {
    axios.get.mockResolvedValueOnce({ data: mockNeoData });

    render(<NEOViewer onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Total Objects: 5')).toBeInTheDocument(); // This will now pass
    });

    expect(screen.getByText('Near Earth Objects (2023-01-01 to 2023-01-01)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2023-01-01')).toBeInTheDocument();
  });

  test('allows changing dates and refetches data', async () => {
    const firstCallData = {
      element_count: 1,
      near_earth_objects: {
        "2023-01-01": [
          {
            id: '100',
            name: 'Single Asteroid',
            is_potentially_hazardous_asteroid: true,
            estimated_diameter: { meters: { estimated_diameter_max: 200 } },
            close_approach_data: [{ miss_distance: { kilometers: '5000' } }],
          },
        ],
      },
    };

    const secondCallData = {
      element_count: 2,
      near_earth_objects: {
        "2023-01-05": [
          {
            id: '200',
            name: 'New Asteroid One',
            is_potentially_hazardous_asteroid: false,
            estimated_diameter: { meters: { estimated_diameter_max: 300 } },
            close_approach_data: [{ miss_distance: { kilometers: '15000' } }],
          },
          {
            id: '201',
            name: 'New Asteroid Two',
            is_potentially_hazardous_asteroid: true,
            estimated_diameter: { meters: { estimated_diameter_max: 400 } },
            close_approach_data: [{ miss_distance: { kilometers: '25000' } }],
          },
        ],
      },
    };

    axios.get.mockResolvedValueOnce({ data: firstCallData });
    axios.get.mockResolvedValueOnce({ data: secondCallData });

    render(<NEOViewer onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Total Objects: 1')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText(/Start Date:/i);
    const endDateInput = screen.getByLabelText(/End Date:/i);

    userEvent.clear(startDateInput);
    userEvent.type(startDateInput, '2023-01-05');
    userEvent.clear(endDateInput);
    userEvent.type(endDateInput, '2023-01-05');

    await waitFor(() => {
      expect(screen.getByText('Total Objects: 2')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/neows?start_date=2023-01-01&end_date=2023-01-01');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/neows?start_date=2023-01-05&end_date=2023-01-05');
  });

  test('renders "No Near Earth Objects found" when data is empty', async () => {
    axios.get.mockResolvedValueOnce({ data: { element_count: 0, near_earth_objects: {} } });

    render(<NEOViewer onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('No Near Earth Objects found for the selected period.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
  });
