import { createHash } from 'node:crypto';
const digest = value => createHash('sha256').update(value).digest('hex');
export function assessmentMetadata(model, { question, profile, round, difficulty, feedbackDepth }) {
  return {source:'ai',provider:'Google Gemini',model,promptVersion:'answer-review-v2',rubricVersion:1,contentVersion:digest(String(question).trim()),settingsVersion:digest(JSON.stringify({position:String(profile?.position||'').slice(0,200),experience:String(profile?.experience||'').slice(0,200),stack:String(profile?.stack||'').slice(0,500),round:String(round||''),difficulty:String(difficulty||''),feedbackDepth:String(feedbackDepth||'')}))};
}
