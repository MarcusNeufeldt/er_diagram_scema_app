import React, { useEffect } from 'react';
import { Lock, LockOpen, AlertTriangle, Clock } from 'lucide-react';
import { useDiagramStore } from '../stores/diagramStore';

export const LockStatusIndicator: React.FC = () => {
  const { 
    lockStatus, 
    lockTimeRemaining, 
    lockedBy, 
    isReadOnly,
    updateLockTimeRemaining,
    addNotification 
  } = useDiagramStore();

  useEffect(() => {
    if (lockStatus === 'locked' && lockTimeRemaining > 0) {
      const interval = setInterval(() => {
        const newTimeRemaining = Math.max(0, lockTimeRemaining - 1);
        updateLockTimeRemaining(newTimeRemaining);
        
        // Show warning at 1 minute remaining
        if (newTimeRemaining === 60) {
          addNotification('warning', '⚠️ Your editing session will expire in 1 minute. Save your work!', 5000);
        }
        
        // Show critical warning at 30 seconds
        if (newTimeRemaining === 30) {
          addNotification('error', '🚨 Critical: Your editing session expires in 30 seconds!', 10000);
        }
        
        // Auto-save warning at 10 seconds
        if (newTimeRemaining === 10) {
          addNotification('error', '🔒 Session expiring! Your changes may be lost.', 0);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockStatus, lockTimeRemaining, updateLockTimeRemaining, addNotification]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (lockStatus) {
      case 'locked':
        if (lockTimeRemaining <= 30) return 'text-red-600 bg-red-50 border-red-200';
        if (lockTimeRemaining <= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'unlocked':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (lockStatus) {
      case 'locked':
        if (lockTimeRemaining <= 60) return <AlertTriangle size={14} />;
        return <Lock size={14} />;
      case 'warning':
        return <AlertTriangle size={14} />;
      case 'expired':
        return <AlertTriangle size={14} />;
      case 'unlocked':
      default:
        return <LockOpen size={14} />;
    }
  };

  const getStatusText = () => {
    if (isReadOnly && lockedBy) {
      return `Read-only (${lockedBy})`;
    }
    
    switch (lockStatus) {
      case 'locked':
        return `Editing (${formatTime(lockTimeRemaining)})`;
      case 'warning':
        return 'Session warning';
      case 'expired':
        return 'Session expired';
      case 'unlocked':
      default:
        return 'Read-only';
    }
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {lockStatus === 'locked' && lockTimeRemaining <= 60 && (
        <Clock size={12} className="animate-pulse" />
      )}
    </div>
  );
};