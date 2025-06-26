// App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import DatePicker from './components/DatePicker';
import ApodViewer from './components/ApodViewer';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import NEOViewer from './components/NEOViewer';
import MLPredictionViewer from './components/MLPredictionViewer';
import MLGraphsViewer from './components/MLGraphsViewer';
import './App.css';

function App() {
  const [apodData, setApodData] = useState(null);
  const [apodLoading, setApodLoading] = useState(true);
  const [apodError, setApodError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState('home');


  const [mlPredictionData, setMlPredictionData] = useState(null);
  const [mlPredictionLoading, setMlPredictionLoading] = useState(false);
  const [mlPredictionError, setMlPredictionError] = useState(null);

  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    // Only fetch APOD data if the current page is 'apod'
    if (currentPage === 'apod') {
      const fetchApodData = async () => {
        setApodLoading(true);
        setApodError(null); // Clear previous errors

        try {
          const response = await axios.get(`${BACKEND_URL}/api/apod?date=${selectedDate}`);
          setApodData(response.data);
        } catch (err) {
          console.error('Failed to fetch APOD data:', err);
          setApodError(
            err.response?.data?.error || 'An error occurred while fetching APOD data. Please try again.'
          );
          setApodData(null); // Clear data on error
        } finally {
          setApodLoading(false);
        }
      };
      fetchApodData();
    } else {
      // If not on APOD page, reset APOD state to avoid stale data/errors
      setApodData(null);
      setApodLoading(false);
      setApodError(null);
    }

    // Only fetch ML Prediction data if the current page is 'ml-prediction'
    // Note: The ML prediction API call has a POST method and specific body data.
    // Ensure these parameters are appropriate for your backend.
    if (currentPage === 'ml-prediction') {
      const fetchMLPrediction = async () => {
        setMlPredictionLoading(true);
        setMlPredictionError(null); // Clear previous errors
        try {
          const response = await axios.post(`${BACKEND_URL}/api/ml_predict`, {
            total_counts: 50000,
            x_pos_asec: 100,
            y_pos_asec: -200,
            start_hour: 21,
            start_minute: 29,
            start_second: 56,
            end_hour: 21,
            end_minute: 41,
            end_second: 48
          });
          setMlPredictionData(response.data);
        } catch (err) {
          console.error('Failed to fetch ML Prediction:', err);
          setMlPredictionError(
            err.response?.data?.error || 'Failed to fetch ML prediction data. Please check backend.'
          );
          setMlPredictionData(null); // Clear data on error
        } finally {
          setMlPredictionLoading(false);
        }
      };
      fetchMLPrediction();
    } else {
      // If not on ML prediction page, reset ML state
      setMlPredictionData(null);
      setMlPredictionLoading(false);
      setMlPredictionError(null);
    }
  }, [currentPage, selectedDate]); // Keep selectedDate as a dependency for APOD's useEffect

  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleNavigate = (page) => setCurrentPage(page);

  return (
    <div className="app-container">
      {/* Conditionally render Header only if currentPage is 'apod' */}
      {currentPage === 'apod' && <Header />}
      <main className="main-content-area">
        {currentPage === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}
        {currentPage === 'apod' && (
          <>
            <DatePicker selectedDate={selectedDate} handleDateChange={handleDateChange} />
            {/* Pass onNavigate to ApodViewer */}
            <ApodViewer loading={apodLoading} error={apodError} apodData={apodData} onNavigate={handleNavigate} />
          </>
        )}
        {currentPage === 'neows' && (
          <NEOViewer onNavigate={handleNavigate} />
        )}
        {currentPage === 'ml-prediction' && (
          <MLPredictionViewer
            loading={mlPredictionLoading}
            error={mlPredictionError}
            predictionData={mlPredictionData}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'ml-graphs' && (
          <MLGraphsViewer onNavigate={handleNavigate} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;