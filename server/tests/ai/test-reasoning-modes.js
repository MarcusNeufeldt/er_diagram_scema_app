const AIService = require('../../ai-service');

async function testAllReasoningModes() {
  console.log('🧠 Testing All Reasoning Modes\n');
  
  const aiService = new AIService();
  
  // Test 1: Effort-based reasoning (current default)
  console.log('1️⃣ Testing effort-based reasoning (medium)...');
  aiService.enableReasoning = true;
  aiService.reasoningEffort = 'medium';
  let config = aiService.getReasoningConfig();
  console.log('Config:', JSON.stringify(config, null, 2));
  
  // Test 2: High effort
  console.log('\n2️⃣ Testing high effort reasoning...');
  aiService.reasoningEffort = 'high';
  config = aiService.getReasoningConfig();
  console.log('Config:', JSON.stringify(config, null, 2));
  
  // Test 3: Low effort  
  console.log('\n3️⃣ Testing low effort reasoning...');
  aiService.reasoningEffort = 'low';
  config = aiService.getReasoningConfig();
  console.log('Config:', JSON.stringify(config, null, 2));
  
  // Test 4: Custom max_tokens mode
  console.log('\n4️⃣ Testing custom max_tokens mode...');
  aiService.reasoningEffort = 'custom';
  aiService.reasoningMaxTokens = 2000;
  config = aiService.getReasoningConfig();
  console.log('Config:', JSON.stringify(config, null, 2));
  
  // Test 5: Reasoning disabled
  console.log('\n5️⃣ Testing reasoning disabled...');
  aiService.enableReasoning = false;
  config = aiService.getReasoningConfig();
  console.log('Config:', JSON.stringify(config, null, 2));
  
  // Test 6: Excluded reasoning tokens
  console.log('\n6️⃣ Testing excluded reasoning tokens...');
  aiService.enableReasoning = true;
  aiService.reasoningEffort = 'medium';
  aiService.reasoningExclude = true;
  config = aiService.getReasoningConfig();
  console.log('Config:', JSON.stringify(config, null, 2));
  
  console.log('\n✅ All reasoning mode tests completed!');
  console.log('\n📋 Configuration Summary:');
  console.log('- Use REASONING_EFFORT=high/medium/low for effort-based control');
  console.log('- Use REASONING_EFFORT=custom + REASONING_MAX_TOKENS for precise control');
  console.log('- Use ENABLE_REASONING=false to disable and save costs');
  console.log('- Use REASONING_EXCLUDE=true to hide reasoning tokens from response');
}

testAllReasoningModes().catch(console.error);