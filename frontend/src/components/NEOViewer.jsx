import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, subDays } from 'date-fns'; 
import { FaAsterisk, FaHourglassHalf, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa'; 
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


const BACKEND_URL = import.meta.env.VITE_APP_API_URL || 'https://nasa-node-backend.onrender.com'; 

const NEOViewer = ({ onNavigate }) => {
    const [neoData, setNeoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

 
    const [currentEndDate, setCurrentEndDate] = useState(new Date());

   
    useEffect(() => {
        const fetchNeoData = async () => {
            setLoading(true);
            setError(null);
            setNeoData(null); 

            try {
                const endDateFormatted = format(currentEndDate, 'yyyy-MM-dd');
                
                const startDateFormatted = format(subDays(currentEndDate, 6), 'yyyy-MM-dd');

                console.log(`NEOViewer: Fetching data from ${startDateFormatted} to ${endDateFormatted}`);

                const response = await axios.get(`${BACKEND_URL}/api/neows`, {
                    params: {
                        start_date: startDateFormatted,
                        end_date: endDateFormatted,
                    },
                });
                setNeoData(response.data);
            } catch (err) {
                console.error('Failed to fetch NEO data:', err);
                setError(
                    err.response?.data?.error || err.response?.data?.message || 'An error occurred while fetching Near Earth Object data. Please try again or check date range.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchNeoData();
    }, [currentEndDate]); 


    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    const prepareChartData = () => {
        if (!neoData || !neoData.near_earth_objects) return { hazardData: null, diameterScatterData: null, allNeos: [] };

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
          
                const estimatedDiameterKm = neo.estimated_diameter.kilometers.estimated_diameter_max;
                diameterMissData.push({
                    x: estimatedDiameterKm,
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

    // Options for the Bar chart
    const hazardOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Potentially Hazardous vs. Non-Hazardous Objects',
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
                        return `${context.label}: ${context.parsed.y}`;
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
                    text: 'Hazard Status',
                    color: '#93c5fd', // Light blue axis title
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
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Object Diameter vs. Miss Distance',
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
                        const dataPoint = context.raw;
                        return `${dataPoint.label} (Hazardous: ${dataPoint.isHazardous ? 'Yes' : 'No'}) - Diameter: ${dataPoint.x.toFixed(3)} km, Miss Distance: ${formatNumber(dataPoint.y.toFixed(3))} km`;
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
                    callback: function(value) {
                        return formatNumber(value); 
                    }
                },
                title: {
                    display: true,
                    text: 'Miss Distance (km)', 
                    color: '#93c5fd',
                }
            }
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <div className="text-xl text-blue-300 flex items-center">
                    <FaHourglassHalf className="animate-spin mr-3" /> Loading Near Earth Objects...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-red-100 p-4">
                <div className="bg-red-800 p-4 rounded-lg shadow-md text-center max-w-lg mb-8">
                    <FaInfoCircle className="inline-block mr-2 text-2xl" />
                    <p className="font-bold text-xl">Error:</p>
                    <p className="mt-2 text-base">{error}</p>
                    <p className="mt-2 text-sm">Please ensure your NASA API key is valid and the date range is within 7 days. Also check your network connection.</p>
                </div>
                <button className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75" onClick={() => onNavigate('home')}>
                    Back to Home
                </button>
            </div>
        );
    }

   
    const displayedStartDate = format(subDays(currentEndDate, 6), 'yyyy-MM-dd');
    const displayedEndDate = format(currentEndDate, 'yyyy-MM-dd');

    if (!neoData || !neoData.near_earth_objects || allNeos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <div className="text-center text-lg text-gray-400 bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
                    <p>No Near Earth Objects found for the period from {displayedStartDate} to {displayedEndDate}.</p>
                    <p className="mt-2 text-sm text-gray-500">Try selecting a different end date.</p>
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <label htmlFor="neo-end-date" className="text-lg font-medium text-blue-300 flex items-center">
                            <FaCalendarAlt className="mr-2" /> Select End Date:
                        </label>
                        <input
                            type="date"
                            id="neo-end-date"
                            value={displayedEndDate} 
                            onChange={(e) => setCurrentEndDate(new Date(e.target.value))}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <button className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75" onClick={() => onNavigate('home')}>
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h2 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 rounded-lg p-2 shadow-lg">
                Near Earth Objects (NEOs) Viewer
            </h2>

            <div className="flex justify-center items-center gap-4 mb-8">
                <label htmlFor="neo-end-date" className="text-lg font-medium text-blue-300 flex items-center">
                    <FaCalendarAlt className="mr-2" /> Select End Date:
                </label>
                <input
                    type="date"
                    id="neo-end-date"
                    value={displayedEndDate} 
                    onChange={(e) => setCurrentEndDate(new Date(e.target.value))}
                    max={format(new Date(), 'yyyy-MM-dd')} 
                    className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <p className="text-lg text-gray-300 mb-6">Showing data for: {displayedStartDate} to {displayedEndDate}</p>
            <p className="text-xl font-medium text-indigo-400 mb-8">Total Objects: {neoData.element_count}</p>

        
            <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
                <h3 className="text-2xl font-bold mb-6 text-center text-indigo-300">NEO Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="chart-wrapper h-80"> 
                        {hazardData && <Bar data={hazardData} options={hazardOptions} />}
                    </div>
                    <div className="chart-wrapper h-80"> 
                        {diameterScatterData && <Scatter data={diameterScatterData} options={diameterScatterOptions} />}
                    </div>
                </div>
            </div>

            {/* NEO List Section */}
            <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-700">
                <h3 className="text-2xl font-bold mb-4 text-center text-indigo-300">Near Earth Objects Details</h3>
                {Object.keys(neoData.near_earth_objects).length === 0 ? (
                    <p className="text-center text-lg text-gray-400">No Near Earth Objects found for this date range.</p>
                ) : (
                    Object.keys(neoData.near_earth_objects).sort().map((date) => (
                        <div key={date} className="mb-6 border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                            <h4 className="text-xl font-semibold text-blue-200 mb-3">{date}</h4>
                            {neoData.near_earth_objects[date].map((neo) => (
                                <div key={neo.id} className="bg-gray-700 p-4 rounded-lg shadow-inner mb-3 last:mb-0 border border-gray-600">
                                    <p className="text-lg font-medium text-yellow-300 mb-1 flex items-center">
                                        <FaAsterisk className="mr-2 text-sm" /> Name: {neo.name} ({neo.nasa_jpl_url ? <a href={neo.nasa_jpl_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">JPL Link</a> : 'No JPL Link'})
                                    </p>
                                    <p className="text-gray-300 text-sm">
                                        Potentially Hazardous: {neo.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}
                                    </p>
                                    <p className="text-gray-300 text-sm">
                                        Absolute Magnitude: {neo.absolute_magnitude_h}
                                    </p>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        {neo.estimated_diameter && (
                                            <p className="text-gray-400">
                                                Estimated Diameter (km): {formatNumber(neo.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3))} - {formatNumber(neo.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3))}
                                            </p>
                                        )}
                                        {neo.close_approach_data && neo.close_approach_data.length > 0 && (
                                            <>
                                                <p className="text-gray-400">
                                                    Close Approach Date: {neo.close_approach_data[0].close_approach_date_full}
                                                </p>
                                                <p className="text-gray-400">
                                                    Miss Distance (km): {formatNumber(parseFloat(neo.close_approach_data[0].miss_distance.kilometers).toFixed(3))}
                                                </p>
                                                <p className="text-gray-400">
                                                    Relative Velocity (km/s): {formatNumber(parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(3))}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={() => onNavigate('home')}
                className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
            >
                Back to Home
            </button>
        </div>
    );
};

export default NEOViewer;
