import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ReaderLayout from '../components/reader/ReaderLayout';
import { NOTEBOOK_KEY, NOTEBOOK_ARCHIVE_KEY, NOTEBOOK_CAPACITY, archiveNotebookNote, normalizeNotebook, notebookMarkdown, removeNotebookNote, undoNotebookRemoval } from '../lib/learningNotebook.mjs';
import DataControls from '../components/practice/DataControls';
import { downloadText } from '../lib/downloadText.mjs';
import styles from '../styles/Reader.module.css';
export default function Notebook() {
  const [notes, setNotes] = useState([]); const [bookmarks, setBookmarks] = useState([]); const [message, setMessage] = useState(''); const [exported, setExported] = useState('');
  const [archived, setArchived] = useState([]);
  const [removed, setRemoved] = useState(null);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All');
  const visibleNotes = notes.filter(note => (filter === 'All' || note.completed === (filter === 'Completed')) && `${note.title} ${note.failure} ${note.evidence} ${note.repair} ${note.misconception} ${note.interviewAnswer}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visibleBookmarks = bookmarks.filter(item => item.title.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {
    try { setArchived(normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_ARCHIVE_KEY) || '[]'))); } catch { /* Active notes remain available. */ }
    try { setNotes(normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) || '[]'))); }
    catch { setMessage('Notebook storage is unavailable or damaged. Existing data has not been changed.'); }
    import('../lib/readerEditorial.mjs').then(({ normalizeBookmarks, READER_BOOKMARK_KEY }) => { try { setBookmarks(normalizeBookmarks(JSON.parse(localStorage.getItem(READER_BOOKMARK_KEY) || '[]'))); } catch { /* Keep notes available if bookmark data is damaged. */ } });
  }, []);
  function remove(id) {
    try { const result = removeNotebookNote(localStorage, id); setNotes(result.notes); setRemoved(result.removed); setMessage('Note removed. You can undo this removal.'); }
    catch { setMessage('Could not remove the note.'); }
  }
  function archive(id) {
    try { setNotes(archiveNotebookNote(localStorage, id)); setArchived(normalizeNotebook(JSON.parse(localStorage.getItem(NOTEBOOK_ARCHIVE_KEY) || '[]'))); setMessage('Note archived. It remains included in your exports.'); }
    catch (error) { setMessage(error.message); }
  }
  function undo() {
    try { setNotes(undoNotebookRemoval(localStorage, removed)); setRemoved(null); setMessage('Note restored.'); }
    catch (error) { setMessage(error.message); }
  }
  function exportNotes() {
    const text = notebookMarkdown(notes) + (archived.length ? '\n\n# Archived notes\n\n' + notebookMarkdown(archived) : '');
    setExported(text);
    try { downloadText(text, 'my-engineering-notebook.md', 'text/markdown;charset=utf-8'); setMessage('Notebook downloaded. A copy is also available below.'); }
    catch { setMessage('Download unavailable. Select and copy your notebook below.'); }
  }

  return <ReaderLayout title="My learning notebook" description="Your saved reasoning, misconceptions and explanations."><Head><meta name="robots" content="noindex" /></Head><h1>My learning notebook</h1><p>Your decisions, unfinished explanations, and ideas worth revisiting. Stored only in this browser; clearing browser data removes them. Export your notes for safekeeping.</p><div className={styles.actions}><button onClick={exportNotes}>Export notes as Markdown</button><Link href="/practice">Resume practice workspace</Link><Link href="/time-machine/database-decisions">Revisit design decisions</Link><Link href="/build">Explore tiny-system projects</Link></div>{exported && <label>Notebook export — select and copy<textarea readOnly rows={10} value={exported} onFocus={event => event.target.select()} /></label>}<p role="status">{message}</p>{removed && <button type="button" onClick={undo}>Undo remove note</button>}<DataControls showMeasurements={false} onRestored={() => location.reload()} /><section className={styles.notebookFilters} aria-label="Notebook filters"><label>Search your notebook<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your notes and saved explanations" /></label><label>Activity status<select value={filter} onChange={event => setFilter(event.target.value)}>{['All', 'In progress', 'Completed'].map(value => <option key={value}>{value}</option>)}</select></label></section><p role="status">{visibleNotes.length} notes · {visibleBookmarks.length} saved explanations match</p><p>{notes.length} of {NOTEBOOK_CAPACITY} active note slots used · {archived.length} archived. Archive notes to make room; exports include both.</p><h2>Reflections and learning paths</h2>{!notes.length && <p>No notes yet. <Link href="/learn/spring-transactions">Start the Spring transaction journey</Link> or save a diagnosis in any detective case.</p>}<div className={styles.grid}>{visibleNotes.map(note => <article className={styles.card} key={note.id}><h3><Link href={note.href}>{note.title}</Link></h3><p>{note.completed ? 'Completed activity' : 'In progress'}{note.steps.length ? ` · ${note.steps.length}/5 learning steps` : ''}</p>{[['failure', 'What failed'], ['evidence', 'Evidence'], ['repair', 'Change and risk'], ['misconception', 'What would change my mind'], ['interviewAnswer', 'Interview answer']].map(([field, label]) => note[field] && <p key={field}><strong>{label}:</strong> {note[field]}</p>)}<button onClick={() => archive(note.id)} aria-label={`Archive ${note.title}`}>Archive note</button><button onClick={() => remove(note.id)} aria-label={`Remove ${note.title}`}>Remove note</button></article>)}</div>{notes.length > 0 && !visibleNotes.length && <p>No notes match. Try a broader search or another activity status.</p>}<details><summary>Archived notes ({archived.length})</summary>{archived.map(note => <article key={note.id}><h3><Link href={note.href}>{note.title}</Link></h3><p>{note.evidence || note.failure || note.interviewAnswer}</p></article>)}</details><h2>Saved explanations</h2>{visibleBookmarks.length ? <ul>{visibleBookmarks.map(item => <li key={item.href}><Link href={item.href}>{item.title}</Link></li>)}</ul> : <p>{query ? "No saved explanations match your search." : "Use “Bookmark section” in an article to collect explanations here."}</p>}</ReaderLayout>;
}
