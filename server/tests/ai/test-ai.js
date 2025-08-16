const AIService = require('../../ai-service');
require('dotenv').config();

async function testAIService() {
  const aiService = new AIService();
  
  console.log('🤖 Testing AI Service');
  console.log('Model:', process.env.DEFAULT_AI_MODEL);
  console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);
  console.log('---\n');

  // Test 1: Simple schema generation request
  console.log('📝 Test 1: Schema Generation');
  console.log('User: "generate a simple 3 table example schema"');
  try {
    const response1 = await aiService.chatAboutSchema(
      "generate a simple 3 table example schema"
    );
    console.log('AI Response Type:', response1.type);
    console.log('AI Response:', JSON.stringify(response1, null, 2));
    
    // If it's a tool call for schema generation, execute it
    if (response1.type === 'tool_call' && 
        response1.tool_call.function.name === 'generate_database_schema') {
      console.log('\n🔧 Executing schema generation...');
      const args = JSON.parse(response1.tool_call.function.arguments);
      const schema = await aiService.generateSchema(args.description);
      console.log('Generated Schema:', JSON.stringify(schema, null, 2));
    }
  } catch (error) {
    console.error('❌ Test 1 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Modification request
  console.log('📝 Test 2: Schema Modification');
  console.log('User: "add a comments table with user_id and post_id foreign keys"');
  
  // Simulate existing schema
  const existingSchema = {
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { name: 'username', type: 'VARCHAR(50)', isPrimaryKey: false, isNullable: false }
        ]
      },
      {
        name: 'posts',
        columns: [
          { name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { name: 'title', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false },
          { name: 'user_id', type: 'BIGINT', isPrimaryKey: false, isNullable: false }
        ]
      }
    ],
    relationships: [
      {
        sourceTable: 'users',
        sourceColumn: 'id',
        targetTable: 'posts',
        targetColumn: 'user_id',
        type: '1:N'
      }
    ]
  };

  try {
    const response2 = await aiService.chatAboutSchema(
      "add a comments table with user_id and post_id foreign keys",
      existingSchema
    );
    console.log('AI Response Type:', response2.type);
    console.log('AI Response:', JSON.stringify(response2, null, 2));
    
    // If it's a tool call for modification, execute it
    if (response2.type === 'tool_call' && 
        response2.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing schema modification...');
      const args = JSON.parse(response2.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, existingSchema);
      console.log('Modified Schema:', JSON.stringify(modifiedSchema, null, 2));
    }
  } catch (error) {
    console.error('❌ Test 2 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Analysis request
  console.log('📝 Test 3: Schema Analysis');
  console.log('User: "analyze this schema for improvements"');
  try {
    const response3 = await aiService.chatAboutSchema(
      "analyze this schema for improvements",
      existingSchema
    );
    console.log('AI Response Type:', response3.type);
    console.log('AI Response:', JSON.stringify(response3, null, 2));
    
    // If it's a tool call for analysis, execute it
    if (response3.type === 'tool_call' && 
        response3.tool_call.function.name === 'analyze_current_schema') {
      console.log('\n🔧 Executing schema analysis...');
      const analysis = await aiService.analyzeSchema(existingSchema);
      console.log('Analysis Result:', analysis);
    }
  } catch (error) {
    console.error('❌ Test 3 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Regular chat
  console.log('📝 Test 4: Regular Chat');
  console.log('User: "what is a primary key?"');
  try {
    const response4 = await aiService.chatAboutSchema(
      "what is a primary key?"
    );
    console.log('AI Response Type:', response4.type);
    console.log('AI Response:', JSON.stringify(response4, null, 2));
  } catch (error) {
    console.error('❌ Test 4 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 5: Direct schema generation (bypassing chat)
  console.log('📝 Test 5: Direct Schema Generation');
  console.log('Prompt: "blog platform with users, posts, and comments"');
  try {
    const directSchema = await aiService.generateSchema("blog platform with users, posts, and comments");
    console.log('Direct Schema Generation:', JSON.stringify(directSchema, null, 2));
  } catch (error) {
    console.error('❌ Test 5 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 6: Adding fields to existing table
  console.log('📝 Test 6: Adding Fields');
  console.log('User: "add avatar_url and bio fields to the users table"');
  try {
    const response6 = await aiService.chatAboutSchema(
      "add avatar_url and bio fields to the users table",
      existingSchema
    );
    console.log('AI Response Type:', response6.type);
    console.log('AI Response:', JSON.stringify(response6, null, 2));
    
    if (response6.type === 'tool_call' && 
        response6.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing field addition...');
      const args = JSON.parse(response6.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, existingSchema);
      console.log('Schema with added fields:', JSON.stringify(modifiedSchema.tables.find(t => t.name === 'users'), null, 2));
    }
  } catch (error) {
    console.error('❌ Test 6 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 7: Removing a table
  console.log('📝 Test 7: Removing Table');
  console.log('User: "remove the posts table from the schema"');
  try {
    const response7 = await aiService.chatAboutSchema(
      "remove the posts table from the schema",
      existingSchema
    );
    console.log('AI Response Type:', response7.type);
    console.log('AI Response:', JSON.stringify(response7, null, 2));
    
    if (response7.type === 'tool_call' && 
        response7.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing table removal...');
      const args = JSON.parse(response7.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, existingSchema);
      console.log('Remaining tables:', modifiedSchema.tables.map(t => t.name));
      console.log('Remaining relationships:', modifiedSchema.relationships);
    }
  } catch (error) {
    console.error('❌ Test 7 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 8: Changing field types
  console.log('📝 Test 8: Changing Field Types');
  console.log('User: "change the username field in users table to VARCHAR(100) and make it nullable"');
  try {
    const response8 = await aiService.chatAboutSchema(
      "change the username field in users table to VARCHAR(100) and make it nullable",
      existingSchema
    );
    console.log('AI Response Type:', response8.type);
    console.log('AI Response:', JSON.stringify(response8, null, 2));
    
    if (response8.type === 'tool_call' && 
        response8.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing field type change...');
      const args = JSON.parse(response8.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, existingSchema);
      const usersTable = modifiedSchema.tables.find(t => t.name === 'users');
      const usernameField = usersTable?.columns.find(c => c.name === 'username');
      console.log('Updated username field:', JSON.stringify(usernameField, null, 2));
    }
  } catch (error) {
    console.error('❌ Test 8 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 9: Adding new relationship
  console.log('📝 Test 9: Adding New Relationship');
  console.log('User: "add a categories table and link posts to categories with a many-to-many relationship"');
  
  const schemaWithCategories = {
    ...existingSchema,
    tables: [
      ...existingSchema.tables,
      {
        name: 'categories',
        columns: [
          { name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { name: 'name', type: 'VARCHAR(100)', isPrimaryKey: false, isNullable: false },
          { name: 'description', type: 'TEXT', isPrimaryKey: false, isNullable: true }
        ]
      }
    ]
  };

  try {
    const response9 = await aiService.chatAboutSchema(
      "add a categories table and link posts to categories with a many-to-many relationship",
      schemaWithCategories
    );
    console.log('AI Response Type:', response9.type);
    console.log('AI Response:', JSON.stringify(response9, null, 2));
    
    if (response9.type === 'tool_call' && 
        response9.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing relationship addition...');
      const args = JSON.parse(response9.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, schemaWithCategories);
      console.log('New relationships:', JSON.stringify(modifiedSchema.relationships, null, 2));
      console.log('Junction table:', modifiedSchema.tables.find(t => t.name.includes('post') && t.name.includes('categor')));
    }
  } catch (error) {
    console.error('❌ Test 9 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 10: Complex modification with suggestions
  console.log('📝 Test 10: Complex Modification from Analysis');
  const suggestions = `Based on analysis, here are improvements needed:
1. Add indexes on frequently queried columns
2. Add created_at and updated_at timestamps to all tables
3. Change user_id in posts to author_id for clarity
4. Add a status field to posts (draft, published, archived)
5. Add email validation constraints`;
  
  console.log('User: [Pasted suggestions from analysis]');
  console.log(suggestions);
  
  try {
    const response10 = await aiService.chatAboutSchema(
      suggestions,
      existingSchema
    );
    console.log('AI Response Type:', response10.type);
    console.log('AI Response:', JSON.stringify(response10, null, 2));
    
    if (response10.type === 'tool_call' && 
        response10.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing complex modifications...');
      const args = JSON.parse(response10.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, existingSchema);
      console.log('Posts table after improvements:', JSON.stringify(modifiedSchema.tables.find(t => t.name === 'posts'), null, 2));
    }
  } catch (error) {
    console.error('❌ Test 10 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 11: Removing fields
  console.log('📝 Test 11: Removing Fields');
  console.log('User: "remove the user_id field from posts table, we don\'t need it anymore"');
  try {
    const response11 = await aiService.chatAboutSchema(
      "remove the user_id field from posts table, we don't need it anymore",
      existingSchema
    );
    console.log('AI Response Type:', response11.type);
    console.log('AI Response:', JSON.stringify(response11, null, 2));
    
    if (response11.type === 'tool_call' && 
        response11.tool_call.function.name === 'modify_existing_schema') {
      console.log('\n🔧 Executing field removal...');
      const args = JSON.parse(response11.tool_call.function.arguments);
      const modifiedSchema = await aiService.generateSchema(args.description, existingSchema);
      const postsTable = modifiedSchema.tables.find(t => t.name === 'posts');
      console.log('Posts table columns after removal:', postsTable?.columns.map(c => c.name));
      console.log('Relationships after removal:', modifiedSchema.relationships);
    }
  } catch (error) {
    console.error('❌ Test 11 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 12: Schema normalization
  console.log('📝 Test 12: Schema Normalization');
  console.log('User: "normalize this schema to 3NF and fix any redundancies"');
  try {
    const response12 = await aiService.chatAboutSchema(
      "normalize this schema to 3NF and fix any redundancies",
      existingSchema
    );
    console.log('AI Response Type:', response12.type);
    console.log('AI Response:', JSON.stringify(response12, null, 2));
  } catch (error) {
    console.error('❌ Test 12 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 13: Performance optimization
  console.log('📝 Test 13: Performance Optimization');
  console.log('User: "optimize this schema for a high-traffic blog with millions of posts"');
  try {
    const response13 = await aiService.chatAboutSchema(
      "optimize this schema for a high-traffic blog with millions of posts",
      existingSchema
    );
    console.log('AI Response Type:', response13.type);
    console.log('AI Response:', JSON.stringify(response13, null, 2));
  } catch (error) {
    console.error('❌ Test 13 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 14: Ambiguous request (should ask for clarification)
  console.log('📝 Test 14: Ambiguous Request');
  console.log('User: "make it better"');
  try {
    const response14 = await aiService.chatAboutSchema(
      "make it better",
      existingSchema
    );
    console.log('AI Response Type:', response14.type);
    console.log('AI Response:', JSON.stringify(response14, null, 2));
  } catch (error) {
    console.error('❌ Test 14 Error:', error.message);
  }

  console.log('\n---\n');

  // Test 15: Edge case - Empty schema
  console.log('📝 Test 15: Edge Case - Empty Schema');
  console.log('User: "add a users table to this empty schema"');
  try {
    const response15 = await aiService.chatAboutSchema(
      "add a users table to this empty schema",
      { tables: [], relationships: [] }
    );
    console.log('AI Response Type:', response15.type);
    console.log('AI Response:', JSON.stringify(response15, null, 2));
  } catch (error) {
    console.error('❌ Test 15 Error:', error.message);
  }

  console.log('\n✅ All extended tests completed!');
}

// Run the test
testAIService().catch(console.error);