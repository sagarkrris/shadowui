import styles from '../../styles/DsaGuide.module.css';

export default function GuideSectionContent({ section }) {
  return (section.blocks || [{ type: 'text', content: section.content }]).map((block, index) => block.type === 'table'
    ? <div key={index} className={styles.tableWrap} tabIndex={0} role="region" aria-label={`${section.heading} table`}><table className={styles.table}><caption>{section.heading}</caption><thead><tr>{block.headers.map((header, column) => <th scope="col" key={column}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody></table></div>
    : <p className={styles.prose} key={index}>{block.content}</p>);
}
