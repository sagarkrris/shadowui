export const PREPARATION_PHASES = [
  {id:'fundamentals',title:'1. Build the foundations',goal:'Explain a mechanism with a concrete example before memorising an answer.',items:[['sql-lab-filter','Filter rows and handle NULL','/labs/sql'],['git-lab-snapshots','Understand snapshots and staging','/labs/git']]},
  {id:'coding',title:'2. Practise coding',goal:'State an invariant, test a boundary and compare your result with the contract.',items:[['prep-coding-dsa','Practise a DSA pattern','/practice?workspace=dsaLab'],['prep-coding-build','Implement a Java contract','/build/practice/upload-byte-budget'],['prep-coding-repository','Complete the timed repository assessment','/assessments']]},
  {id:'design',title:'3. Defend a design',goal:'State workload assumptions and walk through one failure before adding components.',items:[['prep-design-concepts','Study a system design concept','/system-design/visual-guide'],['prep-design-canvas','Sketch and defend your architecture','/practice?workspace=canvas']]},
  {id:'interview',title:'4. Rehearse the interview',goal:'Answer aloud, review feedback and practise an explained follow-up.',items:[['prep-interview-mock','Run a mock in the practice workspace','/practice'],['prep-interview-review','Revisit a weak lesson','/learn#progress']]},
  {id:'final',title:'5. Prepare for the day',goal:'Review the target role, choose evidence stories and warm up on a known topic.',items:[['prep-final-role','Review company and role preparation','/practice?workspace=company'],['prep-final-guide','Rehearse the final study checklist','/senior-java-interview']]},
];
export function journeyNext(progress) {
  const weak=new Set(progress?.weak||[]);const complete=new Set(progress?.completed||[]);
  const items=PREPARATION_PHASES.flatMap(phase=>phase.items.map(item=>({id:item[0],title:item[1],href:item[2],phase:phase.title})));
  return items.find(item=>weak.has(item.id)) || items.find(item=>!complete.has(item.id)) || null;
}
