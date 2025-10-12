# ⚛️ FitAddict Frontend

> React frontend สำหรับแพลตฟอร์ม FitAddict ที่รองรับ real-time pose detection, AI analysis, และ interactive workout experience

## 📋 สารบัญ

- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [การติดตั้ง](#การติดตั้ง)
- [Environment Variables](#environment-variables)
- [Component Structure](#component-structure)
- [Features](#features)
- [การใช้งาน](#การใช้งาน)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## 🛠️ เทคโนโลยีที่ใช้

- **React 19.1.0** - UI Library
- **React Router DOM 7.7.0** - Navigation
- **MediaPipe** - Real-time pose detection
- **D3.js 7.9.0** - Data visualization
- **Lucide React** - Icons
- **Google OAuth** - Authentication
- **CSS3** - Responsive styling with animations
- **Gemini AI** - Intelligent pose analysis

---

## 🚀 การติดตั้ง

### 1. ความต้องการระบบ

```bash
# ตรวจสอบ Node.js version
node --version  # ต้อง >= 16.0.0
npm --version   # ต้อง >= 8.0.0
```

### 2. ติดตั้ง Dependencies

```bash
# ไปยัง frontend directory
cd frontend

# ติดตั้ง packages
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root ของ frontend:

```env
# Backend API Configuration
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_BASE=http://localhost:8000

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Gemini AI API (สำหรับ pose analysis)
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 4. เริ่มต้น Development Server

```bash
npm start
```

Application จะรันที่: `http://localhost:3000`

---

## 🔐 Environment Variables

### Required Variables

```env
# ===== BACKEND CONNECTION =====
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_BASE=http://localhost:8000

# ===== GOOGLE OAUTH =====
REACT_APP_GOOGLE_CLIENT_ID=78129955457-9v6dj3ueq8fo7ummg0l65nruibi0pa1r.apps.googleusercontent.com

# ===== AI INTEGRATION =====
REACT_APP_GEMINI_API_KEY=AIzaSyD41JauEwzyNkJbh5os7YwWZ9pmiNS2EI8
```

### Optional Variables

```env
# ===== DEVELOPMENT =====
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug

# ===== FEATURES =====
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_POSE_MIRROR=true
```

---

## 🏗️ Component Structure

```
src/
├── components/                 # Reusable components
│   ├── Dashboard.css          # Dashboard styles + animations
│   ├── KeypointOverlay.js     # MediaPipe pose overlay
│   ├── TrainerHeader.js       # Trainer dashboard header
│   ├── TraineeHeader.js       # Trainee dashboard header
│   ├── VideoCard.js           # Video display component
│   ├── TrainerCard.js         # Trainer profile card
│   └── UserActivityCard.js    # Activity tracking card
│
├── pages/                     # Page components
│   ├── WorkoutPage.js         # Main workout interface
│   ├── TrainerPage.js         # Trainer dashboard
│   ├── TraineePage.js         # Trainee dashboard
│   ├── TraineeAnalyticsPage.js # Analytics view
│   ├── AdminTrainerView.js    # Admin trainer management
│   └── LoginPage.js           # Authentication page
│
├── utils/                     # Utility functions
│   ├── MultiDirectionalPoseComparator.js  # AI pose analysis
│   ├── polling.js             # Data polling utilities
│   └── auth.js                # Authentication helpers
│
├── contexts/                  # React contexts
│   └── LoadingProvider.js     # Loading state management
│
├── styles/                    # CSS files
│   ├── WorkoutPage.css        # Workout interface styles
│   └── AdminTrainerVideos.css # Admin video management
│
└── App.js                     # Main application component
```

---

## ✨ Features

### 🎯 Core Features

#### 1. Real-time Pose Detection
- MediaPipe integration สำหรับ pose detection
- Real-time keypoints tracking
- Mirror mode support สำหรับ trainee

```javascript
// KeypointOverlay.js
import { Pose } from '@mediapipe/pose';

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});
```

#### 2. AI-Powered Pose Analysis
- Gemini AI integration สำหรับ pose comparison
- Exercise-specific scoring weights
- Multi-directional pose analysis

```javascript
// MultiDirectionalPoseComparator.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
```

#### 3. Interactive Workout Experience
- Countdown timer ก่อนเริ่มออกกำลังกาย
- Real-time accuracy scoring
- Pre-exercise pose comparison
- Live feedback system

#### 4. User Management
- Google OAuth authentication
- Trainer-Trainee relationship management
- Profile management with avatars
- Points and progress tracking

### 🎨 UI/UX Features

#### 1. Responsive Design
- Mobile-friendly interface
- Adaptive layouts สำหรับทุกขนาดหน้าจอ
- Touch-friendly controls

#### 2. Loading Animations
- Running character animations
- Smooth transitions
- Loading states feedback

#### 3. Real-time Updates
- Live status indicators
- Polling for data updates
- WebSocket-ready architecture

---

## 📱 การใช้งาน

### สำหรับ Trainee

#### 1. เข้าสู่ระบบ
```javascript
// ใช้ Google OAuth
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

#### 2. เลือกและเล่นวิดีโอ
- Browse videos จาก trainer
- เลือกความยากง่าย (Easy, Medium, Hard)
- เริ่มต้น workout session

#### 3. Workout Session
- เปิดกล้องสำหรับ pose detection
- ทำตามวิดีโอ trainer
- ดู real-time accuracy score
- รับ AI feedback

### สำหรับ Trainer

#### 1. อัปโหลดวิดีโอ
- Upload workout videos
- ตั้งค่า title, description, difficulty
- ระบุ exercise type สำหรับ AI analysis

#### 2. จัดการ Trainees
- ดูรายชื่อ trainees
- ติดตาม progress และ points
- ดู analytics และสถิติ

#### 3. Monitor Performance
- ดู real-time online status
- Analytics dashboard
- Video performance metrics

---

## 🎬 MediaPipe Integration

### Camera Setup

```javascript
// KeypointOverlay.js
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    });
    videoRef.current.srcObject = stream;
  } catch (error) {
    console.error('Camera access denied:', error);
  }
};
```

### Pose Detection Configuration

```javascript
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
```

### Keypoints Processing

```javascript
const onResults = (results) => {
  if (results.poseLandmarks) {
    const keypoints = results.poseLandmarks.map((landmark, index) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
      id: index
    }));
    
    onKeypointsDetected(keypoints);
  }
};
```

---

## 🤖 AI Integration

### Gemini AI Setup

```javascript
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

