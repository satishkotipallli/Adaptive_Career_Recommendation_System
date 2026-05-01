# System Architecture Design

## 1. High-Level Architecture

The platform follows a **Microservices-based Architecture** with a **Hybrid AI Engine**.
*   **Backend**: Node.js/Express handles business logic, auth, and database interactions.
*   **ML Service**: Python/FastAPI handles numerical analysis (TF-IDF/Cosine Similarity) AND Web Intelligence (OpenAI).
*   **Frontend**: React SPA with role-based routing (Student vs Admin).

```mermaid
graph TD
    User[Student] -->|HTTPS| Frontend[React Frontend]
    Admin[Admin] -->|HTTPS| Frontend
    
    Frontend -->|REST API| Backend[Node.js + Express Backend]
    
    Backend -->|Mongoose| DB[(MongoDB Database)]
    Backend -->|HTTP/JSON| MLService[Python ML Microservice (FastAPI)]
    
    MLService -->|Read Data| DB
    MLService -->|Load Models| Models[Trained Models (TF-IDF)]
    MLService -->|API Call| OpenAI[OpenAI API (Web Intelligence)]
    
    subgraph "Hybrid Recommendation Logic"
    MLService -- 1. Skill Matching --> Models
    MLService -- 2. Roadmap Gen --> OpenAI
    end
```

## 2. Technology Stack Justification

*   **Frontend: React.js + Vite** - Fast development, component reuse, easy integration with REST APIs.
*   **Backend: Node.js + Express** - Non-blocking I/O, scalable, handles role-based auth (JWT).
*   **Database: MongoDB** - Flexible schema for storing complex recommendation logs and user profiles.
*   **ML Engine: Python (FastAPI)** -
    *   **Scikit-Learn**: For content-based filtering (Skill matching).
    *   **OpenAI API**: For generating "Web Intelligence" (Roadmaps, Career descriptions).
*   **Authentication: JWT** - Secure, stateless authentication for both Students and Admins.

## 3. Database Design (MongoDB)

### Collections & Schema Overview

#### 1. Users
*   `_id`: ObjectId
*   `name`: String
*   `email`: String (Unique)
*   `password`: String (Hashed)
*   `role`: Enum ['student', 'admin']

#### 2. Profiles (Student Data)
*   `userId`: ObjectId (Ref: Users)
*   `skills`: [String] (e.g., ["Python", "React"])
*   `education`: Object
*   `experience_level`: String

#### 3. Recommendations (Logs for Admin)
*   `userId`: ObjectId (Ref: Users)
*   `recommended_careers`: [{ careerTitle: String, score: Number, roadmap: [String] }]
*   `timestamp`: Date

## 4. API Design

### Backend (Node.js)
*   **Auth**:
    *   `POST /api/auth/register` - User registration
    *   `POST /api/auth/login` - User login (Returns Role)
*   **Student Flow**:
    *   `POST /api/recommend/career` - Get Hybrid Recommendations (Calls ML Service)
    *   `POST /api/recommend/feedback/:id` - Submit feedback
*   **Admin Flow**:
    *   `GET /api/admin/analytics` - View logs, popular careers, user stats

### ML Service (Python/FastAPI)
*   `POST /recommend`
    *   **Input**: `{ "skills": ["python", "ml"] }`
    *   **Logic**:
        1.  **TF-IDF**: Find top matching careers from CSV.
        2.  **OpenAI**: Generate a 4-step learning roadmap for top matches.
    *   **Output**: JSON with Career List + Roadmaps.

## 5. Hybrid Approach Explanation (For Review)
We combine **Deterministic ML** with **Generative AI**:
1.  **Quantitative (ML)**: We use TF-IDF and Cosine Similarity to mathematically rank careers based on skill overlap. This ensures the *relevance* is grounded in data.
2.  **Qualitative (OpenAI)**: We use LLMs to generate *contextual* learning paths (Roadmaps) that static datasets cannot provide.
3.  **Result**: A high-precision recommendation with actionable next steps.
