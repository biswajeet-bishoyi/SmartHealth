import { useState, useEffect, useCallback } from 'react';
import { getQueue, removeFromQueue, getPendingCount } from '../utils/offlineQueue';
import api from '../utils/axiosInstance';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getPendingCount());
  const [isSyncing, setIsSyncing] = useState(false);

  const syncQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    for (const item of queue) {
      try {
        if (item.type === 'health_report') {
          await api.post('/reports', item.data);
        } else if (item.type === 'water_report') {
          await api.post('/water-reports', item.data);
        }
        removeFromQueue(item.id);
      } catch (err) {
        console.error('Failed to sync offline item', item.id, err);
      }
    }
    setIsSyncing(false);
    setPendingCount(getPendingCount());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && getPendingCount() > 0) {
      syncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue]);

  return { isOnline, pendingCount, isSyncing, syncQueue };
};
