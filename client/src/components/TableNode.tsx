import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import { TableData, Column } from '../types';
import { useDiagramStore } from '../stores/diagramStore';
import { ContextMenuPortal } from './ContextMenuPortal';
import { FieldRow } from './FieldRow';

interface TableNodeProps extends NodeProps {
  data: TableData;
}

export const TableNode: React.FC<TableNodeProps> = ({ data, selected }) => {
  const { selectNode, deleteTable, updateTable, addColumn, animatingNodeIds } = useDiagramStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(data.name);

  const handleClick = () => {
    selectNode(data.id);
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
      name: 'new_field',
      type: 'VARCHAR(255)',
      isPrimaryKey: false,
      isNullable: true,
    };
    addColumn(data.id, newColumn);
  };

  const handleDuplicate = () => {
    // This will be implemented in the store
    console.log('Duplicate table:', data.id);
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

  return (
    <>
      <div
        className={`bg-white border-2 rounded-lg shadow-lg min-w-[250px] transition-all duration-300 ${
          selected ? 'border-blue-500' : 'border-gray-300'
        } ${
          isAnimating ? 'animate-pulse border-green-500 shadow-green-200 shadow-2xl scale-105' : ''
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Table Header */}
        <div className="bg-gray-100 px-4 py-2 rounded-t-lg border-b">
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

        {/* Columns */}
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

      {/* Indexes and Foreign Keys info */}
      {(data.indexes.length > 0 || data.foreignKeys.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 rounded-b-lg text-xs text-gray-600">
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
    </>
  );
};
