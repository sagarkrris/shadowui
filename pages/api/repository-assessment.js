import { runRepositoryAssessment } from '../../lib/repositoryAssessmentRunner.mjs';
import { validateAssessmentFiles } from '../../lib/repositoryAssessment.mjs';
import { runnerConfiguration } from '../../lib/challengeRunner.mjs';
import { requireConfiguredUser } from '../../lib/apiAuth.mjs';
import { checkDistributedRateLimit } from '../../lib/redisRateLimit.mjs';
import { getClientAddress } from '../../lib/requestSecurity.mjs';
export const config = { api: { bodyParser: {sizeLimit:'16kb'} } };
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'GET') return res.status(200).json({configured:Boolean(runnerConfiguration())});
  if (req.method !== 'POST') {res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Use POST.'});}
  if (!String(req.headers['content-type'] || '').startsWith('application/json') || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({error:'Use a same-site JSON request.'});
  const auth=await requireConfiguredUser(req);
  if(auth.required&&!auth.user)return res.status(401).json({error:'Sign in to use the isolated runner.'});
  const rate=await checkDistributedRateLimit(`repository-run:${auth.user?.id||getClientAddress(req)}`,{limit:6});
  if(!rate.ok){res.setHeader('Retry-After',String(rate.retryAfter));return res.status(429).json({error:'Please wait before running more checks.'});}
  try {const files=validateAssessmentFiles(req.body?.files,req.body?.id||'checkout');const {statusCode,...result}=await runRepositoryAssessment(files,req.body?.mode,{assessmentId:req.body?.id||'checkout'});return res.status(statusCode).json(result);}
  catch(error){return res.status(400).json({error:error.message});}
}
