import { useEffect, useId, useRef, useState } from 'react';
import DiagramArtwork from './DiagramArtwork';
import styles from '../../styles/Illustration.module.css';

export function downloadDiagramSvg(container, filename) {
  const svg = container?.querySelector('svg[role="img"]');
  if (!svg) return;
  const copy = svg.cloneNode(true);
  const [, , width, height] = svg.getAttribute('viewBox').split(/\s+/);
  copy.removeAttribute('style');
  copy.setAttribute('width', width);
  copy.setAttribute('height', height);
  copy.setAttribute('font-family', 'system-ui, sans-serif');
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `${filename}.svg`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function IllustrationPanel({ model, source, title, artworkKey, activeNode, sourceLabel }) {
  const id = useId();
  const container = useRef(null);
  const [textView, setTextView] = useState(false);
  const [sizeMode, setSizeMode] = useState('natural');
  const [selectedNode, setSelectedNode] = useState(null);
  const [message, setMessage] = useState('');
  const heading = model?.title || title || 'Original diagram layout';
  const focusedNode = selectedNode || activeNode;
  const enlarged = sizeMode === 'enlarged';
  const fit = sizeMode === 'fit';

  useEffect(() => {
    setSelectedNode(null);
    setMessage('');
  }, [activeNode, heading]);
  if (!model && !source) return null;

  function focusNode(node) {
    setSelectedNode(node.id);
    setSizeMode('fit');
    setTextView(false);
    setMessage(`${node.label} highlighted in the diagram.`);
  }

  if (!model) return <div className={styles.panel} data-diagram-source>
    <p className={styles.hint}>Original relationship text. The layout and arrow directions are preserved below.</p>
    <pre className={styles.source} role="region" tabIndex={0} aria-label={sourceLabel || `${heading}: original diagram text`}>{source}</pre>
  </div>;

  return <div className={styles.panel} data-illustration-panel>
    <div className={styles.tools} role="group" aria-label={`Illustration tools: ${heading}`}>
      <button type="button" aria-pressed={!textView} aria-controls={`diagram-${id}`} onClick={() => setTextView(false)}>Diagram</button>
      <button type="button" aria-pressed={textView} aria-controls={`text-${id}`} onClick={() => setTextView(true)}>Text view</button>
      <button type="button" aria-pressed={fit} onClick={() => setSizeMode(fit ? 'natural' : 'fit')}>Fit to panel</button>
      <button type="button" aria-pressed={sizeMode === 'natural'} onClick={() => setSizeMode('natural')}>Natural size</button>
      <button type="button" aria-pressed={enlarged} onClick={() => setSizeMode(enlarged ? 'natural' : 'enlarged')}>{enlarged ? 'Reset illustration size' : 'Enlarge illustration'}</button>
      <button type="button" onClick={() => downloadDiagramSvg(container.current, 'learning-illustration')}>Download SVG</button>
    </div>
    <div id={`diagram-${id}`} hidden={textView}>
      <div ref={container} className={styles.canvas} role="region" aria-label={`${heading} scrollable illustration`} tabIndex={0}>
        <DiagramArtwork model={model} artworkKey={artworkKey} enlarged={enlarged} fit={fit} activeNode={focusedNode} />
      </div>
      <p className={styles.hint}>Follow the labeled connections. Scroll to explore the picture, or switch to Text view.</p>
    </div>
    <div id={`text-${id}`} hidden={!textView} className={styles.textView}>
        <p>Select a component to highlight it in the diagram.</p>
        <ul className={styles.nodes} aria-label={`${heading} components`}>
          {model.nodes.map(node => <li key={node.id}>
            <button type="button" aria-pressed={focusedNode === node.id} onClick={() => focusNode(node)}>
              <strong>{node.label}</strong>{node.detail && <span>{node.detail}</span>}
            </button>
          </li>)}
        </ul>
        {model.edges.length > 0 && <>
          <h3>Connections</h3>
          <ol className={styles.connections}>{model.edges.map((edge, index) => <li key={`${edge.from}:${edge.to}:${index}`}>
            <strong>{model.nodes.find(node => node.id === edge.from)?.label}</strong> → <strong>{model.nodes.find(node => node.id === edge.to)?.label}</strong><span>{edge.label}</span>
          </li>)}</ol>
        </>}
        {source && <pre className={styles.source} role="region" tabIndex={0} aria-label={sourceLabel || `${heading}: original diagram text`}>{source}</pre>}
    </div>
    {message && <p className={styles.hint} role="status" aria-live="polite">{message}</p>}
  </div>;
}
