-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, 
    email VARCHAR(150) NOT NULL UNIQUE, 
    password TEXT NOT NULL, 
    avatar TEXT, 
    bio TEXT, 
    reset_token TEXT, 
    reset_token_expires TIMESTAMP, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Project Members (Junction Table)
CREATE TABLE project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
    role_description TEXT,
    PRIMARY KEY (project_id, user_id) 
);

-- 4. Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL, 
    description TEXT, 
    status VARCHAR(20) DEFAULT 'To Do', 
    priority VARCHAR(20) DEFAULT 'Medium', 
    deadline DATE, 
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- 5. Project Announcements
CREATE TABLE project_announcements (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, 
    type VARCHAR(50) DEFAULT 'update', 
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Announcement Acknowledgments
CREATE TABLE announcement_acknowledgments (
    announcement_id INTEGER REFERENCES project_announcements(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, user_id)
);

-- 7. Comments Table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP 
);

-- 8. Attachments Table
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE, 
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    file_path TEXT NOT NULL, 
    public_id TEXT NOT NULL, 
    original_name TEXT NOT NULL, 
    file_type TEXT, 
    file_size INTEGER, 
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- 9. Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL, 
    read_status BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- 10. Notification Preferences
CREATE TABLE notification_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    task_assigned BOOLEAN DEFAULT TRUE, 
    task_updated BOOLEAN DEFAULT TRUE, 
    task_completed BOOLEAN DEFAULT TRUE, 
    task_deleted BOOLEAN DEFAULT TRUE, 
    comment_added BOOLEAN DEFAULT TRUE, 
    project_changes BOOLEAN DEFAULT TRUE, 
    deadline_reminders BOOLEAN DEFAULT TRUE, 
    announcements BOOLEAN DEFAULT TRUE 
);

-- 11. Push Subscriptions Table
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE, 
    p256dh TEXT NOT NULL, 
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);