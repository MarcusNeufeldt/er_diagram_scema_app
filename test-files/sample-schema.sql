-- Sample Database Schema for DHL EAT Airline Leipzig
-- Data modeling example

CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workspaces (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE diagrams (
    id BIGINT PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    current_version INT DEFAULT 1,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE diagram_versions (
    id BIGINT PRIMARY KEY,
    diagram_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    content_json TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE workspace_members (
    workspace_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
