
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
      setPredictionData(null);
    } finally {
      setLoadingPrediction(false);
    }
  };

 
  const fetchArEvolution = async () => {
    setLoadingArEvolution(true);
    setArEvolutionError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ml_predict_ar_evolution`, {
        params: {
          magnetic_flux_change: magneticFluxChange,
          area_change: areaChange,
          gradient_value: gradientValue,
        },
      });
      setArEvolutionData(response.data);
    } catch (err) {
      console.error('Failed to fetch AR evolution prediction:', err);
      setArEvolutionError(
        err.response?.data?.error ||
        'An error occurred while fetching AR evolution. Ensure your ML backend is running and the correct features are provided.'
      );
      setArEvolutionData(null);
    } finally {
      setLoadingArEvolution(false);
    }
  };

  useEffect(() => {
    
    fetchGeneralPrediction();
    fetchArEvolution(); 
  }, []); 

  
  useEffect(() => {
    
    if (
      typeof magneticFluxChange === 'number' &&
      typeof areaChange === 'number' &&
      typeof gradientValue === 'number'
    ) {
      
    }
  }, [magneticFluxChange, areaChange, gradientValue]); 


  return (
    <div className="sdoml-viewer-content">
      <h2 className="sdoml-title">SDO Machine Learning for Space Weather Forecasting</h2>
      <p className="sdoml-intro">
        The Solar Dynamics Observatory Machine Learning (SDOML) Dataset is a crucial resource for applying machine learning to predict solar flares, Coronal Mass Ejections (CMEs), and Solar Energetic Particle (SEP) events.
        These events can significantly impact Earth-orbiting satellites, communication systems, and power grids.
      </p>

     
      <div className="sdoml-section ml-prediction-section">
        <h3>General ML Prediction (Conceptual)</h3>
        <button onClick={fetchGeneralPrediction} disabled={loadingPrediction} className="home-button">
          {loadingPrediction ? 'Loading Prediction...' : 'Fetch Latest General Prediction'}
        </button>

        {predictionError && (
          <p className="error-text" style={{ color: 'red', marginTop: '1rem' }}>
            Error: {predictionError}
          </p>
        )}

        {predictionData && (
          <div className="prediction-results">
            <p><strong>Status:</strong> {predictionData.prediction}</p>
            {predictionData.probability !== undefined && (
              <p><strong>Probability:</strong> {predictionData.probability * 100}%</p>
            )}
            {predictionData.timestamp && (
              <p><strong>As of:</strong> {new Date(predictionData.timestamp).toLocaleString()}</p>
            )}
            
          </div>
        )}
      </div>

      
      <div className="sdoml-section ml-prediction-section">
        <h3>Active Region Evolution Classification (Conceptual)</h3>

       
        <div className="feature-inputs">
          <label>
            Magnetic Flux Change:
            <input
              type="number"
              step="0.01"
              value={magneticFluxChange}
              onChange={(e) => setMagneticFluxChange(parseFloat(e.target.value))}
              className="feature-input"
            />
          </label>
          <label>
            Area Change:
            <input
              type="number"
              value={areaChange}
              onChange={(e) => setAreaChange(parseFloat(e.target.value))}
              className="feature-input"
            />
          </label>
          <label>
            Gradient Value:
            <input
              type="number"
              step="0.01"
              value={gradientValue}
              onChange={(e) => setGradientValue(parseFloat(e.target.value))}
              className="feature-input"
            />
          </label>
        </div>

        <button onClick={fetchArEvolution} disabled={loadingArEvolution} className="home-button">
          {loadingArEvolution ? 'Classifying...' : 'Classify Active Region Evolution'}
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