import { useEffect, useRef, useCallback } from 'react';
import { useDiagramStore } from '../stores/diagramStore';

interface UseDiagramLockingProps {
  diagramId: string;
  userId: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const useDiagramLocking = ({ diagramId, userId }: UseDiagramLockingProps) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setReadOnly, setCurrentDiagramId } = useDiagramStore();

  const acquireLock = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/diagram-lock?id=${diagramId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('🔒 Lock acquired successfully');
        setReadOnly(false, null);
        return true;
      } else if (response.status === 409) {
        console.log('⚠️ Diagram is locked by another user');
        const lockedBy = result.lockedBy || 'Another user';
        setReadOnly(true, lockedBy);
        return false;
      } else {
        console.error('Failed to acquire lock:', result.message);
        setReadOnly(true, 'Unknown user');
        return false;
      }
    } catch (error) {
      console.error('Lock acquisition error:', error);
      setReadOnly(true, 'Connection error');
      return false;
    }
  }, [diagramId, userId, setReadOnly]);

  const releaseLock = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/diagram-unlock?id=${diagramId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      console.log('🔓 Lock released');
    } catch (error) {
      console.error('Lock release error:', error);
    }
  }, [diagramId, userId]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      console.log('💓 Sending heartbeat...');
      const lockAcquired = await acquireLock();
      if (!lockAcquired) {
        console.log('💔 Heartbeat failed - lost lock');
        stopHeartbeat();
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }, [acquireLock]);

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!diagramId || !userId) return;

    console.log(`🎯 Attempting to acquire lock for diagram: ${diagramId}`);
    setCurrentDiagramId(diagramId);

    // Try to acquire the lock
    acquireLock().then((success) => {
      if (success) {
        startHeartbeat();
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up diagram lock');
      stopHeartbeat();
      releaseLock();
      setCurrentDiagramId(null);
    };
  }, [diagramId, userId, acquireLock, startHeartbeat, setCurrentDiagramId, releaseLock]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, []);

  return {
    acquireLock,
    releaseLock,
  };
};