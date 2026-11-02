import { useState } from 'react';
import { CAREER_TOOLKIT_STORAGE_KEY } from '../../lib/careerToolkit.mjs';
import { linkedInterview, interviewCalendar } from '../../lib/interviewSchedule.mjs';
import { downloadText } from '../../lib/downloadText.mjs';
export default function InterviewSchedule({ application }) {
  const [draft, setDraft] = useState({ round: application.stage, localTime: '', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', status: 'scheduled', occurrence: 'earlier' });
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  function load() {
    try { const state = JSON.parse(localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || '{}').state || {}; setEvents((state.interviews || []).filter(event => event.applicationId === application.id)); }
    catch { setMessage('Could not read saved interviews.'); }
  }
  function save() {
    try {
      const event = linkedInterview(application, { ...draft, id: draft.id || `interview-${crypto.randomUUID()}` });
      const state = JSON.parse(localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || '{}').state || {};
      const interviews = [event, ...(state.interviews || []).filter(item => item.id !== event.id)];
      localStorage.setItem(CAREER_TOOLKIT_STORAGE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state: { ...state, interviews } }));
      window.dispatchEvent(new Event('career-toolkit-change')); setDraft(previous => ({ ...previous, id: event.id })); load(); setMessage('Interview saved. Preparation packs use this linked record.');
    } catch (error) { setMessage(error.message); }
  }
  return <details onToggle={event => { if (event.currentTarget.open) load(); }}><summary>Schedule rounds for {application.company}</summary>
    <label>Round<input value={draft.round} maxLength={80} onChange={event => setDraft({ ...draft, round: event.target.value })} /></label>
    <label>Interview date and time<input type="datetime-local" value={draft.localTime} onChange={event => setDraft({ ...draft, localTime: event.target.value })} /></label>
    <label>Interview time zone<input value={draft.timeZone} onChange={event => setDraft({ ...draft, timeZone: event.target.value })} placeholder="Asia/Kolkata" /></label>
    <label>Repeated daylight-saving time<select value={draft.occurrence} onChange={event => setDraft({ ...draft, occurrence: event.target.value })}><option value="earlier">Earlier occurrence</option><option value="later">Later occurrence</option></select></label>
    <label>Interview status<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>{['scheduled','completed','waiting','offer','rejected'].map(status => <option key={status}>{status}</option>)}</select></label>
    <button type="button" onClick={save}>Save linked interview</button><button type="button" onClick={() => setDraft({ round: application.stage, localTime: '', timeZone: draft.timeZone, status: 'scheduled', occurrence: 'earlier' })}>Add another round</button><p role="status">{message}</p>
    {events.map(event => <article key={event.id}><strong>{event.round} · {event.date} · {event.status}</strong><p>{event.startsAt} · {event.timeZone}</p><button type="button" onClick={() => setDraft({ id: event.id, round: event.round, localTime: new Intl.DateTimeFormat('sv-SE', { timeZone: event.timeZone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).format(new Date(event.startsAt)).replace(' ', 'T'), timeZone: event.timeZone, status: event.status, occurrence: 'earlier' })}>Edit {event.round}</button><button type="button" onClick={() => { try { downloadText(interviewCalendar(event), 'interview.ics', 'text/calendar'); } catch(error) { setMessage(error.message); } }}>Download calendar event</button></article>)}
    <p>Calendar export uses a one-hour placeholder. It does not send invitations.</p>
  </details>;
}
