# Collaborative Data Modeling Tool - AI Implementation Guide

## Project Overview
Build a web-based collaborative data modeling tool for DHL EAT Airline Leipzig's data team. Primary users: data engineers and data scientists who need to design and document data models together in real-time.

## Core Requirements

### Must Have Features
1. **Real-time collaboration** - Multiple users editing the same diagram simultaneously with live cursors
2. **Data modeling specific shapes** - Tables, columns, relationships (1:1, 1:many, many:many), schemas
3. **Import/Export capabilities** - SQL DDL import/export, PNG export, JSON save format
4. **Version control** - Save versions, view history, restore previous versions
5. **Workspace management** - Create projects, organize diagrams, team access control

### Technical Constraints
- Must run in modern browsers (Chrome, Firefox, Edge)
- Should be deployable on-premises (DHL internal infrastructure)
- Must handle 5-10 concurrent users per diagram
- Response time <100ms for local actions, <500ms for synced actions

## Architecture Specification

### Frontend
```
Technology: React 18+ with TypeScript
Core Libraries:
- ReactFlow (for diagram rendering and interaction)
- Yjs + y-websocket (for CRDT-based real-time collaboration)
- Tailwind CSS (for styling)
- Zustand (for state management)
- React Query (for API calls)

Structure:
/src
  /components
    - Canvas.tsx (main diagram area)
    - Toolbar.tsx (shape palette, actions)
    - PropertyPanel.tsx (edit selected entity)
    - CollaboratorCursors.tsx (show other users)
  /stores
    - diagramStore.ts (diagram state)
    - collaborationStore.ts (sync state)
  /lib
    - sqlParser.ts (DDL import/export)
    - diagramSerializer.ts (save/load)
```

### Backend
```
Technology: Node.js with Express
Core Libraries:
- y-websocket (Yjs WebSocket server)
- Prisma (ORM)
- PostgreSQL (database)
- Redis (session/cache)
- jsonwebtoken (auth)

Structure:
/server
  /routes
    - diagrams.ts (CRUD operations)
    - workspaces.ts (project management)
    - auth.ts (user authentication)
  /websocket
    - collaborationServer.ts (Yjs provider)
  /services
    - sqlGenerator.ts (export to DDL)
    - versionControl.ts (diagram history)
```

### Database Schema
```sql
-- Core tables
users (id, email, name, created_at)
workspaces (id, name, owner_id, created_at)
diagrams (id, workspace_id, name, current_version, created_by, created_at)
diagram_versions (id, diagram_id, version_number, content_json, created_by, created_at)
workspace_members (workspace_id, user_id, role, joined_at)

-- Collaboration
active_sessions (id, diagram_id, user_id, cursor_position, last_seen)
```

## Implementation Steps

### Step 1: Project Setup (30 mins)
```bash
# Create monorepo structure
mkdir data-modeling-tool
cd data-modeling-tool
npx create-react-app client --template typescript
mkdir server
cd server && npm init -y

# Install all dependencies upfront
# Client: react, reactflow, yjs, y-websocket, y-reactflow, tailwindcss, zustand, axios
# Server: express, ws, y-websocket, prisma, @prisma/client, bcrypt, jsonwebtoken, cors
```

### Step 2: Canvas Implementation (2 hours)
Create the main diagram canvas with ReactFlow:
- Custom node types for: Table, View, Schema container
- Custom edge types for: one-to-one, one-to-many, many-to-many
- Each table node should have:
  - Table name (editable)
  - Columns list (name, type, constraints)
  - Primary key indicator
  - Indexes list
- Drag and drop from toolbar
- Pan, zoom, minimap controls

### Step 3: Real-time Collaboration (2 hours)
Implement Yjs for conflict-free collaboration:
- Set up Yjs document structure for diagram state
- WebSocket server for syncing
- Show live cursors with user names/colors
- Presence awareness (who's online)
- Optimistic updates with eventual consistency

### Step 4: SQL Import/Export (1.5 hours)
- **Import**: Parse CREATE TABLE statements into diagram entities
  - Support PostgreSQL, MySQL, SQL Server dialects
  - Extract tables, columns, types, relationships from foreign keys
- **Export**: Generate DDL from diagram
  - Include CREATE TABLE, ALTER TABLE for foreign keys
  - Dialect selection option

### Step 5: Persistence Layer (1.5 hours)
- Auto-save every 30 seconds
- Manual save with version message
- Version history browser
- Workspace/project organization
- User authentication (simple JWT)

### Step 6: UI Polish (1 hour)
- Professional toolbar with icons
- Context menus on right-click
- Keyboard shortcuts (Ctrl+S save, Delete, Ctrl+Z undo)
- Dark/light mode
- Export to PNG/SVG
- Property panel for detailed editing

## Data Model Specific Features

### Entity Properties Panel
When selecting a table entity, show editable form for:
```
Table Name: [________]
Schema: [________]

Columns:
[+Add Column]
┌─────────────┬──────────┬────────┬──────┬─────────┐
│ Name        │ Type     │ PK     │ NULL │ Default │
├─────────────┼──────────┼────────┼──────┼─────────┤
│ id          │ BIGINT   │ ✓      │      │ AUTO    │
│ created_at  │ TIMESTAMP│        │      │ NOW()   │
└─────────────┴──────────┴────────┴──────┴─────────┘

Indexes:
[+Add Index]
- idx_created_at (created_at)

Foreign Keys:
[+Add Foreign Key]
- fk_user_id -> users(id)
```

### Relationship Drawing
- Click and drag from column to column to create foreign key
- Automatic relationship line routing
- Crow's foot notation for cardinality
- Double-click relationship to edit properties

### Smart Features
1. **Auto-layout**: Arrange tables to minimize crossing lines
2. **SQL validation**: Check for valid column types, circular dependencies
3. **Quick templates**: Common patterns (users table, audit fields)
4. **Search**: Find tables/columns across large diagrams
5. **Diff view**: Compare two versions visually

## Testing Requirements
- Create sample diagram with 20+ tables
- Test with 5 simultaneous users
- Import/export round-trip test
- Ensure no data loss during concurrent edits

## Deployment Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  client:
    build: ./client
    ports: ["3000:3000"]
  
  server:
    build: ./server
    ports: ["4000:4000"]
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
  
  postgres:
    image: postgres:15
    volumes: ["./data:/var/lib/postgresql/data"]
  
  redis:
    image: redis:7-alpine
```

## Success Criteria
1. Team can collaboratively design a 50-table data model
2. Changes appear for all users within 500ms
3. Can import existing database schema from SQL file
4. Exported SQL is valid and executable
5. No conflicts or data loss during concurrent editing
6. Works smoothly with 10 concurrent users

## Additional Notes for AI Coder
- Prioritize working collaboration over perfect UI initially
- Use ReactFlow's built-in features instead of building from scratch
- Yjs handles most conflict resolution automatically - don't overcomplicate
- For MVP, skip user authentication if it speeds up development
- Focus on PostgreSQL dialect first, add others later
- Use Tailwind's default colors for user cursors (red-500, blue-500, etc.)
- Keep the server stateless where possible for easy scaling

**Expected Output**: A fully functional web app with real-time collaboration for data modeling that the team can start using immediately for their daily work.