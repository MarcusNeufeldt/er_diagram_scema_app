import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { aiService, ChatMessage, DatabaseSchema } from '../services/aiService';
import { useDiagramStore } from '../stores/diagramStore';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m Data Modeler AI, your intelligent assistant for this visual database diagramming tool. I can help you create schemas, modify tables and relationships on the canvas, and analyze your designs. I understand the visual connections between your tables and will help maintain them as we work together. What would you like to build today?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    nodes, 
    edges, 
    importDiagram,
    flashTable
  } = useDiagramStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Convert current diagram to DatabaseSchema format
  const getCurrentSchema = (): DatabaseSchema | undefined => {
    if (nodes.length === 0) return undefined;

    const tables = nodes.map(node => ({
      name: node.data.name,
      columns: node.data.columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        isPrimaryKey: col.isPrimaryKey || false,
        isNullable: col.isNullable !== false,
        defaultValue: col.defaultValue,
      })),
    }));

    const relationships = edges.map(edge => {
      // Parse actual column names from edge handles
      let sourceColumn = 'id';
      let targetColumn = 'id';
      
      if (edge.sourceHandle && edge.targetHandle) {
        // Handle format: {tableId}-{columnId}-source/target
        const sourceInfo = edge.sourceHandle.split('-');
        const targetInfo = edge.targetHandle.split('-');
        
        if (sourceInfo.length >= 3 && targetInfo.length >= 3) {
          const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;
          const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;
          
          // Find actual column names from nodes
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (sourceNode && targetNode) {
            const sourceCol = sourceNode.data.columns.find((col: any) => col.id === sourceColumnId);
            const targetCol = targetNode.data.columns.find((col: any) => col.id === targetColumnId);
            
            if (sourceCol) sourceColumn = sourceCol.name;
            if (targetCol) targetColumn = targetCol.name;
          }
        }
      }
      
      // Get table names from nodes instead of edge IDs
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      return {
        sourceTable: sourceNode?.data.name || '',
        sourceColumn: sourceColumn,
        targetTable: targetNode?.data.name || '',
        targetColumn: targetColumn,
        type: edge.data?.cardinality || '1:N',
        onDelete: edge.data?.onDelete || 'CASCADE',
        onUpdate: edge.data?.onUpdate || 'CASCADE',
        name: edge.data?.label,
      };
    });

    return { tables, relationships };
  };

  // Atomic schema update system - replaces setTimeout chains with single state update
  const applySchemaChanges = (newSchema: DatabaseSchema, isModification: boolean = false) => {
    console.log('🔄 applySchemaChanges called:', { 
      isModification, 
      nodeCount: nodes.length, 
      newSchema,
      relationships: newSchema.relationships 
    });
    
    if (!isModification || nodes.length === 0) {
      // If it's a new schema or no existing nodes, do full replacement
      console.log('📋 Using full schema replacement');
      applySchemaToCanvas(newSchema);
      return;
    }

    // Get current schema state
    const currentSchema = getCurrentSchema();
    if (!currentSchema) {
      applySchemaToCanvas(newSchema);
      return;
    }

    console.log('🔄 Performing atomic incremental update');
    console.log('Current schema relationships:', currentSchema.relationships.length);
    console.log('New schema relationships:', newSchema.relationships.length);
    
    // Compute final state atomically
    const finalState = computeFinalSchemaState(currentSchema, newSchema);
    
    console.log('Final state:', {
      nodes: finalState.nodes.length,
      edges: finalState.edges.length,
      affectedTables: finalState.affectedTableIds.length
    });
    
    // Apply all changes in a single atomic update
    importDiagram({ nodes: finalState.nodes, edges: finalState.edges });
    
    // Trigger visual feedback for all affected tables
    finalState.affectedTableIds.forEach(id => {
      // Use the existing flashTable function from the store
      flashTable(id);
    });
  };

  // Helper function to compute final state atomically
  const computeFinalSchemaState = (currentSchema: DatabaseSchema, newSchema: DatabaseSchema) => {
    const currentTables = new Map(currentSchema.tables.map((t: any) => [t.name, t]));
    const currentNodeMap = new Map(nodes.map((n: any) => [n.data.name, n]));
    
    const affectedTableIds: string[] = [];
    const finalNodes: any[] = [];
    const tableNameToId = new Map<string, string>();
    
    // Process all tables: existing, modified, and new
    newSchema.tables.forEach((newTable: any) => {
      const currentTable = currentTables.get(newTable.name);
      const existingNode = currentNodeMap.get(newTable.name);
      
      if (existingNode && currentTable) {
        // Table exists - modify it while preserving existing column IDs
        const modifiedNode = { ...existingNode };
        const existingColumns = new Map(existingNode.data.columns.map((col: any) => [col.name, col]));
        
        modifiedNode.data = {
          ...modifiedNode.data,
          columns: newTable.columns.map((col: any, colIndex: number) => {
            const existingCol = existingColumns.get(col.name);
            if (existingCol) {
              // Preserve existing column ID and references
              return {
                ...existingCol,
                type: col.type,
                isPrimaryKey: col.isPrimaryKey,
                isNullable: col.isNullable,
                defaultValue: col.defaultValue,
                // Keep existing isForeignKey and references
              };
            } else {
              // New column
              return {
                id: `col-${Date.now()}-${Math.random()}`,
                name: col.name,
                type: col.type,
                isPrimaryKey: col.isPrimaryKey,
                isNullable: col.isNullable,
                defaultValue: col.defaultValue,
                isForeignKey: false,
                references: undefined,
              };
            }
          }),
        };
        
        finalNodes.push(modifiedNode);
        tableNameToId.set(newTable.name, modifiedNode.id);
        affectedTableIds.push(modifiedNode.id);
      } else {
        // New table - create it
        const timestamp = Date.now();
        const tableId = `table-${timestamp}-${finalNodes.length}`;
        const newNode = {
          id: tableId,
          type: 'table',
          position: { 
            x: 100 + (finalNodes.length % 3) * 300, 
            y: 100 + Math.floor(finalNodes.length / 3) * 200 
          },
          data: {
            id: tableId,
            name: newTable.name,
            columns: newTable.columns.map((col: any, colIndex: number) => ({
              id: `col-${timestamp}-${colIndex}`,
              name: col.name,
              type: col.type,
              isPrimaryKey: col.isPrimaryKey,
              isNullable: col.isNullable,
              defaultValue: col.defaultValue,
              isForeignKey: false,
              references: undefined,
            })),
            indexes: newTable.indexes || [],
            foreignKeys: [],
          },
        };
        
        finalNodes.push(newNode);
        tableNameToId.set(newTable.name, tableId);
        affectedTableIds.push(tableId);
      }
    });
    
    // Create edges - preserve existing ones and add new ones
    const currentRelationshipKeys = new Set(
      currentSchema.relationships.map((rel: any) => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    const newRelationshipKeys = new Set(
      newSchema.relationships.map((rel: any) => 
        `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`
      )
    );
    
    // Start with existing edges for preserved relationships
    const finalEdges: any[] = [];
    
    // Filter existing edges - keep only those that should be preserved
    edges.forEach(edge => {
      if (!edge.sourceHandle || !edge.targetHandle) {
        console.warn('Edge missing handles:', edge.id);
        return;
      }
      
      // Parse edge to get relationship key
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        console.warn('Edge references missing nodes:', edge.id);
        return;
      }
      
      // Check if both tables still exist in new schema
      const sourceTableExists = newSchema.tables.some(t => t.name === sourceNode.data.name);
      const targetTableExists = newSchema.tables.some(t => t.name === targetNode.data.name);
      
      if (!sourceTableExists || !targetTableExists) {
        console.log(`Removing edge ${edge.id} - table deleted`);
        return;
      }
      
      const sourceInfo = edge.sourceHandle.split('-');
      const targetInfo = edge.targetHandle.split('-');
      
      if (sourceInfo.length < 4 || targetInfo.length < 4) {
        console.warn('Edge handle format invalid:', edge.id);
        return;
      }
      
      const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;
      const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;
      
      const sourceCol = sourceNode.data.columns.find((col: any) => col.id === sourceColumnId);
      const targetCol = targetNode.data.columns.find((col: any) => col.id === targetColumnId);
      
      if (!sourceCol || !targetCol) {
        console.warn('Edge references missing columns:', edge.id);
        return;
      }
      
      const relationshipKey = `${sourceNode.data.name}.${sourceCol.name}->${targetNode.data.name}.${targetCol.name}`;
      
      if (newRelationshipKeys.has(relationshipKey)) {
        console.log(`Preserving edge: ${relationshipKey}`);
        finalEdges.push(edge);
      } else {
        console.log(`Removing edge: ${relationshipKey} (not in new schema)`);
      }
    });
    
    // Add new relationships
    newSchema.relationships.forEach((rel: any, index: number) => {
      const relationshipKey = `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`;
      
      // Skip if this relationship already exists
      if (currentRelationshipKeys.has(relationshipKey)) {
        return;
      }
      
      const sourceTableId = tableNameToId.get(rel.sourceTable);
      const targetTableId = tableNameToId.get(rel.targetTable);
      
      if (!sourceTableId || !targetTableId) {
        console.warn(`Could not find table IDs for relationship: ${rel.sourceTable} -> ${rel.targetTable}`);
        return;
      }

      // Find source and target columns
      const sourceTable = finalNodes.find(n => n.id === sourceTableId);
      const targetTable = finalNodes.find(n => n.id === targetTableId);
      
      const sourceColumn = sourceTable?.data.columns.find((col: any) => col.name === rel.sourceColumn);
      const targetColumn = targetTable?.data.columns.find((col: any) => col.name === rel.targetColumn);
      
      if (!sourceColumn || !targetColumn) {
        console.warn(`Could not find columns for relationship: ${rel.sourceColumn} -> ${rel.targetColumn}`);
        return;
      }

      // Mark target column as foreign key
      targetColumn.isForeignKey = true;
      targetColumn.references = {
        table: sourceTableId,
        column: sourceColumn.id,
      };

      const newEdge = {
        id: `edge-${Date.now()}-${index}`,
        type: 'foreign-key',
        source: sourceTableId,
        target: targetTableId,
        sourceHandle: `${sourceTableId}-${sourceColumn.id}-source`,
        targetHandle: `${targetTableId}-${targetColumn.id}-target`,
        data: {
          cardinality: rel.type,
          label: rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`,
          onDelete: rel.onDelete || 'CASCADE',
          onUpdate: rel.onUpdate || 'CASCADE',
        },
      };
      
      finalEdges.push(newEdge);
    });
    
    return { nodes: finalNodes, edges: finalEdges, affectedTableIds };
  };

  // Convert DatabaseSchema to diagram format (atomic full replacement)
  const applySchemaToCanvas = (schema: DatabaseSchema) => {
    console.log('📋 applySchemaToCanvas called with schema:', schema);
    
    if (!schema) {
      console.error('❌ applySchemaToCanvas called with undefined schema!');
      return;
    }
    
    if (!schema.tables) {
      console.error('❌ Schema has no tables property!', schema);
      return;
    }
    
    console.log('📋 Schema has relationships:', schema.relationships);
    
    const timestamp = Date.now();
    
    // Create a mapping of table names to node IDs
    const tableNameToId = new Map<string, string>();
    
    const newNodes = schema.tables.map((table, index) => {
      const tableId = `table-${timestamp}-${index}`;
      tableNameToId.set(table.name, tableId);
      
      return {
        id: tableId,
        type: 'table',
        position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
        data: {
          id: tableId,
          name: table.name,
          columns: table.columns.map((col, colIndex) => ({
            id: `col-${timestamp}-${index}-${colIndex}`,
            name: col.name,
            type: col.type,
            isPrimaryKey: col.isPrimaryKey,
            isNullable: col.isNullable,
            defaultValue: col.defaultValue,
            isForeignKey: false, // Will be updated based on relationships
            references: undefined as any, // Will be set for foreign keys
          })),
          indexes: table.indexes || [],
          foreignKeys: [],
        },
      };
    });

    // Create edges from relationships
    console.log('📋 Creating edges from relationships:', schema.relationships);
    const newEdges = schema.relationships.map((rel, index) => {
      const sourceTableId = tableNameToId.get(rel.sourceTable);
      const targetTableId = tableNameToId.get(rel.targetTable);
      
      if (!sourceTableId || !targetTableId) {
        console.warn(`Could not find table IDs for relationship: ${rel.sourceTable} -> ${rel.targetTable}`);
        return null;
      }

      // Find source and target columns
      const sourceTable = newNodes.find(n => n.id === sourceTableId);
      const targetTable = newNodes.find(n => n.id === targetTableId);
      
      const sourceColumn = sourceTable?.data.columns.find((col: any) => col.name === rel.sourceColumn);
      const targetColumn = targetTable?.data.columns.find((col: any) => col.name === rel.targetColumn);
      
      console.log('📋 Column search in applySchemaToCanvas:', {
        relationship: rel,
        sourceTable: sourceTable?.data.name,
        targetTable: targetTable?.data.name,
        sourceColumns: sourceTable?.data.columns.map((c: any) => ({ name: c.name, id: c.id })),
        targetColumns: targetTable?.data.columns.map((c: any) => ({ name: c.name, id: c.id })),
        foundSourceColumn: sourceColumn,
        foundTargetColumn: targetColumn
      });
      
      if (!sourceColumn || !targetColumn) {
        console.warn(`Could not find columns for relationship: ${rel.sourceColumn} -> ${rel.targetColumn}`);
        return null;
      }

      // Mark target column as foreign key
      targetColumn.isForeignKey = true;
      targetColumn.references = {
        table: sourceTableId,
        column: sourceColumn.id,
      };

      const edgeResult = {
        id: `edge-${timestamp}-${index}`,
        type: 'foreign-key',
        source: sourceTableId,
        target: targetTableId,
        sourceHandle: `${sourceTableId}-${sourceColumn.id}-source`,
        targetHandle: `${targetTableId}-${targetColumn.id}-target`,
        data: {
          cardinality: rel.type,
          label: rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`,
          onDelete: rel.onDelete || 'CASCADE',
          onUpdate: rel.onUpdate || 'CASCADE',
        },
      };
      
      console.log('📋 Created edge with handles:', {
        sourceHandle: edgeResult.sourceHandle,
        targetHandle: edgeResult.targetHandle,
        sourceColumnId: sourceColumn.id,
        targetColumnId: targetColumn.id
      });
      
      return edgeResult;
    }).filter((edge): edge is NonNullable<typeof edge> => edge !== null);

    // Apply both nodes and edges atomically in a single update
    console.log('📋 Final newEdges being applied:', newEdges);
    console.log('📋 Edge count:', newEdges.length);
    console.log('📋 Applying atomic update with nodes and edges together');
    
    importDiagram({ nodes: newNodes, edges: newEdges });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const currentSchema = getCurrentSchema();
      console.log('🎯 Sending message to AI:', currentInput);
      console.log('📊 Current schema:', currentSchema);
      
      const response = await aiService.chatAboutSchema(
        currentInput,
        currentSchema,
        messages
      );
      
      console.log('📦 Response from aiService:', response);
      console.log('📦 Response type:', response.type);
      console.log('📦 Response has schema?', !!response.schema);

      // Check if AI wants to use a tool
      if (response.type === 'tool_call') {
        console.log('🔧 Tool call detected:', response.tool_call);
        const toolCall = response.tool_call;
        
        // Show AI's message first
        if (response.message) {
          const aiMessage: ChatMessage = {
            role: 'assistant',
            content: response.message,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }

        // Execute the tool
        await executeTool(toolCall);
      } else {
        console.log('📝 Regular message response');
        
        // Check if response includes a schema modification
        if (response.schema) {
          console.log('🎨 Schema modification detected!');
          console.log('🎨 Modified schema:', response.schema);
          
          // Apply the modified schema to the diagram
          const currentSchema = getCurrentSchema();
          console.log('🎨 Applying schema changes, isModification:', !!currentSchema);
          applySchemaChanges(response.schema, !!currentSchema);
          
          // Add a tool usage indicator to the chat
          const toolMessage: ChatMessage = {
            role: 'assistant',
            content: '🔧 Using tool: modify_existing_schema',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, toolMessage]);
        }

        // Regular chat response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.content || 'I understand, but I\'m not sure how to respond to that.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeTool = async (toolCall: any) => {
    const { function: func } = toolCall;
    const args = JSON.parse(func.arguments);

    try {
      switch (func.name) {
        case 'generate_database_schema':
          setIsGenerating(true);
          const currentSchema = getCurrentSchema();
          const schema = await aiService.generateSchema(args.description, currentSchema);
          applySchemaChanges(schema, !!currentSchema);
          
          const successMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ I've generated and applied a new schema to your canvas with ${schema.tables.length} tables and ${schema.relationships.length} relationships. The schema includes: ${schema.tables.map(t => t.name).join(', ')}.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, successMessage]);
          setIsGenerating(false);
          break;

        case 'modify_existing_schema':
          setIsGenerating(true);
          const existingSchema = getCurrentSchema();
          const modifiedSchema = await aiService.generateSchema(
            `${args.modification_type}: ${args.description}`, 
            existingSchema
          );
          applySchemaChanges(modifiedSchema, true);
          
          const modifyMessage: ChatMessage = {
            role: 'assistant',
            content: `✅ I've modified your schema. Changes: ${args.description}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, modifyMessage]);
          setIsGenerating(false);
          break;

        case 'analyze_current_schema':
          const schemaToAnalyze = getCurrentSchema();
          if (!schemaToAnalyze) {
            const errorMessage: ChatMessage = {
              role: 'assistant',
              content: 'No schema to analyze. Please create some tables first.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
          }

          const analysis = await aiService.analyzeSchema(schemaToAnalyze);
          const analysisMessage: ChatMessage = {
            role: 'assistant',
            content: `📊 **Schema Analysis (${args.analysis_type}):**\n\n${analysis}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, analysisMessage]);
          break;

        default:
          const unknownMessage: ChatMessage = {
            role: 'assistant',
            content: `Unknown tool: ${func.name}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, unknownMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to execute ${func.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
    }
  };

  const handleGenerateSchema = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const currentSchema = getCurrentSchema();
      const schema = await aiService.generateSchema(prompt, currentSchema);
      
      // Apply the generated schema to the canvas
      applySchemaToCanvas(schema);

      const successMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ I've generated and applied a new schema to your canvas with ${schema.tables.length} tables and ${schema.relationships.length} relationships. The schema includes: ${schema.tables.map(t => t.name).join(', ')}.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to generate schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeSchema = async () => {
    const currentSchema = getCurrentSchema();
    if (!currentSchema) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'No schema to analyze. Please create some tables first.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await aiService.analyzeSchema(currentSchema);
      
      const analysisMessage: ChatMessage = {
        role: 'assistant',
        content: `📊 **Schema Analysis:**\n\n${analysis}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Failed to analyze schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      label: 'Generate Blog Schema',
      action: () => handleGenerateSchema('Create a blog system with users, posts, comments, and categories'),
    },
    {
      label: 'Generate E-commerce Schema',
      action: () => handleGenerateSchema('Create an e-commerce system with products, orders, customers, and inventory'),
    },
    {
      label: 'Analyze Current Schema',
      action: handleAnalyzeSchema,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={24} />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              disabled={isLoading || isGenerating}
              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="bg-blue-100 rounded-full p-2">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="bg-gray-100 rounded-full p-2">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <RefreshCw size={16} className="text-blue-600 animate-spin" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Thinking...</div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 rounded-full p-2">
              <Sparkles size={16} className="text-purple-600 animate-pulse" />
            </div>
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Generating schema...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me about database design, generate schemas, or get suggestions..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};