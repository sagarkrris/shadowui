import { SQL_EXTENSION_LESSONS } from './sqlCurriculum.mjs';
export const SQL_SCHEMA = `CREATE TABLE teams(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE engineers(id INTEGER PRIMARY KEY, name TEXT NOT NULL, team_id INTEGER, salary INTEGER NOT NULL);
INSERT INTO teams VALUES (1,'Platform'),(2,'Product'),(3,'Research');
INSERT INTO engineers VALUES (1,'Ada',1,90),(2,'Lin',1,70),(3,'Sam',2,70),(4,'Jo',NULL,50),(5,'Dee',2,110);
CREATE INDEX engineers_team_salary ON engineers(team_id,salary);`;
const from = 'FROM engineers e LEFT JOIN teams t ON e.team_id = t.id';
export const SQL_LESSONS = [
  { id: 'filter', title: 'Filtering and NULL', query: 'SELECT name, salary FROM engineers WHERE salary >= 70 ORDER BY salary DESC, name;',
    beginner: 'A table stores rows with named columns. WHERE keeps only rows whose condition is true. NULL means an unknown or absent value; it is not equal to zero or an empty string.',
    mechanism: 'Start with the engineers table, filter salary, choose columns, then sort. This is a logical explanation; an optimizer can choose a different physical plan.',
    example: 'Salaries are illustrative units, not market compensation. Four of five engineers meet the threshold of 70; ties are ordered by name.',
    deep: 'Use IS NULL rather than = NULL. A comparison with NULL is unknown and WHERE removes it. Indexes may reduce work, but filtering alone does not promise an index scan. Verify with EXPLAIN QUERY PLAN on the target SQLite version.',
    answer: 'WHERE filters rows before aggregation. I use IS NULL for missing values because ordinary comparisons with NULL do not evaluate to true. I include a deterministic tie breaker when order matters and inspect the query plan before claiming that an index improves performance.',
    followUp: 'Why does team_id != 1 omit an unassigned engineer? The missing team produces unknown, not true. Use team_id != 1 OR team_id IS NULL when unassigned engineers should be retained.',
    challenge: 'Return name for every unassigned engineer, ordered by name.', expected: 'SELECT name FROM engineers WHERE team_id IS NULL ORDER BY name;',
    steps: [['FROM', 'Read all five engineers.', 'SELECT * FROM engineers'], ['WHERE', 'Keep salaries of at least 70.', 'SELECT * FROM engineers WHERE salary >= 70'], ['SELECT / ORDER BY', 'Project two columns and sort the result.']] },
  { id: 'join', title: 'Preserving rows with LEFT JOIN', query: `SELECT e.name, t.name AS team ${from} ORDER BY e.name;`,
    beginner: 'A join combines rows using a matching rule. LEFT JOIN retains every row on the left, including rows without a matching team.',
    mechanism: 'For each engineer, match the team identifier to teams.id. A missing match yields NULL team columns. The team primary key prevents one engineer from matching multiple teams here.',
    example: 'Five engineers produce five result rows; Jo has no assigned team. The empty Research team does not appear because engineers is the preserved side.',
    deep: 'A filter on a right-side column in WHERE can discard unmatched rows. Put matching restrictions in ON when left-side preservation is intended. A nonunique join key can multiply rows; test duplicates and absent matches.',
    answer: 'I choose LEFT JOIN when every left-side entity must survive a missing relationship. I check key uniqueness to avoid accidental row multiplication and distinguish ON matching conditions from WHERE filters. I test both an absent match and a multiple-match case before trusting counts.',
    followUp: 'How do you retain empty teams? Start from teams and LEFT JOIN engineers. Count e.id rather than COUNT(*) so a team without engineers has a count of zero.',
    challenge: 'Return team name as team and engineer count as headcount for all teams, including empty teams, ordered by team name.', expected: 'SELECT t.name AS team, COUNT(e.id) AS headcount FROM teams t LEFT JOIN engineers e ON e.team_id=t.id GROUP BY t.id,t.name ORDER BY t.name;',
    steps: [['FROM', 'Read engineers.', 'SELECT * FROM engineers'], ['LEFT JOIN', 'Preserve the unassigned engineer.', `SELECT e.*, t.name AS team ${from}`], ['SELECT / ORDER BY', 'Choose names and order them.']] },
  { id: 'group', title: 'Grouping and HAVING', query: 'SELECT team_id, COUNT(*) AS headcount FROM engineers WHERE salary >= 70 GROUP BY team_id HAVING COUNT(*) >= 2 ORDER BY team_id;',
    beginner: 'GROUP BY creates one result row per group. COUNT counts rows. HAVING filters groups after their aggregate values have been computed.',
    mechanism: 'Filter the source rows, form groups by team_id, compute counts, keep qualifying groups and sort. Unlike WHERE, HAVING can refer to aggregates.',
    example: 'Only salaries of at least 70 qualify. Platform and Product each have two qualifying engineers. The unassigned engineer is removed by the salary filter.',
    deep: 'COUNT(column) ignores NULL values; COUNT(*) counts rows. Select grouped columns or aggregates for portable results. SQLite permits bare columns but their values may not be the representative row you intend. Test an empty input and NULL grouping keys.',
    answer: 'WHERE limits individual rows before grouping, and HAVING limits the resulting groups. I choose COUNT(*) for rows and COUNT(column) for known values. I avoid ungrouped, nonaggregated columns so the result has a clear meaning and is portable across databases.',
    followUp: 'What does COUNT(*) without GROUP BY return on empty input? One result row with zero. With GROUP BY there are no groups and therefore no result rows.',
    challenge: 'Return team_id and MAX(salary) as top_salary for assigned engineers, one row per team, ordered by team_id.', expected: 'SELECT team_id, MAX(salary) AS top_salary FROM engineers WHERE team_id IS NOT NULL GROUP BY team_id ORDER BY team_id;',
    steps: [['FROM', 'Source rows.', 'SELECT * FROM engineers'], ['WHERE', 'Filter before counting.', 'SELECT * FROM engineers WHERE salary >= 70'], ['GROUP BY', 'Compute counts.', 'SELECT team_id, COUNT(*) AS headcount FROM engineers WHERE salary >= 70 GROUP BY team_id'], ['HAVING / ORDER BY', 'Keep groups with at least two members.']] },
  { id: 'window', title: 'Ranking without collapsing rows', query: 'SELECT name, team_id, salary, DENSE_RANK() OVER (PARTITION BY team_id ORDER BY salary DESC) AS rank FROM engineers ORDER BY team_id, salary DESC, name;',
    beginner: 'A window function calculates across related rows while preserving each individual row. PARTITION BY separates groups for that calculation.',
    mechanism: 'DENSE_RANK assigns equal salaries the same rank within a team without gaps between distinct salaries. The final ORDER BY controls display order independently of window ordering.',
    example: 'Platform salaries 90 and 70 rank 1 and 2. Product salaries 110 and 70 also rank 1 and 2. An unassigned engineer forms the NULL partition.',
    deep: 'ROW_NUMBER always assigns distinct numbers; RANK leaves gaps after ties; DENSE_RANK does not. For top-N rows use a deterministic ROW_NUMBER ordering. For top-N distinct salary bands use DENSE_RANK. Test tied values rather than assuming all salaries differ.',
    answer: 'I use a window function when I need group context without losing detail rows. DENSE_RANK models distinct salary bands, whereas ROW_NUMBER selects individual rows. I state the tie policy explicitly, use a subquery to filter computed ranks and add a final ORDER BY for stable output.',
    followUp: 'Why use a subquery to filter rank? The window value is not available to the same query level’s WHERE. Compute it in a CTE or subquery and filter it in an outer SELECT.',
    challenge: 'Return name and ROW_NUMBER() as position for all engineers ordered by salary descending then name; display rows in the same order.', expected: 'SELECT name, ROW_NUMBER() OVER (ORDER BY salary DESC, name) AS position FROM engineers ORDER BY salary DESC, name;',
    steps: [['FROM', 'Preserve every detail row.', 'SELECT * FROM engineers'], ['WINDOW / SELECT', 'Rank within partitions; sort output.']] },
  ...SQL_EXTENSION_LESSONS,
];
export const sqlLevel = (lesson) => lesson.level || ({filter:'Beginner',join:'Beginner',group:'Intermediate',window:'Advanced'}[lesson.id]);
export function validateSql(sql) {
  if (typeof sql !== 'string' || !sql.trim() || sql.length > 4000) throw new Error('Enter a query of 1–4,000 characters.');
  // A deliberately narrow read-only surface. Comments, strings and identifiers containing
  // these tokens are also refused; this is a learning lab, not a general SQL console.
  if (!/^\s*(SELECT|WITH|EXPLAIN\s+QUERY\s+PLAN\s+SELECT)\b/i.test(sql) || /;\s*\S|--|\/\*|\b(attach|detach|pragma|load_extension|insert|update|delete|drop|alter|create|replace|vacuum)\b/i.test(sql)) throw new Error('Use one read-only SELECT, WITH or EXPLAIN QUERY PLAN SELECT query. Comments and database changes are not supported.');
  return sql.trim().replace(/;$/, '');
}
