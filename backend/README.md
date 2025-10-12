# 🔧 FitAddict Backend

> FastAPI backend สำหรับแพลตฟอร์ม FitAddict ที่รองรับ AI pose analysis, user management, และ video processing

## 📋 สารบัญ

- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [การติดตั้ง](#การติดตั้ง)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [File Structure](#file-structure)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

---

## 🛠️ เทคโนโลยีที่ใช้

- **FastAPI 0.104.1** - Modern Python web framework
- **SQLAlchemy 2.0.23** - ORM สำหรับฐานข้อมูล
- **PostgreSQL** - ฐานข้อมูลหลัก
- **Alembic** - Database migration tool
- **Uvicorn 0.24.0** - ASGI server
- **Pydantic 2.5.0** - Data validation
- **MediaPipe** - Pose detection library
- **JWT & OAuth** - Authentication
- **AWS S3** - File storage (optional)

---

## 🚀 การติดตั้ง

### 1. ความต้องการระบบ

```bash
# ตรวจสอบ Python version
python --version  # ต้อง >= 3.8

# ตรวจสอบ PostgreSQL
psql --version    # ต้อง >= 12
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

### 4. ตั้งค่า PostgreSQL

```sql
-- เข้า PostgreSQL console
psql -U postgres

-- สร้างฐานข้อมูลและ user
CREATE DATABASE fitaddict_db;
CREATE USER fitaddict_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE fitaddict_db TO fitaddict_user;

-- ออกจาก console
\q
```

### 5. ตั้งค่า Environment Variables

```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.example .env

# แก้ไขไฟล์ .env
nano .env
```

### 6. Database Migration

```bash
# สร้าง migration table
alembic upgrade head

# หรือถ้ายังไม่มี migration
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 7. เริ่มต้น Server

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server จะรันที่: `http://localhost:8000`

---

## 🔐 Environment Variables

สร้างไฟล์ `.env` ตาม template นี้:

```env
# ===== DATABASE CONFIGURATION =====
DATABASE_URL=postgresql://fitaddict_user:secure_password@localhost:5432/fitaddict_db

# ===== SECURITY KEYS =====
# สร้าง random 32+ character strings
SESSION_SECRET=your-session-secret-key-32-chars-minimum
JWT_SECRET=your-jwt-secret-key-32-chars-minimum

# ===== GOOGLE OAUTH =====
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===== GEMINI AI API =====
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# ===== EMAIL CONFIGURATION (Optional) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-app-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# ===== AWS S3 CONFIGURATION (Optional) =====
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1

# ===== APPLICATION SETTINGS =====
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
UPLOAD_MAX_SIZE=50MB
```

### วิธีสร้าง Secret Keys

```python
# ใช้ Python สร้าง random keys
import secrets
print("SESSION_SECRET:", secrets.token_urlsafe(32))
print("JWT_SECRET:", secrets.token_urlsafe(32))
```

---

## �️ Database Schema

### หลัก Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture TEXT,
    role VARCHAR(50) DEFAULT 'trainee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Trainers Table
```sql
CREATE TABLE trainers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bio TEXT,
    experience_years INTEGER,
    specializations TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Videos Table
```sql
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER REFERENCES trainers(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50),
    duration INTEGER, -- in seconds
    s3_url TEXT,
    thumbnail_url TEXT,
    keypoints_data JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Trainees Table
```sql
CREATE TABLE trainees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    trainer_id INTEGER REFERENCES trainers(id),
    fitness_level VARCHAR(50),
    goals TEXT[],
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📚 API Endpoints

### Authentication
```
POST   /auth/google              # Google OAuth login
POST   /auth/logout              # Logout user
GET    /auth/me                 # Get current user info
```

### Users Management
```
GET    /users                   # Get all users (admin only)
GET    /users/me               # Get current user profile
PUT    /users/me               # Update user profile
DELETE /users/{user_id}        # Delete user (admin only)
```

### Trainers
```
GET    /trainers               # Get all trainers
GET    /trainers/{trainer_id}  # Get trainer details
PUT    /trainers/{trainer_id}  # Update trainer profile
POST   /trainers/{trainer_id}/videos  # Upload video
GET    /trainers/{trainer_id}/videos  # Get trainer videos
```

### Videos
```
GET    /videos               # Get all videos
GET    /videos/{video_id}    # Get video details
PUT    /videos/{video_id}    # Update video (trainer only)
DELETE /videos/{video_id}    # Delete video (trainer only)
POST   /videos/upload        # Upload video file
```

---

## 🏗️ File Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── db.py                   # Database connection
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── oauth.py                # Authentication logic
│   ├── utils.py                # Utility functions
│   │
│   ├── routers/                # API route modules
│   │   ├── auth.py            # Authentication routes
│   │   ├── users.py           # User management
│   │   ├── trainers.py        # Trainer endpoints
│   │   └── videos.py          # Video management
│   │
│   └── utils/                  # Utility modules
│       ├── security.py        # Security functions
│       ├── email.py           # Email utilities
│       └── s3.py              # AWS S3 integration
│
├── alembic/                    # Database migrations
├── uploaded_videos/           # Local video storage
├── keypoints/                 # Keypoints data storage
├── scripts/                   # Utility scripts
├── requirements.txt           # Python dependencies
├── alembic.ini               # Alembic configuration
└── .env.example              # Environment template
```

---

## � การแก้ไขปัญหา

### Database Issues

#### ไม่สามารถเชื่อมต่อฐานข้อมูล
```bash
# ตรวจสอบ PostgreSQL service
# Windows
net start postgresql-x64-xx

# ทดสอบการเชื่อมต่อ
psql -U fitaddict_user -d fitaddict_db -h localhost
```

#### Migration Error
```bash
# ดู migration status
alembic current

# Force migration version
alembic stamp head
```

### Import Errors

#### ModuleNotFoundError
```bash
# ติดตั้ง missing packages
pip install -r requirements.txt --upgrade
```

### CORS Issues

#### Frontend ไม่สามารถเชื่อมต่อ
```python
# ใน main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

**Happy Backend Development! 🚀**

```bash
git clone https://github.com/<REPO_URL>
cd fa
```

---


2. Copy the `.env.example` to `.env` if needed.(most likely for backend)

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
ขอ