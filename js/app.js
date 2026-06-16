/* ══════════════════════════════════════════════
   DREAM ESCAPE HOLIDAYS — app.js
   Database: Supabase (permanent, no token issues)
══════════════════════════════════════════════ */

// ── SUPABASE CONFIG (anon/public key — safe to expose) ──
const SB_URL = 'https://qdshvezjlguwyfdfnxbr.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkc2h2ZXpqbGd1d3lmZGZueGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzI3MjUsImV4cCI6MjA5NzIwODcyNX0.9OVew4x3GINUkiSYpptyumnjAsTT2ryEt47M7phR3n8';

const CONFIG = {
  adminUser: 'admin',
  adminPass: btoa('Sumed@1389'),
  formspree: 'mjgdzpjj',
};

// ── SUPABASE DATA LAYER ───────────────────────
let _cache = {};

async function sbGet(key) {
  try {
    const res  = await fetch(`${SB_URL}/rest/v1/site_data?key=eq.${key}&select=value`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await res.json();
    return rows.length ? JSON.parse(rows[0].value) : null;
  } catch(e) { console.error('sbGet error:', e); return null; }
}

async function sbSet(key, value) {
  const res = await fetch(`${SB_URL}/rest/v1/site_data?key=eq.${key}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ value: JSON.stringify(value) })
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  _cache[key] = value;
  return true;
}

async function loadData(force=false) {
  if (Object.keys(_cache).length && !force) return _cache;
  try {
    const res  = await fetch(`${SB_URL}/rest/v1/site_data?select=key,value`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await res.json();
    _cache = {};
    rows.forEach(r => { try { _cache[r.key] = JSON.parse(r.value); } catch(e) { _cache[r.key] = r.value; } });
    return _cache;
  } catch(e) { console.error('loadData error:', e); return {}; }
}

function waUrl(msg='') {
  const num = (_cache.settings?.whatsapp) || '919156136346';
  return `https://wa.me/${num}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
}

// ── PAGE ROUTING ──────────────────────────────
function showPage(name) {
  ['home','pkgDetail','about','contact'].forEach(p => {
    const el = document.getElementById(p+'Page');
    if (el) el.classList.toggle('active', p===name);
  });
  ['adminLogin','adminPanel'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById('mainNav').style.display    = 'flex';
  document.getElementById('siteFooter').style.display = 'flex';
  document.getElementById('waFloat').style.display    = 'flex';
  window.scrollTo({top:0, behavior:'smooth'});
}

function goAdmin() {
  ['home','pkgDetail','about','contact'].forEach(p => {
    const el = document.getElementById(p+'Page');
    if (el) el.classList.remove('active');
  });
  document.getElementById('mainNav').style.display    = 'none';
  document.getElementById('siteFooter').style.display = 'none';
  document.getElementById('waFloat').style.display    = 'none';
  document.getElementById('adminLogin').classList.add('active');
  document.getElementById('adminPanel').classList.remove('active');
}

function exitAdmin() {
  document.getElementById('adminPanel').classList.remove('active');
  document.getElementById('adminLogin').classList.remove('active');
  _cache = {};
  showPage('home');
  initSite();
}

function toggleMobMenu() { document.getElementById('mobMenu').classList.toggle('open'); }
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 60);
});

