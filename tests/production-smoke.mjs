// Requires `npm run build`. Tests that production cannot enable the local demo.
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3001';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3001'],{env:{...process.env,NODE_ENV:'production',REDIRECTED_DEMO_MODE:'true',APP_URL:base,SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_PUBLISHABLE_KEY:'',ADMIN_USER_ID:''},stdio:'pipe'});
let startup='';child.stderr.on('data',chunk=>{startup+=chunk.toString();});
try{
  let ready=false;
  for(let i=0;i<50;i++){
    if(child.exitCode!==null)throw new Error('Preview could not start: '+startup);
    try{const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  assert.ok(ready,'Production test server did not start');
  const admin=await fetch(base+'/admin',{redirect:'manual'});assert.equal(admin.status,307);assert.match(admin.headers.get('location'),/\/admin\/login/);
  const denied=await fetch(base+'/api/admin/invitations',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({guest_name:'must not create',format_type:'Sessions',season_number:1,already_recorded:false})});assert.equal(denied.status,503);
  const guest=await(await fetch(base+'/invite/'+'a'.repeat(64))).text();assert.match(guest,/This link is unavailable/);assert.doesNotMatch(guest,/LOCAL DEMO/);
  assert.doesNotMatch(await(await fetch(base+'/admin/login')).text(),/Open demo dashboard/);
  console.log('Production smoke passed: demo flag cannot bypass admin authentication or activate sample invitation links.');
}finally{child.kill('SIGTERM');}
