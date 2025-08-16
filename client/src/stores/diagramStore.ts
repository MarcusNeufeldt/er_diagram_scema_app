import { create } from 'zustand';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection } from 'reactflow';
import { TableData, Column, StickyNoteData, ShapeData } from '../types';
import * as Y from 'yjs';

interface PendingConnection {
  connection: Connection;
  sourceTableName: string;
  sourceColumnName: string;
  targetTableName: string;
  targetColumnName: string;
}

// History state for manual undo/redo implementation
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

// Non-undoable UI state
interface UIState {
  selectedNodeId: string | null;
  contextMenuNodeId: string | null;
  pendingConnection: PendingConnection | null;
  editingEdgeId: string | null;
  animatingNodeIds: Set<string>;
  yNodes: Y.Array<any> | null;
  yEdges: Y.Array<any> | null;
  
  // Grid settings
  snapToGrid: boolean;
  gridSize: number;
  
  // History management
  history: HistoryState[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Locking state
  isReadOnly: boolean;
  lockedBy: string | null;
  currentDiagramId: string | null;
}

interface DiagramState extends UIState {
  // Main diagram state
  nodes: Node[];
  edges: Edge[];
  
  // Undo/Redo Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  confirmConnection: (config: any) => void;
  cancelConnection: () => void;
  editConnection: (edgeId: string) => void;
  
