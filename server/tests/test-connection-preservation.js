require('dotenv').config();
const AIService = require('./ai-service');

async function testConnectionPreservation() {
  console.log('🔗 Testing Connection Preservation During Schema Iteration\n');
  
  const aiService = new AIService();
  
  try {
    // Step 1: Generate initial schema with relationships
    console.log('📝 Step 1: Generate initial blog schema');
    const initialSchema = await aiService.generateSchema(
      'blog platform with users, categories, posts, comments, and post_categories junction table'
    );
    
    console.log(`✅ Initial schema created with ${initialSchema.tables.length} tables and ${initialSchema.relationships.length} relationships`);
    console.log('Tables:', initialSchema.tables.map(t => t.name).join(', '));
    console.log('Relationships:');
    initialSchema.relationships.forEach(rel => {
      console.log(`  - ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn} (${rel.type})`);
    });
    
    // Step 2: Simulate adding a tags table (the problem case)
    console.log('\n📝 Step 2: Add tags table with many-to-many relationship');
    const modifiedSchema = await aiService.generateSchema(
      'Add a new table named "tags" with columns: id (PK, auto-increment), name (VARCHAR). Also, add a join table named "post_tags" to establish a many-to-many relationship between "posts" and "tags". This join table should have "post_id" and "tag_id" as a composite primary key, both referencing their respective tables.',
      initialSchema
    );
    
    console.log(`✅ Modified schema has ${modifiedSchema.tables.length} tables and ${modifiedSchema.relationships.length} relationships`);
    console.log('Tables:', modifiedSchema.tables.map(t => t.name).join(', '));
    console.log('Relationships:');
    modifiedSchema.relationships.forEach(rel => {
      console.log(`  - ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn} (${rel.type})`);
    });
    
    // Step 3: Check if relationships were preserved
    console.log('\n🔍 Step 3: Analyzing relationship preservation');
    
    const initialRelKeys = new Set(
      initialSchema.relationships.map(rel => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    const modifiedRelKeys = new Set(
      modifiedSchema.relationships.map(rel => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    console.log('\nInitial relationships:');
    initialRelKeys.forEach(rel => console.log(`  ✓ ${rel}`));
    
    console.log('\nModified relationships:');
    modifiedRelKeys.forEach(rel => console.log(`  ✓ ${rel}`));
    
    // Check for lost relationships
    const lostRelationships = [...initialRelKeys].filter(rel => !modifiedRelKeys.has(rel));
    const newRelationships = [...modifiedRelKeys].filter(rel => !initialRelKeys.has(rel));
    
    if (lostRelationships.length > 0) {
      console.log('\n❌ LOST RELATIONSHIPS:');
      lostRelationships.forEach(rel => console.log(`  - ${rel}`));
    } else {
      console.log('\n✅ All original relationships preserved!');
    }
    
    if (newRelationships.length > 0) {
      console.log('\n✅ NEW RELATIONSHIPS:');
      newRelationships.forEach(rel => console.log(`  + ${rel}`));
    }
    
    // Step 4: Test fixing relationships (if they were lost)
    if (lostRelationships.length > 0) {
      console.log('\n📝 Step 4: Attempt to fix lost relationships');
      const fixedSchema = await aiService.generateSchema(
        'Re-establish all the original foreign key relationships that should exist in a blog platform: users to posts, users to comments, posts to comments, categories to post_categories, posts to post_categories',
        modifiedSchema
      );
      
      console.log(`🔧 Fixed schema has ${fixedSchema.relationships.length} relationships`);
      fixedSchema.relationships.forEach(rel => {
        console.log(`  - ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn} (${rel.type})`);
      });
      
      const fixedRelKeys = new Set(
        fixedSchema.relationships.map(rel => 
          `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
        )
      );
      
      const stillLost = [...initialRelKeys].filter(rel => !fixedRelKeys.has(rel));
      if (stillLost.length === 0) {
        console.log('✅ All relationships successfully restored!');
      } else {
        console.log('❌ Some relationships still missing:', stillLost);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testConnectionPreservation();