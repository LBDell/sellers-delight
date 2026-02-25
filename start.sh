#!/bin/bash
# Start both the backend API and frontend dev server

echo "Starting Furniture Staging Tool..."

# Backend
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID) at http://localhost:8000"

# Frontend
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID) at http://localhost:3000"

echo ""
echo "Open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop"

wait $BACKEND_PID $FRONTEND_PID
