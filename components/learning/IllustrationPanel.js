import { useRef, useState } from 'react';
import DiagramArtwork, { SourceArtwork } from './DiagramArtwork';
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

export default function IllustrationPanel({ model, source, title, artworkKey, activeNode }) {
  const container = useRef(null);
  const [enlarged, setEnlarged] = useState(false);
  if (!model && !source) return null;
  const heading = model?.title || title || 'Original diagram layout';
  return <div className={styles.panel} data-illustration-panel>
    <div className={styles.tools} role="group" aria-label={`Illustration tools: ${heading}`}>
      <button type="button" aria-pressed={enlarged} onClick={() => setEnlarged(value => !value)}>{enlarged ? 'Reset illustration size' : 'Enlarge illustration'}</button>
      <button type="button" onClick={() => downloadDiagramSvg(container.current, 'learning-illustration')}>Download SVG</button>
    </div>
    <div ref={container} className={styles.canvas} role="region" tabIndex={0} aria-label={`${heading} scrollable illustration`}>
      {model ? <DiagramArtwork model={model} artworkKey={artworkKey} enlarged={enlarged} activeNode={activeNode} /> : <SourceArtwork source={source} title={heading} artworkKey={artworkKey} enlarged={enlarged} />}
    </div>
    <p className={styles.hint}>{model ? 'Follow the connection key.' : 'Read the original diagram in its preserved layout.'} Scroll to explore the picture; the complete text explanation follows.</p>
  </div>;
}
