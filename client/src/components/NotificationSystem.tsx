import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';

interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ id, type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-600" />;
      case 'info':
        return <Info size={20} className="text-blue-600" />;
      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`${getBgColor()} border rounded-lg p-3 shadow-lg flex items-start space-x-3 max-w-sm animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 break-words">
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useDiagramStore();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          id={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationSystem;