import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { DiagramView } from './DiagramView';
import NotificationSystem from './NotificationSystem';

export const AppRouter: React.FC = () => {
  const handleCreateDiagram = () => {
    // This will be handled by the Dashboard component
    console.log('Create diagram triggered');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<Dashboard onCreateDiagram={handleCreateDiagram} />} 
        />
        <Route 
          path="/diagram/:diagramId" 
          element={<DiagramView />} 
        />
        {/* Fallback route */}
        <Route 
          path="*" 
          element={<Dashboard onCreateDiagram={handleCreateDiagram} />} 
        />
      </Routes>
      <NotificationSystem />
    </Router>
  );
};