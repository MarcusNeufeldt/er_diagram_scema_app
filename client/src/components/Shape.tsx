import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { ShapeData } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Trash2, Edit3, Palette, Square, Circle, Diamond, Type } from 'lucide-react';

interface ShapeProps extends NodeProps {
  data: ShapeData;
}

const SHAPE_COLORS = [
  { bg: '#f3f4f6', border: '#6b7280' }, // gray
  { bg: '#fef3c7', border: '#f59e0b' }, // yellow
  { bg: '#fed7d7', border: '#ef4444' }, // red
  { bg: '#c6f6d5', border: '#10b981' }, // green
  { bg: '#bee3f8', border: '#3b82f6' }, // blue
  { bg: '#e9d8fd', border: '#8b5cf6' }, // purple
  { bg: '#fed7cc', border: '#f97316' }, // orange
  { bg: '#fdf2f8', border: '#ec4899' }, // pink
];

const SHAPE_TYPES = [
  { type: 'rectangle' as const, icon: Square, name: 'Rectangle' },
  { type: 'circle' as const, icon: Circle, name: 'Circle' },
  { type: 'diamond' as const, icon: Diamond, name: 'Diamond' },
];

export const Shape: React.FC<ShapeProps> = ({ data, selected }) => {
  const { updateNode, deleteNode } = useDiagramStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [title, setTitle] = useState(data.title || '');
  const [text, setText] = useState(data.text || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditingText]);

  const handleSaveTitle = () => {
    updateNode(data.id, { title: title.trim() });
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitle(data.title || '');
    setIsEditingTitle(false);
  };

  const handleSaveText = () => {
    updateNode(data.id, { text: text.trim() });
    setIsEditingText(false);
  };

  const handleCancelText = () => {
    setText(data.text || '');
    setIsEditingText(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelTitle();
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelText();
    }
    // Enter creates new line in textarea, so no special handling needed
  };

  const handleDelete = () => {
    deleteNode(data.id);
  };

  const handleColorChange = (colorScheme: { bg: string; border: string }) => {
    updateNode(data.id, { 
      color: colorScheme.bg, 
      borderColor: colorScheme.border 
    });
    setShowColorPicker(false);
  };

  const handleShapeChange = (shapeType: 'rectangle' | 'circle' | 'diamond') => {
    updateNode(data.id, { type: shapeType });
    setShowShapePicker(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Double-click on shape starts editing text (main content)
    setIsEditingText(true);
  };


  const renderShape = () => {
    const commonClasses = `
      transition-all duration-200 cursor-move flex items-center justify-center w-full h-full
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    `;

    const style = {
      backgroundColor: data.color,
      borderColor: data.borderColor,
    };

    switch (data.type) {
      case 'circle':
        return (
          <div
            className={`${commonClasses} rounded-full border-2`}
            style={style}
            onDoubleClick={handleDoubleClick}
          >
            {renderContent()}
          </div>
        );
      
      case 'diamond':
        return (
          <div
            className={`${commonClasses} border-2 transform rotate-45`}
            style={style}
            onDoubleClick={handleDoubleClick}
          >
            <div className="transform -rotate-45">
              {renderContent()}
            </div>
          </div>
        );
      
      default: // rectangle
        return (
          <div
            className={`${commonClasses} rounded-lg border-2`}
            style={style}
            onDoubleClick={handleDoubleClick}
          >
            {renderContent()}
          </div>
        );
    }
  };

  const renderContent = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full px-2 py-1">
        {/* Title section */}
        <div className="w-full">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-center bg-transparent border-none outline-none text-gray-800 text-sm font-bold"
              placeholder="Title..."
              style={{ backgroundColor: 'transparent' }}
            />
          ) : (
            data.title && (
              <div className="text-gray-800 text-sm font-bold text-center truncate mb-1">
                {data.title}
              </div>
            )
          )}
        </div>

        {/* Text/content section */}
        <div className="w-full flex-1 flex items-center justify-center">
          {isEditingText ? (
            <textarea
              ref={textInputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleSaveText}
              onKeyDown={handleTextKeyDown}
              className="w-full h-full text-center bg-transparent border-none outline-none text-gray-800 text-sm resize-none"
              placeholder="Text..."
              style={{ backgroundColor: 'transparent', minHeight: '20px' }}
            />
          ) : (
            data.text && (
              <div className="text-gray-800 text-sm text-center px-1 overflow-hidden">
                {data.text}
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <NodeResizer 
        color="#3b82f6"
        isVisible={selected}
        minWidth={50}
        minHeight={50}
      />
      {renderShape()}

      {/* Controls - show when selected */}
      {selected && !isEditingTitle && !isEditingText && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Edit title"
          >
            <Type size={12} className="text-gray-600" />
          </button>
          
          <button
            onClick={() => setIsEditingText(true)}
            className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Edit text"
          >
            <Edit3 size={12} className="text-gray-600" />
          </button>
          
          <button
            onClick={() => setShowShapePicker(!showShapePicker)}
            className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Change shape"
          >
            {React.createElement(
              SHAPE_TYPES.find(s => s.type === data.type)?.icon || Square,
              { size: 12, className: "text-gray-600" }
            )}
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
            title="Delete shape"
          >
            <Trash2 size={12} className="text-red-600" />
          </button>
        </div>
      )}

      {/* Shape picker */}
      {showShapePicker && (
        <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
          <div className="flex flex-col space-y-1">
            {SHAPE_TYPES.map(({ type, icon: Icon, name }) => (
              <button
                key={type}
                onClick={() => handleShapeChange(type)}
                className={`flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
                  data.type === type ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color picker */}
      {showColorPicker && (
        <div className="absolute top-8 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
          <div className="grid grid-cols-4 gap-1">
            {SHAPE_COLORS.map((colorScheme, index) => (
              <button
                key={index}
                onClick={() => handleColorChange(colorScheme)}
                className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                  data.color === colorScheme.bg ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ 
                  backgroundColor: colorScheme.bg,
                  borderColor: colorScheme.border
                }}
                title={`Change color`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};