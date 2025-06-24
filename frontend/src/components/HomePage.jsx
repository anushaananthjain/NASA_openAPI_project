import React from 'react';

const HomePage = ({ onNavigate }) => {
  return (
    <div className="home-page-container">
      <h2 className="home-page-title">Welcome to NASA Explorer!</h2>
      <p className="home-page-subtitle">Choose an API to explore:</p>
      <div className="button-group">
        <button className="home-button" onClick={() => onNavigate('apod')}>
          APOD (Astronomy Picture of the Day)
        </button>
        <button className="home-button" onClick={() => onNavigate('neows')}>
          Near Earth Object Web Service (NEOWS)
        </button>
        <button className="home-button" onClick={() => onNavigate('ml-prediction')}>
          Solar Flare ML Prediction
        </button>
      </div>
    </div>
  );
};

export default HomePage;