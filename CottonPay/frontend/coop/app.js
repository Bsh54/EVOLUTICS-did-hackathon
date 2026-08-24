/**
 * CottonPay — Espace Coopérative (app.js)
 * Matches React reference design exactly
 */
const API = '';
const cpLang = () => localStorage.getItem('cp_lang') || 'fr';
let currentUser = null, currentCoop = null, dashboardData = null, producersCache = [];
let deliveryState = { npi: null, producer: null, quality: '1er_choix' };

// ============ INIT ============
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch(`${API}/auth/status`, { credentials: 'include' });
    const data = await res.json();
    if (!data.authenticated) { window.location.href = '/coop/login.html'; return; }
    currentUser = data.user;
    await loadDashboard();
  } catch (err) {
    console.error('Init error:', err);
    try { await fetch(`${API}/auth/logout`, { credentials: 'include' }); } catch(e) {}
    window.location.href = '/coop/login.html';
  }
}

// ============ NAVIGATION ============
function navigateTo(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll(`.sidebar-item[data-page="${pageName}"]`).forEach(i => i.classList.add('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll(`.bottom-nav-item[data-page="${pageName}"]`).forEach(i => i.classList.add('active'));

  if (pageName === 'creances') loadCreances(currentCreanceFilter);
  if (pageName === 'intrants') loadIntrants();
  if (pageName === 'caution') loadCaution();
  if (pageName === 'semences') loadSemences();
  if (pageName === 'mecanisation') loadMecanisation();
  if (pageName === 'aic') loadAic();
}

function handleLogout() { window.location.href = '/auth/logout'; }
function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/coop/dashboard`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    if (res.status === 403) {
      try { await fetch(`${API}/auth/logout`, { credentials: 'include' }); } catch(e) {}
      window.location.href = '/?error=not_coop_member'; return;
    }
    dashboardData = await res.json();
    const { stats, coop, member, campaign } = dashboardData;
    currentCoop = coop;
    document.getElementById('greeting').textContent = member.name;
    document.getElementById('memberNpi').textContent = `NPI: ${truncNpi(member.npi)}`;
    document.getElementById('sidebarCoopName').textContent = coop.name;
    document.getElementById('statProducers').textContent = stats.total_producers;
    document.getElementById('statDeliveries').textContent = stats.total_deliveries;
    document.getElementById('statLots').textContent = `${stats.lots_closed} / ${stats.lots_open}`;
    document.getElementById('statAmount').textContent = formatFCFA(stats.total_net);

    document.getElementById('campaignInfo').innerHTML = ` <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;"><div><h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Prix homologués — Conventionnel</h4><div style="display:flex;justify-content:space-between;padding:12px;background:#F1F4F9;border-radius:8px;margin-bottom:8px;"><span>1er choix</span><span class="font-jakarta" style="font-weight:700;">${campaign.prices['1er_choix']} FCFA/kg</span></div><div style="display:flex;justify-content:space-between;padding:12px;background:#F1F4F9;border-radius:8px;"><span>2ème choix</span><span class="font-jakarta" style="font-weight:700;">${campaign.prices['2eme_choix']} FCFA/kg</span></div>${campaign.prices_bio ? ` <h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 12px;">Biologique </h4><div style="display:flex;justify-content:space-between;padding:12px;background:#EEF2F8;border-radius:8px;margin-bottom:8px;"><span>1er choix bio</span><span class="font-jakarta" style="font-weight:700;color:#1C4090;">${campaign.prices_bio['1er_choix']} FCFA/kg</span></div><div style="display:flex;justify-content:space-between;padding:12px;background:#EEF2F8;border-radius:8px;"><span>2ème choix bio</span><span class="font-jakarta" style="font-weight:700;color:#1C4090;">${campaign.prices_bio['2eme_choix']} FCFA/kg</span></div>` : ''} </div><div><h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Prélèvements</h4><div style="display:flex;justify-content:space-between;padding:12px;background:#FBF6EC;border-radius:8px;margin-bottom:8px;"><span>Crédit intrants</span><span class="font-jakarta" style="font-weight:700;">${campaign.deductions.input_credit_per_kg} FCFA/kg</span></div><div style="display:flex;justify-content:space-between;padding:12px;background:#FBF6EC;border-radius:8px;"><span>AIC</span><span class="font-jakarta" style="font-weight:700;">${campaign.deductions.aic_levy_per_kg} FCFA/kg</span></div>${campaign.reconquest_bonus_per_kg ? ` <h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 12px;">Prime reconquête</h4><div style="padding:12px;background:#EEF2FB;border-radius:8px;"><div style="display:flex;justify-content:space-between;"><span>Bonus</span><span class="font-jakarta" style="font-weight:700;color:#2554B0;">+${campaign.reconquest_bonus_per_kg} FCFA/kg</span></div><p style="font-size:11px;color:rgba(107,114,128,1);margin-top:4px;">dès ${(campaign.reconquest_threshold_tonnes/1000).toLocaleString('fr-FR')} 000 t de production nationale</p></div>` : ''} </div></div>${stats.current_lot ? `<div style="margin-top:24px;padding-top:24px;border-top:1px solid #D8DEE7;display:flex;align-items:center;justify-content:space-between;"><span style="font-size:14px;color:rgba(107,114,128,1);">Lot en cours :</span><span class="badge badge-warning">${stats.current_lot.id} (${stats.current_lot.delivery_count}/10 livraisons)</span></div>` : ''}`;
    await loadProducers();
    loadWeather();
  } catch (err) { console.error('Dashboard error:', err); }
}

