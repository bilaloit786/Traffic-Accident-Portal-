"""
Machine Learning Model for Accident Prediction
Uses Random Forest and XGBoost for classification and risk prediction
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

try:
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover - handled at runtime for optional installs
    XGBClassifier = None


class AccidentPredictor:
    """Machine Learning model for accident risk prediction"""
    
    def __init__(self, model_path='./ml/trained_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.model_name = None
        self.models = {}
        self.metrics = {}
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
                data[col] = data[col].fillna('Unknown')
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    data[col + '_encoded'] = self.label_encoders[col].fit_transform(data[col].astype(str))
                else:
                    # Handle unseen categories using fast dictionary mapping
                    mapping = {str(c): i for i, c in enumerate(self.label_encoders[col].classes_)}
                    data[col + '_encoded'] = data[col].astype(str).map(lambda x: mapping.get(x, -1))
        
        return data

    def _available_feature_names(self, df):
        """Return the model feature columns available in the prepared data."""
        feature_cols = [
            'latitude', 'longitude', 'hour',
            'weather_encoded', 'road_type_encoded',
            'is_rush_hour', 'is_weekend', 'is_night',
            'vehicles_involved'
        ]

        if 'month' in df.columns:
            feature_cols.append('month')

        return [col for col in feature_cols if col in df.columns]

    def _candidate_models(self):
        """Build the configured model candidates."""
        models = {
            'random_forest': RandomForestClassifier(
                n_estimators=250,
                max_depth=18,
                min_samples_split=8,
                min_samples_leaf=3,
                class_weight='balanced',
                random_state=42,
                n_jobs=-1
            )
        }

        if XGBClassifier is not None:
            models['xgboost'] = XGBClassifier(
                n_estimators=180,
                max_depth=4,
                learning_rate=0.06,
                subsample=0.9,
                colsample_bytree=0.9,
                objective='multi:softprob',
                eval_metric='mlogloss',
                random_state=42,
                n_jobs=-1
            )

        return models
    
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
    
    def train(self, csv_path='./data/accidents.csv', target_accuracy=0.79):
        """Train Random Forest and XGBoost accident prediction models."""
        print("\n" + "="*60)
        print("TRAINING ACCIDENT PREDICTION MODELS")
        print("="*60 + "\n")
        
        # Load data
        print("Loading training data...")
        df = pd.read_csv(csv_path)
        print(f"✓ Loaded {len(df)} accident records")

        numeric_cols = ['latitude', 'longitude', 'hour', 'vehicles_involved', 'injuries', 'fatalities']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        df = df.dropna(subset=['latitude', 'longitude', 'vehicles_involved', 'injuries', 'fatalities', 'severity'])
        print(f"✓ Using {len(df)} records after cleaning")
        
        # Prepare features
        print("\nPreparing features...")
        df = self.prepare_features(df)
        
        # Create target variable (risk level)
        y = self.create_risk_labels(df)
        
        self.feature_names = self._available_feature_names(df)
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
        
        self.models = {}
        self.metrics = {}

        print("\n" + "-"*60)
        print("MODEL TRAINING AND EVALUATION")
        print("-"*60)

        for name, model in self._candidate_models().items():
            title = 'Random Forest' if name == 'random_forest' else 'XGBoost'
            print(f"\nTraining {title} Classifier...")
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            report = classification_report(
                y_test,
                y_pred,
                target_names=['Low Risk', 'Medium Risk', 'High Risk'],
                output_dict=True,
                zero_division=0
            )
            self.models[name] = model
            self.metrics[name] = {
                'accuracy': float(accuracy),
                'classification_report': report,
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
            }
            print(f"✓ {title} accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

        self.model_name = max(self.metrics, key=lambda key: self.metrics[key]['accuracy'])
        self.model = self.models[self.model_name]
        best_accuracy = self.metrics[self.model_name]['accuracy']

        print(f"\n📊 Model Comparison:")
        for name, metrics in self.metrics.items():
            model_title = 'Random Forest' if name == 'random_forest' else 'XGBoost'
            print(f"  {model_title}: {metrics['accuracy']*100:.2f}%")

        print(f"\nBest model: {self.model_name} ({best_accuracy*100:.2f}%)")
        if best_accuracy < target_accuracy:
            print(
                f"⚠ Target accuracy was {target_accuracy*100:.2f}%, but the best honest "
                f"test accuracy is {best_accuracy*100:.2f}%."
            )

        print("\nBest Model Classification Report:")
        print(classification_report(
            y_test,
            self.model.predict(X_test),
            target_names=['Low Risk', 'Medium Risk', 'High Risk'],
            zero_division=0
        ))

        if hasattr(self.model, 'feature_importances_'):
            print("\nFeature Importance:")
            for name, importance in sorted(zip(self.feature_names, self.model.feature_importances_),
                                          key=lambda x: x[1], reverse=True):
                print(f"  {name}: {importance:.4f}")
        
        # Save all trained models  
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.save_model()
        
        print("\n✓ Both Random Forest and XGBoost models trained and saved")
        print("="*60)
        print("MODEL TRAINING COMPLETE")
        print("="*60 + "\n")
        
        return best_accuracy
    
    def predict_risk(self, features):
        """
        Predict accident risk for given features using both models
        features: dict with keys ['latitude', 'longitude', 'hour', 'weather', 'road_type', etc.]
        Returns predictions from both Random Forest and XGBoost
        """
        if self.model is None:
            self.load_model()
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        df = self.prepare_features(df)
        
        # Select only the features used in training
        X = df[self.feature_names]
        
        results = {}
        
        # Random Forest prediction
        if 'random_forest' in self.models:
            rf_model = self.models['random_forest']
            rf_risk_level = rf_model.predict(X)[0]
            rf_probabilities = rf_model.predict_proba(X)[0]
            results['random_forest'] = {
                'risk_level': self.risk_mapping[rf_risk_level],
                'risk_score': float(rf_probabilities[rf_risk_level]),
                'probabilities': {
                    'low': float(rf_probabilities[0]),
                    'medium': float(rf_probabilities[1]),
                    'high': float(rf_probabilities[2])
                }
            }
        
        # XGBoost prediction
        if 'xgboost' in self.models:
            xgb_model = self.models['xgboost']
            xgb_risk_level = xgb_model.predict(X)[0]
            xgb_probabilities = xgb_model.predict_proba(X)[0]
            results['xgboost'] = {
                'risk_level': self.risk_mapping[xgb_risk_level],
                'risk_score': float(xgb_probabilities[xgb_risk_level]),
                'probabilities': {
                    'low': float(xgb_probabilities[0]),
                    'medium': float(xgb_probabilities[1]),
                    'high': float(xgb_probabilities[2])
                }
            }
        
        # If only one model available, use that
        if len(results) == 1:
            model_name = list(results.keys())[0]
            return {
                **results[model_name],
                'model_used': model_name
            }
        
        # Return both predictions
        return {
            'random_forest': results.get('random_forest'),
            'xgboost': results.get('xgboost'),
            'ensemble_risk_level': self._ensemble_prediction(results)
        }
    
    def _ensemble_prediction(self, results):
        """Combine predictions from both models"""
        if 'random_forest' not in results or 'xgboost' not in results:
            for model_key in results:
                if results[model_key]:
                    return results[model_key]['risk_level']
            return 'Medium'
        
        # Voting mechanism: takes the higher risk level
        risk_levels = [results['random_forest']['risk_level'], results['xgboost']['risk_level']]
        risk_order = {'Low': 0, 'Medium': 1, 'High': 2}
        max_risk = max(risk_levels, key=lambda x: risk_order[x])
        return max_risk
    
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
            'model_name': self.model_name,
            'models': self.models,
            'metrics': self.metrics,
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
            self.model_name = model_data.get('model_name', 'random_forest')
            self.models = model_data.get('models', {self.model_name: self.model})
            self.metrics = model_data.get('metrics', {})
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
    print("\nTesting prediction with both models...")
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
    print(f"\n{'='*60}")
    print("PREDICTION RESULTS")
    print(f"{'='*60}")
    
    # Check if both models are available
    if result.get('random_forest') and result.get('xgboost'):
        print("\n🌲 RANDOM FOREST:")
        print(f"  Risk Level: {result['random_forest']['risk_level']}")
        print(f"  Confidence: {result['random_forest']['risk_score']:.2%}")
        print(f"  Probabilities: Low={result['random_forest']['probabilities']['low']:.2%}, "
              f"Medium={result['random_forest']['probabilities']['medium']:.2%}, "
              f"High={result['random_forest']['probabilities']['high']:.2%}")
        
        print("\n🚀 XGBOOST:")
        print(f"  Risk Level: {result['xgboost']['risk_level']}")
        print(f"  Confidence: {result['xgboost']['risk_score']:.2%}")
        print(f"  Probabilities: Low={result['xgboost']['probabilities']['low']:.2%}, "
              f"Medium={result['xgboost']['probabilities']['medium']:.2%}, "
              f"High={result['xgboost']['probabilities']['high']:.2%}")
        
        print(f"\n🎯 ENSEMBLE PREDICTION:")
        print(f"  Risk Level: {result['ensemble_risk_level']}")
    else:
        # Fallback if only single model
        print("\n  Risk Level: {result.get('risk_level', 'Unknown')}")
        print(f"  Confidence: {result.get('risk_score', 0):.2%}")
    
    print(f"\n{'='*60}")
