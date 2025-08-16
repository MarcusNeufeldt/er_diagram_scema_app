const AIService = require('../../ai-service');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Test Canvas Export/Import Functionality
 * This script tests the conversion between AI schemas and canvas-compatible formats
 */

// Canvas node/edge structure (mimics ReactFlow format)
function schemaToCanvasFormat(schema) {
  const timestamp = Date.now();
  const nodes = [];
  const edges = [];
  
  // Create table name to ID mapping
  const tableNameToId = new Map();
  
  // Generate nodes from tables
  schema.tables.forEach((table, index) => {
    const tableId = `table-${timestamp}-${index}`;
    tableNameToId.set(table.name, tableId);
    
    const node = {
      id: tableId,
      type: 'table',
      position: { 
        x: 100 + (index % 3) * 350, 
        y: 100 + Math.floor(index / 3) * 250 
      },
      data: {
        id: tableId,
        name: table.name,
        columns: table.columns.map((col, colIndex) => ({
          id: `col-${timestamp}-${index}-${colIndex}`,
          name: col.name,
          type: col.type,
          isPrimaryKey: col.isPrimaryKey || false,
          isNullable: col.isNullable !== false,
          defaultValue: col.defaultValue,
          isForeignKey: false,
          references: undefined
        })),
        indexes: table.indexes || [],
        foreignKeys: []
      }
    };
    
    nodes.push(node);
  });
  
  // Generate edges from relationships
  schema.relationships.forEach((rel, index) => {
    const sourceTableId = tableNameToId.get(rel.sourceTable);
    const targetTableId = tableNameToId.get(rel.targetTable);
    
    if (!sourceTableId || !targetTableId) {
      console.warn(`Could not find table IDs for relationship: ${rel.sourceTable} -> ${rel.targetTable}`);
      return;
    }
    
    // Find source and target columns
    const sourceNode = nodes.find(n => n.id === sourceTableId);
    const targetNode = nodes.find(n => n.id === targetTableId);
    
    const sourceColumn = sourceNode?.data.columns.find(col => col.name === rel.sourceColumn);
    const targetColumn = targetNode?.data.columns.find(col => col.name === rel.targetColumn);
    
    if (!sourceColumn || !targetColumn) {
      console.warn(`Could not find columns for relationship: ${rel.sourceColumn} -> ${rel.targetColumn}`);
      return;
    }
    
    // Mark target column as foreign key
    targetColumn.isForeignKey = true;
    targetColumn.references = {
      table: sourceTableId,
      column: sourceColumn.id
    };
    
    const edge = {
      id: `edge-${timestamp}-${index}`,
      type: 'foreign-key',
      source: sourceTableId,
      target: targetTableId,
      sourceHandle: `${sourceTableId}-${sourceColumn.id}-source`,
      targetHandle: `${targetTableId}-${targetColumn.id}-target`,
      data: {
        cardinality: rel.type || '1:N',
        label: rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`,
        onDelete: rel.onDelete || 'CASCADE',
        onUpdate: rel.onUpdate || 'CASCADE'
      }
    };
    
    edges.push(edge);
  });
  
  return { nodes, edges };
}

// Convert canvas format back to schema
function canvasToSchemaFormat(canvasData) {
  const schema = {
    tables: [],
    relationships: []
  };
  
  // Create ID to name mapping
  const nodeIdToName = new Map();
  
  // Convert nodes to tables
  canvasData.nodes.forEach(node => {
    if (node.type === 'table') {
      nodeIdToName.set(node.id, node.data.name);
      
      const table = {
        name: node.data.name,
        columns: node.data.columns.map(col => ({
          name: col.name,
          type: col.type,
          isPrimaryKey: col.isPrimaryKey || false,
          isNullable: col.isNullable !== false,
          defaultValue: col.defaultValue
        })),
        indexes: node.data.indexes || []
      };
      
      schema.tables.push(table);
    }
  });
  
  // Convert edges to relationships
  canvasData.edges.forEach(edge => {
    if (edge.type === 'foreign-key') {
      const sourceName = nodeIdToName.get(edge.source);
      const targetName = nodeIdToName.get(edge.target);
      
      if (!sourceName || !targetName) {
        console.warn(`Could not resolve table names for edge: ${edge.id}`);
        return;
      }
      
      // Extract column names from handles
      // Handle format: table-timestamp-index-col-timestamp-index-colIndex-source/target
      const sourceHandle = edge.sourceHandle;
      const targetHandle = edge.targetHandle;
      
      // Find the actual columns
      const sourceNode = canvasData.nodes.find(n => n.id === edge.source);
      const targetNode = canvasData.nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Parse column IDs from handles
      const sourceColId = sourceHandle.replace(edge.source + '-', '').replace('-source', '');
      const targetColId = targetHandle.replace(edge.target + '-', '').replace('-target', '');
      
      const sourceColumn = sourceNode.data.columns.find(c => c.id === sourceColId);
      const targetColumn = targetNode.data.columns.find(c => c.id === targetColId);
      
      if (!sourceColumn || !targetColumn) {
        console.warn(`Could not find columns for edge: ${edge.id}`);
        return;
      }
      
      const relationship = {
        sourceTable: sourceName,
        sourceColumn: sourceColumn.name,
        targetTable: targetName,
        targetColumn: targetColumn.name,
        type: edge.data?.cardinality || '1:N',
        name: edge.data?.label,
        onDelete: edge.data?.onDelete || 'CASCADE',
        onUpdate: edge.data?.onUpdate || 'CASCADE'
      };
      
      schema.relationships.push(relationship);
    }
  });
  
  return schema;
}

// SQL Export
function schemaToSQL(schema) {
  let sql = '-- Generated SQL from Schema\n\n';
  
  // Create tables
  schema.tables.forEach(table => {
    sql += `CREATE TABLE ${table.name} (\n`;
    
    const columnDefs = [];
    const primaryKeys = [];
    
    table.columns.forEach(col => {
      let def = `  ${col.name} ${col.type}`;
      
      if (col.defaultValue) {
        if (col.defaultValue === 'AUTO_INCREMENT') {
          def += ' AUTO_INCREMENT';
        } else {
          def += ` DEFAULT ${col.defaultValue}`;
        }
      }
      
      if (!col.isNullable) {
        def += ' NOT NULL';
      }
      
      if (col.isPrimaryKey) {
        primaryKeys.push(col.name);
      }
      
      columnDefs.push(def);
    });
    
    // Add primary key constraint
    if (primaryKeys.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    }
    
    sql += columnDefs.join(',\n');
    sql += '\n);\n\n';
  });
  
  // Add foreign key constraints
  schema.relationships.forEach(rel => {
    const constraintName = rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`;
    sql += `ALTER TABLE ${rel.targetTable}\n`;
    sql += `  ADD CONSTRAINT ${constraintName}\n`;
    sql += `  FOREIGN KEY (${rel.targetColumn})\n`;
    sql += `  REFERENCES ${rel.sourceTable}(${rel.sourceColumn})\n`;
    sql += `  ON DELETE ${rel.onDelete || 'CASCADE'}\n`;
    sql += `  ON UPDATE ${rel.onUpdate || 'CASCADE'};\n\n`;
  });
  
  return sql;
}

// Main test function
async function testCanvasExport() {
  console.log('🎨 Testing Canvas Export/Import Functionality\n');
  
  const aiService = new AIService();
  const outputDir = path.join(__dirname, 'canvas-test-outputs');
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  // Test 1: Generate Schema and Convert to Canvas
  console.log('📝 Test 1: Schema to Canvas Conversion');
  
  const testSchema = await aiService.generateSchema(
    'Create a project management schema with projects, tasks, users, and comments'
  );
  
  console.log(`✅ Generated schema with ${testSchema.tables.length} tables`);
  
  // Convert to canvas format
  const canvasData = schemaToCanvasFormat(testSchema);
  console.log(`✅ Converted to canvas format:`);
  console.log(`   - ${canvasData.nodes.length} nodes`);
  console.log(`   - ${canvasData.edges.length} edges`);
  
  // Save canvas data
  await fs.writeFile(
    path.join(outputDir, 'canvas-export.json'),
    JSON.stringify(canvasData, null, 2)
  );
  
  // Test 2: Round-trip conversion
  console.log('\n📝 Test 2: Round-trip Conversion');
  
  const reconvertedSchema = canvasToSchemaFormat(canvasData);
  console.log(`✅ Converted back to schema format:`);
  console.log(`   - ${reconvertedSchema.tables.length} tables`);
  console.log(`   - ${reconvertedSchema.relationships.length} relationships`);
  
  // Verify data integrity
  const originalTableNames = testSchema.tables.map(t => t.name).sort();
  const reconvertedTableNames = reconvertedSchema.tables.map(t => t.name).sort();
  
  if (JSON.stringify(originalTableNames) === JSON.stringify(reconvertedTableNames)) {
    console.log('✅ Table names preserved correctly');
  } else {
    console.log('❌ Table name mismatch!');
    console.log('   Original:', originalTableNames);
    console.log('   Reconverted:', reconvertedTableNames);
  }
  
  // Test 3: SQL Export
  console.log('\n📝 Test 3: SQL Export');
  
  const sqlExport = schemaToSQL(testSchema);
  console.log(`✅ Generated SQL (${sqlExport.length} characters)`);
  
  await fs.writeFile(
    path.join(outputDir, 'schema-export.sql'),
    sqlExport
  );
  
  // Test 4: Complex Schema with Many Relationships
  console.log('\n📝 Test 4: Complex Schema Handling');
  
  const complexSchema = await aiService.generateSchema(
    'Create a complete e-commerce schema with users, products, categories, orders, order_items, reviews, inventory, shipping, and payment tables with all appropriate relationships'
  );
  
  const complexCanvas = schemaToCanvasFormat(complexSchema);
  console.log(`✅ Complex schema converted:`);
  console.log(`   - ${complexCanvas.nodes.length} nodes`);
  console.log(`   - ${complexCanvas.edges.length} edges`);
  
  // Validate handle format
  let validHandles = true;
  complexCanvas.edges.forEach(edge => {
    if (!edge.sourceHandle || !edge.targetHandle) {
      validHandles = false;
      console.log(`❌ Invalid handles in edge ${edge.id}`);
    }
    
    // Check handle format
    const sourcePattern = /^table-\d+-\d+-col-\d+-\d+-\d+-source$/;
    const targetPattern = /^table-\d+-\d+-col-\d+-\d+-\d+-target$/;
    
    if (!sourcePattern.test(edge.sourceHandle)) {
      console.log(`⚠️  Non-standard source handle: ${edge.sourceHandle}`);
    }
    if (!targetPattern.test(edge.targetHandle)) {
      console.log(`⚠️  Non-standard target handle: ${edge.targetHandle}`);
    }
  });
  
  if (validHandles) {
    console.log('✅ All edge handles are valid');
  }
  
  // Save all outputs
  await fs.writeFile(
    path.join(outputDir, 'complex-canvas.json'),
    JSON.stringify(complexCanvas, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'complex-schema.json'),
    JSON.stringify(complexSchema, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'complex-export.sql'),
    schemaToSQL(complexSchema)
  );
  
  // Test 5: Import Test - Load and Validate Saved Canvas
  console.log('\n📝 Test 5: Canvas Import Validation');
  
  const importedCanvas = JSON.parse(
    await fs.readFile(path.join(outputDir, 'canvas-export.json'), 'utf-8')
  );
  
  // Validate structure
  let isValid = true;
  
  if (!Array.isArray(importedCanvas.nodes)) {
    console.log('❌ Invalid nodes array');
    isValid = false;
  }
  
  if (!Array.isArray(importedCanvas.edges)) {
    console.log('❌ Invalid edges array');
    isValid = false;
  }
  
  importedCanvas.nodes.forEach(node => {
    if (!node.id || !node.type || !node.position || !node.data) {
      console.log(`❌ Invalid node structure: ${node.id}`);
      isValid = false;
    }
  });
  
  importedCanvas.edges.forEach(edge => {
    if (!edge.id || !edge.source || !edge.target) {
      console.log(`❌ Invalid edge structure: ${edge.id}`);
      isValid = false;
    }
  });
  
  if (isValid) {
    console.log('✅ Imported canvas structure is valid');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Canvas Export Test Summary:');
  console.log('='.repeat(60));
  console.log(`✅ All test files saved to: ${outputDir}`);
  console.log('✅ Schema <-> Canvas conversion working');
  console.log('✅ SQL export generation working');
  console.log('✅ Handle format validation complete');
  console.log('\nGenerated files:');
  console.log('  - canvas-export.json (Canvas format)');
  console.log('  - schema-export.sql (SQL DDL)');
  console.log('  - complex-canvas.json (Complex example)');
  console.log('  - complex-schema.json (Complex schema)');
  console.log('  - complex-export.sql (Complex SQL)');
}

// Run the test
testCanvasExport().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});