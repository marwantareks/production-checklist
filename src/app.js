/* Page behavior. Data (C, G, D, X, DEEP, CI) and PromptKit are injected by scripts/build.mjs before this file. */
var RN={own:"Own",guard:"Guardrail",del:"Delegate"};
var RD={own:"The architect decides this.",guard:"The architect sets the standard; teams implement it.",del:"Team or tool detail; the architect only needs to know it exists."};
function tag(n){return D.indexOf(n)>=0?"del":(G.indexOf(n)>=0?"guard":"own")}

var ST={decided:"Decided",deferred:"Deferred",missing:"Missing",na:"Not applicable"};
var SVGA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
var ICON={
  decided:SVGA+'<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  deferred:SVGA+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  missing:SVGA+'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.6v.01"/></svg>',
  na:SVGA+'<circle cx="12" cy="12" r="9"/><path d="M6 18L18 6"/></svg>'
};
var IDX={},HUE={};
C.forEach(function(c){c[3].forEach(function(it){IDX[it[0]]=it;HUE[it[0]]=c[1]})});
var TOTAL=Object.keys(IDX).length;
var review={};
try{
  var raw=localStorage.getItem("prc.reviewStatus");
  if(raw){var o=JSON.parse(raw);if(o&&typeof o==="object"){Object.keys(o).forEach(function(k){if(own(IDX,k)&&typeof o[k]==="string"&&own(ST,o[k]))review[k]=o[k]})}}
}catch(e){}
function save(){try{localStorage.setItem("prc.reviewStatus",JSON.stringify(review))}catch(e){}}
/* Concerns marked not applicable leave the denominator, so progress reflects only what applies. */
function tally(items){
  var c={decided:0,deferred:0,missing:0,na:0,total:0};
  items.forEach(function(id){c.total++;var v=review[id];if(v)c[v]++});
  c.den=c.total-c.na;c.done=c.decided+c.deferred+c.missing;
  return c;
}
function allIds(){return Object.keys(IDX).map(function(k){return parseInt(k,10)})}
function pct(n,d){return d>0?(n/d*100):0}

var cat=-1,dual=false,sel=null,q="",sf="all",af="all";
var chips=document.getElementById("chips"),stChips=document.getElementById("stChips"),grid=document.getElementById("grid"),dualBtn=document.getElementById("dualBtn"),themeBtn=document.getElementById("themeBtn"),root=document.documentElement,qIn=document.getElementById("q"),afRow=document.getElementById("afRow"),afChips=document.getElementById("afChips");

function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function chip(label,on,fn){var b=el("button","chip",label);b.type="button";b.setAttribute("aria-pressed",on?"true":"false");b.onclick=fn;return b}

/* Counts for the agent finding filter. The row only shows once a finding has been imported, and a chip that has no concerns left falls back to All. */
function afCount(){
  var c={any:0,none:0,r:{}};
  allIds().forEach(function(id){var f=FIND[id];if(f){c.any++;c.r[f.result]=(c.r[f.result]||0)+1}else c.none++});
  return c;
}
function drawAgentFilter(){
  var a=afCount();
  if(af!=="all"&&!(af==="any"?a.any:af==="none"?a.none:a.r[af]))af="all";
  afRow.hidden=a.any===0;
  afChips.innerHTML="";
  if(!a.any)return;
  function add(label,key){afChips.appendChild(chip(label,af===key,function(){af=key;render()}))}
  add("All","all");
  add("With findings ("+a.any+")","any");
  Object.keys(RL).forEach(function(k){if(a.r[k])add(RL[k]+" ("+a.r[k]+")",k)});
  if(a.none)add("No finding yet ("+a.none+")","none");
}
function drawChips(){
  drawAgentFilter();
  chips.innerHTML="";
  chips.appendChild(chip("All categories",cat<0,function(){cat=-1;render()}));
  C.forEach(function(c,i){
    var short=c[0].split(" and ")[0].split(",")[0];
    chips.appendChild(chip(short,cat===i,function(){cat=i;render()}));
  });
  stChips.innerHTML="";
  [["all","All"],["none","Not reviewed"],["decided","Decided"],["deferred","Deferred"],["missing","Missing"],["na","Not applicable"]].forEach(function(o){
    stChips.appendChild(chip(o[1],sf===o[0],function(){sf=o[0];render()}));
  });
}
function drawProgress(){
  var c=tally(allIds());
  document.getElementById("progText").textContent=c.done+" of "+c.den+" reviewed"+(c.na?", "+c.na+" not applicable":"");
  document.getElementById("nDec").textContent=c.decided;
  document.getElementById("nDef").textContent=c.deferred;
  document.getElementById("nMiss").textContent=c.missing;
  document.getElementById("nNA").textContent=c.na;
  document.getElementById("nNone").textContent=c.den-c.done;
  var m=document.getElementById("meter").children;
  m[0].style.width=pct(c.decided,c.den)+"%";
  m[1].style.width=pct(c.deferred,c.den)+"%";
  m[2].style.width=pct(c.missing,c.den)+"%";
  document.getElementById("meter").setAttribute("aria-label","Review progress: "+c.decided+" decided, "+c.deferred+" deferred, "+c.missing+" missing, "+(c.den-c.done)+" not reviewed, "+c.na+" not applicable");
}
function block(label,text){var b=el("div","blk");b.appendChild(el("strong",null,label));b.appendChild(el("p",null,text));return b}
function setStatus(id,v){
  if(v)review[id]=v;else delete review[id];
  save();render();
  var b=v?grid.querySelector('.sb[data-st="'+v+'"]'):grid.querySelector('.pill[aria-expanded="true"]');
  if(b)b.focus();
}
function goTo(id){
  q="";qIn.value="";dual=false;sf="all";af="all";cat=-1;sel=id;render();
  var p=grid.querySelector('.pill[aria-expanded="true"]');
  if(p){alignTo(p.closest(".sec")||p);p.focus({preventScroll:true})}
}
function render(){
  drawChips();drawProgress();drawExtras();drawSave();if(mode==="agent")updateAgent();grid.innerHTML="";var n=0;
  dualBtn.setAttribute("aria-pressed",dual?"true":"false");
  C.forEach(function(c,i){
    if(cat>=0&&cat!==i)return;
    var items=c[3].filter(function(it){
      if(dual&&!it[3])return false;
      var st=review[it[0]]||"none";
      if(sf!=="all"&&st!==sf)return false;
      if(af!=="all"){var fd=FIND[it[0]];if(af==="none"){if(fd)return false}else if(!fd||(af!=="any"&&fd.result!==af))return false}
      if(q){var s=(it[1]+" "+it[2]).toLowerCase();if(s.indexOf(q)<0)return false}
      return true;
    });
    if(!items.length)return;n+=items.length;
    var tc=tally(c[3].map(function(it){return it[0]}));
    var sec=el("section","sec h-"+c[1]);
    var sh=el("div","sh");sh.appendChild(el("h3",null,c[0]));
    sh.appendChild(el("span","cnt",(items.length!==c[3].length?items.length+" of "+c[3].length+" shown, ":"")+tc.done+" of "+tc.den+" reviewed"+(tc.na?", "+tc.na+" not applicable":"")));
    sec.appendChild(sh);sec.appendChild(el("p","sd",c[2]));
    var w=el("div","pills");var open=null;
    items.forEach(function(it){
      var id=it[0],st=review[id];
      var p=el("button","pill"+(it[3]?" dual":""));p.type="button";
      p.appendChild(el("span","dot d-"+tag(id)));
      p.appendChild(document.createTextNode(it[1]));
      if(st){var b=el("span","st st-"+st);b.innerHTML=ICON[st];p.appendChild(b)}
      if(FIND[id]){var ag=el("span","ag");ag.innerHTML=SPARK;p.appendChild(ag)}
      var on=sel===id;
      p.setAttribute("aria-expanded",on?"true":"false");
      p.setAttribute("aria-label",it[1]+(st?", "+ST[st].toLowerCase():"")+(FIND[id]?", agent finding: "+RL[FIND[id].result].toLowerCase():"")+(it[3]?", fits two categories":""));
      if(on){p.setAttribute("aria-controls","detail");open=it}
      p.onclick=function(){sel=on?null:id;render();var x=grid.querySelector('.pill[aria-expanded="true"]');if(x)x.focus()};
      w.appendChild(p);
    });
    sec.appendChild(w);
    if(open)sec.appendChild(detail(open,c[1]));
    grid.appendChild(sec);
  });
  if(!n)grid.appendChild(el("p","empty","No concepts match. Clear the search or turn off a filter."));
}
dualBtn.onclick=function(){dual=!dual;render()};
qIn.oninput=function(e){q=e.target.value.trim().toLowerCase();render()};
document.getElementById("resetBtn").onclick=function(){
  if(Object.keys(review).length&&window.confirm("Clear all review marks in this browser?")){review={};save();render()}
};

function syncTheme(){var dark=root.getAttribute("data-theme")==="dark";themeBtn.setAttribute("aria-label",dark?"Switch to light theme":"Switch to dark theme");themeBtn.setAttribute("aria-pressed",dark?"true":"false")}
themeBtn.onclick=function(){
  var next=root.getAttribute("data-theme")==="dark"?"light":"dark";
  root.setAttribute("data-theme",next);
  try{localStorage.setItem("prc.theme",next)}catch(e){}
  syncTheme();
};
function svgI(d){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+d+'"/></svg>'}
function alignTo(el){
  var bar=document.querySelector(".bar"),bh=bar?bar.getBoundingClientRect().height:0;
  var top=el.getBoundingClientRect().top+window.pageYOffset-bh-16;
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({top:Math.max(0,top),behavior:reduce?"auto":"smooth"});
}
function jump(){
  var t=document.getElementById("checklist");
  t.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
function drawExtras(){
  var c=tally(allIds());
  document.getElementById("hText").textContent=c.done+" of "+c.den+" reviewed";
  document.getElementById("hPct").textContent=Math.round(pct(c.done,c.den))+"%";
  var m=document.getElementById("hMeter").children;
  m[0].style.width=pct(c.decided,c.den)+"%";
  m[1].style.width=pct(c.deferred,c.den)+"%";
  m[2].style.width=pct(c.missing,c.den)+"%";
  document.getElementById("sTotal").textContent=TOTAL;
  document.getElementById("sCats").textContent=C.length;
  var lg=document.getElementById("lgDel");if(lg)lg.hidden=D.length===0;
  var cg=document.getElementById("catGrid");cg.innerHTML="";
  C.forEach(function(cc,i){
    var tc=tally(cc[3].map(function(it){return it[0]}));
    var b=el("button","ccard");b.type="button";
    var t=el("span","tile h-"+cc[1]);t.innerHTML=svgI(CI[i]);
    var tx=el("span","ctext");
    tx.appendChild(el("h3",null,cc[0]));
    tx.appendChild(el("p",null,cc[2]));
    tx.appendChild(el("span","cm",cc[3].length+" concerns, "+tc.done+" reviewed"));
    b.appendChild(t);b.appendChild(tx);
    b.onclick=function(){q="";qIn.value="";dual=false;sf="all";af="all";cat=i;sel=null;render();jump()};
    cg.appendChild(b);
  });
}

var CHK={code:"Agent can check from code",partial:"Agent can partly check",people:"Needs people or runtime data"};
var CHKX={code:"The repository can show most of this, so the agent searches the code and reports evidence.",partial:"The agent can check part of this from code. The rest needs a person, such as settings kept outside the repository.",people:"The code cannot settle this. It needs a person or runtime data."};
var RL={found:"Found",partial:"Partial",not_found:"Not found",cannot_determine:"Cannot determine",not_applicable:"Not applicable"};
var SUG={found:"decided",not_found:"missing",not_applicable:"na"};
var SPARK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>';
function own(o,k){return Object.prototype.hasOwnProperty.call(o,k)}

var mode="browse",pilotOnly=false,openDeep={};
var FIND={};
/* Keys carry a prefix because every page on the same github.io origin shares one storage. Findings can quote code from a private repository, so they live in sessionStorage: they stay in this tab, other tabs and sites on the origin cannot read them, and they are gone when the tab closes. Review marks and the theme are harmless and stay in localStorage. */
/* Agents are told never to print secrets, but a pasted finding is untrusted text. Mask anything that looks like a credential before it is stored or shown. */
var SECRET_PATTERNS=[
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+\/=-]{12,}/gi
];
var SECRET_MASK="[secret value redacted]";
function maskSecrets(t){
  if(typeof t!=="string")return"";
  SECRET_PATTERNS.forEach(function(re){t=t.replace(re,SECRET_MASK)});
  t=t.replace(/\b([a-z][a-z0-9+.-]*:\/\/)[^\s\/:@]+:[^\s\/@]+@/gi,"$1"+"[redacted]@");
  t=t.replace(/\b([A-Za-z0-9_.-]*(?:password|passwd|pwd|secret|token|api[_-]?key|apikey|private[_-]?key|access[_-]?key|client[_-]?secret|authorization)[A-Za-z0-9_.-]*)(["']?\s*[:=]\s*)(?:"[^"\r\n]+"|'[^'\r\n]+'|["']?[^\s"',;]{4,}["']?)/gi,function(m,k,sep){return k+sep+SECRET_MASK});
  return t;
}
/* Anything cut to a limit ends with an ellipsis, and secrets are masked first so a cut can never leave half a secret behind. */
function capText(s,n){return s.length>n?s.slice(0,n-1)+"…":s}
/* A note that is too long is cut at its last whole line, never in the middle of a bullet, and ends with a visible marker. A heading left with no lines under it goes too. */
function capNote(s,n){
  if(s.length<=n)return s;
  var mark="\u2026 note shortened",lines=s.split(/\r?\n/),out=[],len=0;
  for(var i=0;i<lines.length;i++){
    var add=lines[i].length+1;
    if(len+add+mark.length>n)break;
    out.push(lines[i]);len+=add;
  }
  while(out.length&&/^[A-Za-z ]{3,20}:\s*$/.test(out[out.length-1].trim()))out.pop();
  if(!out.length)return capText(s,n);
  out.push(mark);
  return out.join("\n");
}
function cleanEvidence(arr,max){
  var ev=[];
  if(Array.isArray(arr)){
    arr.slice(0,max||8).forEach(function(e){
      if(e&&typeof e.file==="string"){
        var ln=parseInt(e.line,10);
        ev.push({file:capText(maskSecrets(e.file),200),line:(isFinite(ln)&&ln>0)?ln:0,quote:capText(maskSecrets(e.quote),200)});
      }
    });
  }
  return ev;
}
function cleanFinding(f){
  if(!f||typeof f!=="object"||typeof f.result!=="string"||!own(RL,f.result))return null;
  var rf=[];
  if(Array.isArray(f.red_flags)){
    f.red_flags.slice(0,6).forEach(function(r){
      var t=typeof r==="string"?r:(r&&typeof r.flag==="string"?r.flag:"");
      if(t)rf.push({flag:capText(maskSecrets(t),200),evidence:cleanEvidence(r&&r.evidence,5)});
    });
  }
  var rec=(f.result==="partial"||f.result==="not_found")&&typeof f.recommendation==="string"?capText(maskSecrets(f.recommendation),600):"";
  return {result:f.result,evidence:cleanEvidence(f.evidence),red_flags:rf,note:typeof f.note==="string"?capNote(maskSecrets(f.note),2000):"",recommendation:rec};
}
try{
  var rfd=sessionStorage.getItem("prc.agentFindings");
  if(rfd){var fo=JSON.parse(rfd);if(fo&&typeof fo==="object"){Object.keys(fo).forEach(function(k){var f=cleanFinding(fo[k]);if(f&&own(DEEP,k))FIND[k]=f})}}
}catch(e){}
/* Findings stay in the tab unless the person turns on Remember. That copy lives in localStorage for 30 days and goes with Clear findings. */
var REM_KEY="prc.rememberedFindings",REM_DAYS=30;
function remGet(){
  try{var r=JSON.parse(localStorage.getItem(REM_KEY));if(r&&typeof r==="object"&&typeof r.expires==="number"&&r.expires>Date.now())return r;localStorage.removeItem(REM_KEY)}catch(e){}
  return null;
}
function remWrite(){try{var t=Date.now();localStorage.setItem(REM_KEY,JSON.stringify({saved:t,expires:t+REM_DAYS*864e5,findings:FIND}));return true}catch(e){return false}}
try{
  var rm=remGet();
  if(rm&&rm.findings&&typeof rm.findings==="object")Object.keys(rm.findings).forEach(function(k){if(own(FIND,k))return;var f=cleanFinding(rm.findings[k]);if(f&&own(DEEP,k))FIND[k]=f});
}catch(e){}
function saveFind(){
  var ok=false;
  try{sessionStorage.setItem("prc.agentFindings",JSON.stringify(FIND));ok=true}catch(e){}
  if(remGet())remWrite();
  return ok;
}
var MAX_PASTE=1000000,MAX_FINDINGS=500;
var pasteOpen={},pasteDraft={},pasteMsg={};

function importFindings(text){
  var s=text.trim();
  if(!s)throw new Error("Paste the findings first.");
  if(s.length>MAX_PASTE)throw new Error("That is too much text to be Claude Code’s results. Paste only the final JSON reply.");
  var m=s.match(/```(?:json)?\s*([\s\S]*?)```/);if(m)s=m[1].trim();
  var a=s.indexOf("{"),b=s.lastIndexOf("}");
  if(a<0||b<=a)throw new Error("That doesn’t look like Claude Code’s results. Copy the whole reply and try again.");
  var o;
  try{o=JSON.parse(s.slice(a,b+1))}catch(e){throw new Error("The results could not be read. Ask Claude Code to send the results again as JSON only, then paste the new reply.")}
  if(!o||!Array.isArray(o.findings))throw new Error("This reply has no findings in it. Make sure you copied the whole reply from Claude Code.");
  var n=0,got=[],ig=Math.max(0,o.findings.length-MAX_FINDINGS);
  o.findings.slice(0,MAX_FINDINGS).forEach(function(f){
    var id=(f&&typeof f.id==="number")?f.id:parseInt(f&&f.id,10);
    var c=cleanFinding(f);
    if(!c||!isFinite(id)||!own(DEEP,id)){ig++;return}
    FIND[id]=c;got.push(id);n++;
  });
  if(!n)throw new Error("No valid findings were found.");
  return {n:n,ig:ig,ids:got,saved:saveFind()};
}

var PK=PromptKit.create({C:C,IDX:IDX,DEEP:DEEP,X:X});
var buildPrompt=PK.buildPrompt,buildSkill=PK.buildSkill;

function copyText(t,msgEl,onOk){
  function done(ok){msgEl.textContent=ok?"Copied. Paste it into Claude Code in plan mode.":"Copy failed. Open the preview and copy the text from there.";if(ok&&onOk)onOk()}
  function fallback(){
    var ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");
    ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();
    var ok=false;try{ok=document.execCommand("copy")}catch(e){}
    document.body.removeChild(ta);done(ok);
  }
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(function(){done(true)},fallback)}
  else fallback();
}
function download(name,text,type){
  var b=new Blob([text],{type:type||"text/markdown"});var u=URL.createObjectURL(b);
  var a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(u)},1000);
}

