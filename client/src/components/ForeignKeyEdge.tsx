import React from 'react';
import {
  EdgeProps,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from 'reactflow';
import { useDiagramStore } from '../stores/diagramStore';

export const ForeignKeyEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const { editConnection } = useDiagramStore();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  const cardinality = data?.cardinality || '1:N';
  
  // Parse cardinality to get source and target sides
  const getCardinalityLabels = (cardinality: string) => {
    switch (cardinality) {
      case '1:1':
        return { source: '1', target: '1' };
      case '1:N':
        return { source: '1', target: 'N' };
      case 'N:N':
        return { source: 'N', target: 'N' };
      default:
        return { source: '1', target: 'N' };
    }
  };

  const { source: sourceLabel, target: targetLabel } = getCardinalityLabels(cardinality);

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    editConnection(id);
  };

  return (
    <>
      {/* Custom clickable path with wider invisible area for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth="12"
        style={{ cursor: 'pointer' }}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        style={{ ...style, pointerEvents: 'none' }}
        markerEnd={markerEnd}
      />
      {/* Source cardinality */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + 20}px,${sourceY}px)`,
            fontSize: 12,
            fontWeight: 'bold',
            background: 'white',
            padding: '2px 4px',
            borderRadius: 3,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          {sourceLabel}
        </div>
      </EdgeLabelRenderer>
      
      {/* Target cardinality */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX - 20}px,${targetY}px)`,
            fontSize: 12,
            fontWeight: 'bold',
            background: 'white',
            padding: '2px 4px',
            borderRadius: 3,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          {targetLabel}
        </div>
      </EdgeLabelRenderer>

      {/* Crow's foot notation at target */}
      <svg 
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <marker
            id={`crowsfoot-${id}`}
            markerWidth="20"
            markerHeight="20"
            refX="0"
            refY="10"
            orient="auto-start-reverse"
          >
            <path
              d="M 0,10 L 10,5 M 0,10 L 10,10 M 0,10 L 10,15"
              stroke="#3b82f6"
              strokeWidth="1.5"
              fill="none"
            />
          </marker>
        </defs>
        <path
          d={edgePath}
          markerEnd={`url(#crowsfoot-${id})`}
          style={{
            stroke: 'transparent',
            fill: 'none',
          }}
        />
      </svg>

      {/* Optional: Relationship label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              background: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};