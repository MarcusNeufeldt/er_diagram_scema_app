import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { TableData, Column } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { ContextMenuPortal } from './ContextMenuPortal';
import { FieldRow } from './FieldRow';
import { Plus, Palette } from 'lucide-react';
import { DEFAULT_FIELD_TYPE } from '../constants/dataTypes';

interface TableNodeProps extends NodeProps {
  data: TableData;
}

const TABLE_COLORS = [
  { bg: '#ffffff', border: '#6b7280' }, // white
  { bg: '#f3f4f6', border: '#6b7280' }, // gray
  { bg: '#fef3c7', border: '#f59e0b' }, // yellow
  { bg: '#fed7d7', border: '#ef4444' }, // red
  { bg: '#c6f6d5', border: '#10b981' }, // green
  { bg: '#bee3f8', border: '#3b82f6' }, // blue
  { bg: '#e9d8fd', border: '#8b5cf6' }, // purple
  { bg: '#fed7cc', border: '#f97316' }, // orange
  { bg: '#fdf2f8', border: '#ec4899' }, // pink
];

export const TableNode: React.FC<TableNodeProps> = ({ data, selected }) => {
  const { selectNode, deleteTable, updateTable, addColumn, animatingNodeIds } = useDiagramStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(data.name);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleClick = () => {
    selectNode(data.id);
    setShowColorPicker(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDelete = () => {
    deleteTable(data.id);
  };

  const handleRename = () => {
    setIsRenaming(true);
    setContextMenu(null);
  };

  const handleAddField = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: `field_${data.columns.length + 1}`,
      type: DEFAULT_FIELD_TYPE,
      isPrimaryKey: false,
      isNullable: true,
    };
    addColumn(data.id, newColumn);
    // The field will be automatically focused for editing
  };

  const handleDuplicate = () => {
    // This will be implemented in the store
    console.log('Duplicate table:', data.id);
  };

  const handleColorChange = (colorScheme: { bg: string; border: string }) => {
    updateTable(data.id, { 
      backgroundColor: colorScheme.bg, 
      borderColor: colorScheme.border 
    });
    setShowColorPicker(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTable(data.id, { name: newName });
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(data.name);
    }
  };

  const isAnimating = animatingNodeIds.has(data.id);
  
  const tableStyle = {
    backgroundColor: data.backgroundColor || '#ffffff',
    borderColor: data.borderColor || (selected ? '#3b82f6' : '#d1d5db'),
  };

  // Calculate header and footer colors based on table background
  const getHeaderFooterStyle = (isFooter = false) => {
    const bgColor = data.backgroundColor || '#ffffff';
    // If it's a light color, darken it slightly for header/footer
    // If no custom color, use default gray
    if (bgColor === '#ffffff') {
      return { backgroundColor: isFooter ? '#f9fafb' : '#f3f4f6' };
    }
    
    // For colored backgrounds, make header/footer slightly darker
    const rgb = hexToRgb(bgColor);
    if (rgb) {
      const darkenFactor = isFooter ? 0.95 : 0.9;
      const darkerRgb = {
        r: Math.floor(rgb.r * darkenFactor),
        g: Math.floor(rgb.g * darkenFactor),
        b: Math.floor(rgb.b * darkenFactor)
      };
      return { backgroundColor: `rgb(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b})` };
    }
    
    return { backgroundColor: isFooter ? '#f9fafb' : '#f3f4f6' };
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return (
    <div>
      <div
        className={`border-2 rounded-lg shadow-lg min-w-[250px] transition-all duration-300 ${
          selected ? 'border-blue-500' : ''
        } ${
          isAnimating ? 'animate-pulse border-green-500 shadow-green-200 shadow-2xl scale-105' : ''
        }`}
        style={tableStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Table Header */}
        <div className="px-4 py-2 rounded-t-lg border-b relative" style={getHeaderFooterStyle()}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isRenaming ? (
                <form onSubmit={handleRenameSubmit}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={() => setIsRenaming(false)}
                    className="font-semibold text-gray-800 bg-white px-2 py-1 rounded border border-blue-500 outline-none"
                    autoFocus
                  />
                </form>
              ) : (
                <h3 className="font-semibold text-gray-800">{data.name}</h3>
              )}
              {data.schema && (
                <p className="text-sm text-gray-600">{data.schema}</p>
              )}
            </div>
            
            {/* Color palette button */}
            {selected && !isRenaming && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                className="p-1.5 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-colors ml-2"
                title="Change table color"
              >
                <Palette size={12} className="text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Color picker */}
          {showColorPicker && (
            <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
              <div className="grid grid-cols-3 gap-1">
                {TABLE_COLORS.map((colorScheme, index) => (
                  <button
                    key={index}
                    onClick={() => handleColorChange(colorScheme)}
                    className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                      (data.backgroundColor || '#ffffff') === colorScheme.bg ? 'border-gray-800' : 'border-gray-300'
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
        </div>

        {/* Columns */}
        {data.columns.length > 0 ? (
          <div className="p-0">
            {data.columns.map((column: Column, index: number) => (
              <FieldRow
                key={column.id}
                column={column}
                tableId={data.id}
                index={index}
                totalColumns={data.columns.length}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 text-sm text-gray-400 italic text-center">
            No fields yet
          </div>
        )}

        {/* Quick Add Field Button */}
        <div className={`px-4 py-2 ${data.columns.length > 0 ? 'border-t border-gray-200' : ''}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddField();
            }}
            className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
              data.columns.length === 0 
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Add new field"
          >
            <Plus size={16} />
            <span>Add Field</span>
          </button>
        </div>

      {/* Indexes and Foreign Keys info */}
      {(data.indexes.length > 0 || data.foreignKeys.length > 0) && (
        <div className="px-4 py-2 rounded-b-lg text-xs text-gray-600" style={getHeaderFooterStyle(true)}>
          {data.indexes.length > 0 && (
            <div>Indexes: {data.indexes.length}</div>
          )}
          {data.foreignKeys.length > 0 && (
            <div>Foreign Keys: {data.foreignKeys.length}</div>
          )}
        </div>
      )}
      </div>

      {contextMenu && (
        <ContextMenuPortal
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={handleDelete}
          onRename={handleRename}
          onAddField={handleAddField}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
};
