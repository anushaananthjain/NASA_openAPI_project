// tests/server_tests.js
const request = require('supertest');
const app = require('../server'); // Import the Express app instance from server.js
// const nock = require('nock'); // No longer needed, as we're using axios-mock-adapter exclusively
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Create a new mock adapter instance for axios
const mock = new MockAdapter(axios);

// Mock environment variables for testing
process.env.NASA_API_KEY = 'TEST_NASA_KEY';
process.env.PYTHON_ML_BACKEND_URL = 'http://localhost:5001';

describe('Node.js Proxy Server API Tests', () => {

  // Clear all axios-mock-adapter mocks after each test to prevent interference
  afterEach(() => {
    mock.reset(); // Resets all handlers added by mock.onGet, mock.onPost, etc.
    // nock.cleanAll(); // No longer needed
  });

  // Test the root endpoint
  test('GET / should return "NASA Explorer Backend (Node.js Proxy) is running!"', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('NASA Explorer Backend (Node.js Proxy) is running!');
  });

  // Test the /api/apod endpoint
  describe('GET /api/apod', () => {
    test('should return APOD data for a valid date', async () => {
      // Mock the external NASA APOD API response using axios-mock-adapter
      mock.onGet('https://api.nasa.gov/planetary/apod', {
        params: {
          api_key: process.env.NASA_API_KEY,
          date: '2023-01-01'
        }
      }).reply(200, {
        title: 'Test APOD',
        date: '2023-01-01',
        url: 'http://test.url/image.jpg',
        explanation: 'This is a test explanation.',
        media_type: 'image'
      });

      const response = await request(app).get('/api/apod?date=2023-01-01');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        title: 'Test APOD',
        date: '2023-01-01',
        url: 'http://test.url/image.jpg',
        explanation: 'This is a test explanation.',
        media_type: 'image'
      });
    });

    test('should return 500 if NASA API Key is missing', async () => {
      // Temporarily unset the API key for this specific test
      const originalApiKey = process.env.NASA_API_KEY;
      delete process.env.NASA_API_KEY;

      const response = await request(app).get('/api/apod?date=2023-01-01');

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('NASA API Key not configured in .env');

      // Restore the API key after the test
      process.env.NASA_API_KEY = originalApiKey;
    });

    test('should return 500 if NASA APOD API fails', async () => {
      // Mock a failed response from the external NASA APOD API using axios-mock-adapter
      mock.onGet('https://api.nasa.gov/planetary/apod', {
        params: {
          api_key: process.env.NASA_API_KEY,
          date: '2023-01-02'
        }
      }).reply(500, { msg: 'Internal Server Error from NASA' });

      const response = await request(app).get('/api/apod?date=2023-01-02');

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Internal Server Error from NASA');
      // Axios error message may vary slightly, check the actual error you get
      expect(response.body.details).toBe('Request failed with status code 500');
    });
  });

  // Test the /api/neows endpoint
  describe('GET /api/neows', () => {
    test('should return NEOWS data for valid dates', async () => {
      // Mock the external NASA NEOWS API response using axios-mock-adapter
      mock.onGet('https://api.nasa.gov/neo/rest/v1/feed', {
        params: {
          api_key: process.env.NASA_API_KEY,
          start_date: '2023-01-01',
          end_date: '2023-01-01'
        }
      }).reply(200, {
        element_count: 1,
        near_earth_objects: {
          '2023-01-01': [{
            id: '12345',
            name: 'Test NEO',
            is_potentially_hazardous_asteroid: false
          }]
        }
      });

      const response = await request(app).get('/api/neows?start_date=2023-01-01&end_date=2023-01-01');

      expect(response.statusCode).toBe(200);
      expect(response.body.element_count).toBe(1);
      expect(response.body.near_earth_objects['2023-01-01'][0].name).toBe('Test NEO');
    });

    test('should return 500 if NASA NEOWS API fails', async () => {
      mock.onGet('https://api.nasa.gov/neo/rest/v1/feed', {
        params: {
          api_key: process.env.NASA_API_KEY,
          start_date: '2023-01-03',
          end_date: '2023-01-03'
        }
      }).reply(400, { message: 'Invalid date range' });

      const response = await request(app).get('/api/neows?start_date=2023-01-03&end_date=2023-01-03');

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Invalid date range');
    });
  });

  // Test the /api/ml_predict endpoint (proxy to Python backend)
  describe('POST /api/ml_predict', () => {
    // Define sampleFeatures once for this describe block
    const sampleFeatures = {
      "total_counts": 50000, "x_pos_asec": 100, "y_pos_asec": -200,
      "start_hour": 21, "start_minute": 29, "start_second": 56,
      "end_hour": 21, "end_minute": 41, "end_second": 48
    };

    test('should proxy prediction request to Python backend and return data', async () => {
      // Mock the Python ML backend response for a successful prediction using axios-mock-adapter
      mock.onPost(`${process.env.PYTHON_ML_BACKEND_URL}/api/ml_predict`, sampleFeatures)
        .reply(200, {
          prediction: 245.78,
          prediction_formatted_offset: "00:04:06",
          predicted_peak_time: "21:34:02"
        });

      const response = await request(app)
        .post('/api/ml_predict')
        .send(sampleFeatures);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        prediction: 245.78,
        prediction_formatted_offset: "00:04:06",
        predicted_peak_time: "21:34:02"
      });
    });

    test('should return 500 if Python ML backend fails to connect', async () => {
      // Simulate a network error for the Python ML backend
      mock.onPost(`${process.env.PYTHON_ML_BACKEND_URL}/api/ml_predict`).networkError();

      const response = await request(app)
        .post('/api/ml_predict')
        .send(sampleFeatures);

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe('Failed to connect to ML prediction backend. Is the Python server running?');
    });

    test('should return error from Python ML backend if it responds with an error', async () => {
      // Mock the Python ML backend responding with an error status code (e.g., 400)
      mock.onPost(`${process.env.PYTHON_ML_BACKEND_URL}/api/ml_predict`, sampleFeatures)
        .reply(400, { error: 'Invalid input features' });

      const response = await request(app)
        .post('/api/ml_predict')
        .send(sampleFeatures);

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Invalid input features');
    });
  });
});