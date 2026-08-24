/**
 * Caution Solidaire Service — cercles de garantie mutuelle
 *
 * Dans la filière coton, les producteurs se regroupent en "cercles de caution
 * solidaire" : les membres se garantissent mutuellement le remboursement du
 * crédit intrants. Si un membre fait défaut, les autres prennent en charge sa dette.
 *
 * Ce service gère les groupes et calcule le RISQUE collectif à partir des soldes
 * d'intrants réels (intrantsService) : dette totale du groupe, membres en défaut.
 *
 * Fichier de données : caution.json = { groups: [] }
 */

const fs = require('fs');
const path = require('path');
const intrantsService = require('./intrantsService');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE = 'caution.json';

function readJSON() {
  const fp = path.join(DATA_DIR, FILE);
  if (!fs.existsSync(fp)) return { groups: [] };
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function writeJSON(data) {
  fs.writeFileSync(path.join(DATA_DIR, FILE), JSON.stringify(data, null, 2), 'utf-8');
}

/** Enrichit un groupe avec le risque calculé (soldes d'intrants des membres). */
function enrich(group) {
  const members = group.members.map(npi => {
    const acc = intrantsService.getAccount(npi, group.cooperative_id);
    return { npi, balance: acc.balance, total_distributed: acc.total_distributed, total_recovered: acc.total_recovered };
  });
  const total_debt = members.reduce((s, m) => s + Math.max(0, m.balance), 0);
  const at_risk = members.filter(m => m.balance > 0);
  return {
    ...group,
    member_count: members.length,
    members,
    total_debt,
    members_at_risk: at_risk.length,
    // Exposition par membre = dette totale répartie s'il fallait couvrir un défaut
    exposure_per_member: members.length ? Math.round(total_debt / members.length) : 0,
    status: total_debt === 0 ? 'sain' : (at_risk.length > 1 ? 'risque' : 'attention')
  };
}

function listGroups(coopId) {
  return readJSON().groups
    .filter(g => g.cooperative_id === coopId)
    .map(enrich)
    .sort((a, b) => b.total_debt - a.total_debt);
}

function getGroup(id, coopId) {
  const g = readJSON().groups.find(x => x.id === id && x.cooperative_id === coopId);
  return g ? enrich(g) : null;
}

/** NPIs déjà dans un cercle de cette coop (un producteur = un seul cercle par coop). */
function membersInCoop(coopId) {
  const set = new Set();
  readJSON().groups.filter(g => g.cooperative_id === coopId).forEach(g => g.members.forEach(m => set.add(m)));
  return set;
}

function createGroup(coopId, name, members, createdByNpi) {
  if (!name || !name.trim()) throw new Error('Nom du cercle requis');
  members = [...new Set((members || []).filter(Boolean))];
  if (members.length < 2) throw new Error('Un cercle de caution doit compter au moins 2 membres');

  const already = membersInCoop(coopId);
  const clash = members.find(m => already.has(m));
  if (clash) throw new Error(`Le producteur ${clash} appartient déjà à un cercle de caution`);

  const data = readJSON();
  const id = 'CAU-' + Date.now().toString(36).toUpperCase();
  const group = { id, cooperative_id: coopId, name: name.trim(), members, created_at: new Date().toISOString(), created_by: createdByNpi };
  data.groups.push(group);
  writeJSON(data);
  return enrich(group);
}

function addMember(id, coopId, npi) {
  const data = readJSON();
  const g = data.groups.find(x => x.id === id && x.cooperative_id === coopId);
  if (!g) throw new Error('Cercle introuvable');
  if (g.members.includes(npi)) throw new Error('Ce producteur est déjà dans le cercle');
  if (membersInCoop(coopId).has(npi)) throw new Error('Ce producteur appartient déjà à un autre cercle');
  g.members.push(npi);
  writeJSON(data);
  return enrich(g);
}

function removeMember(id, coopId, npi) {
  const data = readJSON();
  const g = data.groups.find(x => x.id === id && x.cooperative_id === coopId);
  if (!g) throw new Error('Cercle introuvable');
  g.members = g.members.filter(m => m !== npi);
  writeJSON(data);
  return enrich(g);
}

module.exports = { listGroups, getGroup, createGroup, addMember, removeMember, membersInCoop };
