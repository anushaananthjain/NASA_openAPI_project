import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePicker from '../components/DatePicker';

describe('DatePicker Component', () => {
  test('renders with the correct label and input type', () => {
    const mockDate = '2023-01-15';
    const mockHandleChange = jest.fn();

    render(<DatePicker selectedDate={mockDate} handleDateChange={mockHandleChange} />);

    expect(screen.getByLabelText(/Select Date:/i)).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/Select Date:/i);
    expect(dateInput).toHaveAttribute('type', 'date');
    expect(dateInput).toHaveValue(mockDate);
  });

  test('calls handleDateChange on input change', () => {
    const mockDate = '2023-01-15';
    const mockHandleChange = jest.fn();

    render(<DatePicker selectedDate={mockDate} handleDateChange={mockHandleChange} />);

    const dateInput = screen.getByLabelText(/Select Date:/i);
    const newDate = '2023-02-01';

    userEvent.clear(dateInput); 
    userEvent.type(dateInput, newDate); 


    expect(mockHandleChange).toHaveBeenCalledTimes(newDate.length);
    expect(dateInput).toHaveValue(newDate); 
  });

  test('max attribute is set to current date', () => {
    const today = new Date().toISOString().split('T')[0];
    const mockHandleChange = jest.fn();

    render(<DatePicker selectedDate={today} handleDateChange={mockHandleChange} />);

    const dateInput = screen.getByLabelText(/Select Date:/i);
    expect(dateInput).toHaveAttribute('max', today);
  });
});