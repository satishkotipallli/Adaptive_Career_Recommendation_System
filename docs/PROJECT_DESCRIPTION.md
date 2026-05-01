# Career Guidance AI Platform — Project Description (Progress to Date)

## Overview
- Purpose: Help students match their skills to suitable career paths and follow a structured learning roadmap with progress tracking.
- Approach: Hybrid recommendation combining content-based ML (TF‑IDF + cosine similarity) with AI-generated learning modules.
- Architecture: Microservices with a Node.js backend, a Python FastAPI ML service, a React frontend, and MongoDB for persistence. See [ARCHITECTURE.md](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/ARCHITECTURE.md).

## Achievements So Far
- Core dataset prepared for skill-to-career matching: [job_skills.csv](file:///d:/office%20pro/final%20year%20projects/creview1_project/dataset/job_skills.csv).
- ML similarity model implemented (TF‑IDF vectorizer + cosine similarity) and exposed via FastAPI.
- Secure user authentication with JWT; student/admin roles supported.
- Student profile creation and update flow.
- Career recommendation API that proxies to the ML service and logs results.
- AI-generated career modules endpoint proxied from backend to ML service, with YouTube queries and Q&A.
- Learning enrollment, module completion tracking, and active goal persistence.
- Admin analytics dashboard for logs, popular careers, and user progress.
- Frontend SPA: Login, Register, Student Dashboard, Admin Dashboard with role-based routing.
- Project setup guide for running all services. See [SETUP_GUIDE.md](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/SETUP_GUIDE.md).

## System Architecture
- Frontend: React SPA (Vite) connects to backend via REST.
- Backend: Node.js/Express, JWT auth, MongoDB with Mongoose, routes for auth/profile/recommendations/progress/admin.
- ML Service: FastAPI microservice for matching careers and generating learning modules; optional OpenAI integration.
- Data Store: MongoDB collections for Users, Profiles, Careers, and Recommendation logs.
- High-level diagram and rationale: [ARCHITECTURE.md](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/ARCHITECTURE.md).

## Technology Stack
- Frontend: React 18 + Vite + react-router-dom + axios ([package.json](file:///d:/office%20pro/final%20year%20projects/creview1_project/frontend/package.json)).
- Backend: Express 5, Mongoose 9, JWT, bcryptjs, cors, dotenv ([server.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/server.js)).
- ML: FastAPI, scikit-learn, pandas, numpy, python-dotenv, optional OpenAI ([main.py](file:///d:/office%20pro/final%20year%20projects/creview1_project/ml_service/main.py)).
- Database: MongoDB.

## Data and Models
- Users: fields include name, email, password (hashed), role, progress entries, and activeCareer data. See [User.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/models/User.js).
- Profiles: skills, interests, education, experience_level, preferred_domains. See [Profile.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/models/Profile.js).
- Careers: title, description, domain, required_skills, salary, growth (currently minimal usage). See [Career.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/models/Career.js).
- Recommendation logs: per-user records of recommended careers with scores and timestamps. See [Recommendation.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/models/Recommendation.js).
- Dataset: CSV mapping job_role to skills and domain. See [job_skills.csv](file:///d:/office%20pro/final%20year%20projects/creview1_project/dataset/job_skills.csv).

## Services and APIs
- Backend entry: [server.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/server.js) mounts all routes.
- Auth:
  - Register: POST /api/auth/register ([auth.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/routes/auth.js)).
  - Login: POST /api/auth/login ([auth.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/routes/auth.js)).
  - Current user: GET /api/auth/me (requires x-auth-token).
- Profile:
  - Get own profile: GET /api/profile/me.
  - Create/update profile: POST /api/profile ([profile.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/routes/profile.js)).
- Recommendation:
  - Get career matches: POST /api/recommend/career (calls ML service /recommend) ([recommend.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/routes/recommend.js)).
  - Feedback: POST /api/recommend/feedback/:id.
  - Career details/modules: POST /api/recommend/details (proxies ML service /career_details).
- Progress:
  - Mark module complete: POST /api/progress.
  - Enroll active career: POST /api/progress/enroll.
  - Get progress + active career: GET /api/progress ([progress.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/routes/progress.js)).
- Admin:
  - Analytics: GET /api/admin/analytics (admin role only) ([admin.js](file:///d:/office%20pro/final%20year%20projects/creview1_project/backend/routes/admin.js)).
- ML Service (FastAPI):
  - Health: GET /health ([main.py:L49-L51](file:///d:/office%20pro/final%20year%20projects/creview1_project/ml_service/main.py#L49-L51)).
  - Recommend: POST /recommend → returns top matches with scores ([main.py:L76-L98](file:///d:/office%20pro/final%20year%20projects/creview1_project/ml_service/main.py#L76-L98)).
  - Career details: POST /career_details → returns modules, theory, Q&A, and YouTube query ([main.py:L100-L172](file:///d:/office%20pro/final%20year%20projects/creview1_project/ml_service/main.py#L100-L172)).

## Frontend Application
- App shell with role-based routing: [App.jsx](file:///d:/office%20pro/final%20year%20projects/creview1_project/frontend/src/App.jsx).
- Login and Register pages: Axios calls to backend auth endpoints, store token in localStorage ([Login.jsx](file:///d:/office%20pro/final%20year%20projects/creview1_project/frontend/src/pages/Login.jsx), [Register.jsx](file:///d:/office%20pro/final%20year%20projects/creview1_project/frontend/src/pages/Register.jsx)).
- Student Dashboard:
  - Enter skills → fetch recommendations.
  - Select a career → fetch AI modules and content.
  - Enroll sets active goal; track completion; progress bar computed client-side.
  - See [Dashboard.jsx](file:///d:/office%20pro/final%20year%20projects/creview1_project/frontend/src/pages/Dashboard.jsx).
- Admin Dashboard:
  - View total users, recommendation counts, popular careers.
  - Inspect recommendation logs and student progress.
  - See [AdminDashboard.jsx](file:///d:/office%20pro/final%20year%20projects/creview1_project/frontend/src/pages/AdminDashboard.jsx).

## How It Works (User Flow)
- Student registers or logs in; JWT token is set in localStorage; role decoded in the frontend.
- Student enters skills in Dashboard and requests recommendations.
- Backend calls ML service /recommend, which computes TF‑IDF vectors over dataset skills and returns top matches with scores.
- Student selects a recommended career; backend proxies to ML service /career_details to obtain detailed modules.
- Student enrolls, setting the active goal with modules stored in their User document; module completion is tracked over time.
- Admin can review analytics, logs, and student progress in the Admin Dashboard.

## Environment and Setup
- ML service: [requirements.txt](file:///d:/office%20pro/final%20year%20projects/creview1_project/ml_service/requirements.txt); optional OPENAI_API_KEY in environment.
- Backend: requires MONGO_URI, JWT_SECRET, ML_SERVICE_URL in environment; start via `node server.js`.
- Frontend: Vite dev server; start via `npm run dev`.
- End-to-end setup steps and troubleshooting: [SETUP_GUIDE.md](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/SETUP_GUIDE.md).

## Current Status and Limitations
- ML recommendation functional over the CSV dataset; OpenAI features work when an API key is present, with graceful fallbacks if absent.
- Security: JWT auth in place; admin-only analytics enforced; consider rate limiting and input validation hardening.
- Reliability: Basic error handling in routes; additional retries/backoff could improve robustness for ML service calls.
- Testing: No automated tests defined yet; advisable to add unit/integration tests for critical flows.
- Data richness: Career model exists but is not fully leveraged; expanding the dataset and schemas will improve recommendations.
- Deployment: Local run scripts documented; production orchestration and CI/CD not yet set up.

## Next Steps (Suggested)
- Add tests for auth, recommendation, progress, and admin analytics.
- Enhance dataset and integrate Career model for richer metadata.
- Implement pagination and filtering in Admin logs; add dashboards for trends.
- Add profile-based weighting (experience, interests) to the recommendation algorithm.
- Improve module generation prompts and add caching of AI results.
- Harden security (input validation, audit logs) and add rate limiting.

## References
- Overview notes: [docs/README.txt](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/README.txt)
- Architecture: [docs/ARCHITECTURE.md](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/ARCHITECTURE.md)
- Setup: [docs/SETUP_GUIDE.md](file:///d:/office%20pro/final%20year%20projects/creview1_project/docs/SETUP_GUIDE.md)
