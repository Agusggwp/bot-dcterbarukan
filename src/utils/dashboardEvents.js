import { EventEmitter } from 'events';

class DashboardEventEmitter extends EventEmitter {}

export const dashboardEvents = new DashboardEventEmitter();
dashboardEvents.setMaxListeners(200);

export function broadcastMusicUpdate(guildId, status) {
  dashboardEvents.emit(`music:${guildId}`, status);
  dashboardEvents.emit('musicUpdate', { guildId, status });
}

export function broadcastModCase(guildId, modCase) {
  dashboardEvents.emit(`modCase:${guildId}`, modCase);
  dashboardEvents.emit('modCaseCreated', { guildId, modCase });
}
