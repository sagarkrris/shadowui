import MessageContent from '../chat/MessageContent';

export default function CurrentQuestion({ question }) {
  const firstLine = question.split('```')[0].split('\n').find(line => line.trim());
  const preview = firstLine?.replace(/^\s*(?:#{1,6}|[-*])\s+/, '').replace(/(\*\*|`)(.+?)\1/g, '$2').trim();
  return (
    <details className="practice-current-question">
      <summary>
        <strong>Current question</strong>
        {preview && <span className="question-preview">{preview.slice(0, 160)}{preview.length > 160 ? '…' : ''}</span>}
        <span className="question-show">Show full question</span>
        <span className="question-hide">Hide full question</span>
      </summary>
      <div className="question-full" role="region" aria-label="Full current question" tabIndex={0}>
        <MessageContent content={question} />
      </div>
    </details>
  );
}
