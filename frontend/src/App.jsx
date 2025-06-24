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
    if (currentPage === 'apod') {
      const fetchApodData = async () => {
        setApodLoading(true);
        setApodError(null);

        try {
          const response = await axios.get(`${BACKEND_URL}/api/apod?date=${selectedDate}`);
          setApodData(response.data);
        } catch (err) {
          console.error('Failed to fetch APOD data:', err);
          setApodError(
            err.response?.data?.message ||
            'An error occurred while fetching data. Please try again later.'
          );
          setApodData(null);
        } finally {
          setApodLoading(false);
        }
      };
      fetchApodData();
    }

    else if (currentPage === 'ml-prediction') {
      const fetchMLPrediction = async () => {
        setMlPredictionLoading(true);
        setMlPredictionError(null);
        try {
          const sampleFeatures = {
            "total_counts": 50000,
            "x_pos_asec": 100,
            "y_pos_asec": -200,
            "start_hour": 21,
            "start_minute": 29,
            "start_second": 56,
            "end_hour": 21,
            "end_minute": 41,
            "end_second": 48
          };
          
          
          const response = await axios.post(`${BACKEND_URL}/api/ml_predict`, sampleFeatures);
          setMlPredictionData(response.data);
        } catch (err) {
          console.error('Failed to fetch ML Prediction:', err);
          setMlPredictionError(
            err.response?.data?.error || 'Failed to fetch ML prediction data. Please check backend.'
          );
          setMlPredictionData(null);
        } finally {
          setMlPredictionLoading(false);
        }
      };
      fetchMLPrediction();
    }
  }, [selectedDate, currentPage]); 

  const handleDateChange = (e) => setSelectedDate(e.target.value);
  const handleNavigate = (page) => setCurrentPage(page);

  return (
    <div className="app-container">
      <Header />
      <main className="main-content-area">
        {currentPage === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}
        {currentPage === 'apod' && (
          <>
            <DatePicker selectedDate={selectedDate} handleDateChange={handleDateChange} />
            <ApodViewer loading={apodLoading} error={apodError} apodData={apodData} />
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
