import { z } from 'zod';

export const slotFormSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.')
      .refine(isCalendarDate, 'Enter a valid date.'),
    startTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time, for example 02:30 PM.'),
    endTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time, for example 05:30 PM.'),
    isAvailable: z.boolean(),
  })
  .superRefine((slot, context) => {
    if (slot.startTime >= slot.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Start time must be before end time.',
      });
    }
  });

export type SlotFormValues = z.infer<typeof slotFormSchema>;

export function formatTime12(time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return time;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return time;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${match[2]} ${period}`;
}

export function parseTime12(value: string): string | null {
  const match = value.trim().match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

export function isFuturePuneSlot(date: string, time: string, now = new Date()): boolean {
  const current = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    current.find((part) => part.type === type)?.value ?? '';
  const today = `${value('year')}-${value('month')}-${value('day')}`;
  const currentTime = `${value('hour')}:${value('minute')}`;
  return date > today || (date === today && time > currentTime);
}

function isCalendarDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function currentPuneDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
