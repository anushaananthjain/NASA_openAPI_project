import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping
import joblib 
from datetime import datetime, timedelta 
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_absolute_error
import os 


print("--- Starting Solar Flare Peak Time Prediction Model Development ---")

# --- 1. Data Loading and Initial Datetime Conversion ---

data_path = 'solar_flare_dataset.csv'
try:
    data = pd.read_csv(data_path)
except FileNotFoundError:
    print(f"Error: Dataset not found at {data_path}. Please ensure 'solar_flare_dataset.csv' is in the same directory.")
    exit()

print("Original data head:")
print(data.head())


data['start_datetime'] = pd.to_datetime(data['start.date'].astype(str) + ' ' + data['start.time'], errors='coerce')
data['end_datetime'] = pd.to_datetime(data['start.date'].astype(str) + ' ' + data['end'], errors='coerce')
data['peak_datetime'] = pd.to_datetime(data['start.date'].astype(str) + ' ' + data['peak'], errors='coerce')

initial_rows = len(data)
data.dropna(subset=['start_datetime', 'end_datetime', 'peak_datetime'], inplace=True)
print(f"\nData after initial datetime parsing and dropping NaNs: {len(data)} rows (Dropped {initial_rows - len(data)} rows).")

if data.empty:
    print("Error: DataFrame is empty after initial datetime parsing and dropping NaNs. Cannot proceed.")
    exit()

# --- 2. Feature Engineering: Target Variable (Peak Offset in Seconds) ---
data['peak_offset_seconds'] = (data['peak_datetime'] - data['start_datetime']).dt.total_seconds()


initial_rows_after_offset_calc = len(data)
data = data[data['peak_offset_seconds'] >= 0].copy()
print(f"Data after filtering out negative peak offsets: {len(data)} rows (Dropped {initial_rows_after_offset_calc - len(data)} rows).")
print("\nSample peak_offset_seconds:")
print(data['peak_offset_seconds'].head())

if data.empty:
    print("Error: DataFrame is empty after filtering out negative peak offsets. Cannot proceed.")
    exit()

# --- 3. Feature Engineering: Cyclical Time Features ---

def add_cyclical_features(df, dt_col_name, time_unit, max_val, prefix=""):
    if dt_col_name not in df.columns:
        print(f"Warning: Datetime column '{dt_col_name}' not found in DataFrame.")
        return df 

    
    if not pd.api.types.is_datetime64_any_dtype(df[dt_col_name]):
        print(f"Warning: Column '{dt_col_name}' is not datetime type. Attempting conversion.")
        df[dt_col_name] = pd.to_datetime(df[dt_col_name], errors='coerce')
        df.dropna(subset=[dt_col_name], inplace=True) 
        if df.empty:
            print(f"Error: DataFrame became empty after re-coercing '{dt_col_name}' to datetime. Returning empty df.")
            return pd.DataFrame()


    if time_unit == 'hour':
        value_series = df[dt_col_name].dt.hour
    elif time_unit == 'minute':
        value_series = df[dt_col_name].dt.minute
    elif time_unit == 'second':
        value_series = df[dt_col_name].dt.second
    else:
        raise ValueError(f"Unsupported time_unit: {time_unit}. Must be 'hour', 'minute', or 'second'.")

    
    if value_series.isnull().any():
        print(f"Warning: NaNs found in '{dt_col_name}.dt.{time_unit}'. These rows will result in NaNs for cyclical features.")
        

    df[f'{prefix}{time_unit}_sin'] = np.sin(2 * np.pi * value_series / max_val)
    df[f'{prefix}{time_unit}_cos'] = np.cos(2 * np.pi * value_series / max_val)
    return df

print("\n--- Adding Cyclical Features ---")

data = add_cyclical_features(data, 'start_datetime', 'hour', 24, 'start_')
print(f"Columns after start_hour features: {data.columns.tolist()}")

data = add_cyclical_features(data, 'start_datetime', 'minute', 60, 'start_')
print(f"Columns after start_minute features: {data.columns.tolist()}")

data = add_cyclical_features(data, 'end_datetime', 'hour', 24, 'end_')
print(f"Columns after end_hour features: {data.columns.tolist()}")

data = add_cyclical_features(data, 'end_datetime', 'minute', 60, 'end_')
print(f"Columns after end_minute features: {data.columns.tolist()}")


