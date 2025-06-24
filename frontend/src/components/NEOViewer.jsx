import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, 
  LineElement,  
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2'; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const NEOViewer = ({ onNavigate }) => {
  const [neoData, setNeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);


  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchNeoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/neows?start_date=${startDate}&end_date=${endDate}`);
        setNeoData(response.data);
      } catch (err) {
        console.error('Failed to fetch NEO data:', err);
        setError(
          err.response?.data?.message ||
          'An error occurred while fetching Near Earth Object data. Please try again later.'
        );
        setNeoData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchNeoData();
  }, [startDate, endDate]); 

  
  const prepareChartData = () => {
    if (!neoData || !neoData.near_earth_objects) return { hazardData: null, diameterScatterData: null };

    let hazardousCount = 0;
    let nonHazardousCount = 0;
    const diameterMissData = [];

    
    const allNeos = Object.values(neoData.near_earth_objects).flat();

    allNeos.forEach(neo => {
      if (neo.is_potentially_hazardous_asteroid) {
        hazardousCount++;
      } else {
        nonHazardousCount++;
      }

      
      if (neo.close_approach_data && neo.close_approach_data.length > 0) {
        const missDistanceKm = parseFloat(neo.close_approach_data[0].miss_distance.kilometers);
        const estimatedDiameterM = neo.estimated_diameter.meters.estimated_diameter_max; 
        diameterMissData.push({
          x: estimatedDiameterM,
          y: missDistanceKm,
          label: neo.name, 
          isHazardous: neo.is_potentially_hazardous_asteroid 
        });
      }
    });

    
    const hazardData = {
      labels: ['Potentially Hazardous', 'Non-Hazardous'],
      datasets: [{
        label: 'Number of Objects',
        data: [hazardousCount, nonHazardousCount],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)', 
          'rgba(75, 192, 192, 0.6)'  
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      }]
    };

    
    const diameterScatterData = {
        datasets: [
            {
                label: 'Potentially Hazardous',
                data: diameterMissData.filter(d => d.isHazardous),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: 'Non-Hazardous',
                data: diameterMissData.filter(d => !d.isHazardous),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                pointRadius: 5,
                pointHoverRadius: 7,
            }
        ]
    };

    return { hazardData, diameterScatterData, allNeos };
  };

  const { hazardData, diameterScatterData, allNeos } = prepareChartData();

  const hazardOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            color: 'white' 
        }
      },
      title: {
        display: true,
        text: 'Hazardous vs. Non-Hazardous NEOs',
        color: '#d1d5db' 
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null) {
                label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
        x: {
            ticks: {
                color: '#9ca3af' 
            },
            grid: {
                color: 'rgba(255,255,255,0.1)' 
            }
        },
        y: {
            ticks: {
                color: '#9ca3af' 
            },
            grid: {
                color: 'rgba(255,255,255,0.1)' 
            }
        }
    }
  };

  const diameterScatterOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            color: 'white'
        }
      },
      title: {
        display: true,
        text: 'Estimated Diameter vs. Miss Distance',
        color: '#d1d5db'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataPoint = context.raw;
            return `Name: ${dataPoint.label} | Diameter: ${dataPoint.x.toFixed(2)}m | Miss Distance: ${dataPoint.y.toFixed(2)}km`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Max Estimated Diameter (meters)',
          color: '#d1d5db'
        },
        ticks: {
            color: '#9ca3af'
        },
        grid: {
            color: 'rgba(255,255,255,0.1)'
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Miss Distance (km)',
          color: '#d1d5db'
        },
        ticks: {
            color: '#9ca3af'
        },
        grid: {
            color: 'rgba(255,255,255,0.1)'
        }
      }
    }
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading Near Earth Objects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message-box">
        <p className="error-title">Error!</p>
        <p className="error-text">{error}</p>
        <p className="error-hint">Please check your network connection or try again later.</p>
        <button className="home-button" onClick={() => onNavigate('home')}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!neoData || !neoData.near_earth_objects || allNeos.length === 0) {
    return (
      <div className="no-data-message">
        <p>No Near Earth Objects found for the selected period.</p>
        <div className="date-selection-container">
          <label htmlFor="neo-start-date" className="date-picker-label">Start Date:</label>
          <input
            type="date"
            id="neo-start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="date-picker-input"
          />
          <label htmlFor="neo-end-date" className="date-picker-label">End Date:</label>
          <input
            type="date"
            id="neo-end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="date-picker-input"
          />
        </div>
        <button className="home-button" onClick={() => onNavigate('home')}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="neo-viewer-content">
      <h2 className="neo-title">Near Earth Objects ({startDate} to {endDate})</h2>
      <p className="neo-subtitle">Total Objects: {neoData.element_count}</p>

      <div className="date-selection-container">
        <label htmlFor="neo-start-date" className="date-picker-label">Start Date:</label>
        <input
          type="date"
          id="neo-start-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="date-picker-input"
        />
        <label htmlFor="neo-end-date" className="date-picker-label">End Date:</label>
        <input
          type="date"
          id="neo-end-date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="date-picker-input"
        />
      </div>

      <div className="chart-container">
        {hazardData && <Bar data={hazardData} options={hazardOptions} />}
      </div>

      <div className="chart-container">
        {diameterScatterData && <Scatter data={diameterScatterData} options={diameterScatterOptions} />}
      </div>

      <div className="data-table-section">
        <h3>Detailed NEO List</h3>
        <div className="neo-list-grid">
          {allNeos.map((neo) => (
            <div key={neo.id} className="neo-item-card">
              <h4>{neo.name}</h4>
              <p><strong>Hazardous:</strong> {neo.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
              <p><strong>Abs. Mag:</strong> {neo.absolute_magnitude_h}</p>
              {neo.close_approach_data && neo.close_approach_data.length > 0 && (
                <div className="close-approach-summary">
                  <p><strong>Approach Date:</strong> {neo.close_approach_data[0].close_approach_date}</p>
                  <p><strong>Miss Distance:</strong> {parseFloat(neo.close_approach_data[0].miss_distance.kilometers).toFixed(0)} km</p>
                  <p><strong>Velocity:</strong> {parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(2)} km/s</p>
                </div>
              )}
              <p><strong>Est. Diameter:</strong> {parseFloat(neo.estimated_diameter.meters.estimated_diameter_min).toFixed(0)} - {parseFloat(neo.estimated_diameter.meters.estimated_diameter_max).toFixed(0)} m</p>
              <a href={neo.nasa_jpl_url} target="_blank" rel="noopener noreferrer" className="jpl-link">More Info (JPL)</a>
            </div>
          ))}
        </div>
      </div>

      <button className="home-button" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default NEOViewer;