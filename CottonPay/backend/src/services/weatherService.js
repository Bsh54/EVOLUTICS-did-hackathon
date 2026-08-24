/**
 * Weather Service — météo & pluviométrie par commune (facteur clé de la production)
 *
 * Source : Open-Meteo (https://open-meteo.com) — API gratuite, sans clé.
 * Fournit une prévision 7 jours (pluie + températures) et génère des ALERTES
 * agronomiques (fortes pluies, sécheresse, forte chaleur) pour la commune de la coop.
 *
 * Cache mémoire 1h par commune (la météo n'évolue pas à la minute).
 */

// Coordonnées approximatives des communes cotonnières (Borgou / Alibori)
const COMMUNES = {
  'parakou':    { lat: 9.337,  lon: 2.630 },
  'kandi':      { lat: 11.134, lon: 2.938 },
  'banikoara':  { lat: 11.298, lon: 2.438 },
  'gogounou':   { lat: 10.838, lon: 2.838 },
  'nikki':      { lat: 9.940,  lon: 3.211 },
  'bembèrèkè':  { lat: 10.201, lon: 2.669 },
  'bemberebe':  { lat: 10.201, lon: 2.669 },
  'sinendé':    { lat: 10.343, lon: 2.352 },
  'sinende':    { lat: 10.343, lon: 2.352 }
};
const DEFAULT_COORD = { lat: 9.337, lon: 2.630, fallback: 'Parakou' }; // centre Borgou

const _cache = new Map(); // commune -> { at, data }
const TTL_MS = 60 * 60 * 1000;

function resolveCoord(commune) {
  const key = (commune || '').toLowerCase().trim();
  return COMMUNES[key] || { ...DEFAULT_COORD };
}

function buildAlerts(daily) {
  const alerts = [];
  const rain = daily.precipitation_sum || [];
  const tmax = daily.temperature_2m_max || [];
  const next5Rain = rain.slice(0, 5);

  const heavy = rain.findIndex(v => v >= 30);
  if (heavy !== -1) {
    alerts.push({ level: 'warning', icon: '🌧️', title: 'Fortes pluies prévues',
      text: `Jusqu'à ${Math.round(Math.max(...rain))} mm attendus — risque de lessivage des sols et d'inondation. Reportez les épandages d'engrais.` });
  }
  const dry = next5Rain.length && next5Rain.every(v => v < 1);
  if (dry) {
    alerts.push({ level: 'warning', icon: '☀️', title: 'Sécheresse à venir',
      text: 'Aucune pluie significative prévue sur 5 jours — surveillez le stress hydrique des plants.' });
  }
  const hot = tmax.some(v => v >= 38);
  if (hot) {
    alerts.push({ level: 'info', icon: '🌡️', title: 'Forte chaleur',
      text: `Températures jusqu'à ${Math.round(Math.max(...tmax))}°C — évitez les traitements en pleine journée.` });
  }
  if (!alerts.length) {
    alerts.push({ level: 'ok', icon: '✅', title: 'Conditions favorables', text: 'Pas d\'alerte météo majeure pour les 7 prochains jours.' });
  }
  return alerts;
}

async function getForecast(commune) {
  const key = (commune || 'parakou').toLowerCase().trim();
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const c = resolveCoord(commune);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
    `&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
    `&forecast_days=7&timezone=Africa%2FLagos`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!resp.ok) throw new Error('Service météo indisponible');
  const json = await resp.json();
  const daily = json.daily || {};

  const days = (daily.time || []).map((d, i) => ({
    date: d,
    rain_mm: daily.precipitation_sum ? daily.precipitation_sum[i] : null,
    rain_proba: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null,
    tmax: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
    tmin: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null
  }));

  const data = {
    commune: commune || c.fallback || 'Parakou',
    used_fallback: !!c.fallback,
    coord: { lat: c.lat, lon: c.lon },
    days,
    alerts: buildAlerts(daily),
    updated_at: new Date().toISOString()
  };
  _cache.set(key, { at: Date.now(), data });
  return data;
}

module.exports = { getForecast };
