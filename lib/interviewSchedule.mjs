import { normalizeInterviewEvent } from './careerToolkit.mjs';
const pad = value => String(value).padStart(2, '0');
export function zonedInterviewInstant(local, timeZone, occurrence = 'earlier') {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Enter a valid interview date and time.');
  const [year, month, day, hour, minute] = local.match(/\d+/g).map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const stamp = instant => {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  const offsets = new Set();
  for (const hours of [-48, -24, 0, 24, 48]) {
    const instant = target + hours * 3600000;
    const fields = stamp(instant).match(/\d+/g).map(Number);
    offsets.add(Date.UTC(fields[0], fields[1] - 1, fields[2], fields[3], fields[4]) - instant);
  }
  const candidates = [...offsets].map(offset => target - offset).filter(instant => stamp(instant) === local).sort((a,b) => a-b);
  if (!candidates.length) throw new Error('This local time does not exist. Check the date or daylight-saving transition.');
  return new Date(occurrence === 'later' ? candidates.at(-1) : candidates[0]).toISOString();
}
export function linkedInterview(application, draft, now = new Date()) {
  const timeZone = String(draft.timeZone || 'UTC');
  const startsAt = zonedInterviewInstant(draft.localTime, timeZone, draft.occurrence);
  const status = ['scheduled', 'completed', 'waiting', 'offer', 'rejected'].includes(draft.status) ? draft.status : 'scheduled';
  if (status === 'scheduled' && new Date(startsAt) < now) throw new Error('A scheduled interview must start in the future. Choose completed for a past interview.');
  const round = String(draft.round || 'Interview').trim().slice(0, 80);
  return normalizeInterviewEvent({ ...draft, id: draft.id || `interview-${application.id}-${round.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, applicationId: application.id, company: application.company, role: application.role, date: draft.localTime.slice(0,10), round, status, startsAt, timeZone });
}
export function interviewCalendar(event) {
  const clean = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const instant = new Date(event.startsAt);
  if (Number.isNaN(instant.getTime())) throw new Error('Schedule an interview time before exporting a calendar event.');
  const utc = date => `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  const fold = line => { let result = '', width = 0; for (const char of line) { const size = new TextEncoder().encode(char).length; if (width + size > 75) { result += '\r\n '; width = 1; } result += char; width += size; } return result; };
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//InterviewIQ//Interview schedule//EN','BEGIN:VEVENT',`UID:${clean(event.id)}@interviewiq`, `DTSTAMP:${utc(new Date())}`,`DTSTART:${utc(instant)}`,`DTEND:${utc(new Date(instant.getTime()+3600000))}`,`SUMMARY:${clean(`${event.company} · ${event.round}`)}`,`DESCRIPTION:${clean(`${event.role}. Time zone: ${event.timeZone}. One-hour calendar placeholder; adjust to your invitation.`)}`,'END:VEVENT','END:VCALENDAR',''].map(fold).join('\r\n');
}
