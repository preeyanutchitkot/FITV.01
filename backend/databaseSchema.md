-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50),
    points INT DEFAULT 0,
    streak INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    google_uid VARCHAR(255),
    invited_by_id INT REFERENCES users(id),
    profile_image TEXT
);

-- Trainer-Trainee relation (Many-to-Many)
CREATE TABLE trainer_trainee (
    id SERIAL PRIMARY KEY,
    trainer_id INT REFERENCES users(id),
    trainee_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    trainer_id INT REFERENCES users(id),
    difficulty VARCHAR(50),
    description TEXT,
    s3_url TEXT,
    keypoints JSONB,
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
