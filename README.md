# Traffic Accident Prediction & Analysis Portal

A comprehensive web-based platform for predicting and analyzing traffic accidents using machine learning. Built for ILM College Gujrat Final Year Project 2025.

## 🎯 Features

- **Interactive Dashboard** - Real-time statistics and insights
- **Live Map Visualization** - Accident locations and hotspot zones
- **Advanced Analytics** - Charts and graphs for data analysis
- **ML-Powered Predictions** - Accident risk prediction using Random Forest
- **Modern UI** - Dark theme with glassmorphism effects

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL/SQLite** - Database
- **Scikit-learn** - Machine learning
- **Pandas & NumPy** - Data processing
- **SQLAlchemy** - ORM

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **Axios** - HTTP client

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, SQLite works by default)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data
python data/synthetic_data_generator.py

# Initialize database and load data
python app/database.py

# Train ML model
python ml/model.py

# Run server
uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000
- API Documentation: http://localhost:8000/api/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at http://localhost:5173

## 🚀 Quick Start

1. **Generate Data**: Run the synthetic data generator to create realistic accident data
2. **Train Model**: Train the ML model on the generated data
3. **Start Backend**: Run the FastAPI server
4. **Start Frontend**: Run the React development server  
5. **Access Portal**: Open http://localhost:5173 in your browser

## 📊 API Endpoints

### Accidents
- `GET /api/accidents` - List accidents with filters
- `GET /api/accidents/{id}` - Get specific accident
- `GET /api/accidents/heatmap/data` - Get heatmap data
- `GET /api/accidents/timeline/hourly` - Hourly distribution

### Predictions
- `POST /api/predictions/predict` - Predict accident risk
- `GET /api/predictions/hotspots` - Get accident hotspots
- `GET /api/predictions/risk-zones` - Get risk zones

### Statistics
- `GET /api/stats/overview` - Overall statistics
- `GET /api/stats/by-time` - Time distribution
- `GET /api/stats/by-weather` - Weather analysis
- `GET /api/stats/by-road-type` - Road type analysis

## 📁 Project Structure

```
traffic-portal/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── database.py       # Database models
│   │   └── routes/          # API routes
│   ├── ml/
│   │   └── model.py         # ML model
│   ├── data/
│   │   └── synthetic_data_generator.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages
│   │   ├── components/      # React components
│   │   ├── App.jsx          # Main app
│   │   └── main.jsx         # Entry point
│   └── package.json
└── README.md
```

## 👥 Team

- **Zainab Shafqat** - Frontend Development & UI/UX
- **Fariha Iftikhar** - Backend Development & API
- **Sania Mubashir** - Machine Learning & Data Analysis

**Supervisor**: Mr. Muhammad Bilal

## 📄 License

This project is developed as part of the academic curriculum at ILM College Gujrat, Pakistan.

## 🙏 Acknowledgments

- ILM College Gujrat - Faculty of Computing
- University of Gujrat
- All contributors and supervisors
