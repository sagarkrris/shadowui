import { renderInline } from "../../lib/chatMarkdown.mjs";
import CodeBlock from "./CodeBlock";

function isPartHeading(line) {
  return /^\*\*Part\s+\d+:/i.test(line.trim()) || /^Part\s+\d+:/i.test(line.trim());
}

function isComparisonHeading(line) {
  return /^\*\*(Your Answer|Ideal Answer|Improved Version):/i.test(line.trim()) ||
    /^(Your Answer|Ideal Answer|Improved Version):/i.test(line.trim());
}

export default function MessageContent({ content }) {
  return (
    <div className="message-content">
      {content.split(/(```[\s\S]*?```)/g).map((part, i) => {
        if (part.startsWith("```")) {
          const lang = (part.match(/```(\w*)\n?/) || [])[1] || "java";
          const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
          return <CodeBlock key={i} lang={lang} code={code} />;
        }
        return (
          <div key={i}>
            {part.split("\n").filter((line) => line.trim()).map((line, j) => (
              isPartHeading(line)
                ? <h3 key={j} className="message-part-heading" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
                : isComparisonHeading(line)
                  ? <h3 key={j} className="message-comparison-heading" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
                : <p key={j} className="message-line" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
