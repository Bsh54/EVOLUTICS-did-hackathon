/**
 * CottonPay — Espace Coopérative (app.js)
 * Matches React reference design exactly
 */
const API = '';
let currentUser = null, currentCoop = null, dashboardData = null, producersCache = [];
let deliveryState = { npi: null, producer: null, quality: '1er_choix' };

// ============ INIT ============
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch(`${API}/auth/status`, { credentials: 'include' });
    const data = await res.json();
    if (!data.authenticated) { window.location.href = '/auth/login?flow=coop'; return; }
    currentUser = data.user;
    await loadDashboard();
  } catch (err) {
    console.error('Init error:', err);
    try { await fetch(`${API}/auth/logout`, { credentials: 'include' }); } catch(e) {}
    window.location.href = '/auth/login?flow=coop';
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

}

function handleLogout() { window.location.href = '/auth/logout'; }
function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/coop/dashboard`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/auth/login?flow=coop'; return; }
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

    document.getElementById('campaignInfo').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <div>
          <h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Prix homologués</h4>
          <div style="display:flex;justify-content:space-between;padding:12px;background:rgba(240,253,244,1);border-radius:8px;margin-bottom:8px;"><span>1er choix</span><span class="font-jakarta" style="font-weight:700;">${campaign.prices['1er_choix']} FCFA/kg</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px;background:rgba(240,253,244,1);border-radius:8px;"><span>2ème choix</span><span class="font-jakarta" style="font-weight:700;">${campaign.prices['2eme_choix']} FCFA/kg</span></div>
        </div>
        <div>
          <h4 class="font-jakarta" style="font-weight:600;font-size:13px;color:rgba(107,114,128,1);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Prélèvements</h4>
          <div style="display:flex;justify-content:space-between;padding:12px;background:rgba(255,251,235,1);border-radius:8px;margin-bottom:8px;"><span>Crédit intrants</span><span class="font-jakarta" style="font-weight:700;">${campaign.deductions.input_credit_per_kg} FCFA/kg</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px;background:rgba(255,251,235,1);border-radius:8px;"><span>AIC</span><span class="font-jakarta" style="font-weight:700;">${campaign.deductions.aic_levy_per_kg} FCFA/kg</span></div>
        </div>
      </div>
      ${stats.current_lot ? `<div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(21,128,61,0.1);display:flex;align-items:center;justify-content:space-between;"><span style="font-size:14px;color:rgba(107,114,128,1);">Lot en cours :</span><span class="badge badge-warning">${stats.current_lot.id} (${stats.current_lot.delivery_count}/10 livraisons)</span></div>` : ''}`;
    await loadProducers();
  } catch (err) { console.error('Dashboard error:', err); }
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
  tbody.innerHTML = producers.map(p => `
    <tr onclick="showProducerDetail('${p.npi}')">
      <td class="font-mono" style="font-size:13px;">${truncNpi(p.npi)}</td>
      <td style="font-weight:500;">${p.firstname} ${p.name}</td>
      <td class="td-hide-mobile">${p.commune}</td>
      <td><span class="font-jakarta" style="font-weight:700;color:var(--primary);">${p.delivery_count || 0}</span></td>
      <td class="td-hide-mobile" style="color:rgba(107,114,128,1);">${p.last_delivery_date ? formatDate(p.last_delivery_date) : '—'}</td>
    </tr>`).join('');
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
  document.getElementById('pdStatPaid').textContent = `${formatFCFA(totalPaid)} ✅`;
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
        actionHtml = `
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge badge-success" style="font-size:12px;">✅ Dans le wallet</span>
            <button onclick="window.open('${API}/api/coop/receipt/${d.id}','_blank')" style="background:#15803D;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;" onmouseover="this.style.background='#0f6330'" onmouseout="this.style.background='#15803D'">📥 Reçu</button>
          </div>`;
      } else if (d.credential_status === 'issued') {
        actionHtml = `
          <button onclick="showProducerQr('${d.id}')" style="background:transparent;border:1px solid #15803D;color:#15803D;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;" onmouseover="this.style.background='rgba(21,128,61,0.05)'" onmouseout="this.style.background='transparent'">📱 QR Credential</button>`;
      } else {
        actionHtml = `<span class="badge" style="background:rgba(243,244,246,1);color:rgba(107,114,128,1);font-size:12px;">🕐 Émission en cours</span>`;
      }

      return `
        <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid rgba(220,252,231,1);transition:border-color 0.2s;" onmouseover="this.style.borderColor='#15803D'" onmouseout="this.style.borderColor='rgba(220,252,231,1)'">
          <div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;">
            <div>
              <p class="font-jakarta" style="font-weight:700;margin-bottom:4px;color:var(--text);">${d.weight_kg} kg — ${d.quality === '1er_choix' ? '1er choix' : '2ème choix'}</p>
              <p style="font-size:14px;color:rgba(107,114,128,1);">${formatDate(d.date)} · ${d.id || ''}</p>
            </div>
            <span class="badge ${d.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}">
              ${d.payment_status === 'paid' ? '✅ Payé' : '⏳ En attente'}
            </span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span class="font-jakarta" style="font-size:18px;color:#15803D;font-weight:700;">${formatFCFA(d.total_net)}</span>
            ${actionHtml}
          </div>
        </div>`;
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
    qrContainer.innerHTML = '<p style="color:#EF4444;font-size:40px;">⚠️</p>';
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
      document.getElementById('deliveryNpiResult').innerHTML = `<div class="status-card not-found" style="margin-top:16px;"><div class="status-icon">❌</div><p class="status-text">Ce NPI n'existe pas dans le registre national.</p><button class="btn btn-outline" onclick="document.getElementById('deliveryNpi').value='';document.getElementById('deliveryNpiResult').innerHTML='';">Réessayer</button></div>`;
      return;
    }
    if (!data.affiliated_to_this_coop) {
      document.getElementById('deliveryNpiResult').innerHTML = `<div class="status-card already" style="margin-top:16px;"><div class="status-icon">⚠️</div><p class="status-text">${data.identity.firstname} ${data.identity.lastname} n'est pas affilié(e) à votre coopérative.</p><button class="btn btn-cta btn-block" onclick="navigateTo('register-producer');document.getElementById('registerNpi').value='${npi}';">Enregistrer ce producteur d'abord</button></div>`;
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
    document.getElementById('deliveryRecap').innerHTML = `<div style="background:rgba(240,253,244,1);border-radius:12px;padding:16px;text-align:left;"><div class="deductions"><div class="row"><span>Poids</span><span>${d.weight_kg} kg · ${d.quality==='1er_choix'?'1er choix':'2ème choix'}</span></div><div class="row"><span>Montant brut</span><span>${formatFCFA(ded.gross)}</span></div><div class="row red"><span>Crédit intrants</span><span>− ${formatFCFA(ded.input_credit)}</span></div><div class="row red"><span>Prélèvements AIC</span><span>− ${formatFCFA(ded.aic)}</span></div><div class="row total"><span>Net à payer</span><span>${formatFCFA(ded.net)}</span></div></div></div>`;
    if (data.credential && data.credential.qrCodeDataUrl) {
      document.getElementById('deliveryQr').innerHTML = `<div style="background:white;padding:16px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);"><img src="${data.credential.qrCodeDataUrl}" alt="QR" style="max-width:220px;border-radius:8px;"></div>`;
    } else if (data.credential && data.credential.invitationUrl) {
      // Fallback: generate QR from invitation URL
      document.getElementById('deliveryQr').innerHTML = `<div style="background:white;padding:16px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.1);"><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data.credential.invitationUrl)}&color=14532D" alt="QR" style="max-width:220px;border-radius:8px;"></div>`;
    } else {
      const errMsg = data.credentialError || 'eidStack non disponible';
      document.getElementById('deliveryQr').innerHTML = `<div style="text-align:center;"><p style="color:var(--warning);font-size:13px;margin-bottom:8px;">⚠️ QR code indisponible</p><p style="color:#6b7280;font-size:12px;max-width:300px;margin:0 auto;">${errMsg}</p></div>`;
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
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card not-found"><div class="status-icon">❌</div><p class="status-text">Ce NPI n'a pas été trouvé dans le registre national.</p><button class="btn btn-outline" onclick="document.getElementById('registerNpi').value='';document.getElementById('registerNpiResult').innerHTML='';">Réessayer</button></div>`;
      return;
    }
    if (vData.already_affiliated && vData.affiliated_to_this_coop) {
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card already"><div class="status-icon">⚠️</div><p class="status-text">${vData.identity.firstname} ${vData.identity.lastname} est déjà affilié(e).</p><button class="btn btn-outline" onclick="navigateTo('dashboard')">Retour</button></div>`;
      return;
    }
    if (vData.already_affiliated) {
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card not-found"><div class="status-icon">❌</div><p class="status-text">Ce producteur est affilié à une autre coopérative.</p></div>`;
      return;
    }
    // Found - show identity then register
    const identity = vData.identity;
    document.getElementById('registerNpiResult').innerHTML = `<div class="status-card found"><div class="status-icon animate-bounce">✅</div><h3 class="font-jakarta" style="font-weight:700;font-size:18px;color:#065F46;margin-bottom:16px;">Producteur identifié</h3><div class="found-detail"><span class="found-detail-label">Nom</span><span class="found-detail-value">${identity.firstname} ${identity.lastname}</span></div><div class="found-detail"><span class="found-detail-label">Commune</span><span class="found-detail-value">${identity.commune||'—'}</span></div><div style="display:flex;gap:12px;margin-top:16px;"><button class="btn btn-primary flex-1" style="padding:16px;" onclick="confirmRegister('${npi}')">Confirmer l'affiliation</button><button class="btn btn-danger" onclick="document.getElementById('registerNpi').value='';document.getElementById('registerNpiResult').innerHTML='';">Annuler</button></div></div>`;
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
      document.getElementById('registerNpiResult').innerHTML = `<div class="status-card not-found"><div class="status-icon">❌</div><p class="status-text">${data.error||data.message}</p></div>`;
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
  window.open(`${API}/api/coop/receipt/${lastDeliveryId}`, '_blank');
}

function shareDelivery() {
  if (!lastDeliveryId) { alert('Aucune livraison à partager.'); return; }
  // Ouvre le bordereau dans un nouvel onglet — l'utilisateur peut imprimer/enregistrer en PDF et partager
  const w = window.open(`${API}/api/coop/receipt/${lastDeliveryId}`, '_blank');
  // Auto-lancer le dialogue d'impression après chargement
  if (w) {
    w.addEventListener('load', () => { setTimeout(() => w.print(), 500); });
  }
}

// Click outside modal to close
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if(e.target===m) m.classList.remove('open'); });
});

console.log('🏢 CottonPay — Espace Coopérative v4');
