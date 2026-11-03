import {REPOSITORY_CHECKS} from './repositoryAssessmentChecks.mjs';
import { assessmentSource, findAssessment } from './repositoryAssessment.mjs';
import { executeJavaProgram, CODE_RUN_LIMITS } from './codeRunner.mjs';
import { randomUUID } from 'node:crypto';

// Kept out of page imports, static props and downloadable example checks.
export const ASSESSMENT_HIDDEN_CHECKS = `class Main {
 static void check(boolean ok) { if (!ok) throw new AssertionError("Assessment contract failed"); }
 static void invalid(Runnable r) { try {r.run();} catch(IllegalArgumentException expected){return;} throw new AssertionError("Expected invalid input rejection"); }
 static void overflow(Runnable r) { try {r.run();} catch(ArithmeticException expected){return;} throw new AssertionError("Expected overflow rejection"); }
 public static void main(String[] args) {
  ShippingPolicy p=new ShippingPolicy(); Checkout c=new Checkout(p);
  check(p.fee(0)==50); check(p.fee(999)==50); check(p.fee(1000)==0); check(p.fee(Long.MAX_VALUE)==0);
  invalid(()->p.fee(-1)); invalid(()->new Checkout(null));
  invalid(()->c.total(-1,1)); invalid(()->c.total(1,0)); invalid(()->c.total(1,-1));
  check(c.total(0,1)==50); check(c.total(999,1)==1049); check(c.total(1000,1)==1000);
  check(c.total(1,1000)==1000); check(c.total(Long.MAX_VALUE,1)==Long.MAX_VALUE);
  overflow(()->c.total(Long.MAX_VALUE,2));
  Checkout custom=new Checkout(new ShippingPolicy(){long fee(long subtotal){return 7;}});
  check(custom.total(2,3)==13); overflow(()->custom.total(Long.MAX_VALUE,1));
 }
}`;
export async function runRepositoryAssessment(files, mode, options = {}) {
  const assessmentId=options.assessmentId||'checkout'; const spec=findAssessment(assessmentId);
  if (!['examples','assessment'].includes(mode)) throw new Error('Choose examples or assessment checks.');
  const marker = `ASSESSMENT-${randomUUID()}`;
  // The marker is emitted by our harness only after all checks return normally.
  const harness=mode==='assessment'?(assessmentId==='checkout'?ASSESSMENT_HIDDEN_CHECKS:REPOSITORY_CHECKS[assessmentId]):spec.examples;
  const marked=harness.replace(/\n\s*}\n}$/,`\n System.out.println("${marker}");\n }\n}`);
  const code=assessmentSource(files,marked,assessmentId);
  if(code.length>CODE_RUN_LIMITS.maxCodeChars)throw new Error('The combined files and checks exceed the runner source limit. Shorten your implementation.');
  const result = await executeJavaProgram({language:'java', javaVersion:17, code, stdin:''}, options);
  if (!result.ok) return { statusCode:result.status, error:result.error };
  const data = result.value;
  const passed = data.phase === 'run' && data.exitCode === 0 && !data.timedOut && !data.outputLimited && !data.signal && data.stdout.split(/\r?\n/).includes(marker);
  const category=data.phase!=='run'?'compile':data.timedOut?'limits':data.stdout.match(/GROUP:([a-z]+)(?![\s\S]*GROUP:)/)?.[1]||'contract';
  const criterion=spec.rubric.find(c=>c.id===category);
  const feedback=passed?null:{id:`assessment-${assessmentId}`,title:spec.title,href:`/assessments?task=${assessmentId}`,detail:criterion?`Revisit ${criterion.title.toLowerCase()}. ${criterion.detail}`:category==='compile'?'The files did not compile. Check class names, method signatures and Java 17 syntax.':category==='limits'?'Execution exceeded its limits. Check termination and blocking before retrying.':'Revisit validation, boundary inputs and the supplied collaborator contract.',drill:spec.drill};
  return {statusCode:200, passed, mode, feedback, output:mode === 'examples' ? [data.stdout.replace(marker,''),data.stderr].filter(Boolean).join('\n') : '', message:passed ? 'Practice checks passed for this submission.' : 'Checks did not pass. Review the contract, boundaries and overflow handling.'};
}
