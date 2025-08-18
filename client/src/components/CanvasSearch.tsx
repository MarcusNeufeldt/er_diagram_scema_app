import React, { useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';

interface CanvasSearchProps {
  onClose: () => void;
}

export const CanvasSearch: React.FC<CanvasSearchProps> = ({ onClose }) => {
  const {
    searchQuery,
    searchResults,
    currentSearchIndex,
    setSearchQuery,
    nextSearchResult,
    previousSearchResult,
  } = useDiagramStore();
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        if (event.shiftKey) {
          previousSearchResult();
        } else {
          nextSearchResult();
        }
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, nextSearchResult, previousSearchResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[300px]">
      <div className="flex items-center space-x-2 mb-2">
        <Search size={16} className="text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search tables, columns, notes..."
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <X size={16} />
        </button>
      </div>
      
      {searchQuery && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {searchResults.length === 0 
              ? 'No results' 
              : `${currentSearchIndex + 1} of ${searchResults.length}`
            }
          </span>
          
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={previousSearchResult}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Previous result (Shift+Enter)"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={nextSearchResult}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Next result (Enter)"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to navigate results, 
        <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
      </div>
    </div>
  );
};