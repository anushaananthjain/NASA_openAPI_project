// require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path'); 

const app = express();

console.log("--- DEBUGGING ENVIRONMENT VARIABLES ---");
console.log("process.env.ML_API_BASE_URL:", process.env.ML_API_BASE_URL);
console.log("process.env.NASA_API_KEY:", process.env.NASA_API_KEY ? "SET" : "NOT SET");
console.log("process.env.PORT:", process.env.PORT);
console.log("-------------------------------------");

const PORT = process.env.PORT || 5000;
// const PYTHON_ML_BACKEND_URL = process.env.PYTHON_ML_BACKEND_URL || 'http://localhost:5001'; 
// const PYTHON_ML_BACKEND_URL = process.env.PYTHON_ML_BACKEND_URL; 
const PYTHON_ML_BACKEND_URL = process.env.ML_API_BASE_URL; // Use the new name
if (!PYTHON_ML_BACKEND_URL) {
    console.error("CRITICAL ERROR: ML_API_BASE_URL environment variable is not set!");
}



// app.use(cors({
//     // origin: 'https://nasa-react-frontend.vercel.app', 
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(cors({
    origin: 'https://nasa-react-frontend-6z8ti51ko-anusha-ananths-projects.vercel.app', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'ml_backend', 'public')));


app.get('/', (req, res) => {
    res.send('NASA Explorer Backend (Node.js Proxy) is running!');
});


// app.get('/api/apod', async (req, res) => {
//     const NASA_API_KEY = process.env.NASA_API_KEY;
//     if (!NASA_API_KEY) {
//         return res.status(500).json({ error: 'NASA API Key not configured in .env' });
//     }

//     const { date } = req.query; 

//     try {
//         const params = {
//             api_key: NASA_API_KEY,
//         };
//         if (date) {
//             params.date = date; 
//         }
//         const response = await axios.get(`https://api.nasa.gov/planetary/apod`, { params });
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error fetching APOD:', error.message);
//         const errorMessage = error.response?.data?.msg || 'Failed to fetch Astronomy Picture of the Day';
//         res.status(error.response ? error.response.status : 500).json({
//             error: errorMessage,
//             details: error.message
//         });
//     }
// });

app.get('/api/apod', async (req, res) => {
    const NASA_API_KEY = process.env.NASA_API_KEY;
    if (!NASA_API_KEY) {
        console.error('Node.js Backend: NASA API Key is NOT SET (internally)');
        return res.status(500).json({ error: 'NASA API Key not configured in .env' });
    }

    const { date } = req.query;

    try {
        console.log(`Node.js Backend: Attempting to fetch APOD for date: ${date || 'today'} with API Key status: ${NASA_API_KEY ? 'SET' : 'NOT SET'}`);
        const params = {
            api_key: NASA_API_KEY,
        };
        if (date) {
            params.date = date;
        }
        const response = await axios.get(`https://api.nasa.gov/planetary/apod`, { params });
        console.log("Node.js Backend: Successfully fetched APOD data from NASA API.");
        res.json(response.data);
    } catch (error) {
        console.error('Node.js Backend Error fetching APOD:', error.message);
        if (error.response) {
            console.error('Node.js Backend: NASA API response error status:', error.response.status);
            console.error('Node.js Backend: NASA API response error data:', error.response.data);
        } else if (error.request) {
            console.error('Node.js Backend: No response received from NASA API. Request details:', error.request);
        } else {
            console.error('Node.js Backend: Error setting up request to NASA API:', error.message);
        }
        const errorMessage = error.response?.data?.msg || 'Failed to fetch Astronomy Picture of the Day from NASA API (proxy error)';
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

   
    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Both start_date and end_date query parameters are required for NEOs.' });
    }
   

    try {
        const response = await axios.get(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${start_date}&end_date=${end_date}&api_key=${NASA_API_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching NEO data:', error.message);
        const errorMessage = error.response?.data?.error_message || 'Failed to fetch Near Earth Object data';
        res.status(error.response?.status || 500).json({
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


// NASA Mars Weather API Route (Placeholder) - KEEP COMMENTED OUT unless actively implementing
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


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Node.js Proxy Server is running on http://localhost:${PORT}`);
        console.log(`Python ML Backend is expected at ${PYTHON_ML_BACKEND_URL}`);
    });
}

module.exports = app;