// ============ MÉTÉO ============
async function loadWeather() {
  const el = document.getElementById('weatherContent');
  if (!el) return;
  try {
    const res = await fetch(`${API}/api/coop/weather`, { credentials: 'include' });
    if (!res.ok) throw new Error('indispo');
    const f = (await res.json()).forecast;
    document.getElementById('weatherPlace').textContent = `${f.commune}${f.used_fallback ? ' (zone)' : ''} • MàJ ${new Date(f.updated_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;
    const ALEVEL = { warning:{bg:'#FBF6EC',c:'#B07A1E'}, info:{bg:'#EEF2FB',c:'#2554B0'}, ok:{bg:'#F1F4F9',c:'#2554B0'} };
    const alerts = f.alerts.map(a => { const s=ALEVEL[a.level]||ALEVEL.ok; return `<div style="display:flex;gap:10px;padding:10px 12px;background:${s.bg};border-radius:8px;margin-bottom:8px;"><span style="font-size:18px;">${a.icon}</span><div><p class="font-jakarta" style="font-weight:700;font-size:13px;color:${s.c};">${a.title}</p><p style="font-size:12px;color:rgba(75,85,99,1);">${a.text}</p></div></div>`; }).join('');
    const days = f.days.map(d => {
      const dn = new Date(d.date).toLocaleDateString('fr-FR',{weekday:'short'});
      const rain = d.rain_mm != null ? Math.round(d.rain_mm) : '—';
      return `<div style="flex:1;min-width:64px;text-align:center;background:rgba(249,250,251,1);border-radius:8px;padding:8px 4px;"><p style="font-size:11px;color:rgba(107,114,128,1);text-transform:capitalize;">${dn}</p><p style="font-size:16px;margin:2px 0;">${d.rain_mm>=5?'':(d.rain_mm>=1?'':'')}</p><p class="font-jakarta" style="font-size:12px;font-weight:700;color:#2554B0;">${rain} mm</p><p style="font-size:11px;color:rgba(107,114,128,1);">${d.tmax!=null?Math.round(d.tmax):'—'}°</p></div>`;
    }).join('');
    el.innerHTML = `${alerts}<div class="flex" style="gap:6px;margin-top:12px;overflow-x:auto;">${days}</div>`;
  } catch (e) {
    el.innerHTML = '<p style="font-size:13px;color:rgba(107,114,128,1);">Météo momentanément indisponible.</p>';
  }
}

async function loadProducers(query = '') {
  try {
    const url = query ? `${API}/api/coop/producers?q=${encodeURIComponent(query)}` : `${API}/api/coop/producers`;
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    producersCache = data.producers || [];
    renderProducers(producersCache);
  } catch (err) { console.error('Producers load error:', err); }
}

function renderProducers(producers) {
  const tbody = document.getElementById('producersBody');
  const empty = document.getElementById('producersEmpty');
  const table = document.getElementById('producersTable');
  if (producers.length === 0) { table.classList.add('hidden'); empty.classList.remove('hidden'); return; }
  table.classList.remove('hidden'); empty.classList.add('hidden');
  tbody.innerHTML = producers.map(p => ` <tr onclick="showProducerDetail('${p.npi}')"><td class="font-mono" style="font-size:13px;">${truncNpi(p.npi)}</td><td style="font-weight:500;">${p.firstname} ${p.name}</td><td class="td-hide-mobile">${p.commune}</td><td><span class="font-jakarta" style="font-weight:700;color:var(--primary);">${p.delivery_count || 0}</span></td><td class="td-hide-mobile" style="color:rgba(107,114,128,1);">${p.last_delivery_date ? formatDate(p.last_delivery_date) : '—'}</td></tr>`).join('');
}

let searchTimeout;
function handleProducerSearch() {
  clearTimeout(searchTimeout);
  const q = document.getElementById('producerSearch').value;
  searchTimeout = setTimeout(() => loadProducers(q), 300);
}

let _currentProducerNpi = null;

async function showProducerDetail(npi) {
  _currentProducerNpi = npi;
  navigateTo('producer-detail');
  try {
    const res = await fetch(`${API}/api/coop/producers/${npi}`, { credentials: 'include' });
    const data = await res.json();
    if (!data.success) { alert(data.error || 'Erreur'); backFromProducerDetail(); return; }
    renderProducerDetailPage(data.producer, data.deliveries || [], data.summary);
  } catch (err) {
    console.error('Producer detail error:', err);
    alert('Erreur de chargement du producteur.');
    backFromProducerDetail();
  }
}

function renderProducerDetailPage(producer, deliveries, summary) {
  const fullName = ((producer.firstname || '') + ' ' + (producer.name || '')).trim() || 'Producteur';
  const initials = ((producer.firstname || '')[0] || '') + ((producer.name || '')[0] || '');

  // Profile
  document.getElementById('pdAvatar').textContent = initials.toUpperCase() || 'PR';
  document.getElementById('pdName').textContent = fullName;
  document.getElementById('pdNpi').textContent = producer.npi;
  document.getElementById('pdPhone').textContent = producer.phone || '—';
  document.getElementById('pdCoop').textContent = currentCoop ? currentCoop.name : (producer.cooperative_id || '—');
  document.getElementById('pdCommune').textContent = producer.commune || '—';

  // Financial summary
  const totalWeight = summary.total_weight_kg || 0;
  const totalGross = summary.total_gross || 0;
  const totalNet = summary.total_net || 0;
  const totalPaid = summary.total_paid || 0;
  const totalDeductions = totalGross - totalNet;
  const totalPending = totalNet - totalPaid;

  document.getElementById('pdStatWeight').textContent = `${totalWeight} kg`;
  document.getElementById('pdStatCount').textContent = summary.total_deliveries || 0;
  document.getElementById('pdStatGross').textContent = formatFCFA(totalGross);
  document.getElementById('pdStatDeductions').textContent = `- ${formatFCFA(totalDeductions)}`;
  document.getElementById('pdStatNet').textContent = formatFCFA(totalNet);
  document.getElementById('pdStatPaid').textContent = `${formatFCFA(totalPaid)} `;
  document.getElementById('pdStatPending').textContent = `${formatFCFA(totalPending)} ⏳`;

  // Deliveries
  const container = document.getElementById('pdDeliveries');
  const empty = document.getElementById('pdDeliveriesEmpty');

  if (!deliveries || deliveries.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    container.innerHTML = deliveries.map(d => {
      let actionHtml = '';
      if (d.credential_status === 'accepted') {
        actionHtml = ` <div style="display:flex;gap:8px;align-items:center;"><span class="badge badge-success" style="font-size:12px;"> Dans le wallet</span><button onclick="window.open('${API}/api/coop/receipt/${d.id}?lang='+cpLang(),'_blank')" style="background:#2554B0;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;" onmouseover="this.style.background='#0f6330'" onmouseout="this.style.background='#2554B0'"> Reçu</button></div>`;
      } else if (d.credential_status === 'issued') {
        actionHtml = ` <button onclick="showProducerQr('${d.id}')" style="background:transparent;border:1px solid #2554B0;color:#2554B0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;" onmouseover="this.style.background='rgba(21,128,61,0.05)'" onmouseout="this.style.background='transparent'"> QR Credential</button>`;
      } else {
        actionHtml = `<span class="badge" style="background:rgba(243,244,246,1);color:rgba(107,114,128,1);font-size:12px;"> Émission en cours</span>`;
      }

      return ` <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid rgba(220,252,231,1);transition:border-color 0.2s;" onmouseover="this.style.borderColor='#2554B0'" onmouseout="this.style.borderColor='rgba(220,252,231,1)'"><div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;"><div><p class="font-jakarta" style="font-weight:700;margin-bottom:4px;color:var(--text);">${d.weight_kg} kg — ${d.quality === '1er_choix' ? '1er choix' : '2ème choix'}</p><p style="font-size:14px;color:rgba(107,114,128,1);">${formatDate(d.date)} · ${d.id || ''}</p></div><span class="badge ${d.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}">${d.payment_status === 'paid' ? ' Payé' : '⏳ En attente'} </span></div><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;"><span class="font-jakarta" style="font-size:18px;color:#2554B0;font-weight:700;">${formatFCFA(d.total_net)}</span>${actionHtml} </div></div>`;
    }).join('');
  }
}

function backFromProducerDetail() {
  _currentProducerNpi = null;
  navigateTo('dashboard');
}

function startDeliveryForProducer() {
  if (_currentProducerNpi) {
    navigateTo('delivery');
    document.getElementById('deliveryNpi').value = _currentProducerNpi;
    verifyDeliveryNpi();
  }
}

async function showProducerQr(deliveryId) {
  const qrContainer = document.getElementById('pdQrContainer');
  const qrError = document.getElementById('pdQrError');
  qrError.style.display = 'none';
  qrContainer.innerHTML = '<div class="spinner" style="width:32px;height:32px;"></div>';
  document.getElementById('producerQrModal').classList.add('open');

  try {
    const res = await fetch(`${API}/api/coop/deliveries/${deliveryId}/credential`, { credentials: 'include' });
    const data = await res.json();
    if (data.credential && data.credential.qrCodeDataUrl) {
      qrContainer.innerHTML = `<img src="${data.credential.qrCodeDataUrl}" alt="QR Credential" style="width:200px;height:200px;" />`;
    } else if (data.credential && data.credential.invitationUrl) {
      qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.credential.invitationUrl)}&color=14532D" alt="QR" style="width:200px;" />`;
    } else {
      throw new Error(data.error || 'Aucune donnée de credential');
    }
  } catch (err) {
    qrContainer.innerHTML = '<p style="color:#EF4444;font-size:40px;"></p>';
    qrError.textContent = err.message;
    qrError.style.display = 'block';
  }
}

// ============ DELIVERY ============
function showDeliveryStep(n) {
  ['delivery-step-1','delivery-step-2','delivery-step-3'].forEach((id,i) => {
    document.getElementById(id).classList.toggle('hidden', i+1 !== n);
  });
}

