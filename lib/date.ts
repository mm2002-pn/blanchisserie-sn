/** Helpers de comparaison de dates locales — pour filtrer les listes "du jour". */

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** True si la date ISO/Date tombe sur la journée locale courante. */
export function isToday(input: string | Date | null | undefined): boolean {
  if (!input) return false;
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return false;
  return startOfDay(d) === startOfDay(new Date());
}

/** Format court "lun. 27 avr." pour entêtes "du jour". */
export function formatDayHeader(d: Date = new Date()): string {
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

/** "HH:mm" local. */
export function formatHour(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