var agentPanel=document.getElementById("agentPanel"),agScope=document.getElementById("agScope"),agPeople=document.getElementById("agPeople"),agCount=document.getElementById("agCount"),agPrev=document.getElementById("agPrev"),agMsg=document.getElementById("agMsg"),agIn=document.getElementById("agIn"),agErr=document.getElementById("agErr"),agSum=document.getElementById("agSum"),modeBrowse=document.getElementById("modeBrowse"),modeAgent=document.getElementById("modeAgent");

function scopeIds(){
  var scope=agScope.value,incP=agPeople.checked,out=[];
  C.forEach(function(c,i){
    if(/^c\d+$/.test(scope)&&parseInt(scope.slice(1),10)!==i)return;
    c[3].forEach(function(it){
      var id=it[0],d=DEEP[id];
      if(!d)return;
      if(!incP&&d.chk==="people")return;
      if(scope==="open"&&review[id])return;
      out.push(id);
    });
  });
  return out;
}
(function(){
  function o(v,t){var e=document.createElement("option");e.value=v;e.textContent=t;agScope.appendChild(e)}
  C.forEach(function(c,i){o("c"+i,c[0])});
  o("all","All concerns (large prompt)");
  o("open","Only concerns not yet reviewed");
  agScope.value="c0";
})();
function updateAgent(){
  var ids=scopeIds();
  var p=ids.length?buildPrompt(ids):"";
  var tk=Math.round(p.length/4000);
  agCount.textContent=ids.length+" concern"+(ids.length===1?"":"s")+" in this run"+(ids.length?", roughly "+tk+"k tokens":"")+"."+(agPeople.checked?"":" Concerns that need people or runtime data are left out.")+(tk>30?" This is a large prompt. Running one category at a time gives better results.":"");
  agPrev.textContent=ids.length?p:"No concerns match this scope.";
}
function setMode(m){
  mode=m;
  modeBrowse.setAttribute("aria-pressed",m==="browse"?"true":"false");
  modeAgent.setAttribute("aria-pressed",m==="agent"?"true":"false");
  agentPanel.hidden=(m!=="agent");
  if(m==="agent")updateAgent();
}
modeBrowse.onclick=function(){setMode("browse")};
modeAgent.onclick=function(){setMode("agent")};
document.getElementById("heroAgent").onclick=function(e){e.preventDefault();setMode("agent");jump()};
agScope.onchange=updateAgent;
agPeople.onchange=updateAgent;
document.getElementById("agCopy").onclick=function(){
  var ids=scopeIds();
  if(!ids.length){agMsg.textContent="No concerns match this scope.";return}
  copyText(buildPrompt(ids),agMsg);
};
document.getElementById("agSkill").onclick=function(){
  var ids=scopeIds();
  if(!ids.length){agMsg.textContent="No concerns match this scope.";return}
  download("SKILL.md",buildSkill(ids));
  agMsg.textContent="Downloaded SKILL.md";
};
function importSummary(r,after){
  return "Imported "+r.n+" finding"+(r.n===1?"":"s")+(r.ig?", ignored "+r.ig:"")+"."+(after?" "+after:"")+(r.saved?"":" This browser could not store them, so they will be lost when you close or reload the page.");
}
document.getElementById("agImport").onclick=function(){
  agErr.textContent="";agSum.textContent="";
  try{
    var r=importFindings(agIn.value);
    agSum.textContent=importSummary(r,"Open a concern to see the evidence.")+" ";
    var show=el("button","chip","Show concerns with findings");show.type="button";
    show.onclick=function(){q="";qIn.value="";dual=false;sf="all";cat=-1;sel=null;af="any";render();alignTo(grid)};
    agSum.appendChild(show);
    agSum.appendChild(document.createTextNode(" "));
    var sv=el("button","chip","Save your review");sv.type="button";
    sv.onclick=function(){alignTo(svBox)};
    agSum.appendChild(sv);
    agIn.value="";render();
  }catch(e){agErr.textContent=e.message}
};
document.getElementById("agClear").onclick=function(){
  if(Object.keys(FIND).length&&window.confirm("Clear all imported agent findings from this browser?")){try{localStorage.removeItem(REM_KEY)}catch(e){}FIND={};saveFind();agSum.textContent="Findings cleared.";render()}
};
agIn.oninput=function(){agErr.textContent=""};

