import React from 'react';
import { useCollaborationStore } from '../stores/collaborationStore';

export const CollaboratorCursors: React.FC = () => {
  const { users, isConnected } = useCollaborationStore();

  if (!isConnected || users.size === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Online Users ({users.size})
        </div>
        {Array.from(users.entries()).map(([clientId, user]) => (
          <div key={clientId} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-sm text-gray-700">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
