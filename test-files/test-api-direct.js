// Direct API test to see exact response format
const axios = require('axios');

async function testDirectAPI() {
  const schema = {
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

  console.log('Testing API directly...\n');
  
  try {
    const response = await axios.post('http://localhost:3002/api/chat', {
      message: 'Add a media table with id, filename, file_type, and uploaded_at fields',
      currentSchema: schema,
      conversationHistory: []
    });
    
    console.log('Status:', response.status);
    console.log('\nFull Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n--- Response Analysis ---');
    console.log('Has .schema?', !!response.data.schema);
    console.log('Has .content?', !!response.data.content);
    console.log('Has .response?', !!response.data.response);
    
    if (response.data.schema) {
      console.log('\nTables in schema:', response.data.schema.tables.map(t => t.name));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDirectAPI();