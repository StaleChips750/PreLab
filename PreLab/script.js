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
window._import_bandlab_url = '';

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
  if (!url) return;
  window._import_bandlab_url = url;
  const preview = document.getElementById('import-bandlab-url-preview');
  if (preview) preview.textContent = url.length > 44 ? url.slice(0, 44) + '…' : url;
  goImportStep(2);
}

async function runImportStep2() {
  const session = await pl_getSession();
  if (!session) { closeImportModal(); openModal(); showToast('Sign in to share presets'); return; }

  const title = (document.getElementById('import-title')?.value || '').trim();
  if (!title) { showToast('Add a title for your preset'); return; }

  const desc = (document.getElementById('import-desc')?.value || '').trim();
  const trackType = document.getElementById('import-track-type')?.value || '';
  const genre = (document.getElementById('import-genre')?.value || '').trim();
  const fxText = (document.getElementById('import-fx-chain')?.value || '').trim();
  const coverFile = document.getElementById('import-cover-file')?.files?.[0] || null;
  const isPublic = !document.getElementById('privacy-toggle')?.classList.contains('off');

  const btn = document.querySelector('#import-step-2 .btn-import-primary');
  const origHTML = btn.innerHTML;
  btn.innerHTML = 'Saving…'; btn.disabled = true;

  const { data, error } = await pl_createPreset({
    title, description: desc,
    bandlab_url: window._import_bandlab_url || null,
    track_type: trackType || null,
    genre: genre || null,
    fx_chain: fxText ? [{ effect: fxText, params: {} }] : [],
    visibility: isPublic ? 'public' : 'private'
  }, coverFile);

  btn.innerHTML = origHTML; btn.disabled = false;

  if (error) { showToast(error.message || 'Failed to save preset'); return; }

  const nameEl = document.getElementById('import-success-name');
  if (nameEl) nameEl.textContent = title;
  goImportStep(3);
  pl_loadFeed(_pl_feedTab);
}



/* ══════════════════════════════════════════════════════════════════
   SUPABASE WIRING — Auth, Feed, Social, Profile
   ══════════════════════════════════════════════════════════════════ */

// ── Auth modal handlers ──────────────────────────────────────────
async function pl_doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-password').value;
  if (!email || !pw) { showToast('Enter email and password'); return; }
  const btn = document.querySelector('#modal-bg .btn-login');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  const { error } = await pl_signIn(email, pw);
  btn.textContent = 'Log In'; btn.disabled = false;
  if (error) { showToast(error.message || 'Login failed'); return; }
  closeModal();
  showToast('Welcome back! 🎛️');
}

async function pl_doSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const handle = document.getElementById('signup-handle').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pw = document.getElementById('signup-password').value;
  if (!name || !handle || !email || !pw) { showToast('Fill in all fields'); return; }
  if (pw.length < 6) { showToast('Password must be at least 6 characters'); return; }
  const btn = document.querySelector('#signup-bg .btn-login');
  btn.textContent = 'Creating…'; btn.disabled = true;
  const { error } = await pl_signUp(email, pw, handle, name);
  btn.textContent = 'Create Account'; btn.disabled = false;
  if (error) { showToast(error.message || 'Sign up failed'); return; }
  closeSignup();
  showToast('Welcome to PreLab! 🎛️');
}

async function pl_doSignOut() {
  await pl_signOut();
  showToast('Signed out');
  pl_loadFeed('trending');
}

// ── Auth state → UI ──────────────────────────────────────────────
window._pl_onAuthChange = async function (event, session) {
  const authed = document.getElementById('topbar-authed');
  const anon = document.getElementById('topbar-anon');
  const profBtn = document.getElementById('profile-signup-btn');

  if (session) {
    if (authed) authed.style.display = 'flex';
    if (anon) anon.style.display = 'none';
    if (profBtn) profBtn.style.display = 'none';
    const { data } = await pl_getProfile(session.user.id);
    if (data) pl_renderProfile(data);
  } else {
    if (authed) authed.style.display = 'none';
    if (anon) anon.style.display = 'flex';
    if (profBtn) profBtn.style.display = '';
  }
  pl_loadFeed(_pl_feedTab);
};

// ── Feed ─────────────────────────────────────────────────────────
let _pl_feedTab = 'trending';

async function pl_loadFeed(tab) {
  if (tab) _pl_feedTab = tab;
  const liveEl = document.getElementById('live-feed');
  const demoEl = document.getElementById('demo-feed');
  if (!liveEl) return;

  liveEl.innerHTML = '<div style="text-align:center;padding:40px;color:#555;font-size:14px">Loading presets…</div>';

  const { data, error } = await pl_getFeed({ tab: _pl_feedTab });
  if (error) {
    liveEl.innerHTML = '';
    if (demoEl) demoEl.style.display = '';
    return;
  }

  if (data && data.length) {
    liveEl.innerHTML = data.map(pl_renderCard).join('');
    if (demoEl) demoEl.style.display = 'none';
  } else {
    liveEl.innerHTML = '';
    if (demoEl) demoEl.style.display = '';
  }
}

// ── Card renderer ────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const _PL_AV_COLORS = [
  '#f5a623,#e03e8a','#a56eff,#3ecf6a','#3ecf6a,#00c2ff',
  '#e03e8a,#a56eff','#00c2ff,#3ecf6a','#f5a623,#a56eff'
];

