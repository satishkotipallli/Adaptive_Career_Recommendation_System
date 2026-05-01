from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.metrics import accuracy_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.exceptions import ConvergenceWarning
import os
from dotenv import load_dotenv
from typing import Any, Dict, List, Optional, Tuple
import json
import warnings
import re
from urllib import error, request
from skill_gap_analysis import SkillGapAnalyzer, analyze_skill_gap

load_dotenv()
warnings.filterwarnings("ignore", category=ConvergenceWarning)

app = FastAPI()

# Load Dataset
DATASET_PATH = "../dataset/job_skills_corrected.csv"
FALLBACK_DATASET_PATH = "../dataset/job_skills.csv"
df = None
tfidf_matrix = None
vectorizer = None
rf_model = None
mlp_model = None
rf_accuracy = None
mlp_accuracy = None

GENERIC_SKILL_TERMS = {
    "communication",
    "teamwork",
    "management",
    "analytics",
    "documentation",
    "excellent",
    "strong",
    "deep",
    "knowledge",
    "capability",
    "capabilities",
    "ability",
    "abilities",
}

DOMAIN_KEYWORDS = {
    "AI": {
        "python", "machine learning", "statistics", "pandas", "numpy", "deep learning", "ai",
        "tensorflow", "pytorch", "data science", "modeling"
    },
    "Web": {
        "html", "css", "javascript", "react", "node", "frontend", "backend", "api", "web"
    },
    "Creative": {
        "figma", "ux", "ui", "wireframe", "prototype", "design system", "adobe xd"
    },
    "Security": {
        "network security", "ethical hacking", "penetration testing", "siem", "vulnerability", "firewall", "cybersecurity"
    },
    "Data": {
        "sql", "etl", "data engineering", "power bi", "excel", "spark", "hadoop", "dashboard"
    },
    "Cloud": {
        "aws", "azure", "cloud", "docker", "kubernetes", "devops", "linux", "infrastructure"
    },
    "Marketing": {
        "seo", "content writing", "social media", "digital marketing", "copywriting", "content strategy"
    },
    "Business": {
        "business analytics", "strategy", "management", "operations", "planning"
    },
}

ROLE_PREFIXES = ("junior", "senior", "lead", "assistant", "principal")

DOMAIN_FILTER_MAP = {
    "AI": ["AI", "Data"],
    "Data": ["Data", "AI"],
    "Web": ["Web"],
    "Creative": ["Creative"],
    "Security": ["Security"],
    "Marketing": ["Business"],
    "Business": ["Business", "Misc"],
    "Cloud": ["Cloud"],
}

SKILL_CANONICAL_MAP = {
    "writing": "content writing",
    "editing": "content writing",
    "seo": "digital marketing",
    "search engine optimization": "digital marketing",
    "social media": "social media marketing",
    "social media marketing": "social media marketing",
    "ux": "ux design",
    "ui": "ui design",
    "wireframe": "wireframing",
    "wireframes": "wireframing",
    "prototype": "prototyping",
    "prototypes": "prototyping",
    "machine learning": "machine learning",
    "deep learning": "deep learning",
    "javascript": "javascript",
    "react": "react",
    "html": "html",
    "css": "css",
    "python": "python",
    "statistics": "statistics",
    "pandas": "pandas",
    "numpy": "numpy",
    "analytics": "business analytics",
    "strategy": "business strategy",
    "management": "management",
    "network security": "network security",
    "ethical hacking": "ethical hacking",
    "penetration testing": "penetration testing",
    "research": "research",
}

# Gemini Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash"

def load_data():
    global df, tfidf_matrix, vectorizer, rf_model, mlp_model, rf_accuracy, mlp_accuracy
    dataset_path = DATASET_PATH if os.path.exists(DATASET_PATH) else FALLBACK_DATASET_PATH
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
        df["skills"] = df["skills"].fillna("")
        df["required_skills"] = df.get("required_skills", "").fillna("")
        df["domain"] = df.get("domain", "General").fillna("General")
        df["demand_level_india"] = df.get("demand_level_india", "Medium").fillna("Medium")
        df["experience_alignment"] = df.get("experience_alignment", "").fillna("")
        df["profile_text"] = (
            df["skills"].astype(str)
            + ", "
            + df["required_skills"].astype(str)
        )
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(df["profile_text"])
        y = df["domain"]
        X_train, X_test, y_train, y_test = train_test_split(
            tfidf_matrix,
            y,
            test_size=0.2,
            random_state=42
        )

        rf_model = RandomForestClassifier(n_estimators=200, random_state=42)
        rf_model.fit(X_train, y_train)
        rf_predictions = rf_model.predict(X_test)
        rf_accuracy = accuracy_score(y_test, rf_predictions)

        mlp_model = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=700, random_state=42)
        mlp_model.fit(X_train, y_train)
        mlp_accuracy = mlp_model.score(X_test, y_test)

        print("Dataset loaded and models trained.")
        print(f"Training data: 80% | Testing data: 20%")
        print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
        print(f"Neural Network Accuracy: {mlp_accuracy:.4f}")
    else:
        print(f"Warning: Dataset not found at {DATASET_PATH} or {FALLBACK_DATASET_PATH}")

