"""
Machine Learning Model for Accident Prediction
Uses Random Forest for classification and risk prediction
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os
from datetime import datetime


class AccidentPredictor:
    """Machine Learning model for accident risk prediction"""
    
    def __init__(self, model_path='./ml/trained_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.label_encoders = {}
        self.feature_names = []
        self.risk_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        
    def prepare_features(self, df):
        """Prepare features for ML model"""
        # Create a copy
        data = df.copy()
        
        # Extract time features
        if 'datetime' not in data.columns and 'hour' in data.columns:
            # Already has hour, add month if missing
            if 'month' not in data.columns:
                from datetime import datetime
                data['month'] = datetime.now().month  # Use current month as default
        elif 'datetime' in data.columns:
            data['datetime'] = pd.to_datetime(data['datetime'])
            data['hour'] = data['datetime'].dt.hour
            data['day_of_week'] = data['datetime'].dt.dayofweek
            data['month'] = data['datetime'].dt.month
            data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
        
        # Add time-based features
        if 'hour' in data.columns:
            data['is_rush_hour'] = data['hour'].isin([7, 8, 9, 17, 18, 19]).astype(int)
            data['is_night'] = ((data['hour'] >= 22) | (data['hour'] <= 5)).astype(int)
        
        # Encode categorical variables
        categorical_cols = ['weather', 'road_type', 'day_of_week']
        for col in categorical_cols:
            if col in data.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    data[col + '_encoded'] = self.label_encoders[col].fit_transform(data[col].astype(str))
                else:
                    # Handle unseen categories
                    data[col + '_encoded'] = data[col].apply(
                        lambda x: self.label_encoders[col].transform([str(x)])[0] 
                        if str(x) in self.label_encoders[col].classes_ 
                        else -1
                    )
        
        return data
    
    def create_risk_labels(self, df):
        """Create risk labels based on severity and casualties"""
        def get_risk_level(row):
            if row['severity'] == 'Fatal' or row['fatalities'] > 0:
                return 2  # High risk
            elif row['severity'] == 'Severe' or row['injuries'] > 3:
                return 2  # High risk
            elif row['severity'] == 'Moderate' or row['injuries'] > 0:
                return 1  # Medium risk
            else:
                return 0  # Low risk
        
        return df.apply(get_risk_level, axis=1)
    
    def train(self, csv_path='./data/accidents.csv'):
        """Train the accident prediction model"""
        print("\n" + "="*60)
        print("TRAINING ACCIDENT PREDICTION MODEL")
        print("="*60 + "\n")
        
        # Load data
        print("Loading training data...")
        df = pd.read_csv(csv_path)
        print(f"✓ Loaded {len(df)} accident records")
        
        # Prepare features
        print("\nPreparing features...")
        df = self.prepare_features(df)
        
        # Create target variable (risk level)
        y = self.create_risk_labels(df)
        
        # Select features for training
        feature_cols = [
            'latitude', 'longitude', 'hour', 
            'weather_encoded', 'road_type_encoded',
            'is_rush_hour', 'is_weekend', 'is_night',
            'vehicles_involved'
        ]
        
        # Add month if available
        if 'month' in df.columns:
            feature_cols.append('month')
        
        # Filter available features
        self.feature_names = [col for col in feature_cols if col in df.columns]
        X = df[self.feature_names]
        
        print(f"✓ Using {len(self.feature_names)} features: {', '.join(self.feature_names)}")
        print(f"\nTarget distribution:")
        print(f"  Low Risk: {sum(y == 0)} ({sum(y == 0)/len(y)*100:.1f}%)")
        print(f"  Medium Risk: {sum(y == 1)} ({sum(y == 1)/len(y)*100:.1f}%)")
        print(f"  High Risk: {sum(y == 2)} ({sum(y == 2)/len(y)*100:.1f}%)")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"\nTraining set: {len(X_train)} samples")
        print(f"Testing set: {len(X_test)} samples")
        
        # Train Random Forest model
        print("\nTraining Random Forest Classifier...")
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        print("✓ Model trained successfully")
        
        # Evaluate
        print("\n" + "-"*60)
        print("MODEL EVALUATION")
        print("-"*60)
        
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"\nAccuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, 
                                   target_names=['Low Risk', 'Medium Risk', 'High Risk']))
        
        print("\nFeature Importance:")
        for name, importance in sorted(zip(self.feature_names, self.model.feature_importances_), 
                                      key=lambda x: x[1], reverse=True):
            print(f"  {name}: {importance:.4f}")
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.save_model()
        
        print("\n" + "="*60)
        print("MODEL TRAINING COMPLETE")
        print("="*60 + "\n")
        
        return accuracy
    
    def predict_risk(self, features):
        """
        Predict accident risk for given features
        features: dict with keys ['latitude', 'longitude', 'hour', 'weather', 'road_type', etc.]
        """
        if self.model is None:
            self.load_model()
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        df = self.prepare_features(df)
        
        # Select only the features used in training
        X = df[self.feature_names]
        
        # Predict
        risk_level = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        return {
            'risk_level': self.risk_mapping[risk_level],
            'risk_score': float(probabilities[risk_level]),
            'probabilities': {
                'low': float(probabilities[0]),
                'medium': float(probabilities[1]),
                'high': float(probabilities[2])
            }
        }
    
    def predict_hotspots(self, accidents_df, grid_size=0.01):
        """Identify accident hotspots using grid-based analysis"""
        # Create grid
        lat_bins = np.arange(accidents_df['latitude'].min(), 
                            accidents_df['latitude'].max(), grid_size)
        lon_bins = np.arange(accidents_df['longitude'].min(), 
                            accidents_df['longitude'].max(), grid_size)
        
        hotspots = []
        for lat in lat_bins:
            for lon in lon_bins:
                # Count accidents in this grid cell
                mask = ((accidents_df['latitude'] >= lat) & 
                       (accidents_df['latitude'] < lat + grid_size) &
                       (accidents_df['longitude'] >= lon) & 
                       (accidents_df['longitude'] < lon + grid_size))
                
                count = mask.sum()
                if count > 5:  # Threshold for hotspot
                    hotspots.append({
                        'latitude': lat + grid_size/2,
                        'longitude': lon + grid_size/2,
                        'accident_count': int(count),
                        'severity': 'High' if count > 20 else 'Medium' if count > 10 else 'Low'
                    })
        
        return sorted(hotspots, key=lambda x: x['accident_count'], reverse=True)
    
    def save_model(self):
        """Save trained model to disk"""
        model_data = {
            'model': self.model,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'risk_mapping': self.risk_mapping
        }
        joblib.dump(model_data, self.model_path)
        print(f"✓ Model saved to {self.model_path}")
    
    def load_model(self):
        """Load trained model from disk"""
        if os.path.exists(self.model_path):
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.label_encoders = model_data['label_encoders']
            self.feature_names = model_data['feature_names']
            self.risk_mapping = model_data['risk_mapping']
            print(f"✓ Model loaded from {self.model_path}")
        else:
            raise FileNotFoundError(f"Model file not found: {self.model_path}")


if __name__ == "__main__":
    # Train the model
    predictor = AccidentPredictor()
    predictor.train()
    
    # Test prediction
    print("\nTesting prediction...")
    test_features = {
        'latitude': 32.574,
        'longitude': 74.075,
        'hour': 18,
        'weather': 'Rain',
        'road_type': 'Highway',
        'day_of_week': 'Monday',
        'vehicles_involved': 2,
        'is_weekend': 0
    }
    
    result = predictor.predict_risk(test_features)
    print(f"\nPrediction for test case:")
    print(f"  Risk Level: {result['risk_level']}")
    print(f"  Confidence: {result['risk_score']:.2%}")
    print(f"  Probabilities: Low={result['probabilities']['low']:.2%}, "
          f"Medium={result['probabilities']['medium']:.2%}, "
          f"High={result['probabilities']['high']:.2%}")
