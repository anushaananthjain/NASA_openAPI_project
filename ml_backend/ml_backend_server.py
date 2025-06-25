from flask import Flask, request, jsonify
import numpy as np
from flask_cors import CORS
import datetime
import joblib   
from tensorflow.keras.models import load_model 
import os 

app = Flask(__name__)
CORS(app) 


MODEL_PATH = 'solar_flare_peak_time_predictor_lstm_model.h5'
SCALER_X_PATH = 'scaler_X.pkl'
SCALER_Y_PATH = 'scaler_y.pkl'


lstm_model = None
scaler_X = None
scaler_y = None

try:
    
    lstm_model = load_model(MODEL_PATH) 
    print(f"LSTM Model loaded successfully from {MODEL_PATH}.")

    
    scaler_X = joblib.load(SCALER_X_PATH)
    scaler_y = joblib.load(SCALER_Y_PATH)
    print(f"Scalers loaded successfully from {SCALER_X_PATH} and {SCALER_Y_PATH}.")

except Exception as e:
    print(f"Error loading ML components: {e}")
    print(f"Please ensure '{MODEL_PATH}', '{SCALER_X_PATH}', and '{SCALER_Y_PATH}' exist in the same directory as this script.")
    print("The ML prediction endpoint will not function until valid components are loaded.")


def make_prediction(model, scaler_X, scaler_y, user_input_raw):
    """
    Predicts the peak offset in seconds from flare start, given raw user input features.
    Adapted from the predict_peak_time_offset function in ml_model.py.
    """
    if model is None or scaler_X is None or scaler_y is None:
        raise ValueError("ML model or scalers are not loaded. Cannot make prediction.")

    
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
    
    
    start_hour_sin = np.sin(2 * np.pi * user_input_raw['start_hour'] / 24)
    start_hour_cos = np.cos(2 * np.pi * user_input_raw['start_hour'] / 24)
    start_minute_sin = np.sin(2 * np.pi * user_input_raw['start_minute'] / 60)
    start_minute_cos = np.cos(2 * np.pi * user_input_raw['start_minute'] / 60)
    
    end_hour_sin = np.sin(2 * np.pi * user_input_raw['end_hour'] / 24)
    end_hour_cos = np.cos(2 * np.pi * user_input_raw['end_hour'] / 24)
    end_minute_sin = np.sin(2 * np.pi * user_input_raw['end_minute'] / 60)
    end_minute_cos = np.cos(2 * np.pi * user_input_raw['end_minute'] / 60)

    
    user_features_array = np.array([[
        duration_seconds, 
        user_input_raw['total_counts'], 
        user_input_raw['x_pos_asec'],   
        user_input_raw['y_pos_asec'],   
        start_hour_sin,
        start_hour_cos,
        start_minute_sin,
        start_minute_cos,
        end_hour_sin,
        end_hour_cos,
        end_minute_sin,
        end_minute_cos
    ]])

   
    scaled_user_features = scaler_X.transform(user_features_array)

    
    X_user_reshaped = scaled_user_features.reshape(1, 1, scaled_user_features.shape[1])

    
    predicted_scaled_offset = model.predict(X_user_reshaped)

    
    predicted_seconds_offset_raw = scaler_y.inverse_transform(predicted_scaled_offset)[0][0]

    
    predicted_seconds_offset_raw = max(0, predicted_seconds_offset_raw)

    
    offset_td = datetime.timedelta(seconds=int(round(predicted_seconds_offset_raw)))
    hours_offset, remainder_offset = divmod(offset_td.total_seconds(), 3600)
    minutes_offset, seconds_offset = divmod(remainder_offset, 60)
    predicted_time_str_offset = f"{int(hours_offset):02d}:{int(minutes_offset):02d}:{int(seconds_offset):02d}"

    
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
      
        data = request.get_json()
        
        
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
            "input_data": data, 
            "timestamp": datetime.datetime.now().isoformat() + 'Z'
        }

        return jsonify(response_data)

    except Exception as e:
        print(f"Error during ML prediction: {e}")
        return jsonify({"error": f"Failed to perform ML prediction: {e}. Check server logs for details."}), 500


@app.route('/plots/<filename>')
def serve_plot(filename):
   
    return app.send_from_directory('public/plots', filename)

@app.route('/api/classify_ar_evolution', methods=['GET'])
def classify_ar_evolution():
    if lstm_model is None: 
        return jsonify({"error": "AR Evolution ML model not loaded. Please ensure the model file is correctly configured and loaded."}), 500
    
    
    magnetic_flux_change = request.args.get('magnetic_flux_change', type=float)
    area_change = request.args.get('area_change', type=float)
    gradient_value = request.args.get('gradient_value', type=float)

  
    if None in [magnetic_flux_change, area_change, gradient_value]:
        return jsonify({"error": "Missing required features in query parameters. Requires: magnetic_flux_change, area_change, gradient_value."}), 400
    
    
    input_features = np.array([[magnetic_flux_change, area_change, gradient_value]])

    try:
        prediction = lstm_model.predict(input_features)[0] 

        return jsonify({
            "success": True,
            "active_region_id": "AR-dynamic", 
            "predicted_evolution": prediction.item(), 
            "timestamp": datetime.datetime.now().isoformat() + 'Z' 
        })
    
    except Exception as e:
        print(f"Error during AR evolution prediction: {e}")
        return jsonify({"error": f"Failed to classify AR evolution: {e}. Check server logs for details."}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)
