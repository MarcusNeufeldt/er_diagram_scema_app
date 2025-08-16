import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import { ArrowLeft, Users } from 'lucide-react';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { CollaboratorCursors } from './CollaboratorCursors';
import { WelcomeModal } from './WelcomeModal';
import { RelationshipModal } from './RelationshipModal';
import { AIChatPanel } from './AIChatPanel';
import ReadOnlyBanner from './ReadOnlyBanner';
import { useCollaborationStore } from '../stores/collaborationStore';
import { useDiagramStore } from '../stores/diagramStore';
import { useDiagramLocking } from '../hooks/useDiagramLocking';
import { userService } from '../services/userService';

export const DiagramView: React.FC = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const { initializeCollaboration, doc } = useCollaborationStore();
  const { initializeYjs, pendingConnection, confirmConnection, cancelConnection, editingEdgeId, edges, undo, redo, importDiagram, setCurrentDiagramId } = useDiagramStore();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(userService.getCurrentUser());
  const [diagramInfo, setDiagramInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize user if not logged in
  useEffect(() => {
    if (!currentUser) {
      const user = userService.promptForUser();
      if (user) {
        setCurrentUser(user);
      } else {
        // If user cancels login, redirect to dashboard
        navigate('/');
        return;
      }
    }
  }, [currentUser, navigate]);

  // Set current diagram ID for the store
  useEffect(() => {
    if (diagramId) {
      setCurrentDiagramId(diagramId);
    }
  }, [diagramId, setCurrentDiagramId]);

  // Initialize diagram locking
  useDiagramLocking({
    diagramId: diagramId || '',
    userId: currentUser?.id || '',
  });

  // Load diagram from database
  useEffect(() => {
    const loadDiagram = async () => {
      if (!diagramId || !currentUser) return;

      try {
        setLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/diagram?id=${diagramId}`);
        
        if (response.ok) {
          const diagram = await response.json();
          setDiagramInfo(diagram);
          console.log('📊 Loading diagram from database...');
          importDiagram({
            nodes: diagram.nodes || [],
            edges: diagram.edges || [],
          });
          console.log('✅ Diagram loaded successfully');
        } else if (response.status === 404) {
          alert('Diagram not found');
          navigate('/');
          return;
        } else {
          throw new Error('Failed to load diagram');
        }
      } catch (error) {
        console.error('Failed to load diagram:', error);
        alert('Failed to load diagram');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId, currentUser, importDiagram, navigate]);

  // Disable collaboration for now - comment out to enable
  const ENABLE_COLLABORATION = false;

  useEffect(() => {
    if (ENABLE_COLLABORATION && diagramId) {
      // Initialize collaboration for this specific diagram
      initializeCollaboration(diagramId);

      return () => {
        // Cleanup will be handled by the collaboration store
      };
    }
  }, [ENABLE_COLLABORATION, diagramId, initializeCollaboration]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading diagram...</p>
        </div>
      </div>
    );
  }

  if (!diagramId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid diagram ID</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <ReadOnlyBanner />
      
      {/* Enhanced Toolbar with Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            
            {diagramInfo && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">|</span>
                <h1 className="text-lg font-semibold text-gray-900">{diagramInfo.name}</h1>
                {diagramInfo.owner && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{diagramInfo.owner.name}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <Toolbar onOpenAIChat={() => setIsAIChatOpen(true)} />
        </div>
      </div>
      
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
};