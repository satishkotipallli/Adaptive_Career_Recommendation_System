# 🚀 Adaptive Learning & Career Recommendation System

## 📌 Overview
An AI-powered web application that analyzes user skills and provides personalized career recommendations along with structured learning paths.
Built using hybrid machine learning techniques to bridge the gap between academic knowledge and industry requirements.

---

## ✨ Features
- AI-based career recommendation
- Skill matching using TF-IDF & cosine similarity
- Match percentage calculation
- Personalized learning paths
- Skill gap analysis
- Progress tracking dashboard
- Secure authentication (JWT)

---

## 🏗️ Tech Stack
**Frontend:** React.js  
**Backend:** Node.js, Express.js  
**Machine Learning:** Python, Scikit-learn  
**Database:** MongoDB  

---

## 🧠 How It Works
1. User inputs skills  
2. TF-IDF converts skills into vectors  
3. Cosine similarity compares with job dataset  
4. Careers ranked based on similarity  
5. Outputs recommendations + learning path  

---

## 📂 Project Structure
project/
├── backend/
├── frontend/
├── ml-engine/
└── README.md

---

## 🚀 Setup

# Clone repository
git clone https://github.com/satishkotipallli/Adaptive_Career_Recommendation_System.git

# Backend
cd backend
npm install
npm start

# Frontend
cd ../frontend
npm install
npm run dev

# ML Engine
cd ../ml-engine
pip install -r requirements.txt
python main.py

---

## 📊 Sample Output
{
  "job_role": "Data Scientist",
  "score": 0.89
}

---

## 👥 Team
- N. Mahalakshmi Surya Nandini  
- Kotipalli Satish  
- Venna Siva Ram  
- S. Victor Anil Joyson  

---

## 📜 License
For academic and educational use only.
