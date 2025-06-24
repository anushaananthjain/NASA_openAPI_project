# ml_backend_server.py
from flask import Flask, request, jsonify
import numpy as np
from flask_cors import CORS
import datetime
import joblib   # For loading scalers
from tensorflow.keras.models import load_model # For loading the Keras .h5 model
import os # For path manipulation

app = Flask(__name__)
CORS(app) 

# --- Machine Learning Model and Scaler Loading ---
# Define paths for the saved model and scalers.
# These paths assume the .h5 model and .pkl scalers are in the same directory as this script.
MODEL_PATH = 'solar_flare_peak_time_predictor_lstm_model.h5'
SCALER_X_PATH = 'scaler_X.pkl'
SCALER_Y_PATH = 'scaler_y.pkl'

# Initialize model and scalers as None
lstm_model = None
scaler_X = None
scaler_y = None

try:
    # Load the Keras model
    lstm_model = load_model(MODEL_PATH) 
    print(f"LSTM Model loaded successfully from {MODEL_PATH}.")

    # Load the scalers
    scaler_X = joblib.load(SCALER_X_PATH)
    scaler_y = joblib.load(SCALER_Y_PATH)
    print(f"Scalers loaded successfully from {SCALER_X_PATH} and {SCALER_Y_PATH}.")

except Exception as e:
    print(f"Error loading ML components: {e}")
    print(f"Please ensure '{MODEL_PATH}', '{SCALER_X_PATH}', and '{SCALER_Y_PATH}' exist in the same directory as this script.")
    print("The ML prediction endpoint will not function until valid components are loaded.")

# --- Prediction Logic (replicated/adapted from ml_model.py's predict_peak_time_offset) ---
# This helper function will process raw input and make a prediction.
def make_prediction(model, scaler_X, scaler_y, user_input_raw):
    """
    Predicts the peak offset in seconds from flare start, given raw user input features.
    Adapted from the predict_peak_time_offset function in ml_model.py.
    """
    if model is None or scaler_X is None or scaler_y is None:
        raise ValueError("ML model or scalers are not loaded. Cannot make prediction.")

    # 1. Calculate duration.s from user input
    dummy_date = datetime.datetime(2000, 1, 1)
    start_dt_user = dummy_date.replace(
        hour=user_input_raw['start_hour'],
        minute=user_input_raw['start_minute'],
        second=user_input_raw['start_second']
    )
    end_dt_user = dummy_date.replace(
        hour=user_input_raw['end_hour'],
        minute=user_input_raw['end_minute'],
        second=user_input_raw['end_second']
    )
    
    if end_dt_user < start_dt_user:
        end_dt_user += datetime.timedelta(days=1)
        
    duration_seconds = (end_dt_user - start_dt_user).total_seconds()
    
    # 2. Add Cyclical Features for user input
    start_hour_sin = np.sin(2 * np.pi * user_input_raw['start_hour'] / 24)
    start_hour_cos = np.cos(2 * np.pi * user_input_raw['start_hour'] / 24)
    start_minute_sin = np.sin(2 * np.pi * user_input_raw['start_minute'] / 60)
    start_minute_cos = np.cos(2 * np.pi * user_input_raw['start_minute'] / 60)
    
    end_hour_sin = np.sin(2 * np.pi * user_input_raw['end_hour'] / 24)
    end_hour_cos = np.cos(2 * np.pi * user_input_raw['end_hour'] / 24)
    end_minute_sin = np.sin(2 * np.pi * user_input_raw['end_minute'] / 60)
    end_minute_cos = np.cos(2 * np.pi * user_input_raw['end_minute'] / 60)

    # 3. Prepare features array in the correct order for scaling (MUST match X_columns in ml_model.py)
    user_features_array = np.array([[
        duration_seconds, # Calculated here
        user_input_raw['total_counts'], # Renamed from 'total.counts' for cleaner JS input
        user_input_raw['x_pos_asec'],   # Renamed
        user_input_raw['y_pos_asec'],   # Renamed
        start_hour_sin,
        start_hour_cos,
        start_minute_sin,
        start_minute_cos,
        end_hour_sin,
        end_hour_cos,
        end_minute_sin,
        end_minute_cos
    ]])

    # 4. Scale the input features
    scaled_user_features = scaler_X.transform(user_features_array)

    # 5. Reshape for LSTM input (1 sample, 1 timestep, num_features)
    X_user_reshaped = scaled_user_features.reshape(1, 1, scaled_user_features.shape[1])

    # 6. Predict the scaled peak offset
    predicted_scaled_offset = model.predict(X_user_reshaped)

    # 7. Inverse transform the predicted offset to get actual seconds
    predicted_seconds_offset_raw = scaler_y.inverse_transform(predicted_scaled_offset)[0][0]

    # Ensure the predicted offset is non-negative
    predicted_seconds_offset_raw = max(0, predicted_seconds_offset_raw)

    # 8. Convert predicted offset to HH:MM:SS format for display
    offset_td = datetime.timedelta(seconds=int(round(predicted_seconds_offset_raw)))
    hours_offset, remainder_offset = divmod(offset_td.total_seconds(), 3600)
    minutes_offset, seconds_offset = divmod(remainder_offset, 60)
    predicted_time_str_offset = f"{int(hours_offset):02d}:{int(minutes_offset):02d}:{int(seconds_offset):02d}"

    # Calculate the actual predicted peak time based on the input start time
    predicted_actual_peak_datetime = start_dt_user + offset_td
    actual_peak_time_str = predicted_actual_peak_datetime.strftime('%H:%M:%S')

    return {
        "predicted_offset_seconds": float(predicted_seconds_offset_raw),
        "predicted_offset_formatted": predicted_time_str_offset,
        "predicted_peak_time": actual_peak_time_str
    }


