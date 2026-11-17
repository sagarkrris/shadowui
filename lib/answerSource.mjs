// Only the latest user entry can be the source of answer tools. Falling back to
// an older entry would silently assess an answer to a different question.
export function latestCandidateAnswer(messages = []) {
  const message = [...messages].reverse().find(item => item?.role === 'user');
  const text = String(message?.content || '').trim();
  if (!text) return '';
  if (/^(?:📸\s*)?screenshot(?:\s*[—:-]|$)/iu.test(text)) return '';
  if (message.apiContent && message.apiContent !== text) return '';
  if (/^(?:Explain Answer:|Practice Mock:|Code Explanation Judge\b|Answer Rewrite Studio\b|Follow-up on the current AI session\b)/i.test(text)) return '';
  return text;
}

const UNFINISHED_GRADE = /^([ \t]*(?:(?:[-*]|\d+[.)])[ \t]+)?(?:\*\*)?(?:Overall score|Score|Correctness|Depth|Examples|Trade-offs|Communication(?: clarity)?|Follow-up readiness)(?:\*\*)?[ \t]*:[ \t]*(?:\*\*)?[ \t]*)(?:(?:X|N|\?)?[ \t]*\/[ \t]*10\b|(?=$))/gim;

// Imported conversations can contain old, unfinished AI grading templates.
// Keep the record intact; distinguish missing grades when displaying prose.
export function displayAssessmentText(content = '') {
  let incomplete = false;
  const text = String(content).split(/(```[\s\S]*?```)/g).map(part => part.startsWith('```') ? part : part.replace(UNFINISHED_GRADE, (_, label) => {
    incomplete = true;
    return `${label}Not assessed`;
  })).join('');
  return { text, incomplete };
}
