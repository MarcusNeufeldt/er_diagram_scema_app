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
      throw new Error(error.error || 'Failed to generate schema');
    }

    const data = await response.json();
    return data.schema;
  }

  async chatAboutSchema(
    message: string,
    currentSchema?: DatabaseSchema,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ type: 'message' | 'tool_call'; content?: string; tool_call?: any; message?: string }> {
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
      const error = await response.json();
      throw new Error(error.error || 'Failed to chat with AI');
    }

    const data = await response.json();
    return data.response;
  }

  async analyzeSchema(schema: DatabaseSchema): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schema,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze schema');
    }

    const data = await response.json();
    return data.analysis;
  }
}

export const aiService = new AIService();