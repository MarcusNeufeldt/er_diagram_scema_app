const AIService = require('./ai-service');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Color codes for console output
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

// Test result tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Utility functions
function logSection(title) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}📝 Test: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
  testResults.passed++;
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
  testResults.failed++;
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
  testResults.warnings++;
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

// Schema validation functions
function validateSchema(schema, testName) {
  const issues = [];
  
  // Check basic structure
  if (!schema || typeof schema !== 'object') {
    issues.push('Schema is not an object');
    return issues;
  }
  
  if (!Array.isArray(schema.tables)) {
    issues.push('Schema.tables is not an array');
  } else {
    // Validate each table
    schema.tables.forEach((table, idx) => {
      if (!table.name) {
        issues.push(`Table ${idx} missing name`);
      }
      if (!Array.isArray(table.columns)) {
        issues.push(`Table ${table.name || idx} missing columns array`);
      } else {
        // Validate columns
        table.columns.forEach((col, colIdx) => {
          if (!col.name) {
            issues.push(`Column ${colIdx} in table ${table.name} missing name`);
          }
          if (!col.type) {
            issues.push(`Column ${col.name || colIdx} in table ${table.name} missing type`);
          }
        });
        
        // Check for at least one primary key
        const hasPK = table.columns.some(col => col.isPrimaryKey);
        if (!hasPK) {
          issues.push(`Table ${table.name} has no primary key`);
        }
      }
    });
  }
  
  if (!Array.isArray(schema.relationships)) {
    issues.push('Schema.relationships is not an array');
  } else {
    // Validate relationships
    schema.relationships.forEach((rel, idx) => {
      if (!rel.sourceTable || !rel.targetTable) {
        issues.push(`Relationship ${idx} missing source or target table`);
      }
      if (!rel.sourceColumn || !rel.targetColumn) {
        issues.push(`Relationship ${idx} missing source or target column`);
      }
      if (!rel.type) {
        issues.push(`Relationship ${idx} missing type`);
      }
      
      // Verify referenced tables exist
      if (schema.tables) {
        const sourceExists = schema.tables.some(t => t.name === rel.sourceTable);
        const targetExists = schema.tables.some(t => t.name === rel.targetTable);
        if (!sourceExists) {
          issues.push(`Relationship ${idx} references non-existent source table: ${rel.sourceTable}`);
        }
        if (!targetExists) {
          issues.push(`Relationship ${idx} references non-existent target table: ${rel.targetTable}`);
        }
      }
    });
  }
  
  return issues;
}

function compareSchemas(original, modified, expectedChanges) {
  const differences = {
    tablesAdded: [],
    tablesRemoved: [],
    columnsAdded: [],
    columnsRemoved: [],
    columnsModified: [],
    relationshipsAdded: [],
    relationshipsRemoved: []
  };
  
  const origTables = new Map(original.tables.map(t => [t.name, t]));
  const modTables = new Map(modified.tables.map(t => [t.name, t]));
  
  // Find added/removed tables
  modified.tables.forEach(t => {
    if (!origTables.has(t.name)) {
      differences.tablesAdded.push(t.name);
    }
  });
  
  original.tables.forEach(t => {
    if (!modTables.has(t.name)) {
      differences.tablesRemoved.push(t.name);
    }
  });
  
  // Compare columns in existing tables
  origTables.forEach((origTable, tableName) => {
    const modTable = modTables.get(tableName);
    if (modTable) {
      const origCols = new Map(origTable.columns.map(c => [c.name, c]));
      const modCols = new Map(modTable.columns.map(c => [c.name, c]));
      
      modTable.columns.forEach(col => {
        if (!origCols.has(col.name)) {
          differences.columnsAdded.push(`${tableName}.${col.name}`);
        } else {
          const origCol = origCols.get(col.name);
          if (origCol.type !== col.type || origCol.isNullable !== col.isNullable) {
            differences.columnsModified.push({
              table: tableName,
              column: col.name,
              changes: {
                type: origCol.type !== col.type ? [origCol.type, col.type] : null,
                nullable: origCol.isNullable !== col.isNullable ? [origCol.isNullable, col.isNullable] : null
              }
            });
          }
        }
      });
      
      origTable.columns.forEach(col => {
        if (!modCols.has(col.name)) {
          differences.columnsRemoved.push(`${tableName}.${col.name}`);
        }
      });
    }
  });
  
  // Compare relationships
  const origRels = original.relationships.map(r => 
    `${r.sourceTable}.${r.sourceColumn}->${r.targetTable}.${r.targetColumn}`
  );
  const modRels = modified.relationships.map(r => 
    `${r.sourceTable}.${r.sourceColumn}->${r.targetTable}.${r.targetColumn}`
  );
  
  modRels.forEach(rel => {
    if (!origRels.includes(rel)) {
      differences.relationshipsAdded.push(rel);
    }
  });
  
  origRels.forEach(rel => {
    if (!modRels.includes(rel)) {
      differences.relationshipsRemoved.push(rel);
    }
  });
  
  return differences;
}

