# 🎨 Scema - AI-Powered Database Diagram Tool

[![GitHub](https://img.shields.io/github/license/MarcusNeufeldt/er_diagram_scema_app)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%5E18.0-blue)](https://reactjs.org/)

A modern, AI-powered database diagram tool with intelligent auto-layout and real-time schema generation capabilities.

## ✨ Features

### 🎯 **Core Functionality**
- **Visual Database Design** - Interactive drag-and-drop table creation
- **Smart Relationships** - Easy foreign key connections with visual feedback
- **Auto-Layout** - Intelligent left-to-right hierarchical arrangement
- **Export/Import** - JSON, SQL DDL, and custom diagram formats

### 🤖 **AI Integration**
- **OpenRouter Integration** - Powered by Google Gemini 2.5 Flash
- **Natural Language Schema Generation** - Create databases from descriptions
- **Intelligent Modifications** - Add/modify tables through conversation
- **Schema Analysis** - AI-powered recommendations and insights
- **Reasoning Models** - Configurable thinking model support

### 🎨 **Visual Features**
- **Animated Updates** - Smooth transitions when AI modifies schemas
- **Relationship-Aware Layout** - Tables arranged by dependency hierarchy
- **Professional Appearance** - Industry-standard ER diagram styling
- **Real-time Collaboration** - WebSocket-based multi-user editing

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

## 🎮 Usage

### Creating Schemas
1. **Manual Creation**: Click "Add Table" to create tables manually
2. **AI Generation**: Use the AI Assistant to generate schemas from descriptions
3. **Import**: Upload existing JSON diagrams or SQL files

### Auto-Layout
- Click the green **"Auto Layout"** button to arrange tables intelligently
- Tables are positioned left-to-right based on dependency hierarchy
- Referenced tables appear on the left, referencing tables on the right

### AI Assistant
- Click the "AI Assistant" button to open the chat panel
- Try prompts like:
  - "Create a blog schema with users, posts, and comments"
  - "Add a categories table with a many-to-many relationship to posts"
  - "Analyze this schema for performance improvements"

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

- **Frontend**: React, TypeScript, ReactFlow, Zustand, TailwindCSS
- **Backend**: Node.js, WebSocket, Y.js (collaboration)
- **AI**: OpenRouter, Google Gemini 2.5 Flash
- **Database**: JSON-based storage (extensible)

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

## 🔗 Links

- **Live Demo**: [scema.app](https://scema.app)
- **Documentation**: [docs.scema.app](https://docs.scema.app)
- **Issues**: [GitHub Issues](https://github.com/MarcusNeufeldt/er_diagram_scema_app/issues)

---

Made with ❤️ for the database design community