/**
 * Mécanisation Service — coordination du matériel agricole partagé
 *
 * La coopérative gère un parc de matériel (tracteurs, charrues, semoirs...) que
 * les producteurs réservent à tour de rôle. Ce service gère le parc et le planning
 * de réservations — la mécanisation étant une priorité pour la productivité.
 *
 * Fichier de données : mecanisation.json = { equipments: [], reservations: [] }
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE = 'mecanisation.json';

const TYPES = ['Tracteur', 'Charrue', 'Semoir', 'Pulvérisateur', 'Remorque', 'Motoculteur'];

function readJSON() {
  const fp = path.join(DATA_DIR, FILE);
  if (!fs.existsSync(fp)) return { equipments: [], reservations: [] };
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function writeJSON(data) {
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(data, null, 2), 'utf-8');
}

function getTypes() { return TYPES; }

function addEquipment(coopId, name, type) {
  if (!name || !name.trim()) throw new Error('Nom du matériel requis');
  if (!TYPES.includes(type)) throw new Error('Type de matériel invalide');
  const data = readJSON();
  const id = 'EQ-' + Date.now().toString(36).toUpperCase();
  const eq = { id, cooperative_id: coopId, name: name.trim(), type, created_at: new Date().toISOString() };
  data.equipments.push(eq);
  writeJSON(data);
  return eq;
}

function listEquipments(coopId) {
  const data = readJSON();
  return data.equipments.filter(e => e.cooperative_id === coopId).map(e => {
    const resv = data.reservations.filter(r => r.equipment_id === e.id && r.status !== 'annulé');
    const upcoming = resv.filter(r => r.date >= new Date().toISOString().slice(0, 10)).length;
    return { ...e, reservation_count: resv.length, upcoming_count: upcoming };
  });
}

function reserve(coopId, equipmentId, producerNpi, date, note, byNpi) {
  const data = readJSON();
  const eq = data.equipments.find(e => e.id === equipmentId && e.cooperative_id === coopId);
  if (!eq) throw new Error('Matériel introuvable');
  if (!date) throw new Error('Date requise');
  // Conflit : même matériel déjà réservé ce jour-là
  const clash = data.reservations.find(r => r.equipment_id === equipmentId && r.date === date && r.status !== 'annulé');
  if (clash) throw new Error(`${eq.name} est déjà réservé le ${date}`);
  const id = 'RSV-' + Date.now().toString(36).toUpperCase();
  const resv = {
    id, cooperative_id: coopId, equipment_id: equipmentId, equipment_name: eq.name,
    producer_npi: producerNpi, date, note: note || '', status: 'planifié',
    created_at: new Date().toISOString(), created_by: byNpi
  };
  data.reservations.push(resv);
  writeJSON(data);
  return resv;
}

function cancelReservation(coopId, reservationId) {
  const data = readJSON();
  const r = data.reservations.find(x => x.id === reservationId && x.cooperative_id === coopId);
  if (!r) throw new Error('Réservation introuvable');
  r.status = 'annulé';
  writeJSON(data);
  return r;
}

function listReservations(coopId) {
  return readJSON().reservations
    .filter(r => r.cooperative_id === coopId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getStats(coopId) {
  const data = readJSON();
  const equipments = data.equipments.filter(e => e.cooperative_id === coopId);
  const today = new Date().toISOString().slice(0, 10);
  const resv = data.reservations.filter(r => r.cooperative_id === coopId && r.status !== 'annulé');
  return {
    equipment_count: equipments.length,
    total_reservations: resv.length,
    upcoming: resv.filter(r => r.date >= today).length
  };
}

module.exports = { getTypes, addEquipment, listEquipments, reserve, cancelReservation, listReservations, getStats };