function pl_renderCard(p) {
  const name = p.author?.display_name || p.author?.handle || 'Producer';
  const handle = p.author?.handle || 'unknown';
  const initials = name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  const ci = (p.author_id?.charCodeAt(0) || 0) % _PL_AV_COLORS.length;

  const hashtags = [p.genre, p.track_type].filter(Boolean)
    .map(t => `<span>#${escHtml(t.toLowerCase().replace(/\s+/g,''))}</span>`).join('');

  const blBtn = p.bandlab_url
    ? `<a href="${escHtml(p.bandlab_url)}" target="_blank" rel="noopener" class="pcard-open-btn"><svg class="bl-logo"><use href="#ic-bandlab"/></svg>Open in BandLab</a>`
    : '';

  const bars = Array.from({ length: 14 }, (_, i) =>
    `<div style="width:3px;height:${6 + Math.abs(Math.sin(i * 0.9 + (p.id?.charCodeAt(0) || 0))) * 18 | 0}px;background:#a56eff;border-radius:2px;opacity:0.8"></div>`
  ).join('');

  return `
  <article class="pcard" data-id="${escHtml(p.id)}" data-author="${escHtml(p.author_id)}">
    <div class="pcard-top">
      <div class="pcard-avatar" style="background:linear-gradient(135deg,${_PL_AV_COLORS[ci]})">${escHtml(initials)}</div>
      <div class="pcard-user">
        <div class="pcard-name">${escHtml(name)}</div>
        <div class="pcard-handle">@${escHtml(handle)}</div>
      </div>
      <button class="pcard-follow${p.viewer_follows_author ? ' following' : ''}" onclick="pl_uiFollow(this,'${escHtml(p.author_id)}')">${p.viewer_follows_author ? 'Following' : 'Follow'}</button>
      <button class="pcard-more" onclick="showToast('More options')"><svg><use href="#ic-more"/></svg></button>
    </div>
    <div class="pcard-caption">
      <div class="pcard-title">${escHtml(p.title)}</div>
      ${p.description ? `<div class="pcard-desc">${escHtml(p.description)}</div>` : ''}
      <div class="pcard-hashtags">${hashtags}</div>
    </div>
    <div class="pcard-banner">
      <span class="pcard-type badge-desc">${escHtml(p.track_type || 'Preset')}</span>
      <div class="pcard-banner-bars" style="display:flex;gap:2px;align-items:center;padding:0 12px">${bars}</div>
    </div>
    <div class="pcard-footer">
      <button class="act-btn${p.viewer_liked ? ' liked' : ''}" onclick="pl_uiLike(this,'${escHtml(p.id)}')"><svg class="ai"><use href="#ic-heart"/></svg><span>${p.like_count || 0}</span></button>
      <button class="act-btn" onclick="showToast('Comments coming soon')"><svg class="ai"><use href="#ic-comment"/></svg><span>${p.comment_count || 0}</span></button>
      <button class="act-btn" onclick="navigator.clipboard?.writeText(location.href).then(()=>showToast('Link copied!'))"><svg class="ai"><use href="#ic-share"/></svg></button>
      ${blBtn}
    </div>
  </article>`;
}

// ── Social UI handlers ───────────────────────────────────────────
async function pl_uiLike(btn, presetId) {
  const session = await pl_getSession();
  if (!session) { openModal(); return; }
  btn.disabled = true;
  const { liked, error } = await pl_toggleLike(presetId);
  btn.disabled = false;
  if (error) { showToast(error.message || 'Error'); return; }
  btn.classList.toggle('liked', liked);
  const span = btn.querySelector('span');
  if (span) span.textContent = Math.max(0, parseInt(span.textContent || '0') + (liked ? 1 : -1));
}

async function pl_uiFollow(btn, userId) {
  const session = await pl_getSession();
  if (!session) { openModal(); return; }
  btn.disabled = true;
  const { following, error } = await pl_toggleFollow(userId);
  btn.disabled = false;
  if (error) { showToast(error.message || 'Error'); return; }
  btn.textContent = following ? 'Following' : 'Follow';
  btn.classList.toggle('following', following);
  if (following) showToast('Following!');
}

// ── Profile renderer ─────────────────────────────────────────────
function pl_renderProfile(profile) {
  const nameEl = document.querySelector('.profile-name');
  const handleEl = document.querySelector('.profile-handle');
  const avEl = document.querySelector('.profile-av');
  if (nameEl) nameEl.textContent = profile.display_name || profile.handle;
  if (handleEl) handleEl.textContent = '@' + profile.handle;
  if (avEl) {
    const initials = (profile.display_name || profile.handle || '?')
      .split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    avEl.textContent = initials;
  }
}

// ── Feed tab wiring ──────────────────────────────────────────────
const _origSetFeedTab = setFeedTab;
function setFeedTab(el) {
  _origSetFeedTab(el);
  const txt = el.textContent.trim().toLowerCase();
  pl_loadFeed(txt.includes('follow') ? 'following' : 'trending');
}

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  pl_getSession().then(session => {
    window._pl_onAuthChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
  });
});
