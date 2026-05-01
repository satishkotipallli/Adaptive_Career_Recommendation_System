"""
Skill Gap Analysis Module
Handles skill gap calculation with fuzzy matching, synonym handling, and TF-IDF prioritization.
"""

from typing import List, Dict, Set, Tuple, Optional
from difflib import SequenceMatcher
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re


class SkillNormalizer:
    """Normalizes and standardizes skill names."""
    
    # Skill expansion mapping for broader matching
    SKILL_EXPANSION = {
        'journalism': ['writing', 'editing', 'content writing', 'media'],
        'writer': ['writing', 'content writing'],
        'seo': ['marketing', 'search engine optimization'],
        'blogging': ['writing', 'content creation'],
        'media': ['communication', 'journalism']
    }
    
    # Synonyms mapping for common skills
    SKILL_SYNONYMS = {
        'js': 'javascript',
        'ts': 'typescript',
        'py': 'python',
        'db': 'database',
        'sql': 'sql',
        'ml': 'machine learning',
        'ai': 'artificial intelligence',
        'dl': 'deep learning',
        'nlp': 'natural language processing',
        'cv': 'computer vision',
        'react.js': 'react',
        'angular.js': 'angular',
        'vue.js': 'vue',
        'node.js': 'node',
        'express.js': 'express',
        'mongo': 'mongodb',
        'postgres': 'postgresql',
        'aws': 'amazon web services',
        'gcp': 'google cloud platform',
        'devops': 'devops',
        'ci/cd': 'cicd',
        'rest api': 'rest api',
        'graphql': 'graphql',
        'docker': 'docker',
        'kubernetes': 'kubernetes',
        'git': 'git',
        'github': 'github',
        'gitlab': 'gitlab',
        'figma': 'figma',
        'photoshop': 'photoshop',
        'illustrator': 'illustrator',
        'adobe xd': 'adobe xd',
        'ux': 'ux design',
        'ui': 'ui design',
        'seo': 'search engine optimization',
        'excel': 'excel',
        'powerbi': 'power bi',
        'tableau': 'tableau',
        'power bi': 'power bi',
        'etl': 'etl',
        'spark': 'apache spark',
        'hadoop': 'hadoop',
        'kafka': 'apache kafka',
    }
    
    # Noise words to remove
    NOISE_WORDS = {
        'experience', 'knowledge', 'strong', 'excellent', 'expertise',
        'capability', 'ability', 'skill', 'proficiency', 'familiarity',
        'working', 'understanding', 'deep', 'hands-on', 'good'
    }

    @staticmethod
    def normalize(skill: str) -> str:
        """
        Normalize a single skill name.
        
        Args:
            skill: Raw skill string
            
        Returns:
            Normalized skill string
        """
        if not skill:
            return ""
        
        # Convert to lowercase and strip whitespace
        normalized = skill.lower().strip()
        
        # Remove special characters and extra spaces
        normalized = re.sub(r'[^a-z0-9\s\-\+]', '', normalized)
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        # Remove noise words
        words = normalized.split()
        words = [w for w in words if w not in SkillNormalizer.NOISE_WORDS]
        normalized = ' '.join(words)
        
        # Apply synonyms
        if normalized in SkillNormalizer.SKILL_SYNONYMS:
            normalized = SkillNormalizer.SKILL_SYNONYMS[normalized]
        
        return normalized

    @staticmethod
    def normalize_skills(skills: List[str]) -> Set[str]:
        """
        Normalize and expand a list of skills and return as a set (removes duplicates).
        
        Args:
            skills: List of skill strings
            
        Returns:
            Set of normalized and expanded skills
        """
        expanded = set()
        for skill in skills:
            # Normalize the skill
            norm_skill = SkillNormalizer.normalize(skill)
            if norm_skill:
                expanded.add(norm_skill)
                # Add expanded skills if available
                if norm_skill in SkillNormalizer.SKILL_EXPANSION:
                    expanded.update(SkillNormalizer.SKILL_EXPANSION[norm_skill])
        return expanded


class FuzzyMatcher:
    """Handles fuzzy matching between skills."""
    
    THRESHOLD = 0.80  # Similarity threshold (80%)
    
    @staticmethod
    def similarity(skill1: str, skill2: str) -> float:
        """
        Calculate similarity between two skills using SequenceMatcher.
        
        Args:
            skill1: First skill
            skill2: Second skill
            
        Returns:
            Similarity score between 0 and 1
        """
        return SequenceMatcher(None, skill1, skill2).ratio()
    
    @staticmethod
    def find_fuzzy_match(skill: str, candidates: Set[str]) -> Optional[str]:
        """
        Find the best fuzzy match for a skill in a set of candidates.
        
        Args:
            skill: Skill to match
            candidates: Set of candidate skills
            
        Returns:
            Best matching skill or None if no match above threshold
        """
        best_match = None
        best_score = FuzzyMatcher.THRESHOLD
        
        for candidate in candidates:
            score = FuzzyMatcher.similarity(skill, candidate)
            if score > best_score:
                best_score = score
                best_match = candidate
        
        return best_match
    
    @staticmethod
    def match_skills(user_skills: Set[str], required_skills: Set[str]) -> Tuple[Set[str], Set[str]]:
        """
        Match user skills with required skills using fuzzy matching.
        Falls back to exact match if no fuzzy match is found.
        
        Args:
            user_skills: Set of user skills
            required_skills: Set of required skills
            
        Returns:
            Tuple of (matched_skills, unmatched_required_skills)
        """
        matched = set()
        unmatched = set(required_skills)
        
        for user_skill in user_skills:
            # Check for exact match first
            if user_skill in required_skills:
                matched.add(user_skill)
                unmatched.discard(user_skill)
            else:
                # Try fuzzy matching
                fuzzy_match = FuzzyMatcher.find_fuzzy_match(user_skill, required_skills)
                if fuzzy_match:
                    matched.add(fuzzy_match)
                    unmatched.discard(fuzzy_match)
        
        return matched, unmatched


