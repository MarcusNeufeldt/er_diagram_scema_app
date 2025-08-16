# Database Diagram Tool - TODO List

## Phase 1: Core Features ✅ COMPLETED
- [x] **Field Editing** - Edit/delete existing fields, change data types
- [x] **Relationships/Foreign Keys** - Visual connections between tables with proper edge rendering

## Phase 2: Enhanced UX
- [ ] **Properties Panel** - A sidebar to edit selected table/field properties in detail
- [ ] **Field Type Dropdown** - Better UI for selecting SQL data types with autocomplete
- [ ] **Duplicate Table** - Implement the duplicate functionality from context menu

## Phase 3: Productivity Features
- [ ] **Keyboard Shortcuts** - Delete key, F2 for rename, Ctrl+Z/Y for undo/redo, etc.
- [ ] **Undo/Redo** - Implement the undo/redo buttons in toolbar with history stack
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

## Phase 6: Advanced Features
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