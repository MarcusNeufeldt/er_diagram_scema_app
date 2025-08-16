# Database Diagram Tool - TODO List

## Phase 1: Core Features ✅ COMPLETED
- [x] **Field Editing** - Edit/delete existing fields, change data types
- [x] **Relationships/Foreign Keys** - Visual connections between tables with proper edge rendering

## Phase 2: Enhanced UX
- [ ] **Properties Panel** - A sidebar to edit selected table/field properties in detail
- [ ] **Field Type Dropdown** - Better UI for selecting SQL data types with autocomplete
- [ ] **Duplicate Table** - Implement the duplicate functionality from context menu
- [x] **Magnetic Grid** - Snap-to-grid functionality for precise diagram alignment ✅
- [x] **Sticky Notes** - Add collaborative notes with 8 colors and author attribution ✅
- [x] **Shapes** - Background shapes (rectangle, circle, diamond) for visual grouping ✅

## Phase 3: Productivity Features
- [ ] **Keyboard Shortcuts** - Delete key, F2 for rename, Ctrl+Z/Y for undo/redo, etc.
- [x] **Undo/Redo** - Comprehensive automatic history tracking with setStateWithHistory ✅
- [x] **Auto-layout** - Automatically arrange tables in a clean layout ✅

## Phase 4: Visual & Export Improvements
- [ ] **Better Visual Indicators** - Show primary keys, foreign keys, indexes more clearly
- [ ] **Export improvements** - Better SQL generation with foreign key constraints
- [ ] **Custom Themes** - Light/dark mode, custom color schemes
- [ ] **Table Groups/Schemas** - Visual grouping of related tables

## Phase 5: AI Integration 🤖
- [x] **OpenRouter API Setup** - Configure OpenRouter for LLM access ✅
- [x] **Pydantic Schema Models** - Define structured output models for database schemas ✅
- [x] **AI Chat Interface** - Interactive chat panel for schema discussions ✅
- [x] **Real-time Schema Generation** - Generate tables/relationships from natural language ✅
- [x] **Schema Iteration** - Modify existing schemas through conversation ✅
- [x] **Smart Suggestions** - AI-powered recommendations via function calling ✅
- [x] **Natural Language Queries** - Ask questions about the current schema ✅
- [x] **Reasoning Configuration** - Full support for OpenRouter thinking models with effort levels ✅
- [ ] **Export Schema Descriptions** - Generate documentation from schema via AI

### AI Integration - Completed Features ✨
- **OpenRouter Integration** - Successfully integrated with google/gemini-2.5-flash model
- **Function Calling** - AI can detect when to generate/modify schemas with smart tool detection
- **Incremental Updates** - Animated field additions/removals/modifications without full re-renders
- **Visual Feedback** - Tables flash green, fields appear/disappear with smooth animations
- **Schema Diffing** - Smart comparison to only update changed elements
- **Relationship Detection** - AI can add and remove foreign key relationships
- **Test Suite** - Comprehensive tests for schema generation and modifications
- **Reasoning Configuration** - Complete OpenRouter thinking model support with effort levels (high/medium/low/custom)
- **Cost Control** - Easy enable/disable reasoning for budget management
- **Schema Analysis Fix** - Fixed analysis returning readable text instead of "[object Object]"
- **Token Limits Removed** - Removed MAX_TOKENS restrictions for longer AI responses

### AI Integration - Current Issues 🔧
- **AI-Generated Connections Not Clickable** - Edges created by AI are not responding to double-click events
  - Root cause identified: Edges are being applied correctly with proper handle IDs
  - Handle IDs match expected format: `${tableId}-${column.id}-source/target`
  - Issue appears to be timing-related or ReactFlow internal processing
  - Manual connections work perfectly, AI connections render but aren't interactive
  - Debug logs show edges are created with identical structure to manual ones
  - Attempted fixes:
    - ✅ Using ReactFlow's `addEdge()` function (same as manual)
    - ✅ Fixed timing so relationships add before table imports
    - ✅ Added delay to ensure Handle components render first
    - ❌ setTimeout for edge application not firing as expected
  - Next steps: May need to investigate ReactFlow's internal edge registration or use a different approach for applying AI-generated edges

