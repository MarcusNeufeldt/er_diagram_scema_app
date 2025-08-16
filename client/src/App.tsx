import React, { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertyPanel } from './components/PropertyPanel';
import { CollaboratorCursors } from './components/CollaboratorCursors';
import { WelcomeModal } from './components/WelcomeModal';
import { RelationshipModal } from './components/RelationshipModal';
import { AIChatPanel } from './components/AIChatPanel';
import { useCollaborationStore } from './stores/collaborationStore';
import { useDiagramStore } from './stores/diagramStore';

function App() {
  const { initializeCollaboration, doc } = useCollaborationStore();
  const { initializeYjs, pendingConnection, confirmConnection, cancelConnection, editingEdgeId, edges, undo, redo } = useDiagramStore();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

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
  }, [initializeCollaboration]);

  useEffect(() => {
    if (ENABLE_COLLABORATION && doc) {
      initializeYjs(doc);
    }
  }, [doc, initializeYjs]);

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
