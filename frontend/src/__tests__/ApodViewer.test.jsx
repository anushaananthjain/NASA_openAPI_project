import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApodViewer from '../components/ApodViewer';

describe('ApodViewer Component', () => {
  const mockOnNavigate = jest.fn();

  test('renders loading state correctly', () => {
    render(<ApodViewer loading={true} error={null} apodData={null} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Loading cosmic data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); 
  });

  test('renders error state correctly and "Back to Home" button', () => {
    const errorMessage = 'Failed to fetch data';
    render(<ApodViewer loading={false} error={errorMessage} apodData={null} onNavigate={mockOnNavigate} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Please try selecting a different date or check your network connection!!!!!')).toBeInTheDocument();
    const backButton = screen.getByRole('button', { name: /Back to Home/i });
    expect(backButton).toBeInTheDocument();
    userEvent.click(backButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('home');
  });

  test('renders image APOD data correctly', () => {
    const mockApodData = {
      title: 'Galaxy M101',
      date: '2023-04-20',
      url: 'https://example.com/galaxy.jpg',
      explanation: 'A beautiful spiral galaxy.',
      media_type: 'image',
      copyright: 'NASA',
    };
    render(<ApodViewer loading={false} error={null} apodData={mockApodData} onNavigate={mockOnNavigate} />);

    expect(screen.getByText(mockApodData.title)).toBeInTheDocument();
    expect(screen.getByText(`Date: ${mockApodData.date}`)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: mockApodData.title })).toBeInTheDocument();
    expect(screen.getByText(mockApodData.explanation)).toBeInTheDocument();
    expect(screen.getByText(`© ${mockApodData.copyright}`)).toBeInTheDocument();
  });

  test('renders video APOD data correctly', () => {
    const mockApodData = {
      title: 'Solar Flare',
      date: '2023-04-21',
      url: 'https://www.youtube.com/embed/solarflare',
      explanation: 'A powerful solar flare.',
      media_type: 'video',
    };
    render(<ApodViewer loading={false} error={null} apodData={mockApodData} onNavigate={mockOnNavigate} />);

    expect(screen.getByText(mockApodData.title)).toBeInTheDocument();
    expect(screen.getByTitle('APOD video')).toBeInTheDocument();
    expect(screen.getByTitle('APOD video')).toHaveAttribute('src', mockApodData.url);
  });

  test('renders without copyright if not provided', () => {
    const mockApodData = {
      title: 'No Copyright',
      date: '2023-04-22',
      url: 'https://example.com/no-copyright.jpg',
      explanation: 'Image without copyright.',
      media_type: 'image',
    };
    render(<ApodViewer loading={false} error={null} apodData={mockApodData} onNavigate={mockOnNavigate} />);
    expect(screen.queryByText(/©/)).not.toBeInTheDocument();
  });
});