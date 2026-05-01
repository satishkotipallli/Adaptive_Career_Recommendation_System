"""
Skill Gap Analysis Examples and Test Cases
Demonstrates usage of the SkillGapAnalyzer module with real-world scenarios
"""

import pandas as pd
from skill_gap_analysis import SkillGapAnalyzer, SkillNormalizer, FuzzyMatcher, analyze_skill_gap

# Sample dataset for testing
SAMPLE_DATA = {
    'job_role': [
        'Full Stack Developer',
        'Frontend Developer',
        'Backend Developer',
        'Data Scientist',
        'UI/UX Designer'
    ],
    'required_skills': [
        'javascript, react, node.js, express, mongodb, html, css, docker',
        'html, css, javascript, react, responsive design, figma',
        'node.js, express, mongodb, sql, rest api design, authentication, docker',
        'python, pandas, statistics, machine learning, sql, data visualization',
        'figma, ui design, ux design, user research, wireframing, prototyping'
    ],
    'skills': [
        'javascript, react, node, express, mongo, html, css',
        'html, css, javascript, react',
        'node, express, mongodb, rest api',
        'python, pandas, data analysis',
        'figma, ui design, prototyping'
    ],
    'domain': ['Web', 'Web', 'Web', 'Data', 'Creative']
}

df = pd.DataFrame(SAMPLE_DATA)


def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def print_result(result):
    """Pretty print skill gap analysis result"""
    print(f"Career: {result.get('career', 'N/A')}")
    print(f"Match Percentage: {result.get('match_percentage', 0)}%")
    print(f"Status: {result.get('status', 'N/A')}")
    print(f"Message: {result.get('message', 'N/A')}\n")

    if result.get('matched_skills'):
        print(f"✅ Matched Skills ({len(result['matched_skills'])}):")
        for skill in result['matched_skills']:
            print(f"  • {skill}")
        print()

    if result.get('missing_skills'):
        print(f"❌ Missing Skills ({len(result['missing_skills'])}):")
        for item in result['missing_skills']:
            if isinstance(item, dict):
                print(f"  • {item['skill']} (priority: {item['priority']}, level: {item['level']})")
            else:
                print(f"  • {item}")
        print()

    if result.get('skill_count'):
        counts = result['skill_count']
        print(f"Skill Summary:")
        print(f"  User Skills: {counts['user']}")
        print(f"  Required Skills: {counts['required']}")
        print(f"  Matched: {counts['matched']}")
        print()

    if result.get('learning_path'):
        path = result['learning_path']
        print(f"Learning Path:")
        print(f"  Phase: {path.get('phase', 'N/A')}")
        print(f"  Focus: {path.get('focus', 'N/A')}")
        print(f"  Timeline: {path.get('timeline', 'N/A')}")
        if path.get('skills_to_learn'):
            print(f"  Skills to Learn: {', '.join(path['skills_to_learn'])}")
        print()