// ── SITE INIT ─────────────────────────────────
async function initSite() {
  const d = await loadData(true);

  // Banner
  const banner = d.banner || {};
  const bannerEl = document.getElementById('siteBanner');
  if (bannerEl) {
    bannerEl.style.display = (banner.active && banner.text) ? 'block' : 'none';
    if (banner.active) bannerEl.textContent = banner.text;
  }

  // Hero
  const hero = d.hero || {};
  const el = (id) => document.getElementById(id);
  if (el('heroBadge'))  el('heroBadge').textContent  = hero.badge       || 'Explore Incredible India';
  if (el('heroHead'))   el('heroHead').textContent   = hero.headline    || 'Where Every Journey Becomes';
  if (el('heroEm'))     el('heroEm').textContent     = hero.headline_em || 'a Story';
  if (el('heroSub'))    el('heroSub').textContent    = hero.subtext     || '';

  // Trust
  const trust = d.trust || {};
  if (el('trustTravellers')) el('trustTravellers').textContent = trust.travellers || '500+';
  if (el('trustSince'))      el('trustSince').textContent      = trust.since      || 'Since 2022';
  if (el('trustRating'))     el('trustRating').textContent     = trust.rating     || '4.9 / 5';
  if (el('trustSafety'))     el('trustSafety').textContent     = trust.safety     || '100% Safe';

  // Contact
  const s = d.settings || {};
  const waHref = `https://wa.me/${s.whatsapp || '919156136346'}`;
  document.querySelectorAll('.dyn-wa').forEach(a    => { a.href = waHref; a.textContent = s.phone || '+91 91561 36346'; });
  document.querySelectorAll('.dyn-phone').forEach(a => { a.href = `tel:${(s.phone||'').replace(/\s/g,'')}`.replace('tel:+','tel:+'); a.textContent = s.phone || ''; });
  document.querySelectorAll('.dyn-email').forEach(a => { a.href = `mailto:${s.email||'sales@dreamescapeholidays.com'}`; a.textContent = s.email || 'sales@dreamescapeholidays.com'; });
  document.querySelectorAll('.dyn-hours').forEach(a => { a.innerHTML = (s.hours||'').replace(/\n/g,'<br>'); });
  document.querySelectorAll('.wa-float,.mob-wa-bar,.wa-big').forEach(a => { a.href = waHref; });

  // Render sections
  renderTestimonials(d.testimonials || []);
  renderDepartures(d.departures || []);
  renderPackages(d.packages || []);
}

