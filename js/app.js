/* ══════════════════════════════════════════════
   DREAM ESCAPE HOLIDAYS — app.js
   Data stored permanently in GitHub (data.json)
══════════════════════════════════════════════ */

// ── CONFIG ────────────────────────────────────
const CONFIG = {
  whatsapp:   '919156136346',
  phone:      '+91 91561 36346',
  email:      'sales@dreamescapeholidays.com',
  formspree:  'mjgdzpjj',
  adminUser:  'admin',
  adminPass:  btoa('Sumed@1389'),
};

// GitHub config — obfuscated
const _gh = {
  o: atob('UHN5aGlsbGw='),               // Psyhilll
  r: atob('ZHJlYW0tZXNjYXBlLWhvbGlkYXlz'), // dream-escape-holidays
  t: atob('Z2hwX2drd0d4UzNMdEUzckxYVG1kdUdLcHk4Y3RsS1JMSTBuR3dCZQ=='), // token
};
const GH_API  = `https://api.github.com/repos/${_gh.o}/${_gh.r}/contents/data.json`;
const RAW_URL = `https://raw.githubusercontent.com/${_gh.o}/${_gh.r}/main/data.json`;

// WhatsApp URL builder
function waUrl(msg = '') {
  return `https://wa.me/${CONFIG.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
}

// ── GITHUB DATA LAYER ─────────────────────────
let _cachedPkgs = null;
let _fileSha    = null;

async function loadPkgs() {
  if (_cachedPkgs) return _cachedPkgs;
  try {
    const res  = await fetch(RAW_URL + '?t=' + Date.now());
    const data = await res.json();
    _cachedPkgs = data.packages || [];
    return _cachedPkgs;
  } catch (e) {
    console.error('Failed to load packages:', e);
    return [];
  }
}

async function getFileSha() {
  if (_fileSha) return _fileSha;
  try {
    const res  = await fetch(GH_API, { headers: { Authorization: `token ${_gh.t}` } });
    const data = await res.json();
    _fileSha = data.sha;
    return _fileSha;
  } catch (e) {
    return null;
  }
}

async function savePkgsToGitHub(packages) {
  const sha     = await getFileSha();
  const content = btoa(unescape(encodeURIComponent(JSON.stringify({ packages }, null, 2))));
  const res = await fetch(GH_API, {
    method: 'PUT',
    headers: {
      Authorization:  `token ${_gh.t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Admin: update packages',
      content,
      sha,
    }),
  });
  if (!res.ok) throw new Error('GitHub save failed');
  const data = await res.json();
  _fileSha    = data.content?.sha;
  _cachedPkgs = packages;
  return true;
}

// ── PAGE ROUTING ──────────────────────────────
function showPage(name) {
  ['home', 'pkgDetail', 'about', 'contact'].forEach(p => {
    const el = document.getElementById(p + 'Page');
    if (el) el.classList.toggle('active', p === name);
  });
  document.getElementById('adminLogin').classList.remove('active');
  document.getElementById('adminPanel').classList.remove('active');
  document.getElementById('mainNav').style.display   = 'flex';
  document.getElementById('siteFooter').style.display = 'flex';
  document.getElementById('waFloat').style.display   = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goAdmin() {
  ['home', 'pkgDetail', 'about', 'contact'].forEach(p => {
    const el = document.getElementById(p + 'Page');
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
  _cachedPkgs = null; // force refresh
  showPage('home');
  renderPackages();
}

function toggleMobMenu() {
  document.getElementById('mobMenu').classList.toggle('open');
}

window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 60);
});

