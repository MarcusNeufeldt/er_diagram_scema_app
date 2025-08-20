# Diagram Persistence & Locking System

This document describes the new persistence and locking system implemented for the diagram application.

## 🏗️ Architecture

The system uses a **diagram locking mechanism** to prevent simultaneous editing conflicts, with full persistence to a database.

### Core Components

1. **Backend API** (`api/` directory)
   - Prisma ORM with SQLite/Turso database
   - Express.js API endpoints for locking and CRUD operations
   - Atomic transactions for lock management

2. **Frontend Integration** 
   - Zustand store with locking state
   - React hooks for lock management (`useDiagramLocking`)
   - Read-only UI mode with visual indicators

3. **Database Schema**
   - `User` table for simple authentication
   - `Diagram` table with locking fields (`lockedByUserId`, `lockExpiresAt`)
   - JSON storage for ReactFlow nodes and edges

## 🔒 Locking Mechanism

### How It Works

1. **Lock Acquisition**: When a user opens a diagram, the system attempts to acquire a 5-minute lock
2. **Heartbeat**: Every 2 minutes, the client sends a heartbeat to extend the lock
3. **Read-Only Mode**: If another user has the lock, the UI switches to read-only mode
4. **Automatic Release**: Locks expire after 5 minutes or when the user leaves

### Lock States

- **Unlocked**: Diagram is available for editing
- **Locked by Current User**: User can edit and save changes
- **Locked by Another User**: Read-only mode with banner notification
- **Lock Expired**: Automatically cleared and available

## 🛠️ API Endpoints

### Locking Endpoints

```
POST /api/diagrams/:id/lock     # Acquire or extend lock
POST /api/diagrams/:id/unlock   # Release lock
```

### Diagram CRUD

```
GET  /api/diagrams/:id          # Load diagram with lock status
PUT  /api/diagrams/:id          # Save diagram (requires valid lock)
```

## 🚀 Getting Started

### 1. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# 3. Initialize database
npx prisma db push

# 4. Create test data
node test-persistence-system.js

# 5. Start the server
npm start

# 6. Start the client (in another terminal)
cd client && npm start
```

### 2. Production Setup (Vercel + Turso)

1. **Add Turso to Vercel Project**
   - Go to Vercel project dashboard
   - Add Turso from the marketplace
   - Environment variables will be automatically configured

2. **Deploy**
   - Push changes to your repository
   - Vercel will deploy both the API and client

## 🧪 Testing

The system includes comprehensive tests:

```bash
# Test the persistence and locking system
node test-persistence-system.js
```

Tests verify:
- User and diagram creation
- Lock acquisition and release
- Concurrent access prevention
- Database transactions

## 🎮 User Experience

### For Editors
- **Seamless Editing**: Acquire locks automatically when opening diagrams
- **Auto-Save**: Save changes with lock verification
- **Session Management**: Locks extend automatically while editing

### For Viewers
- **Read-Only Access**: View diagrams when someone else is editing
- **Clear Indicators**: Banner shows who is currently editing
- **No Conflicts**: Cannot accidentally overwrite changes

## 🔧 Configuration

### Environment Variables

```env
# Database
TURSO_DATABASE_URL="file:./dev.db"  # Local SQLite
TURSO_AUTH_TOKEN=""                 # For Turso production

# Server
PORT=3001

# AI Service (existing)
OPENROUTER_API_KEY=your_key_here
ENABLE_REASONING=true
```

### Lock Timing

- **Lock Duration**: 5 minutes
- **Heartbeat Interval**: 2 minutes  
- **Extension**: Automatic while user is active

## 🏆 Benefits

1. **No Data Loss**: Prevents conflicting edits
2. **Simple UX**: Users don't need to think about locks
3. **Scalable**: Works with any number of concurrent users
4. **Fault Tolerant**: Locks expire automatically
5. **Vercel Ready**: Designed for serverless deployment

## 🔮 Future Enhancements

- **Real-time Collaboration**: Upgrade to Y.js with operational transforms
- **Granular Locking**: Table-level or element-level locks
- **User Presence**: Show cursors and selections of other users
- **Version History**: Track changes over time
- **Advanced Permissions**: Role-based access control

## 🐛 Troubleshooting

### Common Issues

**"Lock acquisition failed"**
- Check if database is accessible
- Verify API server is running
- Ensure user is authenticated

**"Cannot save in read-only mode"**
- Another user has the editing lock
- Wait for them to finish or contact them
- Check if your session expired

**"Database connection error"**
- Verify `TURSO_DATABASE_URL` in .env
- For Turso: check auth token
- For local: ensure SQLite file permissions

### Debug Commands

```bash
# Check database status
npx prisma studio

# View server logs
npm start

# Test API endpoints
curl http://localhost:3001/api/diagrams/demo-diagram-1
```