// ── RENDER PACKAGES ───────────────────────────
function renderPackages(pkgs) {
  const grid   = document.getElementById('packagesGrid');
  const active = pkgs.filter(p => p.status === 'active');
  if (!active.length) { grid.innerHTML = '<p class="no-pkg">No packages available right now. Check back soon!</p>'; return; }
  grid.innerHTML = active.map(p => {
    const img      = p.gallery && p.gallery[0] ? p.gallery[0] : '';
    const fromPrice = p.tiers && p.tiers[0] ? Number(p.tiers[0].price).toLocaleString('en-IN') : '—';
    return `<div class="pkg-card" onclick="openPkgDetail('${p.id}')">
      <div class="pkg-card-img">
        ${img ? `<img src="${img}" alt="${p.name}" loading="lazy">` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--teal-deep),var(--teal))"></div>'}
        <span class="pkg-card-badge">${p.tag.split('·')[0].trim()}</span>
        <span class="pkg-card-nights">${p.duration||''}</span>
      </div>
      <div class="pkg-card-body">
        <h3>${p.name}</h3>
        <p>${p.desc||''}</p>
        <div class="pkg-card-foot">
          <div><div class="pkg-price">₹${fromPrice}<small> / person onwards</small></div></div>
          <button class="btn-view" onclick="event.stopPropagation();openPkgDetail('${p.id}')">View Details</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── RENDER TESTIMONIALS ───────────────────────
function renderTestimonials(list) {
  const grid = document.getElementById('testiGrid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<p style="text-align:center;color:var(--text-muted)">No testimonials yet.</p>'; return; }
  grid.innerHTML = list.map(t => `
    <div class="testi-card">
      <div class="testi-stars">${'★'.repeat(t.rating||5)}</div>
      <p class="testi-text">${t.text}</p>
      <div class="testi-author">
        <div class="testi-avatar">${t.name.charAt(0)}</div>
        <div class="testi-name"><strong>${t.name}</strong><span>${t.city}</span><span class="testi-pkg">${t.pkg}</span></div>
      </div>
    </div>`).join('');
}

// ── RENDER DEPARTURES ─────────────────────────
function renderDepartures(list) {
  const sec = document.getElementById('departuresSection');
  if (!sec) return;
  const active = list.filter(d => d.active !== false);
  if (!active.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  document.getElementById('departuresList').innerHTML = active.map(d => `
    <div class="dep-item">
      <div class="dep-date">${d.date}</div>
      <div class="dep-pkg">${d.package}</div>
      <div class="dep-seats ${d.seats<=3?'dep-urgent':''}">${d.seats<=3?'🔴':'🟢'} ${d.seats} seat${d.seats===1?'':'s'} left</div>
      <a href="${waUrl(`Hi! I'd like to book the ${d.package} departure on ${d.date}.`)}" target="_blank" class="btn-view" style="font-size:12px;padding:7px 14px">Book Now</a>
    </div>`).join('');
}

// ── PACKAGE DETAIL ────────────────────────────
async function openPkgDetail(id) {
  const d = await loadData();
  const p = (d.packages||[]).find(x => x.id===id);
  if (!p) return;
  const heroImg   = p.gallery&&p.gallery[0] ? p.gallery[0] : 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=75';
  const wa        = waUrl(`Hi! I'm interested in the ${p.name} package. Please share more details.`);
  const fromPrice = p.tiers&&p.tiers[0] ? Number(p.tiers[0].price).toLocaleString('en-IN') : '—';
  const itinHtml  = p.itinerary&&p.itinerary.length ? p.itinerary.map((d,i)=>`<div class="itinerary-day"><div class="itin-day-num">${i+1}<small>DAY</small></div><div class="itin-day-content"><h4>${d.title}</h4><p>${d.desc}</p></div></div>`).join('') : '<p style="color:var(--text-muted);font-size:14px">Itinerary coming soon.</p>';
  const galHtml   = p.gallery&&p.gallery.length ? `<div class="gallery-grid">${p.gallery.map(img=>`<img src="${img}" alt="Gallery" loading="lazy" onclick="openLightbox('${img}')">`).join('')}</div>` : '<p style="color:var(--text-muted)">Gallery coming soon.</p>';
  const tierRows  = p.tiers&&p.tiers.length ? p.tiers.map(t=>`<tr><td>${t.label}</td><td class="price-val">₹${Number(t.price).toLocaleString('en-IN')}</td><td style="font-size:13px;color:var(--text-muted)">Per person</td></tr>`).join('') : '<tr><td colspan="3" style="color:var(--text-muted)">Pricing details coming soon.</td></tr>';
  const inclArr   = (p.included||'').split('\n').filter(x=>x.trim());
  const exclArr   = (p.excluded||'').split('\n').filter(x=>x.trim());
  const tierOpts  = (p.tiers||[]).map(t=>`<option>${t.label} — ₹${Number(t.price).toLocaleString('en-IN')}/person</option>`).join('');
  const waSVG     = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.124.554 4.118 1.522 5.85L.057 23.7a.75.75 0 00.918.918l5.85-1.465A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.959 0-3.794-.5-5.394-1.378l-.386-.217-3.997 1 1-3.997-.217-.386A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`;

  document.getElementById('pkgDetailContent').innerHTML = `
    <div onclick="showPage('home')" class="pkg-detail-back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>Back to all packages</div>
    <div class="pkg-detail-hero"><img src="${heroImg}" alt="${p.name}"><div class="pkg-detail-hero-text"><span class="badge">${p.tag}</span><h1>${p.name}</h1></div></div>
    <div class="pkg-detail-body">
      <div class="pkg-detail-main">
        <div class="pkg-tabs">
          <button class="pkg-tab active" onclick="switchTab(this,'tab-itin')">Itinerary</button>
          <button class="pkg-tab" onclick="switchTab(this,'tab-gallery')">Gallery</button>
          <button class="pkg-tab" onclick="switchTab(this,'tab-pricing')">Pricing</button>
          <button class="pkg-tab" onclick="switchTab(this,'tab-inquiry')">Enquire</button>
        </div>
        <div id="tab-itin" class="tab-panel active">${itinHtml}</div>
        <div id="tab-gallery" class="tab-panel">${galHtml}</div>
        <div id="tab-pricing" class="tab-panel">
          <table class="pricing-table"><thead><tr><th>Type</th><th>Price</th><th>Note</th></tr></thead><tbody>${tierRows}</tbody></table>
          ${inclArr.length?`<h4 style="font-family:var(--fd);font-size:18px;margin-top:28px;margin-bottom:14px;color:var(--teal-deep)">What's Included</h4><ul class="incl-list">${inclArr.map(i=>`<li>${i}</li>`).join('')}</ul>`:''}
          ${exclArr.length?`<h4 style="font-family:var(--fd);font-size:18px;margin-top:24px;margin-bottom:14px;color:var(--teal-deep)">Not Included</h4><ul class="incl-list excl-list">${exclArr.map(i=>`<li>${i}</li>`).join('')}</ul>`:''}
        </div>
        <div id="tab-inquiry" class="tab-panel">
          <h4 style="font-family:var(--fd);font-size:22px;color:var(--teal-deep);margin-bottom:6px;font-weight:400">Book or Enquire</h4>
          <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">Fill in your details and we'll get back to you within a few hours.</p>
          <form class="inq-form" onsubmit="submitInquiry(event,'${p.name}')">
            <input type="hidden" name="_subject" value="New Enquiry: ${p.name}">
            <input type="text"   name="name"       placeholder="Your full name" required>
            <input type="tel"    name="phone"      placeholder="Phone / WhatsApp number" required>
            <input type="email"  name="email"      placeholder="Email address">
            <input type="text"   name="dates"      placeholder="Travel dates (e.g. 15 June – 23 June)">
            <input type="number" name="travellers" placeholder="Number of travellers" min="1">
            <select name="room_type"><option value="">Select room preference</option>${tierOpts}</select>
            <textarea name="message" placeholder="Any special requirements or questions?"></textarea>
            <button type="submit" class="btn-primary">Send Enquiry</button>
            <a href="${wa}" target="_blank" class="sidebar-wa">${waSVG} Or WhatsApp Us Directly</a>
          </form>
        </div>
      </div>
      <div class="pkg-sidebar"><div class="sidebar-card">
        <div class="sidebar-price">₹${fromPrice}<small> / person</small></div>
        <div class="sidebar-nights">${p.duration}${p.season?' · '+p.season:''}</div>
        <div class="sidebar-facts">
          ${p.duration?`<div class="sf-row"><span class="sf-label">Duration</span><span class="sf-val">${p.duration}</span></div>`:''}
          ${p.group?`<div class="sf-row"><span class="sf-label">Group Size</span><span class="sf-val">${p.group}</span></div>`:''}
          ${p.season?`<div class="sf-row"><span class="sf-label">Best Season</span><span class="sf-val">${p.season}</span></div>`:''}
        </div>
        <button class="btn-primary" style="width:100%;padding:12px" onclick="switchTabByName('tab-inquiry')">Enquire Now</button>
        <a href="${wa}" target="_blank" class="sidebar-wa">${waSVG} Chat on WhatsApp</a>
      </div></div>
    </div>`;
  showPage('pkgDetail');
}

function switchTab(btn, panelId) {
  btn.closest('.pkg-tabs').querySelectorAll('.pkg-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  btn.closest('.pkg-detail-main').querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
}
function switchTabByName(panelId) {
  const panel = document.getElementById(panelId); if (!panel) return;
  const tabs  = panel.closest('.pkg-detail-main').querySelectorAll('.pkg-tab');
  tabs.forEach(t=>t.classList.remove('active'));
  panel.closest('.pkg-detail-main').querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  panel.classList.add('active');
  const idx = ['tab-itin','tab-gallery','tab-pricing','tab-inquiry'].indexOf(panelId);
  if (tabs[idx]) tabs[idx].classList.add('active');
  panel.scrollIntoView({behavior:'smooth', block:'start'});
}

// ── FORMS ─────────────────────────────────────
async function submitInquiry(e, pkgName) {
  e.preventDefault();
  const form = e.target; const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…'; btn.disabled = true;
  const fd = new FormData(form);
  const waMsg = `New Enquiry — ${pkgName}\nName: ${fd.get('name')}\nPhone: ${fd.get('phone')}\nEmail: ${fd.get('email')||'Not provided'}\nDates: ${fd.get('dates')||'Not specified'}\nTravellers: ${fd.get('travellers')||'Not specified'}\nRoom: ${fd.get('room_type')||'Not specified'}\nMessage: ${fd.get('message')||'None'}`;
  try {
    const res = await fetch(`https://formspree.io/f/${CONFIG.formspree}`, {method:'POST', body:fd, headers:{'Accept':'application/json'}});
    if (res.ok) { showToast('Enquiry sent! We\'ll contact you shortly. 🙏'); form.reset(); window.open(waUrl(waMsg),'_blank'); }
    else showToast('Something went wrong. Please WhatsApp us directly.');
  } catch { showToast('Something went wrong. Please WhatsApp us directly.'); }
  btn.textContent = 'Send Enquiry'; btn.disabled = false;
}

async function submitContact(e) {
  e.preventDefault();
  const form = e.target; const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…'; btn.disabled = true;
  try {
    const res = await fetch(`https://formspree.io/f/${CONFIG.formspree}`, {method:'POST', body:new FormData(form), headers:{'Accept':'application/json'}});
    if (res.ok) { showToast('Thank you! We\'ll get back to you within a few hours. 🙏'); form.reset(); }
    else showToast('Something went wrong. Please WhatsApp or email us directly.');
  } catch { showToast('Something went wrong. Please WhatsApp or email us directly.'); }
  btn.textContent = 'Send Enquiry'; btn.disabled = false;
}

function openLightbox(src) { document.getElementById('lbImg').src=src; document.getElementById('lightbox').classList.add('open'); }
function closeLightbox()    { document.getElementById('lightbox').classList.remove('open'); }
document.getElementById('lightbox').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeLightbox(); });

