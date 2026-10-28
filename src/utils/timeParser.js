/**
 * Utility to parse human duration strings (e.g. "10s", "5m", "2h", "7d") into seconds or milliseconds,
 * and format seconds into readable Indonesian text.
 */

const TIME_UNITS = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

export function parseDurationToSeconds(input) {
  if (!input || typeof input !== 'string') return null;

  const match = input.trim().toLowerCase().match(/^(\d+)\s*([smhdw])$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (isNaN(value) || value <= 0) return null;

  return value * TIME_UNITS[unit];
}

export function formatSecondsToHuman(totalSeconds) {
  if (totalSeconds <= 0) return '0 detik';

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);

  return parts.join(' ');
}
