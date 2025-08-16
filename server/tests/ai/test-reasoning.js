const AIService = require('../../ai-service');

async function testReasoningConfig() {
  console.log('🧠 Testing Reasoning Configuration\n');
  
  const aiService = new AIService();
  
  console.log('Configuration:');
  console.log('- Reasoning enabled:', aiService.enableReasoning);
  console.log('- Effort level:', aiService.reasoningEffort);
  console.log('- Max tokens:', aiService.reasoningMaxTokens);
  console.log('- Exclude from response:', aiService.reasoningExclude);
  console.log();
  
  const reasoningConfig = aiService.getReasoningConfig();
  console.log('Generated API config:');
  console.log(JSON.stringify(reasoningConfig, null, 2));
  console.log();
  
  // Test with reasoning disabled
  console.log('Testing with reasoning disabled...');
  aiService.enableReasoning = false;
  const disabledConfig = aiService.getReasoningConfig();
  console.log('Disabled config:', JSON.stringify(disabledConfig, null, 2));
  console.log();
  
  console.log('✅ Reasoning configuration test completed!');
  console.log();
  console.log('Environment Variables for Configuration:');
  console.log('- ENABLE_REASONING=true/false');
  console.log('- REASONING_EFFORT=high/medium/low/custom');
  console.log('- REASONING_MAX_TOKENS=4000 (only used when REASONING_EFFORT=custom)');
  console.log('- REASONING_EXCLUDE=true/false');
  console.log();
  console.log('Note: OpenRouter only allows either "effort" OR "max_tokens", not both.');
  console.log('Use REASONING_EFFORT=custom to switch to max_tokens mode.');
}

testReasoningConfig().catch(console.error);