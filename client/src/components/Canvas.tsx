import React, { useCallback, useEffect, useState } from 'react';
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
import { CanvasSearch } from './CanvasSearch';
import { AlignmentToolbar } from './AlignmentToolbar';

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
    setSelectedNodes,
    setContextMenuNode,
    editConnection,
    snapToGrid,
    gridSize,
    isReadOnly,
    closeAllDropdowns,
    selectedNodeIds,
    isSearchOpen,
    setSearchOpen,
    searchResults,
    currentSearchIndex,
  } = useDiagramStore();

  const { project, setCenter, getNode } = useReactFlow();
  const [alignmentToolbarPosition, setAlignmentToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Sort nodes by z-index to ensure proper layering
  const sortedNodes = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const aZ = a.zIndex || 0;
      const bZ = b.zIndex || 0;
      return aZ - bZ;
    });
  }, [nodes]);
  
  // Enhanced nodes with search highlighting
  const enhancedNodes = React.useMemo(() => {
    return sortedNodes.map(node => {
      const isSearchResult = searchResults.includes(node.id);
      const isCurrentSearchResult = searchResults[currentSearchIndex] === node.id;
      
      return {
        ...node,
        style: {
          ...node.style,
          opacity: searchResults.length > 0 && !isSearchResult ? 0.3 : 1,
          boxShadow: isCurrentSearchResult ? '0 0 0 3px #3b82f6' : isSearchResult ? '0 0 0 2px #93c5fd' : undefined,
        }
      };
    });
  }, [sortedNodes, searchResults, currentSearchIndex]);
  
  // Center view on search result
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults.length > 0) {
      const nodeId = searchResults[currentSearchIndex];
      const node = getNode(nodeId);
      if (node) {
        setCenter(
          node.position.x + (node.style?.width as number || 300) / 2,
          node.position.y + (node.style?.height as number || 200) / 2,
          { zoom: 1, duration: 500 }
        );
      }
    }
  }, [currentSearchIndex, searchResults, getNode, setCenter]);
  
  // Update alignment toolbar position when selection changes
  useEffect(() => {
    if (selectedNodeIds.length >= 2) {
      const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
      if (selectedNodes.length >= 2) {
        // Calculate center position of selected nodes
        const centerX = selectedNodes.reduce((sum, node) => 
          sum + node.position.x + ((node.style?.width as number || 300) / 2), 0) / selectedNodes.length;
        const centerY = selectedNodes.reduce((sum, node) => 
          sum + node.position.y + ((node.style?.height as number || 200) / 2), 0) / selectedNodes.length;
        
        setAlignmentToolbarPosition({ x: centerX, y: centerY });
      }
    } else {
      setAlignmentToolbarPosition(null);
    }
  }, [selectedNodeIds, nodes]);
  
  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl+F or Cmd+F to open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);
  
  // Validate connections - allow all for now
  const isValidConnection = useCallback((connection: any) => {
    return true; // Allow all connections for now
  }, []);

  // Handle canvas click to deselect nodes, close context menu, and close dropdowns
  const handlePaneClick = useCallback(() => {
    selectNode(null);
    setContextMenuNode(null);
    closeAllDropdowns();
  }, [selectNode, setContextMenuNode, closeAllDropdowns]);
  
  // Handle selection changes from ReactFlow
  const handleSelectionChange = useCallback((params: any) => {
    const selectedNodes = params.nodes || [];
    const nodeIds = selectedNodes.map((node: any) => node.id);
    setSelectedNodes(nodeIds);
  }, [setSelectedNodes]);

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
    <div className="flex-1 h-full relative">
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        onDoubleClick={isReadOnly ? undefined : handlePaneDoubleClick}
        onEdgeDoubleClick={isReadOnly ? undefined : handleEdgeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        attributionPosition="bottom-left"
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        multiSelectionKeyCode="Control"
        selectionOnDrag={true}
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
      
      {/* Search Component */}
      {isSearchOpen && (
        <CanvasSearch onClose={() => setSearchOpen(false)} />
      )}
      
      {/* Alignment Toolbar */}
      {alignmentToolbarPosition && (
        <AlignmentToolbar 
          selectedNodes={selectedNodeIds}
          position={alignmentToolbarPosition}
        />
      )}
    </div>
  );
};