// ── RENDER CUSTOMER CARDS ─────────────────────
async function renderPackages() {
  const grid = document.getElementById('packagesGrid');
  grid.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);font-size:15px">Loading packages…</p>';
  const pkgs = (await loadPkgs()).filter(p => p.status === 'active');
  if (!pkgs.length) {
    grid.innerHTML = '<p class="no-pkg">No packages available right now. Check back soon!</p>';
    return;
  }
  grid.innerHTML = pkgs.map(p => {
    const coverImg   = p.gallery && p.gallery[0] ? p.gallery[0] : '';
    const fromPrice  = p.tiers  && p.tiers[0]   ? Number(p.tiers[0].price).toLocaleString('en-IN') : '—';
    return `<div class="pkg-card" onclick="openPkgDetail('${p.id}')">
      <div class="pkg-card-img">
        ${coverImg ? `<img src="${coverImg}" alt="${p.name}" loading="lazy">` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--teal-deep),var(--teal))"></div>'}
        <span class="pkg-card-badge">${p.tag.split('·')[0].trim()}</span>
        <span class="pkg-card-nights">${p.duration || ''}</span>
      </div>
      <div class="pkg-card-body">
        <h3>${p.name}</h3>
        <p>${p.desc || ''}</p>
        <div class="pkg-card-foot">
          <div><div class="pkg-price">₹${fromPrice}<small> / person onwards</small></div></div>
          <button class="btn-view" onclick="event.stopPropagation();openPkgDetail('${p.id}')">View Details</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── PACKAGE DETAIL ────────────────────────────
async function openPkgDetail(id) {
  const pkgs = await loadPkgs();
  const p    = pkgs.find(x => x.id === id);
  if (!p) return;

  const heroImg   = p.gallery && p.gallery[0] ? p.gallery[0] : 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=75';
  const wa        = waUrl(`Hi! I'm interested in the ${p.name} package. Please share more details.`);
  const fromPrice = p.tiers && p.tiers[0] ? Number(p.tiers[0].price).toLocaleString('en-IN') : '—';

  const itinHtml = p.itinerary && p.itinerary.length
    ? p.itinerary.map((d, i) => `
      <div class="itinerary-day">
        <div class="itin-day-num">${i + 1}<small>DAY</small></div>
        <div class="itin-day-content"><h4>${d.title}</h4><p>${d.desc}</p></div>
      </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:14px">Itinerary coming soon.</p>';

  const galHtml = p.gallery && p.gallery.length
    ? `<div class="gallery-grid">${p.gallery.map(img => `<img src="${img}" alt="Gallery" loading="lazy" onclick="openLightbox('${img}')">`).join('')}</div>`
    : '<p style="color:var(--text-muted);font-size:14px">Gallery coming soon.</p>';

  const tierRows = p.tiers && p.tiers.length
    ? p.tiers.map(t => `<tr><td>${t.label}</td><td class="price-val">₹${Number(t.price).toLocaleString('en-IN')}</td><td style="font-size:13px;color:var(--text-muted)">Per person</td></tr>`).join('')
    : '<tr><td colspan="3" style="color:var(--text-muted)">Pricing details coming soon.</td></tr>';

  const inclArr     = (p.included || '').split('\n').filter(x => x.trim());
  const exclArr     = (p.excluded || '').split('\n').filter(x => x.trim());
  const tierOptions = (p.tiers || []).map(t => `<option>${t.label} — ₹${Number(t.price).toLocaleString('en-IN')}/person</option>`).join('');
  const waSVG       = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.124.554 4.118 1.522 5.85L.057 23.7a.75.75 0 00.918.918l5.85-1.465A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.959 0-3.794-.5-5.394-1.378l-.386-.217-3.997 1 1-3.997-.217-.386A9.936 9.936 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`;

  document.getElementById('pkgDetailContent').innerHTML = `
    <div onclick="showPage('home');renderPackages()" class="pkg-detail-back">
      <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      Back to all packages
    </div>
    <div class="pkg-detail-hero">
      <img src="${heroImg}" alt="${p.name}">
      <div class="pkg-detail-hero-text">
        <span class="badge">${p.tag}</span>
        <h1>${p.name}</h1>
      </div>
    </div>
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
          <table class="pricing-table">
            <thead><tr><th>Type</th><th>Price</th><th>Note</th></tr></thead>
            <tbody>${tierRows}</tbody>
          </table>
          ${inclArr.length ? `<h4 style="font-family:var(--fd);font-size:18px;margin-top:28px;margin-bottom:14px;color:var(--teal-deep)">What's Included</h4><ul class="incl-list">${inclArr.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
          ${exclArr.length ? `<h4 style="font-family:var(--fd);font-size:18px;margin-top:24px;margin-bottom:14px;color:var(--teal-deep)">Not Included</h4><ul class="incl-list excl-list">${exclArr.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
        </div>
        <div id="tab-inquiry" class="tab-panel">
          <h4 style="font-family:var(--fd);font-size:22px;color:var(--teal-deep);margin-bottom:6px;font-weight:400">Book or Enquire</h4>
          <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px">Fill in your details and we'll get back to you within a few hours.</p>
          <form class="inq-form" onsubmit="submitInquiry(event,'${p.name}')">
            <input type="hidden" name="_subject" value="New Enquiry: ${p.name}">
            <input type="text"   name="name"        placeholder="Your full name" required>
            <input type="tel"    name="phone"       placeholder="Phone / WhatsApp number" required>
            <input type="email"  name="email"       placeholder="Email address">
            <input type="text"   name="dates"       placeholder="Travel dates (e.g. 15 June – 23 June)">
            <input type="number" name="travellers"  placeholder="Number of travellers" min="1">
            <select name="room_type"><option value="">Select room preference</option>${tierOptions}</select>
            <textarea name="message" placeholder="Any special requirements or questions?"></textarea>
            <button type="submit" class="btn-primary">Send Enquiry</button>
            <a href="${wa}" target="_blank" class="sidebar-wa">${waSVG} Or WhatsApp Us Directly</a>
          </form>
        </div>
      </div>
      <div class="pkg-sidebar">
        <div class="sidebar-card">
          <div class="sidebar-price">₹${fromPrice}<small> / person</small></div>
          <div class="sidebar-nights">${p.duration}${p.season ? ' · ' + p.season : ''}</div>
          <div class="sidebar-facts">
            ${p.duration ? `<div class="sf-row"><span class="sf-label">Duration</span><span class="sf-val">${p.duration}</span></div>` : ''}
            ${p.group    ? `<div class="sf-row"><span class="sf-label">Group Size</span><span class="sf-val">${p.group}</span></div>`    : ''}
            ${p.season   ? `<div class="sf-row"><span class="sf-label">Best Season</span><span class="sf-val">${p.season}</span></div>`  : ''}
          </div>
          <button class="btn-primary" style="width:100%;padding:12px" onclick="switchTabByName('tab-inquiry')">Enquire Now</button>
          <a href="${wa}" target="_blank" class="sidebar-wa">${waSVG} Chat on WhatsApp</a>
        </div>
      </div>
    </div>`;

  showPage('pkgDetail');
}

function switchTab(btn, panelId) {
  btn.closest('.pkg-tabs').querySelectorAll('.pkg-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const wrap = btn.closest('.pkg-detail-main');
  wrap.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
}

function switchTabByName(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const tabs = panel.closest('.pkg-detail-main').querySelectorAll('.pkg-tab');
  tabs.forEach(t => t.classList.remove('active'));
  panel.closest('.pkg-detail-main').querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  panel.classList.add('active');
  const idx = ['tab-itin','tab-gallery','tab-pricing','tab-inquiry'].indexOf(panelId);
  if (tabs[idx]) tabs[idx].classList.add('active');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── FORM SUBMISSIONS ──────────────────────────
async function submitInquiry(e, pkgName) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…'; btn.disabled = true;
  const fd   = new FormData(form);
  const waMsg = `New Enquiry — ${pkgName}\nName: ${fd.get('name')}\nPhone: ${fd.get('phone')}\nEmail: ${fd.get('email')||'Not provided'}\nDates: ${fd.get('dates')||'Not specified'}\nTravellers: ${fd.get('travellers')||'Not specified'}\nRoom: ${fd.get('room_type')||'Not specified'}\nMessage: ${fd.get('message')||'None'}`;
  try {
    const res = await fetch(`https://formspree.io/f/${CONFIG.formspree}`, {
      method: 'POST', body: fd, headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      showToast('Enquiry sent! We\'ll contact you shortly. 🙏');
      form.reset();
      window.open(waUrl(waMsg), '_blank');
    } else { showToast('Something went wrong. Please WhatsApp us directly.'); }
  } catch { showToast('Something went wrong. Please WhatsApp us directly.'); }
  btn.textContent = 'Send Enquiry'; btn.disabled = false;
}

async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…'; btn.disabled = true;
  try {
    const res = await fetch(`https://formspree.io/f/${CONFIG.formspree}`, {
      method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }
    });
    if (res.ok) { showToast('Thank you! We\'ll get back to you within a few hours. 🙏'); form.reset(); }
    else { showToast('Something went wrong. Please WhatsApp or email us directly.'); }
  } catch { showToast('Something went wrong. Please WhatsApp or email us directly.'); }
  btn.textContent = 'Send Enquiry'; btn.disabled = false;
}

// Lightbox
function openLightbox(src) { document.getElementById('lbImg').src = src; document.getElementById('lightbox').classList.add('open'); }
function closeLightbox()    { document.getElementById('lightbox').classList.remove('open'); }
document.getElementById('lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) closeLightbox(); });

// ── ADMIN LOGIN ───────────────────────────────
function doLogin() {
  const u = document.getElementById('alUser').value.trim();
  const p = document.getElementById('alPass').value;
  if (u === CONFIG.adminUser && btoa(p) === CONFIG.adminPass) {
    document.getElementById('adminLogin').classList.remove('active');
    document.getElementById('adminPanel').classList.add('active');
    renderAdmTable();
  } else {
    document.getElementById('alErr').style.display = 'block';
  }
}
document.getElementById('alPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// ── ADMIN TABLE ───────────────────────────────
async function renderAdmTable() {
  const tbody = document.getElementById('admTableBody');
  const msg   = document.getElementById('admNoMsg');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Loading…</td></tr>';
  const pkgs = await loadPkgs();
  document.getElementById('admPkgCount').textContent = pkgs.length;
  if (!pkgs.length) { tbody.innerHTML = ''; msg.style.display = 'block'; return; }
  msg.style.display = 'none';
  tbody.innerHTML = pkgs.map(p => {
    const price = p.tiers && p.tiers[0] ? '₹' + Number(p.tiers[0].price).toLocaleString('en-IN') : '—';
    return `<tr>
      <td style="font-weight:500">${p.name}</td>
      <td>${p.tag || ''}</td>
      <td style="font-family:var(--fd);font-size:17px">${price}</td>
      <td>${p.duration || ''}</td>
      <td><span class="status-badge ${p.status === 'active' ? 'status-active' : 'status-draft'}">${p.status}</span></td>
      <td><div class="tbl-acts">
        <button class="btn-adm btn-adm-warn"   onclick="showPkgForm('${p.id}')">Edit</button>
        <button class="btn-adm btn-adm-danger"  onclick="deletePkg('${p.id}')">Delete</button>
      </div></td>
    </tr>`;
  }).join('');
}

// ── ADMIN FORM ────────────────────────────────
let editingId    = null;
let formGallery  = [];
let formTiers    = [];
let formItinDays = [];

async function showPkgForm(id) {
  editingId = id;
  formGallery = []; formTiers = []; formItinDays = [];
  document.getElementById('admDashboard').style.display = 'none';
  document.getElementById('admPkgForm').style.display   = 'block';
  document.getElementById('galleryPreview').innerHTML   = '';
  document.getElementById('itinDaysList').innerHTML     = '';
  document.getElementById('tiersList').innerHTML        = '';

  if (id) {
    const pkgs = await loadPkgs();
    const p    = pkgs.find(x => x.id === id);
    document.getElementById('admFormTitle').textContent = 'Edit Package';
    document.getElementById('fName').value     = p.name     || '';
    document.getElementById('fTag').value      = p.tag      || '';
    document.getElementById('fDuration').value = p.duration || '';
    document.getElementById('fSeason').value   = p.season   || '';
    document.getElementById('fGroup').value    = p.group    || '';
    document.getElementById('fDesc').value     = p.desc     || '';
    document.getElementById('fIncluded').value = p.included || '';
    document.getElementById('fExcluded').value = p.excluded || '';
    document.getElementById('fStatus').value   = p.status   || 'active';
    formGallery  = p.gallery   ? [...p.gallery]                          : [];
    formTiers    = p.tiers     ? JSON.parse(JSON.stringify(p.tiers))     : [];
    formItinDays = p.itinerary ? JSON.parse(JSON.stringify(p.itinerary)) : [];
  } else {
    document.getElementById('admFormTitle').textContent = 'Add New Package';
    ['fName','fTag','fDuration','fSeason','fGroup','fDesc','fIncluded','fExcluded'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fStatus').value = 'active';
    formTiers    = [{ label: '', price: '' }];
    formItinDays = [{ title: '', desc: '' }];
  }
  renderTiers(); renderItinDays(); renderGalleryPreview();
  window.scrollTo({ top: 0 });
}

function cancelPkgForm() {
  document.getElementById('admDashboard').style.display = 'block';
  document.getElementById('admPkgForm').style.display   = 'none';
  editingId = null;
}

function renderTiers() {
  document.getElementById('tiersList').innerHTML = formTiers.map((t, i) => `
    <div class="tier-row">
      <input type="text"   placeholder="Type (e.g. Double Sharing)" value="${t.label}" oninput="formTiers[${i}].label=this.value">
      <input type="number" placeholder="Price (₹)" value="${t.price}" oninput="formTiers[${i}].price=this.value" style="max-width:150px">
      <button class="tier-del" onclick="formTiers.splice(${i},1);renderTiers()">×</button>
    </div>`).join('');
}
function addTierRow() { formTiers.push({ label: '', price: '' }); renderTiers(); }

function renderItinDays() {
  document.getElementById('itinDaysList').innerHTML = formItinDays.map((d, i) => `
    <div class="itin-day-row">
      <div class="itin-day-row-head">
        <span class="itin-day-label">Day ${i + 1}</span>
        <input class="itin-day-title-inp" type="text" placeholder="Day title" value="${d.title || ''}" oninput="formItinDays[${i}].title=this.value">
        <button class="itin-day-del" onclick="formItinDays.splice(${i},1);renderItinDays()">×</button>
      </div>
      <textarea class="itin-day-desc-inp" placeholder="Describe the day's activities…" oninput="formItinDays[${i}].desc=this.value">${d.desc || ''}</textarea>
    </div>`).join('');
}
function addItinDay() { formItinDays.push({ title: '', desc: '' }); renderItinDays(); }

function renderGalleryPreview() {
  document.getElementById('galleryPreview').innerHTML = formGallery.map((img, i) => `
    <div class="gp-item">
      <img src="${img}" alt="">
      <button class="gp-del" onclick="formGallery.splice(${i},1);renderGalleryPreview()">×</button>
    </div>`).join('');
}
function addImageUrl() {
  const inp = document.getElementById('imgUrlInput');
  const url = inp.value.trim();
  if (!url) return;
  formGallery.push(url); renderGalleryPreview(); inp.value = '';
}
function handleImageUpload(e) {
  Array.from(e.target.files).forEach(file => {
    if (file.size > 5 * 1024 * 1024) { showToast('File too large (max 5MB).'); return; }
    const reader = new FileReader();
    reader.onload = ev => { formGallery.push(ev.target.result); renderGalleryPreview(); };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

async function savePkg() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { showToast('Package name is required.'); return; }

  const saveBtn = document.querySelector('[onclick="savePkg()"]');
  saveBtn.textContent = 'Saving…'; saveBtn.disabled = true;

  const pkg = {
    id:        editingId || 'pkg_' + Date.now(),
    name,
    tag:       document.getElementById('fTag').value.trim(),
    duration:  document.getElementById('fDuration').value.trim(),
    season:    document.getElementById('fSeason').value.trim(),
    group:     document.getElementById('fGroup').value.trim(),
    desc:      document.getElementById('fDesc').value.trim(),
    included:  document.getElementById('fIncluded').value.trim(),
    excluded:  document.getElementById('fExcluded').value.trim(),
    status:    document.getElementById('fStatus').value,
    tiers:     [...formTiers],
    itinerary: [...formItinDays],
    gallery:   [...formGallery],
  };

  try {
    const pkgs = await loadPkgs();
    if (editingId) { const i = pkgs.findIndex(x => x.id === editingId); pkgs[i] = pkg; }
    else           { pkgs.push(pkg); }
    await savePkgsToGitHub(pkgs);
    showToast(editingId ? 'Package updated & live on website! ✅' : 'Package added & live on website! ✅');
    cancelPkgForm();
    renderAdmTable();
  } catch (err) {
    showToast('Save failed. Please try again.');
    console.error(err);
  }
  saveBtn.textContent = 'Save Package'; saveBtn.disabled = false;
}

async function deletePkg(id) {
  if (!confirm('Delete this package? This cannot be undone.')) return;
  try {
    const pkgs = (await loadPkgs()).filter(p => p.id !== id);
    await savePkgsToGitHub(pkgs);
    renderAdmTable();
    showToast('Package deleted.');
  } catch { showToast('Delete failed. Please try again.'); }
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3800);
}

// ── INIT ──────────────────────────────────────
renderPackages();