// Export validation
async function validateExportFormats(schema) {
  const exportTests = {
    json: false,
    sql: false,
    canvasCompatible: false
  };
  
  // Test JSON export
  try {
    const jsonExport = JSON.stringify(schema, null, 2);
    const parsed = JSON.parse(jsonExport);
    exportTests.json = JSON.stringify(parsed) === JSON.stringify(schema);
  } catch (e) {
    logError(`JSON export failed: ${e.message}`);
  }
  
  // Test SQL generation (basic)
  try {
    let sql = '';
    schema.tables.forEach(table => {
      sql += `CREATE TABLE ${table.name} (\n`;
      const columnDefs = table.columns.map(col => {
        let def = `  ${col.name} ${col.type}`;
        if (col.isPrimaryKey) def += ' PRIMARY KEY';
        if (!col.isNullable) def += ' NOT NULL';
        return def;
      });
      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';
    });
    
    // Add foreign keys
    schema.relationships.forEach(rel => {
      sql += `ALTER TABLE ${rel.targetTable} ADD CONSTRAINT fk_${rel.targetTable}_${rel.targetColumn} `;
      sql += `FOREIGN KEY (${rel.targetColumn}) REFERENCES ${rel.sourceTable}(${rel.sourceColumn});\n`;
    });
    
    exportTests.sql = sql.length > 0 && sql.includes('CREATE TABLE');
  } catch (e) {
    logError(`SQL export failed: ${e.message}`);
  }
  
  // Test canvas compatibility (check if it matches expected structure)
  exportTests.canvasCompatible = 
    schema.tables.every(t => t.name && Array.isArray(t.columns)) &&
    schema.relationships.every(r => r.sourceTable && r.targetTable);
  
  return exportTests;
}

