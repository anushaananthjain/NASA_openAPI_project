import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

describe('Footer Component', () => {
  test('renders copyright and attribution text', () => {
    render(<Footer />);

    expect(screen.getByText('Powered by NASA Open APIs')).toBeInTheDocument();
    expect(screen.getByText('Developed for the Bounce Insights Coding Challenge')).toBeInTheDocument();
  });
});