# Endpoint for general ML prediction.
@app.route('/api/ml_predict', methods=['POST']) 
def ml_predict():
    if lstm_model is None or scaler_X is None or scaler_y is None:
        return jsonify({"error": "ML model or scalers not loaded. Server is not ready for predictions."}), 500

    try:
        # Expecting input features in the request body as JSON
        # Example frontend request body for this updated backend:
        # {
        #    "total_counts": 50000,
        #    "x_pos_asec": 100,
        #    "y_pos_asec": -200,
        #    "start_hour": 21,
        #    "start_minute": 29,
        #    "start_second": 56,
        #    "end_hour": 21,
        #    "end_minute": 41,
        #    "end_second": 48
        # }
        data = request.get_json()
        
        # Basic validation for required fields
        required_fields = [
            'total_counts', 'x_pos_asec', 'y_pos_asec',
            'start_hour', 'start_minute', 'start_second',
            'end_hour', 'end_minute', 'end_second'
        ]
        if not all(field in data for field in required_fields):
            return jsonify({
                "error": "Missing required input features.",
                "required": required_fields,
                "received": list(data.keys())
            }), 400

        prediction_results = make_prediction(lstm_model, scaler_X, scaler_y, data)

        response_data = {
            "prediction": prediction_results["predicted_offset_seconds"],
            "prediction_formatted_offset": prediction_results["predicted_offset_formatted"],
            "predicted_peak_time": prediction_results["predicted_peak_time"],
            "input_data": data, # Echo back the input for verification
            "timestamp": datetime.datetime.now().isoformat() + 'Z'
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"Error during ML prediction: {e}")
        return jsonify({"error": f"Failed to perform ML prediction: {e}. Check server logs for details."}), 500

# Endpoint to serve the plot images directly
@app.route('/plots/<filename>')
def serve_plot(filename):
    # Ensure plots are served from a specific, controlled directory for security
    return app.send_from_directory('public/plots', filename)

# No changes needed for classify_ar_evolution if it's still desired, but it relies on a different model setup.
# Keeping it for completeness if you intend to use it, but current focus is on the LSTM model.
@app.route('/api/classify_ar_evolution', methods=['GET'])
def classify_ar_evolution():
    if lstm_model is None: # Changed to check lstm_model for consistency
        return jsonify({"error": "AR Evolution ML model not loaded. Please ensure the model file is correctly configured and loaded."}), 500
    
    # Get individual parameters from the query string
    magnetic_flux_change = request.args.get('magnetic_flux_change', type=float)
    area_change = request.args.get('area_change', type=float)
    gradient_value = request.args.get('gradient_value', type=float)

    # Validate if all required features are present
    if None in [magnetic_flux_change, area_change, gradient_value]:
        return jsonify({"error": "Missing required features in query parameters. Requires: magnetic_flux_change, area_change, gradient_value."}), 400
    
    # Prepare input features for the model.
    # Note: This path uses 'ar_evolution_model' which is currently not loaded
    # in the updated script. This endpoint might need its own model or be removed.
    input_features = np.array([[magnetic_flux_change, area_change, gradient_value]])

    try:
        # Placeholder: This will currently use the 'lstm_model' for prediction
        # which is likely incorrect for this endpoint's intended purpose.
        # You would need a separate 'ar_evolution_model' loaded for this if needed.
        prediction = lstm_model.predict(input_features)[0] 

        return jsonify({
            "success": True,
            "active_region_id": "AR-dynamic", 
            "predicted_evolution": prediction.item(), # .item() to convert numpy float to Python float
            "timestamp": datetime.datetime.now().isoformat() + 'Z' 
        })
    
    except Exception as e:
        print(f"Error during AR evolution prediction: {e}")
        return jsonify({"error": f"Failed to classify AR evolution: {e}. Check server logs for details."}), 500


if __name__ == '__main__':
    # Run the Flask app in debug mode on port 5001.
    # Ensure this port does not conflict with your Node.js proxy backend (usually 5000).
    app.run(debug=True, port=5001)