### Pose Analysis

```javascript
const analyzePose = async (trainerKeypoints, traineeKeypoints, exerciseType) => {
  const prompt = `
    Analyze the pose comparison between trainer and trainee for ${exerciseType} exercise.
    Trainer keypoints: ${JSON.stringify(trainerKeypoints)}
    Trainee keypoints: ${JSON.stringify(traineeKeypoints)}
    
    Provide feedback on form and accuracy (0-100%).
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};
```

---

## 🎨 Styling Guidelines

### CSS Variables

```css
:root {
  --primary-color: #a855f7;
  --secondary-color: #ff4d8b;
  --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --text-primary: #1e293b;
  --text-secondary: #64748b;
}
```

### Animation Classes

```css
/* Running character animation */
.running-loader {
  display: flex;
  align-items: center;
  gap: 12px;
}

.runner {
  position: relative;
  width: 36px;
  height: 40px;
  animation: runner-bob 0.6s ease-in-out infinite;
}

/* Keyframes for smooth animations */
@keyframes runner-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
```

### Responsive Design

```css
/* Mobile-first approach */
.workout-page {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .workout-page {
    grid-template-columns: 1fr auto 1fr;
    gap: 2rem;
  }
}
```

---

## 🐛 การแก้ไขปัญหา

### Camera Issues

#### ไม่สามารถเข้าถึงกล้อง
```javascript
// ตรวจสอบ permissions
navigator.permissions.query({ name: 'camera' })
  .then(result => {
    if (result.state === 'denied') {
      alert('Please allow camera access for pose detection');
    }
  });
```

#### MediaPipe Loading Error
```javascript
// ตรวจสอบ CDN connection
const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }
});

// Fallback to local files
if (!pose) {
  console.error('MediaPipe failed to load from CDN');
}
```

### API Connection Issues

#### Backend Connection Failed
```javascript
// ตรวจสอบ backend URL
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

fetch(`${API_BASE}/health`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Backend not responding: ${response.status}`);
    }
  })
  .catch(error => {
    console.error('Backend connection failed:', error);
  });
```

#### CORS Issues
```javascript
// ตรวจสอบ CORS settings
const fetchWithCORS = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

### Performance Issues

#### MediaPipe Performance
```javascript
// ลด model complexity สำหรับ performance
pose.setOptions({
  modelComplexity: 0,  // ลดจาก 1 เป็น 0
  smoothLandmarks: false,
  minDetectionConfidence: 0.7,  // เพิ่มเพื่อลด false positives
});
```

#### Memory Leaks
```javascript
// Cleanup ใน useEffect
useEffect(() => {
  return () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (pose) {
      pose.close();
    }
  };
}, []);
```

### Build Issues

#### Module Resolution Error
```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install

# หรือใช้ npm ci สำหรับ clean install
npm ci
```

#### Environment Variables Not Loading
```bash
# ตรวจสอบว่า .env อยู่ใน root ของ frontend
ls -la | grep .env

# ตรวจสอบ syntax ใน .env (ไม่มี space รอบ =)
cat .env
```

---

## 📊 Performance Optimization

### Code Splitting

```javascript
// Lazy loading components
import { lazy, Suspense } from 'react';

const WorkoutPage = lazy(() => import('./pages/WorkoutPage'));

