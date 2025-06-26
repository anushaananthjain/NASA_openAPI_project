import React, { useState, useEffect } from 'react';
import axios from 'axios';


const SDOMLViewer = ({ onNavigate }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  const [arEvolutionData, setArEvolutionData] = useState(null);
  const [loadingArEvolution, setLoadingArEvolution] = useState(false);
  const [arEvolutionError, setArEvolutionError] = useState(null);


  const [magneticFluxChange, setMagneticFluxChange] = useState(0.6);
  const [areaChange, setAreaChange] = useState(100);
  const [gradientValue, setGradientValue] = useState(0.7);
  const BACKEND_URL = 'http://localhost:5000';

  const fetchGeneralPrediction = async () => {
    setLoadingPrediction(true);
    setPredictionError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ml_predict`);
      setPredictionData(response.data);
    } catch (err) {
      console.error('Failed to fetch general ML prediction:', err);
      setPredictionError(
        err.response?.data?.error ||
        'An error occurred while fetching general ML prediction. Please ensure your ML backend is running.'
      );
    } finally {
      setLoadingPrediction(false);
    }
  };

  const fetchArEvolution = async () => {
    setLoadingArEvolution(true);
    setArEvolutionError(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ml_predict_ar_evolution`, {
        magnetic_flux_change: magneticFluxChange,
        area_change: areaChange,
        gradient_value: gradientValue,
      });
      setArEvolutionData(response.data);
    } catch (err) {
      console.error('Failed to fetch AR evolution classification:', err);
      setArEvolutionError(
        err.response?.data?.error ||
        'An error occurred while fetching AR evolution classification. Please ensure your ML backend is running.'
      );
    } finally {
      setLoadingArEvolution(false);
    }
  };

  
  useEffect(() => {
    fetchGeneralPrediction();
    fetchArEvolution();
  }, []); 


  return (
    <div className="sdoml-viewer-container">
      <h1 className="sdoml-title">
        SDO Machine Learning for Space Weather Forecasting
      </h1>
      <p className="sdoml-intro">
        This section demonstrates machine learning models for solar activity.
      </p>

      <div
        class="prediction-section"
      >
        <h3>
          General Solar Flare Prediction
        </h3>
        <p>
          Predicts the general likelihood of solar flares.
        </p>
   
        <button
          className="home-button"
          onClick={fetchGeneralPrediction}
          disabled={loadingPrediction}
        >
          {loadingPrediction ? (
            <span role="progressbar">Fetching...</span>
          ) : (
            'Predict General Flare' 
          )}
        </button>

        {predictionError && (
          <p className="error-text" style={{ color: 'red', marginTop: '1rem' }}>
            Error: {predictionError}
          </p>
        )}

        {predictionData && (
          <div className="prediction-results">
            <p><strong>Status:</strong> {predictionData.prediction}</p>
            <p><strong>Probability:</strong> {predictionData.probability * 100}%</p>
            <p><strong>Timestamp:</strong> {new Date(predictionData.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>

      <hr
        class="divider"
      />

      <div
        class="ar-evolution-section"
      >
        <h3>
          Active Region Evolution Classification
        </h3>
        <p>
          Classifies the predicted evolution of an active region based on input features.
        </p>
        <div
          class="feature-input-group"
        >
          <label
            class="feature-label"
          >
            Magnetic Flux Change:
            <input
              class="feature-input"
              type="number"
              value={magneticFluxChange}
              onChange={(e) => setMagneticFluxChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          </label>
          <label
            class="feature-label"
          >
            Area Change:
            <input
              class="feature-input"
              type="number"
              value={areaChange}
              onChange={(e) => setAreaChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          </label>
          <label
            class="feature-label"
          >
            Gradient Value:
            <input
              class="feature-input"
              type="number"
              value={gradientValue}
              onChange={(e) => setGradientValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
            />
          </label>
        </div>

        <button onClick={fetchArEvolution} disabled={loadingArEvolution} className="home-button">
          {loadingArEvolution ? (
            <span role="progressbar">Classifying...</span>
          ) : (
            'Classify Active Region Evolution'
          )}
        </button>

        {arEvolutionError && (
          <p className="error-text" style={{ color: 'red', marginTop: '1rem' }}>
            Error: {arEvolutionError}
          </p>
        )}

        {arEvolutionData && (
          <div className="prediction-results">
            <p><strong>Active Region ID:</strong> {arEvolutionData.active_region_id || 'N/A'}</p>
            <p><strong>Predicted Evolution:</strong> {arEvolutionData.predicted_evolution}</p>
            <p><strong>Prediction Time:</strong> {new Date(arEvolutionData.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>


      <p className="sdoml-outro">
        Implementing these models typically involves working with large datasets, advanced computational resources, and specialized machine learning frameworks in languages like Python.
      </p>

      <button className="home-button" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default SDOMLViewer;