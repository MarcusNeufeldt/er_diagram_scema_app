const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
}

export interface Table {
  name: string;
  description?: string;
  columns: Column[];
  indexes?: Index[];
}

export interface Column {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface Relationship {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: '1:1' | '1:N' | 'N:N';
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  name?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class AIService {
  async generateSchema(prompt: string, existingSchema?: DatabaseSchema): Promise<DatabaseSchema> {
    console.log('🔄 generateSchema called with prompt:', prompt);
    console.log('🔄 Existing schema provided:', !!existingSchema);
    
    const response = await fetch(`${API_BASE_URL}/generate-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        existingSchema,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Generate schema failed:', error);
      throw new Error(error.error || 'Failed to generate schema');
    }

    const data = await response.json();
    console.log('📦 Generate schema response:', data);
    
    if (!data.schema) {
      console.error('❌ No schema in response, full data:', data);
      throw new Error('No schema returned from API');
    }
    
    return data.schema;
  }

  async chatAboutSchema(
    message: string,
    currentSchema?: DatabaseSchema,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ type: 'message' | 'tool_call'; content?: string; tool_call?: any; message?: string; schema?: DatabaseSchema }> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentSchema,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Failed to chat with AI');
        } catch (e) {
            throw new Error(`Failed to chat with AI: ${errorText}`);
        }
    }

    const data = await response.json();
    console.log('🌐 Raw API response:', data);
    console.log('🌐 Response has schema?', !!data.schema);
    console.log('🌐 Response has content?', !!data.content);
    
    // Backend returns either:
    // 1. { content: "message" } for simple messages
    // 2. { schema: {...}, content: "message" } for schema modifications
    // 3. { response: { type: "tool_call", ... } } for tool calls (not currently used)
    
    // If there's a schema in the response, include it
    if (data.schema) {
      console.log('🌐 Returning response with schema');
      return {
        type: 'message',
        content: data.content,
        schema: data.schema
      };
    }
    
    // Otherwise return as a simple message
    console.log('🌐 Returning simple message response');
    return {
      type: 'message',
      content: data.content || data.message || 'I understand your request.'
    };
  }

  async analyzeSchema(schema: DatabaseSchema): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/analyze-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ schema }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze schema');
    }

    const data = await response.json();
    return data.content;
  }
}

export const aiService = new AIService();