/* Saving a review. A review file holds the marks and the findings so a person can keep them wherever they choose. Everything read from a file is cleaned the same way as a pasted reply, so a hand edited file can plant nothing the paste could not. */
var REVIEW_FORMAT="prc-review",REVIEW_VERSION=1,MAX_FILE=5000000;
function today(){return new Date().toISOString().slice(0,10)}
function plural(n,w){return n+" "+w+(n===1?"":"s")}
function reviewFile(){
  return JSON.stringify({format:REVIEW_FORMAT,version:REVIEW_VERSION,saved:new Date().toISOString(),review:review,findings:FIND},null,2);
}
function parseReviewFile(text){
  if(text.length>MAX_FILE)throw new Error("That file is too large to be a saved review.");
  var o;
  try{o=JSON.parse(text)}catch(e){throw new Error("That file could not be read. Choose a file made with Save review file.")}
  if(!o||o.format!==REVIEW_FORMAT)throw new Error("That is not a saved review. Choose a file made with Save review file.");
  if(typeof o.version!=="number"||o.version>REVIEW_VERSION)throw new Error("That file was saved by a newer version of this page. Open the latest page and try again.");
  var rv={},fd={},m=0,n=0,ig=0;
  if(o.review&&typeof o.review==="object")Object.keys(o.review).forEach(function(k){
    var v=o.review[k];
    if(own(IDX,k)&&typeof v==="string"&&own(ST,v)){rv[k]=v;m++}else ig++;
  });
  if(o.findings&&typeof o.findings==="object"){
    var ks=Object.keys(o.findings);
    ig+=Math.max(0,ks.length-MAX_FINDINGS);
    ks.slice(0,MAX_FINDINGS).forEach(function(k){
      var f=cleanFinding(o.findings[k]);
      if(f&&own(DEEP,k)){fd[k]=f;n++}else ig++;
    });
  }
  if(!m&&!n)throw new Error("That file has no review marks or findings in it.");
  return {review:rv,findings:fd,m:m,n:n,ig:ig,saved:(typeof o.saved==="string"&&/^\d{4}-\d{2}-\d{2}/.test(o.saved))?o.saved.slice(0,10):""};
}