load_data()

class SkillInput(BaseModel):
    skills: list[str]
    raw_text: Optional[str] = ""
    recommendation_history: Optional[List[Dict[str, Any]]] = []

class CareerRequest(BaseModel):
    career: str
    user_skills: Optional[List[str]] = []
    
class FullProfileInput(BaseModel):
    skills: List[str]
    interests: Optional[List[str]] = []
    education: Optional[str] = ""
    experience_level: Optional[str] = "Beginner"

class SkillGapRequest(BaseModel):
    skills: List[str]
    career: str

@app.get("/")
def read_root():
    return {"message": "Career Recommendation ML Service is Running"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "dataset_loaded": df is not None,
        "rf_accuracy": rf_accuracy,
        "mlp_accuracy": mlp_accuracy
    }

def get_openai_roadmap(career: str, domain: str, user_skills: List[str], required_skills: List[str]):
    if not GEMINI_API_KEY:
        return None
    
    try:
        prompt = (
            "You are an expert career mentor and industry trainer. "
            "Return only valid JSON with no markdown fences.\n\n"
            f"Career: {career}\n"
            f"User Skills: {', '.join(user_skills) if user_skills else 'None provided'}\n"
            f"Required Skills for Career: {', '.join(required_skills) if required_skills else 'Not available'}\n\n"
            "Analyze the user's current skills, identify the missing skills required for the career, "
            "and create a personalized 12-week roadmap that focuses more on the missing skills. "
            "Avoid teaching topics the user already knows well.\n\n"
            "Return JSON with this shape:\n"
            "{\n"
            '  "Month 1": [week objects],\n'
            '  "Month 2": [week objects],\n'
            '  "Month 3": [week objects],\n'
            '  "capstone_project": "string",\n'
            '  "portfolio_guidance": "string",\n'
            '  "resume_tips": "string",\n'
            '  "interview_preparation": "string"\n'
            "}\n\n"
            "Each month must contain exactly 4 week objects. Each week object must include:\n"
            "- topic_title\n"
            "- detailed_theory\n"
            "- knowledge_check (2 items)\n"
            "- practical_tasks (2 items)\n"
            "- mini_project\n"
            "- recommended_tools\n"
            "- free_resource_search_query\n\n"
            "Rules:\n"
            "- Topics must be strictly relevant to the career.\n"
            "- Do not repeat theory across weeks.\n"
            "- Knowledge checks must be different every week and based on that week's topic.\n"
            "- Do not use generic phrases like build competence or master foundations.\n"
            "- Use real technologies relevant to the career.\n"
            "- Remove unrelated tools like Canva and Notion.\n"
            "- Mini projects must be portfolio-ready.\n"
            "- Weeks 10 to 12 must include capstone project, portfolio building, resume preparation, and interview preparation."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "responseMimeType": "application/json"
            }
        }
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        req = request.Request(
            api_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with request.urlopen(req, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))

        parts = body.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        content = "".join(part.get("text", "") for part in parts).strip()
        return json.loads(content)
    except error.HTTPError as e:
        print(f"Gemini HTTP Error: {e.read().decode('utf-8', errors='ignore')}")
        return None
    except Exception as e:
        print(f"Gemini Error: {e}")
        return None


def _predict_domain_probabilities(model, user_vector) -> Dict[str, float]:
    if model is None:
        return {}
    probabilities = model.predict_proba(user_vector)[0]
    return {
        label: float(probabilities[idx])
        for idx, label in enumerate(model.classes_)
    }


def _demand_bonus(demand_level: str) -> float:
    lookup = {"high": 0.05, "medium": 0.02, "low": 0.0}
    return lookup.get(str(demand_level).strip().lower(), 0.01)


def diversify_results(results: pd.DataFrame, total_limit: int = 10, unique_domain_target: int = 6) -> pd.DataFrame:
    domains = set()
    prioritized_rows = []

    for _, row in results.iterrows():
        domain = str(row["domain"])
        if domain not in domains:
            prioritized_rows.append(row.to_dict())
            domains.add(domain)
        if len(prioritized_rows) >= min(unique_domain_target, total_limit):
            break

    seen_roles = {row["job_role"] for row in prioritized_rows}
    if len(prioritized_rows) < total_limit:
        for _, row in results.iterrows():
            if row["job_role"] in seen_roles:
                continue
            prioritized_rows.append(row.to_dict())
            seen_roles.add(row["job_role"])
            if len(prioritized_rows) >= total_limit:
                break

    return pd.DataFrame(prioritized_rows)


def _normalize_skill_text(value: str) -> str:
    lowered = re.sub(r"[^a-z0-9\s]", " ", str(value).lower())
    tokens = [
        token for token in lowered.split()
        if token not in ENGLISH_STOP_WORDS and token not in GENERIC_SKILL_TERMS
    ]
    return " ".join(tokens).strip()


