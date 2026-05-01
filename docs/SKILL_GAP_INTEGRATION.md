# Skill Gap Analysis - Integration Guide

## Quick Start

### 1. Backend Setup

No additional setup needed! The skill gap endpoint is automatically available at:
```
POST /api/recommend/skill-gap
```

### 2. ML Service Setup

The Python skill gap module is pre-configured. Just ensure:
```bash
# Install dependencies
pip install -r ml_service/requirements.txt

# Start ML service
cd ml_service
python main.py
```

### 3. Frontend Integration

Add the SkillGapAnalysis component to any page:

```jsx
import SkillGapAnalysis from './components/SkillGapAnalysis';

export default function MyPage() {
  const token = localStorage.getItem('token');
  const userSkills = ['react', 'node'];
  const targetCareer = 'Full Stack Developer';

  return (
    <SkillGapAnalysis 
      skills={userSkills}
      career={targetCareer}
      token={token}
    />
  );
}
```

## API Usage Examples

### Using Axios in React

```jsx
import axios from 'axios';

async function analyzeSkillGap(skills, career) {
  try {
    const response = await axios.post(
      '/api/recommend/skill-gap',
      {
        skills: skills.map(s => s.toLowerCase()),
        career: career
      },
      {
        headers: {
          'x-auth-token': userToken
        }
      }
    );
    
    console.log('Skill Gap Analysis:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Using Fetch API

```javascript
async function analyzeSkillGap(skills, career) {
  const response = await fetch('/api/recommend/skill-gap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': userToken
    },
    body: JSON.stringify({
      skills: skills,
      career: career
    })
  });

  const data = await response.json();
  return data;
}
```

### Using cURL

```bash
curl -X POST http://localhost:5000/api/recommend/skill-gap \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -d '{
    "skills": ["react", "node.js"],
    "career": "Full Stack Developer"
  }'
```

## Component Props

```typescript
interface SkillGapAnalysisProps {
  skills?: string[];        // Initial user skills
  career?: string;          // Initial career
  token: string;           // Auth token (required)
}
```

## Response Structure

```typescript
interface SkillGapResponse {
  career: string;
  matched_skills: string[];
  missing_skills: Array<{
    skill: string;
    priority: number;        // 0-1 score
    level: string;           // "beginner" or "intermediate"
  }>;
  match_percentage: number;  // 0-100
  status: string;            // "ready", "intermediate", "beginner_advanced", "beginner"
  message: string;           // Status message with emoji
  skill_count: {
    user: number;
    required: number;
    matched: number;
  };
  learning_path: {
    phase: string;
    focus: string;
    recommendation: string;
    skills_to_learn: string[];
    timeline: string;
  };
  next_steps: string;        // Additional guidance
}
```

## Styling Customization

The component uses Tailwind CSS classes. To customize:

```jsx
// Custom styling wrapper
<div className="custom-skill-gap-container">
  <SkillGapAnalysis skills={skills} career={career} token={token} />
  <style>{`
    .custom-skill-gap-container {
      --primary-color: #6366f1;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
    }
  `}</style>
</div>
```

## Common Patterns

### 1. Integration with Career Selection

```jsx
function CareerPage() {
  const [selectedCareer, setSelectedCareer] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  const token = useAuth(); // Your auth hook

  return (
    <div>
      <h1>Career Path Finder</h1>
      
      {/* Career selector */}
      <select value={selectedCareer} onChange={(e) => setSelectedCareer(e.target.value)}>
        <option value="">Select a career...</option>
        <option value="Full Stack Developer">Full Stack Developer</option>
        <option value="Data Scientist">Data Scientist</option>
        <option value="Mobile Developer">Mobile Developer</option>
      </select>

      {/* Skill gap analyzer */}
      {selectedCareer && (
        <SkillGapAnalysis 
          skills={userSkills}
          career={selectedCareer}
          token={token}
        />
      )}
    </div>
  );
}
```

### 2. Integration with Profile Data

```jsx
import { useContext } from 'react';
import { CareerContext } from '../context/CareerContext';
import SkillGapAnalysis from '../components/SkillGapAnalysis';

