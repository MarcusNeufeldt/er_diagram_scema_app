import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Column } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { Trash2, Edit2, Key, Hash, Type, ChevronDown } from 'lucide-react';
import { DATA_TYPES } from '../constants/dataTypes';

interface FieldRowProps {
  column: Column;
  tableId: string;
  index: number;
  totalColumns: number;
}

export const FieldRow: React.FC<FieldRowProps> = ({ 
  column, 
  tableId, 
  index,
  totalColumns 
}) => {
  const { updateColumn, removeColumn } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [editType, setEditType] = useState(column.type);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };

    if (showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeDropdown]);

  const handleSave = () => {
    updateColumn(tableId, column.id, {
      name: editName,
      type: editType,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(column.name);
    setEditType(column.type);
    setIsEditing(false);
    setShowTypeDropdown(false);
  };

  const handleDelete = () => {
    if (totalColumns > 1) {
      removeColumn(tableId, column.id);
    }
  };

  const handleTypeSelect = (type: string) => {
    setEditType(type);
    setShowTypeDropdown(false);
  };

  const togglePrimaryKey = () => {
    updateColumn(tableId, column.id, {
      isPrimaryKey: !column.isPrimaryKey,
    });
  };

  const toggleNullable = () => {
    updateColumn(tableId, column.id, {
      isNullable: !column.isNullable,
    });
  };

  if (isEditing) {
    return (
      <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-blue-50">
        <div className="flex-1 flex items-center space-x-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                onFocus={() => {
                  setShowTypeDropdown(true);
                  // Clear the input to show all options
                  setEditType('');
                }}
                placeholder="Type or select..."
                className="nodrag w-32 pr-6 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:border-blue-500"
              />
              <ChevronDown 
                size={14} 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            {showTypeDropdown && (
              <div 
                className="nodrag absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-50 max-h-48 overflow-y-auto"
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {DATA_TYPES.filter(type => 
                  type.toLowerCase().includes(editType.toLowerCase())
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="nodrag w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {type}
                  </button>
                ))}
                {DATA_TYPES.filter(type => 
                  type.toLowerCase().includes(editType.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No matches found</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-between px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center space-x-2">
        {column.isPrimaryKey && (
          <span title="Primary Key">
            <Key size={14} className="text-yellow-500" />
          </span>
        )}
        {column.isForeignKey && (
          <span title="Foreign Key">
            <Hash size={14} className="text-blue-500" />
          </span>
        )}
        <span className="font-medium text-sm">{column.name}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">{column.type}</span>
        {!column.isNullable && (
          <span className="text-red-500 text-xs" title="Not Null">*</span>
        )}
        
        {showActions && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Edit Field"
            >
              <Edit2 size={14} />
            </button>
            {totalColumns > 1 && (
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete Field"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Connection handles for each column */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${tableId}-${column.id}-source`}
        className="!w-4 !h-4 !border-2 !border-white !-right-2 hover:!w-5 hover:!h-5 transition-all"
        style={{
          background: column.isPrimaryKey ? '#eab308' : '#3b82f6',
          opacity: 1,
          zIndex: 10,
        }}
        isConnectable={true}
        onMouseEnter={() => console.log('🎯 Source handle hover:', `${tableId}-${column.id}`)}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${tableId}-${column.id}-target`}
        className="!w-4 !h-4 !border-2 !border-white !-left-2 hover:!w-5 hover:!h-5 transition-all"
        style={{
          background: column.isForeignKey ? '#3b82f6' : '#9ca3af',
          opacity: 1,
          zIndex: 10,
        }}
        isConnectable={true}
        onMouseEnter={() => console.log('🎯 Target handle hover:', `${tableId}-${column.id}`)}
      />
    </div>
  );
};