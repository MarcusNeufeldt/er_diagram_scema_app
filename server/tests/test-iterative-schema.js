require('dotenv').config();
const AIService = require('./ai-service');

async function testIterativeSchema() {
  console.log('🔄 Testing Iterative Schema Modifications\n');
  
  const aiService = new AIService();
  
  try {
    // Step 1: Generate initial schema
    console.log('📝 Step 1: Generate initial blog schema');
    const initialSchema = await aiService.generateSchema(
      'blog platform with users, posts, comments, categories, and post_categories junction table'
    );
    
    console.log(`✅ Initial schema: ${initialSchema.tables.length} tables, ${initialSchema.relationships.length} relationships`);
    console.log('Tables:', initialSchema.tables.map(t => t.name).join(', '));
    console.log('Relationships:');
    initialSchema.relationships.forEach(rel => {
      console.log(`  - ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn}`);
    });
    
    // Step 2: Add tags table - this is where connections get lost
    console.log('\n📝 Step 2: Add tags table (critical test)');
    const withTagsSchema = await aiService.generateSchema(
      'Add a new table named tags with id and name columns',
      initialSchema
    );
    
    console.log(`✅ After adding tags: ${withTagsSchema.tables.length} tables, ${withTagsSchema.relationships.length} relationships`);
    console.log('Tables:', withTagsSchema.tables.map(t => t.name).join(', '));
    console.log('Relationships:');
    withTagsSchema.relationships.forEach(rel => {
      console.log(`  - ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn}`);
    });
    
    // Check if relationships were preserved
    const initialRelKeys = new Set(
      initialSchema.relationships.map(rel => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    const tagsRelKeys = new Set(
      withTagsSchema.relationships.map(rel => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    const lostRelationships = [...initialRelKeys].filter(rel => !tagsRelKeys.has(rel));
    
    if (lostRelationships.length > 0) {
      console.log('\n❌ RELATIONSHIPS LOST WHEN ADDING TAGS:');
      lostRelationships.forEach(rel => console.log(`  - ${rel}`));
    } else {
      console.log('\n✅ All relationships preserved when adding tags table!');
    }
    
    // Step 3: Add another modification to ensure stability
    console.log('\n📝 Step 3: Add post_tags junction table');
    const withJunctionSchema = await aiService.generateSchema(
      'Add a join table named post_tags to establish a many-to-many relationship between posts and tags. This join table should have post_id and tag_id as foreign keys.',
      withTagsSchema
    );
    
    console.log(`✅ After adding junction: ${withJunctionSchema.tables.length} tables, ${withJunctionSchema.relationships.length} relationships`);
    console.log('Tables:', withJunctionSchema.tables.map(t => t.name).join(', '));
    console.log('Relationships:');
    withJunctionSchema.relationships.forEach(rel => {
      console.log(`  - ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn}`);
    });
    
    // Final check
    const junctionRelKeys = new Set(
      withJunctionSchema.relationships.map(rel => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    const finalLost = [...initialRelKeys].filter(rel => !junctionRelKeys.has(rel));
    
    if (finalLost.length > 0) {
      console.log('\n❌ RELATIONSHIPS STILL MISSING AFTER ALL MODIFICATIONS:');
      finalLost.forEach(rel => console.log(`  - ${rel}`));
    } else {
      console.log('\n🎉 SUCCESS: All original relationships preserved through all modifications!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIterativeSchema();