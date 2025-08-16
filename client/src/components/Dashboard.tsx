import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, Users, Clock, Lock } from 'lucide-react';
import { userService } from '../services/userService';

interface Diagram {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lockedByUserId: string | null;
  lockExpiresAt: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface DashboardProps {
  onCreateDiagram: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateDiagram }) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = userService.getCurrentUser();

  useEffect(() => {
    loadDiagrams();
  }, []);

  const loadDiagrams = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/diagrams`);
      
      if (response.ok) {
        const data = await response.json();
        setDiagrams(data);
      } else {
        throw new Error('Failed to load diagrams');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diagrams');
    } finally {
      setLoading(false);
    }
  };

  const createNewDiagram = async () => {
    if (!currentUser) {
      alert('Please log in to create a diagram');
      return;
    }

    try {
      const name = prompt('Enter diagram name:');
      if (!name || !name.trim()) return;

      const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/diagrams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          nodes: [],
          edges: [],
          ownerId: currentUser.id,
        }),
      });

      if (response.ok) {
        const newDiagram = await response.json();
        setDiagrams(prev => [newDiagram, ...prev]);
        // Navigate to the new diagram
        window.location.href = `/diagram/${newDiagram.id}`;
      } else {
        throw new Error('Failed to create diagram');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create diagram');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLocked = (diagram: Diagram) => {
    if (!diagram.lockedByUserId || !diagram.lockExpiresAt) return false;
    return new Date(diagram.lockExpiresAt) > new Date();
  };

  const getCollaborationStatus = (diagram: Diagram) => {
    if (!isLocked(diagram)) return null;
    
    const isCurrentUser = diagram.lockedByUserId === currentUser?.id;
    if (isCurrentUser) {
      return {
        text: 'You are editing',
        color: 'text-green-600',
        icon: '✏️'
      };
    } else {
      return {
        text: 'Someone is editing',
        color: 'text-orange-600',
        icon: '🔒'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading diagrams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDiagrams}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Diagrams</h1>
              <p className="mt-1 text-gray-600">
                Collaborative ER diagram tool with real-time editing
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{currentUser.name}</span>
                </div>
              )}
              <button
                onClick={createNewDiagram}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                New Diagram
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {diagrams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No diagrams yet</h3>
            <p className="text-gray-600 mb-6">Create your first database diagram to get started</p>
            <button
              onClick={createNewDiagram}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create First Diagram
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagrams.map((diagram) => {
              const collaborationStatus = getCollaborationStatus(diagram);
              
              return (
                <Link
                  key={diagram.id}
                  to={`/diagram/${diagram.id}`}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6 block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {diagram.name}
                    </h3>
                    {collaborationStatus && (
                      <div className={`text-sm ${collaborationStatus.color} flex items-center`}>
                        <span className="mr-1">{collaborationStatus.icon}</span>
                        {collaborationStatus.text}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Owner: {diagram.owner.name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Updated: {formatDate(diagram.updatedAt)}</span>
                    </div>
                    
                    {diagram.createdAt !== diagram.updatedAt && (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>Created: {formatDate(diagram.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Click to {isLocked(diagram) && diagram.lockedByUserId !== currentUser?.id ? 'view' : 'edit'}
                      </span>
                      {isLocked(diagram) && diagram.lockedByUserId !== currentUser?.id && (
                        <Lock className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};