async function verifyDeliveryNpi() {
  const npi = document.getElementById('deliveryNpi').value.trim();
  if (!npi || npi.length < 10) return;
  const btn = document.getElementById('btnVerifyDeliveryNpi');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/producers/verify`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({npi}) });
    const data = await res.json();
    if (!data.found) {
      document.getElementById('deliveryNpiResult').innerHTML = `<div class="status-card not-found" style="margin-top:16px;"><div class="status-icon"></div><p class="status-text">Ce NPI n'existe pas dans le registre national.</p><button class="btn btn-outline" onclick="document.getElementById('deliveryNpi').value='';document.getElementById('deliveryNpiResult').innerHTML='';">Réessayer</button></div>`;
      return;
    }
    if (!data.affiliated_to_this_coop) {
      document.getElementById('deliveryNpiResult').innerHTML = `<div class="status-card already" style="margin-top:16px;"><div class="status-icon"></div><p class="status-text">${data.identity.firstname} ${data.identity.lastname} n'est pas affilié(e) à votre coopérative.</p><button class="btn btn-cta btn-block" onclick="navigateTo('register-producer');document.getElementById('registerNpi').value='${npi}';">Enregistrer ce producteur d'abord</button></div>`;
      return;
    }
    deliveryState.npi = npi;
    deliveryState.producer = data.identity;
    const init = (data.identity.firstname[0]||'')+(data.identity.lastname[0]||'');
    document.getElementById('deliveryProducerBanner').innerHTML = `<div class="flex items-center" style="gap:12px;"><div style="width:48px;height:48px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">${init.toUpperCase()}</div><div><p class="font-jakarta" style="font-weight:700;">${data.identity.firstname} ${data.identity.lastname}</p><p style="font-size:13px;color:rgba(107,114,128,1);">${data.identity.commune} • NPI: ${npi}</p></div></div>`;
    document.getElementById('deliveryWeight').value = 0;
    selectQuality('1er_choix');
    updateDeliveryPreview();
    showDeliveryStep(2);
  } catch (err) { alert('Erreur de connexion.'); }
  finally { btn.classList.remove('btn-loading'); btn.textContent = 'Rechercher'; }
}

function adjustWeight(d) {
  const inp = document.getElementById('deliveryWeight');
  inp.value = Math.max(0, (parseInt(inp.value)||0) + d);
  updateDeliveryPreview();
}

function selectQuality(q) {
  deliveryState.quality = q;
  const b1 = document.getElementById('qualBtn1er'), b2 = document.getElementById('qualBtn2eme');
  b1.classList.toggle('active', q==='1er_choix');
  b2.classList.toggle('active', q==='2eme_choix');
  updateDeliveryPreview();
}

function updateDeliveryPreview() {
  const w = parseInt(document.getElementById('deliveryWeight').value)||0;
  const price = deliveryState.quality === '1er_choix' ? 300 : 250;
  document.getElementById('previewUnitPrice').textContent = price + ' FCFA/kg';
  document.getElementById('previewGross').textContent = new Intl.NumberFormat('fr-FR').format(w*price) + ' FCFA';
  document.getElementById('btnSubmitDelivery').disabled = w === 0;
}

async function submitDelivery() {
  const weight = parseFloat(document.getElementById('deliveryWeight').value);
  if (!weight || weight <= 0) return;
  const btn = document.getElementById('btnSubmitDelivery');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span> Enregistrement...';
  try {
    const res = await fetch(`${API}/api/coop/deliveries`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({ farmer_npi:deliveryState.npi, weight_kg:weight, quality:deliveryState.quality }) });
    const data = await res.json();
    if (!data.success) { alert(data.error||'Erreur'); return; }
    const d = data.delivery, ded = data.deductions;
    lastDeliveryId = d.id;
    document.getElementById('deliveryRefLabel').textContent = `${d.id} · Lot ${d.lot_number}`;
    document.getElementById('deliveryRecap').innerHTML = `<div style="background:#F1F4F9;border-radius:12px;padding:16px;text-align:left;"><div class="deductions"><div class="row"><span>Poids</span><span>${d.weight_kg} kg · ${d.quality==='1er_choix'?'1er choix':'2ème choix'}</span></div><div class="row"><span>Montant brut</span><span>${formatFCFA(ded.gross)}</span></div><div class="row red"><span>Crédit intrants</span><span>− ${formatFCFA(ded.input_credit)}</span></div><div class="row red"><span>Prélèvements AIC</span><span>− ${formatFCFA(ded.aic)}</span></div><div class="row total"><span>Net à payer</span><span>${formatFCFA(ded.net)}</span></div></div></div>`;
    if (data.credential && data.credential.qrCodeDataUrl) {
      document.getElementById('deliveryQr').innerHTML = `<div style="background:white;padding:16px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);"><img src="${data.credential.qrCodeDataUrl}" alt="QR" style="max-width:220px;border-radius:8px;"></div>`;
    } else if (data.credential && data.credential.invitationUrl) {
      // Fallback: generate QR from invitation URL
      document.getElementById('deliveryQr').innerHTML = `<div style="background:white;padding:16px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);"><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.credential.invitationUrl)}&color=14532D" alt="QR" style="max-width:220px;border-radius:8px;"></div>`;
    } else {
      const errMsg = data.credentialError || 'eidStack non disponible';
      document.getElementById('deliveryQr').innerHTML = `<div style="text-align:center;"><p style="color:var(--warning);font-size:13px;margin-bottom:8px;"> QR code indisponible</p><p style="color:#6b7280;font-size:12px;max-width:300px;margin:0 auto;">${errMsg}</p></div>`;
    }
    showDeliveryStep(3);
  } catch (err) { alert('Erreur réseau.'); }
  finally { btn.classList.remove('btn-loading'); btn.textContent = 'Enregistrer la livraison'; btn.disabled = false; }
}

function resetDelivery() {
  deliveryState = { npi:null, producer:null, quality:'1er_choix' };
  document.getElementById('deliveryNpi').value = '';
  document.getElementById('deliveryNpiResult').innerHTML = '';
  document.getElementById('deliveryQr').innerHTML = '';
  document.getElementById('deliveryRecap').innerHTML = '';
  document.getElementById('deliveryRefLabel').textContent = '';
  showDeliveryStep(1);
  loadDashboard();
}



// ============ REGISTER PRODUCER ============
function showRegisterStep(n) {
  document.getElementById('register-step-1').classList.toggle('hidden', n!==1);
  document.getElementById('register-step-2').classList.toggle('hidden', n!==2);
}

async function verifyRegisterNpi() {
  const npi = document.getElementById('registerNpi').value.trim();
  if (!npi || npi.length < 10) { document.getElementById('registerNpiResult').innerHTML = '<p style="color:#EF4444;font-size:13px;margin-top:8px;">Le NPI doit contenir 16 chiffres</p>'; return; }
  const btn = document.getElementById('btnVerifyRegisterNpi');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span> Vérification...';
  document.getElementById('registerNpiResult').innerHTML = '';
  try {
    const vRes = await fetch(`${API}/api/coop/producers/verify`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({npi}) });
    const vData = await vRes.json();
    if (!vData.found) {
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card not-found"><div class="status-icon"></div><p class="status-text">Ce NPI n'a pas été trouvé dans le registre national.</p><button class="btn btn-outline" onclick="document.getElementById('registerNpi').value='';document.getElementById('registerNpiResult').innerHTML='';">Réessayer</button></div>`;
      return;
    }
    if (vData.already_affiliated && vData.affiliated_to_this_coop) {
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card already"><div class="status-icon"></div><p class="status-text">${vData.identity.firstname} ${vData.identity.lastname} est déjà affilié(e).</p><button class="btn btn-outline" onclick="navigateTo('dashboard')">Retour</button></div>`;
      return;
    }
    if (vData.already_affiliated) {
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card not-found"><div class="status-icon"></div><p class="status-text">Ce producteur est affilié à une autre coopérative.</p></div>`;
      return;
    }
    // Found - show identity then register
    const identity = vData.identity;
    document.getElementById('registerNpiResult').innerHTML = `<div class="status-card found"><div class="status-icon animate-bounce"></div><h3 class="font-jakarta" style="font-weight:700;font-size:18px;color:#065F46;margin-bottom:16px;">Producteur identifié</h3><div class="found-detail"><span class="found-detail-label">Nom</span><span class="found-detail-value">${identity.firstname} ${identity.lastname}</span></div><div class="found-detail"><span class="found-detail-label">Commune</span><span class="found-detail-value">${identity.commune||'—'}</span></div><div style="display:flex;gap:12px;margin-top:16px;"><button class="btn btn-primary flex-1" style="padding:16px;" onclick="confirmRegister('${npi}')">Confirmer l'affiliation</button><button class="btn btn-danger" onclick="document.getElementById('registerNpi').value='';document.getElementById('registerNpiResult').innerHTML='';">Annuler</button></div></div>`;
  } catch (err) { alert('Erreur réseau.'); }
  finally { btn.classList.remove('btn-loading'); btn.textContent = 'Vérifier'; }
}

