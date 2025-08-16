import React, { useRef } from 'react';
import { Plus, Download, Upload, Save, Undo, Redo, Bot, Layout, Grid3x3 } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';
import { SQLParser, SQLGenerator } from '../lib/sqlParser';

interface ToolbarProps {
  onOpenAIChat: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenAIChat }) => {
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
    toggleGrid
  } = useDiagramStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTable = () => {
    // Add table at center of viewport
    addTable({ x: 400, y: 200 });
  };

  const handleAutoLayout = () => {
    autoLayout();
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleSave = () => {
    // Export current diagram as JSON with full state
    const diagramData = {
      version: '1.0',
      nodes,
      edges,
      viewport: {
        // We'll add viewport data later if needed
        zoom: 1,
        x: 0,
        y: 0
      },
      metadata: {
        created: new Date().toISOString(),
        title: 'Database Diagram',
        description: 'Exported from Data Modeler'
      }
    };
    
    const blob = new Blob([JSON.stringify(diagramData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    // Export as SQL DDL
    const ddl = SQLGenerator.generateDDL(nodes);
    
    const blob = new Blob([ddl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Importing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log('📄 File content preview:', content.substring(0, 200) + '...');
      
      try {
        // Try to parse as JSON diagram first
        console.log('🔍 Attempting JSON parse...');
        const diagramData = JSON.parse(content);
        console.log('✅ JSON parsed successfully:', Object.keys(diagramData));
        
        if (diagramData.nodes) {
          console.log('📊 Found nodes:', diagramData.nodes.length);
          console.log('🔗 Found edges:', (diagramData.edges || []).length);
          
          // Import with full diagram data including edges and positions
          importDiagram({
            nodes: diagramData.nodes,
            edges: diagramData.edges || []
          });
          alert(`Successfully imported ${diagramData.nodes.length} tables and ${(diagramData.edges || []).length} relationships`);
        } else {
          console.log('❌ No nodes found in JSON');
          throw new Error('Invalid diagram format - no nodes found');
        }
      } catch (jsonError) {
        console.log('❌ JSON parse failed:', jsonError);
        
        try {
          // Fallback: Try to parse as SQL
          console.log('🔍 Attempting SQL parse...');
          const tables = SQLParser.parseCreateTable(content);
          console.log('📋 SQL tables found:', tables.length);
          
          if (tables.length > 0) {
            const newNodes = SQLParser.convertToNodes(tables);
            console.log('📊 Converted to nodes:', newNodes.length);
            
            importDiagram({
              nodes: newNodes,
              edges: []
            });
            alert(`Successfully imported ${tables.length} tables from SQL`);
          } else {
            throw new Error('No valid tables found in SQL');
          }
        } catch (sqlError) {
          console.log('❌ SQL parse failed:', sqlError);
          
          const jsonErrorMsg = jsonError instanceof Error ? jsonError.message : String(jsonError);
          const sqlErrorMsg = sqlError instanceof Error ? sqlError.message : String(sqlError);
          
          alert(`Error parsing file: ${file.name}\n\nJSON Error: ${jsonErrorMsg}\nSQL Error: ${sqlErrorMsg}\n\nPlease ensure it's a valid JSON diagram or SQL file.`);
          console.error('Full parse errors:', { 
            file: file.name, 
            jsonError, 
            sqlError,
            contentPreview: content.substring(0, 500)
          });
        }
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center space-x-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,.json"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      {/* Logo/Title */}
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold text-gray-800">Data Modeler</h1>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Add Tools */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleAddTable}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          <span>Add Table</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Undo/Redo */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleUndo}
          disabled={!canUndo()}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
          <span>Undo</span>
        </button>
        
        <button
          onClick={handleRedo}
          disabled={!canRedo()}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
          <span>Redo</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* File Operations */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Save size={16} />
          <span>Save</span>
        </button>
        
        <button
          onClick={handleImport}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Upload size={16} />
          <span>Import</span>
        </button>
        
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Download size={16} />
          <span>Export</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* AI Assistant */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenAIChat}
          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md hover:from-purple-600 hover:to-blue-600 transition-all"
        >
          <Bot size={16} />
          <span>AI Assistant</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Layout Operations */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleAutoLayout}
          className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          title="Auto-arrange tables in a clean layout"
          disabled={nodes.length === 0}
        >
          <Layout size={16} />
          <span>Auto Layout</span>
        </button>
        
        <button
          onClick={toggleGrid}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            snapToGrid 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={snapToGrid ? "Disable magnetic grid" : "Enable magnetic grid"}
        >
          <Grid3x3 size={16} />
          <span>Grid</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Edit Operations */}
      <div className="flex items-center space-x-2">
        <button
          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        
        <button
          className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Status */}
      <div className="flex-1"></div>
      <div className="text-sm text-gray-500">
        Ready
      </div>
    </div>
  );
};
