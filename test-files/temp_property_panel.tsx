import React, { useState } from 'react';
import { X, Plus, Trash2, Database, Key } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';
import { Column, TableData, Index } from '../types';
import { DATA_TYPES, DEFAULT_FIELD_TYPE } from '../constants/dataTypes';

export const PropertyPanel: React.FC = () => {
  const { 
    nodes, 
    selectedNodeId, 
    updateTable, 
    selectNode, 
    addColumn, 
    updateColumn, 
    removeColumn,
    addIndex,
    updateIndex,
    removeIndex,
    setCompositePrimaryKey
  } = useDiagramStore();
  
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState(DEFAULT_FIELD_TYPE);
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'primary-key'>('columns');

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode || !selectedNodeId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-center">Select an element to edit properties</p>
      </div>
    );
  }

  if (selectedNode.type !== 'table') {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedNode.type === 'sticky-note' ? 'Sticky Note' :
             selectedNode.type === 'shape' ? 'Shape' : 'Element'} Selected
          </h3>
          <button
            onClick={() => selectNode(null)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-500 text-sm">
          {selectedNode.type === 'sticky-note' ? 'Double-click the note to edit its content.' :
           selectedNode.type === 'shape' ? 'Double-click the shape to edit its label.' :
           'Use the controls on the element to edit its properties.'}
        </p>
      </div>
    );
  }

  const tableData = selectedNode.data as TableData;

  const handleTableNameChange = (name: string) => {
    updateTable(selectedNodeId, { name });
  };

  const handleSchemaChange = (schema: string) => {
    updateTable(selectedNodeId, { schema });
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      isPrimaryKey: false,
      isNullable: true,
    };

    addColumn(selectedNodeId, newColumn);
    setNewColumnName('');
    setNewColumnType(DEFAULT_FIELD_TYPE);
  };

  const handleColumnUpdate = (columnId: string, field: keyof Column, value: any) => {
    updateColumn(selectedNodeId, columnId, { [field]: value });
  };

  const handleRemoveColumn = (columnId: string) => {
    removeColumn(selectedNodeId, columnId);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Table Properties</h3>
        <button
          onClick={() => selectNode(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('columns')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'columns'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Columns
        </button>
        <button
          onClick={() => setActiveTab('indexes')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'indexes'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={14} className="inline mr-1" />
          Indexes
        </button>
        <button
          onClick={() => setActiveTab('primary-key')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'primary-key'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Key size={14} className="inline mr-1" />
          Primary Key
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Name
            </label>
            <input
              type="text"
              value={tableData.name}
              onChange={(e) => handleTableNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schema
            </label>
            <input
              type="text"
              value={tableData.schema || ''}
              onChange={(e) => handleSchemaChange(e.target.value)}
              placeholder="public"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {activeTab === 'columns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Columns</h4>
            </div>

            <div className="space-y-2">
              {tableData.columns.map((column: Column) => (
                <div key={column.id} className="border border-gray-200 rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => handleColumnUpdate(column.id, 'name', e.target.value)}
                      className="font-medium text-sm bg-transparent border-none focus:outline-none flex-1"
                    />
                    <button
                      onClick={() => handleRemoveColumn(column.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={column.type}
                      onChange={(e) => handleColumnUpdate(column.id, 'type', e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {DATA_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={column.defaultValue || ''}
                      onChange={(e) => handleColumnUpdate(column.id, 'defaultValue', e.target.value)}
                      placeholder="Default"
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={column.checkConstraint || ''}
                      onChange={(e) => handleColumnUpdate(column.id, 'checkConstraint', e.target.value)}
                      placeholder="Check constraint (e.g., price > 0)"
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={column.isPrimaryKey}
                        onChange={(e) => handleColumnUpdate(column.id, 'isPrimaryKey', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Primary Key</span>
                    </label>

                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={column.isNullable}
                        onChange={(e) => handleColumnUpdate(column.id, 'isNullable', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Nullable</span>
                    </label>

                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={column.isUnique || false}
                        onChange={(e) => handleColumnUpdate(column.id, 'isUnique', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Unique</span>
                    </label>

                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={column.hasIndex || false}
                        onChange={(e) => handleColumnUpdate(column.id, 'hasIndex', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span>Index</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-md p-3 space-y-2">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              
              <div className="flex items-center space-x-2">
                <select
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DATA_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                
                <button
                  onClick={handleAddColumn}
                  disabled={!newColumnName.trim()}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'indexes' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Indexes</h4>
            <p className="text-sm text-gray-600">Index management will be implemented here</p>
          </div>
        )}

        {activeTab === 'primary-key' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800">Primary Key Configuration</h4>
            <p className="text-sm text-gray-600">Composite primary key management will be implemented here</p>
          </div>
        )}
      </div>
    </div>
  );
};