def _extract_skill_keywords(skills: List[str], raw_text: str = "") -> List[str]:
    combined_parts = [part for part in (skills or []) if part]
    if raw_text:
        combined_parts.append(raw_text)
    combined_text = " ".join(str(part) for part in combined_parts).lower()
    normalized_text = re.sub(r"[^a-z0-9\s]", " ", combined_text)

    extracted: List[str] = []
    for phrase, canonical in sorted(SKILL_CANONICAL_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        if phrase in combined_text:
            extracted.append(canonical)
            normalized_text = normalized_text.replace(phrase, " ")

    residual_tokens = [
        token for token in normalized_text.split()
        if token not in ENGLISH_STOP_WORDS and token not in GENERIC_SKILL_TERMS and len(token) > 2
    ]
    extracted.extend(residual_tokens)

    deduped = []
    seen = set()
    for item in extracted:
        cleaned = _normalize_skill_text(item)
        if cleaned and cleaned not in seen:
            deduped.append(cleaned)
            seen.add(cleaned)
    return deduped


def _preprocess_dataset_skills(frame: pd.DataFrame) -> pd.DataFrame:
    processed = frame.copy()
    processed["processed_skills"] = processed["skills"].map(_normalize_skill_text)
    processed["processed_required_skills"] = processed["required_skills"].map(_normalize_skill_text)
    processed["processed_text"] = (
        processed["processed_skills"].fillna("")
        + " "
        + processed["processed_required_skills"].fillna("")
    ).str.strip()
    return processed


def _detect_domains(skills: List[str]) -> List[str]:
    joined = " ".join(skills)
    scores: Dict[str, int] = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword in joined:
                score += 1
        if score:
            scores[domain] = score
    if not scores:
        return []
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    top_score = ranked[0][1]
    return [domain for domain, score in ranked if score >= max(1, top_score - 1)]


def _base_job_role(job_role: str) -> str:
    parts = str(job_role).strip().split()
    if parts and parts[0].lower() in ROLE_PREFIXES:
        return " ".join(parts[1:]).strip()
    return str(job_role).strip()


def _collaborative_score(
    extracted_skills: List[str],
    base_role: str,
    recommendation_history: List[Dict[str, Any]],
) -> float:
    if not recommendation_history:
        return 0.0

    target_skill_set = set(extracted_skills)
    if not target_skill_set:
        return 0.0

    weighted_scores: List[float] = []
    for record in recommendation_history:
        history_skills = {
            _normalize_skill_text(skill)
            for skill in (record.get("skills") or [])
            if _normalize_skill_text(skill)
        }
        if not history_skills:
            continue

        overlap = len(target_skill_set & history_skills)
        union = len(target_skill_set | history_skills)
        profile_similarity = overlap / union if union else 0.0
        if profile_similarity <= 0:
            continue

        career_scores = [
            float(career.get("score", 0.0))
            for career in (record.get("careers") or [])
            if _base_job_role(career.get("careerTitle", "")) == base_role
        ]
        if not career_scores:
            continue

        weighted_scores.append(profile_similarity * max(career_scores))

    if not weighted_scores:
        return 0.0
    return min(1.0, sum(weighted_scores) / len(weighted_scores))


def _demand_weight(demand_level: str) -> float:
    return {"high": 1.0, "medium": 0.6, "low": 0.3}.get(str(demand_level).strip().lower(), 0.5)

@app.post("/recommend")
def recommend_career(input_data: SkillInput):
    global df
    if df is None: raise HTTPException(status_code=500, detail="Model not loaded")

    extracted_skills = _extract_skill_keywords(input_data.skills or [], input_data.raw_text or "")
    if not extracted_skills:
        return {"career_recommendations": []}

    detected_domains = _detect_domains(extracted_skills)
    filtered_df = df.copy()
    allowed_domains: List[str] = []
    for domain in detected_domains:
        allowed_domains.extend(DOMAIN_FILTER_MAP.get(domain, [domain]))
    allowed_domains = list(dict.fromkeys(allowed_domains))
    if allowed_domains:
        domain_df = df[df["domain"].isin(allowed_domains)].copy()
        if len(domain_df) >= 5:
            filtered_df = domain_df

    filtered_df = _preprocess_dataset_skills(filtered_df)
    filtered_df = filtered_df[filtered_df["processed_text"].str.strip() != ""].copy()
    if filtered_df.empty:
        return {"career_recommendations": []}

    user_skills_text = " ".join(extracted_skills)
    filtered_vectorizer = TfidfVectorizer(stop_words="english")
    filtered_matrix = filtered_vectorizer.fit_transform(filtered_df["processed_text"])
    user_vector = filtered_vectorizer.transform([user_skills_text])
    similarity_scores = cosine_similarity(user_vector, filtered_matrix)[0]

    filtered_df["content_similarity"] = similarity_scores
    filtered_df["base_job_role"] = filtered_df["job_role"].map(_base_job_role)
    filtered_df["collaborative_score"] = filtered_df["base_job_role"].map(
        lambda role: _collaborative_score(extracted_skills, role, input_data.recommendation_history or [])
    )
    filtered_df["demand_weight"] = filtered_df["demand_level_india"].map(_demand_weight)
    filtered_df["final_score"] = (
        (filtered_df["content_similarity"] * 0.6)
        + (filtered_df["collaborative_score"] * 0.3)
        + (filtered_df["demand_weight"] * 0.1)
    )
    threshold_matches = filtered_df[filtered_df["content_similarity"] > 0.25].sort_values(by="final_score", ascending=False)
    if threshold_matches.empty:
        threshold_matches = filtered_df.sort_values(by="final_score", ascending=False)
    top_matches = threshold_matches.drop_duplicates(subset=["base_job_role"], keep="first").head(10)

    recommendations = [
        {
            "job_role": row["base_job_role"],
            "domain": row["domain"],
            "score": round(float(row["final_score"]), 4),
        }
        for _, row in top_matches.iterrows()
    ]

    return {"career_recommendations": recommendations}

@app.post("/career_details")
def get_career_details(req: CareerRequest):
    """
    Generates a 12-week, 3-month roadmap for a specific career.
    Returns modules compatible with the frontend (title, theory, questions, youtube_query),
    and includes optional practical_tasks and mini_project fields.
    """
    # Identify domain for the requested career
    domain = "General"
    required_skills: List[str] = []
    try:
        matches = df[df['job_role'].str.lower() == str(req.career).strip().lower()]
        if not matches.empty and 'domain' in matches.columns:
            domain = str(matches.iloc[0]['domain'])
            required_skills = _clean_split(matches.iloc[0].get("required_skills", ""))
    except Exception:
        pass

    user_skills = req.user_skills or []
    roadmap = get_openai_roadmap(req.career, domain, user_skills, required_skills) or _roadmap_for_career(req.career, domain, user_skills, required_skills)

    # Flatten months into a 12-module list suitable for the frontend
    modules = []
    week_counter = 1
    for month_key in ["Month 1", "Month 2", "Month 3"]:
        for wk in roadmap[month_key]:
            # Expand theory length to be more explanatory (approx 200–300 words)
            theory = wk["detailed_theory"]
            # Theory already includes the suffix, no need to add extra

            modules.append({
                "title": f"Week {week_counter}: {wk['topic_title']}",
                "theory": theory,
                "questions": wk.get("knowledge_check", []),
                "youtube_query": wk["free_resource_search_query"],
                "practical_tasks": wk.get("practical_tasks", []),
                "mini_project": wk.get("mini_project", ""),
                "recommended_tools": wk.get("recommended_tools", [])
            })
            week_counter += 1

    return {
        "modules": modules,
        "capstone_project": roadmap.get("capstone_project", ""),
        "portfolio_guidance": roadmap.get("portfolio_guidance", ""),
        "resume_tips": roadmap.get("resume_tips", ""),
        "interview_preparation": roadmap.get("interview_preparation", "")
    }

def _clean_split(skills_str: str) -> List[str]:
    parts = [p.strip() for p in str(skills_str).split(",") if p.strip()]
    return parts

def _why_suitable(title: str, job_skills: list[str], user_skills: list[str], interests: list[str], domain: str) -> str:
    inter = [s for s in user_skills if s.lower() in [j.lower() for j in job_skills]]
    inter_part = ", ".join(inter[:2]) if inter else ""
    interest_note = ""
    if interests:
        interest_note = f" This aligns with your interest in {interests[0]}."
    base = f"{title} applies {domain} skills to real product work in India. "
    if inter_part:
        base += f"Your experience with {inter_part} maps directly to daily tasks and reduces ramp-up time."
    else:
        base += "Your current toolkit can adapt quickly to core requirements with focused practice."
    base += interest_note
    return base

def _exp_penalty(job_alignment: str, user_level: str) -> float:
    jl = (job_alignment or "").lower()
    ul = (user_level or "").lower()
    if ul.startswith("begin") and jl.startswith("inter"):
        return -0.08
    return 0.0

def _cap_by_domain(sorted_indices_scores, max_per_domain: int, needed: int) -> List[Tuple[int, float]]:
    res = []
    domain_counts = {}
    for i, score in sorted_indices_scores:
        dom = str(df.iloc[i]['domain']) if 'domain' in df.columns else "N/A"
        if domain_counts.get(dom, 0) >= max_per_domain:
            continue
        res.append((i, score))
        domain_counts[dom] = domain_counts.get(dom, 0) + 1
        if len(res) >= needed:
            break
    return res

def _career_default_skills(career: str) -> List[str]:
    defaults = {
        "backend developer": ["node.js", "express", "mongodb", "rest api", "jwt authentication", "api security", "docker", "deployment"],
        "frontend developer": ["html", "css", "javascript", "react", "state management", "api integration", "ui performance", "testing"],
        "mobile app developer": ["flutter", "react native", "android studio", "api integration", "firebase", "push notifications", "state management", "app deployment"],
        "data scientist": ["python", "pandas", "statistics", "data visualization", "machine learning", "model evaluation", "feature engineering", "deployment"],
        "ui designer": ["figma", "wireframing", "prototyping", "design systems", "visual hierarchy", "usability testing", "handoff", "portfolio case studies"],
        "ux designer": ["user research", "wireframing", "prototyping", "journey mapping", "usability testing", "figma", "information architecture", "portfolio case studies"],
    }
    return defaults.get(career.lower().strip(), [])


def _tools_for_skill(career: str, skill: str) -> List[str]:
    skill_lower = skill.lower()
    if "node" in skill_lower or "express" in skill_lower:
        return ["Node.js", "Express", "Postman", "VS Code"]
    if "mongo" in skill_lower:
        return ["MongoDB", "MongoDB Compass", "Postman", "VS Code"]
    if "jwt" in skill_lower or "auth" in skill_lower or "security" in skill_lower:
        return ["Node.js", "Postman", "JWT.io", "OWASP ZAP"]
    if "docker" in skill_lower or "deploy" in skill_lower:
        return ["Docker", "GitHub Actions", "Render", "AWS"]
    if "html" in skill_lower or "css" in skill_lower or "javascript" in skill_lower or "react" in skill_lower:
        return ["React", "Vite", "Chrome DevTools", "VS Code"]
    if "state management" in skill_lower:
        return ["React", "Redux Toolkit", "React DevTools", "VS Code"]
    if "ui" in skill_lower or "ux" in skill_lower or "figma" in skill_lower or "wire" in skill_lower or "proto" in skill_lower:
        return ["Figma", "FigJam", "Maze", "Adobe XD"]
    if "flutter" in skill_lower or "react native" in skill_lower or "android" in skill_lower:
        return ["Flutter", "Android Studio", "Firebase", "Postman"]
    if "firebase" in skill_lower or "push notification" in skill_lower:
        return ["Firebase", "Android Studio", "FCM", "Postman"]
    if "python" in skill_lower or "pandas" in skill_lower or "statistics" in skill_lower:
        return ["Python", "Jupyter", "Pandas", "NumPy"]
    if "machine learning" in skill_lower or "model" in skill_lower or "feature engineering" in skill_lower:
        return ["Python", "Scikit-learn", "Jupyter", "MLflow"]
    if "visualization" in skill_lower:
        return ["Python", "Matplotlib", "Seaborn", "Plotly"]
    return ["VS Code", "Git", "Postman"]


def _topic_for_skill(career: str, skill: str, week_num: int) -> str:
    normalized = skill.replace("_", " ").strip()
    title = normalized.title()
    if week_num >= 10:
        return title
    return f"{title} for {career}"


def _knowledge_checks_for_week(career: str, topic: str, skill: str, week_num: int) -> List[str]:
    skill_lower = skill.lower()
    topic_lower = topic.lower()

    if "node" in skill_lower:
        return [
            "Explain how the event loop affects concurrent API requests in Node.js.",
            "When would you choose async or await over chained promises in a backend codebase?"
        ]
    if "express" in skill_lower:
        return [
            "Why does middleware order matter in an Express application?",
            "How would you separate controllers, services, and route definitions in Express?"
        ]
    if "mongo" in skill_lower:
        return [
            "When would you embed a document instead of referencing another collection in MongoDB?",
            "How does an index change query performance and write cost in MongoDB?"
        ]
    if "jwt" in skill_lower or "auth" in skill_lower:
        return [
            "What information should never be trusted directly from a JWT payload?",
            "How would you handle token expiry and refresh flows in a production API?"
        ]
    if "security" in skill_lower:
        return [
            "What attack does rate limiting reduce, and where should it be enforced?",
            "How do input validation and output encoding protect an API in different ways?"
        ]
    if "docker" in skill_lower or "deploy" in skill_lower:
        return [
            "What problem does a multi-stage Docker build solve in production deployments?",
            "Which deployment checks would you automate before promoting a build to production?"
        ]
    if "react" in skill_lower:
        return [
            "What causes unnecessary re-renders in a React screen with multiple child components?",
            "How would you decide whether state belongs in a component, context, or a state library?"
        ]
    if "html" in skill_lower or "css" in skill_lower or "javascript" in skill_lower:
        return [
            "How would you debug a layout issue that only appears on smaller screens?",
            "What JavaScript behavior would you inspect first when a UI interaction silently fails?"
        ]
    if "ui" in skill_lower or "ux" in skill_lower or "figma" in skill_lower or "wire" in skill_lower or "proto" in skill_lower:
        return [
            "How would you justify a layout decision to both a product manager and a frontend developer?",
            "Which screen states must be included in a handoff so engineering does not make assumptions?"
        ]
    if "flutter" in skill_lower or "react native" in skill_lower or "android" in skill_lower:
        return [
            "How would you structure navigation and shared state in a growing mobile application?",
            "What mobile-specific issue would you test before shipping a screen with API-driven content?"
        ]
    if "python" in skill_lower or "pandas" in skill_lower or "statistics" in skill_lower:
        return [
            "How would you prove that a data cleaning step improved downstream analysis quality?",
            "Which statistical assumption would you verify before trusting the output of your analysis?"
        ]
    if "machine learning" in skill_lower or "model" in skill_lower or "feature engineering" in skill_lower:
        return [
            "How would you tell whether a model improved because of better features or data leakage?",
            "Which metric would you present to stakeholders and why for this modeling problem?"
        ]
    if week_num == 10:
        return [
            f"What scope decision keeps your {career} capstone achievable while still portfolio-worthy?",
            "How will you prove that the capstone demonstrates the hardest missing skills you targeted?"
        ]
    if week_num == 11:
        return [
            "What evidence should a case study include so recruiters understand your contribution quickly?",
            "How would you rewrite a weak resume bullet into an outcome-focused achievement?"
        ]
    if week_num == 12:
        return [
            f"Which {career} interview question would be easiest to answer with your capstone, and why?",
            "How would you explain a trade-off from your project to an interviewer in under two minutes?"
        ]
    return [
        f"What is the most important implementation trade-off in {topic_lower} for a {career} role?",
        f"How would you review whether your work on {skill_lower} is ready for production or stakeholder feedback?"
    ]


def _generate_theory(career: str, skill: str, user_skills: List[str], required_skills: List[str]) -> str:
    skill_lower = skill.lower()
    known = {s.lower() for s in user_skills}
    gap_note = "This is a missing skill in your current profile, so the roadmap emphasizes implementation depth and production usage." if skill_lower not in known else "You already have some exposure here, so the roadmap uses this week to tighten professional execution and fill weak spots."
    required_note = f"For {career}, this skill connects directly to {', '.join(required_skills[:3])}." if required_skills else f"For {career}, this topic is part of the day-to-day delivery workflow."

    if "node" in skill_lower:
        return f"Node.js in a backend role is not just about writing routes; it is about understanding asynchronous execution, non-blocking I/O, and how server workloads behave under real traffic. Study the event loop, async or await, error bubbling, environment-based configuration, and project structure for production APIs. Compare single-purpose scripts with layered server code so you can separate controllers, services, and data access clearly. Focus on request lifecycle tracing, dependency management, and patterns that keep APIs readable as features grow. {required_note} {gap_note}"
    if "express" in skill_lower:
        return f"Express is the layer where backend structure becomes visible to recruiters and reviewers. Learn how middleware ordering affects authentication, validation, logging, and error handling. Study route composition, controller design, schema validation, and how to build predictable API responses. Pay attention to versioned routing, reusable middleware, and secure request parsing. By the end of the week, you should understand how to shape an API that another frontend or mobile team can consume without confusion. {required_note} {gap_note}"
    if "mongo" in skill_lower:
        return f"MongoDB work for {career} means modeling data around application behavior, not just storing JSON documents. Learn when to embed documents, when to reference, how indexing changes query cost, and how schema decisions affect reporting and pagination. Practice validation rules, compound indexes, aggregation pipelines, and debugging slow queries. The goal is to move beyond simple CRUD and understand why a collection design supports the product flow you are building. {required_note} {gap_note}"
    if "react" in skill_lower:
        return f"React for frontend work is about turning UI states into maintainable components with predictable rendering behavior. Learn how component boundaries affect reuse, how props and state shape the interface, and how asynchronous data loading changes rendering flow. Study conditional rendering, forms, list rendering, and state transitions. Focus on building screens that stay responsive while integrating live API data and real interaction patterns such as filters, search, and validation. {required_note} {gap_note}"
    if "figma" in skill_lower or "wire" in skill_lower or "proto" in skill_lower or "ui" in skill_lower or "ux" in skill_lower:
        return f"{skill.title()} in a design workflow should result in screens, flows, and decisions that are easy for engineers and stakeholders to use. Study layout systems, spacing logic, type scale choices, component variants, and interaction flows. Tie every artifact to a problem statement so the work is not just visual but explainable. Pay attention to annotation, edge-case states, responsive behavior, and clean developer handoff. {required_note} {gap_note}"
    if "flutter" in skill_lower or "react native" in skill_lower or "android" in skill_lower:
        return f"Mobile development in {career} depends on how well you manage navigation, component state, asynchronous data, and platform-specific behavior. Learn project structure, screen composition, reusable widgets or components, API integration patterns, local persistence, and debugging on emulator and device. Focus on producing app behavior that feels stable under poor connectivity, navigation changes, and form-heavy workflows. {required_note} {gap_note}"
    if "python" in skill_lower or "pandas" in skill_lower or "statistics" in skill_lower or "machine learning" in skill_lower:
        return f"{skill.title()} for {career} should move you closer to solving measurable business or product questions. Study the exact role this skill plays in the pipeline: data cleaning, exploratory analysis, feature preparation, model training, or interpretation. Practice with notebook-to-script conversion, reproducible experiments, metric tracking, and analysis narratives that explain not only what happened but why it matters. {required_note} {gap_note}"
    return f"{skill.title()} should be learned in the context of real {career} delivery rather than as isolated theory. Study the concepts, workflows, edge cases, and implementation trade-offs that make this skill useful in production. Connect the topic to the systems, interfaces, or deliverables expected from the role, then translate that knowledge into something reviewable such as a feature branch, prototype, report, or documented experiment. {required_note} {gap_note}"


def _generate_week(career: str, week_num: int, skill: str, user_skills: List[str], required_skills: List[str]) -> dict:
    tools = _tools_for_skill(career, skill)
    topic = _topic_for_skill(career, skill, week_num)
    query = f"{career} {skill} tutorial"

    if week_num == 10:
        topic = f"Capstone Build for {career}"
        theory = f"Week 10 is where the roadmap shifts from isolated exercises to a portfolio-grade capstone. Define a project that demonstrates the most important role requirements, includes at least one meaningful user or stakeholder workflow, and forces you to apply the hardest missing skills from earlier weeks. Break the capstone into scope, data or content inputs, architecture or design decisions, delivery milestones, and review criteria. The goal is not a toy demo; it is a project you can defend in an interview."
        tasks = [
            f"Write a one-page capstone scope for a {career} project with features, users, and constraints",
            "Build the first end-to-end version of the core workflow and capture progress screenshots or API evidence"
        ]
        mini = f"Start a portfolio-ready capstone for {career} that combines {', '.join(required_skills[:4]) if required_skills else 'core job skills'}."
    elif week_num == 11:
        topic = f"Portfolio and Resume Packaging for {career}"
        theory = f"Week 11 converts project work into evidence that hiring teams can scan quickly. Prepare a clean portfolio case study that explains the problem, your approach, the technical or design decisions you made, what changed after feedback, and the final outcome. Then translate those results into resume bullets that show impact, scope, and tools without sounding generic. The work this week should make your capstone understandable even to someone who only spends two minutes reviewing it."
        tasks = [
            "Publish a polished README or case study page with architecture, screenshots, and role-specific outcomes",
            "Rewrite your resume bullets so they reference the capstone, the technologies used, and measurable improvements"
        ]
        mini = f"Package your {career} capstone into a portfolio case study and role-targeted resume section."
        tools = ["GitHub", "LinkedIn", "Markdown", "VS Code"]
        query = f"{career} portfolio resume project walkthrough"
    elif week_num == 12:
        topic = f"Interview Preparation for {career}"
        theory = f"Week 12 is for turning knowledge into confident explanation. Build answers around your capstone, the missing skills you closed, and the trade-offs you handled. Prepare role-specific walkthroughs, tool decisions, debugging stories, and architecture or design choices. Practice speaking clearly about why you chose a library, workflow, or pattern and what you would improve with more time. This week should leave you ready for technical rounds, project discussions, and resume screening calls."
        tasks = [
            f"Create and rehearse 15 interview questions for {career} covering tools, project decisions, and troubleshooting",
            "Record a mock walkthrough of your capstone and refine weak explanations, missing metrics, and unclear terminology"
        ]
        mini = f"Complete a mock interview pack for {career} with project answers, resume talking points, and role-specific questions."
        tools = ["GitHub", "LeetCode", "Google Docs", "VS Code"]
        query = f"{career} interview questions mock interview"
    else:
        theory = _generate_theory(career, skill, user_skills, required_skills)
        tasks = [
            f"Implement one real {career.lower()} task focused on {skill} and commit the work with clear notes",
            f"Review your output against production concerns such as validation, performance, accessibility, or maintainability for {skill}"
        ]
        mini = f"Build a portfolio-ready mini project for {career} centered on {skill} and document the technical decisions."
    knowledge_check = _knowledge_checks_for_week(career, topic, skill, week_num)

    return {
        "week_number": week_num,
        "topic_title": topic,
        "detailed_theory": theory,
        "knowledge_check": knowledge_check,
        "practical_tasks": tasks,
        "mini_project": mini,
        "recommended_tools": tools,
        "free_resource_search_query": query
    }


def _roadmap_for_career(career: str, domain: str, user_skills: List[str], required_skills: List[str]) -> dict:
    normalized_user_skills = [skill.strip() for skill in user_skills if skill.strip()]
    normalized_required_skills = required_skills or _career_default_skills(career)
    normalized_required_skills = [skill.strip() for skill in normalized_required_skills if skill.strip()]
    user_skill_set = {skill.lower() for skill in normalized_user_skills}

    missing_skills = [skill for skill in normalized_required_skills if skill.lower() not in user_skill_set]
    known_required_skills = [skill for skill in normalized_required_skills if skill.lower() in user_skill_set]
    support_topics = _career_default_skills(career)

    planned_topics: List[str] = []
    seen_topics = set()
    for topic in missing_skills + known_required_skills + support_topics:
        topic_key = topic.lower()
        if topic and topic_key not in seen_topics:
            planned_topics.append(topic)
            seen_topics.add(topic_key)
        if len(planned_topics) >= 9:
            break

    while len(planned_topics) < 9:
        planned_topics.append(f"{career} workflow {len(planned_topics) + 1}")

    all_weeks = [
        _generate_week(career, week_num + 1, planned_topics[week_num], normalized_user_skills, normalized_required_skills)
        for week_num in range(9)
    ]
    all_weeks.extend([
        _generate_week(career, 10, "capstone", normalized_user_skills, normalized_required_skills),
        _generate_week(career, 11, "portfolio", normalized_user_skills, normalized_required_skills),
        _generate_week(career, 12, "interview", normalized_user_skills, normalized_required_skills),
    ])

    m1 = all_weeks[:4]
    m2 = all_weeks[4:8]
    m3 = all_weeks[8:12]

    cap, portfolio, resume, interview, _ = _capstone_portfolio_resume_interview_job(career, domain)
    return {
        "Month 1": m1,
        "Month 2": m2,
        "Month 3": m3,
        "capstone_project": cap,
        "portfolio_guidance": portfolio,
        "resume_tips": resume,
        "interview_preparation": interview
    }


def _capstone_portfolio_resume_interview_job(career: str, domain: str) -> tuple[str, str, str, str, str]:
    cap = f"Build and publish a real-world {domain.lower()} project for {career.lower()} with docs and a short video demo."
    portfolio = f"Show before/after visuals, code links and a 3-minute walkthrough focused on outcomes relevant to {career.lower()}."
    resume = "Quantify impact, list tools prominently, and include portfolio links; tailor keywords to Indian job descriptions."
    interview = "Prepare domain questions, hands-on tasks and two STAR stories showing problem framing and measurable results."
    job = "Prioritize referrals, target metro hubs and align applications with JD keywords; track weekly outreach and follow-ups."
    return cap, portfolio, resume, interview, job

@app.post("/recommend_full")
def recommend_full(input_data: FullProfileInput):
    global df, tfidf_matrix, vectorizer
    if df is None: raise HTTPException(status_code=500, detail="Model not loaded")
    user_skills = input_data.skills or []
    interests = input_data.interests or []
    user_level = input_data.experience_level or "Beginner"
    user_skills_text = " ".join(user_skills)
    user_vector = vectorizer.transform([user_skills_text])
    cosine_sim = cosine_similarity(user_vector, tfidf_matrix)[0]
    base = list(enumerate(cosine_sim))
    base_sorted = sorted(base, key=lambda x: x[1], reverse=True)
    selected = _cap_by_domain(base_sorted, max_per_domain=2, needed=10)
    recs = []
    for i, score in selected:
        row = df.iloc[i]
        title = str(row['job_role'])
        domain = str(row['domain']) if 'domain' in row else "N/A"
        job_skills = _clean_split(row['skills'])
        exp_align = str(row['experience_alignment']) if 'experience_alignment' in row else ""
        penalty = _exp_penalty(exp_align, user_level)
        adj = max(0.0, min(1.0, float(score) + penalty))
        rel = int(round(adj * 100))
        why = _why_suitable(title, job_skills, user_skills, interests, domain)
        demand = str(row['demand_level_india']) if 'demand_level_india' in row else "Medium"
        salary = str(row['salary_entry_inr']) if 'salary_entry_inr' in row else "₹4–8 LPA"
        recs.append({
            "title": title,
            "domain": domain,
            "relevance_score": rel,
            "required_skills": job_skills[:8] if len(job_skills) > 8 else job_skills,
            "why_suitable": why,
            "demand_level_india": demand,
            "estimated_salary_range_india": salary
        })
    recs = sorted(recs, key=lambda x: x["relevance_score"], reverse=True)
    top3 = recs[:3]
    detailed = []
    for item in top3:
        career = item["title"]
        domain = item["domain"]
        roadmap = _roadmap_for_career(career, domain, user_skills, job_skills)
        cap, port, cvtips, iv, job = _capstone_portfolio_resume_interview_job(career, domain)
        detailed.append({
            "career": career,
            "duration": "3 Months",
            "roadmap": roadmap,
            "capstone_project": cap,
            "portfolio_guidance": port,
            "resume_tips": cvtips,
            "interview_preparation": iv,
            "job_strategy_india": job
        })
    return {
        "career_recommendations": recs,
        "top_3_detailed_roadmaps": detailed
    }

@app.post("/skill-gap")
def analyze_skill_gap_endpoint(req: SkillGapRequest):
    """
    Analyze skill gap between user skills and career requirements.
    
    Input:
    {
        "skills": ["react", "node"],
        "career": "Full Stack Developer"
    }
    
    Output:
    {
        "career": "Full Stack Developer",
        "matched_skills": ["react", "node"],
        "missing_skills": [{"skill": "mongodb", "priority": 0.95, "level": "beginner"}, ...],
        "match_percentage": 65,
        "status": "intermediate",
        "message": "💪 You're close! Focus on the missing skills.",
        "skill_count": {"user": 2, "required": 8, "matched": 2},
        "learning_path": {...}
    }
    """
    if df is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    if not req.career or not req.skills:
        return {
            "error": "Career and skills are required",
            "matched_skills": [],
            "missing_skills": [],
            "match_percentage": 0
        }
    
    try:
        # Use the SkillGapAnalyzer with our dataset
        result = analyze_skill_gap(req.skills, req.career, df)
        return result
    except Exception as e:
        print(f"Error in skill gap analysis: {e}")
        return {
            "error": str(e),
            "career": req.career,
            "matched_skills": [],
            "missing_skills": [],
            "match_percentage": 0
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
