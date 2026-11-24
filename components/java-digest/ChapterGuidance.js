export default function ChapterGuidance({ chapter }) {
  return <>
    {chapter.avoid && <p><strong>When to avoid:</strong> {chapter.avoid}</p>}
    {chapter.advantages && <>
      <p><strong>Advantages:</strong> {chapter.advantages}</p>
      <p><strong>Disadvantages:</strong> {chapter.disadvantages}</p>
      <p data-course-interview-answer><strong>Sample answer:</strong> {chapter.answer}</p>
      <details>
        <summary>Failure case and verification</summary>
        <p><strong>Failure case:</strong> {chapter.failure}</p>
        <p><strong>How to verify:</strong> {chapter.verify}</p>
      </details>
    </>}
    {!chapter.advantages && chapter.answer && <details><summary>Sample answer</summary><p>{chapter.answer}</p></details>}
    {chapter.followUp && <details><summary>{chapter.followUp}</summary><p>{chapter.followUpAnswer}</p></details>}
    {chapter.sources?.length > 0 && <p>References: {chapter.sources.map(([label, href], index) =>
      <span key={href}>{index > 0 && " · "}<a href={href}>{label}</a></span>)}</p>}
  </>;
}
