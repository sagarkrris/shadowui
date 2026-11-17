export default function InterviewQuestionAnswer({ item }) {
  return <div style={{ color: '#3c4043', lineHeight: 1.65, overflowWrap: 'anywhere' }}>
    <h3>A complete answer</h3>
    <p>{item.answer}</p>
    {item.mechanism && <section><h3>How it works</h3><p>{item.mechanism}</p></section>}
    <section><h3>Worked example and assumptions</h3><p>{item.example}</p></section>
    <details><summary>Trade-offs, verification and follow-up</summary>
      <h3>Trade-offs and failure boundaries</h3><p>{item.tradeOff}</p>
      <h3>How to verify it</h3><p>{item.verification}</p>
      <h3>Interviewer follow-up</h3><p><strong>{item.followUp.question}</strong></p><p>{item.followUp.answer}</p>
    </details>
    <p>Primary references: {item.sources.map(([title, href], index) => <span key={href}>{index > 0 && ' · '}<a href={href}>{title}</a></span>)}</p>
  </div>;
}