// ══════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════
function doLogin() {
  const u = document.getElementById('alUser').value.trim();
  const p = document.getElementById('alPass').value;
  if (u===CONFIG.adminUser && btoa(p)===CONFIG.adminPass) {
    document.getElementById('adminLogin').classList.remove('active');
    document.getElementById('adminPanel').classList.add('active');
    loadAdminDashboard();
  } else { document.getElementById('alErr').style.display='block'; }
}
document.getElementById('alPass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });

function showAdmTab(tab) {
  document.querySelectorAll('.adm-tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.adm-tab-panel').forEach(p=>p.classList.toggle('active', p.id==='admTab_'+tab));
}

async function loadAdminDashboard() {
  const d = await loadData(true);
  renderAdmTable(d.packages||[]);
  loadSettingsForm(d.settings||{});
  loadHeroForm(d.hero||{}, d.trust||{}, d.banner||{});
  renderAdmTestimonials(d.testimonials||[]);
  renderAdmDepartures(d.departures||[]);
}

// ── PACKAGES ──────────────────────────────────
function renderAdmTable(pkgs) {
  document.getElementById('admPkgCount').textContent = pkgs.length;
  const tbody = document.getElementById('admTableBody');
  const msg   = document.getElementById('admNoMsg');
  if (!pkgs.length) { tbody.innerHTML=''; msg.style.display='block'; return; }
  msg.style.display = 'none';
  tbody.innerHTML = pkgs.map(p => {
    const price = p.tiers&&p.tiers[0] ? '₹'+Number(p.tiers[0].price).toLocaleString('en-IN') : '—';
    return `<tr>
      <td style="font-weight:500">${p.name}</td><td>${p.tag||''}</td>
      <td style="font-family:var(--fd);font-size:17px">${price}</td><td>${p.duration||''}</td>
      <td><span class="status-badge ${p.status==='active'?'status-active':'status-draft'}">${p.status}</span></td>
      <td><div class="tbl-acts">
        <button class="btn-adm btn-adm-warn" onclick="showPkgForm('${p.id}')">Edit</button>
        <button class="btn-adm btn-adm-danger" onclick="deletePkg('${p.id}')">Delete</button>
      </div></td></tr>`;
  }).join('');
}

let editingId=null, formGallery=[], formTiers=[], formItinDays=[];

async function showPkgForm(id) {
  editingId=id; formGallery=[]; formTiers=[]; formItinDays=[];
  document.getElementById('admDashboard').style.display='none';
  document.getElementById('admPkgForm').style.display='block';
  document.getElementById('galleryPreview').innerHTML='';
  document.getElementById('itinDaysList').innerHTML='';
  document.getElementById('tiersList').innerHTML='';
  if (id) {
    const d = await loadData();
    const p = (d.packages||[]).find(x=>x.id===id);
    document.getElementById('admFormTitle').textContent = 'Edit Package';
    document.getElementById('fName').value     = p.name     ||'';
    document.getElementById('fTag').value      = p.tag      ||'';
    document.getElementById('fDuration').value = p.duration ||'';
    document.getElementById('fSeason').value   = p.season   ||'';
    document.getElementById('fGroup').value    = p.group    ||'';
    document.getElementById('fDesc').value     = p.desc     ||'';
    document.getElementById('fIncluded').value = p.included ||'';
    document.getElementById('fExcluded').value = p.excluded ||'';
    document.getElementById('fStatus').value   = p.status   ||'active';
    formGallery  = [...(p.gallery||[])];
    formTiers    = JSON.parse(JSON.stringify(p.tiers||[]));
    formItinDays = JSON.parse(JSON.stringify(p.itinerary||[]));
  } else {
    document.getElementById('admFormTitle').textContent = 'Add New Package';
    ['fName','fTag','fDuration','fSeason','fGroup','fDesc','fIncluded','fExcluded'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('fStatus').value = 'active';
    formTiers=[{label:'',price:''}]; formItinDays=[{title:'',desc:''}];
  }
  renderTiers(); renderItinDays(); renderGalleryPreview();
  window.scrollTo({top:0});
}

function cancelPkgForm() {
  document.getElementById('admDashboard').style.display='block';
  document.getElementById('admPkgForm').style.display='none';
  editingId=null;
}

function renderTiers() {
  document.getElementById('tiersList').innerHTML = formTiers.map((t,i)=>`
    <div class="tier-row">
      <input type="text" placeholder="Type (e.g. Double Sharing)" value="${t.label}" oninput="formTiers[${i}].label=this.value">
      <input type="number" placeholder="Price (₹)" value="${t.price}" oninput="formTiers[${i}].price=this.value" style="max-width:150px">
      <button class="tier-del" onclick="formTiers.splice(${i},1);renderTiers()">×</button>
    </div>`).join('');
}
function addTierRow() { formTiers.push({label:'',price:''}); renderTiers(); }

function renderItinDays() {
  document.getElementById('itinDaysList').innerHTML = formItinDays.map((d,i)=>`
    <div class="itin-day-row">
      <div class="itin-day-row-head">
        <span class="itin-day-label">Day ${i+1}</span>
        <input class="itin-day-title-inp" type="text" placeholder="Day title" value="${d.title||''}" oninput="formItinDays[${i}].title=this.value">
        <button class="itin-day-del" onclick="formItinDays.splice(${i},1);renderItinDays()">×</button>
      </div>
      <textarea class="itin-day-desc-inp" placeholder="Describe the day…" oninput="formItinDays[${i}].desc=this.value">${d.desc||''}</textarea>
    </div>`).join('');
}
function addItinDay() { formItinDays.push({title:'',desc:''}); renderItinDays(); }

function renderGalleryPreview() {
  document.getElementById('galleryPreview').innerHTML = formGallery.map((img,i)=>`
    <div class="gp-item"><img src="${img}" alt=""><button class="gp-del" onclick="formGallery.splice(${i},1);renderGalleryPreview()">×</button></div>`).join('');
}
function addImageUrl() {
  const inp=document.getElementById('imgUrlInput'); const url=inp.value.trim();
  if (!url) return; formGallery.push(url); renderGalleryPreview(); inp.value='';
}
function handleImageUpload(e) {
  Array.from(e.target.files).forEach(file=>{
    if (file.size>5*1024*1024) { showToast('File too large (max 5MB).'); return; }
    const reader=new FileReader();
    reader.onload=ev=>{ formGallery.push(ev.target.result); renderGalleryPreview(); };
    reader.readAsDataURL(file);
  });
  e.target.value='';
}

async function savePkg() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { showToast('Package name is required.'); return; }
  const btn = document.querySelector('[onclick="savePkg()"]');
  btn.textContent='Saving…'; btn.disabled=true;
  const pkg = {
    id: editingId||'pkg_'+Date.now(), name,
    tag:      document.getElementById('fTag').value.trim(),
    duration: document.getElementById('fDuration').value.trim(),
    season:   document.getElementById('fSeason').value.trim(),
    group:    document.getElementById('fGroup').value.trim(),
    desc:     document.getElementById('fDesc').value.trim(),
    included: document.getElementById('fIncluded').value.trim(),
    excluded: document.getElementById('fExcluded').value.trim(),
    status:   document.getElementById('fStatus').value,
    tiers: [...formTiers], itinerary: [...formItinDays], gallery: [...formGallery],
  };
  try {
    const d = await loadData();
    const pkgs = d.packages||[];
    if (editingId) { const i=pkgs.findIndex(x=>x.id===editingId); pkgs[i]=pkg; }
    else pkgs.push(pkg);
    await sbSet('packages', pkgs);
    showToast(editingId?'Package updated & live! ✅':'Package added & live! ✅');
    cancelPkgForm(); renderAdmTable(pkgs);
  } catch(err) { showToast('Save failed: '+err.message); console.error(err); }
  btn.textContent='Save Package'; btn.disabled=false;
}

async function deletePkg(id) {
  if (!confirm('Delete this package? Cannot be undone.')) return;
  try {
    const d    = await loadData();
    const pkgs = (d.packages||[]).filter(p=>p.id!==id);
    await sbSet('packages', pkgs);
    _cache.packages = pkgs;
    renderAdmTable(pkgs);
    showToast('Package deleted.');
  } catch { showToast('Delete failed. Please try again.'); }
}

// ── SETTINGS ──────────────────────────────────
function loadSettingsForm(s) {
  document.getElementById('sWa').value    = s.whatsapp||'';
  document.getElementById('sPhone').value = s.phone||'';
  document.getElementById('sEmail').value = s.email||'';
  document.getElementById('sHours').value = s.hours||'';
}
async function saveSettings() {
  const btn = document.getElementById('saveSettingsBtn');
  btn.textContent='Saving…'; btn.disabled=true;
  try {
    const settings = {
      whatsapp: document.getElementById('sWa').value.trim(),
      phone:    document.getElementById('sPhone').value.trim(),
      email:    document.getElementById('sEmail').value.trim(),
      hours:    document.getElementById('sHours').value.trim(),
    };
    await sbSet('settings', settings);
    showToast('Settings saved & live! ✅');
  } catch(err) { showToast('Save failed: '+err.message); }
  btn.textContent='Save Settings'; btn.disabled=false;
}

// ── HOMEPAGE ──────────────────────────────────
function loadHeroForm(hero, trust, banner) {
  document.getElementById('hBadge').value    = hero.badge||'';
  document.getElementById('hHeadline').value = hero.headline||'';
  document.getElementById('hEm').value       = hero.headline_em||'';
  document.getElementById('hSubtext').value  = hero.subtext||'';
  document.getElementById('tTravellers').value = trust.travellers||'';
  document.getElementById('tSince').value      = trust.since||'';
  document.getElementById('tRating').value     = trust.rating||'';
  document.getElementById('tSafety').value     = trust.safety||'';
  document.getElementById('bannerActive').checked = banner.active||false;
  document.getElementById('bannerText').value     = banner.text||'';
}
async function saveHero() {
  const btn = document.getElementById('saveHeroBtn');
  btn.textContent='Saving…'; btn.disabled=true;
  try {
    await sbSet('hero', {
      badge:       document.getElementById('hBadge').value.trim(),
      headline:    document.getElementById('hHeadline').value.trim(),
      headline_em: document.getElementById('hEm').value.trim(),
      subtext:     document.getElementById('hSubtext').value.trim(),
    });
    await sbSet('trust', {
      travellers: document.getElementById('tTravellers').value.trim(),
      since:      document.getElementById('tSince').value.trim(),
      rating:     document.getElementById('tRating').value.trim(),
      safety:     document.getElementById('tSafety').value.trim(),
    });
    await sbSet('banner', {
      active: document.getElementById('bannerActive').checked,
      text:   document.getElementById('bannerText').value.trim(),
    });
    showToast('Homepage updated & live! ✅');
  } catch(err) { showToast('Save failed: '+err.message); }
  btn.textContent='Save Changes'; btn.disabled=false;
}

// ── TESTIMONIALS ──────────────────────────────
function renderAdmTestimonials(list) {
  const el = document.getElementById('admTestiList');
  if (!list.length) { el.innerHTML='<p style="color:var(--text-muted);font-size:14px">No testimonials yet.</p>'; return; }
  el.innerHTML = list.map((t,i)=>`
    <div class="adm-testi-row">
      <div class="adm-testi-info">
        <strong>${t.name}</strong> — ${t.city}
        <span style="font-size:12px;color:var(--text-muted);margin-left:8px">${t.pkg}</span>
        <div style="font-size:13px;color:var(--text-mid);margin-top:4px">${t.text.substring(0,80)}…</div>
      </div>
      <div class="tbl-acts">
        <button class="btn-adm btn-adm-warn" onclick="editTestimonial(${i})">Edit</button>
        <button class="btn-adm btn-adm-danger" onclick="deleteTestimonial(${i})">Delete</button>
      </div>
    </div>`).join('');
}

let editingTestiIdx=null;
function showTestiForm(idx) {
  editingTestiIdx=idx;
  const t = idx!==null ? (_cache.testimonials||[])[idx] : {name:'',city:'',pkg:'',text:'',rating:5};
  document.getElementById('teName').value   = t.name||'';
  document.getElementById('teCity').value   = t.city||'';
  document.getElementById('tePkg').value    = t.pkg||'';
  document.getElementById('teRating').value = t.rating||5;
  document.getElementById('teText').value   = t.text||'';
  document.getElementById('testiForm').style.display='block';
}
function editTestimonial(i) { showTestiForm(i); }
function cancelTestiForm()  { document.getElementById('testiForm').style.display='none'; editingTestiIdx=null; }

async function saveTestimonial() {
  const btn = document.getElementById('saveTestiBtn');
  btn.textContent='Saving…'; btn.disabled=true;
  const t = {
    id:     't_'+Date.now(),
    name:   document.getElementById('teName').value.trim(),
    city:   document.getElementById('teCity').value.trim(),
    pkg:    document.getElementById('tePkg').value.trim(),
    rating: parseInt(document.getElementById('teRating').value)||5,
    text:   document.getElementById('teText').value.trim(),
  };
  if (!t.name||!t.text) { showToast('Name and review text are required.'); btn.textContent='Save Testimonial'; btn.disabled=false; return; }
  try {
    const list = [...(_cache.testimonials||[])];
    if (editingTestiIdx!==null) list[editingTestiIdx]=t; else list.push(t);
    await sbSet('testimonials', list);
    renderAdmTestimonials(list);
    cancelTestiForm();
    showToast('Testimonial saved & live! ✅');
  } catch(err) { showToast('Save failed: '+err.message); }
  btn.textContent='Save Testimonial'; btn.disabled=false;
}

async function deleteTestimonial(i) {
  if (!confirm('Delete this testimonial?')) return;
  try {
    const list = [...(_cache.testimonials||[])];
    list.splice(i,1);
    await sbSet('testimonials', list);
    renderAdmTestimonials(list);
    showToast('Testimonial deleted.');
  } catch { showToast('Delete failed.'); }
}

// ── DEPARTURES ────────────────────────────────
function renderAdmDepartures(list) {
  const el = document.getElementById('admDepList');
  if (!list.length) { el.innerHTML='<p style="color:var(--text-muted);font-size:14px">No departures added yet.</p>'; return; }
  el.innerHTML = list.map((d,i)=>`
    <div class="adm-testi-row">
      <div class="adm-testi-info">
        <strong>${d.date}</strong> — ${d.package}
        <span style="font-size:12px;color:var(--text-muted);margin-left:8px">${d.seats} seats left</span>
        <span class="status-badge ${d.active!==false?'status-active':'status-draft'}" style="margin-left:8px">${d.active!==false?'Active':'Hidden'}</span>
      </div>
      <div class="tbl-acts">
        <button class="btn-adm btn-adm-warn" onclick="editDeparture(${i})">Edit</button>
        <button class="btn-adm btn-adm-danger" onclick="deleteDeparture(${i})">Delete</button>
      </div>
    </div>`).join('');
}

let editingDepIdx=null;
function showDepForm(idx) {
  editingDepIdx=idx;
  const dep = idx!==null ? (_cache.departures||[])[idx] : {date:'',package:'',seats:10,active:true};
  document.getElementById('depDate').value    = dep.date||'';
  document.getElementById('depPkg').value     = dep.package||'';
  document.getElementById('depSeats').value   = dep.seats||10;
  document.getElementById('depActive').value  = dep.active!==false?'true':'false';
  document.getElementById('depForm').style.display='block';
}
function editDeparture(i) { showDepForm(i); }
function cancelDepForm()  { document.getElementById('depForm').style.display='none'; editingDepIdx=null; }

async function saveDeparture() {
  const btn = document.getElementById('saveDepBtn');
  btn.textContent='Saving…'; btn.disabled=true;
  const dep = {
    date:    document.getElementById('depDate').value.trim(),
    package: document.getElementById('depPkg').value.trim(),
    seats:   parseInt(document.getElementById('depSeats').value)||10,
    active:  document.getElementById('depActive').value==='true',
  };
  if (!dep.date||!dep.package) { showToast('Date and package name required.'); btn.textContent='Save Departure'; btn.disabled=false; return; }
  try {
    const list = [...(_cache.departures||[])];
    if (editingDepIdx!==null) list[editingDepIdx]=dep; else list.push(dep);
    await sbSet('departures', list);
    renderAdmDepartures(list);
    cancelDepForm();
    showToast('Departure saved & live! ✅');
  } catch(err) { showToast('Save failed: '+err.message); }
  btn.textContent='Save Departure'; btn.disabled=false;
}

async function deleteDeparture(i) {
  if (!confirm('Delete this departure?')) return;
  try {
    const list = [...(_cache.departures||[])];
    list.splice(i,1);
    await sbSet('departures', list);
    renderAdmDepartures(list);
    showToast('Departure deleted.');
  } catch { showToast('Delete failed.'); }
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3800);
}

// ── INIT ──────────────────────────────────────
initSite();
