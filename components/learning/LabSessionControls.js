import { downloadText } from '../../lib/downloadText.mjs';
export default function LabSessionControls({session,name}) {
  return <div><p aria-live="polite">{session.message || 'Drafts and your place are saved in this browser.'}</p><button disabled={!session.ready} onClick={()=>downloadText(JSON.stringify(session.value,null,2),`${name}-session.json`,'application/json')}>Export {name} session</button>{session.conflict&&<div role="alert"><p>Export your working copy first if you need both versions.</p><button onClick={session.keepLocal}>Keep this working copy</button><button onClick={session.useSaved}>Load the saved copy</button></div>}</div>;
}
