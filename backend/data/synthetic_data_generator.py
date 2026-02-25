"""
Synthetic Data Generator for Traffic Accident Portal
Generates realistic traffic accident data, road network, and weather information
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from faker import Faker
import random
import json

# Initialize Faker
fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

class TrafficDataGenerator:
    """Generate synthetic traffic accident data"""
    
    def __init__(self, num_accidents=10000):
        self.num_accidents = num_accidents
        # Sample city boundaries (roughly Gujrat, Pakistan area)
        self.lat_min, self.lat_max = 32.5, 32.7
        self.lon_min, self.lon_max = 74.0, 74.2
        
    def generate_accidents(self):
        """Generate accident records with realistic patterns"""
        print(f"Generating {self.num_accidents} synthetic accident records...")
        
        accidents = []
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2025, 12, 31)
        
        # Define accident patterns
        weather_conditions = ['Clear', 'Rain', 'Fog', 'Cloudy', 'Heavy Rain', 'Snow']
        weather_weights = [0.5, 0.2, 0.1, 0.15, 0.04, 0.01]
        
        road_types = ['Highway', 'Arterial', 'Residential', 'Intersection', 'Rural']
        road_weights = [0.25, 0.30, 0.20, 0.20, 0.05]
        
        severity_levels = ['Minor', 'Moderate', 'Severe', 'Fatal']
        severity_weights = [0.45, 0.35, 0.15, 0.05]
        
        for i in range(self.num_accidents):
            # Random timestamp with peak hours bias
            days_offset = random.randint(0, (end_date - start_date).days)
            accident_date = start_date + timedelta(days=days_offset)
            
            # Peak hours: 7-9 AM and 5-7 PM have higher accident rates
            hour = np.random.choice(range(24), p=self._get_hour_distribution())
            minute = random.randint(0, 59)
            accident_datetime = accident_date.replace(hour=hour, minute=minute)
            
            # Weather affects severity
            weather = np.random.choice(weather_conditions, p=weather_weights)
            severity = np.random.choice(severity_levels, p=severity_weights)
            
            # Worse weather increases severity
            if weather in ['Heavy Rain', 'Fog', 'Snow']:
                if random.random() > 0.6:
                    severity = np.random.choice(['Severe', 'Fatal'])
            
            # Road type
            road_type = np.random.choice(road_types, p=road_weights)
            
            # Location - create some hotspots
            if random.random() < 0.3:  # 30% in hotspot areas
                lat, lon = self._generate_hotspot_location()
            else:
                lat = random.uniform(self.lat_min, self.lat_max)
                lon = random.uniform(self.lon_min, self.lon_max)
            
            # Casualties based on severity
            casualties = self._get_casualties(severity)
            vehicles_involved = random.randint(1, 4 if severity != 'Minor' else 2)
            
            accident = {
                'id': i + 1,
                'latitude': round(lat, 6),
                'longitude': round(lon, 6),
                'datetime': accident_datetime.isoformat(),
                'date': accident_datetime.date().isoformat(),
                'time': accident_datetime.time().strftime('%H:%M:%S'),
                'day_of_week': accident_datetime.strftime('%A'),
                'hour': hour,
                'weather': weather,
                'road_type': road_type,
                'severity': severity,
                'casualties': casualties,
                'injuries': casualties['injured'],
                'fatalities': casualties['dead'],
                'vehicles_involved': vehicles_involved,
                'description': self._generate_description(severity, weather, road_type)
            }
            
            accidents.append(accident)
        
        df = pd.DataFrame(accidents)
        print(f"✓ Generated {len(df)} accident records")
        return df
    
    def _get_hour_distribution(self):
        """Create hour distribution with peak times"""
        hours = np.ones(24) * 0.02  # Base probability
        # Morning peak (7-9 AM)
        hours[7:10] = 0.06
        # Evening peak (5-8 PM)
        hours[17:21] = 0.07
        # Normalize
        return hours / hours.sum()
    
    def _generate_hotspot_location(self):
        """Generate location in a known hotspot area"""
        hotspots = [
            (32.574, 74.075),  # Hotspot 1
            (32.605, 74.120),  # Hotspot 2
            (32.550, 74.150),  # Hotspot 3
            (32.680, 74.100),  # Hotspot 4
        ]
        center_lat, center_lon = random.choice(hotspots)
        # Add small random offset
        lat = center_lat + random.uniform(-0.01, 0.01)
        lon = center_lon + random.uniform(-0.01, 0.01)
        return lat, lon
    
    def _get_casualties(self, severity):
        """Generate casualty numbers based on severity"""
        if severity == 'Minor':
            injured = random.randint(0, 2)
            dead = 0
        elif severity == 'Moderate':
            injured = random.randint(1, 5)
            dead = 0 if random.random() > 0.2 else 1
        elif severity == 'Severe':
            injured = random.randint(2, 8)
            dead = random.randint(0, 2)
        else:  # Fatal
            injured = random.randint(0, 5)
            dead = random.randint(1, 4)
        
        return {'injured': injured, 'dead': dead, 'total': injured + dead}
    
    def _generate_description(self, severity, weather, road_type):
        """Generate a brief description"""
        descriptions = {
            'Minor': f"Minor {road_type.lower()} accident during {weather.lower()} conditions",
            'Moderate': f"Moderate collision on {road_type.lower()} in {weather.lower()} weather",
            'Severe': f"Severe accident on {road_type.lower()} with {weather.lower()} conditions",
            'Fatal': f"Fatal accident on {road_type.lower()} during {weather.lower()} weather"
        }
        return descriptions.get(severity, "Traffic accident")
    
    def generate_road_network(self, num_roads=200):
        """Generate road network data"""
        print(f"Generating {num_roads} road segments...")
        
        roads = []
        road_names = [f"{fake.street_name()} {suffix}" 
                     for suffix in ['Road', 'Street', 'Avenue', 'Boulevard', 'Highway'] 
                     for _ in range(num_roads // 5)]
        
        road_types = ['Highway', 'Arterial', 'Residential', 'Rural']
        
        for i in range(num_roads):
            road = {
                'id': i + 1,
                'name': road_names[i] if i < len(road_names) else f"Road {i+1}",
                'type': random.choice(road_types),
                'traffic_volume': random.randint(100, 5000),
                'speed_limit': random.choice([30, 40, 50, 60, 80, 100, 120]),
                'lanes': random.randint(2, 6),
                'latitude': round(random.uniform(self.lat_min, self.lat_max), 6),
                'longitude': round(random.uniform(self.lon_min, self.lon_max), 6)
            }
            roads.append(road)
        
        df = pd.DataFrame(roads)
        print(f"✓ Generated {len(df)} road segments")
        return df
    
    def generate_weather_data(self, num_records=5000):
        """Generate weather data"""
        print(f"Generating {num_records} weather records...")
        
        weather_records = []
        start_date = datetime(2020, 1, 1)
        
        conditions = ['Clear', 'Rain', 'Fog', 'Cloudy', 'Heavy Rain', 'Snow']
        
        for i in range(num_records):
            record_date = start_date + timedelta(days=random.randint(0, 365*5))
            
            weather = {
                'id': i + 1,
                'date': record_date.date().isoformat(),
                'condition': random.choice(conditions),
                'temperature': round(random.uniform(-5, 45), 1),
                'humidity': round(random.uniform(20, 95), 1),
                'visibility': round(random.uniform(0.5, 10), 1),
                'wind_speed': round(random.uniform(0, 50), 1)
            }
            weather_records.append(weather)
        
        df = pd.DataFrame(weather_records)
        print(f"✓ Generated {len(df)} weather records")
        return df
    
    def save_data(self, output_dir='./data'):
        """Generate and save all data to CSV files"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        print("\n" + "="*60)
        print("TRAFFIC ACCIDENT DATA GENERATOR")
        print("="*60 + "\n")
        
        # Generate datasets
        accidents_df = self.generate_accidents()
        roads_df = self.generate_road_network()
        weather_df = self.generate_weather_data()
        
        # Save to CSV
        accidents_path = f"{output_dir}/accidents.csv"
        roads_path = f"{output_dir}/roads.csv"
        weather_path = f"{output_dir}/weather.csv"
        
        accidents_df.to_csv(accidents_path, index=False)
        roads_df.to_csv(roads_path, index=False)
        weather_df.to_csv(weather_path, index=False)
        
        print("\n" + "="*60)
        print("DATA GENERATION COMPLETE")
        print("="*60)
        print(f"\n✓ Accidents data: {accidents_path}")
        print(f"  - Total records: {len(accidents_df)}")
        print(f"  - Date range: {accidents_df['date'].min()} to {accidents_df['date'].max()}")
        print(f"  - Severity breakdown:")
        print(f"    Minor: {len(accidents_df[accidents_df['severity']=='Minor'])}")
        print(f"    Moderate: {len(accidents_df[accidents_df['severity']=='Moderate'])}")
        print(f"    Severe: {len(accidents_df[accidents_df['severity']=='Severe'])}")
        print(f"    Fatal: {len(accidents_df[accidents_df['severity']=='Fatal'])}")
        
        print(f"\n✓ Roads data: {roads_path}")
        print(f"  - Total road segments: {len(roads_df)}")
        
        print(f"\n✓ Weather data: {weather_path}")
        print(f"  - Total weather records: {len(weather_df)}")
        
        print("\n" + "="*60 + "\n")
        
        return accidents_df, roads_df, weather_df


if __name__ == "__main__":
    generator = TrafficDataGenerator(num_accidents=10000)
    generator.save_data()