function ProfilePage() {
  const { recommendations, token } = useContext(CareerContext);
  const [selectedCareer, setSelectedCareer] = useState(recommendations[0]?.job_role || '');

  return (
    <div>
      <h2>Your Skill Gap Analysis</h2>
      
      {/* Show gap for each recommended career */}
      {recommendations.map((rec) => (
        <SkillGapAnalysis 
          key={rec.job_role}
          skills={getProfileSkills()}
          career={rec.job_role}
          token={token}
        />
      ))}
    </div>
  );
}
```

### 3. Standalone Route

```jsx
// Create a new page route
import SkillGapAnalysis from '../components/SkillGapAnalysis';

export default function SkillGapPage() {
  const token = localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Skill Gap Analyzer</h1>
          <p className="text-gray-600 mt-2">
            Discover what skills you need to learn for your target career
          </p>
        </div>
        
        <SkillGapAnalysis token={token} />
      </div>
    </div>
  );
}
```

## Error Handling

```jsx
function handleSkillGapError(error) {
  if (error.response?.status === 400) {
    // Career not found
    showAlert('Career not found. Please try another career.');
  } else if (error.response?.status === 401) {
    // Unauthorized
    redirectToLogin();
  } else if (error.response?.status === 500) {
    // Server error
    showAlert('Server error. Please try again later.');
  } else {
    // Network error
    showAlert('Network error. Please check your connection.');
  }
}
```

## Performance Tips

1. **Memoize the component**:
```jsx
const MemoizedSkillGap = React.memo(SkillGapAnalysis);
```

2. **Lazy load the component**:
```jsx
const SkillGapAnalysis = React.lazy(() => import('./SkillGapAnalysis'));

<Suspense fallback={<LoadingSpinner />}>
  <SkillGapAnalysis {...props} />
</Suspense>
```

3. **Debounce API calls**:
```jsx
const debouncedAnalyze = useCallback(
  debounce((skills, career) => {
    analyzeSkillGap(skills, career);
  }, 500),
  []
);
```

## Testing

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillGapAnalysis from './SkillGapAnalysis';

test('analyzes skill gap correctly', async () => {
  const { getByText, getByPlaceholderText } = render(
    <SkillGapAnalysis token="test-token" />
  );

  // Input skills
  const skillsInput = getByPlaceholderText(/your skills/i);
  await userEvent.type(skillsInput, 'react, node');

  // Input career
  const careerInput = getByPlaceholderText(/target career/i);
  await userEvent.type(careerInput, 'Full Stack Developer');

  // Click analyze
  const button = getByText(/analyze skill gap/i);
  await userEvent.click(button);

  // Wait for results
  await waitFor(() => {
    expect(getByText(/match/i)).toBeInTheDocument();
  });
});
```

## Database Integration (Optional)

To save skill gap analyses to database:

```jsx
async function saveSkillGapAnalysis(analysis, userId) {
  await axios.post('/api/skill-gap-history', {
    userId,
    career: analysis.career,
    matchPercentage: analysis.match_percentage,
    matchedSkills: analysis.matched_skills,
    missingSkills: analysis.missing_skills,
    timestamp: new Date()
  });
}
```

Add to Express backend:

```javascript
router.post('/skill-gap-history', auth, async (req, res) => {
  const { career, matchPercentage, matchedSkills, missingSkills } = req.body;
  
  const analysis = new SkillGapHistory({
    user: req.user.id,
    career,
    matchPercentage,
    matchedSkills,
    missingSkills
  });
  
  await analysis.save();
  res.json(analysis);
});
```

## Monitoring & Logging

```python
# In skill_gap_analysis.py

import logging

logger = logging.getLogger(__name__)

def analyze_skill_gap(user_skills, career, df):
    try:
        logger.info(f"Analyzing gap for {career}")
        result = analyzer.analyze_gap(user_skills, required_skills, career)
        logger.info(f"Analysis complete: {result['match_percentage']}% match")
        return result
    except Exception as e:
        logger.error(f"Error analyzing gap: {e}")
        raise
```

## Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Start ML service: `python ml_service/main.py`
3. ✅ Import component: `import SkillGapAnalysis from './components/SkillGapAnalysis'`
4. ✅ Display the component with user token
5. ✅ Integrate with your app's flow

For detailed documentation, see [SKILL_GAP_ANALYSIS.md](./SKILL_GAP_ANALYSIS.md)
