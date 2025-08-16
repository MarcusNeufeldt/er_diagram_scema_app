const AIService = require('./ai-service');
require('dotenv').config();

async function testModifications() {
  const aiService = new AIService();
  
  console.log('🔧 Testing Schema Modifications');
  
  // Simple schema for testing
  const testSchema = {
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'BIGINT', isPrimaryKey: true, isNullable: false },
          { name: 'username', type: 'VARCHAR(50)', isPrimaryKey: false, isNullable: false },
          { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isNullable: false }
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
      { sourceTable: 'users', sourceColumn: 'id', targetTable: 'posts', targetColumn: 'user_id', type: '1:N' }
    ]
  };

  const tests = [
    {
      name: "Adding Fields",
      prompt: "add avatar_url and bio fields to the users table"
    },
    {
      name: "Removing Table", 
      prompt: "remove the posts table from the schema"
    },
    {
      name: "Changing Field Types",
      prompt: "change the username field to VARCHAR(100) and make it nullable"
    },
    {
      name: "Complex Modifications from Analysis",
      prompt: `Based on analysis, here are improvements needed:
1. Add created_at and updated_at timestamps to all tables
2. Add a status field to posts (draft, published, archived)
3. Add email validation constraints`
    },
    {
      name: "Removing Fields",
      prompt: "remove the user_id field from posts table"
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📝 Test ${i+1}: ${test.name}`);
    console.log(`User: "${test.prompt}"`);
    
    try {
      const response = await aiService.chatAboutSchema(test.prompt, testSchema);
      console.log('AI Response Type:', response.type);
      
      if (response.type === 'tool_call') {
        console.log('Tool Called:', response.tool_call.function.name);
        console.log('Arguments:', response.tool_call.function.arguments);
        
        // Execute the modification if it's the right tool
        if (response.tool_call.function.name === 'modify_existing_schema') {
          try {
            const args = JSON.parse(response.tool_call.function.arguments);
            const modifiedSchema = await aiService.generateSchema(args.description, testSchema);
            console.log('✅ Modification successful');
            console.log('Tables after:', modifiedSchema.tables.map(t => t.name));
            console.log('Relationships after:', modifiedSchema.relationships.length);
          } catch (modError) {
            console.log('❌ Modification failed:', modError.message.substring(0, 100));
          }
        }
      } else {
        console.log('Message:', response.content?.substring(0, 200));
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message.substring(0, 100));
    }
    
    console.log('---');
  }
  
  console.log('\n✅ Modification tests completed!');
}

testModifications();