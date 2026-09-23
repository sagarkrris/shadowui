export default function ChapterGuidance({ chapter }) {
  return <>
    {chapter.avoid && <p><strong>When to avoid:</strong> {chapter.avoid}</p>}
    {chapter.answer && <details><summary>Sample answer</summary><p>{chapter.answer}</p></details>}
  </>;
}
