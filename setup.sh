#!/bin/bash

# Traffic Accident Portal - Setup Script
# This script sets up the complete application

echo "=================================="
echo "Traffic Accident Portal Setup"
echo "=================================="
echo ""

echo "Step 1: Installing Backend Dependencies..."
cd backend
pip install fastapi uvicorn sqlalchemy pandas numpy scikit-learn faker python-dotenv -q

echo "✓ Backend dependencies installed"
echo ""

echo "Step 2: Generating Synthetic Data..."
python data/synthetic_data_generator.py

echo "✓ Synthetic data generated"
echo ""

echo "Step 3: Initializing Database..."
python app/database.py

echo "✓ Database initialized"
echo ""

echo "Step 4: Training ML Model..."
python ml/model.py

echo "✓ ML model trained"
echo ""

echo "Step 5: Installing Frontend Dependencies..."
cd ../frontend
npm install

echo "✓ Frontend dependencies installed"
echo ""

echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo "=================================="