# data = add_cyclical_features(data, 'start_datetime', 'second', 60, 'start_')
# data = add_cyclical_features(data, 'end_datetime', 'second', 60, 'end_')

print("\nFinal columns before defining X and y:")
print(data.columns.tolist())


# --- 4. Define Features (X) and Target (y) ---

X_columns = [
    'duration.s', 'total.counts', 'x.pos.asec', 'y.pos.asec',
    'start_hour_sin', 'start_hour_cos',
    'start_minute_sin', 'start_minute_cos',
    'end_hour_sin', 'end_hour_cos',
    'end_minute_sin', 'end_minute_cos'
]


missing_columns = [col for col in X_columns if col not in data.columns]
if missing_columns:
    print(f"Error: The following required X_columns are missing after feature engineering: {missing_columns}")
    print("Please check the feature engineering steps.")
    exit()


print("\nChecking for NaNs in X_columns and target before final dropna...")
for col in X_columns + ['peak_offset_seconds']:
    if col in data.columns:
        print(f"NaNs in '{col}': {data[col].isna().sum()}")
    else:
        print(f"Column '{col}' not found for NaN check.") # Should not happen if missing_columns check passes

initial_rows_before_final_dropna = len(data)
data.dropna(subset=X_columns + ['peak_offset_seconds'], inplace=True)
print(f"Data after dropping NaNs in X_columns and target: {len(data)} rows (Dropped {initial_rows_before_final_dropna - len(data)} rows).")

if data.empty:
    print("Error: DataFrame is empty after dropping NaNs for model training. Cannot proceed.")
    exit()

X = data[X_columns].values
y = data['peak_offset_seconds'].values.reshape(-1, 1) 

print(f"\nFeatures (X) shape: {X.shape}")
print(f"Target (y) shape: {y.shape}")

# --- 5. Scaling Features (X) and Target (y) ---
scaler_X = MinMaxScaler()
X_scaled = scaler_X.fit_transform(X)

scaler_y = MinMaxScaler()
y_scaled = scaler_y.fit_transform(y)


X_reshaped = X_scaled.reshape(-1, 1, X_scaled.shape[1])


# --- 6. Train-Test Split ---

X_train, X_test, y_train, y_test = train_test_split(X_reshaped, y_scaled, test_size=0.2, random_state=42)

# print(f"\nShape of X_train: {X_train.shape}")
# print(f"Shape of y_train: {y_train.shape}")
# print(f"Shape of X_test: {X_test.shape}")
# print(f"Shape of y_test: {y_test.shape}")


