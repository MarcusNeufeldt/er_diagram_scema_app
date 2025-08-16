const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Test Summary Runner
 * Runs all tests and provides a comprehensive summary
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function runTest(command, name) {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}Running: ${name}${colors.reset}`);
    const startTime = Date.now();
    
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (error) {
        console.log(`${colors.red}✗ ${name} failed (${duration}s)${colors.reset}`);
        if (stderr) console.log(stderr.substring(0, 200));
        resolve({ name, success: false, duration, error: error.message });
      } else {
        console.log(`${colors.green}✓ ${name} passed (${duration}s)${colors.reset}`);
        resolve({ name, success: true, duration });
      }
    });
  });
}

async function analyzaTestOutputs() {
  const outputDirs = [
    path.join(__dirname, 'test-outputs'),
    path.join(__dirname, 'canvas-test-outputs')
  ];
  
  const analysis = {
    totalFiles: 0,
    schemas: [],
    sqlFiles: [],
    canvasFiles: [],
    totalTables: 0,
    totalRelationships: 0
  };
  
  for (const dir of outputDirs) {
    try {
      const files = await fs.readdir(dir);
      analysis.totalFiles += files.length;
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const data = JSON.parse(content);
            
            if (data.tables && data.relationships) {
              analysis.schemas.push(file);
              analysis.totalTables += data.tables.length;
              analysis.totalRelationships += data.relationships.length;
            } else if (data.nodes && data.edges) {
              analysis.canvasFiles.push(file);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        } else if (file.endsWith('.sql')) {
          analysis.sqlFiles.push(file);
        }
      }
    } catch (e) {
      // Directory doesn't exist
    }
  }
  
  return analysis;
}

async function runTestSummary() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        DATABASE DIAGRAM TOOL - TEST SUITE SUMMARY        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  const tests = [
    { command: 'node test-ai.js', name: 'AI Service Basic Tests' },
    { command: 'node test-modifications.js', name: 'Schema Modification Tests' },
    { command: 'node test-canvas-export.js', name: 'Canvas Export/Import Tests' }
  ];
  
  const results = [];
  const startTime = Date.now();
  
  // Run each test
  for (const test of tests) {
    const result = await runTest(test.command, test.name);
    results.push(result);
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Analyze outputs
  console.log(`\n${colors.cyan}Analyzing test outputs...${colors.reset}`);
  const analysis = await analyzaTestOutputs();
  
  // Print summary
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}TEST RESULTS SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const passRate = ((passed / results.length) * 100).toFixed(1);
  
  console.log(`${colors.bright}Tests Run:${colors.reset} ${results.length}`);
  console.log(`${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${failed}`);
  console.log(`${colors.bright}Pass Rate:${colors.reset} ${passRate}%`);
  console.log(`${colors.bright}Total Duration:${colors.reset} ${totalDuration}s`);
  
  console.log(`\n${colors.cyan}Test Details:${colors.reset}`);
  results.forEach(r => {
    const icon = r.success ? `${colors.green}✓` : `${colors.red}✗`;
    const status = r.success ? colors.green : colors.red;
    console.log(`  ${icon} ${r.name} ${status}(${r.duration}s)${colors.reset}`);
  });
  
  console.log(`\n${colors.cyan}Output Analysis:${colors.reset}`);
  console.log(`  Total Files Generated: ${analysis.totalFiles}`);
  console.log(`  Schema Files: ${analysis.schemas.length}`);
  console.log(`  Canvas Files: ${analysis.canvasFiles.length}`);
  console.log(`  SQL Files: ${analysis.sqlFiles.length}`);
  console.log(`  Total Tables Created: ${analysis.totalTables}`);
  console.log(`  Total Relationships: ${analysis.totalRelationships}`);
  
  // Key metrics
  console.log(`\n${colors.cyan}Key Metrics:${colors.reset}`);
  const avgTablesPerSchema = analysis.schemas.length > 0 
    ? (analysis.totalTables / analysis.schemas.length).toFixed(1) 
    : 0;
  const avgRelPerSchema = analysis.schemas.length > 0 
    ? (analysis.totalRelationships / analysis.schemas.length).toFixed(1) 
    : 0;
  
  console.log(`  Average Tables per Schema: ${avgTablesPerSchema}`);
  console.log(`  Average Relationships per Schema: ${avgRelPerSchema}`);
  
  // Recommendations
  console.log(`\n${colors.cyan}Recommendations:${colors.reset}`);
  if (failed > 0) {
    console.log(`  ${colors.yellow}⚠ ${failed} test(s) failed - review error logs${colors.reset}`);
  }
  if (analysis.totalFiles === 0) {
    console.log(`  ${colors.yellow}⚠ No output files found - tests may not be generating outputs${colors.reset}`);
  }
  if (passRate < 100) {
    console.log(`  ${colors.yellow}⚠ Pass rate below 100% - investigate failures${colors.reset}`);
  } else {
    console.log(`  ${colors.green}✓ All tests passing - system is stable${colors.reset}`);
  }
  
  // Coverage report
  console.log(`\n${colors.cyan}Test Coverage:${colors.reset}`);
  const coverage = [
    { feature: 'Schema Generation', tested: analysis.schemas.length > 0 },
    { feature: 'Schema Modification', tested: analysis.schemas.some(s => s.includes('modified')) },
    { feature: 'Canvas Export', tested: analysis.canvasFiles.length > 0 },
    { feature: 'SQL Generation', tested: analysis.sqlFiles.length > 0 },
    { feature: 'Complex Scenarios', tested: analysis.schemas.some(s => s.includes('complex')) },
    { feature: 'Round-trip Conversion', tested: analysis.canvasFiles.length > 0 && analysis.schemas.length > 0 }
  ];
  
  coverage.forEach(c => {
    const icon = c.tested ? `${colors.green}✓` : `${colors.red}✗`;
    const status = c.tested ? `${colors.green}TESTED` : `${colors.red}NOT TESTED`;
    console.log(`  ${icon} ${c.feature}: ${status}${colors.reset}`);
  });
  
  const testedFeatures = coverage.filter(c => c.tested).length;
  const coveragePercent = ((testedFeatures / coverage.length) * 100).toFixed(1);
  console.log(`\n${colors.bright}Feature Coverage: ${coveragePercent}%${colors.reset}`);
  
  // Final verdict
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  if (passRate === '100.0' && coveragePercent === '100.0') {
    console.log(`${colors.bright}${colors.green}✓ ALL SYSTEMS OPERATIONAL${colors.reset}`);
  } else if (passRate >= '80.0' && coveragePercent >= '80.0') {
    console.log(`${colors.bright}${colors.yellow}⚠ SYSTEM MOSTLY OPERATIONAL${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.red}✗ SYSTEM NEEDS ATTENTION${colors.reset}`);
  }
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    results,
    analysis,
    metrics: {
      passRate,
      coveragePercent,
      totalDuration,
      avgTablesPerSchema,
      avgRelPerSchema
    }
  };
  
  await fs.writeFile(
    path.join(__dirname, 'test-report-summary.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`${colors.cyan}Full report saved to: test-report-summary.json${colors.reset}\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the summary
runTestSummary().catch(error => {
  console.error(`${colors.red}Test summary failed: ${error.message}${colors.reset}`);
  process.exit(1);
});