# 🎨 Scema - AI-Powered Database Diagram Tool

[![GitHub](https://img.shields.io/github/license/MarcusNeufeldt/er_diagram_scema_app)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E4.0-blue)](https://www.typescriptlang.org/)

A modern, AI-powered database diagram tool with intelligent auto-layout, real-time collaboration, and comprehensive visual design capabilities. Create, modify, and analyze database schemas through natural language or intuitive visual editing.

## ✨ Features

### 🎯 **Core Functionality**
- **Visual Database Design** - Interactive drag-and-drop table creation with resizable nodes
- **Smart Relationships** - Easy foreign key connections with visual feedback and cardinality
- **Auto-Layout** - Intelligent left-to-right hierarchical arrangement based on dependencies
- **Quick Field Addition** - One-click "+" button for rapid table building
- **Advanced Field Editing** - Inline editing with comprehensive data type dropdowns
- **Export/Import** - JSON, SQL DDL, and custom diagram formats

### 🤖 **AI Integration** 
- **OpenRouter Integration** - Powered by Google Gemini 2.5 Flash with reasoning models
- **Persistent Chat History** - AI remembers full conversation context per diagram
- **Natural Language Schema Generation** - Create complete databases from descriptions
- **Intelligent Modifications** - Add/modify tables and relationships through conversation
- **Schema Analysis** - AI-powered recommendations and performance insights
- **Incremental Updates** - AI can modify existing schemas without full regeneration
- **Visual Context Awareness** - AI understands current diagram state for smart suggestions
- **Context Preservation** - Follow-up commands like "apply those fixes" work seamlessly

### 🎨 **Visual & UX Features**
- **Professional Layout** - Industry-standard ER diagram styling with proper z-index layering
- **Animated Updates** - Smooth transitions when AI modifies schemas
- **Magnetic Grid System** - Snap-to-grid functionality for precise alignment
- **Collaboration Tools** - Sticky notes and background shapes for team communication
- **Comprehensive Undo/Redo** - Full history tracking for all operations
- **Resizable Elements** - Tables, sticky notes, and shapes can be resized with visual handles
- **Background Grouping** - Use shapes to visually organize table relationships

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouter API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MarcusNeufeldt/er_diagram_scema_app.git
   cd er_diagram_scema_app
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy example environment file
   cd ../server
   cp .env.example .env
   
   # Edit .env and add your OpenRouter API key
   # OPENROUTER_API_KEY=your-api-key-here
   ```

4. **Start the application**
   ```bash
   # From project root
   cd server && npm run dev    # Terminal 1: Start server
   cd client && npm start      # Terminal 2: Start client
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Start designing your database schemas!

## 🎮 Usage Guide

### 📋 **Creating & Editing Tables**
1. **Quick Creation**: Double-click empty canvas or use "Add Table" button
2. **Add Fields**: Use the "+" button at bottom of each table for rapid field addition  
3. **Edit Fields**: Hover over field → click pencil icon → edit name/type inline
4. **Data Types**: Choose from comprehensive dropdown (TEXT, VARCHAR, INT, BOOLEAN, etc.)
5. **Relationships**: Drag from source field handle to target field to create connections

### 🎨 **Visual Organization**
- **Auto-Layout**: Click green "Auto Layout" button for intelligent table arrangement
- **Magnetic Grid**: Toggle grid snap for precise alignment (20px default)
- **Sticky Notes**: Add colored notes for team communication and documentation
- **Background Shapes**: Use rectangles, circles, diamonds to group related tables
- **Resizing**: Select any element and drag resize handles to adjust size

### 🤖 **AI Assistant**
- **Open Chat**: Click "AI Assistant" to open the smart chat panel
- **Natural Language**: Describe schemas in plain English
- **Example Prompts**:
  - "Create an e-commerce schema with products, orders, and customers"
  - "Add user authentication tables with roles and permissions"
  - "Analyze this schema for normalization opportunities"
  - "Add a many-to-many relationship between posts and tags"

### ⚡ **Productivity Features**
- **Undo/Redo**: Comprehensive history tracking (Ctrl+Z/Ctrl+Y)
- **Property Panel**: Select tables for detailed editing in right sidebar
- **Context Menus**: Right-click tables/fields for quick actions
- **Keyboard Shortcuts**: ESC to cancel, Enter to save, F2 to rename

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Required |
| `DEFAULT_AI_MODEL` | AI model to use | `google/gemini-2.5-flash` |
| `ENABLE_REASONING` | Enable thinking models | `true` |
| `REASONING_EFFORT` | Reasoning effort level | `medium` |
| `PORT` | Server port | `4000` |

### Reasoning Configuration
- **Effort Levels**: `high`, `medium`, `low`, `custom`
- **Cost Control**: Set `ENABLE_REASONING=false` to reduce API costs
- **Custom Tokens**: Use `REASONING_EFFORT=custom` for precise control

## 🧪 Testing

```bash
# Run AI service tests
cd server
node test-ai.js

# Run auto-layout tests
node test-auto-layout-demo.js

# Run comprehensive test suite
node test-summary.js
```

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/
├── server/                 # Node.js backend
│   ├── ai-service.js       # OpenRouter AI integration
│   ├── server.js           # WebSocket server
│   └── test-*.js           # Test files
└── README.md
```

## 🎯 Key Technologies

- **Frontend**: React 18, TypeScript, ReactFlow, Zustand, TailwindCSS, Lucide Icons
- **Backend**: Node.js, WebSocket, Y.js (real-time collaboration)
- **AI**: OpenRouter API, Google Gemini 2.5 Flash, Reasoning Models
- **Database**: JSON-based storage with extensible architecture
- **Visualization**: ReactFlow with custom nodes, NodeResizer, magnetic grid system
- **State Management**: Zustand with comprehensive undo/redo history tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **ReactFlow** for diagram visualization
- **Y.js** for real-time collaboration
- **Zustand** for state management

## 🎬 **Recent Updates**

### v2.0 - Enhanced UX & Collaboration Features
- ✅ **Quick Field Addition** - One-click "+" buttons for rapid table building
- ✅ **Improved Data Types** - Comprehensive dropdown with TEXT as default
- ✅ **Collaboration Tools** - Sticky notes and background shapes for team communication
- ✅ **Magnetic Grid System** - Professional snap-to-grid alignment (20px)
- ✅ **Enhanced Resizing** - All elements (tables, notes, shapes) now resizable
- ✅ **Better Undo/Redo** - Comprehensive history tracking for all operations
- ✅ **Visual Layering** - Proper z-index: shapes → sticky notes → tables
- ✅ **AI Persona Fix** - Improved AI understanding of visual connections
- ✅ **Dropdown Improvements** - Fixed scrolling and interaction issues

## 🔗 Links

- **Repository**: [GitHub](https://github.com/MarcusNeufeldt/er_diagram_scema_app)
- **Issues**: [GitHub Issues](https://github.com/MarcusNeufeldt/er_diagram_scema_app/issues)
- **Releases**: [GitHub Releases](https://github.com/MarcusNeufeldt/er_diagram_scema_app/releases)

---

Made with ❤️ for the database design community | Powered by AI