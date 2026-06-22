/* ── WAVEFORM BANNERS ── */
const WAVES=[[8,14,22,30,36,28,20,14,24,32,26,18,12,22,30,36,26,18,24,32,20,12,26,34,22],[18,28,36,24,16,22,32,26,14,20,30,22,12,18,26,34,20,14,24,32,18,10,22,30,16],[12,22,30,38,28,18,14,26,36,30,20,12,22,32,24,16,20,28,36,22,14,18,26,32,20],[6,16,26,34,26,14,18,28,38,30,22,12,16,24,32,26,16,22,30,38,26,14,18,28,20],[14,24,34,26,16,22,30,20,12,18,28,36,24,14,20,32,26,16,22,30,18,12,24,34,26],[10,20,30,36,26,16,22,32,24,12,18,28,38,30,20,14,22,32,26,16,20,28,36,24,12]];
const COLORS=["#ffffff","#a56eff","#ffffff","#3ecf6a","#a56eff","#e05c5c"];
function drawBanners(){for(let i=1;i<=6;i++){const el=document.getElementById("b"+i);if(!el)continue;el.innerHTML="";WAVES[i-1].forEach(h=>{const d=document.createElement("div");d.className="pbar";d.style.height=h+"px";d.style.setProperty("background",COLORS[i-1],"important");el.appendChild(d);});}}
drawBanners();

/* ── PAGE NAVIGATION ── */
function goPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById("page-"+id).classList.add("active");
  // update bbar
  document.querySelectorAll(".bbar-tab").forEach(t=>t.classList.remove("active"));
  const bt=document.getElementById("bbar-"+id) || document.getElementById("bbar-profile");
  if(bt)bt.classList.add("active");
  // close chat open if going away
  if(id!=="chat"){document.getElementById("chat-open").classList.remove("show");document.getElementById("chat-list").classList.remove("hidden");}
  window.scrollTo(0,0);
}

/* ── FEED TABS ── */
function setFeedTab(el){document.querySelectorAll(".feed-tab").forEach(t=>t.classList.remove("active"));el.classList.add("active");}
function setFilter(el){document.querySelectorAll(".fpill").forEach(p=>p.classList.remove("on"));el.classList.add("on");}

