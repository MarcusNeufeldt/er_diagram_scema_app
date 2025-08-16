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
      content: 'Hi! I\'m your AI database design assistant. I can help you create schemas, analyze your current design, or answer questions about database design. What would you like to work on?',
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
    addFieldsToTable, 
    removeFieldsFromTable, 
    modifyFieldsInTable,
    addRelationships,
    removeRelationships,
    deleteTable 
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

    const relationships = edges.map(edge => ({
      sourceTable: edge.source || '',
      sourceColumn: 'id', // Simplified - would need to parse from handle
      targetTable: edge.target || '',
      targetColumn: 'id', // Simplified - would need to parse from handle
      type: edge.data?.cardinality || '1:N',
      onDelete: edge.data?.onDelete || 'CASCADE',
      onUpdate: edge.data?.onUpdate || 'CASCADE',
      name: edge.data?.label,
    }));

    return { tables, relationships };
  };

  // Smart diff and incremental update system
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

    // Create table name mappings
    const currentTables = new Map(currentSchema.tables.map((t: any) => [t.name, t]));
    const newTables = new Map(newSchema.tables.map((t: any) => [t.name, t]));
    const currentNodeMap = new Map(nodes.map((n: any) => [n.data.name, n]));

    // Detect changes
    const tablesToAdd: any[] = [];
    const tablesToRemove: string[] = [];
    const relationshipsToAdd: any[] = [];
    const relationshipsToRemove: string[] = [];

    // Find new tables
    newSchema.tables.forEach((table: any) => {
      if (!currentTables.has(table.name)) {
        tablesToAdd.push(table);
      }
    });

    // Find removed tables
    currentSchema.tables.forEach((table: any) => {
      if (!newTables.has(table.name)) {
        tablesToRemove.push(table.name);
      }
    });

    // Find modified tables
    newSchema.tables.forEach((newTable: any) => {
      const tableName = newTable.name;
      const currentTable = currentTables.get(tableName);
      if (currentTable && currentNodeMap.has(tableName)) {
        const nodeId = currentNodeMap.get(tableName)!.id;
        
        // Compare columns
        const currentColumns = new Map(currentTable.columns.map((c: any) => [c.name, c]));
        const newColumns = new Map(newTable.columns.map((c: any) => [c.name, c]));
        
        const fieldsToAdd: any[] = [];
        const fieldsToRemove: string[] = [];
        const fieldsToModify: any[] = [];

        // Find new fields
        newTable.columns.forEach((col: any) => {
          if (!currentColumns.has(col.name)) {
            fieldsToAdd.push({
              id: `col-${Date.now()}-${Math.random()}`,
              name: col.name,
              type: col.type,
              isPrimaryKey: col.isPrimaryKey,
              isNullable: col.isNullable,
              defaultValue: col.defaultValue,
              isForeignKey: false,
              references: undefined,
            });
          }
        });

        // Find removed fields
        currentTable.columns.forEach((col: any) => {
          if (!newColumns.has(col.name)) {
            const currentNode = currentNodeMap.get(tableName)!;
            const columnInNode = currentNode.data.columns.find((c: any) => c.name === col.name);
            if (columnInNode) {
              fieldsToRemove.push(columnInNode.id);
            }
          }
        });

        // Find modified fields
        newTable.columns.forEach((newCol: any) => {
          const colName = newCol.name;
          const currentCol: any = currentColumns.get(colName);
          if (currentCol && (
            currentCol.type !== newCol.type ||
            currentCol.isPrimaryKey !== newCol.isPrimaryKey ||
            currentCol.isNullable !== newCol.isNullable ||
            currentCol.defaultValue !== newCol.defaultValue
          )) {
            const currentNode = currentNodeMap.get(tableName)!;
            const columnInNode = currentNode.data.columns.find((c: any) => c.name === colName);
            if (columnInNode) {
              fieldsToModify.push({
                id: columnInNode.id,
                updates: {
                  type: newCol.type,
                  isPrimaryKey: newCol.isPrimaryKey,
                  isNullable: newCol.isNullable,
                  defaultValue: newCol.defaultValue,
                }
              });
            }
          }
        });

        // Apply incremental changes
        if (fieldsToAdd.length > 0) {
          setTimeout(() => addFieldsToTable(nodeId, fieldsToAdd), 100);
        }
        if (fieldsToRemove.length > 0) {
          setTimeout(() => removeFieldsFromTable(nodeId, fieldsToRemove), 200);
        }
        if (fieldsToModify.length > 0) {
          setTimeout(() => modifyFieldsInTable(nodeId, fieldsToModify), 300);
        }
      }
    });

    // Detect relationship changes
    const currentRelationships = new Map(
      currentSchema.relationships.map((rel: any) => 
        [`${rel.sourceTable}-${rel.sourceColumn}-${rel.targetTable}-${rel.targetColumn}`, rel]
      )
    );

    // Find new relationships
    newSchema.relationships.forEach((rel: any) => {
      const relationshipKey = `${rel.sourceTable}-${rel.sourceColumn}-${rel.targetTable}-${rel.targetColumn}`;
      if (!currentRelationships.has(relationshipKey)) {
        relationshipsToAdd.push(rel);
      }
    });

    // Find removed relationships
    currentSchema.relationships.forEach((rel: any) => {
      const relationshipKey = `${rel.sourceTable}-${rel.sourceColumn}-${rel.targetTable}-${rel.targetColumn}`;
      const newHasRelationship = newSchema.relationships.some((newRel: any) => 
        `${newRel.sourceTable}-${newRel.sourceColumn}-${newRel.targetTable}-${newRel.targetColumn}` === relationshipKey
      );
      if (!newHasRelationship) {
        // Find the actual edge ID to remove
        const edgeToRemove = edges.find(edge => {
          if (!edge.source || !edge.target || !edge.sourceHandle || !edge.targetHandle) return false;
          
          // Parse source and target table names from nodes
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return false;
          
          // Parse column info from handles
          const sourceInfo = edge.sourceHandle.split('-');
          const targetInfo = edge.targetHandle.split('-');
          const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;
          const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;
          
          const sourceColumn = sourceNode.data.columns.find((col: any) => col.id === sourceColumnId);
          const targetColumn = targetNode.data.columns.find((col: any) => col.id === targetColumnId);
          
          return sourceNode.data.name === rel.sourceTable &&
                 targetNode.data.name === rel.targetTable &&
                 sourceColumn?.name === rel.sourceColumn &&
                 targetColumn?.name === rel.targetColumn;
        });
        
        if (edgeToRemove) {
          relationshipsToRemove.push(edgeToRemove.id);
        }
      }
    });

    // Apply relationship changes with delay for visual effect
    if (relationshipsToRemove.length > 0) {
      setTimeout(() => {
        removeRelationships(relationshipsToRemove);
      }, 100); // Remove first
    }
    
    if (relationshipsToAdd.length > 0) {
      console.log('🔗 Scheduling relationship additions:', relationshipsToAdd);
      setTimeout(() => {
        console.log('🔗 Executing addRelationships');
        addRelationships(relationshipsToAdd);
      }, 400); // Add before table additions (which happen at 500ms)
    } else {
      console.log('❌ No relationships to add');
    }

    // Handle table additions with delay for visual effect
    tablesToAdd.forEach((table, index) => {
      setTimeout(() => {
        const timestamp = Date.now() + index;
        const tableId = `table-${timestamp}`;
        const position = { 
          x: 100 + (nodes.length % 3) * 300, 
          y: 100 + Math.floor(nodes.length / 3) * 200 
        };
        
        const newNode = {
          id: tableId,
          type: 'table',
          position,
          data: {
            id: tableId,
            name: table.name,
            columns: table.columns.map((col: any, colIndex: number) => ({
              id: `col-${timestamp}-${colIndex}`,
              name: col.name,
              type: col.type,
              isPrimaryKey: col.isPrimaryKey,
              isNullable: col.isNullable,
              defaultValue: col.defaultValue,
              isForeignKey: false,
              references: undefined,
            })),
            indexes: table.indexes || [],
            foreignKeys: [],
          },
        };

        // Use the existing addTable method but with custom data
        importDiagram({ nodes: [...nodes, newNode], edges });
      }, (index + 1) * 500);
    });

    // Handle table removals
    tablesToRemove.forEach((tableName, index) => {
      setTimeout(() => {
        const nodeToRemove = currentNodeMap.get(tableName);
        if (nodeToRemove) {
          deleteTable(nodeToRemove.id);
        }
      }, (index + 1) * 300);
    });
  };

  // Convert DatabaseSchema to diagram format (fallback for full replacement)
  const applySchemaToCanvas = (schema: DatabaseSchema) => {
    console.log('📋 applySchemaToCanvas called with schema:', schema);
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

    // Apply nodes first, then edges after a delay to ensure handles are rendered
    console.log('📋 Final newEdges being applied:', newEdges);
    console.log('📋 Edge count:', newEdges.length);
    
    // Apply nodes first
    importDiagram({ nodes: newNodes, edges: [] });
    
    // Apply edges after a short delay to ensure Handle components are rendered
    if (newEdges && newEdges.length > 0) {
      console.log('📋 Scheduling edge application...');
      setTimeout(() => {
        console.log('📋 Applying edges after delay:', newEdges);
        const currentState = useDiagramStore.getState();
        console.log('📋 Current nodes:', currentState.nodes.length);
        importDiagram({ nodes: currentState.nodes, edges: newEdges });
      }, 500); // Increased delay to 500ms
    } else {
      console.log('📋 No edges to apply');
    }
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
      const response = await aiService.chatAboutSchema(
        currentInput,
        currentSchema,
        messages
      );

      // Check if AI wants to use a tool
      if (response.type === 'tool_call') {
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