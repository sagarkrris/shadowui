export const PRACTICE_GAPS_KEY='interviewiq.labPracticeGaps.v1';
export function normalizePracticeGaps(value){
 const entries=Array.isArray(value)?value:[];
 return entries.filter(g=>g&&/^(sql|assessment|git)-[a-z0-9-]+$/.test(g.id)&&typeof g.title==='string'&&typeof g.detail==='string'&&typeof g.drill==='string'&&typeof g.href==='string'&&/^\/(labs\/(sql|git)|assessments)(\?[a-z]+=[a-z0-9-]+)?$/.test(g.href)).slice(0,100).map(g=>({id:g.id,title:g.title.slice(0,120),detail:g.detail.slice(0,500),drill:g.drill.slice(0,1000),href:g.href}));
}
export function updatePracticeGap(current,gap,passed=false){const kept=normalizePracticeGaps(current).filter(g=>g.id!==gap.id);return passed?kept:normalizePracticeGaps([gap,...kept]);}
