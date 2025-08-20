const { spawn } = require('child_process');
const path = require('path');

console.log('🎯 Testing Auto-Layout Feature\n');

async function testAutoLayout() {
  console.log('1. Starting the development server...');
  
  const clientPath = path.join(__dirname, 'client');
  const serverPath = path.join(__dirname, 'server');
  
  // Start the server
  console.log('📡 Starting backend server...');
  const server = spawn('npm', ['run', 'dev'], {
    cwd: serverPath,
    stdio: 'pipe',
    shell: true
  });
  
  // Start the client
  console.log('🖥️ Starting frontend client...');
  const client = spawn('npm', ['start'], {
    cwd: clientPath,
    stdio: 'pipe',
    shell: true
  });
  
  // Wait for servers to start
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('✅ Servers should be running now!');
  console.log('');
  console.log('🎯 Auto-Layout Testing Instructions:');
  console.log('');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Click "AI Assistant" to open the AI chat panel');
  console.log('3. Ask AI to generate a schema, for example:');
  console.log('   - "generate a blog schema with users, posts, and comments"');
  console.log('   - "create an e-commerce schema with products, orders, and customers"');
  console.log('4. After the tables are generated, click the green "Auto Layout" button');
  console.log('5. Watch the tables arrange themselves automatically!');
  console.log('');
  console.log('📋 Auto-Layout Features to Test:');
  console.log('- Single tables should arrange in a grid');
  console.log('- Related tables should cluster together');
  console.log('- Most connected tables should be in the center');
  console.log('- Tables should flash to indicate the layout change');
  console.log('- Button should be disabled when no tables exist');
  console.log('');
  console.log('🔍 Test Scenarios:');
  console.log('1. Test with 2-3 unrelated tables (should form a grid)');
  console.log('2. Test with a connected schema (blog/e-commerce)');
  console.log('3. Test with mixed: some connected, some isolated tables');
  console.log('4. Test with complex schemas (5+ tables with multiple relationships)');
  console.log('');
  console.log('Press Ctrl+C to stop the servers when done testing.');
  
  // Keep the process alive
  process.stdin.resume();
  
  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping servers...');
    server.kill();
    client.kill();
    process.exit();
  });
}

testAutoLayout();