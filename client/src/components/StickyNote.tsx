import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { StickyNoteData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Trash2, Edit3, Palette } from 'lucide-react';

interface StickyNoteProps extends NodeProps {
  data: StickyNoteData;
}

const STICKY_COLORS = [
  '#fef3c7', // yellow
  '#fed7d7', // red
  '#c6f6d5', // green
  '#bee3f8', // blue
  '#e9d8fd', // purple
  '#fed7cc', // orange
  '#f0fff4', // mint
  '#fdf2f8', // pink
];

export const StickyNote: React.FC<StickyNoteProps> = ({ data, selected }) => {
  const { updateNode, deleteNode } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    updateNode(data.id, { content: content.trim() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(data.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDelete = () => {
    deleteNode(data.id);
  };

  const handleColorChange = (color: string) => {
    updateNode(data.id, { color });
    setShowColorPicker(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };


  return (
    <>
      <NodeResizer 
        color="#3b82f6"
        isVisible={selected}
        minWidth={150}
        minHeight={100}
      />
      <div
        className={`
          sticky-note p-4 shadow-lg rounded-lg border-2 
          transition-all duration-200 cursor-move w-full h-full
          ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        `}
        style={{ 
          backgroundColor: data.color,
          borderColor: selected ? '#3b82f6' : '#d1d5db',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-800 text-sm leading-relaxed font-medium"
            placeholder="Type your note here..."
            style={{ backgroundColor: 'transparent' }}
          />
        ) : (
          <div className="text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
            {data.content || 'Double-click to edit...'}
          </div>
        )}

        {/* Sticky note corner fold effect */}
        <div 
          className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-b-[20px] border-l-transparent"
          style={{ 
            borderBottomColor: data.color === '#fef3c7' ? '#f59e0b' : 
                               data.color === '#fed7d7' ? '#ef4444' :
                               data.color === '#c6f6d5' ? '#10b981' :
                               data.color === '#bee3f8' ? '#3b82f6' :
                               data.color === '#e9d8fd' ? '#8b5cf6' :
                               data.color === '#fed7cc' ? '#f97316' :
                               data.color === '#f0fff4' ? '#059669' :
                               '#ec4899'
          }}
        />
      </div>

      {/* Controls - show when selected */}
      {selected && !isEditing && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Edit note"
          >
            <Edit3 size={12} className="text-gray-600" />
          </button>
          
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Change color"
          >
            <Palette size={12} className="text-gray-600" />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-red-50 transition-colors"
            title="Delete note"
          >
            <Trash2 size={12} className="text-red-600" />
          </button>
        </div>
      )}

      {/* Color picker */}
      {showColorPicker && (
        <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
          <div className="grid grid-cols-4 gap-1">
            {STICKY_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                  data.color === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={`Change to ${color}`}
              />
            ))}
          </div>
        </div>
      )}


      {/* Author and timestamp (if available) */}
      {data.author && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          {data.author} {data.timestamp && `• ${new Date(data.timestamp).toLocaleDateString()}`}
        </div>
      )}
    </>
  );
};