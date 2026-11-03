import { SQL_LESSONS } from './sqlLab.mjs';
import { newGitRepo } from './gitLab.mjs';
export const SQL_SESSION_KEY='interviewiq.sqlLabSession.v1';
export const GIT_SESSION_KEY='interviewiq.gitLabSession.v1';
export function normalizeSqlSession(value) {
 const result={selectedId:'filter',drafts:{},overview:false};
 if(!value||typeof value!=='object')return result;
 if(SQL_LESSONS.some(l=>l.id===value.selectedId))result.selectedId=value.selectedId;
 result.overview=value.overview===true;
 for(const lesson of SQL_LESSONS)if(typeof value.drafts?.[lesson.id]==='string'&&value.drafts[lesson.id].length<=4000)result.drafts[lesson.id]=value.drafts[lesson.id];
 return result;
}
export function normalizeGitSession(value) {
 const fallback={repo:newGitRepo(),history:[],done:{},exerciseId:'',exerciseStep:0,checkpoint:null};
 if(!value||typeof value!=='object')return fallback;
 const r=value.repo;
 if(!r||!Array.isArray(r.commits)||r.commits.length<1||r.commits.length>80||!r.branches||typeof r.branches!=='object'||Array.isArray(r.branches))return fallback;
 const ids=new Set();
 for(const c of r.commits){
  if(!c||!/^c\d{1,4}$/.test(c.id)||ids.has(c.id)||!Array.isArray(c.parents)||c.parents.length>2||c.parents.some(id=>!ids.has(id))||typeof c.text!=='string'||c.text.length>5000||typeof c.message!=='string'||c.message.length>200)return fallback;
  ids.add(c.id);
 }
 const entries=Object.entries(r.branches);
 if(!entries.length||entries.length>80||entries.some(([name,id])=>!(/^[a-z][a-z0-9-]{0,24}$/).test(name)||['constructor','prototype'].includes(name)||!ids.has(id))||!Object.hasOwn(r.branches,r.branch)||typeof r.work!=='string'||r.work.length>5000||!(r.stage===null||typeof r.stage==='string'&&r.stage.length<=5000)||!(r.merge===null||ids.has(r.merge))||!Number.isInteger(r.next)||r.next<=Math.max(...r.commits.map(c=>Number(c.id.slice(1)))))return fallback;
 const repo={commits:r.commits.map(c=>({id:c.id,parents:[...c.parents],text:c.text,message:c.message})),branches:Object.fromEntries(entries),branch:r.branch,work:r.work,stage:r.stage,merge:r.merge,next:r.next,reflog:Array.isArray(r.reflog)?r.reflog.filter(id=>ids.has(id)).slice(0,40):[]};
 return {repo,checkpoint:value.checkpoint?normalizeGitSession({repo:value.checkpoint}).repo:null,history:Array.isArray(value.history)?value.history.filter(s=>typeof s==='string').slice(0,12).map(s=>s.slice(0,500)):[],done:Object.fromEntries(['add','commit','switch','merge','revert'].map(k=>[k,value.done?.[k]===true])),exerciseId:typeof value.exerciseId==='string'?value.exerciseId.slice(0,40):'',exerciseStep:Number.isInteger(value.exerciseStep)?Math.max(0,Math.min(value.exerciseStep,20)):0};
}
