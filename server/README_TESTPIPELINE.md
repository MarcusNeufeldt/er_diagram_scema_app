# 🧪 Database Diagram Tool - Test Pipeline Documentation

## Overview

This comprehensive test pipeline ensures the reliability and quality of the AI-powered database diagram tool. It validates schema generation, modifications, exports, and canvas compatibility through automated end-to-end testing.

## 🚀 Quick Start

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:ai           # Basic AI service tests
npm run test:modifications # Schema modification tests
npm run test:canvas        # Canvas export/import tests
npm run test:e2e          # Full end-to-end pipeline

# Run test summary (recommended)
node test-summary.js
```

## 📁 Test Files

### Core Test Scripts

| File | Purpose | Duration |
|------|---------|----------|
| `test-ai.js` | Basic AI service functionality | ~30s |
| `test-modifications.js` | Schema modification operations | ~13s |
| `test-canvas-export.js` | Canvas format conversion & validation | ~20s |
| `test-e2e-pipeline.js` | Comprehensive end-to-end testing | ~2-3min |
| `test-summary.js` | Unified test runner with reporting | ~65s |

### Output Directories

- `test-outputs/` - Generated schemas and modification results
- `canvas-test-outputs/` - Canvas export/import test files
- Test reports are saved as JSON for programmatic analysis

## 🎯 Test Coverage

### Features Tested

✅ **Schema Generation**
- Simple schemas (blog, e-commerce, social network)
- Complex multi-table relationships
- Edge cases and special characters

✅ **Schema Modifications**
- Adding/removing fields
- Changing data types
- Adding/removing relationships
- Complex multi-step modifications

✅ **Export Formats**
- JSON schema format
- Canvas-compatible format (ReactFlow)
- SQL DDL generation
- Round-trip conversions

✅ **AI Integration**
- OpenRouter API integration
- Function calling detection
- Tool selection logic
- Error handling and fallbacks

## 📊 Test Pipeline Architecture

```
┌─────────────────────────────────────────────┐
│           test-summary.js                   │
│         (Orchestrator & Reporter)           │
└─────────────┬───────────────────────────────┘
              │
              ├── test-ai.js
              │   ├── Schema Generation
              │   ├── Natural Language Processing
              │   └── Function Calling
              │
              ├── test-modifications.js
              │   ├── Field Operations
              │   ├── Table Operations
              │   └── Relationship Management
              │
              ├── test-canvas-export.js
              │   ├── Schema → Canvas
              │   ├── Canvas → Schema
              │   ├── SQL Generation
              │   └── Handle Validation
              │
              └── test-e2e-pipeline.js
                  ├── Generation Tests
                  ├── Modification Tests
                  ├── Complex Scenarios
                  └── Edge Cases
```

## 🔍 Test Details

### 1. AI Service Tests (`test-ai.js`)

Tests the core AI service functionality:

```javascript
// Test cases include:
- Basic schema generation
- Tool detection and function calling
- Response parsing and validation
- Error handling
```

**Key Validations:**
- Proper schema structure
- Valid data types
- Relationship integrity
- Primary key presence

### 2. Modification Tests (`test-modifications.js`)

Tests incremental schema modifications:

```javascript
const tests = [
  "Adding Fields",
  "Removing Tables",
  "Changing Field Types",
  "Complex Modifications",
  "Removing Fields"
];
```

**Validates:**
- Modification detection
- Incremental updates
- Schema preservation
- Relationship updates

### 3. Canvas Export Tests (`test-canvas-export.js`)

Tests conversion between formats:

```javascript
// Conversions tested:
- Schema → Canvas (ReactFlow nodes/edges)
- Canvas → Schema (reverse conversion)
- Schema → SQL DDL
- Round-trip integrity
```

**Handle Format Validation:**
```
Pattern: table-{timestamp}-{index}-col-{timestamp}-{index}-{colIndex}-{source|target}
Example: table-1755349161351-1-col-1755349161351-1-1-source
```

### 4. End-to-End Pipeline (`test-e2e-pipeline.js`)

Comprehensive testing with detailed reporting:

#### Test Sections:

**Section 1: Schema Generation**
- Simple blog schema
- E-commerce schema
- Complex social network

**Section 2: Schema Modifications**
- Add timestamps to all tables
- Add new relationships
- Remove sensitive fields
- Change data types

**Section 3: Complex Scenarios**
- Multi-step evolution
- Performance optimization
- Incremental improvements

**Section 4: Edge Cases**
- Empty schemas
- Circular references
- Long names
- Special characters

## 📈 Metrics & Reporting

### Test Summary Output

```
╔══════════════════════════════════════════════════════════╗
║        DATABASE DIAGRAM TOOL - TEST SUITE SUMMARY        ║
╚══════════════════════════════════════════════════════════╝

