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

var cat=-1,dual=false,sel=null,q="",sf="all";
var chips=document.getElementById("chips"),stChips=document.getElementById("stChips"),grid=document.getElementById("grid"),dualBtn=document.getElementById("dualBtn"),themeBtn=document.getElementById("themeBtn"),root=document.documentElement,qIn=document.getElementById("q");

function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function chip(label,on,fn){var b=el("button","chip",label);b.type="button";b.setAttribute("aria-pressed",on?"true":"false");b.onclick=fn;return b}

function drawChips(){
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
  q="";qIn.value="";dual=false;sf="all";cat=-1;sel=id;render();
  var p=grid.querySelector('.pill[aria-expanded="true"]');
  if(p){alignTo(p.closest(".sec")||p);p.focus({preventScroll:true})}
}
function render(){
  drawChips();drawProgress();drawExtras();if(mode==="agent")updateAgent();grid.innerHTML="";var n=0;
  dualBtn.setAttribute("aria-pressed",dual?"true":"false");
  C.forEach(function(c,i){
    if(cat>=0&&cat!==i)return;
    var items=c[3].filter(function(it){
      if(dual&&!it[3])return false;
      var st=review[it[0]]||"none";
      if(sf!=="all"&&st!==sf)return false;
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
    b.onclick=function(){q="";qIn.value="";dual=false;sf="all";cat=i;sel=null;render();jump()};
    cg.appendChild(b);
  });
}

var CHK={code:"Agent can check from code",partial:"Agent can partly check",people:"Needs people or runtime data"};
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
function cleanEvidence(arr){
  var ev=[];
  if(Array.isArray(arr)){
    arr.slice(0,5).forEach(function(e){
      if(e&&typeof e.file==="string"){
        var ln=parseInt(e.line,10);
        ev.push({file:maskSecrets(e.file.slice(0,200)),line:(isFinite(ln)&&ln>0)?ln:0,quote:maskSecrets(typeof e.quote==="string"?e.quote.slice(0,200):"")});
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
      if(t)rf.push({flag:maskSecrets(t.slice(0,200)),evidence:cleanEvidence(r&&r.evidence)});
    });
  }
  return {result:f.result,evidence:cleanEvidence(f.evidence),red_flags:rf,note:maskSecrets(typeof f.note==="string"?f.note.slice(0,600):"")};
}
try{
  var rfd=sessionStorage.getItem("prc.agentFindings");
  if(rfd){var fo=JSON.parse(rfd);if(fo&&typeof fo==="object"){Object.keys(fo).forEach(function(k){var f=cleanFinding(fo[k]);if(f&&own(DEEP,k))FIND[k]=f})}}
}catch(e){}
function saveFind(){try{sessionStorage.setItem("prc.agentFindings",JSON.stringify(FIND));return true}catch(e){return false}}
var MAX_PASTE=1000000,MAX_FINDINGS=500;

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
  var n=0,ig=Math.max(0,o.findings.length-MAX_FINDINGS);
  o.findings.slice(0,MAX_FINDINGS).forEach(function(f){
    var id=(f&&typeof f.id==="number")?f.id:parseInt(f&&f.id,10);
    var c=cleanFinding(f);
    if(!c||!isFinite(id)||!own(DEEP,id)){ig++;return}
    FIND[id]=c;n++;
  });
  if(!n)throw new Error("No valid findings were found.");
  return {n:n,ig:ig,saved:saveFind()};
}

var PK=PromptKit.create({C:C,IDX:IDX,DEEP:DEEP,X:X});
var buildPrompt=PK.buildPrompt,buildSkill=PK.buildSkill;

function copyText(t,msgEl){
  function done(ok){msgEl.textContent=ok?"Copied":"Copy failed. Open the preview and copy the text from there."}
  function fallback(){
    var ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");
    ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();
    var ok=false;try{ok=document.execCommand("copy")}catch(e){}
    document.body.removeChild(ta);done(ok);
  }
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(function(){done(true)},fallback)}
  else fallback();
}
function download(name,text){
  var b=new Blob([text],{type:"text/markdown"});var u=URL.createObjectURL(b);
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
document.getElementById("agImport").onclick=function(){
  agErr.textContent="";agSum.textContent="";
  try{
    var r=importFindings(agIn.value);
    agSum.textContent="Imported "+r.n+" finding"+(r.n===1?"":"s")+(r.ig?", ignored "+r.ig:"")+". Open a concern to see the evidence."+(r.saved?"":" This browser could not store them, so they will be lost when you close or reload the page.");
    agIn.value="";render();
  }catch(e){agErr.textContent=e.message}
};
document.getElementById("agClear").onclick=function(){
  if(Object.keys(FIND).length&&window.confirm("Clear all imported agent findings from this browser?")){FIND={};saveFind();agSum.textContent="Findings cleared.";render()}
};
agIn.oninput=function(){agErr.textContent=""};

function list(label,arr){
  var b=el("div","blk");b.appendChild(el("strong",null,label));
  var ul=document.createElement("ul");arr.forEach(function(x){ul.appendChild(el("li",null,x))});
  b.appendChild(ul);return b;
}
function findingBlock(id){
  var f=FIND[id];if(!f)return null;
  var d=el("div","finding");
  var h=el("div","fh");h.appendChild(el("strong",null,"Agent finding"));h.appendChild(el("span","fbadge fb-"+f.result,RL[f.result]));d.appendChild(h);
  if(f.evidence.length){
    var ul=el("ul","ev");
    f.evidence.forEach(function(e){
      var li=document.createElement("li");
      li.appendChild(el("code",null,e.file+(e.line?":"+e.line:"")));
      if(e.quote)li.appendChild(document.createTextNode(" \u201c"+e.quote+"\u201d"));
      ul.appendChild(li);
    });
    d.appendChild(ul);
  }
  if(f.red_flags&&f.red_flags.length){
    var rb=el("div","rfs");rb.appendChild(el("strong",null,"Red flags the agent reports"));
    var rl=document.createElement("ul");
    f.red_flags.forEach(function(r){
      var li=document.createElement("li");li.appendChild(document.createTextNode(r.flag));
      r.evidence.forEach(function(e){li.appendChild(document.createTextNode(" "));li.appendChild(el("code",null,e.file+(e.line?":"+e.line:"")));if(e.quote)li.appendChild(document.createTextNode(" \u201c"+e.quote+"\u201d"))});
      rl.appendChild(li);
    });
    rb.appendChild(rl);d.appendChild(rb);
  }
  if(f.note)d.appendChild(el("p",null,f.note));
  d.appendChild(el("p","meta","The agent suggests and you decide. Verify the evidence before marking this decided."));
  if(own(SUG,f.result)){
    var b=el("button","chip","Use suggested status: "+ST[SUG[f.result]].toLowerCase());b.type="button";
    b.onclick=function(){setStatus(id,SUG[f.result])};
    d.appendChild(b);
  }
  return d;
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
    var fb=findingBlock(id);if(fb)d.appendChild(fb);
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
    if(dp.chk==="people"){
      ac.appendChild(el("p",null,"This needs people or runtime data, so a coding agent cannot settle it from the code alone. Ask for:"));
      var ul=document.createElement("ul");dp.ask.forEach(function(a){ul.appendChild(el("li",null,a))});ac.appendChild(ul);
    }else{
      ac.appendChild(el("p",null,"Search hints for Claude Code:"));
      var sg=el("div","sigs");dp.sig.forEach(function(s){sg.appendChild(el("code",null,s))});ac.appendChild(sg);
      if(dp.look){
        ac.appendChild(el("p",null,"Also look for these patterns, which have no exact text to search for:"));
        var ul2=document.createElement("ul");dp.look.forEach(function(a){ul2.appendChild(el("li",null,a))});ac.appendChild(ul2);
      }
      if(dp.ask){
        ac.appendChild(el("p",null,"The repository cannot show everything here. Ask people for:"));
        var ul3=document.createElement("ul");dp.ask.forEach(function(a){ul3.appendChild(el("li",null,a))});ac.appendChild(ul3);
      }
    }
    var row=el("div","row");row.style.marginTop="14px";row.style.gap="14px";
    var cb=el("button","btn alt","Copy Claude Code prompt for this concern");cb.type="button";
    var cmsg=el("span","note");cmsg.setAttribute("role","status");cmsg.style.margin="0";
    cb.onclick=function(){copyText(buildPrompt([id]),cmsg)};
    row.appendChild(cb);row.appendChild(cmsg);ac.appendChild(row);
    det.appendChild(ac);
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
