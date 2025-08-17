import React, { useRef, useState } from 'react';
import { 
  Plus, Download, Upload, Save, Undo, Redo, Bot, Layout, 
  Grid3x3, StickyNote, Square, Circle, Diamond, ChevronDown,
  FileText, Shapes, Settings
} from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';
import { SQLParser, SQLGenerator } from '../lib/sqlParser';
import { userService } from '../services/userService';

interface ToolbarProps {
  onOpenAIChat: () => void;
}

export const ToolbarClean: React.FC<ToolbarProps> = ({ onOpenAIChat }) => {
  const { 
    addTable, 
    nodes, 
    edges, 
    importDiagram, 
    autoLayout, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    snapToGrid,
    toggleGrid,
    addStickyNote,
    addShape,
    isReadOnly,
    currentDiagramId
  } = useDiagramStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const handleAddTable = () => {
    addTable({ x: 400, y: 200 });
  };

  const handleAutoLayout = () => {
    autoLayout();
    setShowViewMenu(false);
  };

  const handleAddStickyNote = () => {
    addStickyNote({ x: 500, y: 300 });
    setShowShapeMenu(false);
  };

  const handleAddShape = (shapeType: 'rectangle' | 'circle' | 'diamond') => {
    addShape({ x: 500, y: 300 }, shapeType);
    setShowShapeMenu(false);
  };

  const handleSave = async () => {
    if (!currentDiagramId) {
      console.warn('No diagram ID available for saving');
      return;
    }

    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      alert('You must be logged in to save');
      return;
    }

    if (isReadOnly) {
      alert('Cannot save in read-only mode');
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
      
      const response = await fetch(`${API_BASE_URL}/diagram?id=${currentDiagramId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          name: 'Database Diagram',
          nodes,
          edges,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Diagram saved successfully');
      } else if (response.status === 403) {
        alert(result.message || 'Your editing session has expired. Please reload to get the latest version.');
      } else {
        console.error('Save failed:', result.message);
        alert('Failed to save diagram: ' + result.message);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save diagram');
    }
    setShowFileMenu(false);
  };

  const handleExportSQL = () => {
    const sql = SQLGenerator.generateSQL(nodes);
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database-schema.sql';
    a.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  const handleExportJSON = () => {
    const diagramData = {
      version: '1.0',
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        tablesCount: nodes.length,
        relationshipsCount: edges.length
      }
    };
    
    const json = JSON.stringify(diagramData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        const diagramData = JSON.parse(content);
        
        if (diagramData.nodes && Array.isArray(diagramData.nodes)) {
          importDiagram({
            nodes: diagramData.nodes,
            edges: diagramData.edges || []
          });
          alert(`Successfully imported ${diagramData.nodes.length} tables and ${(diagramData.edges || []).length} relationships`);
        } else {
          throw new Error('Invalid diagram format - no nodes found');
        }
      } catch (jsonError) {
        try {
          const tables = SQLParser.parseCreateTable(content);
          
          if (tables.length > 0) {
            const newNodes = SQLParser.convertToNodes(tables);
            
            importDiagram({
              nodes: newNodes,
              edges: []
            });
            alert(`Successfully imported ${tables.length} tables from SQL`);
          } else {
            throw new Error('No valid tables found in SQL');
          }
        } catch (sqlError) {
          alert(`Error parsing file. Please ensure it's a valid JSON diagram or SQL file.`);
        }
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,.json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <div className="flex items-center space-x-2">
        {/* Primary Actions */}
        <button
          onClick={handleAddTable}
          disabled={isReadOnly}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span className="text-sm">Add Table</span>
        </button>

        {/* File Menu */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <FileText size={16} />
            <span className="text-sm">File</span>
            <ChevronDown size={14} />
          </button>
          
          {showFileMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
              <button
                onClick={handleSave}
                disabled={isReadOnly}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
              <button
                onClick={handleImport}
                disabled={isReadOnly}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Upload size={14} />
                <span>Import</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleExportSQL}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Download size={14} />
                <span>Export SQL</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Shapes Menu */}
        <div className="relative">
          <button
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            disabled={isReadOnly}
            className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shapes size={16} />
            <span className="text-sm">Shapes</span>
            <ChevronDown size={14} />
          </button>
          
          {showShapeMenu && !isReadOnly && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
              <button
                onClick={handleAddStickyNote}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <StickyNote size={14} />
                <span>Sticky Note</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => handleAddShape('rectangle')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Square size={14} />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => handleAddShape('circle')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Circle size={14} />
                <span>Circle</span>
              </button>
              <button
                onClick={() => handleAddShape('diamond')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Diamond size={14} />
                <span>Diamond</span>
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <Settings size={16} />
            <span className="text-sm">View</span>
            <ChevronDown size={14} />
          </button>
          
          {showViewMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
              <button
                onClick={handleAutoLayout}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Layout size={14} />
                <span>Auto Layout</span>
              </button>
              <button
                onClick={() => {
                  toggleGrid();
                  setShowViewMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Grid3x3 size={14} />
                <span>{snapToGrid ? 'Disable' : 'Enable'} Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-2">
        {/* Undo/Redo */}
        <div className="flex items-center space-x-1 border-r border-gray-300 pr-2">
          <button
            onClick={undo}
            disabled={!canUndo || isReadOnly}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo || isReadOnly}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>
        </div>

        {/* AI Assistant */}
        <button
          onClick={onOpenAIChat}
          className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          <Bot size={16} />
          <span className="text-sm">AI Assistant</span>
        </button>
      </div>
    </div>
  );
};