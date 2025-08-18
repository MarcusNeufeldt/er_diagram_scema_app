import { useEffect, useRef, useCallback } from 'react';
import { useDiagramStore } from '../stores/diagramStore';
import { userService } from '../services/userService';

interface UseAutoSaveProps {
  diagramId: string | null;
  enabled: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const useAutoSave = ({ diagramId, enabled }: UseAutoSaveProps) => {
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const pendingSaveRef = useRef<boolean>(false);
  
  const { 
    nodes, 
    edges, 
    isReadOnly, 
    lockStatus,
    addNotification 
  } = useDiagramStore();

  const performAutoSave = useCallback(async () => {
    if (!diagramId || isReadOnly || lockStatus !== 'locked' || pendingSaveRef.current) {
      console.log('🔄 Skipping auto-save:', { 
        diagramId: !!diagramId, 
        isReadOnly, 
        lockStatus, 
        pending: pendingSaveRef.current 
      });
      return;
    }

    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    try {
      pendingSaveRef.current = true;
      console.log('🔄 Auto-saving diagram...');

      const response = await fetch(`${API_BASE_URL}/diagram?id=${diagramId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          name: 'Database Diagram',
          nodes,
          edges,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        lastSaveRef.current = Date.now();
        console.log('✅ Auto-save successful');
        // Don't show notification for successful auto-saves to avoid spam
      } else if (response.status === 403) {
        // Session expired - stop auto-saving and show detailed error
        console.log('❌ Auto-save failed: Session expired', result);
        addNotification('error', `🔒 Auto-save failed: ${result.message || 'Your session has expired'}`, 10000);
        stopAutoSave();
      } else {
        console.error('Auto-save failed:', result.message);
        // Don't show notification for auto-save failures unless critical
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      // Network error - continue trying
    } finally {
      pendingSaveRef.current = false;
    }
  }, [diagramId, isReadOnly, lockStatus, nodes, edges, addNotification]);

  const startAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Auto-save every 30 seconds
    autoSaveIntervalRef.current = setInterval(() => {
      performAutoSave();
    }, 30 * 1000);

    console.log('🔄 Auto-save started (every 30 seconds)');
  }, [performAutoSave]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
      console.log('⏹️ Auto-save stopped');
    }
  }, []);

  const forceSave = useCallback(async () => {
    console.log('💾 Force saving before session expires...');
    await performAutoSave();
  }, [performAutoSave]);

  useEffect(() => {
    if (enabled && diagramId && !isReadOnly && lockStatus === 'locked') {
      startAutoSave();
    } else {
      stopAutoSave();
    }

    return () => {
      stopAutoSave();
    };
  }, [enabled, diagramId, isReadOnly, lockStatus, startAutoSave, stopAutoSave]);

  // Save when nodes or edges change (debounced)
  useEffect(() => {
    if (!enabled || !diagramId || isReadOnly || lockStatus !== 'locked') {
      return;
    }

    const now = Date.now();
    // Only auto-save if it's been at least 5 seconds since last save
    if (now - lastSaveRef.current > 5000) {
      const debounceTimer = setTimeout(() => {
        performAutoSave();
      }, 2000); // 2 second debounce

      return () => clearTimeout(debounceTimer);
    }
  }, [nodes, edges, enabled, diagramId, isReadOnly, lockStatus, performAutoSave]);

  return {
    forceSave,
    isAutoSaving: pendingSaveRef.current,
    lastSave: lastSaveRef.current,
  };
};