/* ── FRIENDS TABS ── */
function setFrTab(el,panelId){
  document.querySelectorAll(".fr-tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".fr-panel").forEach(p=>p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById(panelId).classList.add("active");
}

/* ── TOOL TABS ── */
function switchTool(id,el){
  document.querySelectorAll(".tool-tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".tool-panel").forEach(p=>p.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("panel-"+id).classList.add("active");
}

/* ── FOLLOW / LIKE / CHIP ── */
function toggleFollow(btn){
  if(btn.classList.contains("following")){btn.textContent="Follow";btn.classList.remove("following");}
  else{btn.textContent="Following";btn.classList.add("following");showToast("Following!");}
}
function toggleLike(btn){btn.classList.toggle("liked")}
function toggleChip(el){el.classList.toggle("on")}

/* ── TOAST ── */
function showToast(msg){
  const t=document.getElementById("toast");
  document.getElementById("toast-msg").textContent=msg;
  t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);
}

/* ── COPY ── */
function copyEl(id){navigator.clipboard.writeText(document.getElementById(id).textContent).catch(()=>{});showToast("Copied to clipboard!");}

/* ── MODAL ── */
function openModal(){document.getElementById("modal-bg").classList.add("show")}
function openSignup(){document.getElementById("signup-bg").classList.add("show")}
function closeSignup(){document.getElementById("signup-bg").classList.remove("show")}
function closeSignupOutside(e){if(e.target===document.getElementById("signup-bg"))closeSignup();}
function closeModal(){document.getElementById("modal-bg").classList.remove("show")}
function closeModalOutside(e){if(e.target===document.getElementById("modal-bg"))closeModal();}

/* ── PROGRESS ── */
function runProg(fId,pId,lId,steps,done){
  let i=0;
  const f=document.getElementById(fId),p=document.getElementById(pId),l=document.getElementById(lId);
  const iv=setInterval(()=>{if(i>=steps.length){clearInterval(iv);done();return;}f.style.width=steps[i].p+"%";p.textContent=steps[i].p+"%";l.textContent=steps[i].l;i++;},500);
}

/* ── DESCRIBE IT ── */
function runDescribe(){
  const inst=document.getElementById("d-type").value||"Vocals";
  const genre=document.getElementById("d-genre").value||"Hip-Hop";
  const prompt=document.getElementById("d-prompt").value;
  const fx=[...document.querySelectorAll("#d-chips .chip.on")].map(c=>c.textContent);
  if(!prompt&&!fx.length){showToast("Add a description or pick effects");return;}
  const prog=document.getElementById("d-prog"),out=document.getElementById("d-output");
  out.classList.remove("show");prog.classList.add("show");
  runProg("d-prog-fill","d-prog-pct","d-prog-lbl",[{p:20,l:"Reading description…"},{p:50,l:"Mapping to BandLab FX…"},{p:80,l:"Building prompt…"},{p:100,l:"Done!"}],()=>{
    prog.classList.remove("show");
    const fxStr=fx.length?fx.join(", "):"Distortion, Compression";
    document.getElementById("d-output-text").textContent=`${genre} ${inst.toLowerCase()} with ${fxStr.toLowerCase()}${prompt?" — "+prompt:""}. Apply DigiComp (4:1 ratio, 3ms attack), Studio Reverb (25% wet, 2.2s RT60), Graphic EQ (+3dB @ 8kHz, −2dB @ 200Hz). Heavy presence, tight low-end, professional finish.`;
    out.classList.add("show");
  });
}

/* ── VOCAL UPLOAD ── */
function onVocalFile(inp){
  if(!inp.files[0])return;
  document.getElementById("v-title").textContent=inp.files[0].name;
  document.getElementById("v-sub").textContent="Ready to analyze";
  document.getElementById("v-wave").classList.add("show");
}
function runVocal(){
  const intent=document.getElementById("v-intent").value;
  const prog=document.getElementById("v-prog"),out=document.getElementById("v-output");
  out.classList.remove("show");prog.classList.add("show");
  runProg("v-prog-fill","v-prog-pct","v-prog-lbl",[{p:15,l:"Extracting features…"},{p:35,l:"Running FFT…"},{p:55,l:"Detecting reverb tail…"},{p:80,l:"Mapping to BandLab FX…"},{p:100,l:"Preset ready!"}],()=>{
    prog.classList.remove("show");
    document.getElementById("v-output-text").textContent=intent?`${intent} — from vocal analysis: Noise Gate (−38dB), DigiComp (4:1, 3ms), Graphic EQ (+4dB @ 5kHz, −3dB @ 180Hz), Space Echo (1/8 note, 30% wet), Studio Reverb (1.8s RT60).`:`Vocal analysis: Noise Gate (−38dB), DigiComp (3:1), Graphic EQ (+3dB @ 8kHz), Studio Reverb (2.1s RT60, 22% wet). Optimized for modern pop/R&B.`;
    out.classList.add("show");
  });
}

/* ── PRESET RIPPER ── */
function onRipperFile(inp){
  if(!inp.files[0])return;
  document.getElementById("r-title").textContent=inp.files[0].name;
  document.getElementById("r-sub").textContent="Analyzing FX fingerprint…";
  const prog=document.getElementById("r-prog"),ph=document.getElementById("r-placeholder"),chain=document.getElementById("r-chain"),btn=document.getElementById("r-bl-btn");
  chain.classList.remove("show");btn.classList.remove("show");
  ph.style.display="flex";prog.classList.add("show");
  runProg("r-prog-fill","r-prog-pct","r-prog-lbl",[{p:10,l:"Scanning fingerprint…"},{p:28,l:"Spectral analysis…"},{p:48,l:"Detecting dynamics…"},{p:68,l:"Identifying reverb…"},{p:88,l:"Matching BandLab FX…"},{p:100,l:"Rip complete!"}],()=>{
    prog.classList.remove("show");ph.style.display="none";
    chain.classList.add("show");btn.classList.add("show");
    document.getElementById("r-sub").textContent="FX chain ripped ✓";
  });
}

/* ── CHAT ── */
function openChat(name,initials,c1,c2){
  goPage("chat");
  document.getElementById("chat-list").classList.add("hidden");
  const co=document.getElementById("chat-open");
  co.classList.add("show");
  document.getElementById("co-name").textContent=name;
  document.getElementById("co-av").textContent=initials;
  document.getElementById("co-av").style.background=`linear-gradient(135deg,${c1},${c2})`;
  document.getElementById("co-status").textContent="Online";
  const msgs=document.getElementById("chat-messages");
  msgs.scrollTop=msgs.scrollHeight;
}
function closeChat(){
  document.getElementById("chat-open").classList.remove("show");
  document.getElementById("chat-list").classList.remove("hidden");
}
function setPTab(el){
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
function sendMsg(){
  const inp=document.getElementById("chat-inp");
  const text=inp.value.trim();if(!text)return;
  const msgs=document.getElementById("chat-messages");
  const div=document.createElement("div");div.className="msg mine";
  div.innerHTML=`<div class="msg-bubble">${text}</div><div class="msg-time">Just now</div>`;
  msgs.appendChild(div);inp.value="";msgs.scrollTop=msgs.scrollHeight;
}


/* ── PRESET LIBRARY ── */
function setLibFilter(el) {
  document.querySelectorAll('.plib-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}
function toggleSave(btn) {
  btn.classList.toggle('saved');
  showToast(btn.classList.contains('saved') ? 'Saved to your library!' : 'Removed from library');
}
function drawLibBanners() {
  const configs = [
    {id:'fl1', color:'#ffffff', h:[10,16,24,32,28,20,14,22,30,18]},
    {id:'fl2', color:'#a56eff', h:[14,22,30,26,16,22,28,18,24,32]},
    {id:'fl3', color:'#3fc742', h:[8,18,28,36,28,16,20,30,22,14]},
    {id:'fl4', color:'#fff',    h:[12,20,32,28,18,24,34,22,16,26]},
    {id:'fl5', color:'#e03e8a', h:[16,26,34,24,14,22,30,20,28,18]},
    {id:'tl1', color:'#3fc742', h:[8,14,22,18,12,16,24,20,14,10]},
    {id:'tl2', color:'#ffffff', h:[10,18,24,20,14,18,26,22,16,12]},
    {id:'tl3', color:'#e05c5c', h:[6,12,20,16,10,14,22,18,12,8]},
    {id:'tl4', color:'#fff',    h:[12,20,28,24,18,22,30,26,20,14]},
    {id:'tl5', color:'#a56eff', h:[10,16,24,20,14,18,26,22,16,10]},
    {id:'tl6', color:'#e03e8a', h:[8,14,22,18,12,16,24,20,14,8]},
    {id:'nl1', color:'#3fc742', h:[6,10,16,12,8,12,18,14,10,6]},
    {id:'nl2', color:'#fff',    h:[8,14,20,16,10,14,22,18,12,8]},
    {id:'nl3', color:'#a56eff', h:[6,12,18,14,8,12,20,16,10,6]},
  ];
  configs.forEach(({id, color, h}) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerHTML = '';
    h.forEach(ht => {
      const b = document.createElement('div');
      b.className = id.startsWith('fl') ? 'plib-fbar' : 'plib-row-tbar';
      b.style.height = ht + 'px';
      b.style.setProperty('background', color, 'important');
      el.appendChild(b);
    });
  });
}
drawLibBanners();


/* ── IMPORT FROM BANDLAB ── */
function openImportModal() {
  goImportStep(1);
  document.getElementById('import-url-input').value = '';
  document.getElementById('import-step1-btn').disabled = true;
  document.getElementById('import-modal-bg').classList.add('show');
}
function closeImportModal() {
  document.getElementById('import-modal-bg').classList.remove('show');
}
function goImportStep(n) {
  document.querySelectorAll('.import-step').forEach((s,i) => {
    s.classList.toggle('active', i === n-1);
  });
  document.querySelectorAll('.import-step-dot').forEach((d,i) => {
    d.classList.toggle('active', i === n-1);
    d.classList.toggle('done', i < n-1);
  });
}
function pasteFromClipboard() {
  navigator.clipboard.readText().then(text => {
    const inp = document.getElementById('import-url-input');
    inp.value = text;
    validateImportUrl();
  }).catch(() => {
    showToast('Tap the input field and paste manually');
  });
}
function validateImportUrl() {
  const val = document.getElementById('import-url-input').value.trim();
  const btn = document.getElementById('import-step1-btn');
  btn.disabled = val.length < 5;
}
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('import-url-input');
  if(inp) inp.addEventListener('input', validateImportUrl);
});

function runImportStep1() {
  const url = document.getElementById('import-url-input').value.trim();
  if(!url) return;
  // Simulate fetching preset from BandLab
  const btn = document.getElementById('import-step1-btn');
  btn.textContent = 'Fetching...';
  btn.disabled = true;
  setTimeout(() => {
    // Mock preset name from URL or generic
    const mockNames = ['Dark Trap Vocal Chain','808 Sub Distortion','Bright Pop Reverb','UK Drill Crunch','R&B Silky EQ'];
    const name = mockNames[Math.floor(Math.random()*mockNames.length)];
    document.getElementById('import-preset-name').textContent = name;
    document.getElementById('import-success-name').textContent = name;
    document.getElementById('import-preset-meta').textContent = 'BandLab · FX Preset';
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 4l5 4-5 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Fetch Preset';
    btn.disabled = false;
    goImportStep(2);
  }, 1800);
}

function runImportStep2() {
  const name = document.getElementById('import-preset-name').textContent;
  // Add to library list (mock)
  const list = document.querySelector('.lib-list');
  if(list) {
    const item = document.createElement('div');
    item.className = 'lib-item';
    item.innerHTML = `
      <div class="lib-thumb" style="background:#0a0a0a;display:flex;align-items:center;justify-content:center;font-size:22px"><svg class="ico"><use href="#ic-sliders"/></svg></div>
      <div class="lib-info">
        <div class="lib-item-name">${name}</div>
        <div class="lib-item-time">Just now</div>
      </div>
      <div class="lib-item-actions">
        <svg class="lib-bl-icon" width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" stroke="#666" stroke-width="1.4"/><path d="M9 8l5 3-5 3V8z" fill="#666"/></svg>
        <button class="lib-more-btn" onclick="event.stopPropagation();showToast('Options')">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="4" r="1.3" fill="#666"/><circle cx="9" cy="9" r="1.3" fill="#666"/><circle cx="9" cy="14" r="1.3" fill="#666"/></svg>
        </button>
      </div>`;
    list.insertBefore(item, list.firstChild);
  }
  goImportStep(3);
}