  // Incremental AI updates
  addFieldsToTable: (tableId: string, fields: Column[]) => void;
  removeFieldsFromTable: (tableId: string, fieldIds: string[]) => void;
  modifyFieldsInTable: (tableId: string, fieldUpdates: { id: string; updates: Partial<Column> }[]) => void;
  addRelationships: (relationships: any[]) => void;
  removeRelationships: (relationshipIds: string[]) => void;
  flashTable: (tableId: string) => void;
  addTable: (position: { x: number; y: number }) => void;
  updateTable: (nodeId: string, data: Partial<TableData>) => void;
  deleteTable: (nodeId: string) => void;
  addStickyNote: (position: { x: number; y: number }) => void;
  addShape: (position: { x: number; y: number }, shapeType: 'rectangle' | 'circle' | 'diamond') => void;
  updateNode: (nodeId: string, data: Partial<StickyNoteData | ShapeData | TableData>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setContextMenuNode: (nodeId: string | null) => void;
  addColumn: (nodeId: string, column: Column) => void;
  updateColumn: (nodeId: string, columnId: string, updates: Partial<Column>) => void;
  removeColumn: (nodeId: string, columnId: string) => void;
  importDiagram: (diagramData: { nodes: Node[]; edges?: Edge[] }) => void;
  initializeYjs: (doc: Y.Doc) => void;
  syncFromYjs: () => void;
  autoLayout: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  
  // Locking actions
  setReadOnly: (isReadOnly: boolean, lockedBy?: string | null) => void;
  setCurrentDiagramId: (diagramId: string | null) => void;
}

// Utility function to snap position to grid
const snapToGridPosition = (position: { x: number; y: number }, gridSize: number, snapEnabled: boolean) => {
  if (!snapEnabled) return position;
  
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

// Centralized history-aware state setter - the ONLY way to modify nodes/edges
const createSetStateWithHistory = (get: any, set: any) => {
  return (newState: Partial<DiagramState>, actionName: string) => {
    const { history, historyIndex, maxHistorySize } = get();
    
    // Apply the new state first
    set(newState);

    // Get the *full* state after the update
    const { nodes, edges } = get();

    const currentState: HistoryState = { 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    };

    // Truncate history if we've undone actions
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    } else {
      // Move to the new state
      set({ historyIndex: historyIndex + 1 });
    }
    
    console.log(`History saved for: ${actionName} (total states: ${newHistory.length})`);
    
    set({ 
      history: newHistory
    });
  };
};

export const useDiagramStore = create<DiagramState>((set, get) => {
  // Create the centralized history-aware setter
  const setStateWithHistory = createSetStateWithHistory(get, set);
  
  return {
  // Main diagram state
  nodes: [],
  edges: [],
  
  // UI state
  selectedNodeId: null,
  contextMenuNodeId: null,
  pendingConnection: null,
  editingEdgeId: null,
  animatingNodeIds: new Set(),
  yNodes: null,
  yEdges: null,
  
  // Grid settings
  snapToGrid: true,
  gridSize: 25,
  
  // History state - start with initial empty state
  history: [{ nodes: [], edges: [] }],
  historyIndex: 0,
  maxHistorySize: 50,
  
  // Locking state
  isReadOnly: false,
  lockedBy: null,
  currentDiagramId: null,
  
  // Undo/Redo methods
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1];
      set({
        nodes: JSON.parse(JSON.stringify(previousState.nodes)),
        edges: JSON.parse(JSON.stringify(previousState.edges)),
        historyIndex: state.historyIndex - 1
      });
    }
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      set({
        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
        edges: JSON.parse(JSON.stringify(nextState.edges)),
        historyIndex: state.historyIndex + 1
      });
    }
  },
  
  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },
  
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },
  
  clearHistory: () => {
    set({ history: [], historyIndex: -1 });
  },

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    
    // Only save to history for position changes when dragging ends
    const hasPositionChange = changes.some(c => c.type === 'position' && !c.dragging);
    
    if (hasPositionChange) {
      setStateWithHistory({ nodes: newNodes }, 'Move Table');
    } else {
      // For selection changes and during dragging, don't save to history
      set({ nodes: newNodes });
    }
    
    // Sync position changes to Yjs
    const { yNodes } = get();
    if (yNodes && hasPositionChange) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
  },

  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    
    // Only save to history for edge removal, not selection changes
    const hasRemoval = changes.some(c => c.type === 'remove');
    
    if (hasRemoval) {
      setStateWithHistory({ edges: newEdges }, 'Remove Connection');
    } else {
      set({ edges: newEdges });
    }
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return;
    }

    // Parse the handle IDs to get table and column information
    // Handle format: "table-1755327095951-col-1755327095951-source"
    const sourceInfo = connection.sourceHandle.split('-');
    const targetInfo = connection.targetHandle.split('-');
    
    // Handle format: table-{timestamp}-col-{timestamp}-source/target
    // So we need: table-{timestamp} for tableId and col-{timestamp} for columnId
    const sourceTableId = `${sourceInfo[0]}-${sourceInfo[1]}`;  // "table-1755327095951"
    const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;  // "col-1755327095951"
    const targetTableId = `${targetInfo[0]}-${targetInfo[1]}`;   // "table-1755327095322"
    const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;  // "col-1755327095322"

    // Find table and column names
    const nodes = get().nodes;
    const sourceNode = nodes.find(n => n.id === sourceTableId);
    const targetNode = nodes.find(n => n.id === targetTableId);
    
    if (!sourceNode || !targetNode) return;
    
    const sourceColumn = sourceNode.data.columns.find((col: Column) => col.id === sourceColumnId);
    const targetColumn = targetNode.data.columns.find((col: Column) => col.id === targetColumnId);
    
    if (!sourceColumn || !targetColumn) return;

    // Set pending connection to show modal
    set({
      pendingConnection: {
        connection,
        sourceTableName: sourceNode.data.name,
        sourceColumnName: sourceColumn.name,
        targetTableName: targetNode.data.name,
        targetColumnName: targetColumn.name,
      }
    });
  },

  confirmConnection: (config) => {
    const { pendingConnection, editingEdgeId } = get();
    if (!pendingConnection) return;

    const { connection } = pendingConnection;
    const sourceInfo = connection.sourceHandle!.split('-');
    const targetInfo = connection.targetHandle!.split('-');
    
    // Handle format: "table-1755327095951-col-1755327095951-source"
    const sourceTableId = `${sourceInfo[0]}-${sourceInfo[1]}`;  // "table-1755327095951"
    const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;  // "col-1755327095951"
    const targetTableId = `${targetInfo[0]}-${targetInfo[1]}`;   // "table-1755327095322"
    const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;  // "col-1755327095322"

    let newEdges;
    
    if (editingEdgeId) {
      // Editing existing edge
      newEdges = get().edges.map(edge => 
        edge.id === editingEdgeId
          ? {
              ...edge,
              data: {
                ...edge.data,
                cardinality: config.type,
                label: config.name || 'references',
                onDelete: config.onDeleteAction,
                onUpdate: config.onUpdateAction,
              },
            }
          : edge
      );
    } else {
      // Creating new edge
      const newEdge = {
        id: `edge-${Date.now()}`,
        type: 'foreign-key',
        data: { 
          cardinality: config.type,
          label: config.name || 'references',
          onDelete: config.onDeleteAction,
          onUpdate: config.onUpdateAction,
        },
      };
      
      // Update edges
      newEdges = addEdge({ ...connection, ...newEdge }, get().edges);
      console.log('Manual edge created:', newEdges[newEdges.length - 1]);
    }
    
    // Mark the target column as a foreign key
    const nodes = get().nodes.map((node) => {
      if (node.id === targetTableId) {
        return {
          ...node,
          data: {
            ...node.data,
            columns: node.data.columns.map((col: Column) =>
              col.id === targetColumnId
                ? {
                    ...col,
                    isForeignKey: true,
                    references: {
                      table: sourceTableId,
                      column: sourceColumnId,
                    },
                  }
                : col
            ),
          },
        };
      }
      return node;
    });

    setStateWithHistory({ 
      edges: newEdges, 
      nodes, 
      pendingConnection: null, 
      editingEdgeId: null 
    }, editingEdgeId ? 'Edit Connection' : 'Add Connection');
    
    // Sync to Yjs if available
    const { yNodes, yEdges } = get();
    if (yNodes && yEdges) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(nodes);
      yEdges.delete(0, yEdges.length);
      yEdges.push(newEdges);
    }
  },

  cancelConnection: () => {
    set({ pendingConnection: null, editingEdgeId: null });
  },

  editConnection: (edgeId: string) => {
    const { edges, nodes } = get();
    const edge = edges.find(e => e.id === edgeId);
    if (!edge || !edge.source || !edge.target || !edge.sourceHandle || !edge.targetHandle) return;

    // Parse handles to get table and column info
    const sourceInfo = edge.sourceHandle.split('-');
    const targetInfo = edge.targetHandle.split('-');
    
    const sourceTableId = `${sourceInfo[0]}-${sourceInfo[1]}`;
    const sourceColumnId = `${sourceInfo[2]}-${sourceInfo[3]}`;
    const targetTableId = `${targetInfo[0]}-${targetInfo[1]}`;
    const targetColumnId = `${targetInfo[2]}-${targetInfo[3]}`;

    // Find table and column names
    const sourceNode = nodes.find(n => n.id === sourceTableId);
    const targetNode = nodes.find(n => n.id === targetTableId);
    
    if (!sourceNode || !targetNode) return;
    
    const sourceColumn = sourceNode.data.columns.find((col: Column) => col.id === sourceColumnId);
    const targetColumn = targetNode.data.columns.find((col: Column) => col.id === targetColumnId);
    
    if (!sourceColumn || !targetColumn) return;

    // Set pending connection for editing
    set({
      pendingConnection: {
        connection: {
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        },
        sourceTableName: sourceNode.data.name,
        sourceColumnName: sourceColumn.name,
        targetTableName: targetNode.data.name,
        targetColumnName: targetColumn.name,
      },
      editingEdgeId: edgeId,
    });
  },

  addTable: (position) => {
    const { snapToGrid, gridSize } = get();
    const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
    
    const newTable: TableData = {
      id: `table-${Date.now()}`,
      name: 'New Table',
      columns: [
        {
          id: `col-${Date.now()}`,
          name: 'id',
          type: 'BIGINT',
          isPrimaryKey: true,
          isNullable: false,
          defaultValue: 'AUTO_INCREMENT',
        },
      ],
      indexes: [],
      foreignKeys: [],
    };

    const newNode: Node = {
      id: newTable.id,
      type: 'table',
      position: snappedPosition,
      data: newTable,
      zIndex: 100, // Tables should be on top
    };

    const { yNodes } = get();
    if (yNodes) {
      // Sync with Yjs
      yNodes.push([newNode]);
    } else {
      // Fallback to local state if not connected
      setStateWithHistory({
        nodes: [...get().nodes, newNode],
        selectedNodeId: newTable.id
      }, 'Add Table');
    }
    
    if (!yNodes) {
      // Only set selectedNodeId if we didn't already do it above
      set({ selectedNodeId: newTable.id });
    }
  },

  updateTable: (nodeId, updates) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    );
    
    setStateWithHistory({ nodes: newNodes }, 'Update Table');
    
    // Sync to Yjs if available
    const { yNodes } = get();
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
  },

  deleteTable: (nodeId) => {
    // Always update local state
    const newNodes = get().nodes.filter((node) => node.id !== nodeId);
    const newEdges = get().edges.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    );
    
    const selectedNodeId = get().selectedNodeId === nodeId ? null : get().selectedNodeId;
    
    setStateWithHistory({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId
    }, 'Delete Table');
    
    // Sync to Yjs if available
    const { yNodes, yEdges } = get();
    if (yNodes && yEdges) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
      yEdges.delete(0, yEdges.length);
      yEdges.push(newEdges);
    }
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  setContextMenuNode: (nodeId) => {
    set({ contextMenuNodeId: nodeId });
  },

  addColumn: (nodeId, column) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              columns: [...node.data.columns, column],
            },
          }
        : node
    );
    
    setStateWithHistory({ nodes: newNodes }, 'Add Column');
    
    // Sync to Yjs if available
    const { yNodes } = get();
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
  },

  updateColumn: (nodeId, columnId, updates) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              columns: node.data.columns.map((col: Column) =>
                col.id === columnId ? { ...col, ...updates } : col
              ),
            },
          }
        : node
    );
    
    setStateWithHistory({ nodes: newNodes }, 'Update Column');
    
    // Sync to Yjs if available
    const { yNodes } = get();
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
  },

  removeColumn: (nodeId, columnId) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              columns: node.data.columns.filter((col: Column) => col.id !== columnId),
            },
          }
        : node
    );
    
    setStateWithHistory({ nodes: newNodes }, 'Remove Column');
    
    // Sync to Yjs if available
    const { yNodes } = get();
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
  },

  importDiagram: (diagramData) => {
    const newNodes = diagramData.nodes || [];
    const newEdges = diagramData.edges || [];
    
    // Set the state directly, WITHOUT saving to history
    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: null,
      contextMenuNodeId: null,
      pendingConnection: null,
    });

    // Now, reset the history with this as the initial state
    const initialHistoryState = {
      nodes: JSON.parse(JSON.stringify(newNodes)),
      edges: JSON.parse(JSON.stringify(newEdges)),
    };
    set({ history: [initialHistoryState], historyIndex: 0 });
    
    // Sync to Yjs if available
    const { yNodes, yEdges } = get();
    if (yNodes && yEdges) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
      yEdges.delete(0, yEdges.length);
      yEdges.push(newEdges);
    }
  },

  initializeYjs: (doc: Y.Doc) => {
    const yNodes = doc.getArray('nodes');
    const yEdges = doc.getArray('edges');

    // Set up observers for Yjs changes
    yNodes.observe(() => {
      get().syncFromYjs();
    });

    yEdges.observe(() => {
      get().syncFromYjs();
    });

    set({ yNodes, yEdges });
    
    // Initial sync
    get().syncFromYjs();
  },

  syncFromYjs: () => {
    const { yNodes, yEdges } = get();
    if (!yNodes || !yEdges) return;

    const nodes = yNodes.toArray();
    const edges = yEdges.toArray();

    set({ nodes, edges });
  },

  // Incremental AI update functions
  addFieldsToTable: (tableId: string, fields: Column[]) => {
    const { nodes, yNodes } = get();
    
    const newNodes = nodes.map((node) => {
      if (node.id === tableId) {
        return {
          ...node,
          data: {
            ...node.data,
            columns: [...node.data.columns, ...fields],
          },
        };
      }
      return node;
    });

    setStateWithHistory({ nodes: newNodes }, 'AI: Add Fields');
    
    // Sync to Yjs if available
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
    
    // Trigger flash animation
    get().flashTable(tableId);
  },

  removeFieldsFromTable: (tableId: string, fieldIds: string[]) => {
    const { nodes, yNodes } = get();
    
    const newNodes = nodes.map((node) => {
      if (node.id === tableId) {
        return {
          ...node,
          data: {
            ...node.data,
            columns: node.data.columns.filter((col: Column) => !fieldIds.includes(col.id)),
          },
        };
      }
      return node;
    });

    setStateWithHistory({ nodes: newNodes }, 'AI: Remove Fields');
    
    // Sync to Yjs if available
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
    
    // Trigger flash animation
    get().flashTable(tableId);
  },

  modifyFieldsInTable: (tableId: string, fieldUpdates: { id: string; updates: Partial<Column> }[]) => {
    const { nodes, yNodes } = get();
    
    const newNodes = nodes.map((node) => {
      if (node.id === tableId) {
        return {
          ...node,
          data: {
            ...node.data,
            columns: node.data.columns.map((col: Column) => {
              const update = fieldUpdates.find(u => u.id === col.id);
              return update ? { ...col, ...update.updates } : col;
            }),
          },
        };
      }
      return node;
    });

    setStateWithHistory({ nodes: newNodes }, 'AI: Modify Fields');
    
    // Sync to Yjs if available
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
    
    // Trigger flash animation
    get().flashTable(tableId);
  },

  addRelationships: (relationships: any[]) => {
    const { edges, nodes, yEdges, yNodes } = get();
    
    // Create table name to ID mapping
    const tableNameToId = new Map(nodes.map(n => [n.data.name, n.id]));
    
    let currentEdges = edges;
    
    relationships.forEach((rel, index) => {
      const sourceTableId = tableNameToId.get(rel.sourceTable);
      const targetTableId = tableNameToId.get(rel.targetTable);
      
      if (!sourceTableId || !targetTableId) {
        console.warn(`Could not find table IDs for relationship: ${rel.sourceTable} -> ${rel.targetTable}`);
        return;
      }

      // Find source and target columns
      const sourceTable = nodes.find(n => n.id === sourceTableId);
      const targetTable = nodes.find(n => n.id === targetTableId);
      
      const sourceColumn = sourceTable?.data.columns.find((col: any) => col.name === rel.sourceColumn);
      const targetColumn = targetTable?.data.columns.find((col: any) => col.name === rel.targetColumn);
      
      console.log('🔍 Looking for columns:', {
        rel,
        sourceTable: sourceTable?.data.name,
        targetTable: targetTable?.data.name,
        sourceColumns: sourceTable?.data.columns.map((c: any) => c.name),
        targetColumns: targetTable?.data.columns.map((c: any) => c.name),
        foundSource: sourceColumn,
        foundTarget: targetColumn
      });
      
      if (!sourceColumn || !targetColumn) {
        console.warn(`Could not find columns for relationship: ${rel.sourceColumn} -> ${rel.targetColumn}`);
        return;
      }

      // Mark target column as foreign key
      const updatedNodes = nodes.map(node => {
        if (node.id === targetTableId) {
          return {
            ...node,
            data: {
              ...node.data,
              columns: node.data.columns.map((col: any) => 
                col.id === targetColumn.id 
                  ? { ...col, isForeignKey: true, references: { table: sourceTableId, column: sourceColumn.id } }
                  : col
              )
            }
          };
        }
        return node;
      });
      
      set({ nodes: updatedNodes });

      // Create connection object like manual connections
      const connection = {
        source: sourceTableId,
        target: targetTableId,
        sourceHandle: `${sourceTableId}-${sourceColumn.id}-source`,
        targetHandle: `${targetTableId}-${targetColumn.id}-target`,
      };

      const newEdge = {
        id: `edge-${Date.now()}-${index}`,
        type: 'foreign-key',
        data: {
          cardinality: rel.type,
          label: rel.name || `fk_${rel.targetTable}_${rel.targetColumn}`,
          onDelete: rel.onDelete || 'CASCADE',
          onUpdate: rel.onUpdate || 'CASCADE',
        },
      };

      console.log('🔗 Creating AI edge with handles:', {
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        sourceTableId,
        targetTableId,
        sourceColumnId: sourceColumn.id,
        targetColumnId: targetColumn.id
      });
      
      // Use ReactFlow's addEdge like manual connections do
      currentEdges = addEdge({ ...connection, ...newEdge }, currentEdges);
      console.log('AI edge created:', currentEdges[currentEdges.length - 1]);
    });

    setStateWithHistory({ edges: currentEdges, nodes: get().nodes }, 'AI: Add Relationships');
    
    // Sync to Yjs if available
    if (yEdges && yNodes) {
      yEdges.delete(0, yEdges.length);
      yEdges.push(currentEdges);
      yNodes.delete(0, yNodes.length);
      yNodes.push(get().nodes);
    }
    
    // Flash related tables
    relationships.forEach(rel => {
      const sourceTableId = tableNameToId.get(rel.sourceTable);
      const targetTableId = tableNameToId.get(rel.targetTable);
      if (sourceTableId) get().flashTable(sourceTableId);
      if (targetTableId) get().flashTable(targetTableId);
    });
  },

  removeRelationships: (relationshipIds: string[]) => {
    const { edges, yEdges } = get();
    
    const newEdges = edges.filter(edge => !relationshipIds.includes(edge.id));
    setStateWithHistory({ edges: newEdges }, 'AI: Remove Relationships');
    
    // Sync to Yjs if available
    if (yEdges) {
      yEdges.delete(0, yEdges.length);
      yEdges.push(newEdges);
    }
  },

  flashTable: (tableId: string) => {
    const { animatingNodeIds } = get();
    const newAnimatingIds = new Set(animatingNodeIds);
    newAnimatingIds.add(tableId);
    set({ animatingNodeIds: newAnimatingIds });
    
    // Remove animation after 1 second
    setTimeout(() => {
      const currentAnimatingIds = get().animatingNodeIds;
      const updatedAnimatingIds = new Set(currentAnimatingIds);
      updatedAnimatingIds.delete(tableId);
      set({ animatingNodeIds: updatedAnimatingIds });
    }, 1000);
  },

  autoLayout: () => {
    const { nodes, edges, yNodes } = get();
    
    if (nodes.length === 0) return;
    
    // Build dependency graph (who depends on whom)
    // If table A has a foreign key to table B, then A depends on B
    const dependencies = new Map<string, Set<string>>(); // tableId -> set of tables it depends on
    const dependents = new Map<string, Set<string>>();   // tableId -> set of tables that depend on it
    
    nodes.forEach(node => {
      dependencies.set(node.id, new Set());
      dependents.set(node.id, new Set());
    });
    
    // Analyze foreign key relationships to build dependency graph
    edges.forEach(edge => {
      if (edge.source && edge.target && edge.type === 'foreign-key') {
        // User wants: nodes with outputs on LEFT, nodes with inputs on RIGHT
        // In ReactFlow: posts -> users means posts has output TO users
        // So: users (receives input) should be RIGHT, posts (has output) should be LEFT
        // This means: users depends on posts (reverse of typical FK dependency)
        dependencies.get(edge.target)?.add(edge.source);
        dependents.get(edge.source)?.add(edge.target);
      }
    });
    
    // Perform topological sorting to determine hierarchy levels
    const levels: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();
    
    // Calculate in-degrees (number of dependencies)
    nodes.forEach(node => {
      inDegree.set(node.id, dependencies.get(node.id)?.size || 0);
    });
    
    // Find tables with no dependencies for the first level
    while (visited.size < nodes.length) {
      const currentLevel: string[] = [];
      
      // Find all tables with in-degree 0 (no unresolved dependencies)
      nodes.forEach(node => {
        if (!visited.has(node.id) && (inDegree.get(node.id) || 0) === 0) {
          currentLevel.push(node.id);
        }
      });
      
      // If no tables found, we have a circular dependency - break it by taking the table with minimum dependencies
      if (currentLevel.length === 0) {
        let minDependencies = Infinity;
        let selectedTable = '';
        
        nodes.forEach(node => {
          if (!visited.has(node.id)) {
            const deps = inDegree.get(node.id) || 0;
            if (deps < minDependencies) {
              minDependencies = deps;
              selectedTable = node.id;
            }
          }
        });
        
        if (selectedTable) {
          currentLevel.push(selectedTable);
        }
      }
      
      // Add current level to levels array
      levels.push(currentLevel);
      
      // Mark current level as visited and reduce in-degree for their dependents
      currentLevel.forEach(tableId => {
        visited.add(tableId);
        
        const tableDependents = dependents.get(tableId);
        tableDependents?.forEach(dependentId => {
          const currentInDegree = inDegree.get(dependentId) || 0;
          inDegree.set(dependentId, Math.max(0, currentInDegree - 1));
        });
      });
    }
    
    // Layout configuration with grid snapping support
    const { snapToGrid, gridSize } = get();
    const COLUMN_WIDTH = snapToGrid ? Math.ceil(350 / gridSize) * gridSize : 350;
    const ROW_HEIGHT = snapToGrid ? Math.ceil(180 / gridSize) * gridSize : 180;
    const START_X = snapToGrid ? Math.ceil(100 / gridSize) * gridSize : 100;
    const START_Y = snapToGrid ? Math.ceil(100 / gridSize) * gridSize : 100;
    
    const newNodes = [...nodes];
    
    // Position tables level by level (left to right)
    levels.forEach((level, levelIndex) => {
      const columnX = START_X + (levelIndex * COLUMN_WIDTH);
      
      // Sort tables in each level alphabetically for consistent positioning
      const sortedLevel = level.sort((a, b) => {
        const nodeA = nodes.find(n => n.id === a);
        const nodeB = nodes.find(n => n.id === b);
        return (nodeA?.data.name || '').localeCompare(nodeB?.data.name || '');
      });
      
      sortedLevel.forEach((tableId, tableIndex) => {
        const nodeIndex = newNodes.findIndex(n => n.id === tableId);
        if (nodeIndex !== -1) {
          // Center tables vertically if there are fewer tables than available space
          const totalTables = sortedLevel.length;
          const startY = START_Y + (totalTables > 1 ? 0 : ROW_HEIGHT / 2);
          const tableY = startY + (tableIndex * ROW_HEIGHT);
          
          const finalPosition = snapToGridPosition({ x: columnX, y: tableY }, gridSize, snapToGrid);
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            position: finalPosition
          };
        }
      });
    });
    
    // Apply the new positions with history tracking
    setStateWithHistory({ nodes: newNodes }, 'Auto Layout');
    
    // Sync to Yjs if available
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
    
    // Flash all tables to indicate layout change
    nodes.forEach(node => {
      setTimeout(() => get().flashTable(node.id), Math.random() * 300);
    });
  },
  
  toggleGrid: () => {
    set({ snapToGrid: !get().snapToGrid });
  },
  
  setGridSize: (size: number) => {
    set({ gridSize: size });
  },
  
  setReadOnly: (isReadOnly: boolean, lockedBy?: string | null) => {
    set({ isReadOnly, lockedBy: lockedBy || null });
  },
  
  setCurrentDiagramId: (diagramId: string | null) => {
    set({ currentDiagramId: diagramId });
  },
  
  addStickyNote: (position) => {
    const { snapToGrid, gridSize } = get();
    const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
    
    const stickyNoteData: StickyNoteData = {
      id: `sticky-${Date.now()}`,
      content: '',
      color: '#fef3c7', // Default yellow
      author: 'User', // TODO: Get from user context
      timestamp: new Date(),
      width: 200,
      height: 150,
    };

    const newNode: Node = {
      id: stickyNoteData.id,
      type: 'sticky-note',
      position: snappedPosition,
      data: stickyNoteData,
      style: {
        width: 200,
        height: 150,
      },
      zIndex: 50, // Sticky notes in middle layer
    };

    setStateWithHistory({
      nodes: [...get().nodes, newNode],
      selectedNodeId: stickyNoteData.id
    }, 'Add Sticky Note');
  },
  
  addShape: (position, shapeType) => {
    const { snapToGrid, gridSize } = get();
    const snappedPosition = snapToGridPosition(position, gridSize, snapToGrid);
    
    const shapeData: ShapeData = {
      id: `shape-${Date.now()}`,
      type: shapeType,
      title: '',
      color: '#f3f4f6',
      borderColor: '#6b7280',
      width: shapeType === 'circle' ? 200 : 250,
      height: shapeType === 'circle' ? 200 : 180,
    };

    const newNode: Node = {
      id: shapeData.id,
      type: 'shape',
      position: snappedPosition,
      data: shapeData,
      style: {
        width: shapeData.width,
        height: shapeData.height,
      },
      zIndex: 1, // Shapes should be in background
    };

    setStateWithHistory({
      nodes: [...get().nodes, newNode],
      selectedNodeId: shapeData.id
    }, `Add ${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`);
  },
  
  updateNode: (nodeId, updates) => {
    const newNodes = get().nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    );
    
    setStateWithHistory({ nodes: newNodes }, 'Update Node');
    
    // Sync to Yjs if available
    const { yNodes } = get();
    if (yNodes) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
    }
  },
  
  deleteNode: (nodeId) => {
    const newNodes = get().nodes.filter((node) => node.id !== nodeId);
    const newEdges = get().edges.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    );
    
    const selectedNodeId = get().selectedNodeId === nodeId ? null : get().selectedNodeId;
    
    setStateWithHistory({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId
    }, 'Delete Node');
    
    // Sync to Yjs if available
    const { yNodes, yEdges } = get();
    if (yNodes && yEdges) {
      yNodes.delete(0, yNodes.length);
      yNodes.push(newNodes);
      yEdges.delete(0, yEdges.length);
      yEdges.push(newEdges);
    }
  }
  };
});
