const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = process.env.OPENROUTER_BASE_URL;
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'anthropic/claude-3.5-sonnet';
    
    // Reasoning configuration
    this.enableReasoning = process.env.ENABLE_REASONING === 'true';
    this.reasoningEffort = process.env.REASONING_EFFORT || 'medium';
    this.reasoningMaxTokens = parseInt(process.env.REASONING_MAX_TOKENS) || 4000;
    this.reasoningExclude = process.env.REASONING_EXCLUDE === 'true';
  }

  // Get reasoning configuration for API calls
  getReasoningConfig() {
    if (!this.enableReasoning) {
      return {};
    }
    
    // OpenRouter only allows either 'effort' OR 'max_tokens', not both
    // Use effort by default, or max_tokens if effort is explicitly set to 'custom'
    const config = {
      reasoning: {
        exclude: this.reasoningExclude
      }
    };
    
    if (this.reasoningEffort === 'custom') {
      config.reasoning.max_tokens = this.reasoningMaxTokens;
    } else {
      config.reasoning.effort = this.reasoningEffort;
    }
    
    return config;
  }

  // Schema definitions for structured output (Pydantic-style)
  getDatabaseSchemaFormat() {
    return {
      type: "object",
      properties: {
        tables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Table name" },
              description: { type: "string", description: "Table description" },
              columns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Column name" },
                    type: { type: "string", description: "SQL data type (e.g., VARCHAR(255), INT, BOOLEAN)" },
                    isPrimaryKey: { type: "boolean", description: "Is this a primary key?" },
                    isNullable: { type: "boolean", description: "Can this column be null?" },
                    defaultValue: { type: "string", description: "Default value if any" },
                    description: { type: "string", description: "Column description" }
                  },
                  required: ["name", "type", "isPrimaryKey", "isNullable"]
                }
              },
              indexes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    columns: { type: "array", items: { type: "string" } },
                    unique: { type: "boolean" }
                  },
                  required: ["name", "columns", "unique"]
                }
              }
            },
            required: ["name", "columns"]
          }
        },
        relationships: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sourceTable: { type: "string", description: "Source table name" },
              sourceColumn: { type: "string", description: "Source column name" },
              targetTable: { type: "string", description: "Target table name" },
              targetColumn: { type: "string", description: "Target column name" },
              type: { 
                type: "string", 
                enum: ["1:1", "1:N", "N:N"],
                description: "Relationship cardinality" 
              },
              onDelete: { 
                type: "string", 
                enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"],
                description: "On delete action" 
              },
              onUpdate: { 
                type: "string", 
                enum: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"],
                description: "On update action" 
              },
              name: { type: "string", description: "Foreign key constraint name" }
            },
            required: ["sourceTable", "sourceColumn", "targetTable", "targetColumn", "type"]
          }
        }
      },
      required: ["tables", "relationships"]
    };
  }

  // System prompt for schema generation
  getSchemaGenerationPrompt() {
    return `You are a database schema design expert. Your task is to create well-structured database schemas based on user requirements.

Key principles:
1. Follow database normalization best practices
2. Use appropriate data types for each field
3. Create proper primary keys (usually 'id' as BIGINT AUTO_INCREMENT)
4. Define foreign key relationships with appropriate cardinality
5. Include useful indexes for performance
6. Use clear, descriptive names for tables and columns

When generating schemas:
- Always include an 'id' primary key for each table unless specifically told otherwise
- Use appropriate SQL data types (VARCHAR(255), INT, BIGINT, BOOLEAN, TEXT, DATETIME, etc.)
- Set up proper foreign key relationships between related tables
- Consider cascade actions (usually CASCADE for deletes, CASCADE for updates)
- Add indexes on frequently queried columns

Respond ONLY with valid JSON matching the required schema format. Do not include any explanations or additional text.`;
  }

  // Generate schema from natural language description
  async generateSchema(userPrompt, existingSchema = null) {
    try {
      const systemPrompt = this.getSchemaGenerationPrompt();
      const schemaFormat = this.getDatabaseSchemaFormat();
      
      let messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];

      if (existingSchema) {
        messages.push({
          role: "user",
          content: `Current schema: ${JSON.stringify(existingSchema, null, 2)}\n\nModification request: ${userPrompt}`
        });
      } else {
        messages.push({
          role: "user",
          content: `Create a database schema for: ${userPrompt}`
        });
      }

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.defaultModel,
        messages: messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "database_schema",
            schema: schemaFormat,
            strict: true
          }
        },
        temperature: 0.1,
        ...this.getReasoningConfig()
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Database Diagram Tool'
        }
      });

      let content = response.data.choices[0].message.content;
      
      // Handle case where AI returns JSON wrapped in markdown code blocks
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        // Handle generic code blocks
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          content = codeMatch[1];
        }
      }
      
      return JSON.parse(content.trim());
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      throw new Error(`Failed to generate schema: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get available tools for function calling
  getAvailableTools() {
    return [
      {
        type: "function",
        function: {
          name: "generate_database_schema",
          description: "Generate a complete database schema based on user requirements",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Description of what the database schema should represent (e.g., 'e-commerce system', 'blog platform')"
              },
              requirements: {
                type: "array",
                items: { type: "string" },
                description: "Specific requirements or features needed"
              }
            },
            required: ["description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "modify_existing_schema",
          description: "Modify the current database schema based on user requests",
          parameters: {
            type: "object",
            properties: {
              modification_type: {
                type: "string",
                enum: ["add_table", "modify_table", "add_relationship", "remove_table"],
                description: "Type of modification to make"
              },
              description: {
                type: "string",
                description: "Description of the modification needed"
              }
            },
            required: ["modification_type", "description"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_current_schema",
          description: "Analyze the current database schema and provide insights",
          parameters: {
            type: "object",
            properties: {
              analysis_type: {
                type: "string",
                enum: ["performance", "normalization", "best_practices", "general"],
                description: "Type of analysis to perform"
              }
            },
            required: ["analysis_type"]
          }
        }
      }
    ];
  }

  // Chat with AI about the schema (with function calling)
  async chatAboutSchema(userMessage, currentSchema = null, conversationHistory = []) {
    try {
      const systemPrompt = `You are a helpful database design assistant. You can help users understand, modify, and improve their database schemas.

Current schema: ${currentSchema ? JSON.stringify(currentSchema, null, 2) : 'No schema loaded'}

You have access to these tools:
1. generate_database_schema - Create a new database schema from scratch
2. modify_existing_schema - Modify the current database schema 
3. analyze_current_schema - Analyze the current schema and provide insights

Use your natural language understanding to determine when to use each tool:
- If someone wants a new schema created, use generate_database_schema
- If someone wants the current schema changed in any way, use modify_existing_schema  
- If someone wants analysis without changes, use analyze_current_schema

Trust your judgment. If someone provides feedback, suggestions, or improvements about the current schema, they probably want you to apply those changes.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage }
      ];

      // Try with function calling first
      try {
        const response = await axios.post(`${this.baseURL}/chat/completions`, {
          model: this.defaultModel,
          messages: messages,
          tools: this.getAvailableTools(),
          tool_choice: "auto",
          temperature: 0.7,
          ...this.getReasoningConfig()
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Database Diagram Tool'
          }
        });

        const message = response.data.choices[0].message;

        // Check if AI wants to use a tool
        if (message.tool_calls && message.tool_calls.length > 0) {
          return {
            type: 'tool_call',
            tool_call: message.tool_calls[0],
            message: message.content || "I'll help you with that using the appropriate tool."
          };
        }

        return {
          type: 'message',
          content: message.content
        };
      } catch (functionCallError) {
        console.log('Function calling failed, falling back to text analysis:', functionCallError.response?.data?.error?.message);
        
        // Fallback: Use text-based intent detection
        const intentPrompt = `You are a database design assistant. Analyze this user message and determine their intent:

User message: "${userMessage}"

Current schema exists: ${currentSchema ? 'Yes' : 'No'}

Respond with ONLY ONE of these exact phrases:
- "GENERATE_SCHEMA" - if they want to create a new schema
- "MODIFY_SCHEMA" - if they want to change the existing schema  
- "ANALYZE_SCHEMA" - if they want analysis only
- "CHAT" - if it's a general question

Intent:`;

        const intentResponse = await axios.post(`${this.baseURL}/chat/completions`, {
          model: this.defaultModel,
          messages: [{ role: "user", content: intentPrompt }],
          temperature: 0.1,
          ...this.getReasoningConfig()
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Database Diagram Tool'
          }
        });

        const intent = intentResponse.data.choices[0].message.content.trim();
        
        if (intent === 'GENERATE_SCHEMA') {
          return {
            type: 'tool_call',
            tool_call: {
              function: {
                name: 'generate_database_schema',
                arguments: JSON.stringify({ description: userMessage })
              }
            },
            message: "I'll generate a schema for you."
          };
        } else if (intent === 'MODIFY_SCHEMA') {
          return {
            type: 'tool_call',
            tool_call: {
              function: {
                name: 'modify_existing_schema',
                arguments: JSON.stringify({ 
                  modification_type: 'add_table', 
                  description: userMessage 
                })
              }
            },
            message: "I'll modify the schema for you."
          };
        } else if (intent === 'ANALYZE_SCHEMA') {
          return {
            type: 'tool_call',
            tool_call: {
              function: {
                name: 'analyze_current_schema',
                arguments: JSON.stringify({ analysis_type: 'general' })
              }
            },
            message: "I'll analyze your schema."
          };
        } else {
          // Regular chat fallback
          const chatResponse = await axios.post(`${this.baseURL}/chat/completions`, {
            model: this.defaultModel,
            messages: messages,
            temperature: 0.7,
            ...this.getReasoningConfig()
          }, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'Database Diagram Tool'
            }
          });

          return {
            type: 'message',
            content: chatResponse.data.choices[0].message.content
          };
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error.response?.data || error.message);
      throw new Error(`Chat failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Analyze current schema and provide suggestions (direct API call, no tools)
  async analyzeSchema(schema) {
    try {
      const prompt = `You are a database expert. Analyze this database schema and provide human-readable suggestions for improvements.

Schema:
${JSON.stringify(schema, null, 2)}

Please provide a detailed analysis covering:

1. **Overall Assessment:** Brief summary of the schema quality
2. **Potential Issues:** Any problems or concerns you identify
3. **Missing Indexes:** Suggested indexes for better performance
4. **Normalization:** Any normalization improvements needed
5. **Performance Considerations:** Tips for better performance

Respond with plain text analysis, not as a tool call.`;

      // Make direct API call without tool options to avoid triggering function calls
      const requestBody = {
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a database design expert. Provide helpful analysis and suggestions in plain text format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        ...this.getReasoningConfig()
      };
      
      console.log('🔍 Analysis request model:', this.defaultModel);

      const response = await axios.post(`${this.baseURL}/chat/completions`, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const analysis = response.data.choices[0]?.message?.content;
      
      if (!analysis) {
        throw new Error('No analysis content received from AI');
      }
      
      return analysis;
    } catch (error) {
      console.error('Schema analysis error:', error.response?.data || error.message);
      throw new Error(`Schema analysis failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = AIService;