class SkillGapAnalyzer:
    """Analyzes skill gaps between user skills and required career skills."""
    
    def __init__(self, df: Optional[pd.DataFrame] = None):
        """
        Initialize the analyzer.
        
        Args:
            df: DataFrame with job_role, required_skills, and skills columns
        """
        self.df = df
        self.tfidf_cache = {}
        
        # Build skill frequency cache for TF-IDF weighting
        if df is not None:
            self._build_skill_weights()
    
    def _build_skill_weights(self) -> None:
        """Build TF-IDF weights for skills across all jobs."""
        if self.df is None:
            return
        
        # Combine all skills
        all_skills_text = []
        for _, row in self.df.iterrows():
            skills = row.get('required_skills', '') or row.get('skills', '')
            all_skills_text.append(str(skills).lower())
        
        if all_skills_text:
            # Calculate TF-IDF
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=500,
                lowercase=True
            )
            try:
                tfidf_matrix = vectorizer.fit_transform(all_skills_text)
                self.tfidf_vectorizer = vectorizer
                self.tfidf_matrix = tfidf_matrix
            except Exception as e:
                print(f"Warning: TF-IDF calculation failed: {e}")
    
    def _match_skills_tfidf(
        self,
        user_skills: Set[str],
        required_skills: Set[str]
    ) -> Tuple[Set[str], Set[str]]:
        """
        Match user skills to required skills using TF-IDF and cosine similarity.
        
        Args:
            user_skills: Set of user skills
            required_skills: Set of required skills
            
        Returns:
            Tuple of (matched_skills, missing_skills)
        """
        if not hasattr(self, 'tfidf_vectorizer') or self.tfidf_vectorizer is None:
            # Fallback to exact matching if TF-IDF not available
            matched = user_skills & required_skills
            missing = required_skills - user_skills
            return matched, missing
        
        matched = set()
        user_text = ' '.join(user_skills)
        
        try:
            user_vector = self.tfidf_vectorizer.transform([user_text])
            
            for req_skill in required_skills:
                req_vector = self.tfidf_vectorizer.transform([req_skill])
                similarity = cosine_similarity(user_vector, req_vector)[0][0]
                
                # Consider matched if similarity > 0.3 (adjust threshold as needed)
                if similarity > 0.3:
                    matched.add(req_skill)
        except Exception as e:
            print(f"Warning: TF-IDF matching failed: {e}")
            # Fallback
            matched = user_skills & required_skills
        
        missing = required_skills - matched
        return matched, missing
    
    def get_career_skills(self, career: str) -> Optional[Set[str]]:
        """
        Extract and normalize required skills for a career.
        
        Args:
            career: Career title
            
        Returns:
            Set of normalized required skills or None if career not found
        """
        if self.df is None:
            return None
        
        # Find career in dataset
        career_lower = career.lower()
        career_row = self.df[
            self.df['job_role'].str.lower().str.contains(career_lower, na=False)
        ].iloc[0] if any(self.df['job_role'].str.lower().str.contains(career_lower, na=False)) else None
        
        if career_row is None:
            return None
        
        # Extract skills
        skills_text = career_row.get('required_skills') or career_row.get('skills', '')
        if not skills_text:
            return set()
        
        # Parse skills (comma or space separated)
        skills_list = re.split(r'[,;]|\s+and\s+|\s+or\s+', str(skills_text))
        
        return SkillNormalizer.normalize_skills(skills_list)
    
    def analyze_gap(
        self,
        user_skills: List[str],
        required_skills: List[str],
        career: str = ""
    ) -> Dict:
        """
        Analyze skill gap between user skills and required skills.
        
        Args:
            user_skills: User's current skills
            required_skills: Skills required for the career
            career: Career title for context
            
        Returns:
            Dictionary with skill gap analysis
        """
        # Normalize skills
        norm_user_skills = SkillNormalizer.normalize_skills(user_skills)
        norm_required_skills = SkillNormalizer.normalize_skills(required_skills)
        
        # Handle edge case: no skills
        if not norm_user_skills:
            return {
                "career": career,
                "matched_skills": [],
                "missing_skills": sorted(list(norm_required_skills)),
                "match_percentage": 0,
                "status": "beginner",
                "message": "No skills provided. Start with the basics!",
                "skill_count": {
                    "user": 0,
                    "required": len(norm_required_skills),
                    "matched": 0
                }
            }
        
        # Match skills using TF-IDF similarity
        matched_skills, missing_skills = self._match_skills_tfidf(
            norm_user_skills,
            norm_required_skills
        )
        
        # Calculate match percentage
        match_percentage = (
            len(matched_skills) / len(norm_required_skills) * 100
            if norm_required_skills else 0
        )
        
        # Determine status
        if match_percentage >= 90:
            status = "ready"
            message = "🎯 You're ready for this role!"
        elif match_percentage >= 70:
            status = "intermediate"
            message = "💪 You're close! Focus on the missing skills."
        elif match_percentage >= 40:
            status = "beginner_advanced"
            message = "📚 Good foundation. Continue building your skills."
        else:
            status = "beginner"
            message = "🚀 Start your learning journey!"
        
        # Rank missing skills by importance using TF-IDF
        ranked_missing = self._rank_missing_skills(
            list(missing_skills),
            list(matched_skills)
        )
        
        return {
            "career": career,
            "matched_skills": sorted(list(matched_skills)),
            "missing_skills": ranked_missing,
            "match_percentage": round(match_percentage, 2),
            "status": status,
            "message": message,
            "skill_count": {
                "user": len(norm_user_skills),
                "required": len(norm_required_skills),
                "matched": len(matched_skills)
            },
            "learning_path": self._suggest_learning_path(
                ranked_missing,
                match_percentage
            )
        }
    
    def _rank_missing_skills(self, missing: List[str], matched: List[str]) -> List[Dict]:
        """
        Rank missing skills by importance.
        
        Args:
            missing: List of missing skills
            matched: List of matched skills
            
        Returns:
            List of missing skills with priority scores
        """
        if not missing:
            return []
        
        ranked = []
        
        # Simple priority scoring:
        # - Fundamental skills (core, basic, foundation) score higher
        # - More common skills score higher
        # - Paired skills (skills that often appear with matched skills) score higher
        
        fundamental_keywords = {
            'core', 'basic', 'foundation', 'fundamental', 'essential',
            'principle', 'concept', 'programming', 'language'
        }
        
        for i, skill in enumerate(missing):
            # Priority based on position (earlier recommendations are higher priority)
            priority = 1 - (i / max(len(missing), 1)) * 0.5
            
            # Boost for fundamental skills
            if any(kw in skill.lower() for kw in fundamental_keywords):
                priority += 0.2
            
            # Base importance on skill name length and commonality
            # Shorter, core skill names are more fundamental
            if len(skill.split()) <= 2:
                priority += 0.1
            
            ranked.append({
                "skill": skill,
                "priority": round(priority, 2),
                "level": "beginner" if priority > 0.7 else "intermediate"
            })
        
        # Sort by priority descending
        ranked.sort(key=lambda x: x['priority'], reverse=True)
        return ranked
    
    def _suggest_learning_path(self, missing_skills: List[Dict], match_pct: float) -> Dict:
        """
        Suggest a learning path based on missing skills.
        
        Args:
            missing_skills: Ranked missing skills
            match_pct: Current match percentage
            
        Returns:
            Dictionary with learning path suggestions
        """
        if match_pct >= 90:
            return {
                "phase": "advanced",
                "focus": "specialization",
                "recommendation": "You're ready! Consider specializing or taking on projects.",
                "skills_to_learn": []
            }
        
        # Suggest top 3-5 skills to focus on
        focus_skills = [s["skill"] for s in missing_skills[:5]]
        
        if match_pct >= 70:
            return {
                "phase": "intermediate",
                "focus": "specialization",
                "recommendation": f"Focus on: {', '.join(focus_skills[:3])}",
                "skills_to_learn": focus_skills[:3],
                "timeline": "2-3 months"
            }
        elif match_pct >= 40:
            return {
                "phase": "intermediate",
                "focus": "skill_building",
                "recommendation": f"Build these core skills: {', '.join(focus_skills[:5])}",
                "skills_to_learn": focus_skills[:5],
                "timeline": "3-6 months"
            }
        else:
            return {
                "phase": "beginner",
                "focus": "foundation",
                "recommendation": f"Start with fundamentals: {', '.join(focus_skills[:5])}",
                "skills_to_learn": focus_skills[:5],
                "timeline": "6-12 months"
            }


def analyze_skill_gap(
    user_skills: List[str],
    career: str,
    df: Optional[pd.DataFrame] = None
) -> Dict:
    """
    Main function to analyze skill gap.
    
    Args:
        user_skills: User's current skills
        career: Target career
        df: Optional DataFrame with job data
        
    Returns:
        Skill gap analysis result
    """
    analyzer = SkillGapAnalyzer(df)
    
    # Get career skills
    required_skills = analyzer.get_career_skills(career)
    
    if required_skills is None:
        return {
            "error": f"Career '{career}' not found in dataset",
            "career": career,
            "matched_skills": [],
            "missing_skills": [],
            "match_percentage": 0
        }
    
    # Analyze gap
    return analyzer.analyze_gap(user_skills, list(required_skills), career)
