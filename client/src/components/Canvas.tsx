import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  ConnectionLineType,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useDiagramStore } from '../stores/diagramStore';
import { TableNode } from './TableNode';
import { StickyNote } from './StickyNote';
import { Shape } from './Shape';
import { ForeignKeyEdge } from './ForeignKeyEdge';

const nodeTypes: NodeTypes = {
  table: TableNode,
  'sticky-note': StickyNote,
  shape: Shape,
};

const edgeTypes: EdgeTypes = {
  'foreign-key': ForeignKeyEdge,
};

export const Canvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addTable,
    selectNode,
    setContextMenuNode,
    editConnection,
    snapToGrid,
    gridSize,
  } = useDiagramStore();

  const { project } = useReactFlow();
  
  // Sort nodes by z-index to ensure proper layering
  const sortedNodes = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const aZ = a.zIndex || 0;
      const bZ = b.zIndex || 0;
      return aZ - bZ;
    });
  }, [nodes]);
  
  // Validate connections - allow all for now
  const isValidConnection = useCallback((connection: any) => {
    return true; // Allow all connections for now
  }, []);

  // Handle canvas click to deselect nodes and close context menu
  const handlePaneClick = useCallback(() => {
    selectNode(null);
    setContextMenuNode(null);
  }, [selectNode, setContextMenuNode]);

  // Handle double-click to add new table (only on empty canvas)
  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // Check if the target is actually the pane (not a node or edge)
      const target = event.target as HTMLElement;
      
      // Only create a new table if double-clicking on the background/pane
      // Check for ReactFlow pane or background elements
      if (target.classList.contains('react-flow__pane') || 
          target.classList.contains('react-flow__background') ||
          target.tagName === 'svg') {
        const position = project({
          x: event.clientX - 250, // Offset for sidebar
          y: event.clientY - 60,  // Offset for toolbar
        });
        addTable(position);
      }
    },
    [project, addTable]
  );

  // Handle double-click on edge to edit connection
  const handleEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.stopPropagation();
      editConnection(edge.id);
    },
    [editConnection]
  );

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={sortedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={handlePaneClick}
        onDoubleClick={handlePaneDoubleClick}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        attributionPosition="bottom-left"
      >
        <Background 
          variant={snapToGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={snapToGrid ? gridSize : 20}
          size={snapToGrid ? 2 : 1}
          color={snapToGrid ? '#d1d5db' : '#f3f4f6'}
        />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'table') return '#1a192b';
            return '#eee';
          }}
          nodeColor={(n) => {
            if (n.type === 'table') return '#fff';
            return '#fff';
          }}
          style={{
            backgroundColor: '#f7fafc',
          }}
        />
      </ReactFlow>
    </div>
  );
};