async function confirmRegister(npi) {
  try {
    const res = await fetch(`${API}/api/coop/producers`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({npi}) });
    const data = await res.json();
    if (data.success) {
      const p = data.producer;
      document.getElementById('registerSuccess').innerHTML = `<strong>${p.firstname} ${p.name}</strong> de ${p.commune} a été affilié(e) à votre coopérative.`;
      showRegisterStep(2);
      loadDashboard();
    } else {
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card not-found"><div class="status-icon"></div><p class="status-text">${data.error||data.message}</p></div>`;
    }
  } catch (err) { alert('Erreur réseau.'); }
}

function resetRegister() {
  document.getElementById('registerNpi').value = '';
  document.getElementById('registerNpiResult').innerHTML = '';
  showRegisterStep(1);
}

// ============ UTILITIES ============
function formatFCFA(n) { return n==null?'—':new Intl.NumberFormat('fr-FR').format(n)+' F'; }
function formatDate(iso) { if(!iso) return '—'; return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}); }
function truncNpi(npi) { if(!npi||npi.length<8) return npi||'—'; return npi.substring(0,4)+'...'+npi.substring(npi.length-4); }

let lastDeliveryId = null; // Set after successful delivery submission

function downloadDeliveryPdf() {
  if (!lastDeliveryId) { alert('Aucune livraison à télécharger.'); return; }
  window.open(`${API}/api/coop/receipt/${lastDeliveryId}?lang=${cpLang()}`, '_blank');
}

function shareDelivery() {
  if (!lastDeliveryId) { alert('Aucune livraison à partager.'); return; }
  // Ouvre le bordereau dans un nouvel onglet — l'utilisateur peut imprimer/enregistrer en PDF et partager
  const w = window.open(`${API}/api/coop/receipt/${lastDeliveryId}?lang=${cpLang()}`, '_blank');
  // Auto-lancer le dialogue d'impression après chargement
  if (w) {
    w.addEventListener('load', () => { setTimeout(() => w.print(), 500); });
  }
}

// ============ CRÉANCES & PAIEMENTS ============
let currentCreanceFilter = 'all';
let _creances = [];
let _creanceParams = { advance_default_rate: 0.6, advance_max_rate: 0.7, advance_fee_rate: 0.03 };

const CREANCE_STATUS = {
  due:      { label: 'À payer',  color: '#B07A1E', bg: '#FBF6EC' },
  advanced: { label: 'Avancée',  color: '#2554B0', bg: '#EEF2FB' },
  settled:  { label: 'Soldée',   color: '#16A34A', bg: '#F1F4F9' }
};

