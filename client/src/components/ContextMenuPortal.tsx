import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Trash2, Edit, Plus, Copy } from 'lucide-react';

interface ContextMenuPortalProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onRename: () => void;
  onAddField: () => void;
  onDuplicate: () => void;
}

export const ContextMenuPortal: React.FC<ContextMenuPortalProps> = ({
  x,
  y,
  onClose,
  onDelete,
  onRename,
  onAddField,
  onDuplicate,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuItems = [
    {
      icon: Edit,
      label: 'Rename Table',
      onClick: onRename,
      shortcut: 'F2',
    },
    {
      icon: Plus,
      label: 'Add Field',
      onClick: onAddField,
      shortcut: 'Ctrl+N',
    },
    {
      icon: Copy,
      label: 'Duplicate Table',
      onClick: onDuplicate,
      shortcut: 'Ctrl+D',
    },
    {
      divider: true,
    },
    {
      icon: Trash2,
      label: 'Delete Table',
      onClick: onDelete,
      shortcut: 'Del',
      danger: true,
    },
  ];

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999] min-w-[200px]"
      style={{ 
        left: Math.min(x, window.innerWidth - 220), 
        top: Math.min(y, window.innerHeight - 200) 
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if ('divider' in item && item.divider) {
          return <div key={index} className="border-t border-gray-200 my-1" />;
        }

        const Icon = item.icon!;
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick!();
              onClose();
            }}
            className={`w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors ${
              item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Icon size={16} />
              <span className="text-sm">{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-400">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};