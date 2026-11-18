export function getPuneDateTime(value: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((valuePart) => valuePart.type === type)?.value ?? '';

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

export function isFutureSlot(slotDate: Date, startTime: string, now = new Date()): boolean {
  const current = getPuneDateTime(now);
  const requestedDate = slotDate.toISOString().slice(0, 10);
  return (
    requestedDate > current.date || (requestedDate === current.date && startTime > current.time)
  );
}
