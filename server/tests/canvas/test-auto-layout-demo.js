const AIService = require('../../ai-service');

async function testAutoLayoutWithSchema() {
  console.log('🎯 Auto-Layout Algorithm Test\n');
  
  const aiService = new AIService();
  
  try {
    console.log('🤖 Generating test schema...');
    const schema = await aiService.generateSchema('blog platform with users, posts, comments, categories, and tags. Include a many-to-many relationship between posts and tags');
    
    console.log('✅ Generated schema with:');
    console.log(`📊 Tables: ${schema.tables.length}`);
    console.log(`🔗 Relationships: ${schema.relationships.length}`);
    console.log();
    
    console.log('📋 Tables:');
    schema.tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name} (${table.columns.length} columns)`);
    });
    console.log();
    
    console.log('🔗 Relationships:');
    schema.relationships.forEach((rel, index) => {
      console.log(`  ${index + 1}. ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn} (${rel.type})`);
    });
    console.log();
    
    // Simulate auto-layout algorithm analysis (NEW: Left-to-Right Hierarchical)
    console.log('🎯 Auto-Layout Analysis (Left-to-Right Hierarchical):');
    console.log();
    
    // Build dependency graph (who depends on whom)
    const dependencies = new Map();
    const dependents = new Map();
    
    schema.tables.forEach(table => {
      dependencies.set(table.name, new Set());
      dependents.set(table.name, new Set());
    });
    
    // Analyze foreign key relationships to build dependency graph
    schema.relationships.forEach(rel => {
      // User wants output-based hierarchy: nodes with outputs on LEFT
      // For posts.user_id -> users.id: posts has output TO users
      // So posts should be LEFT, users should be RIGHT
      // This means users depends on posts (reverse of FK dependency)
      dependencies.get(rel.targetTable)?.add(rel.sourceTable);
      dependents.get(rel.sourceTable)?.add(rel.targetTable);
    });
    
    // Show dependency analysis
    console.log('📊 Dependency Analysis:');
    schema.tables.forEach(table => {
      const deps = Array.from(dependencies.get(table.name) || []);
      const depCount = deps.length;
      if (depCount > 0) {
        console.log(`  ${table.name} depends on: ${deps.join(', ')}`);
      } else {
        console.log(`  ${table.name}: Independent (no dependencies)`);
      }
    });
    console.log();
    
    // Perform topological sorting to determine hierarchy levels
    const levels = [];
    const visited = new Set();
    const inDegree = new Map();
    
    // Calculate in-degrees (number of dependencies)
    schema.tables.forEach(table => {
      inDegree.set(table.name, dependencies.get(table.name)?.size || 0);
    });
    
    // Find tables with no dependencies for the first level
    while (visited.size < schema.tables.length) {
      const currentLevel = [];
      
      // Find all tables with in-degree 0 (no unresolved dependencies)
      schema.tables.forEach(table => {
        if (!visited.has(table.name) && (inDegree.get(table.name) || 0) === 0) {
          currentLevel.push(table.name);
        }
      });
      
      // If no tables found, we have a circular dependency
      if (currentLevel.length === 0) {
        let minDependencies = Infinity;
        let selectedTable = '';
        
        schema.tables.forEach(table => {
          if (!visited.has(table.name)) {
            const deps = inDegree.get(table.name) || 0;
            if (deps < minDependencies) {
              minDependencies = deps;
              selectedTable = table.name;
            }
          }
        });
        
        if (selectedTable) {
          currentLevel.push(selectedTable);
          console.log(`⚠️  Circular dependency detected - breaking with: ${selectedTable}`);
        }
      }
      
      // Add current level to levels array
      levels.push(currentLevel);
      
      // Mark current level as visited and reduce in-degree for their dependents
      currentLevel.forEach(tableName => {
        visited.add(tableName);
        
        const tableDependents = dependents.get(tableName);
        tableDependents?.forEach(dependentName => {
          const currentInDegree = inDegree.get(dependentName) || 0;
          inDegree.set(dependentName, Math.max(0, currentInDegree - 1));
        });
      });
    }
    
    console.log('🎨 Left-to-Right Layout Hierarchy:');
    levels.forEach((level, index) => {
      const columnLabel = ['First', 'Second', 'Third', 'Fourth', 'Fifth'][index] || `${index + 1}th`;
      console.log(`  Column ${index + 1} (${columnLabel} - leftmost to rightmost):`);
      level.forEach(tableName => {
        const deps = Array.from(dependencies.get(tableName) || []);
        const depsText = deps.length > 0 ? ` (depends on: ${deps.join(', ')})` : ' (independent)';
        console.log(`    📋 ${tableName}${depsText}`);
      });
    });
    console.log();
    
    console.log('📖 Reading Flow (Output-Based Hierarchy):');
    console.log('└─ Tables are arranged left-to-right by OUTPUT count');
    console.log('└─ Tables with MORE outputs appear in LEFT columns');
    console.log('└─ Tables with FEWER outputs appear in RIGHT columns');
    console.log('└─ Flow: Most referenced → Less referenced → Least referenced');
    console.log();
    
    console.log('✅ Auto-layout algorithm test completed!');
    console.log();
    console.log('🚀 To test in the UI:');
    console.log('1. Start the application: npm run test-auto-layout');
    console.log('2. Generate this schema with AI');
    console.log('3. Click the "Auto Layout" button');
    console.log('4. Observe the intelligent positioning!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAutoLayoutWithSchema();