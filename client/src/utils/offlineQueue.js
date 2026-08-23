/**
 * Offline queue using localStorage (simple, compatible with service workers).
 * Reports are saved locally when offline and synced when back online.
 */

const QUEUE_KEY = 'smarthealthne_offline_queue';

export const enqueueReport = (reportData) => {
  const queue = getQueue();
  const item = {
    id: Date.now().toString(),
    type: 'health_report',
    data: reportData,
    enqueuedAt: new Date().toISOString(),
    status: 'pending',
  };
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return item.id;
};

export const enqueueWaterReport = (reportData) => {
  const queue = getQueue();
  const item = {
    id: Date.now().toString(),
    type: 'water_report',
    data: reportData,
    enqueuedAt: new Date().toISOString(),
    status: 'pending',
  };
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return item.id;
};

export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const removeFromQueue = (id) => {
  const queue = getQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const markFailed = (id) => {
  const queue = getQueue().map((item) =>
    item.id === id ? { ...item, status: 'failed' } : item
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const getPendingCount = () => {
  return getQueue().filter((item) => item.status === 'pending').length;
};
