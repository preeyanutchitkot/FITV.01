# READMEBOSS

## 🏁 Project Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd backend
```



//Boss ไม่ได้ใช้อันนี้อะ venv ปกติก็รันเลย ในหัวข้อ 6.
### 2. Create and activate a virtual environment (recommended)
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```
**(Add this to requirements.txt if not present):**
```
email-validator
```

### 4. Set up environment variables

Create a `.env` file in the root of your backend project. Example:
```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
SMTP_SERVER=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=yourpassword

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=ap-southeast-1

JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### 5. Database Migration (if using Alembic)
```bash
alembic upgrade head

databaseschema.md 
```

### 6. Run the server
```bash
python -m uvicorn app.main:app --reload
```

---

## 🧑‍💻 Main Features

- **Invite Trainee/Trainer:**  
  - POST `/invite` (trainee)  
  - POST `/invite-trainer` (trainer)
- **Accept Invite:**  
  - GET `/accept?email=...`
- **Trainer/Trainee List & Profile:**  
  - GET `/trainers`, `/trainers/{id}`  
  - GET `/trainees`, `/trainees/{id}`
- **Google OAuth Login:**  
  - `/auth/google/login`  
  - `/auth/google/callback`
- **Email/OTP Login:**  
  - `/login/request`  
  - `/login/verify`

---

## ⚙️ Requirements

Your `requirements.txt` should include at least:
```
fastapi
uvicorn
python-multipart
pydantic
boto3
sqlalchemy
psycopg2-binary
python-dotenv
slowapi
PyJWT
Authlib
httpx
email-validator
```

---

## 📝 Notes

- **.env** is required for all secrets and config.
- Make sure your database and SMTP credentials are correct.
- For Google OAuth, set up credentials in Google Cloud Console.
- For AWS S3, set up your bucket and keys.

---

## 🚀 Run/Dev Commands

- Start server:  
  ```bash
  uvicorn app.main:app --reload
  ```
- Run Alembic migrations:  
  ```bash
  alembic upgrade head
  ```

---

## ❓ Troubleshooting

- If you get `ModuleNotFoundError`, check your venv and requirements.
- If email sending fails, check your SMTP credentials and .env.
- If OAuth fails, check your Google credentials and redirect URIs.

---
