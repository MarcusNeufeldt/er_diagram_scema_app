import React from 'react';
import { 
  AlignLeft, 
  AlignRight, 
  AlignCenter,
  Move,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';

interface AlignmentToolbarProps {
  selectedNodes: string[];
  position: { x: number; y: number };
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({ selectedNodes, position }) => {
  const { alignSelectedNodes, distributeSelectedNodes } = useDiagramStore();

  if (selectedNodes.length < 2) return null;

  const handleAlign = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical') => {
    alignSelectedNodes(alignment);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    distributeSelectedNodes(direction);
  };

  return (
    <div 
      className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-2 flex items-center space-x-1"
      style={{ 
        left: position.x, 
        top: position.y - 50,
        transform: 'translateX(-50%)'
      }}
    >
      {/* Alignment Tools */}
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2">
        <button
          onClick={() => handleAlign('left')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => handleAlign('center-horizontal')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Align Center Horizontally"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => handleAlign('right')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-1 border-r border-gray-200 pr-2">
        <button
          onClick={() => handleAlign('top')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Align Top"
        >
          <ArrowUp size={16} />
        </button>
        <button
          onClick={() => handleAlign('center-vertical')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Align Center Vertically"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => handleAlign('bottom')}
          className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title="Align Bottom"
        >
          <ArrowDown size={16} />
        </button>
      </div>
      
      {/* Distribution Tools - only show if 3+ nodes selected */}
      {selectedNodes.length >= 3 && (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleDistribute('horizontal')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Distribute Horizontally"
          >
            <Move size={16} />
          </button>
          <button
            onClick={() => handleDistribute('vertical')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Distribute Vertically"
          >
            <Move size={16} className="rotate-90" />
          </button>
        </div>
      )}
      
      <div className="text-xs text-gray-500 ml-2 pl-2 border-l border-gray-200">
        {selectedNodes.length} selected
      </div>
    </div>
  );
};