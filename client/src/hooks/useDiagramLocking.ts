import { useEffect, useRef, useCallback } from 'react';
import { useDiagramStore } from '../stores/diagramStore';

interface UseDiagramLockingProps {
  diagramId: string;
  userId: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const useDiagramLocking = ({ diagramId, userId }: UseDiagramLockingProps) => {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { setReadOnly, setCurrentDiagramId, setLockStatus, addNotification } = useDiagramStore();

  // Define stopHeartbeat first as it's used by startLockTimer
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  };

  // Define startLockTimer (without useCallback for now)
  const startLockTimer = () => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    
    // Set timer for lock expiration (10 minutes)
    lockTimerRef.current = setTimeout(() => {
      console.log('⏰ Lock expired due to timeout');
      setLockStatus('expired');
      setReadOnly(true, null);
      addNotification('error', '🔒 Your editing session has expired. Please reload to get the latest version.', 10000);
      stopHeartbeat();
    }, 10 * 60 * 1000); // 10 minutes
  };

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
        setLockStatus('locked', 600); // 10 minutes = 600 seconds
        // Don't start the frontend timer here - it's handled by heartbeat
        return true;
      } else if (response.status === 409) {
        console.log('⚠️ Diagram is locked by another user');
        const lockedBy = result.lockedBy || 'Another user';
        setReadOnly(true, lockedBy);
        setLockStatus('unlocked');
        return false;
      } else {
        console.error('Failed to acquire lock:', result.message);
        setReadOnly(true, 'Unknown user');
        setLockStatus('unlocked');
        return false;
      }
    } catch (error) {
      console.error('Lock acquisition error:', error);
      setReadOnly(true, 'Connection error');
      setLockStatus('unlocked');
      return false;
    }
  }, [diagramId, userId, setReadOnly, setLockStatus]);

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
        setLockStatus('expired');
        addNotification('error', '🔒 Your editing session has expired. Another user may have taken control.', 10000);
        stopHeartbeat();
      } else {
        // Reset the lock status and timer on successful heartbeat
        console.log('✅ Heartbeat successful - lock renewed');
        setLockStatus('locked', 600); // Reset to 10 minutes
        startLockTimer();
      }
    }, 90 * 1000); // Every 90 seconds (more frequent)
  }, [acquireLock, setLockStatus, addNotification]);

  useEffect(() => {
    if (!diagramId || !userId) return;

    console.log(`🎯 Attempting to acquire lock for diagram: ${diagramId}`);
    setCurrentDiagramId(diagramId);

    // Try to acquire the lock
    acquireLock().then((success) => {
      if (success) {
        startLockTimer(); // Start the frontend timer
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