Tests Run: 3
Passed: 3
Failed: 0
Pass Rate: 100.0%
Total Duration: 64.60s

Output Analysis:
  Total Files Generated: 12
  Schema Files: 7
  Canvas Files: 2
  SQL Files: 2
  Total Tables Created: 40
  Total Relationships: 41

Key Metrics:
  Average Tables per Schema: 5.7
  Average Relationships per Schema: 5.9

Feature Coverage: 100.0%
✓ ALL SYSTEMS OPERATIONAL
```

### JSON Report Structure

```json
{
  "timestamp": "2024-01-18T10:00:00.000Z",
  "results": [...],
  "analysis": {
    "totalFiles": 12,
    "schemas": 7,
    "canvasFiles": 2,
    "sqlFiles": 2,
    "totalTables": 40,
    "totalRelationships": 41
  },
  "metrics": {
    "passRate": "100.0",
    "coveragePercent": "100.0",
    "totalDuration": "64.60",
    "avgTablesPerSchema": "5.7",
    "avgRelPerSchema": "5.9"
  }
}
```

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Default AI Model
DEFAULT_AI_MODEL=google/gemini-2.5-flash

# Server Configuration
PORT=4000
NODE_ENV=development
```

### Model Selection

The test pipeline uses `google/gemini-2.5-flash` by default. To test with different models:

```javascript
// In ai-service.js
this.model = process.env.DEFAULT_AI_MODEL || 'google/gemini-2.5-flash';
```

## 🔧 Troubleshooting

### Common Issues

**1. Timeout Errors**
- Increase timeout in test scripts
- Check API rate limits
- Verify network connectivity

**2. Schema Validation Failures**
- Check AI model responses
- Verify prompt clarity
- Review validation logic

**3. Canvas Export Issues**
- Validate handle ID format
- Check node/edge structure
- Verify ReactFlow compatibility

### Debug Mode

Enable detailed logging:

```javascript
// Add to test scripts
process.env.DEBUG = 'true';
```

## 📝 Adding New Tests

### 1. Create Test File

```javascript
// test-new-feature.js
const AIService = require('./ai-service');

async function testNewFeature() {
  const aiService = new AIService();
  
  // Your test logic here
  console.log('✅ Test passed');
}

testNewFeature();
```

### 2. Add to Package Scripts

```json
{
  "scripts": {
    "test:new": "node test-new-feature.js"
  }
}
```

### 3. Include in Summary

Update `test-summary.js`:

```javascript
const tests = [
  // ... existing tests
  { command: 'node test-new-feature.js', name: 'New Feature Tests' }
];
```

## 🎨 Test Output Examples

### Generated Schema (JSON)

```json
{
  "tables": [
    {
      "name": "users",
      "columns": [
        {
          "name": "id",
          "type": "BIGINT AUTO_INCREMENT",
          "isPrimaryKey": true,
          "isNullable": false
        }
      ]
    }
  ],
  "relationships": [
    {
      "sourceTable": "posts",
      "sourceColumn": "user_id",
      "targetTable": "users",
      "targetColumn": "id",
      "type": "1:N"
    }
  ]
}
```

### Canvas Export (ReactFlow)

```json
{
  "nodes": [
    {
      "id": "table-1755349161351-0",
      "type": "table",
      "position": { "x": 100, "y": 100 },
      "data": {
        "name": "users",
        "columns": [...]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1755349161351-0",
      "type": "foreign-key",
      "source": "table-1755349161351-0",
      "target": "table-1755349161351-1",
      "sourceHandle": "...",
      "targetHandle": "..."
    }
  ]
}
```

### SQL Export

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE posts
  ADD CONSTRAINT fk_posts_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Test Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd server
        npm install
    
    - name: Run test suite
      env:
        OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
      run: |
        cd server
        npm run test:all
```

## 📚 Best Practices

1. **Run tests regularly** - Before commits and deployments
2. **Monitor metrics** - Track trends in test duration and coverage
3. **Update test cases** - Add tests for new features
4. **Review failures** - Don't ignore intermittent failures
5. **Clean test data** - Remove old test outputs periodically

## 🤝 Contributing

When adding new features:

1. Write corresponding tests
2. Ensure all existing tests pass
3. Update this documentation
4. Include test results in PR

## 📞 Support

For issues with the test pipeline:

1. Check error logs in console output
2. Review generated test reports
3. Verify API configuration
4. Open an issue with test logs

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Maintained By:** AI Integration Team