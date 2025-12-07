# 🏋️ FitAddict - AI-Powered Fitness Training Platform

> แพลตฟอร์มออกกำลังกายอัจฉริยะด้วย AI ที่ช่วยวิเคราะห์ท่าทางและให้คำแนะนำแบบเรียลไทม์

## 📋 สารบัญ

- [เกี่ยวกับโปรเจกต์](#เกี่ยวกับโปรเจกต์)
- [คุณสมบัติหลัก](#คุณสมบัติหลัก)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [การติดตั้งและ Setup](#การติดตั้งและ-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [การใช้งาน](#การใช้งาน)
- [Structure โปรเจกต์](#structure-โปรเจกต์)
- [API Documentation](#api-documentation)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## 🎯 เกี่ยวกับโปรเจกต์

FitAddict เป็นแพลตฟอร์มออกกำลังกายที่ใช้เทคโนโลยี AI และ Computer Vision ในการวิเคราะห์ท่าทางการออกกำลังกายแบบเรียลไทม์ โดยเปรียบเทียบท่าทางของผู้ใช้กับวิดีโอจากเทรนเนอร์มืออาชีพ

## ✨ คุณสมบัติหลัก

- 🤖 **AI Pose Analysis** - วิเคราะห์ท่าทางด้วย MediaPipe และ Gemini AI
- 📊 **Real-time Performance Tracking** - ติดตามประสิทธิภาพแบบเรียลไทม์
- 🎯 **Exercise-specific Scoring** - การให้คะแนนตามชนิดของการออกกำลังกาย
- 👥 **Trainer-Trainee System** - ระบบเทรนเนอร์และผู้เข้าอบรม
- 📱 **Responsive Design** - รองรับทุกอุปกรณ์
- 🔐 **Google OAuth Integration** - เข้าสู่ระบบด้วย Google
- 🎥 **Video Management** - จัดการวิดีโอการออกกำลังกาย
- 📈 **Analytics Dashboard** - แดชบอร์ดสถิติและการวิเคราะห์

## 🛠️ เทคโนโลยีที่ใช้

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - ฐานข้อมูลหลัก
- **SQLAlchemy** - ORM
- **Alembic** - Database migration
- **Uvicorn** - ASGI server
- **MediaPipe** - Pose detection
- **Gemini AI** - AI analysis
- **JWT** - Authentication
- **AWS S3** - File storage

### Frontend
- **React 19** - UI Framework
- **React Router** - Navigation
- **MediaPipe** - Real-time pose detection
- **D3.js** - Data visualization
- **CSS3** - Styling with animations
- **Google OAuth** - Authentication

---

## 🚀 การติดตั้งและ Setup

### ความต้องการระบบ

- **Node.js** >= 16.0.0
- **Python** >= 3.8
- **PostgreSQL** >= 12
- **Git**

---

## 🔧 Backend Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd BackupFit/backend
```

### 2. สร้าง Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

### 4. ตั้งค่าฐานข้อมูล PostgreSQL

```sql
-- สร้างฐานข้อมูล
CREATE DATABASE fitaddict_db;
CREATE USER fitaddict_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fitaddict_db TO fitaddict_user;
```

### 5. ตั้งค่า Environment Variables



### 6. Database Migration

```bash
# สร้าง migration แรก
alembic revision --autogenerate -m "Initial migration"

# Run migration
alembic upgrade head
```

### 7. เริ่มต้น Backend Server

```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# หรือใช้คำสั่งนี้ถ้าใช้ virtual environment
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend จะรันที่: `http://localhost:8000`

---

## ⚛️ Frontend Setup

### 1. ไปยัง Frontend Directory

```bash
cd ../frontend
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างหรือแก้ไขไฟล์ `.env`:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_BASE=http://localhost:8000

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# Gemini AI API Key (สำหรับ frontend pose analysis)
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 4. เริ่มต้น Frontend Server

```bash
npm start
```

Frontend จะรันที่: `http://localhost:3000`

---

## 🎮 การใช้งาน

### 1. เข้าสู่ระบบ
- ไปที่ `http://localhost:3000`
- เข้าสู่ระบบด้วย Google Account

### 2. สำหรับเทรนเนอร์
- อัปโหลดวิดีโอการออกกำลังกาย
- จัดการรายชื่อผู้เข้าอบรม
- ดูสถิติและผลการฝึก

### 3. สำหรับผู้เข้าอบรม
- เลือกวิดีโอการออกกำลังกาย
- ฝึกตามวิดีโอพร้อมการวิเคราะห์ AI
- ดูประวัติและความก้าวหน้า

---

## 📁 Structure โปรเจกต์

```
BackupFit/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # Main application
│   │   ├── models.py          # Database models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── db.py              # Database connection
│   │   ├── oauth.py           # Authentication
│   │   ├── utils.py           # Utility functions
│   │   └── routers/           # API routes
│   ├── alembic/               # Database migrations
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
│
├── frontend/                  # React Frontend
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── styles/          # CSS files
│   │   └── contexts/        # React contexts
│   ├── package.json         # Node dependencies
│   └── .env                 # Environment variables
│
└── README.md               # This file
```

---

## 📚 API Documentation

เมื่อ backend เริ่มทำงานแล้ว สามารถดู API documentation ได้ที่:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Main API Endpoints

```
POST   /auth/google           # Google OAuth login
GET    /users/me             # Get current user info
GET    /trainers             # Get all trainers
POST   /trainers/{id}/videos # Upload trainer video
GET    /trainers/{id}/videos # Get trainer videos
POST   /trainees            # Create trainee
GET    /trainees/me          # Get current trainee info
```

---

## 🔑 การขอ API Keys

### Google OAuth
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มี
3. เปิดใช้งาน Google+ API
4. สร้าง OAuth 2.0 Client ID
5. เพิ่ม authorized redirect URIs: `http://localhost:3000`

### Gemini AI API
1. ไปที่ [Google AI Studio](https://makersuite.google.com/app/apikey)
2. สร้าง API key ใหม่
3. คัดลอก key มาใส่ใน environment variables

### AWS S3 (ถ้าใช้)
1. สร้าง AWS Account
2. สร้าง IAM User สำหรับ S3 access
3. สร้าง S3 Bucket
4. ตั้งค่า CORS policy สำหรับ web access

---

## 🐛 การแก้ไขปัญหา

### Backend Issues

#### ปัญหา Database Connection
```bash
# ตรวจสอบ PostgreSQL service
# Windows
net start postgresql-x64-xx

# Check connection
psql -U fitaddict_user -d fitaddict_db -h localhost
```

#### ปัญหา Migration
```bash
# Reset migrations
alembic stamp head
alembic revision --autogenerate -m "Reset migration"
alembic upgrade head
```

#### ปัญหา Dependencies
```bash
# ติดตั้งใหม่
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

#### ปัญหา Node Modules
```bash
# ลบและติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
```

#### ปัญหา MediaPipe
```bash
# ตรวจสอบ browser compatibility
# MediaPipe ต้องการ HTTPS หรือ localhost
# ตรวจสอบ camera permissions
```

#### ปัญหา CORS
- ตรวจสอบ REACT_APP_BACKEND_URL ใน .env
- Backend ควรรันที่ port 8000
- Frontend ควรรันที่ port 3000

### Common Issues

#### Port ถูกใช้งาน
```bash
# Windows - kill process on port
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

#### Environment Variables ไม่ทำงาน
- ตรวจสอบชื่อตัวแปรใน .env
- Restart server หลังแก้ไข .env
- ตรวจสอบ syntax ใน .env (ไม่มี space รอบ =)

---

## 🤝 การพัฒนา

### Branch Strategy
- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches

### Code Style
- Python: Follow PEP 8
- JavaScript: Follow ESLint configuration
- CSS: Use BEM methodology

### Testing
```bash
# Backend tests
pytest

# Frontend tests
npm test
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- **Development Team** - Initial work and ongoing development
- **AI/ML Team** - Pose analysis and machine learning integration
- **UI/UX Team** - User interface and experience design

---

## 📞 Support

หากมีปัญหาหรือคำถาม:

1. ตรวจสอบ [การแก้ไขปัญหา](#การแก้ไขปัญหา) ก่อน
2. ดู API documentation ที่ `/docs`
3. ตรวจสอบ console logs ใน browser และ terminal
4. สร้าง issue ใน repository

---

**Happy Coding! 🚀💪**
