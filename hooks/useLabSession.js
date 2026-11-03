import { useCallback, useEffect, useRef, useState } from 'react';

// Save only after hydration, never silently overwrite a session changed by another tab.
export default function useLabSession(key, normalize) {
  const [value, setValue] = useState(() => normalize(null));
  const current = useRef(value); const conflictRef = useRef(false); const raw = useRef(null);
  const [ready,setReady] = useState(false); const [conflict,setConflict] = useState(false); const [message,setMessage] = useState('');
  useEffect(() => {
    try { const saved=localStorage.getItem(key); raw.current=saved; const next=normalize(saved ? JSON.parse(saved) : null);current.current=next;setValue(next); }
    catch {conflictRef.current=true;setConflict(true);setMessage('Saved data could not be read. Export your working copy before replacing it.');}
    setReady(true);
    const changed=event=>{if(event.key===key && event.newValue!==raw.current){conflictRef.current=true;setConflict(true);setMessage('Another tab changed this session. Choose which copy to keep before saving.');}};
    window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);
  },[key,normalize]);
  const update=useCallback(transform=>{
    const next=normalize(typeof transform==='function'?transform(current.current):transform);current.current=next;setValue(next);
    if(conflictRef.current)return;
    try{
      const latest=localStorage.getItem(key);
      if(latest!==raw.current){conflictRef.current=true;setConflict(true);setMessage('Another tab changed this session. Choose a copy before saving.');return;}
      const serialized=JSON.stringify(next);localStorage.setItem(key,serialized);raw.current=serialized;setMessage('Session saved in this browser.');
    }catch{setMessage('Could not save. Export your working copy before leaving; this visit remains usable.');}
  },[key,normalize]);
  const keepLocal=()=>{try{const serialized=JSON.stringify(current.current);localStorage.setItem(key,serialized);raw.current=serialized;conflictRef.current=false;setConflict(false);setMessage('Working copy saved.');}catch{setMessage('Could not save. Export your working copy before leaving.');}};
  const useSaved=()=>{try{const saved=localStorage.getItem(key);const next=normalize(saved?JSON.parse(saved):null);current.current=next;raw.current=saved;setValue(next);conflictRef.current=false;setConflict(false);setMessage('Saved copy loaded.');}catch{setMessage('Saved copy is unreadable. Export your working copy before replacing it.');}};
  return {value,ready,update,message,conflict,keepLocal,useSaved,getValue:()=>current.current};
}
