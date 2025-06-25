import React from 'react';

const ApodViewer = ({ loading, error, apodData, onNavigate }) => { // Add onNavigate prop
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading cosmic data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message-box">
        <p className="error-title">Error!</p>
        <p className="error-text">{error}</p>
        <p className="error-hint">Please try selecting a different date or check your network connection!!!!!</p>
        <button className="home-button" onClick={() => onNavigate('home')}> {/* Added button */}
          Back to Home
        </button>
      </div>
    );
  }

  if (!apodData) return null;

  return (
    <div className="apod-viewer-content">
      <h2 className="apod-title">
        {apodData.title}
      </h2>
      <p className="apod-date">Date: {apodData.date}</p>

      <div className="apod-media-explanation-container">
        <div className="apod-media-section">
          {apodData.media_type === 'image' ? (
            <img
              src={apodData.url}
              alt={apodData.title}
              className="apod-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/600x400/333333/FFFFFF?text=Image+Not+Available";
              }}
            />
          ) : (
            <iframe
              title="APOD video"
              src={apodData.url}
              className="apod-video"
              allowFullScreen
            />
          )}
        </div>

        <div className="apod-explanation-section">
          <p className="explanation-heading">Did you know ?</p>
          <p>{apodData.explanation}</p>
          {apodData?.copyright && (
            <p className="apod-copyright">
              &copy; {apodData.copyright}
            </p>
          )}
        </div>
      </div>
      <button className="home-button" onClick={() => onNavigate('home')}> {/* Added button */}
        Back to Home
      </button>
    </div>
  );
};

export default ApodViewer;