async function loadCreances(status = 'all') {
  currentCreanceFilter = status;
  document.querySelectorAll('#creanceFilters [data-cf]').forEach(b => {
    b.classList.toggle('btn-cta', b.dataset.cf === status);
    b.classList.toggle('btn-outline', b.dataset.cf !== status);
  });
  const list = document.getElementById('creancesList');
  list.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;"><div class="spinner" style="width:32px;height:32px;margin:0 auto;"></div></div>';
  try {
    const q = status === 'all' ? '' : `?status=${status}`;
    const res = await fetch(`${API}/api/coop/creances${q}`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    const data = await res.json();
    _creances = data.creances || [];
    if (data.params) _creanceParams = data.params;
    renderCreanceSummary();
    renderCreances(_creances);
  } catch (e) {
    list.innerHTML = '<div class="glass-card" style="padding:24px;text-align:center;color:#EF4444;">Erreur de chargement des créances.</div>';
  }
}

function filterCreances(status) { loadCreances(status); }

async function renderCreanceSummary() {
  // On charge toujours la totalité pour le résumé (indépendant du filtre)
  let all = _creances;
  try {
    if (currentCreanceFilter !== 'all') {
      const r = await fetch(`${API}/api/coop/creances`, { credentials: 'include' });
      all = (await r.json()).creances || [];
    }
  } catch (e) {}
  const n = s => all.filter(c => c.claim_status === s).length;
  const sum = s => all.filter(c => c.claim_status === s).reduce((t, c) => t + c.net_due, 0);
  const cards = [
    { icon: '⏳', label: 'À payer',  val: n('due'),      sub: formatFCFA(sum('due')),      color: '#B07A1E' },
    { icon: '', label: 'Avancées', val: n('advanced'), sub: formatFCFA(sum('advanced')), color: '#2554B0' },
    { icon: '', label: 'Soldées',  val: n('settled'),  sub: formatFCFA(sum('settled')),  color: '#16A34A' }
  ];
  document.getElementById('creanceSummary').innerHTML = cards.map(c => ` <div class="glass-card" style="padding:16px 18px;"><div style="font-size:22px;margin-bottom:6px;">${c.icon}</div><p class="font-jakarta" style="font-weight:800;font-size:20px;color:${c.color};">${c.val}</p><p style="font-size:12px;color:rgba(107,114,128,1);">${c.label} • ${c.sub}</p></div>`).join('');
}

function renderCreances(list) {
  const el = document.getElementById('creancesList');
  if (!list.length) {
    el.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;color:rgba(107,114,128,1);">Aucune créance dans cette catégorie.</div>';
    return;
  }
  el.innerHTML = list.map(c => {
    const st = CREANCE_STATUS[c.claim_status] || CREANCE_STATUS.due;
    let actions = '';
    if (c.claim_status === 'due') {
      actions = `<button class="btn btn-sm btn-outline" onclick="openAdvanceModal('${c.delivery_id}')"> Avance</button><button class="btn btn-sm btn-cta" onclick="openSettleModal('${c.delivery_id}')"> Régler</button>`;
    } else if (c.claim_status === 'advanced') {
      actions = `<button class="btn btn-sm btn-cta" onclick="openSettleModal('${c.delivery_id}')"> Régler</button>`;
    }
    let detail = '';
    if (c.advance) detail += `<div style="font-size:12.5px;color:#2554B0;margin-top:4px;">Avance ${formatFCFA(c.advance.amount)} versée (prêteur ${c.advance.lender})</div>`;
    if (c.settlement) detail += `<div style="font-size:12.5px;color:#16A34A;margin-top:4px;">Réglée : producteur ${formatFCFA(c.settlement.paid_producer)}${c.settlement.reimbursed_lender ? ' • IMF ' + formatFCFA(c.settlement.reimbursed_lender) : ''}</div>`;
    const ledger = (c.transactions && c.transactions.length)
      ? `<details style="margin-top:10px;"><summary style="cursor:pointer;font-size:12.5px;color:rgba(107,114,128,1);">Registre (${c.transactions.length} transaction${c.transactions.length>1?'s':''})</summary><div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">${c.transactions.map(t => `<div style="display:flex;justify-content:space-between;font-size:12px;background:rgba(249,250,251,1);padding:6px 10px;border-radius:6px;"><span>${t.type} → ${t.to}</span><span class="font-jakarta" style="font-weight:600;">${formatFCFA(t.amount)}</span></div>`).join('')}</div></details>`
      : '';
    return ` <div class="glass-card" style="padding:16px 20px;margin-bottom:12px;"><div class="flex items-center" style="justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div class="flex items-center" style="gap:8px;"><span class="font-jakarta" style="font-weight:700;">${c.farmer_name}</span><span style="font-size:11px;font-weight:700;color:${st.color};background:${st.bg};padding:2px 8px;border-radius:99px;">${st.label}</span></div><div style="font-size:12.5px;color:rgba(107,114,128,1);margin-top:2px;">${c.weight_kg} kg • ${c.delivery_id} • ${new Date(c.date).toLocaleDateString('fr-FR')}</div>${detail} </div><div style="text-align:right;"><p class="font-jakarta" style="font-weight:800;font-size:18px;color:var(--primary);">${formatFCFA(c.net_due)}</p><p style="font-size:11px;color:rgba(107,114,128,1);">net dû</p></div></div><div class="flex" style="gap:8px;margin-top:12px;flex-wrap:wrap;">${actions}</div>${ledger} </div>`;
  }).join('');
}

function _fmt(n) { return formatFCFA(n); }

function openAdvanceModal(id) {
  const c = _creances.find(x => x.delivery_id === id);
  if (!c) return;
  document.getElementById('creanceModalTitle').textContent = ' Avance sur créance';
  document.getElementById('creanceModalSub').textContent = `${c.farmer_name} — net dû ${_fmt(c.net_due)}`;
  document.getElementById('creanceModalError').style.display = 'none';
  const maxPct = Math.round(_creanceParams.advance_max_rate * 100);
  document.getElementById('creanceModalBody').innerHTML = ` <label style="font-size:13px;font-weight:600;">Prêteur (IMF)</label><input id="cmLender" class="input" value="CLCAM" style="margin:6px 0 14px;width:100%;"><label style="font-size:13px;font-weight:600;">Taux d'avance : <span id="cmRateLbl">60%</span> (max ${maxPct}%)</label><input id="cmRate" type="range" min="10" max="${maxPct}" value="60" step="5" style="width:100%;margin:8px 0;" oninput="updateAdvancePreview('${id}')"><div id="cmPreview" style="background:#EEF2FB;border-radius:8px;padding:12px;font-size:13px;"></div>`;
  updateAdvancePreview(id);
  const btn = document.getElementById('creanceModalConfirm');
  btn.textContent = 'Décaisser l\'avance';
  btn.onclick = () => doAdvance(id);
  document.getElementById('creanceModal').classList.add('open');
}

function updateAdvancePreview(id) {
  const c = _creances.find(x => x.delivery_id === id);
  const rate = parseInt(document.getElementById('cmRate').value, 10) / 100;
  document.getElementById('cmRateLbl').textContent = Math.round(rate * 100) + '%';
  const amount = Math.round(c.net_due * rate);
  const fee = Math.round(amount * _creanceParams.advance_fee_rate);
  document.getElementById('cmPreview').innerHTML = ` <div style="display:flex;justify-content:space-between;"><span>Le producteur reçoit maintenant</span><span class="font-jakarta" style="font-weight:700;color:#2554B0;">${_fmt(amount)}</span></div><div style="display:flex;justify-content:space-between;margin-top:4px;color:rgba(107,114,128,1);"><span>Frais (remb. par la créance)</span><span>${_fmt(fee)}</span></div>`;
}

async function doAdvance(id) {
  const rate = parseInt(document.getElementById('cmRate').value, 10) / 100;
  const lender = document.getElementById('cmLender').value.trim() || 'IMF-Partenaire';
  const btn = document.getElementById('creanceModalConfirm');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/creances/${id}/advance`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ rate, lender })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    closeModal('creanceModal');
    loadCreances(currentCreanceFilter);
  } catch (e) {
    const err = document.getElementById('creanceModalError');
    err.textContent = e.message; err.style.display = 'block';
  } finally {
    btn.classList.remove('btn-loading'); btn.textContent = 'Décaisser l\'avance';
  }
}

function openSettleModal(id) {
  const c = _creances.find(x => x.delivery_id === id);
  if (!c) return;
  document.getElementById('creanceModalTitle').textContent = ' Régler la créance';
  document.getElementById('creanceModalSub').textContent = `${c.farmer_name} — net dû ${_fmt(c.net_due)}`;
  document.getElementById('creanceModalError').style.display = 'none';
  let reimb = 0, producer = c.net_due, adv = '';
  if (c.advance) {
    reimb = c.advance.amount + c.advance.fee;
    producer = c.net_due - reimb;
    adv = `<div style="display:flex;justify-content:space-between;margin-top:4px;"><span>Remboursement ${c.advance.lender} (avance + frais)</span><span class="font-jakarta" style="font-weight:600;">${_fmt(reimb)}</span></div>`;
  }
  document.getElementById('creanceModalBody').innerHTML = ` <div style="background:#F1F4F9;border-radius:8px;padding:14px;font-size:13px;"><div style="display:flex;justify-content:space-between;"><span>Net dû</span><span class="font-jakarta" style="font-weight:600;">${_fmt(c.net_due)}</span></div>${adv} <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid rgba(220,252,231,1);"><span style="font-weight:700;">Le producteur reçoit (MoMo)</span><span class="font-jakarta" style="font-weight:800;color:#16A34A;">${_fmt(producer)}</span></div></div><p style="font-size:12px;color:rgba(107,114,128,1);margin-top:10px;">Le décaissement Mobile Money sera tracé et le credential mis à jour.</p>`;
  const btn = document.getElementById('creanceModalConfirm');
  btn.textContent = 'Confirmer le règlement';
  btn.onclick = () => doSettle(id);
  document.getElementById('creanceModal').classList.add('open');
}

async function doSettle(id) {
  const btn = document.getElementById('creanceModalConfirm');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/creances/${id}/settle`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    closeModal('creanceModal');
    loadCreances(currentCreanceFilter);
  } catch (e) {
    const err = document.getElementById('creanceModalError');
    err.textContent = e.message; err.style.display = 'block';
  } finally {
    btn.classList.remove('btn-loading'); btn.textContent = 'Confirmer le règlement';
  }
}

// ============ INTRANTS À CRÉDIT ============
let _intrantsCatalog = [];

async function loadIntrants() {
  const list = document.getElementById('intrantsList');
  list.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;"><div class="spinner" style="width:32px;height:32px;margin:0 auto;"></div></div>';
  try {
    const res = await fetch(`${API}/api/coop/intrants`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    const data = await res.json();
    const t = data.totals || {};
    document.getElementById('intrantsSummary').innerHTML = [
      { icon: '', label: 'Distribué', val: formatFCFA(t.total_distributed || 0), color: '#2554B0' },
      { icon: '↩', label: 'Récupéré', val: formatFCFA(t.total_recovered || 0), color: '#2554B0' },
      { icon: '⏳', label: 'Reste dû', val: formatFCFA(t.balance || 0), color: '#B07A1E' },
      { icon: '', label: 'Bénéficiaires', val: (t.beneficiaries || 0), color: '#6b7280' }
    ].map(c => `<div class="glass-card" style="padding:16px 18px;"><div style="font-size:20px;margin-bottom:6px;">${c.icon}</div><p class="font-jakarta" style="font-weight:800;font-size:18px;color:${c.color};">${c.val}</p><p style="font-size:12px;color:rgba(107,114,128,1);">${c.label}</p></div>`).join('');
    renderIntrantsList(data.accounts || []);
  } catch (e) {
    list.innerHTML = '<div class="glass-card" style="padding:24px;text-align:center;color:#EF4444;">Erreur de chargement.</div>';
  }
}

function renderIntrantsList(accounts) {
  const el = document.getElementById('intrantsList');
  if (!accounts.length) {
    el.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;color:rgba(107,114,128,1);">Aucun intrant distribué. Cliquez sur « Distribuer des intrants ».</div>';
    return;
  }
  el.innerHTML = accounts.map(a => {
    const cleared = a.balance <= 0;
    const badge = cleared
      ? '<span style="font-size:11px;font-weight:700;color:#2554B0;background:#F1F4F9;padding:2px 8px;border-radius:99px;">Soldé</span>'
      : `<span style="font-size:11px;font-weight:700;color:#B07A1E;background:#FBF6EC;padding:2px 8px;border-radius:99px;">Reste ${formatFCFA(a.balance)}</span>`;
    return `<div class="glass-card" style="padding:14px 20px;margin-bottom:10px;cursor:pointer;" onclick="showIntrantAccount('${a.npi}')"><div class="flex items-center" style="justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div class="flex items-center" style="gap:8px;"><span class="font-jakarta" style="font-weight:700;">NPI ${a.npi}</span>${badge}</div><div style="font-size:12.5px;color:rgba(107,114,128,1);margin-top:2px;">${a.distribution_count} distribution(s) • distribué ${formatFCFA(a.total_distributed)} • récupéré ${formatFCFA(a.total_recovered)}</div></div><span style="color:rgba(107,114,128,1);">›</span></div></div>`;
  }).join('');
}

