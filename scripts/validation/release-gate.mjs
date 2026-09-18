import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const output = mkdtempSync(join(tmpdir(), 'interviewiq-release-'));
const commands = [
  ['npm', ['run','test:unit']], ['npm',['run','lint']], ['npm',['run','build']],
  ['npx',['playwright','test','e2e/daily-practice.spec.js','e2e/practice-sync.spec.js','e2e/practice-accessibility.spec.js','e2e/production-detective.spec.js','e2e/detective-scroll.spec.js','e2e/reader-experience.spec.js','--project=chromium','--project=firefox','--project=webkit','--workers=3',`--output=${join(output,'matrix')}`,'--reporter=line']],
  ['npx',['playwright','test','e2e/onboarding-personalization.spec.js','e2e/navigation-content.spec.js','e2e/company-mocks-weak-spots.spec.js','--grep','TC0[1-8]','--project=chromium','--workers=2',`--output=${join(output,'original-eight')}`,'--reporter=line']],
];
for (const [command,args] of commands) {
  const result=spawnSync(command,args,{stdio:'inherit',env:{...process.env,E2E_BROWSER_MATRIX:'1'}});
  if(result.status!==0) { console.error(`Release gate failed: ${command} ${args.join(' ')}. Artifacts: ${output}`); process.exit(result.status||1); }
}
console.log(`Release gate passed. Artifacts: ${output}`);
