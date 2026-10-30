const {execSync}=require('child_process');const path=require('path');
// Checks every lesson whose quiz differs from origin/main (run after merging a feature/quizzes-* branch).
//   node scripts/dev/quiz-check.js [--hard]   --hard also prints the d:3 questions with answers, for re-solving by hand
const files=['classification','clustering','concepts','language','neural','regression','sequences','statistics','datascience','mltoolbox','deeplearning','vision','nlp','ai'];
const load=(f,ref)=>{const src=ref?execSync(`git show ${ref}:content/${f}.js`,{maxBuffer:1e8}).toString():require('fs').readFileSync(`content/${f}.js`,'utf8');const m={exports:{}};new Function('module','exports','require',src)(m,m.exports,require);return m.exports};
const norm=s=>s.toLowerCase().replace(/\s+/g,' ').trim();
let tot=0,issues=[],hard=[];
for(const f of files){const nw=load(f),old=load(f,'origin/main');const om=Object.fromEntries(old.map(l=>[l.id,l]));
 for(const l of nw){const o=om[l.id];if(!o||JSON.stringify(o.quiz)===JSON.stringify(l.quiz))continue;
  if((l.quiz||[]).some(x=>!x.d)){console.log('(no d tags) '+l.id+': '+(l.quiz||[]).length+' questions');continue}
  const q=l.quiz;const d=[0,0,0,0];const ans=[0,0,0,0];const seen=new Set();let run=1;
  q.forEach((x,i)=>{d[x.d||0]++;ans[x.a]++;const k=norm(x.q);if(seen.has(k))issues.push(`${l.id}#${i} duplicate`);seen.add(k);
   
   if(new Set(x.o.map(o=>o.replace(/\s+/g,' ').trim())).size!==4)issues.push(`${l.id}#${i} duplicate options`);
   if(/all of the above|none of the above|both a and b/i.test(x.o.join(' ')))issues.push(`${l.id}#${i} banned option`);
   if(![1,2,3].includes(x.d))issues.push(`${l.id}#${i} bad d=${x.d}`);
   if(x.d===3)hard.push({id:l.id,i,q:x.q,o:x.o,a:x.a,why:x.why});
   const oq=(o.quiz||[]);});
  if(q.length!==12)issues.push(`${l.id} has ${q.length} questions`);
  if(d[1]<3||d[1]>5||d[2]<4||d[2]>6||d[3]<2||d[3]>4)issues.push(`${l.id} difficulty mix ${d.slice(1)}`);
  
  const oldq=new Set((o.quiz||[]).map(x=>norm(x.q)));const kept=q.filter(x=>oldq.has(norm(x.q))).length;
  if(kept!==(o.quiz||[]).length)issues.push(`${l.id} changed/removed old questions (kept ${kept}/${(o.quiz||[]).length})`);
  tot++;console.log(f.padEnd(14),l.id.padEnd(48),'q',q.length,'d',d.slice(1).join('/'),'ans',ans.join('/'),'old',(o.quiz||[]).length);}}
console.log('\nlessons',tot,'hard',hard.length);console.log('ISSUES',issues.length);issues.forEach(x=>console.log(' -',x));
if(process.argv.includes('--hard'))hard.forEach((x,n)=>console.log(n+' ['+x.id.slice(0,18)+'#'+x.i+'] '+x.q.replace(/\s+/g,' ')+'\n  =>'+x.o[x.a].replace(/\s+/g,' ')+' | '+x.why.replace(/\s+/g,' ')));