// Main test pipeline
async function runE2ETestPipeline() {
  logSection('🚀 STARTING END-TO-END TEST PIPELINE');
  
  const aiService = new AIService();
  const testOutputDir = path.join(__dirname, 'test-outputs');
  
  // Create output directory
  try {
    await fs.mkdir(testOutputDir, { recursive: true });
    logInfo(`Test output directory: ${testOutputDir}`);
  } catch (e) {
    logError(`Failed to create output directory: ${e.message}`);
  }
  
  // Test 1: Schema Generation from Scratch
  logSection('TEST 1: SCHEMA GENERATION');
  let baseSchema = null;
  
  const generationTests = [
    {
      name: 'Simple Blog Schema',
      prompt: 'Create a blog schema with users, posts, and comments tables',
      expectedTables: ['users', 'posts', 'comments'],
      expectedRelationships: 2 // at least posts->users and comments->posts
    },
    {
      name: 'E-commerce Schema',
      prompt: 'Create an e-commerce schema with products, categories, orders, and customers',
      expectedTables: ['products', 'categories', 'orders', 'customers'],
      expectedRelationships: 2 // at least orders->customers and products->categories
    },
    {
      name: 'Complex Social Network',
      prompt: 'Create a social network schema with users, friendships, posts, likes, and messages',
      expectedTables: ['users', 'friendships', 'posts', 'likes', 'messages'],
      expectedRelationships: 4
    }
  ];
  
  for (const test of generationTests) {
    logTest(test.name);
    
    try {
      const schema = await aiService.generateSchema(test.prompt);
      const validationIssues = validateSchema(schema, test.name);
      
      if (validationIssues.length === 0) {
        logSuccess(`Schema structure valid`);
      } else {
        validationIssues.forEach(issue => logWarning(issue));
      }
      
      // Check expected tables
      const tableNames = schema.tables.map(t => t.name);
      const missingTables = test.expectedTables.filter(t => 
        !tableNames.some(name => name.toLowerCase().includes(t.toLowerCase()))
      );
      
      if (missingTables.length === 0) {
        logSuccess(`All expected tables present: ${tableNames.join(', ')}`);
      } else {
        logWarning(`Missing expected tables: ${missingTables.join(', ')}`);
      }
      
      // Check relationships
      if (schema.relationships.length >= test.expectedRelationships) {
        logSuccess(`Sufficient relationships: ${schema.relationships.length}`);
      } else {
        logWarning(`Expected at least ${test.expectedRelationships} relationships, got ${schema.relationships.length}`);
      }
      
      // Save for next tests
      if (test.name === 'Simple Blog Schema') {
        baseSchema = schema;
        await fs.writeFile(
          path.join(testOutputDir, 'base-schema.json'),
          JSON.stringify(schema, null, 2)
        );
        logInfo('Saved base schema for modification tests');
      }
      
      // Test exports
      const exportResults = await validateExportFormats(schema);
      if (exportResults.json) logSuccess('JSON export valid');
      if (exportResults.sql) logSuccess('SQL export valid');
      if (exportResults.canvasCompatible) logSuccess('Canvas compatible');
      
    } catch (error) {
      logError(`Generation failed: ${error.message}`);
    }
  }
  
  // Test 2: Schema Modifications
  if (baseSchema) {
    logSection('TEST 2: SCHEMA MODIFICATIONS');
    
    const modificationTests = [
      {
        name: 'Add Fields',
        prompt: 'Add created_at and updated_at timestamps to all tables',
        validate: (orig, mod) => {
          const allHaveTimestamps = mod.tables.every(t => 
            t.columns.some(c => c.name === 'created_at') &&
            t.columns.some(c => c.name === 'updated_at')
          );
          return allHaveTimestamps;
        }
      },
      {
        name: 'Add Relationship',
        prompt: 'Add a relationship between comments and users for comment authors',
        validate: (orig, mod) => {
          return mod.relationships.length > orig.relationships.length;
        }
      },
      {
        name: 'Remove Field',
        prompt: 'Remove any password or sensitive fields from the users table',
        validate: (orig, mod) => {
          const origUser = orig.tables.find(t => t.name === 'users');
          const modUser = mod.tables.find(t => t.name === 'users');
          if (!origUser || !modUser) return false;
          return modUser.columns.length <= origUser.columns.length;
        }
      },
      {
        name: 'Change Field Types',
        prompt: 'Change all id fields to use UUID instead of BIGINT',
        validate: (orig, mod) => {
          const allUUID = mod.tables.every(t => {
            const idCol = t.columns.find(c => c.name === 'id');
            return idCol && idCol.type.includes('UUID');
          });
          return allUUID;
        }
      }
    ];
    
    let currentSchema = baseSchema;
    
    for (const test of modificationTests) {
      logTest(test.name);
      
      try {
        const response = await aiService.chatAboutSchema(test.prompt, currentSchema);
        
        if (response.type === 'tool_call') {
          logInfo(`Tool called: ${response.tool_call.function.name}`);
          
          const args = JSON.parse(response.tool_call.function.arguments);
          const modifiedSchema = await aiService.generateSchema(
            args.description || test.prompt, 
            currentSchema
          );
          
          // Validate structure
          const validationIssues = validateSchema(modifiedSchema, test.name);
          if (validationIssues.length === 0) {
            logSuccess('Modified schema structure valid');
          } else {
            validationIssues.forEach(issue => logWarning(issue));
          }
          
          // Compare schemas
          const differences = compareSchemas(currentSchema, modifiedSchema);
          logInfo(`Changes detected:`);
          if (differences.columnsAdded.length) 
            logInfo(`  Added columns: ${differences.columnsAdded.join(', ')}`);
          if (differences.columnsRemoved.length) 
            logInfo(`  Removed columns: ${differences.columnsRemoved.join(', ')}`);
          if (differences.columnsModified.length) 
            logInfo(`  Modified columns: ${differences.columnsModified.length}`);
          if (differences.relationshipsAdded.length) 
            logInfo(`  Added relationships: ${differences.relationshipsAdded.join(', ')}`);
          
          // Run custom validation
          if (test.validate(currentSchema, modifiedSchema)) {
            logSuccess('Modification validated successfully');
          } else {
            logError('Modification validation failed');
          }
          
          // Save modified schema
          await fs.writeFile(
            path.join(testOutputDir, `modified-${test.name.replace(/\s+/g, '-').toLowerCase()}.json`),
            JSON.stringify(modifiedSchema, null, 2)
          );
          
          currentSchema = modifiedSchema;
        } else {
          logWarning('AI did not trigger schema modification');
        }
        
      } catch (error) {
        logError(`Modification failed: ${error.message}`);
      }
    }
  }
  
  // Test 3: Complex Scenarios
  logSection('TEST 3: COMPLEX SCENARIOS');
  
  const complexTests = [
    {
      name: 'Multi-step Evolution',
      steps: [
        'Create a basic user authentication schema',
        'Add roles and permissions tables',
        'Add audit logging for all user actions',
        'Add OAuth provider support'
      ]
    },
    {
      name: 'Performance Optimization',
      steps: [
        'Create a schema for a high-traffic blog',
        'Add appropriate indexes for common queries',
        'Denormalize for read performance where appropriate',
        'Add caching tables'
      ]
    }
  ];
  
  for (const test of complexTests) {
    logTest(test.name);
    let evolvedSchema = null;
    
    for (const [idx, step] of test.steps.entries()) {
      logInfo(`Step ${idx + 1}: ${step}`);
      
      try {
        if (idx === 0) {
          evolvedSchema = await aiService.generateSchema(step);
        } else {
          const response = await aiService.chatAboutSchema(step, evolvedSchema);
          if (response.type === 'tool_call') {
            const args = JSON.parse(response.tool_call.function.arguments);
            evolvedSchema = await aiService.generateSchema(
              args.description || step,
              evolvedSchema
            );
          }
        }
        
        const issues = validateSchema(evolvedSchema, `${test.name} - Step ${idx + 1}`);
        if (issues.length === 0) {
          logSuccess(`Step ${idx + 1} completed`);
        } else {
          issues.forEach(issue => logWarning(issue));
        }
        
      } catch (error) {
        logError(`Step ${idx + 1} failed: ${error.message}`);
        break;
      }
    }
    
    if (evolvedSchema) {
      await fs.writeFile(
        path.join(testOutputDir, `complex-${test.name.replace(/\s+/g, '-').toLowerCase()}.json`),
        JSON.stringify(evolvedSchema, null, 2)
      );
    }
  }
  
  // Test 4: Edge Cases and Error Handling
  logSection('TEST 4: EDGE CASES');
  
  const edgeCases = [
    {
      name: 'Empty Schema Handling',
      prompt: 'Remove all tables from the schema',
      currentSchema: baseSchema
    },
    {
      name: 'Circular References',
      prompt: 'Create a schema where table A references B, B references C, and C references A'
    },
    {
      name: 'Very Long Names',
      prompt: 'Create a table with a very long name and column names over 50 characters'
    },
    {
      name: 'Special Characters',
      prompt: 'Create tables with names containing spaces, hyphens, and numbers'
    }
  ];
  
  for (const test of edgeCases) {
    logTest(test.name);
    
    try {
      const schema = test.currentSchema 
        ? await aiService.generateSchema(test.prompt, test.currentSchema)
        : await aiService.generateSchema(test.prompt);
      
      const issues = validateSchema(schema, test.name);
      if (issues.length === 0) {
        logSuccess('Edge case handled correctly');
      } else {
        logInfo('Schema validation issues (may be expected):');
        issues.forEach(issue => logInfo(`  ${issue}`));
      }
      
    } catch (error) {
      logInfo(`Edge case resulted in error (may be expected): ${error.message}`);
    }
  }
  
  // Final Report
  logSection('📊 TEST PIPELINE SUMMARY');
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`${colors.bright}Total Tests Run: ${total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);
  console.log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}`);
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: total,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      successRate: successRate
    },
    details: testResults.details,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (testResults.failed > 0) {
    report.recommendations.push('Review failed tests and adjust AI prompts or validation logic');
  }
  if (testResults.warnings > 10) {
    report.recommendations.push('Many warnings detected - consider stricter schema validation');
  }
  if (successRate < 80) {
    report.recommendations.push('Success rate below 80% - significant improvements needed');
  }
  
  await fs.writeFile(
    path.join(testOutputDir, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  logInfo(`\nDetailed report saved to: ${path.join(testOutputDir, 'test-report.json')}`);
  logInfo(`Test outputs saved to: ${testOutputDir}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the pipeline
runE2ETestPipeline().catch(error => {
  console.error(`${colors.red}Pipeline failed: ${error.message}${colors.reset}`);
  process.exit(1);
});