# ============================================================================
# Example 1: Beginner with No Relevant Skills
# ============================================================================
def example_1_beginner_no_skills():
    """User starting from scratch"""
    print_header("Example 1: Beginner (No Relevant Skills)")

    result = analyze_skill_gap(
        user_skills=['communication', 'teamwork'],
        career='Full Stack Developer',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 2: Intermediate Developer (Partial Match)
# ============================================================================
def example_2_intermediate_partial_match():
    """User with some skills, missing others"""
    print_header("Example 2: Intermediate Developer (Partial Match)")

    result = analyze_skill_gap(
        user_skills=['javascript', 'react', 'html', 'css', 'node'],
        career='Full Stack Developer',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 3: Senior Developer (Near Perfect Match)
# ============================================================================
def example_3_senior_near_perfect():
    """User with most required skills"""
    print_header("Example 3: Senior Developer (Near Perfect Match)")

    result = analyze_skill_gap(
        user_skills=['javascript', 'react', 'node.js', 'express', 'mongodb', 'html', 'css', 'docker'],
        career='Full Stack Developer',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 4: Career Pivot (Different Domain)
# ============================================================================
def example_4_career_pivot():
    """User transitioning from Web to Data Science"""
    print_header("Example 4: Career Pivot (Web Developer → Data Scientist)")

    result = analyze_skill_gap(
        user_skills=['javascript', 'python', 'sql', 'html', 'css'],
        career='Data Scientist',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 5: Fuzzy Matching (Abbreviations & Variations)
# ============================================================================
def example_5_fuzzy_matching():
    """Test fuzzy matching with abbreviations"""
    print_header("Example 5: Fuzzy Matching (Abbreviations & Variations)")

    # Using abbreviations and variations
    result = analyze_skill_gap(
        user_skills=['js', 'react', 'node.js', 'mongo db', 'html/css'],
        career='Full Stack Developer',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 6: Frontend Developer Path
# ============================================================================
def example_6_frontend_developer():
    """Frontend developer skill gap"""
    print_header("Example 6: Frontend Developer")

    result = analyze_skill_gap(
        user_skills=['html', 'css', 'javascript'],
        career='Frontend Developer',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 7: Designer to UX/UI (Domain Shift)
# ============================================================================
def example_7_designer_to_ux():
    """Designer learning UX/UI"""
    print_header("Example 7: Designer Transitioning to UX/UI")

    result = analyze_skill_gap(
        user_skills=['adobe tools', 'graphic design', 'color theory'],
        career='UI/UX Designer',
        df=df
    )

    print_result(result)


# ============================================================================
# Example 8: Skill Normalization Test
# ============================================================================
def example_8_skill_normalization():
    """Demonstrate skill normalization"""
    print_header("Example 8: Skill Normalization")

    test_cases = [
        'JavaScript',
        'js',
        'Node.JS',
        'MongoDB',
        'mongo db',
        'ReactJS',
        'React.js',
        'REST API',
        'Rest api',
        'Docker',
        'DOCKER'
    ]

    print("Normalization Examples:\n")
    for skill in test_cases:
        normalized = SkillNormalizer.normalize(skill)
        print(f"  '{skill}' → '{normalized}'")


# ============================================================================
# Example 9: Fuzzy Matching Test
# ============================================================================
def example_9_fuzzy_matching():
    """Demonstrate fuzzy matching"""
    print_header("Example 9: Fuzzy Matching")

    test_cases = [
        ('javscript', {'javascript'}),  # Typo
        ('recat', {'react'}),  # Typo
        ('mongodb', {'mongodb'}),  # Exact
        ('mongo', {'mongodb'}),  # Partial
        ('js', {'javascript'}),  # Abbreviation
    ]

    candidates = {'javascript', 'react', 'mongodb', 'python', 'node'}

    print("Fuzzy Matching Examples:\n")
    for user_skill, expected in test_cases:
        normalized = SkillNormalizer.normalize(user_skill)
        match = FuzzyMatcher.find_fuzzy_match(normalized, candidates)
        print(f"  '{user_skill}' (normalized: '{normalized}')")
        print(f"    → Matched: {match}")
        print(f"    → Expected: {expected}")
        print()


# ============================================================================
# Example 10: Progress Tracking Over Time
# ============================================================================
def example_10_progress_tracking():
    """Simulate tracking progress over time"""
    print_header("Example 10: Progress Tracking Over Time")

    career = 'Full Stack Developer'
    
    # Week 1
    print("📅 Week 1 - Starting Point")
    result1 = analyze_skill_gap(
        user_skills=['javascript', 'html', 'css'],
        career=career,
        df=df
    )
    print(f"Match: {result1['match_percentage']}%\n")

    # Week 4
    print("📅 Week 4 - After Learning React")
    result2 = analyze_skill_gap(
        user_skills=['javascript', 'html', 'css', 'react'],
        career=career,
        df=df
    )
    print(f"Match: {result2['match_percentage']}%\n")

    # Week 8
    print("📅 Week 8 - After Learning Node & Express")
    result3 = analyze_skill_gap(
        user_skills=['javascript', 'html', 'css', 'react', 'node', 'express'],
        career=career,
        df=df
    )
    print(f"Match: {result3['match_percentage']}%\n")

    # Week 12
    print("📅 Week 12 - Almost There!")
    result4 = analyze_skill_gap(
        user_skills=['javascript', 'html', 'css', 'react', 'node', 'express', 'mongodb'],
        career=career,
        df=df
    )
    print(f"Match: {result4['match_percentage']}%\n")

    # Calculate improvement
    improvement = result4['match_percentage'] - result1['match_percentage']
    print(f"📈 Total Improvement: {improvement:.1f}%")
    print(f"Skills Gained: {result4['skill_count']['matched'] - result1['skill_count']['matched']}")


# ============================================================================
# Main Execution
# ============================================================================
def main():
    """Run all examples"""
    print("\n" + "="*80)
    print("  Skill Gap Analysis - Examples and Test Cases")
    print("="*80)

    try:
        # Run all examples
        example_1_beginner_no_skills()
        example_2_intermediate_partial_match()
        example_3_senior_near_perfect()
        example_4_career_pivot()
        example_5_fuzzy_matching()
        example_6_frontend_developer()
        example_7_designer_to_ux()
        example_8_skill_normalization()
        example_9_fuzzy_matching()
        example_10_progress_tracking()

        print_header("All Tests Completed Successfully! ✅")

    except Exception as e:
        print_header("Error Running Tests ❌")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
