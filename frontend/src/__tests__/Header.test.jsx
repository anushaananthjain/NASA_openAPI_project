import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';

describe('Header Component', () => {
  test('renders the main title and subtitle', () => {
    render(<Header />);

    expect(screen.getByText('NASA APOD Explorer')).toBeInTheDocument();
    expect(screen.getByText('Discover the universe, one picture at a time.')).toBeInTheDocument();
  });
});