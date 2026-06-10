import { renderInline } from "../../lib/chatMarkdown.mjs";
import CodeBlock from "./CodeBlock";

function isPartHeading(line) {
  return /^\*\*Part\s+\d+:/i.test(line.trim()) || /^Part\s+\d+:/i.test(line.trim());
}

function isComparisonHeading(line) {
  return /^\*\*(Your Answer|Ideal Answer|Improved Version):/i.test(line.trim()) ||
    /^(Your Answer|Ideal Answer|Improved Version):/i.test(line.trim());
}

function isBulletLine(line) {
  return /^\s*[-*]\s+/.test(line);
}

function cleanBulletLine(line) {
  return line.replace(/^\s*[-*]\s+/, "");
}

function renderTextLines(part, keyPrefix) {
  const nodes = [];
  let bulletItems = [];

  const flushBullets = () => {
    if (!bulletItems.length) return;
    const listKey = `${keyPrefix}-list-${nodes.length}`;
    nodes.push(
      <ul key={listKey} className="message-list">
        {bulletItems.map((item, index) => (
          <li key={`${listKey}-${index}`} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        ))}
      </ul>
    );
    bulletItems = [];
  };

  part.split("\n").filter((line) => line.trim()).forEach((line, index) => {
    if (isBulletLine(line)) {
      bulletItems.push(cleanBulletLine(line));
      return;
    }

    flushBullets();

    if (isPartHeading(line)) {
      nodes.push(<h3 key={`${keyPrefix}-${index}`} className="message-part-heading" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
      return;
    }

    if (isComparisonHeading(line)) {
      nodes.push(<h3 key={`${keyPrefix}-${index}`} className="message-comparison-heading" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
      return;
    }

    nodes.push(<p key={`${keyPrefix}-${index}`} className="message-line" dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
  });

  flushBullets();
  return nodes;
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
            {renderTextLines(part, `message-${i}`)}
          </div>
        );
      })}
    </div>
  );
}
