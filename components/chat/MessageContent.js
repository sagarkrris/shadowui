import { renderInline } from "../../lib/chatMarkdown.mjs";
import CodeBlock from "./CodeBlock";

export default function MessageContent({ content }) {
  return (
    <div>
      {content.split(/(```[\s\S]*?```)/g).map((part, i) => {
        if (part.startsWith("```")) {
          const lang = (part.match(/```(\w*)\n?/) || [])[1] || "java";
          const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
          return <CodeBlock key={i} lang={lang} code={code} />;
        }
        return (
          <div key={i}>
            {part.split("\n").filter((line) => line.trim()).map((line, j) => (
              <p key={j} style={{ marginBottom: 5, lineHeight: 1.72 }} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
