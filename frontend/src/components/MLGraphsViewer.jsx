import React from 'react';

const MLGraphsViewer = ({ onNavigate }) => {
  const BASE_IMG_URL = 'http://localhost:5000/plots/'; 

  const graphData = [
    {
      id: 'training-history',
      src: `${BASE_IMG_URL}training_history_plot.png`,
      alt: 'Model Training History Plot',
      title: 'Model Training History',
      description: 'This graph illustrates the model\'s learning process over epochs, showing both training and validation loss and Mean Absolute Error (MAE). It helps assess convergence and detect overfitting.'
    },
    {
      id: 'actual-vs-predicted',
      src: `${BASE_IMG_URL}actual_vs_predicted_plot.png`,
      alt: 'Actual vs. Predicted Peak Offsets Plot',
      title: 'Actual vs. Predicted Values',
      description: 'This scatter plot compares the actual peak offset times against the model\'s predicted offset times. Points clustering near the red diagonal line indicate higher prediction accuracy.'
    },
    {
      id: 'residuals-plot',
      src: `${BASE_IMG_URL}residuals_plot.png`,
      alt: 'Residuals Plot',
      title: 'Residuals Analysis',
      description: 'The residuals plot shows the difference between actual and predicted values. Ideally, residuals should be randomly scattered around zero, indicating no systematic errors in predictions.'
    }
  ];

  return (
    <div className="ml-graphs-viewer-content">
      <h2 className="ml-graphs-title">Solar Flare Prediction Model Performance</h2>
      <p className="ml-graphs-intro">
        These visualizations provide insights into the training and performance of the
        Solar Flare Peak Time Prediction Model.
      </p>

      <div className="graph-cards-container">
        {graphData.map((graph) => (
          <div key={graph.id} className="graph-card">
            <h3 className="graph-card-title">{graph.title}</h3>
            <img
              src={graph.src}
              alt={graph.alt}
              className="graph-image"
              // Fallback for image loading errors
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/600x400/333333/FFFFFF?text=Graph+Not+Available";
                e.target.alt = "Graph not available";
              }}
            />
            <p className="graph-description">{graph.description}</p>
          </div>
        ))}
      </div>

      <button className="home-button mt-8" onClick={() => onNavigate('ml-prediction')}>
        Back to ML Prediction
      </button>
    </div>
  );
};

export default MLGraphsViewer;
