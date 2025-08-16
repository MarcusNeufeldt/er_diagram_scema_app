import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Connection } from 'reactflow';

interface RelationshipModalProps {
  connection: Connection;
  sourceTableName: string;
  sourceColumnName: string;
  targetTableName: string;
  targetColumnName: string;
  onConfirm: (relationship: RelationshipConfig) => void;
  onCancel: () => void;
  existingConfig?: any;
  isEditing?: boolean;
}

export interface RelationshipConfig {
  type: '1:1' | '1:N' | 'N:N';
  onDeleteAction: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdateAction: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  name?: string;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  connection,
  sourceTableName,
  sourceColumnName,
  targetTableName,
  targetColumnName,
  onConfirm,
  onCancel,
  existingConfig,
  isEditing = false,
}) => {
  console.log('RelationshipModal rendered with:', {
    sourceTableName,
    sourceColumnName,
    targetTableName,
    targetColumnName
  });

  const [config, setConfig] = useState<RelationshipConfig>({
    type: existingConfig?.cardinality || '1:N', // Use existing config or default to one-to-many
    onDeleteAction: existingConfig?.onDelete || 'CASCADE',
    onUpdateAction: existingConfig?.onUpdate || 'CASCADE',
    name: existingConfig?.label || `fk_${targetTableName}_${targetColumnName}`,
  });

  const handleConfirm = () => {
    onConfirm(config);
  };

  // Smart suggestions based on column names
  const getSmartSuggestions = () => {
    const suggestions = [];
    
    // If target column ends with _id and matches source table name
    if (targetColumnName.endsWith('_id') && 
        targetColumnName.toLowerCase().includes(sourceTableName.toLowerCase())) {
      suggestions.push('This looks like a typical foreign key relationship (1:N)');
    }
    
    // If both are primary keys
    if (sourceColumnName === 'id' && targetColumnName === 'id') {
      suggestions.push('Primary key to primary key suggests a 1:1 relationship');
    }
    
    // If it's a junction table pattern
    if ((sourceTableName.includes('_') || targetTableName.includes('_')) &&
        (sourceColumnName.includes('id') && targetColumnName.includes('id'))) {
      suggestions.push('This might be part of a many-to-many relationship');
    }
    
    return suggestions;
  };

  const suggestions = getSmartSuggestions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Edit Relationship' : 'Create Relationship'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Connection Preview */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-600">{sourceTableName}</div>
              <div className="text-gray-600">{sourceColumnName}</div>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
            <div className="text-center">
              <div className="font-medium text-green-600">{targetTableName}</div>
              <div className="text-gray-600">{targetColumnName}</div>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Smart Suggestions:</h3>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relationship Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['1:1', '1:N', 'N:N'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setConfig({ ...config, type })}
                className={`p-2 text-sm border rounded ${
                  config.type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {type === '1:1' && 'One-to-One'}
                {type === '1:N' && 'One-to-Many'}
                {type === 'N:N' && 'Many-to-Many'}
              </button>
            ))}
          </div>
        </div>

        {/* Foreign Key Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foreign Key Name
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cascade Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              On Delete
            </label>
            <select
              value={config.onDeleteAction}
              onChange={(e) => setConfig({ 
                ...config, 
                onDeleteAction: e.target.value as RelationshipConfig['onDeleteAction']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASCADE">CASCADE</option>
              <option value="SET NULL">SET NULL</option>
              <option value="RESTRICT">RESTRICT</option>
              <option value="NO ACTION">NO ACTION</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              On Update
            </label>
            <select
              value={config.onUpdateAction}
              onChange={(e) => setConfig({ 
                ...config, 
                onUpdateAction: e.target.value as RelationshipConfig['onUpdateAction']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASCADE">CASCADE</option>
              <option value="SET NULL">SET NULL</option>
              <option value="RESTRICT">RESTRICT</option>
              <option value="NO ACTION">NO ACTION</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
          >
            {isEditing ? 'Update Relationship' : 'Create Relationship'}
          </button>
        </div>
      </div>
    </div>
  );
};