### Recent Improvements ✨
- **Reasoning Models Support** - Added complete OpenRouter thinking model configuration
  - Environment variables: `ENABLE_REASONING`, `REASONING_EFFORT`, `REASONING_MAX_TOKENS`, `REASONING_EXCLUDE`
  - Effort levels: high/medium/low for different quality vs cost trade-offs
  - Custom mode: precise token control with `REASONING_EFFORT=custom`
  - Cost savings: easy disable with `ENABLE_REASONING=false`
- **API Optimizations** - Removed MAX_TOKENS limits, fixed reasoning parameter conflicts
- **Schema Analysis** - Fixed "[object Object]" display issue, now returns readable analysis
- **Test Coverage** - Added reasoning configuration tests and validation

### Auto-Layout Feature 🎨 (Updated!)
- **Left-to-Right Hierarchical Layout** - Tables arranged in columns following dependency hierarchy
- **Dependency Analysis** - Analyzes foreign key relationships to build dependency graphs
- **Topological Sorting** - Uses graph algorithms to determine optimal column placement
- **Layout Strategies**:
  - Independent tables: Leftmost columns (no foreign keys)
  - Dependent tables: Arranged in columns to the right of their dependencies
  - Natural reading flow: Left-to-right matches intuitive schema understanding
- **Visual Feedback** - Tables flash after layout to indicate positioning changes
- **Professional Layout** - Matches industry ER diagram standards and conventions
- **Algorithm Features**:
  - Handles circular dependencies gracefully
  - Alphabetical sorting within each column for consistency
  - Configurable spacing (350px columns, 180px rows)
  - Responsive column wrapping for large schemas

## Phase 6: ReactFlow Native Features Enhancement 🚀
*Leveraging built-in ReactFlow capabilities discovered in documentation*

### UI Components
- [ ] **NodeToolbar** - Replace context menu with persistent node toolbar
  - Always visible when node selected
  - Doesn't scale with zoom (always readable)
  - Quick actions: delete, duplicate, add column
  - Better UX than right-click menus
- [ ] **Panel Component** - Use for floating UI elements
  - AI chat as bottom-right panel
  - Toolbar actions as top-center panel
  - Status indicators as top-left panel
  - Supports 6 positions: top/bottom + left/center/right
- [ ] **Enhanced Controls** - Customize zoom controls
  - Add custom buttons to Controls component
  - Horizontal/vertical orientation options
  - Event handlers for zoom state changes

### Visual Enhancements
- [ ] **Native Dark Mode** - Use ReactFlow's built-in theming
  - `colorMode` prop: 'dark', 'light', or 'system'
  - No custom CSS needed for basic dark mode
- [ ] **CSS Variables Theming** - Complete theme customization
  - `--xy-node-background-color-default`
  - `--xy-edge-stroke-default`
  - `--xy-minimap-background-color`
  - Create custom brand themes
- [ ] **Edge Enhancements**
  - `EdgeLabelRenderer` for better relationship labels
  - Custom SVG markers for cardinality (1:1, 1:many, many:many)
  - Increase `interactionWidth` for easier edge clicking
  - Use `BaseEdge` component with custom paths

### Interaction Improvements
- [ ] **nodrag Class** - Prevent dragging on specific elements
  - Apply to input fields and buttons within nodes
  - Better interaction with form elements
- [ ] **Multiple Handles** - Add more connection points
  - Multiple source/target handles per table
  - Connect from specific columns
  - Better visual representation of relationships

## Phase 7: Advanced Features
- [ ] **Import from Database** - Connect to existing database and import schema
- [ ] **Collaboration Features** - Real-time multi-user editing enhancements
- [ ] **Version History** - Track and revert changes
- [ ] **Comments/Documentation** - Add notes to tables and fields
- [ ] **Search & Filter** - Search tables and fields by name
- [ ] **Export to Multiple Formats** - PNG, SVG, PDF exports

## Bug Fixes & Improvements
- [x] Canvas positioning resets when clicking "Add Table"
- [x] Context menu positioning issues
- [x] Table position resets on updates
- [x] ResizeObserver error suppression
- [x] Connection dragging and modal functionality
- [x] Handle ID parsing for relationships
- [ ] Performance optimization for large diagrams
- [ ] Better error handling and user feedback

