// server.js

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_ML_BACKEND_URL = process.env.PYTHON_ML_BACKEND_URL || 'http://localhost:5001'; 


app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'ml_backend', 'public')));


app.get('/', (req, res) => {
    res.send('NASA Explorer Backend (Node.js Proxy) is running!');
});


app.get('/api/apod', async (req, res) => {
    const NASA_API_KEY = process.env.NASA_API_KEY;
    if (!NASA_API_KEY) {
        return res.status(500).json({ error: 'NASA API Key not configured in .env' });
    }

    const { date } = req.query; 

    try {
        const params = {
            api_key: NASA_API_KEY,
        };
        if (date) {
            params.date = date; 
        }
        const response = await axios.get(`https://api.nasa.gov/planetary/apod`, { params });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching APOD:', error.message);
        const errorMessage = error.response?.data?.msg || 'Failed to fetch Astronomy Picture of the Day';
        res.status(error.response ? error.response.status : 500).json({
            error: errorMessage,
            details: error.message
        });
    }
});


app.get('/api/neows', async (req, res) => {
    const NASA_API_KEY = process.env.NASA_API_KEY;
    if (!NASA_API_KEY) {
        return res.status(500).json({ error: 'NASA API Key not configured in .env' });
    }

    const { start_date, end_date } = req.query; 

    try {
        const params = {
            api_key: NASA_API_KEY,
            start_date: start_date,
            end_date: end_date,
        };
        const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/feed`, {
            params: params
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching NEOWS data:', error.message);
        const errorMessage = error.response?.data?.message || 'Failed to fetch Near Earth Objects data';
        res.status(error.response ? error.response.status : 500).json({
            error: errorMessage,
            details: error.message
        });
    }
});


app.post('/api/ml_predict', async (req, res) => {
    try {
        
        const response = await axios.post(`${PYTHON_ML_BACKEND_URL}/api/ml_predict`, req.body);
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying ML prediction request to Python backend:', error.message);
        if (error.response) {
            console.error('Python backend response error:', error.response.data);
            res.status(error.response.status).json({
                error: error.response.data.error || 'Failed to get general ML prediction from backend.',
                details: error.message
            });
        } else {
            
            res.status(500).json({
                error: 'Failed to connect to ML prediction backend. Is the Python server running?',
                details: error.message
            });
        }
    }
});

// // NASA Mars Weather API Route (Placeholder)
// app.get('/api/mars-weather', async (req, res) => {
//     const NASA_API_KEY = process.env.NASA_API_KEY;
//     if (!NASA_API_KEY) {
//         return res.status(500).json({ error: 'NASA API Key not configured in .env' });
//     }

//     try {
//         const response = await axios.get(`https://api.nasa.gov/insight_weather/?api_key=${NASA_API_KEY}&feedtype=json&ver=1.0`);
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error fetching Mars Weather data:', error.message);
//         const errorMessage = error.response?.data?.message || 'Failed to fetch Mars Weather data';
//         res.status(error.response ? error.response.status : 500).json({
//             error: errorMessage,
//             details: error.message
//         });
//     }
// });

// Start the server
app.listen(PORT, () => {
    console.log(`Node.js Proxy Server is running on http://localhost:${PORT}`);
    console.log(`Python ML Backend is expected at ${PYTHON_ML_BACKEND_URL}`);
});