# --- 7. Build and Train LSTM Model ---
def build_lstm_model(input_shape):
    model = keras.Sequential([
        keras.Input(shape=input_shape),
        layers.LSTM(128, return_sequences=True), 
        layers.Dropout(0.3), 
        layers.LSTM(64), 
        layers.Dense(1)  
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

input_shape = (X_train.shape[1], X_train.shape[2])
model = build_lstm_model(input_shape)
model.summary()


early_stopping = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True) # Increased patience

print("\n--- Training Model ---")
history = model.fit(
    X_train, y_train,
    epochs=200, 
    batch_size=64,
    validation_split=0.2, 
    callbacks=[early_stopping],
    verbose=1
)

# --- 8. Evaluate Model on Test Set ---
print("\n--- Evaluating Model on Separate Test Set ---")
loss, mae = model.evaluate(X_test, y_test, verbose=1)
print(f"Test Loss (MSE): {loss:.4f}")
print(f"Test MAE (Mean Absolute Error on scaled values): {mae:.4f}")


y_pred_scaled = model.predict(X_test)
y_pred_original_units = scaler_y.inverse_transform(y_pred_scaled)
y_test_original_units = scaler_y.inverse_transform(y_test)
mae_original_units = mean_absolute_error(y_test_original_units, y_pred_original_units)
print(f"Test MAE (in seconds): {mae_original_units:.2f} seconds")


# --- 9. Save the Trained Model and Scalers ---

model.save('solar_flare_peak_time_predictor_lstm_model.h5')
print("\nModel saved to 'solar_flare_peak_time_predictor_lstm_model.h5'")

joblib.dump(scaler_X, 'scaler_X.pkl')
joblib.dump(scaler_y, 'scaler_y.pkl')
print("Scalers saved to 'scaler_X.pkl' and 'scaler_y.pkl'")


# --- 10. Prediction Function (Improved and Corrected) ---
def predict_peak_time_offset(model, scaler_X, scaler_y, user_input_raw):
    
    # 1. Calculate duration.s from user input
  
    dummy_date = datetime(2000, 1, 1)
    start_dt_user = dummy_date.replace(hour=user_input_raw['start_hour'], minute=user_input_raw['start_minute'], second=user_input_raw['start_second'])
    end_dt_user = dummy_date.replace(hour=user_input_raw['end_hour'], minute=user_input_raw['end_minute'], second=user_input_raw['end_second'])
    
    
    if end_dt_user < start_dt_user:
        end_dt_user += timedelta(days=1)
        
    duration_seconds = (end_dt_user - start_dt_user).total_seconds()
    user_input_raw['duration.s'] = duration_seconds

    # 2. Add Cyclical Features for user input
    user_input_raw['start_hour_sin'] = np.sin(2 * np.pi * user_input_raw['start_hour'] / 24)
    user_input_raw['start_hour_cos'] = np.cos(2 * np.pi * user_input_raw['start_hour'] / 24)
    user_input_raw['start_minute_sin'] = np.sin(2 * np.pi * user_input_raw['start_minute'] / 60)
    user_input_raw['start_minute_cos'] = np.cos(2 * np.pi * user_input_raw['start_minute'] / 60)
    
    user_input_raw['end_hour_sin'] = np.sin(2 * np.pi * user_input_raw['end_hour'] / 24)
    user_input_raw['end_hour_cos'] = np.cos(2 * np.pi * user_input_raw['end_hour'] / 24)
    user_input_raw['end_minute_sin'] = np.sin(2 * np.pi * user_input_raw['end_minute'] / 60)
    user_input_raw['end_minute_cos'] = np.cos(2 * np.pi * user_input_raw['end_minute'] / 60)

    # 3. Prepare features array in the correct order for scaling (must match X_columns used in training)

    user_features_array = np.array([[
        user_input_raw['duration.s'],
        user_input_raw['total.counts'],
        user_input_raw['x.pos.asec'],
        user_input_raw['y.pos.asec'],
        user_input_raw['start_hour_sin'],
        user_input_raw['start_hour_cos'],
        user_input_raw['start_minute_sin'],
        user_input_raw['start_minute_cos'],
        user_input_raw['end_hour_sin'],
        user_input_raw['end_hour_cos'],
        user_input_raw['end_minute_sin'],
        user_input_raw['end_minute_cos']
    ]])

    # 4. Scale the input features using the fitted scaler_X
    scaled_user_features = scaler_X.transform(user_features_array)

    # 5. Reshape for LSTM input (1 sample, 1 timestep, num_features)
    X_user_reshaped = scaled_user_features.reshape(1, 1, scaled_user_features.shape[1])

    # 6. Predict the scaled peak offset
    predicted_scaled_offset = model.predict(X_user_reshaped)

    # 7. Inverse transform the predicted offset to get actual seconds
    predicted_seconds_offset_raw = scaler_y.inverse_transform(predicted_scaled_offset)[0][0]

    predicted_seconds_offset_raw = max(0, predicted_seconds_offset_raw)

    # ---8. Convert predicted offset to HH:MM:SS format---
   
    offset_td = timedelta(seconds=int(round(predicted_seconds_offset_raw)))
    
    hours_offset, remainder_offset = divmod(offset_td.total_seconds(), 3600)
    minutes_offset, seconds_offset = divmod(remainder_offset, 60)
    predicted_time_str_offset = f"{int(hours_offset):02d}:{int(minutes_offset):02d}:{int(seconds_offset):02d}"

 
    dummy_start_datetime = datetime(2000, 1, 1, user_input_raw['start_hour'], user_input_raw['start_minute'], user_input_raw['start_second'])
    predicted_actual_peak_datetime = dummy_start_datetime + offset_td
    actual_peak_time_str = predicted_actual_peak_datetime.strftime('%H:%M:%S')

    return predicted_seconds_offset_raw, predicted_time_str_offset, actual_peak_time_str

# --- Example Usage for Prediction ---
print("\n--- Testing Prediction Function with Sample Input ---")


# from tensorflow.keras.models import load_model
# model = load_model('solar_flare_peak_time_predictor_lstm_model.h5')
# scaler_X = joblib.load('scaler_X.pkl')
# scaler_y = joblib.load('scaler_y.pkl')

user_input_example = {
    'total.counts': 50000,
    'x.pos.asec': 100,
    'y.pos.asec': -200,
    'start_hour': 21,
    'start_minute': 29,
    'start_second': 56,
    'end_hour': 21,
    'end_minute': 41,
    'end_second': 48
}

predicted_offset_seconds, predicted_offset_str, actual_predicted_peak_time_str = predict_peak_time_offset(model, scaler_X, scaler_y, user_input_example)

print(f"Input Flare Start Time: {user_input_example['start_hour']:02d}:{user_input_example['start_minute']:02d}:{user_input_example['start_second']:02d}")
print(f"Predicted Peak Offset from Start: {predicted_offset_seconds:.2f} seconds ({predicted_offset_str})")
print(f"Predicted Absolute Peak Time: {actual_predicted_peak_time_str}")


sns.set_theme(style="whitegrid")

PLOTS_DIR = 'public/plots'
os.makedirs(PLOTS_DIR, exist_ok=True) 
print(f"Saving plots to: {os.path.abspath(PLOTS_DIR)}") 

# --- 1. Plot Training History ---
def plot_training_history(history):
    
    plt.figure(figsize=(14, 7)) 

    # Plot loss
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    if 'val_loss' in history.history:
        plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Training Progress: Loss Over Epochs', fontsize=16) 
    plt.xlabel('Epoch', fontsize=12)
    plt.ylabel('Loss (Mean Squared Error)', fontsize=12) 
    plt.legend(fontsize=10)
    plt.grid(True)

    # Plot MAE
    plt.subplot(1, 2, 2) 
    plt.plot(history.history['mae'], label='Training MAE')
    if 'val_mae' in history.history:
        plt.plot(history.history['val_mae'], label='Validation MAE')
    plt.title('Model Training Progress: Mean Absolute Error Over Epochs', fontsize=16) 
    plt.xlabel('Epoch', fontsize=12)
    plt.ylabel('Mean Absolute Error', fontsize=12)
    plt.legend(fontsize=10)
    plt.grid(True)

    plt.tight_layout() 
    plt.savefig(os.path.join(PLOTS_DIR, 'training_history_plot.png')) 
    plt.close() 


# --- 2. Plot Actual vs. Predicted Values ---
def plot_actual_vs_predicted(y_true, y_pred, title='Actual vs. Predicted Peak Offsets'):
    plt.figure(figsize=(9, 9)) 
    plt.scatter(y_true, y_pred, alpha=0.6, s=10) 
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--', lw=2, label='Ideal Prediction') # Ideal line
    plt.xlabel('Actual Peak Offset (seconds)', fontsize=12)
    plt.ylabel('Predicted Peak Offset (seconds)', fontsize=12)
    plt.title('Actual vs. Predicted Solar Flare Peak Offsets', fontsize=16) 
    plt.grid(True)
    plt.gca().set_aspect('equal', adjustable='box') 
    plt.legend(fontsize=10)
    plt.savefig(os.path.join(PLOTS_DIR, 'actual_vs_predicted_plot.png')) 
    plt.close() 

# --- 3. Plot Residuals ---
def plot_residuals(y_true, y_pred, title='Residual Plot'):
    residuals = y_true - y_pred
    plt.figure(figsize=(12, 7)) 
    plt.scatter(y_pred, residuals, alpha=0.6, s=10) 
    plt.axhline(y=0, color='r', linestyle='--', lw=2, label='Zero Error Line') 
    plt.xlabel('Predicted Peak Offset (seconds)', fontsize=12)
    plt.ylabel('Residual (Actual - Predicted) (seconds)', fontsize=12)
    plt.title('Residuals of Solar Flare Peak Offset Predictions', fontsize=16) 
    plt.grid(True)
    plt.legend(fontsize=10)
    plt.savefig(os.path.join(PLOTS_DIR, 'residuals_plot.png')) 
    plt.close() 


print("\n--- Generating Plots ---")
plot_training_history(history)
plot_actual_vs_predicted(y_test_original_units, y_pred_original_units)
plot_residuals(y_test_original_units, y_pred_original_units)


print("\n--- Model Development and Prediction Process Complete ---")
