function LabCommands({ commands }) {
  return commands?.map(({ label, code }) => <details key={label}>
    <summary>{label}</summary>
    <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}><code>{code}</code></pre>
  </details>);
}

export default function CapstoneLab({ capstone }) {
  if (!capstone.download) return null;
  const { extension } = capstone;
  return <div style={{ minWidth: 0 }}>
    <a href={capstone.download.href} download>{capstone.download.label}</a>
    <LabCommands commands={capstone.commands} />
    {extension && <section aria-label={extension.title}>
      <h3>{extension.title}</h3>
      <p><a href={extension.download.href} download>{extension.download.label}</a></p>
      <p><a href={extension.guide.href}>{extension.guide.label}</a></p>
      <ol>{extension.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <LabCommands commands={extension.commands} />
    </section>}
  </div>;
}