## Recently Completed Features ✨
- **Field Row Component** - Inline editing with hover actions
- **Data Type Dropdown** - Autocomplete for SQL types
- **Context Menus** - Right-click for table and field operations
- **Relationship Modal** - Smart suggestions for connection types
- **Connection Validation** - Proper handle positioning and interaction
- **Visual Indicators** - Primary keys (🔑), Foreign keys (#), Not null (*)
- **Error Suppression** - Clean console without ResizeObserver spam
- **Auto-Layout** - Left-to-right hierarchical layout following dependency chains ✨
- **Undo/Redo System** - Comprehensive automatic history tracking for all operations ✨
- **Magnetic Grid** - Professional snap-to-grid with configurable size (20px default) ✨
- **Collaboration Features** - Sticky notes and shapes for team communication ✨
  - Sticky Notes: 8 colors, author attribution, timestamps, resizable
  - Shapes: Rectangle/circle/diamond, background layering, color customization
  - Proper z-index: Shapes (background) → Sticky Notes (middle) → Tables (foreground)
- **AI Persona Fix** - Resolved AI misinterpreting "connections" as network instead of visual edges ✨
- **ReactFlow NodeResizer** - Proper resizing for all node types with visual handles ✨

## Phase 8: Production Deployment & Multi-User Collaboration 🚀

### CURRENT STATUS: Vercel Deployment Issues 🔧
- **Deployment Progress**: 80% Complete - React build succeeds, API functions failing
- **Last Build Time**: 5+ minutes (abnormally long, indicating issues)
- **Current URL**: https://draw-io-clone-4wqg9ncjr-marcusneufeldt-googlemailcs-projects.vercel.app

### Completed Infrastructure ✅
- [x] **Database Schema** - Prisma with User/Diagram models and locking fields
- [x] **API Endpoints** - Complete locking system (lock/unlock/CRUD) as Vercel functions
- [x] **Frontend Integration** - Locking state, read-only mode, user authentication
- [x] **Build Configuration** - React builds successfully (157.25 kB gzipped)
- [x] **Git Repository** - All code pushed to GitHub with proper structure
- [x] **Node.js 22.x Support** - Updated to @vercel/node@4.0.0 runtime
- [x] **Missing Files Fixed** - Added client/public/index.html to git (was excluded)
- [x] **ESLint Issues** - Fixed all React hooks and linting errors

### Current Deployment Issues 🚨
- **Build Timeout** - Vercel build taking 5+ minutes (normal: 1-2 minutes)
- **Possible Causes**:
  - Prisma client generation in serverless functions
  - Dependencies conflicts with Node.js 22.x
  - Large dependency tree (1400+ packages)
  - Memory/CPU limits in build environment

### Immediate Next Steps 📋
1. **Check Vercel Dashboard** - Monitor live build logs for specific errors
2. **Optimize Dependencies** - Potential Prisma client issues in serverless
3. **Fallback Strategy** - Consider reverting to Node.js 20.x if needed
4. **Environment Variables** - Configure once deployed successfully:
   - `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
   - `OPENROUTER_API_KEY`

### Persistence System Features 🎯
- **Diagram Locking** - 5-minute locks with 2-minute heartbeat
- **Concurrent Access Prevention** - Read-only mode when locked by others
- **Visual Indicators** - Yellow banner shows who is editing
- **Automatic Cleanup** - Locks expire and clear automatically
- **Local Testing** - Complete system tested with SQLite database

### Architecture Summary 🏗️
```
Frontend (React)     API (Vercel Functions)     Database (Turso/SQLite)
├── Locking Hooks   ├── /api/diagrams/[id]     ├── Users table
├── Read-only UI    ├── /api/diagrams/[id]/lock ├── Diagrams table  
├── User Auth       ├── /api/diagrams/[id]/unlock ├── Locking fields
└── State Mgmt      └── /api/health            └── JSON storage

Deployment: GitHub → Vercel → Serverless Functions
```

### When Deployment Succeeds 🎉
- **Multi-user collaboration** with locking system
- **Persistent diagrams** saved to database  
- **Global CDN** distribution via Vercel
- **Serverless scaling** for any number of users
- **Professional URL** for sharing and demos