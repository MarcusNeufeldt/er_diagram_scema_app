# Scema Server

AI-powered database diagram tool server with WebSocket collaboration support.

## 🏗️ Project Structure

```
server/
├── server.js              # Main server entry point
├── ai-service.js          # OpenRouter AI integration
├── package.json           # Dependencies and scripts
├── README_TESTPIPELINE.md  # Test pipeline documentation
├── tests/                 # Test files organized by category
│   ├── ai/               # AI service tests
│   │   ├── test-ai.js
│   │   ├── test-animation-feedback.js
│   │   ├── test-improved-persona.js
│   │   ├── test-reasoning.js
│   │   └── test-reasoning-modes.js
│   ├── canvas/           # Canvas and layout tests
│   │   ├── test-canvas-export.js
│   │   ├── test-auto-layout-demo.js
│   │   └── test-layout-comparison.js
│   ├── outputs/          # Test output files
│   │   ├── test-outputs/
│   │   ├── canvas-test-outputs/
│   │   └── test-report-summary.json
│   ├── test-comprehensive-undo-redo.js
│   ├── test-connection-preservation.js
│   ├── test-e2e-pipeline.js
│   ├── test-iterative-schema.js
│   ├── test-modifications.js
│   ├── test-simple.js
│   ├── test-summary.js
│   └── test-undo-redo.js
└── node_modules/         # Dependencies
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run all tests
npm test
```

## 🧪 Testing

### Individual Test Categories
```bash
npm run test:ai        # AI service tests
npm run test:canvas    # Canvas export tests
npm run test:layout    # Auto-layout tests
npm run test:summary   # Generate test summary
```

### Comprehensive Testing
```bash
npm run test:all       # Run all test suites
```

## 🔧 Configuration

Create a `.env` file with:
```env
OPENROUTER_API_KEY=your-api-key-here
DEFAULT_AI_MODEL=google/gemini-2.5-flash
ENABLE_REASONING=true
REASONING_EFFORT=medium
PORT=4000
```

## 📡 API Endpoints

- **WebSocket**: Real-time collaboration and AI chat
- **REST API**: Schema operations and export functionality

## 🧬 AI Integration

The server integrates with OpenRouter for:
- Natural language schema generation
- Intelligent schema modifications
- Performance analysis and recommendations
- Reasoning model support for complex operations

## 🔄 Real-time Collaboration

Uses WebSocket for:
- Multi-user diagram editing
- Real-time cursor tracking
- Collaborative schema changes
- Live AI assistance