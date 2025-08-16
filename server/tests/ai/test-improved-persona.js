require('dotenv').config();
const AIService = require('../../ai-service');

async function testImprovedPersona() {
  console.log('🎭 Testing Improved AI Persona and Context Awareness\n');
  
  const aiService = new AIService();
  
  try {
    // Create a simple schema first
    const initialSchema = await aiService.generateSchema('blog with users and posts');
    console.log('✅ Created initial blog schema with users and posts\n');
    
    // Test 1: Vague Request Handling
    console.log('📝 Test 1: Vague Request - "add some more fields"');
    const vagueChatHistory = [
      { role: 'user', content: 'add some more fields' }
    ];
    
    const vageResponse = await aiService.chatAboutSchema(
      'add some more fields',
      initialSchema,
      []
    );
    
    console.log('AI Response Type:', vageResponse.type);
    console.log('AI Response:', vageResponse.content || vageResponse.message);
    
    // Should ask for clarification instead of blindly calling modify tool
    if (vageResponse.type === 'message' && 
        (vageResponse.content.includes('which table') || 
         vageResponse.content.includes('what kind of fields') ||
         vageResponse.content.includes('For example'))) {
      console.log('✅ GOOD: AI asked for clarification instead of guessing');
    } else {
      console.log('❌ ISSUE: AI should ask for clarification on vague requests');
    }
    
    // Test 2: "Connections Lost" Interpretation
    console.log('\n📝 Test 2: Connection Loss - "all connections got lost"');
    const connectionResponse = await aiService.chatAboutSchema(
      'all connections got lost when I added the tags table',
      initialSchema,
      vagueChatHistory
    );
    
    console.log('AI Response Type:', connectionResponse.type);
    console.log('AI Response:', connectionResponse.content || connectionResponse.message);
    
    // Should interpret as visual edges, not network connections
    const responseText = connectionResponse.content || connectionResponse.message || '';
    if (responseText.toLowerCase().includes('visual') || 
        responseText.toLowerCase().includes('edge') || 
        responseText.toLowerCase().includes('canvas') ||
        responseText.toLowerCase().includes('relationship')) {
      console.log('✅ GOOD: AI interpreted connections as visual edges');
    } else if (responseText.toLowerCase().includes('network') ||
               responseText.toLowerCase().includes('server') ||
               responseText.toLowerCase().includes('firewall')) {
      console.log('❌ ISSUE: AI interpreted connections as network/server connections');
    } else {
      console.log('🤔 UNCLEAR: Response doesn\'t clearly indicate interpretation');
    }
    
    // Test 3: Specific Request (should work normally)
    console.log('\n📝 Test 3: Specific Request - "add created_at field to users table"');
    const specificResponse = await aiService.chatAboutSchema(
      'add created_at field to users table',
      initialSchema,
      []
    );
    
    console.log('AI Response Type:', specificResponse.type);
    if (specificResponse.type === 'tool_call') {
      console.log('Tool Called:', specificResponse.tool_call.function.name);
      console.log('Tool Arguments:', specificResponse.tool_call.function.arguments);
      console.log('✅ GOOD: AI correctly identified specific request and used appropriate tool');
    } else {
      console.log('AI Response:', specificResponse.content);
      console.log('❌ ISSUE: AI should have used modify_existing_schema tool for specific request');
    }
    
    // Test 4: Context Awareness
    console.log('\n📝 Test 4: Context Awareness - What is a connection?');
    const contextResponse = await aiService.chatAboutSchema(
      'what is a connection in this tool?',
      initialSchema,
      []
    );
    
    console.log('AI Response:', contextResponse.content || contextResponse.message);
    const contextText = contextResponse.content || contextResponse.message || '';
    if (contextText.toLowerCase().includes('visual') || 
        contextText.toLowerCase().includes('edge') || 
        contextText.toLowerCase().includes('line') ||
        contextText.toLowerCase().includes('relationship') ||
        contextText.toLowerCase().includes('canvas')) {
      console.log('✅ GOOD: AI understands its visual environment');
    } else {
      console.log('❌ ISSUE: AI should explain connections in context of visual tool');
    }
    
    console.log('\n🎯 Persona Test Summary:');
    console.log('The improved system prompt should:');
    console.log('1. ✅ Ask for clarification on vague requests');
    console.log('2. ✅ Interpret "connections" as visual edges');
    console.log('3. ✅ Handle specific requests with appropriate tools');
    console.log('4. ✅ Demonstrate awareness of the visual canvas environment');
    
  } catch (error) {
    console.error('❌ Persona test failed:', error.message);
  }
}

testImprovedPersona();