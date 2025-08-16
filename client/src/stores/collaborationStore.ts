import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CollaborationState {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  isConnected: boolean;
  users: Map<string, any>;
  
  // Actions
  initializeCollaboration: (roomName: string) => void;
  disconnect: () => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  doc: null,
  provider: null,
  isConnected: false,
  users: new Map(),

  initializeCollaboration: (roomName: string) => {
    const { doc: existingDoc, provider: existingProvider } = get();
    
    // Clean up existing connections
    if (existingProvider) {
      existingProvider.destroy();
    }
    if (existingDoc) {
      existingDoc.destroy();
    }

    // Create new Yjs document
    const doc = new Y.Doc();
    
    // Connect to WebSocket provider
    const provider = new WebsocketProvider(
      'ws://localhost:4000/collaboration',
      roomName,
      doc
    );

    // Handle connection status
    provider.on('status', (event: any) => {
      set({ isConnected: event.status === 'connected' });
    });

    // Handle awareness (user presence)
    provider.awareness.on('change', () => {
      const users = new Map();
      provider.awareness.getStates().forEach((state, clientId) => {
        if (state.user) {
          users.set(clientId, state.user);
        }
      });
      set({ users });
    });

    // Set local user info
    provider.awareness.setLocalStateField('user', {
      name: `User-${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      cursor: null,
    });

    set({ doc, provider });
  },

  disconnect: () => {
    const { doc, provider } = get();
    
    if (provider) {
      provider.destroy();
    }
    if (doc) {
      doc.destroy();
    }
    
    set({
      doc: null,
      provider: null,
      isConnected: false,
      users: new Map(),
    });
  },
}));
