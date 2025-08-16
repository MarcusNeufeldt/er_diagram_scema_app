import React, { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertyPanel } from './components/PropertyPanel';
import { CollaboratorCursors } from './components/CollaboratorCursors';
import { WelcomeModal } from './components/WelcomeModal';
import { RelationshipModal } from './components/RelationshipModal';
import { AIChatPanel } from './components/AIChatPanel';
import ReadOnlyBanner from './components/ReadOnlyBanner';
import { useCollaborationStore } from './stores/collaborationStore';
import { useDiagramStore } from './stores/diagramStore';
import { useDiagramLocking } from './hooks/useDiagramLocking';
import { userService } from './services/userService';

function App() {
  const { initializeCollaboration, doc } = useCollaborationStore();
  const { initializeYjs, pendingConnection, confirmConnection, cancelConnection, editingEdgeId, edges, undo, redo, importDiagram } = useDiagramStore();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(userService.getCurrentUser());

  // For demo purposes, use a fixed diagram ID. In production, this would come from routing
  const DEMO_DIAGRAM_ID = 'demo-diagram-1';

  // Initialize user if not logged in
  useEffect(() => {
    if (!currentUser) {
      const user = userService.promptForUser();
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [currentUser]);

  // Initialize diagram locking
  useDiagramLocking({
    diagramId: DEMO_DIAGRAM_ID,
    userId: currentUser?.id || '',
  });

  // Load diagram from database
  useEffect(() => {
    const loadDiagram = async () => {
      if (!currentUser) return;

      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_BASE_URL}/api/diagrams/${DEMO_DIAGRAM_ID}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.diagram) {
            console.log('📊 Loading diagram from database...');
            importDiagram({
              nodes: result.diagram.nodes || [],
              edges: result.diagram.edges || [],
            });
            console.log('✅ Diagram loaded successfully');
          }
        } else {
          console.log('ℹ️ No existing diagram found, starting with empty canvas');
        }
      } catch (error) {
        console.error('Failed to load diagram:', error);
        console.log('ℹ️ Starting with empty canvas');
      }
    };

    loadDiagram();
  }, [currentUser, importDiagram]);

  // Disable collaboration for now - comment out to enable
  const ENABLE_COLLABORATION = false;

  useEffect(() => {
    if (ENABLE_COLLABORATION) {
      // Initialize collaboration for a default room
      const roomName = 'default-diagram';
      initializeCollaboration(roomName);

      return () => {
        // Cleanup will be handled by the collaboration store
      };
    }
  }, [ENABLE_COLLABORATION, initializeCollaboration]);

  useEffect(() => {
    if (ENABLE_COLLABORATION && doc) {
      initializeYjs(doc);
    }
  }, [ENABLE_COLLABORATION, doc, initializeYjs]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <ReadOnlyBanner />
      <Toolbar onOpenAIChat={() => setIsAIChatOpen(true)} />
      <div className="flex flex-1 overflow-hidden relative">
        <ReactFlowProvider>
          <Canvas />
          <PropertyPanel />
          <CollaboratorCursors />
        </ReactFlowProvider>
      </div>
      <WelcomeModal />
      {pendingConnection && (
        <RelationshipModal
          connection={pendingConnection.connection}
          sourceTableName={pendingConnection.sourceTableName}
          sourceColumnName={pendingConnection.sourceColumnName}
          targetTableName={pendingConnection.targetTableName}
          targetColumnName={pendingConnection.targetColumnName}
          onConfirm={confirmConnection}
          onCancel={cancelConnection}
          existingConfig={editingEdgeId ? edges.find(e => e.id === editingEdgeId)?.data : undefined}
          isEditing={!!editingEdgeId}
        />
      )}
      <AIChatPanel
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </div>
  );
}

export default App;