// ใช้ Suspense wrapper
<Suspense fallback={<div>Loading...</div>}>
  <WorkoutPage />
</Suspense>
```

### MediaPipe Optimization

```javascript
// ลด frame rate สำหรับ performance
let lastProcessTime = 0;
const PROCESS_INTERVAL = 100; // ms

const onResults = (results) => {
  const now = Date.now();
  if (now - lastProcessTime < PROCESS_INTERVAL) return;
  lastProcessTime = now;
  
  // Process results
};
```

### Bundle Size Optimization

```javascript
// Tree shaking สำหรับ icons
import { Play, Pause } from 'lucide-react';
// แทนที่จะ import ทั้งหมด
// import * as Icons from 'lucide-react';
```

---

## 🧪 Testing

### Component Testing

```javascript
// Testing React components
import { render, screen } from '@testing-library/react';
import WorkoutPage from './WorkoutPage';

test('renders workout interface', () => {
  render(<WorkoutPage />);
  expect(screen.getByText('Start Workout')).toBeInTheDocument();
});
```

### MediaPipe Testing

```javascript
// Mock MediaPipe สำหรับ testing
jest.mock('@mediapipe/pose', () => ({
  Pose: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn()
  }))
}));
```

---

## 🚀 Deployment

### Build Production

```bash
# สร้าง production build
npm run build

# Preview build locally
npx serve -s build
```

### Environment Variables for Production

```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_CLIENT_ID=your-production-client-id
REACT_APP_GEMINI_API_KEY=your-production-api-key
```

### Deployment to Netlify/Vercel

```bash
# Build และ deploy
npm run build

# หรือใช้ auto-deployment จาก Git
```

---

## 🔒 Security Considerations

1. **API Keys** - เก็บใน environment variables เท่านั้น
2. **HTTPS** - ใช้ HTTPS ใน production สำหรับ camera access
3. **Input Validation** - validate user input ก่อนส่งไป backend
4. **CORS** - ตั้งค่า CORS อย่างระมัดระวัง

---

## 📈 Analytics Integration

```javascript
// Google Analytics (ถ้าใช้)
import { gtag } from 'ga-gtag';

gtag('event', 'workout_started', {
  exercise_type: 'squat',
  difficulty: 'medium'
});
```

---

**Happy Frontend Development! ⚛️🚀**

3. Fill in the secrets: (most likely for backend)
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
S3_BUCKET_NAME=your-bucket-name
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxxxxx
AWS_SECRET_ACCESS_KEY=yyyyyy
```

4. Do **NOT** commit `.env`. It’s ignored by `.gitignore`.

5. Install dependencies & run:

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
npm install
npm run dev
```
---

## ✅ 2️⃣ Create a new branch

**Never work directly on `main`!**

```bash
git checkout -b feature/your-feature-name
```

Use clear names:  
- `feature/` for new features  
- `fix/` for bug fixes  
- `chore/` for setup/config tasks

---

## ✅ 3️⃣ Make your changes locally

- Run it locally (`npm run dev` or `npm run start`)
- Test your changes
- Write unit tests if needed (`npm test`)

---

## ✅ 4️⃣ Stage, commit & push

```bash
git add .
git commit -m "feat: add login page"
git push origin feature/your-feature-name
```

---

## ✅ 5️⃣ Open a Pull Request (PR)

- Go to GitHub → Compare & Pull Request
- Write a clear title and description
- Link to any related issue or task
- Add screenshots if it’s UI
- Mark the PR as draft if it’s not ready for full review yet.
---

## ✅ 6️⃣ Wait for CI to pass

- GitHub Actions will auto-run tests/build.
- If checks fail, fix them and push again.

---

## ✅ 7️⃣ Request a review

- Assign a reviewer (e.g. your team lead)
- Wait for approval before merging

---

## ✅ 8️⃣ Merge & pull latest

- After approval, merge into `main`
- Sync your local `main` regularly:

```bash
git checkout main
git pull origin main
```

---

## ✅ 9️⃣ CI/CD Secrets

Your secrets are stored securely in **GitHub Secrets**:
- `DATABASE_URL`
- `S3_BUCKET_NAME`
- `S3_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

They’re automatically injected via `env:` in `.github/workflows/ci.yml`.
If you add new secrets later, tell the team lead to update GitHub Secrets.

---
## ✅ 1️⃣0️⃣ CI/CD Flow

- On **any push**, tests & builds run automatically.
- On **main branch push**, deployment runs.
- Do not push `.env` — keep it local only!

---

## ⚡️ Good practices

- Commit small, logical changes.
- Write meaningful commit messages.
- Don’t commit `.env` or secrets.
- Follow the coding style guide.
- Keep branches small — merge early, merge often.

---
## ✅  Notes

- Keep your `.env` safe.
- Share only in secure chat or vault.
- Contact lead for updated secrets.
---

**Questions?**  
Ask in the team chat or open an issue!

Happy coding! ✨
