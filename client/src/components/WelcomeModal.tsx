import React, { useState, useEffect } from 'react';
import { X, Table, Users, Download, Upload } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show welcome modal on first visit
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome to Data Modeler
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600">
              A real-time collaborative data modeling tool for designing and visualizing database schemas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Table className="text-blue-500" size={24} />
                  <h3 className="font-semibold">Create Tables</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Use the "Add Table" button to create new database tables on the canvas.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="text-green-500" size={24} />
                  <h3 className="font-semibold">Real-time Collaboration</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Multiple users can edit simultaneously. Open multiple tabs to see it in action!
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Upload className="text-purple-500" size={24} />
                  <h3 className="font-semibold">Import SQL</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Upload existing CREATE TABLE statements to visualize your current database schema.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Download className="text-orange-500" size={24} />
                  <h3 className="font-semibold">Export DDL</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Export your diagram as SQL DDL or JSON to implement in your database.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Quick Start Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Click on any table to edit its properties in the right panel</li>
                <li>• Try importing the sample-schema.sql file from the project root</li>
                <li>• Use mouse wheel to zoom, drag to pan around the canvas</li>
                <li>• The minimap in the bottom-right helps navigate large diagrams</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
