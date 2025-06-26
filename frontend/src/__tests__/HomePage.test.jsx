// src/__tests__/HomePage.test.jsx (updated sections)

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../components/HomePage'; // Assuming the path is correct

describe('HomePage Component', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear(); // Clear mock calls before each test
  });

  test('renders welcome message and navigation buttons', () => {
    render(<HomePage onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Welcome to NASA Explorer!')).toBeInTheDocument();
    expect(screen.getByText('Choose an API to explore:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /APOD/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /NEOWS/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solar Flare ML Prediction/i })).toBeInTheDocument();
  });

  test('calls onNavigate with "apod" when APOD button is clicked', async () => { // Marked as async
    render(<HomePage onNavigate={mockOnNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /APOD/i })); // Await the click
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    expect(mockOnNavigate).toHaveBeenCalledWith('apod');
  });

  test('calls onNavigate with "neows" when NEOWS button is clicked', async () => { // Marked as async
    render(<HomePage onNavigate={mockOnNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /NEOWS/i })); // Await the click
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    expect(mockOnNavigate).toHaveBeenCalledWith('neows');
  });

  test('calls onNavigate with "ml-prediction" when ML Prediction button is clicked', async () => { // Marked as async
    render(<HomePage onNavigate={mockOnNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /Solar Flare ML Prediction/i })); // Await the click
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
    expect(mockOnNavigate).toHaveBeenCalledWith('ml-prediction');
  });
});