async function openIntrantsModal() {
  document.getElementById('intrantNpi').value = '';
  document.getElementById('intrantsError').style.display = 'none';
  const box = document.getElementById('intrantsCatalog');
  box.innerHTML = '<div class="spinner" style="width:24px;height:24px;"></div>';
  document.getElementById('intrantsModal').classList.add('open');
  if (!_intrantsCatalog.length) {
    try {
      const res = await fetch(`${API}/api/coop/intrants/catalog`, { credentials: 'include' });
      _intrantsCatalog = (await res.json()).catalog || [];
    } catch (e) {}
  }
  box.innerHTML = _intrantsCatalog.map(c => ` <div class="flex items-center" style="justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid rgba(243,244,246,1);"><div><p class="font-jakarta" style="font-weight:600;font-size:14px;">${c.label}</p><p style="font-size:11px;color:rgba(107,114,128,1);">${c.default_price} FCFA / ${c.unit}</p></div><input type="number" min="0" value="0" data-type="${c.type}" data-price="${c.default_price}" class="input intrant-qty" style="width:80px;text-align:center;" oninput="computeIntrantsTotal()"></div>`).join('');
  computeIntrantsTotal();
}

function computeIntrantsTotal() {
  let total = 0;
  document.querySelectorAll('.intrant-qty').forEach(i => { total += (parseFloat(i.value) || 0) * parseFloat(i.dataset.price); });
  document.getElementById('intrantsTotal').textContent = formatFCFA(total);
  return total;
}

async function submitIntrants() {
  const npi = document.getElementById('intrantNpi').value.trim();
  const err = document.getElementById('intrantsError');
  err.style.display = 'none';
  if (!npi || npi.length < 10) { err.textContent = 'NPI du producteur invalide.'; err.style.display = 'block'; return; }
  const items = [];
  document.querySelectorAll('.intrant-qty').forEach(i => {
    const q = parseFloat(i.value) || 0;
    if (q > 0) items.push({ type: i.dataset.type, quantity: q });
  });
  if (!items.length) { err.textContent = 'Sélectionnez au moins un intrant.'; err.style.display = 'block'; return; }
  const btn = document.getElementById('intrantsConfirm');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/intrants`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ producer_npi: npi, items })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    closeModal('intrantsModal');
    loadIntrants();
  } catch (e) {
    err.textContent = e.message; err.style.display = 'block';
  } finally {
    btn.classList.remove('btn-loading'); btn.textContent = 'Enregistrer';
  }
}

async function showIntrantAccount(npi) {
  const el = document.getElementById('intrantAccountContent');
  el.innerHTML = '<div class="spinner" style="width:28px;height:28px;margin:20px auto;"></div>';
  document.getElementById('intrantAccountModal').classList.add('open');
  try {
    const res = await fetch(`${API}/api/coop/intrants/${npi}`, { credentials: 'include' });
    const a = (await res.json()).account;
    const dists = (a.distributions || []).map(d => ` <div style="background:rgba(249,250,251,1);border-radius:8px;padding:10px 12px;margin-bottom:8px;"><div class="flex items-center" style="justify-content:space-between;"><span style="font-size:12px;color:rgba(107,114,128,1);">${d.id} • ${new Date(d.date).toLocaleDateString('fr-FR')}</span><span class="font-jakarta" style="font-weight:700;">${formatFCFA(d.total)}</span></div><div style="font-size:12px;color:rgba(75,85,99,1);margin-top:4px;">${d.items.map(it => `${it.quantity} ${it.unit} ${it.label}`).join(' • ')}</div></div>`).join('') || '<p style="color:rgba(107,114,128,1);font-size:13px;">Aucune distribution.</p>';
    el.innerHTML = ` <h3 class="font-jakarta" style="font-weight:700;font-size:19px;margin-bottom:12px;">Compte intrants — NPI ${a.npi}</h3><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;"><div style="background:#F1F4F9;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:11px;color:rgba(107,114,128,1);">Distribué</p><p class="font-jakarta" style="font-weight:800;color:#2554B0;">${formatFCFA(a.total_distributed)}</p></div><div style="background:#EEF2FB;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:11px;color:rgba(107,114,128,1);">Récupéré</p><p class="font-jakarta" style="font-weight:800;color:#2554B0;">${formatFCFA(a.total_recovered)}</p></div><div style="background:#FBF6EC;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:11px;color:rgba(107,114,128,1);">Reste dû</p><p class="font-jakarta" style="font-weight:800;color:#B07A1E;">${formatFCFA(a.balance)}</p></div></div><h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;margin-bottom:8px;">Distributions</h4>${dists}`;
  } catch (e) {
    el.innerHTML = '<p style="color:#EF4444;">Erreur de chargement.</p>';
  }
}

// ============ CAUTION SOLIDAIRE ============
const CAUTION_STATUS = {
  sain:      { label: 'Sain',      color: '#2554B0', bg: '#F1F4F9' },
  attention: { label: 'Attention', color: '#B07A1E', bg: '#FBF6EC' },
  risque:    { label: 'Risque',    color: '#DC2626', bg: 'rgba(254,242,242,1)' }
};

