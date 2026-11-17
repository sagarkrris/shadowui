import { clearPrivateBrowserData } from '../lib/localStoragePrivacy.mjs';
import { cloudHydrationNeedsChoice } from '../lib/cloudStateOwnership.mjs';
import { createPrepProgressState } from '../lib/prepProgressBrain.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCloudDeviceSnapshot } from '../lib/cloudDeviceSnapshot.mjs';
import { loadSessionSnapshot } from '../lib/sessionPersistence.mjs';
function storage(initial={}) {
  const data=new Map(Object.entries(initial));
  return {get length(){return data.size;},key(i){return [...data.keys()][i]??null;},getItem(k){return data.get(k)??null;},setItem(k,v){data.set(k,String(v));},removeItem(k){data.delete(k);},snapshot(){return Object.fromEntries(data);}};
}
const initial={'interviewiq.diagnostic.v1':'A reasoning','interviewiq.learningNotebook.v1':'A notebook','interviewiq.careerToolkit.v1':'A resume','unrelated':'keep'};
test('choosing empty cloud for another account clears device-only and synchronized private caches before reset',()=>{
  const local=storage(initial),transient=storage({'interviewiq.privateDraft':'A transient','unrelated':'keep'});
  const next=applyCloudDeviceSnapshot(local,{session:{}},{accountChanged:true,transientStorage:transient});
  assert.equal(local.getItem('interviewiq.diagnostic.v1'),null);assert.equal(local.getItem('interviewiq.learningNotebook.v1'),null);assert.deepEqual(JSON.parse(local.getItem('interviewiq.careerToolkit.v1')).state,{});
  assert.equal(transient.getItem('interviewiq.privateDraft'),null);assert.equal(local.getItem('unrelated'),'keep');assert.equal(transient.getItem('unrelated'),'keep');assert.equal(loadSessionSnapshot(local).candidateProfile,null);assert.deepEqual(next.questionMemory.questions,{});
});
test('ordinary same-account full snapshots preserve device-only diagnostic results while reconciling supported learning',()=>{
  const local=storage(initial);
  applyCloudDeviceSnapshot(local,{session:{},learningState:{'interviewiq.learningNotebook.v1':'[]'},toolkitState:{interviews:[]}});
  assert.equal(local.getItem('interviewiq.diagnostic.v1'),'A reasoning');assert.equal(local.getItem('interviewiq.learningNotebook.v1'),'[]');assert.deepEqual(JSON.parse(local.getItem('interviewiq.careerToolkit.v1')).state,{interviews:[]});
});
test('a quota failure rolls back local caches and leaves the account choice unresolved',()=>{
  const local=storage(initial),original=local.setItem;let failed=false;
  local.setItem=(key,value)=>{if(!failed && key==='interviewiq.careerToolkit.v1'){failed=true;throw Error('quota');}original(key,value);};
  assert.throws(()=>applyCloudDeviceSnapshot(local,{session:{}},{accountChanged:true}),/quota/);assert.deepEqual(local.snapshot(),initial);
});
test('unserializable cloud payload cannot clear device data',()=>{
  const local=storage(initial),snapshot={session:{}};snapshot.toolkitState={cycle:snapshot};
  assert.throws(()=>applyCloudDeviceSnapshot(local,snapshot,{accountChanged:true}));assert.deepEqual(local.snapshot(),initial);
});

test('empty versioned progress defaults do not block ordinary cloud hydration',()=>{
  assert.equal(cloudHydrationNeedsChoice({local:{prepProgressState:createPrepProgressState(),questionMemory:{version:1,questions:{}}},remote:{session:{}},userId:'same-account'}),false);
});

test('discarding unowned legacy data also clears caches outside the synchronized snapshot',()=>{const local=storage(initial);applyCloudDeviceSnapshot(local,{session:{}},{discardUnownedData:true});assert.equal(local.getItem('interviewiq.diagnostic.v1'),null);assert.equal(local.getItem('interviewiq.learningNotebook.v1'),null);});

test('unowned reflection-only, pending-answer and canvas data require import consent',()=>{for(const session of [{practice:{plan:{reflection:'Private reflection'}}},{practice:{pending:{text:'Private submitted answer'}}},{systemDesignCanvas:{sections:{requirements:'Private system requirements'}}},{interviewSession:{profile:{name:'Private candidate'}}}])assert.equal(cloudHydrationNeedsChoice({local:{session},remote:null,userId:'new-account'}),true);});

test('blocked storage cannot prevent post-revocation navigation cleanup of the other area',()=>{const transient=storage({'interviewiq.privateDraft':'private'});const browser=Object.defineProperty({sessionStorage:transient},'localStorage',{get(){throw Error('blocked');}});assert.deepEqual(clearPrivateBrowserData(browser),{localStorage:false,sessionStorage:true});assert.equal(transient.getItem('interviewiq.privateDraft'),null);});
