// Test pipeline for schema modification functionality
// This test will verify each layer of the schema modification process

const axios = require('axios');
const AIService = require('./api/ai-service');

const API_BASE_URL = 'http://localhost:3002/api';

// Test utilities
const log = (message, data = null) => {
  console.log(`\n${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const error = (message, err) => {
  console.error(`\n❌ ${message}`);
  console.error(err);
};

// Test 1: Direct AI Service Test
async function testAIServiceModification() {
  log('========================================');
  log('TEST 1: AI Service Schema Modification');
  log('========================================');
  
  try {
    const aiService = new AIService();
    
    // Create initial schema
    const initialSchema = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
            { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false }
          ]
        }
      ],
      relationships: []
    };
    
    log('📊 Initial Schema:', initialSchema);
    
    // Test chatAboutSchema for modification
    log('\n🔄 Testing chatAboutSchema with modification request...');
    const chatResponse = await aiService.chatAboutSchema(
      'Add first_name, last_name, and phone_number fields to the users table',
      initialSchema,
      []
    );
    
    log('📝 Chat Response Type:', chatResponse.type);
    log('📝 Full Chat Response:', chatResponse);
    
    // If it's a tool call, show the tool details
    if (chatResponse.type === 'tool_call') {
      log('🔧 Tool Call Details:', {
        name: chatResponse.tool_call.function.name,
        arguments: JSON.parse(chatResponse.tool_call.function.arguments)
      });
    }
    
    // Test direct schema generation with modification
    log('\n🔄 Testing generateSchema with existing schema...');
    const modifiedSchema = await aiService.generateSchema(
      'Add first_name (VARCHAR), last_name (VARCHAR), and phone_number (VARCHAR) fields to the users table',
      initialSchema
    );
    
    log('✅ Modified Schema:', modifiedSchema);
    
    // Verify the modification
    const usersTable = modifiedSchema.tables.find(t => t.name === 'users');
    if (usersTable) {
      log('📋 Users table columns after modification:', usersTable.columns);
      const hasNewFields = 
        usersTable.columns.some(c => c.name === 'first_name') &&
        usersTable.columns.some(c => c.name === 'last_name') &&
        usersTable.columns.some(c => c.name === 'phone_number');
      
      if (hasNewFields) {
        log('✅ SUCCESS: New fields were added to users table');
      } else {
        log('❌ FAILURE: New fields were NOT added to users table');
      }
    } else {
      log('❌ FAILURE: Users table not found in modified schema');
    }
    
  } catch (err) {
    error('AI Service test failed:', err);
  }
}

// Test 2: API Chat Endpoint Test
async function testAPIChatEndpoint() {
  log('\n========================================');
  log('TEST 2: API Chat Endpoint');
  log('========================================');
  
  try {
    const initialSchema = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
            { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false }
          ]
        }
      ],
      relationships: []
    };
    
    log('📊 Initial Schema:', initialSchema);
    
    // Test the chat endpoint
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message: 'Add first_name, last_name, and phone_number fields to the users table',
      currentSchema: initialSchema,
      conversationHistory: []
    });
    
    log('📝 API Response Status:', response.status);
    log('📝 API Response Data:', response.data);
    
    // Check if schema is in response
    if (response.data.schema) {
      log('✅ Schema found in response');
      
      const usersTable = response.data.schema.tables.find(t => t.name === 'users');
      if (usersTable) {
        log('📋 Users table columns:', usersTable.columns);
        
        const hasNewFields = 
          usersTable.columns.some(c => c.name === 'first_name') &&
          usersTable.columns.some(c => c.name === 'last_name') &&
          usersTable.columns.some(c => c.name === 'phone_number');
        
        if (hasNewFields) {
          log('✅ SUCCESS: API returned modified schema with new fields');
        } else {
          log('❌ FAILURE: API returned schema but WITHOUT new fields');
        }
      } else {
        log('❌ FAILURE: Users table not found in API response schema');
      }
    } else {
      log('❌ FAILURE: No schema in API response');
      log('Response keys:', Object.keys(response.data));
    }
    
    if (response.data.content) {
      log('📝 Response message:', response.data.content);
    }
    
  } catch (err) {
    error('API Chat endpoint test failed:', err.response?.data || err.message);
  }
}

// Test 3: Full Client-Server Integration Test
async function testFullIntegration() {
  log('\n========================================');
  log('TEST 3: Full Client-Server Integration');
  log('========================================');
  
  try {
    // Simulate what the client does
    const initialSchema = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
            { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false }
          ]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
            { name: 'title', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false },
            { name: 'user_id', type: 'INT', isPrimaryKey: false, isNullable: false }
          ]
        }
      ],
      relationships: [
        {
          sourceTable: 'posts',
          sourceColumn: 'user_id',
          targetTable: 'users',
          targetColumn: 'id',
          type: '1:N'
        }
      ]
    };
    
    log('📊 Initial Schema with relationships:', initialSchema);
    
    // Test modification with relationships preserved
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message: 'Add created_at and updated_at timestamp fields to both users and posts tables',
      currentSchema: initialSchema,
      conversationHistory: []
    });
    
    log('📝 Integration Test Response:', response.data);
    
    if (response.data.schema) {
      // Check tables
      const tables = response.data.schema.tables;
      log(`\n📋 Modified schema has ${tables.length} tables`);
      
      // Check each table for new fields
      for (const table of tables) {
        log(`\n🔍 Checking table: ${table.name}`);
        log(`   Columns: ${table.columns.map(c => c.name).join(', ')}`);
        
        const hasTimestamps = 
          table.columns.some(c => c.name === 'created_at') &&
          table.columns.some(c => c.name === 'updated_at');
        
        if (hasTimestamps) {
          log(`   ✅ Timestamps added to ${table.name}`);
        } else {
          log(`   ❌ Timestamps NOT added to ${table.name}`);
        }
      }
      
      // Check relationships preserved
      log('\n🔗 Checking relationships...');
      if (response.data.schema.relationships && response.data.schema.relationships.length > 0) {
        log('✅ Relationships preserved:', response.data.schema.relationships);
      } else {
        log('❌ Relationships lost in modification!');
      }
    }
    
  } catch (err) {
    error('Full integration test failed:', err.response?.data || err.message);
  }
}

// Test 4: Direct Tool Call Test
async function testDirectToolCall() {
  log('\n========================================');
  log('TEST 4: Direct Tool Call Response');
  log('========================================');
  
  try {
    // Test if AI returns tool_call for modification
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message: 'Please modify the existing schema by adding a description field to all tables',
      currentSchema: {
        tables: [
          {
            name: 'products',
            columns: [
              { name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false },
              { name: 'name', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false }
            ]
          }
        ],
        relationships: []
      },
      conversationHistory: []
    });
    
    log('📝 Tool Call Test Response:', response.data);
    
    // Check what type of response we got
    if (response.data.response && response.data.response.type) {
      log('Response has type:', response.data.response.type);
      if (response.data.response.type === 'tool_call') {
        log('✅ AI wants to use tool:', response.data.response.tool_call);
      }
    } else if (response.data.schema) {
      log('✅ Direct schema modification returned');
    } else if (response.data.content) {
      log('⚠️ Only content returned, no schema modification');
    }
    
  } catch (err) {
    error('Direct tool call test failed:', err.response?.data || err.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Schema Modification Test Pipeline');
  console.log('============================================\n');
  
  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/health`);
    log('✅ Server is running on port 3002\n');
  } catch (err) {
    error('Server is not running! Please start with: vercel dev --listen 3002');
    return;
  }
  
  // Run tests sequentially
  await testAIServiceModification();
  await testAPIChatEndpoint();
  await testFullIntegration();
  await testDirectToolCall();
  
  log('\n============================================');
  log('🏁 Test Pipeline Complete');
  log('============================================');
}

// Execute tests
runAllTests().catch(err => {
  error('Test pipeline failed:', err);
  process.exit(1);
});