async function loadCaution() {
  const el = document.getElementById('cautionList');
  el.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;"><div class="spinner" style="width:32px;height:32px;margin:0 auto;"></div></div>';
  try {
    const res = await fetch(`${API}/api/coop/caution`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    const groups = (await res.json()).groups || [];
    if (!groups.length) {
      el.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;color:rgba(107,114,128,1);">Aucun cercle. Cliquez sur « Créer un cercle ».</div>';
      return;
    }
    el.innerHTML = groups.map(g => {
      const st = CAUTION_STATUS[g.status] || CAUTION_STATUS.sain;
      return `<div class="glass-card" style="padding:16px 20px;margin-bottom:12px;cursor:pointer;" onclick="showCautionDetail('${g.id}')"><div class="flex items-center" style="justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><div class="flex items-center" style="gap:8px;"><span class="font-jakarta" style="font-weight:700;">${g.name}</span><span style="font-size:11px;font-weight:700;color:${st.color};background:${st.bg};padding:2px 8px;border-radius:99px;">${st.label}</span></div><div style="font-size:12.5px;color:rgba(107,114,128,1);margin-top:2px;">${g.member_count} membres • ${g.members_at_risk} en défaut</div></div><div style="text-align:right;"><p class="font-jakarta" style="font-weight:800;font-size:18px;color:${g.total_debt>0?'#B07A1E':'#2554B0'};">${formatFCFA(g.total_debt)}</p><p style="font-size:11px;color:rgba(107,114,128,1);">dette garantie</p></div></div></div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div class="glass-card" style="padding:24px;text-align:center;color:#EF4444;">Erreur de chargement.</div>';
  }
}

function openCautionModal() {
  document.getElementById('cautionName').value = '';
  document.getElementById('cautionMembers').value = '';
  document.getElementById('cautionError').style.display = 'none';
  document.getElementById('cautionModal').classList.add('open');
}

async function submitCaution() {
  const name = document.getElementById('cautionName').value.trim();
  const members = document.getElementById('cautionMembers').value.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean);
  const err = document.getElementById('cautionError');
  err.style.display = 'none';
  if (!name) { err.textContent = 'Nom du cercle requis.'; err.style.display = 'block'; return; }
  if (members.length < 2) { err.textContent = 'Au moins 2 membres (NPI) requis.'; err.style.display = 'block'; return; }
  const btn = document.getElementById('cautionConfirm');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/caution`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ name, members })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    closeModal('cautionModal');
    loadCaution();
  } catch (e) {
    err.textContent = e.message; err.style.display = 'block';
  } finally {
    btn.classList.remove('btn-loading'); btn.textContent = 'Créer le cercle';
  }
}

async function showCautionDetail(id) {
  const el = document.getElementById('cautionDetailContent');
  el.innerHTML = '<div class="spinner" style="width:28px;height:28px;margin:20px auto;"></div>';
  document.getElementById('cautionDetailModal').classList.add('open');
  try {
    const res = await fetch(`${API}/api/coop/caution/${id}`, { credentials: 'include' });
    const g = (await res.json()).group;
    const st = CAUTION_STATUS[g.status] || CAUTION_STATUS.sain;
    const rows = g.members.map(m => {
      const risk = m.balance > 0;
      return `<div class="flex items-center" style="justify-content:space-between;padding:10px 12px;background:${risk?'rgba(254,242,242,1)':'rgba(249,250,251,1)'};border-radius:8px;margin-bottom:6px;"><span style="font-size:13px;">NPI ${m.npi}</span><span class="font-jakarta" style="font-weight:700;color:${risk?'#DC2626':'#2554B0'};">${risk?formatFCFA(m.balance)+' dû':'à jour'}</span></div>`;
    }).join('');
    el.innerHTML = ` <div class="flex items-center" style="gap:8px;margin-bottom:8px;"><h3 class="font-jakarta" style="font-weight:700;font-size:19px;">${g.name}</h3><span style="font-size:11px;font-weight:700;color:${st.color};background:${st.bg};padding:2px 8px;border-radius:99px;">${st.label}</span></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:14px 0;"><div style="background:rgba(249,250,251,1);border-radius:8px;padding:10px;text-align:center;"><p style="font-size:11px;color:rgba(107,114,128,1);">Membres</p><p class="font-jakarta" style="font-weight:800;">${g.member_count}</p></div><div style="background:#FBF6EC;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:11px;color:rgba(107,114,128,1);">Dette garantie</p><p class="font-jakarta" style="font-weight:800;color:#B07A1E;">${formatFCFA(g.total_debt)}</p></div><div style="background:#EEF2FB;border-radius:8px;padding:10px;text-align:center;"><p style="font-size:11px;color:rgba(107,114,128,1);">Exposition/membre</p><p class="font-jakarta" style="font-weight:800;color:#2554B0;">${formatFCFA(g.exposure_per_member)}</p></div></div><h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;margin-bottom:8px;">Membres</h4>${rows}`;
  } catch (e) {
    el.innerHTML = '<p style="color:#EF4444;">Erreur de chargement.</p>';
  }
}

// ============ SEMENCES ============
let _varieties = [];

async function loadSemences() {
  const el = document.getElementById('semencesList');
  el.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;"><div class="spinner" style="width:32px;height:32px;margin:0 auto;"></div></div>';
  try {
    const res = await fetch(`${API}/api/coop/semences`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    const data = await res.json();
    const s = data.stats || {};
    const varieties = (s.by_variety || []).map(v => `${v.label} (${v.kg}kg)`).join(', ') || '—';
    document.getElementById('semencesSummary').innerHTML = [
      { icon:'', label:'Total distribué', val:(s.total_kg||0)+' kg', color:'#2554B0' },
      { icon:'', label:'Germination moy.', val:(s.avg_germination!=null?s.avg_germination+'%':'—'), color:'#2554B0' },
      { icon:'', label:'Germination faible', val:(s.low_germination_count||0), color:'#DC2626' },
      { icon:'', label:'Variétés', val:(s.by_variety||[]).length, color:'#6b7280' }
    ].map(c=>`<div class="glass-card" style="padding:16px 18px;"><div style="font-size:20px;margin-bottom:6px;">${c.icon}</div><p class="font-jakarta" style="font-weight:800;font-size:18px;color:${c.color};">${c.val}</p><p style="font-size:12px;color:rgba(107,114,128,1);">${c.label}</p></div>`).join('');
    const recs = data.records || [];
    if (!recs.length) { el.innerHTML = '<div class="glass-card" style="padding:40px;text-align:center;color:rgba(107,114,128,1);">Aucune distribution de semences. Cliquez sur « Enregistrer une distribution ».</div>'; return; }
    el.innerHTML = `<div class="glass-card no-hover" style="padding:8px 0;">${recs.map(r=>` <div class="flex items-center" style="justify-content:space-between;gap:12px;padding:12px 20px;border-bottom:1px solid rgba(243,244,246,1);"><div><p class="font-jakarta" style="font-weight:700;">${r.variety_label} <span style="font-weight:400;color:rgba(107,114,128,1);font-size:12.5px;">• ${r.quantity_kg} kg • NPI ${r.producer_npi}</span></p><p style="font-size:12px;color:rgba(107,114,128,1);">${new Date(r.date).toLocaleDateString('fr-FR')}</p></div><span style="font-size:12px;font-weight:700;color:${r.low_germination?'#DC2626':'#2554B0'};background:${r.low_germination?'rgba(254,242,242,1)':'#F1F4F9'};padding:4px 10px;border-radius:99px;">${r.germination_rate}% germ.${r.low_germination?' ':''}</span></div>`).join('')}</div>`;
  } catch (e) {
    el.innerHTML = '<div class="glass-card" style="padding:24px;text-align:center;color:#EF4444;">Erreur de chargement.</div>';
  }
}

async function openSemenceModal() {
  document.getElementById('semNpi').value = '';
  document.getElementById('semQty').value = 0;
  document.getElementById('semError').style.display = 'none';
  if (!_varieties.length) {
    try { _varieties = (await (await fetch(`${API}/api/coop/semences/varieties`, { credentials:'include' })).json()).varieties || []; } catch(e){}
  }
  document.getElementById('semVariety').innerHTML = _varieties.map(v=>`<option value="${v.code}" data-germ="${v.ref_germination}">${v.label} (réf. ${v.ref_germination}%)</option>`).join('');
  semVarietyChanged();
  document.getElementById('semenceModal').classList.add('open');
}

function semVarietyChanged() {
  const sel = document.getElementById('semVariety');
  const opt = sel.options[sel.selectedIndex];
  if (opt) document.getElementById('semGerm').value = opt.dataset.germ;
}

async function submitSemence() {
  const npi = document.getElementById('semNpi').value.trim();
  const variety = document.getElementById('semVariety').value;
  const quantity_kg = parseFloat(document.getElementById('semQty').value) || 0;
  const germination_rate = document.getElementById('semGerm').value;
  const err = document.getElementById('semError'); err.style.display = 'none';
  if (!npi || npi.length < 10) { err.textContent='NPI invalide.'; err.style.display='block'; return; }
  if (!(quantity_kg > 0)) { err.textContent='Quantité invalide.'; err.style.display='block'; return; }
  const btn = document.getElementById('semConfirm');
  btn.classList.add('btn-loading'); btn.innerHTML = '<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/semences`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ producer_npi: npi, variety, quantity_kg, germination_rate }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    closeModal('semenceModal'); loadSemences();
  } catch (e) { err.textContent = e.message; err.style.display = 'block'; }
  finally { btn.classList.remove('btn-loading'); btn.textContent = 'Enregistrer'; }
}

// ============ MÉCANISATION ============
let _mecaData = { types: [], equipments: [] };

async function loadMecanisation() {
  const eqEl = document.getElementById('mecaEquipments');
  const rsEl = document.getElementById('mecaReservations');
  eqEl.innerHTML = '<div class="spinner" style="width:28px;height:28px;margin:12px auto;"></div>';
  try {
    const res = await fetch(`${API}/api/coop/mecanisation`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    const data = await res.json();
    _mecaData = data;
    const s = data.stats || {};
    document.getElementById('mecaSummary').innerHTML = [
      { icon:'', label:'Matériel', val:s.equipment_count||0, color:'#2554B0' },
      { icon:'', label:'Réservations', val:s.total_reservations||0, color:'#2554B0' },
      { icon:'⏭', label:'À venir', val:s.upcoming||0, color:'#B07A1E' }
    ].map(c=>`<div class="glass-card" style="padding:16px 18px;"><div style="font-size:20px;margin-bottom:6px;">${c.icon}</div><p class="font-jakarta" style="font-weight:800;font-size:18px;color:${c.color};">${c.val}</p><p style="font-size:12px;color:rgba(107,114,128,1);">${c.label}</p></div>`).join('');

    eqEl.innerHTML = (data.equipments||[]).length
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">${data.equipments.map(e=>` <div class="glass-card" style="padding:14px 16px;"><p class="font-jakarta" style="font-weight:700;">${e.name}</p><p style="font-size:12px;color:rgba(107,114,128,1);">${e.type} • ${e.upcoming_count} réservation(s) à venir</p></div>`).join('')}</div>`
      : '<div class="glass-card" style="padding:24px;text-align:center;color:rgba(107,114,128,1);">Aucun matériel. Cliquez sur « Matériel ».</div>';

    const today = new Date().toISOString().slice(0,10);
    const upcoming = (data.reservations||[]).filter(r=>r.status!=='annulé' && r.date>=today);
    rsEl.innerHTML = upcoming.length
      ? upcoming.map(r=>`<div class="glass-card" style="padding:12px 18px;margin-bottom:8px;"><div class="flex items-center" style="justify-content:space-between;gap:12px;flex-wrap:wrap;"><div><p class="font-jakarta" style="font-weight:700;">${r.equipment_name} <span style="font-weight:400;color:rgba(107,114,128,1);font-size:12.5px;">• ${new Date(r.date).toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'})}</span></p><p style="font-size:12px;color:rgba(107,114,128,1);">${r.producer_npi?'NPI '+r.producer_npi:'Coopérative'}${r.note?' • '+r.note:''}</p></div><button class="btn btn-sm btn-outline" onclick="cancelReservation('${r.id}')">Annuler</button></div></div>`).join('')
      : '<div class="glass-card" style="padding:24px;text-align:center;color:rgba(107,114,128,1);">Aucune réservation à venir.</div>';
  } catch (e) {
    eqEl.innerHTML = '<div class="glass-card" style="padding:24px;text-align:center;color:#EF4444;">Erreur de chargement.</div>';
  }
}

function openEquipmentModal() {
  document.getElementById('eqName').value = '';
  document.getElementById('eqError').style.display = 'none';
  document.getElementById('eqType').innerHTML = (_mecaData.types||[]).map(t=>`<option value="${t}">${t}</option>`).join('');
  document.getElementById('equipmentModal').classList.add('open');
}

async function submitEquipment() {
  const name = document.getElementById('eqName').value.trim();
  const type = document.getElementById('eqType').value;
  const err = document.getElementById('eqError'); err.style.display='none';
  if (!name) { err.textContent='Nom requis.'; err.style.display='block'; return; }
  const btn = document.getElementById('eqConfirm'); btn.classList.add('btn-loading'); btn.innerHTML='<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/mecanisation/equipment`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({name,type}) });
    const data = await res.json(); if(!res.ok) throw new Error(data.error||'Erreur');
    closeModal('equipmentModal'); loadMecanisation();
  } catch (e) { err.textContent=e.message; err.style.display='block'; }
  finally { btn.classList.remove('btn-loading'); btn.textContent='Ajouter'; }
}

function openReserveModal() {
  if (!(_mecaData.equipments||[]).length) { alert('Ajoutez d\'abord du matériel.'); return; }
  document.getElementById('rsvNpi').value = '';
  document.getElementById('rsvNote').value = '';
  document.getElementById('rsvDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('rsvError').style.display='none';
  document.getElementById('rsvEquipment').innerHTML = _mecaData.equipments.map(e=>`<option value="${e.id}">${e.name} (${e.type})</option>`).join('');
  document.getElementById('reserveModal').classList.add('open');
}

async function submitReserve() {
  const equipment_id = document.getElementById('rsvEquipment').value;
  const producer_npi = document.getElementById('rsvNpi').value.trim();
  const date = document.getElementById('rsvDate').value;
  const note = document.getElementById('rsvNote').value.trim();
  const err = document.getElementById('rsvError'); err.style.display='none';
  if (!date) { err.textContent='Date requise.'; err.style.display='block'; return; }
  const btn = document.getElementById('rsvConfirm'); btn.classList.add('btn-loading'); btn.innerHTML='<span class="spinner-sm"></span>';
  try {
    const res = await fetch(`${API}/api/coop/mecanisation/reserve`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body:JSON.stringify({equipment_id,producer_npi,date,note}) });
    const data = await res.json(); if(!res.ok) throw new Error(data.error||'Erreur');
    closeModal('reserveModal'); loadMecanisation();
  } catch (e) { err.textContent=e.message; err.style.display='block'; }
  finally { btn.classList.remove('btn-loading'); btn.textContent='Réserver'; }
}

async function cancelReservation(id) {
  try {
    await fetch(`${API}/api/coop/mecanisation/reserve/${id}/cancel`, { method:'POST', credentials:'include' });
    loadMecanisation();
  } catch (e) {}
}

// ============ VUE UNION (AIC) ============
async function loadAic() {
  const sum = document.getElementById('aicSummary');
  sum.innerHTML = '<div class="spinner" style="width:28px;height:28px;margin:12px auto;"></div>';
  try {
    const res = await fetch(`${API}/api/coop/aic/overview`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/coop/login.html'; return; }
    const o = (await res.json()).overview;
    const t = o.totals;
    sum.innerHTML = [
      { icon:'', label:'Coopératives', val:t.cooperatives, color:'#2554B0' },
      { icon:'', label:'Producteurs', val:t.producers, color:'#2554B0' },
      { icon:'', label:'Coton livré', val:formatFCFA(t.total_weight).replace('FCFA','kg'), color:'#2554B0' },
      { icon:'', label:'Net campagne', val:formatFCFA(t.total_net), color:'#B07A1E' },
      { icon:'', label:'Dette intrants', val:formatFCFA(t.intrant_balance), color:'#DC2626' }
    ].map(c=>`<div class="glass-card" style="padding:16px 18px;"><div style="font-size:20px;margin-bottom:6px;">${c.icon}</div><p class="font-jakarta" style="font-weight:800;font-size:18px;color:${c.color};">${c.val}</p><p style="font-size:12px;color:rgba(107,114,128,1);">${c.label}</p></div>`).join('');

    document.getElementById('aicCoopTable').innerHTML = ` <thead><tr>${['Coopérative','Commune','Prod.','Livr.','Coton (kg)','Net (FCFA)','Créances (D/A/S)','Dette intrants'].map(h=>`<th style="text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;color:#14532D;background:#F1F4F9;">${h}</th>`).join('')}</tr></thead><tbody>${o.per_coop.map(c=>`<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 14px;font-weight:600;">${c.name}</td><td style="padding:10px 14px;">${c.commune||'—'}</td><td style="padding:10px 14px;">${c.producers}</td><td style="padding:10px 14px;">${c.deliveries}</td><td style="padding:10px 14px;">${c.total_weight.toLocaleString('fr-FR')}</td><td style="padding:10px 14px;">${c.total_net.toLocaleString('fr-FR')}</td><td style="padding:10px 14px;">${c.creances.due}/${c.creances.advanced}/${c.creances.settled}</td><td style="padding:10px 14px;color:${c.intrant_balance>0?'#B07A1E':'#2554B0'};">${c.intrant_balance.toLocaleString('fr-FR')}</td></tr>`).join('')||'<tr><td style="padding:16px;color:#6b7280;" colspan="8">Aucune donnée.</td></tr>'}</tbody>`;

    document.getElementById('aicCommuneTable').innerHTML = ` <thead><tr>${['Commune','Coops','Producteurs','Coton (kg)','Net (FCFA)'].map(h=>`<th style="text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;color:#14532D;background:#F1F4F9;">${h}</th>`).join('')}</tr></thead><tbody>${o.by_commune.map(c=>`<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:10px 14px;font-weight:600;">${c.commune}</td><td style="padding:10px 14px;">${c.coops}</td><td style="padding:10px 14px;">${c.producers}</td><td style="padding:10px 14px;">${c.total_weight.toLocaleString('fr-FR')}</td><td style="padding:10px 14px;">${c.total_net.toLocaleString('fr-FR')}</td></tr>`).join('')||'<tr><td style="padding:16px;color:#6b7280;" colspan="5">Aucune donnée.</td></tr>'}</tbody>`;
  } catch (e) {
    sum.innerHTML = '<div class="glass-card" style="padding:24px;text-align:center;color:#EF4444;">Erreur de chargement.</div>';
  }
}

// ============ ENRÔLEMENT LOGIN WALLET ============
async function enrollWallet() {
  const box = document.getElementById('enrollQr');
  const err = document.getElementById('enrollErr');
  err.style.display = 'none';
  box.innerHTML = '<div class="spinner" style="width:28px;height:28px;"></div>';
  document.getElementById('enrollModal').classList.add('open');
  try {
    const res = await fetch(`${API}/auth/enroll-member`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur');
    const url = data.invitationUrl;
    if (!url) throw new Error('Pas de QR reçu');
    box.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=216x216&data=${encodeURIComponent(url)}&color=14532D" alt="QR" style="width:216px;height:216px;">`;
  } catch (e) {
    box.innerHTML = '<p style="color:#EF4444;font-size:32px;"></p>';
    err.textContent = e.message; err.style.display = 'block';
  }
}

// Click outside modal to close
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if(e.target===m) m.classList.remove('open'); });
});

console.log(' CottonPay — Espace Coopérative v4');
