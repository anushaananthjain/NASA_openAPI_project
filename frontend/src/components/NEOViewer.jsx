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
    maintainAspectRatio: false, // Add or ensure this is false
    plugins: {
      title: {
        display: true,
        text: 'Hazardous Object Count by Date',
        color: '#e5e7eb',
        font: { size: 18 }
      },
      legend: {
        labels: {
          color: '#e5e7eb',
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Count: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#d1d5db',
        },
        title: {
          display: true,
          text: 'Date',
          color: '#93c5fd',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#d1d5db',
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Objects',
          color: '#93c5fd',
        }
      }
    }
  };


  const diameterScatterOptions = {
    responsive: true,
    maintainAspectRatio: false, // Add or ensure this is false
    plugins: {
      title: {
        display: true,
        text: 'Object Diameter vs. Closest Approach Distance',
        color: '#e5e7eb',
        font: { size: 18 }
      },
      legend: {
        labels: {
          color: '#e5e7eb',
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Diameter: ${context.parsed.x} km, Distance: ${context.parsed.y} AU`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#d1d5db',
        },
        title: {
          display: true,
          text: 'Estimated Diameter (km)',
          color: '#93c5fd',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#d1d5db',
        },
        title: {
          display: true,
          text: 'Closest Approach Distance (AU)',
          color: '#93c5fd',
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
        
        <button className="home-button mt-8" onClick={() => onNavigate('home')}>
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
        
        <button className="home-button mt-8" onClick={() => onNavigate('home')}>
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

      
      <button className="home-button mt-8" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );

};

export default NEOViewer;