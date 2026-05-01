
### How to Run the Project for Review-2

#### Prerequisites
*   Node.js & npm installed
*   Python 3.x installed
*   MongoDB running locally on port 27017

#### 1. Start MongoDB
Ensure MongoDB is running. If you have it installed as a service, it should be running already.

#### 2. Start ML Microservice
Open a terminal:
```bash
cd ml_service
pip install -r requirements.txt
python main.py
```
*   Server runs at `http://localhost:8000`

#### 3. Start Backend
Open a new terminal:
```bash
cd backend
npm install
npm start
```
*   Server runs at `http://localhost:5000`

#### 4. Start Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*   App runs at `http://localhost:3000` (or similar)

### Demo Flow for Review
1.  Open Frontend (`http://localhost:3000`).
2.  **Register** a new user.
3.  **Login** with credentials.
4.  Go to **Dashboard**.
5.  Enter skills (e.g., `python, machine learning`).
6.  Click **Get Recommendations**.
7.  View the list of recommended careers with scores.

### Troubleshooting
*   **ML Service Error**: Ensure `dataset/job_skills.csv` exists.
*   **Backend Error**: Ensure MongoDB is running and `.env` file is correct.
*   **CORS Error**: Ensure Backend allows requests from Frontend (configured in `server.js`).
