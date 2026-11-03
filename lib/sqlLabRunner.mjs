import { spawn } from 'node:child_process';
import { SQL_SCHEMA, SQL_LESSONS, validateSql } from './sqlLab.mjs';

// An in-memory database only: no file paths, extensions, credentials or shell.
const workerSource = `
let input=''; process.stdin.on('data',chunk=>input+=chunk); process.stdin.on('end',()=>{
try {
 const workerData=JSON.parse(input);
 const { DatabaseSync } = require('node:sqlite');
 const db = new DatabaseSync(':memory:', {allowExtension:false});
 try {
  db.exec('PRAGMA hard_heap_limit=16777216; PRAGMA temp_store=MEMORY;');
  db.exec(workerData.schema); db.exec('PRAGMA query_only=ON;');
  const run = sql => {
   const stmt = db.prepare(sql); stmt.setReturnArrays(true); const columns = stmt.columns().map(c=>c.name); const rows=[];
   for (const row of stmt.iterate()) { if(rows.length>=100) throw Error('Result exceeds 100 rows. Add LIMIT.'); rows.push(row); }
   return {columns, rows};
  };
  const results = workerData.queries.map(run);
  process.stdout.write(JSON.stringify({results}));
 } finally { db.close(); }
} catch(error) { process.stdout.write(JSON.stringify({error:error.message})); }
});
`;
export function executeSqlQueries(queries, schema = SQL_SCHEMA, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ queries: queries.map(validateSql), schema });
    const child = spawn(process.execPath, ['--max-old-space-size=32', '-e', workerSource], { env: {}, stdio: ['pipe', 'pipe', 'ignore'] });
    let output = ''; let tooLarge = false;
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Query exceeded the two-second time limit.')); }, timeout);
    child.stdout.on('data', chunk => { output += chunk; if (output.length > 65536) { tooLarge = true; child.kill('SIGKILL'); } });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.stdin.on('error', () => {});
    child.once('close', code => {
      clearTimeout(timer);
      if (tooLarge || code !== 0) return reject(new Error('SQL exceeded its execution or output limit.'));
      try { const result = JSON.parse(output); result.error ? reject(new Error(result.error)) : resolve(result.results); }
      catch { reject(new Error('SQL execution is unavailable on this host.')); }
    });
    child.stdin.end(payload);
  });
}
export async function runSqlLab({ sql, lessonId, check = false }) {
  validateSql(sql);
  const lesson = SQL_LESSONS.find(l => l.id === lessonId);
  if (!lesson) throw new Error('Choose a known SQL lesson.');
  if (check) {
    // A second dataset catches hard-coded names, counts and salary assumptions.
    const schemas = [SQL_SCHEMA, `${SQL_SCHEMA} DELETE FROM engineers; INSERT INTO engineers VALUES (6,'Rae',1,80),(7,'Kai',1,80),(8,'Max',NULL,120);`];
    const results = await Promise.all(schemas.map(schema => executeSqlQueries([sql, lesson.expected], schema)));
    const passed = results.every(([actual, expected]) => JSON.stringify(actual) === JSON.stringify(expected));
    const [actual, expected] = results.find(([a,b]) => JSON.stringify(a) !== JSON.stringify(b)) || results[0];
    const reason = JSON.stringify(actual.columns) !== JSON.stringify(expected.columns) ? 'Check the output column names and order.' : actual.rows.length !== expected.rows.length ? 'Check missing or extra rows, NULL handling and join multiplicity.' : 'Check values and deterministic row order, including ties.';
    const drills={filter:'Compare team_id IS NULL with team_id = NULL and explain the different row counts.',join:'Compare LEFT JOIN with INNER JOIN on the seed data; identify the engineer lost by INNER JOIN.',group:'Compare COUNT(*) and COUNT(team_id), then repeat on an empty filtered input.',window:'Rank every salary without PARTITION BY, and compare DENSE_RANK with ROW_NUMBER for the salary tie.',projection:'Return one computed expression under two different aliases; inspect the column headers.',ordering:'List equal salaries and add a name tie breaker before applying LIMIT.',aggregates:'Run COUNT and AVG over an empty input and explain zero versus NULL.',subquery:'Run the scalar aggregate alone, then use its value in a strict comparison and test equality.',cte:'Run the CTE body alone, verify its columns, then add the outer query.',exists:'List team ids containing NULL and compare a nullable NOT IN with a correlated NOT EXISTS.', 'window-frames':'Compare an explicit ROWS running sum with a salary-ordered default frame around tied salaries.','query-plans':'Inspect an equality-filter plan and a salary-only sort plan; explain what the index can and cannot establish.'};
    return { result: results[0][0], passed, checks: schemas.length, steps: [], feedback: passed ? null : {id:`sql-${lesson.id}`, title:lesson.title, detail:reason, href:`/labs/sql?lesson=${lesson.id}`, drill:drills[lesson.id]||lesson.challenge} };
  }
  const curated = sql.trim() === lesson.query;
  const queries = curated ? lesson.steps.map(s => s[2] || lesson.query) : [sql];
  const results = await executeSqlQueries(queries);
  return { result: results.at(-1), steps: curated ? lesson.steps.map(([title, explanation], i) => ({ title, explanation, ...results[i] })) : [] };
}