/* The report is for people to read and share, so agent text is escaped for Markdown and nothing in it can turn into a link, an image or markup. */
function mdText(s){return String(s).replace(/\s+/g," ").replace(/([\\`*_{}\[\]<>#|~!])/g,"\\$1")}
function mdCode(s){return "`"+String(s).replace(/`/g,"'").replace(/\s+/g," ")+"`"}
function mdEv(e){return mdCode(e.file+(e.line?":"+e.line:""))+(e.quote?" “"+mdText(e.quote)+"”":"")}
function buildReport(){
  var L=[],t=tally(allIds()),nf=Object.keys(FIND).length;
  L.push("# Production readiness review","");
  L.push("Created "+today()+" with the Production Readiness Checklist. Agent findings were written by an AI and have not been verified, so they can be wrong. This report can include file paths and short code quotes, so keep it private.","");
  L.push("## Summary","");
  L.push("- Reviewed: "+t.done+" of "+t.den+" ("+t.decided+" decided, "+t.deferred+" deferred, "+t.missing+" missing)"+(t.na?", plus "+t.na+" not applicable":""));
  var by={};Object.keys(FIND).forEach(function(k){by[FIND[k].result]=(by[FIND[k].result]||0)+1});
  var parts=Object.keys(RL).filter(function(k){return by[k]}).map(function(k){return by[k]+" "+RL[k].toLowerCase()});
  L.push("- Agent findings: "+nf+(nf?" ("+parts.join(", ")+")":""),"");
  L.push("## Still to review","");
  var any=false;
  C.forEach(function(c){
    var names=c[3].filter(function(it){return !review[it[0]]}).map(function(it){return mdText(it[1])});
    if(names.length){any=true;L.push("- **"+mdText(c[0])+"** ("+names.length+"): "+names.join(", "))}
  });
  if(!any)L.push("Every concern has a status.");
  L.push("");
  C.forEach(function(c){
    L.push("## "+mdText(c[0]),"");
    c[3].forEach(function(it){
      var id=it[0],st=review[id],f=FIND[id];
      L.push("### "+id+". "+mdText(it[1]),"");
      L.push("- Status: "+(st?ST[st]:"Not reviewed"));
      if(!f){L.push("");return}
      L.push("- Agent result: "+RL[f.result],"");
      if(f.evidence.length){L.push("**Evidence**","");f.evidence.forEach(function(e){L.push("- "+mdEv(e))});L.push("")}
      if(f.red_flags.length){
        L.push("**Red flags the agent reports**","");
        f.red_flags.forEach(function(r){L.push("- "+mdText(r.flag));r.evidence.forEach(function(e){L.push("  - "+mdEv(e))})});
        L.push("");
      }
      if(f.note){
        L.push("**Note**","");
        noteParts(f.note).forEach(function(p){
          if(p.t==="h"){if(L[L.length-1]!=="")L.push("");L.push("_"+mdText(p.x)+"_","")}
          else if(p.t==="li")L.push("- "+mdText(p.x));
          else L.push(mdText(p.x),"");
        });
        if(L[L.length-1]!=="")L.push("");
      }
      if(f.recommendation)L.push("**Suggested fix** (the agent’s advice, check it against the evidence before acting)","",mdText(f.recommendation),"");
    });
  });
  return L.join("\n").replace(/\n{3,}/g,"\n\n").replace(/\n*$/,"\n");
}

var svBox=document.getElementById("svBox"),svMsg=document.getElementById("svMsg"),svErr=document.getElementById("svErr"),svIn=document.getElementById("svIn"),svRem=document.getElementById("svRem"),svRemNote=document.getElementById("svRemNote");
function drawSave(){
  var r=remGet();
  svRem.checked=!!r;
  svRemNote.textContent=r?"Remembered until "+new Date(r.expires).toISOString().slice(0,10)+".":"";
}
document.getElementById("svFile").onclick=function(){
  svErr.textContent="";
  var nm=Object.keys(review).length,nf=Object.keys(FIND).length;
  if(!nm&&!nf){svMsg.textContent="Nothing to save yet. Mark a concern or import findings first.";return}
  var name="prc-review-"+today()+".json";
  download(name,reviewFile(),"application/json");
  svMsg.textContent="Saved "+name+" with "+plural(nf,"finding")+" and "+plural(nm,"mark")+". It holds file paths and code quotes, so keep it somewhere private.";
};
document.getElementById("svReport").onclick=function(){
  svErr.textContent="";
  var name="prc-report-"+today()+".md";
  download(name,buildReport(),"text/markdown");
  svMsg.textContent="Downloaded "+name+". It lists every concern. Agent text in it is unverified, and it can include file paths and code quotes.";
};
document.getElementById("svLoad").onclick=function(){svIn.value="";svIn.click()};
svIn.onchange=function(){
  var file=svIn.files&&svIn.files[0];
  svErr.textContent="";svMsg.textContent="";
  if(!file)return;
  if(file.size>MAX_FILE){svErr.textContent="That file is too large to be a saved review.";return}
  var rd=new FileReader();
  rd.onload=function(){
    try{
      var r=parseReviewFile(String(rd.result));
      var hm=Object.keys(review).length,hf=Object.keys(FIND).length;
      if((hm||hf)&&!window.confirm("Replace your current "+plural(hm,"mark")+" and "+plural(hf,"finding")+" with the ones in this file?")){svMsg.textContent="Nothing was changed.";return}
      review=r.review;save();
      FIND=r.findings;var ok=saveFind();
      render();
      svMsg.textContent="Loaded "+plural(r.n,"finding")+" and "+plural(r.m,"mark")+(r.saved?" from a review saved on "+r.saved:"")+"."+(r.ig?" Ignored "+r.ig+(r.ig===1?" entry":" entries")+" that did not match this checklist.":"")+(ok?"":" This browser could not keep the findings for this tab.");
    }catch(e){svErr.textContent=e.message}
  };
  rd.onerror=function(){svErr.textContent="That file could not be read."};
  rd.readAsText(file);
};
var svConfirm=document.getElementById("svConfirm"),svConfirmT=document.getElementById("svConfirmT");
function clearAll(){
  review={};save();
  try{localStorage.removeItem(REM_KEY)}catch(e){}
  FIND={};saveFind();
  svConfirm.hidden=true;
  render();
}
document.getElementById("svClearAll").onclick=function(){
  svErr.textContent="";svMsg.textContent="";
  var nm=Object.keys(review).length,nf=Object.keys(FIND).length,rem=!!remGet();
  if(!nm&&!nf&&!rem){svMsg.textContent="Nothing to clear.";return}
  svConfirmT.textContent="Clear "+plural(nm,"mark")+" and "+plural(nf,"finding")+(rem?", and the copy remembered in this browser":"")+"? This cannot be undone. Save a review file first if you want to keep them.";
  svConfirm.hidden=false;
  document.getElementById("svClrNo").focus();
};
document.getElementById("svClrNo").onclick=function(){svConfirm.hidden=true;svMsg.textContent="Nothing was cleared.";document.getElementById("svClearAll").focus()};
document.getElementById("svClrGo").onclick=function(){
  var nm=Object.keys(review).length,nf=Object.keys(FIND).length;
  clearAll();
  svMsg.textContent="Cleared "+plural(nm,"mark")+" and "+plural(nf,"finding")+".";
};
document.getElementById("svClrSave").onclick=function(){
  var nm=Object.keys(review).length,nf=Object.keys(FIND).length,name="prc-review-"+today()+".json";
  if(nm||nf)download(name,reviewFile(),"application/json");
  clearAll();
  svMsg.textContent=(nm||nf?"Saved "+name+", then cleared ":"Cleared ")+plural(nm,"mark")+" and "+plural(nf,"finding")+".";
};
svRem.onchange=function(){
  svErr.textContent="";
  if(svRem.checked){
    if(!window.confirm("Findings include file paths and short code quotes from your repository. Keep them in this browser for "+REM_DAYS+" days? Anyone who uses this browser profile can read them. You can turn this off at any time.")){svRem.checked=false;return}
    if(!remWrite()){svRem.checked=false;svErr.textContent="This browser could not store them.";return}
    svMsg.textContent="Findings will be kept in this browser for "+REM_DAYS+" days.";
  }else{
    try{localStorage.removeItem(REM_KEY)}catch(e){}
    svMsg.textContent="Stopped remembering findings. The stored copy was removed.";
  }
  drawSave();
};

function list(label,arr){
  var b=el("div","blk");b.appendChild(el("strong",null,label));
  var ul=document.createElement("ul");arr.forEach(function(x){ul.appendChild(el("li",null,x))});
  b.appendChild(ul);return b;
}
function evidenceList(arr){
  var ul=el("ul","ev");
  arr.forEach(function(e){
    var li=document.createElement("li");
    li.appendChild(el("code",null,e.file+(e.line?":"+e.line:"")));
    if(e.quote)li.appendChild(document.createTextNode(" “"+e.quote+"”"));
    ul.appendChild(li);
  });
  return ul;
}
/* The prompt asks for a note in sections: a known heading on its own line, then lines that start with "- ". Anything else, including an old style paragraph, shows as plain text. All of it goes in with textContent. */
var NOTE_HEADS={coverage:"Coverage",strengths:"Strengths",gaps:"Gaps","needs people":"Needs people",searched:"Searched"};
function noteParts(text){
  var out=[];
  text.split(/\r?\n/).forEach(function(raw){
    var line=raw.trim();if(!line)return;
    var b=line.match(/^[-*•]\s+(.+)$/);
    if(b){out.push({t:"li",x:b[1]});return}
    var h=line.match(/^([A-Za-z ]{3,20}):\s*(.*)$/),key=h?h[1].toLowerCase():"";
    if(h&&own(NOTE_HEADS,key)){out.push({t:"h",x:NOTE_HEADS[key]});if(h[2])out.push({t:"p",x:h[2]});return}
    out.push({t:"p",x:line});
  });
  return out;
}
function noteBody(text){
  var box=el("div","nbody"),ul=null;
  noteParts(text).forEach(function(p){
    if(p.t==="li"){if(!ul){ul=el("ul","nl");box.appendChild(ul)}ul.appendChild(el("li",null,p.x));return}
    ul=null;
    box.appendChild(el(p.t==="h"?"strong":"p",p.t==="h"?"nh":null,p.x));
  });
  return box;
}
function findingBlock(id){
  var f=FIND[id];if(!f)return null;
  var d=el("div","finding");
  var h=el("div","fh");h.appendChild(el("strong",null,"Agent finding"));h.appendChild(el("span","fbadge fb-"+f.result,RL[f.result]));d.appendChild(h);
  if(f.evidence.length)d.appendChild(evidenceList(f.evidence));
  if(f.red_flags&&f.red_flags.length){
    var rb=el("div","rfs");rb.appendChild(el("strong",null,"Red flags the agent reports"));
    var rl=document.createElement("ul");
    f.red_flags.forEach(function(r){
      var li=document.createElement("li");li.appendChild(document.createTextNode(r.flag));
      if(r.evidence.length)li.appendChild(evidenceList(r.evidence));
      rl.appendChild(li);
    });
    rb.appendChild(rl);d.appendChild(rb);
  }
  if(f.note)d.appendChild(noteBody(f.note));
  if(f.recommendation){
    var rc=el("div","rec");rc.appendChild(el("strong",null,"Suggested fix"));
    rc.appendChild(el("p",null,f.recommendation));
    rc.appendChild(el("p","meta","This is the agent’s advice. Check it against the evidence before you act on it."));
    d.appendChild(rc);
  }
  d.appendChild(el("p","meta","The agent suggests and you decide. Verify the evidence before marking this decided."));
  if(own(SUG,f.result)){
    var b=el("button","chip","Use suggested status: "+ST[SUG[f.result]].toLowerCase());b.type="button";
    b.onclick=function(){setStatus(id,SUG[f.result])};
    d.appendChild(b);
  }
  return d;
}
function pasteBox(id){
  var b=el("div","paste");
  b.appendChild(el("strong",null,"Paste Claude Code’s reply here"));
  b.appendChild(el("p","note","When Claude Code finishes, copy its whole reply and paste it below. The finding appears on this concern."));
  var lb=el("label","sr","Findings from Claude Code for this concern");lb.htmlFor="pasteIn";b.appendChild(lb);
  var ta=document.createElement("textarea");ta.id="pasteIn";ta.rows=5;ta.value=pasteDraft[id]||"";
  ta.placeholder="Paste Claude Code’s full reply here";
  b.appendChild(ta);
  var r=el("div","row");
  var bt=el("button","btn","Import findings");bt.type="button";
  var er=el("span","err");er.setAttribute("role","alert");er.textContent=pasteMsg[id]||"";pasteMsg[id]="";
  ta.oninput=function(){pasteDraft[id]=ta.value;er.textContent=""};
  bt.onclick=function(){
    er.textContent="";
    try{
      var res=importFindings(ta.value);
      pasteDraft[id]="";
      if(res.ids.indexOf(id)>=0){pasteOpen[id]=false}
      else pasteMsg[id]=importSummary(res)+" None of them is for this concern. Open the other concerns to see them.";
      render();
    }catch(e){er.textContent=e.message}
  };
  r.appendChild(bt);r.appendChild(er);b.appendChild(r);
  return b;
}
function detail(it,hue){
  var id=it[0],t0=tag(id),x=X[id],dp=own(DEEP,id)?DEEP[id]:null;
  var d=el("div","detail h-"+hue);d.id="detail";
  d.appendChild(el("h3",null,it[1]));
  d.appendChild(el("p",null,it[2]));
  if(dp){d.appendChild(block("How it works",dp.how));if(dp.app)d.appendChild(el("p","meta applies",dp.app));d.appendChild(block("Where it appears",dp.where))}
  if(x){d.appendChild(block("Review question",x[0]));d.appendChild(block("Trade-off",x[1]))}
  var m=el("p","meta");m.appendChild(el("span","dot d-"+t0));m.appendChild(document.createTextNode(RN[t0]+": "+RD[t0]));d.appendChild(m);
  if(it[3])d.appendChild(el("p","meta","Also fits: "+it[3]));
  if(dp){
    var cm=el("p","meta");cm.appendChild(el("span","chk chk-"+dp.chk,CHK[dp.chk]));d.appendChild(cm);
    d.appendChild(el("p","meta chk-why",CHKX[dp.chk]));
    var fb=findingBlock(id);if(fb)d.appendChild(fb);
    var run=el("div","runbox");
    run.appendChild(el("strong",null,"Check this concern with Claude Code"));
    var row=el("div","row");row.style.marginTop="8px";row.style.gap="14px";
    var cb=el("button","btn alt","Copy Claude Code prompt for this concern");cb.type="button";
    var cmsg=el("span","note");cmsg.setAttribute("role","status");cmsg.style.margin="0";
    var holder=el("div","pastebox");
    cb.onclick=function(){copyText(buildPrompt([id]),cmsg,function(){pasteOpen[id]=true;if(!holder.firstChild)holder.appendChild(pasteBox(id))})};
    row.appendChild(cb);row.appendChild(cmsg);run.appendChild(row);
    run.appendChild(el("p","note full","Paste it into Claude Code in plan mode, which stops the agent from editing files. Start it with claude --permission-mode plan, or press Shift+Tab."));
    if(pasteOpen[id])holder.appendChild(pasteBox(id));
    run.appendChild(holder);
    d.appendChild(run);
    var det=document.createElement("details");det.className="deep";det.open=!!openDeep[id];
    det.ontoggle=function(){openDeep[id]=det.open};
    var sm=document.createElement("summary");
    var st1=el("span","gd-t");st1.appendChild(el("strong",null,"Go deeper"));st1.appendChild(el("span","gd-s","Why it matters, red flags, what good looks like, agent hints"));
    var chv=el("span","gd-c");chv.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    sm.appendChild(st1);sm.appendChild(chv);det.appendChild(sm);
    det.appendChild(block("Why it matters",dp.why));
    det.appendChild(list("Red flags",dp.flags));
    det.appendChild(list("Good looks like",dp.good));
    if(dp.decide)det.appendChild(block("Decide between",dp.decide));
    var ac=el("div","blk");ac.appendChild(el("strong",null,"Agent check"));
    function askBlock(intro){
      var ab=el("div","blk");ab.appendChild(el("strong",null,"Ask people for"));
      if(intro)ab.appendChild(el("p",null,intro));
      var ul=document.createElement("ul");dp.ask.forEach(function(a){ul.appendChild(el("li",null,a))});ab.appendChild(ul);
      return ab;
    }
    if(dp.chk==="people"){
      ac.appendChild(el("p",null,"This needs people or runtime data, so a coding agent cannot settle it from the code alone."));
      det.appendChild(ac);
      det.appendChild(askBlock());
      ac=null;
    }else{
      ac.appendChild(el("p",null,"Search hints for Claude Code:"));
      var sg=el("div","sigs");dp.sig.forEach(function(s){sg.appendChild(el("code",null,s))});ac.appendChild(sg);
      if(dp.look){
        ac.appendChild(el("p",null,"Also look for these patterns, which have no exact text to search for:"));
        var ul2=document.createElement("ul");dp.look.forEach(function(a){ul2.appendChild(el("li",null,a))});ac.appendChild(ul2);
      }
      if(dp.ask){
        det.appendChild(ac);
        det.appendChild(askBlock("The repository cannot show everything here."));
        ac=null;
      }
    }
    if(ac)det.appendChild(ac);
    d.appendChild(det);
  }else{
    d.appendChild(el("p","meta","Full detail and agent review for this concern are coming in the complete version."));
  }
  if(x&&x[2].length){
    var r=el("div","rel");r.appendChild(el("strong",null,"Related concerns"));
    var w=el("div","pills");
    x[2].forEach(function(rid){
      if(!IDX[rid])return;
      var b=el("button","pill rel h-"+HUE[rid],IDX[rid][1]);b.type="button";
      b.onclick=function(){goTo(rid)};
      w.appendChild(b);
    });
    r.appendChild(w);d.appendChild(r);
  }
  var g=el("div","stg");g.appendChild(el("strong",null,"Review status"));
  var bs=el("div","sbs");bs.setAttribute("role","group");bs.setAttribute("aria-label","Review status for "+it[1]);
  ["decided","deferred","missing","na"].forEach(function(k){
    var b=el("button","sb");b.type="button";b.setAttribute("data-st",k);
    b.setAttribute("aria-pressed",review[id]===k?"true":"false");
    var ic=el("span","st");ic.innerHTML=ICON[k];b.appendChild(ic);
    b.appendChild(document.createTextNode(ST[k]));
    b.onclick=function(){setStatus(id,review[id]===k?null:k)};
    bs.appendChild(b);
  });
  g.appendChild(bs);d.appendChild(g);
  return d;
}

syncTheme();render();

// The intro video is an optional file beside the page. The card shows only when its poster loads, and the video is fetched only on play.
(function(){
  var btn=document.getElementById("introBtn"),dlg=document.getElementById("introDlg"),vid=document.getElementById("introVid"),img=document.getElementById("introImg");
  var probe=new Image();
  probe.onload=function(){img.src="brag.jpg";btn.hidden=false};
  probe.src="brag.jpg";
  function stop(){vid.pause()}
  btn.onclick=function(){
    if(!vid.getAttribute("src"))vid.setAttribute("src","brag.mp4");
    if(typeof dlg.showModal==="function")dlg.showModal();else dlg.setAttribute("open","");
    var p=vid.play();if(p&&p.catch)p.catch(function(){});
  };
  function close(){stop();if(typeof dlg.close==="function")dlg.close();else dlg.removeAttribute("open");btn.focus()}
  document.getElementById("introX").onclick=close;
  dlg.addEventListener("click",function(e){if(e.target===dlg)close()});
  dlg.addEventListener("cancel",stop);
  dlg.addEventListener("close",stop);
})();
