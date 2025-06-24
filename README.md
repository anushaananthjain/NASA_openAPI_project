# NASA_openAPI_project
# NASA Astronomy Picture of the Day (APOD) & Space Data Viewer

Welcome to the NASA Astronomy Picture of the Day (APOD) & Space Data Viewer! This application allows you to explore daily astronomical images and information provided by NASA's APOD API, view Near-Earth Objects (NEOs) data from the NeoWs (Near Earth Object Web Service) API, and delve into machine learning predictions and graphs related to solar flare data from the Solar Dynamics Observatory (SDO).

---

## Features

### Astronomy Picture of the Day (APOD):

* View NASA's captivating Astronomy Picture of the Day.
* Select past dates to explore historical APOD entries.
* Displays image or video content along with the title, explanation, and copyright information.

### Near-Earth Objects (NEO) Viewer:

* Explore data on asteroids and comets that pass close to Earth.
* Visualize NEO data, including hazardous objects and close approach details.

### Solar Flare ML Prediction:

* See a machine learning model's prediction for solar flare activity based on sample input features.

### Solar Flare ML Graphs:

* View various graphs and visualizations related to the SDO machine learning model, offering insights into the data and model performance.

### Responsive Design:

* Enjoy a seamless experience across various devices and screen sizes.

---

## Technologies Used

This project is built using a modern web development stack:

### Frontend:

* **React:** A JavaScript library for building user interfaces.
* **Axios:** A promise-based HTTP client for making API requests.
* **Chart.js:** For creating interactive data visualizations (used in NEOViewer).

### Backend (Proxy Server):

* **Node.js:** A JavaScript runtime for server-side logic.
* **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
* **CORS:** Middleware to enable Cross-Origin Resource Sharing.
* **Axios:** For making requests to external NASA APIs.

### Machine Learning (Integrated via Backend):

* **Python (Flask):** A micro web framework for Python, used to serve the ML model.
* **Scikit-learn / Pandas / NumPy:** Standard Python libraries for data manipulation and machine learning.

---

## Getting Started

Follow these steps to set up and run the project locally on your machine.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js & npm (or Yarn):** Download [Node.js](https://nodejs.org/) (npm is included with Node.js).
* **Python 3.x & pip:** Download [Python](https://www.python.org/downloads/).
* **NASA API Key:** Obtain a free API key from the [NASA API website](https://api.nasa.gov/). This key is essential for accessing the APOD and NeoWs data.

### Installation

1.  **Clone the Repository:**

    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```

2.  **Backend Setup (Node.js Proxy):**

    Navigate to your backend directory (e.g., `backend/` or `server/`).

    ```bash
    cd path/to/your/backend
    npm install
    ```

    Create a `.env` file in your backend directory and add your NASA API key:

    ```
    NASA_API_KEY=YOUR_NASA_API_KEY_HERE
    ```

    Replace `YOUR_NASA_API_KEY_HERE` with the actual key you obtained.

3.  **Frontend Setup (React App):**

    Navigate to your frontend directory (e.g., `frontend/` or `client/`).

    ```bash
    cd path/to/your/frontend
    npm install
    ```

4.  **Machine Learning Backend Setup (Python Flask):**

    Navigate to your Python ML backend directory (e.g., `ml-backend/`).

    ```bash
    cd path/to/your/ml-backend
    pip install -r requirements.txt # Ensure you have a requirements.txt
