import { EventEmitter } from 'events';

export const sessionEvents = new EventEmitter();
sessionEvents.setMaxListeners(100);

export function notifySessionUpdate(sessionType?: string) {
  sessionEvents.emit('session_update', { sessionType, timestamp: Date.now() });
  sessionEvents.emit('session_updated', { sessionType, timestamp: Date.now() });
}
