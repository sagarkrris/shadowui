import {ADDITIONAL_ASSESSMENTS,examplesHarness} from './repositoryAssessmentCatalog.mjs';
export const ASSESSMENT_KEY = 'interviewiq.repositoryAssessment.v1';
export const ASSESSMENT_MINUTES = 35;
export const ASSESSMENT_FILES = {
  'ShippingPolicy.java': `class ShippingPolicy {\n  // Nonnegative subtotal in cents. Free at 1000 or more, otherwise 50 cents.\n  long fee(long subtotal) {\n    throw new UnsupportedOperationException("Implement fee");\n  }\n}\n`,
  'Checkout.java': `class Checkout {\n  private final ShippingPolicy shipping;\n  Checkout(ShippingPolicy shipping) {\n    this.shipping = shipping;\n  }\n  // Positive quantity, nonnegative unit price in cents.\n  // Validate input, calculate subtotal, add shipping, reject overflow.\n  long total(long unitPrice, int quantity) {\n    throw new UnsupportedOperationException("Implement total");\n  }\n}\n`,
};
export const ASSESSMENT_CONTRACT = 'Implement a single-threaded checkout in integer cents. ShippingPolicy.fee rejects negative subtotals with IllegalArgumentException; shipping is 50 below 1000 and zero at or above 1000. Checkout rejects a null policy, negative unit price or nonpositive quantity with IllegalArgumentException. Multiply unit price by quantity, ask the supplied policy for shipping, and add it to the subtotal. Multiplication or addition overflow must throw ArithmeticException. Do not replace or bypass the supplied policy. No I/O or external services are required.';
export const ASSESSMENT_EXAMPLES = `class Main {
  static void check(boolean condition) { if (!condition) throw new AssertionError("Contract not satisfied"); }
  public static void main(String[] args) {
    Checkout checkout = new Checkout(new ShippingPolicy());
    check(checkout.total(100, 2) == 250);
    check(checkout.total(500, 2) == 1000);
    System.out.println("EXAMPLES PASSED");
  }
}`;
export const REPOSITORY_ASSESSMENTS=[{
 id:'checkout',title:'Build a checkout contract',minutes:35,contract:ASSESSMENT_CONTRACT,files:ASSESSMENT_FILES,examples:ASSESSMENT_EXAMPLES,
 hints:['Validate the constructor dependency and all numeric inputs.','Use exact multiplication and addition; keep the supplied policy.'],
 rubric:[{id:'validation',title:'Valid inputs and dependencies',max:2,detail:'0: missing validation; 1: common validation; 2: null, invalid quantities and negative values rejected.'},{id:'boundary',title:'Money boundaries',max:2,detail:'0: boundary errors; 1: common totals; 2: threshold equality and both arithmetic overflow paths covered.'},{id:'contract',title:'Policy contract',max:2,detail:'0: bypasses the dependency; 1: standard policy works; 2: supplied custom policy remains authoritative.'},{id:'explanation',title:'Design reasoning',max:2,detail:'0: no rationale; 1: explains integer cents; 2: explains currency, rounding, bounds and test evidence.'}],
 followUp:'How would multiple currencies change this design? Represent the currency explicitly and define rounding at operations that create fractions. Never silently mix currencies or use floating point for exact cents.',
 drill:'Check null policy, zero quantity, subtotal 999/1000 and both multiplication and addition overflow.',source:'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Math.html'
},...ADDITIONAL_ASSESSMENTS.map(a=>({...a,examples:examplesHarness(a.exampleBody)}))];
export function findAssessment(id='checkout'){const assessment=REPOSITORY_ASSESSMENTS.find(a=>a.id===id);if(!assessment)throw new Error('Choose a known assessment.');return assessment;}
export function validateAssessmentFiles(files,id='checkout') {
 const spec=findAssessment(id);const names=Object.keys(spec.files);
 if(!files||typeof files!=='object'||Array.isArray(files)||Object.keys(files).length!==names.length||names.some(name=>!Object.hasOwn(files,name)||typeof files[name]!=='string'||!files[name].trim()||files[name].length>4500))throw new Error('Supply both Java files with 1–4,500 characters each.');
 return Object.fromEntries(names.map(name=>[name,files[name]]));
}
export function assessmentSource(files,harness,id='checkout'){const spec=findAssessment(id);return [...Object.values(validateAssessmentFiles(files,id)),harness??spec.examples].join('\n');}
export function normalizeAssessment(value,id='checkout') {
 const spec=findAssessment(id);const initial={id:'',files:{...spec.files},deadline:null,submittedAt:null,notes:'',scores:{},archived:false,activeFile:Object.keys(spec.files)[0]};
 if(!value||typeof value!=='object')return initial;
 const names=Object.keys(spec.files);if(!value.files||typeof value.files!=='object'||Object.keys(value.files).length!==names.length||names.some(name=>typeof value.files[name]!=='string'||value.files[name].length>4500))return initial;
 initial.files=Object.fromEntries(names.map(name=>[name,value.files[name]]));initial.archived=value.archived===true;
 if(typeof value.id==='string'&&/^[a-z0-9-]{1,80}$/i.test(value.id))initial.id=value.id;
 if(Number.isSafeInteger(value.deadline)&&value.deadline>0)initial.deadline=value.deadline;
 if(initial.deadline&&Number.isSafeInteger(value.submittedAt)&&value.submittedAt>0)initial.submittedAt=value.submittedAt;
 if(Object.hasOwn(spec.files,value.activeFile))initial.activeFile=value.activeFile;
 initial.notes=typeof value.notes==='string'?value.notes.slice(0,4000):'';
 for(const criterion of spec.rubric)if([0,1,2].includes(value.scores?.[criterion.id]))initial.scores[criterion.id]=value.scores[criterion.id];
 return initial;
}
export function assessmentRemaining(deadline,now,minutes=ASSESSMENT_MINUTES){return deadline?Math.max(0,Math.ceil((deadline-now)/1000)):minutes*60;}
export function normalizeAssessmentWorkspace(value){
 const selected=REPOSITORY_ASSESSMENTS.some(a=>a.id===value?.selectedId)?value.selectedId:'checkout';
 const result={selectedId:selected,attempts:{},history:[]};
 for(const spec of REPOSITORY_ASSESSMENTS)result.attempts[spec.id]=normalizeAssessment(value?.attempts?.[spec.id],spec.id);
 // Preserve the original checkout-only storage format without changing its key.
 if(value?.files)result.attempts.checkout=normalizeAssessment(value);
 if(Array.isArray(value?.history))for(const item of value.history.slice(0,100)){
  if(!REPOSITORY_ASSESSMENTS.some(a=>a.id===item?.assessmentId)||!item.attempt?.id||result.history.some(h=>h.attempt.id===item.attempt.id))continue;
  const attempt=normalizeAssessment(item.attempt,item.assessmentId);if(!attempt.submittedAt)continue;
  result.history.push({assessmentId:item.assessmentId,attempt});
 }
 return result;
}
export function archiveAssessment(workspace,assessmentId,at){
 const next=normalizeAssessmentWorkspace(workspace);const attempt=next.attempts[assessmentId];
 if(!attempt.deadline||attempt.archived)return next;
 const id=attempt.id||`legacy-${assessmentId}-${attempt.deadline}`;
 if(next.history.some(h=>h.attempt.id===id))return next;
 if(next.history.length>=100)throw Error('Attempt history is full. Export your workspace and remove an archived attempt before starting another.');
 const submitted={...attempt,id,archived:true,submittedAt:attempt.submittedAt||Math.min(at,attempt.deadline)};
 next.attempts[assessmentId]=submitted;next.history.push({assessmentId,attempt:structuredClone(submitted)});return next;
}
