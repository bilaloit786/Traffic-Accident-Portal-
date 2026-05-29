"""
Database configuration and models for Traffic Accident Portal
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Date, Time, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./traffic_db.db")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Accident(Base):
    """Accident records table"""
    __tablename__ = "accidents"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    datetime = Column(DateTime, nullable=False, index=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    day_of_week = Column(String(20))
    hour = Column(Integer, index=True)
    weather = Column(String(50), index=True)
    road_type = Column(String(50), index=True)
    severity = Column(String(20), index=True)
    injuries = Column(Integer, default=0)
    fatalities = Column(Integer, default=0)
    vehicles_involved = Column(Integer, default=1)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Road(Base):
    """Road network table"""
    __tablename__ = "roads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), index=True)
    traffic_volume = Column(Integer)
    speed_limit = Column(Integer)
    lanes = Column(Integer)
    latitude = Column(Float)
    longitude = Column(Float)


class Weather(Base):
    """Weather data table"""
    __tablename__ = "weather"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    condition = Column(String(50))
    temperature = Column(Float)
    humidity = Column(Float)
    visibility = Column(Float)
    wind_speed = Column(Float)


class Prediction(Base):
    """Accident predictions table"""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    risk_probability = Column(Float)
    prediction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    factors = Column(Text)  # JSON string of contributing factors


class User(Base):
    """User table for authentication and roles"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="user")  # admin, traffic_police, user
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LoginAudit(Base):
    """Login audit table for admin security monitoring"""
    __tablename__ = "login_audit"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=True)
    ip_address = Column(String(80))
    user_agent = Column(Text)
    success = Column(Integer, default=0, index=True)
    failure_reason = Column(String(120))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


# Database dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")


def load_csv_data():
    """Load data from CSV files into database"""
    import pandas as pd
    from sqlalchemy.orm import Session
    
    db = SessionLocal()
    
    try:
        # Load accidents
        accidents_df = pd.read_csv('./data/accidents.csv')
        accidents_df['datetime'] = pd.to_datetime(accidents_df['datetime'])
        accidents_df['date'] = pd.to_datetime(accidents_df['date'])
        accidents_df['time'] = pd.to_datetime(accidents_df['time'], format='%H:%M:%S').dt.time
        
        print(f"Loading {len(accidents_df)} accident records...")
        for _, row in accidents_df.iterrows():
            accident = Accident(
                id=row['id'],
                latitude=row['latitude'],
                longitude=row['longitude'],
                datetime=row['datetime'],
                date=row['date'],
                time=row['time'],
                day_of_week=row['day_of_week'],
                hour=row['hour'],
                weather=row['weather'],
                road_type=row['road_type'],
                severity=row['severity'],
                injuries=row['injuries'],
                fatalities=row['fatalities'],
                vehicles_involved=row['vehicles_involved'],
                description=row['description']
            )
            db.add(accident)
        
        # Load roads
        roads_df = pd.read_csv('./data/roads.csv')
        print(f"Loading {len(roads_df)} road records...")
        for _, row in roads_df.iterrows():
            road = Road(
                id=row['id'],
                name=row['name'],
                type=row['type'],
                traffic_volume=row['traffic_volume'],
                speed_limit=row['speed_limit'],
                lanes=row['lanes'],
                latitude=row['latitude'],
                longitude=row['longitude']
            )
            db.add(road)
        
        # Load weather
        weather_df = pd.read_csv('./data/weather.csv')
        weather_df['date'] = pd.to_datetime(weather_df['date'])
        print(f"Loading {len(weather_df)} weather records...")
        for _, row in weather_df.iterrows():
            weather = Weather(
                id=row['id'],
                date=row['date'],
                condition=row['condition'],
                temperature=row['temperature'],
                humidity=row['humidity'],
                visibility=row['visibility'],
                wind_speed=row['wind_speed']
            )
            db.add(weather)
        
        db.commit()
        print("✓ All data loaded successfully")
        
    except Exception as e:
        print(f"Error loading data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("\nLoading CSV data...")
    load_csv_data()
