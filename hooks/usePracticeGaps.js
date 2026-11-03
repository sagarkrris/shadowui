import { useCallback, useEffect, useState } from 'react';
import { PRACTICE_GAPS_KEY,normalizePracticeGaps,updatePracticeGap } from '../lib/practiceGaps.mjs';
export default function usePracticeGaps(){
 const [gaps,setGaps]=useState([]);const [message,setMessage]=useState('');
 useEffect(()=>{const load=()=>{try{setGaps(normalizePracticeGaps(JSON.parse(localStorage.getItem(PRACTICE_GAPS_KEY)||'[]')));}catch{setMessage('Practice recommendations could not be loaded.');}};load();window.addEventListener('practice-gaps-change',load);window.addEventListener('storage',load);return()=>{window.removeEventListener('practice-gaps-change',load);window.removeEventListener('storage',load);};},[]);
 const record=useCallback((gap,passed=false)=>{try{const current=normalizePracticeGaps(JSON.parse(localStorage.getItem(PRACTICE_GAPS_KEY)||'[]'));const next=updatePracticeGap(current,gap,passed);localStorage.setItem(PRACTICE_GAPS_KEY,JSON.stringify(next));setGaps(next);window.dispatchEvent(new Event('practice-gaps-change'));}catch{setMessage('Could not save this practice recommendation.');}},[]);
 return{gaps,record,message};
}
