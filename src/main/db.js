const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let db = { certificates: [], nextId: 1 };

function getDBPath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'cert-vault.json');
}

function initDB() {
  const dbPath = getDBPath();
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(raw);
    } catch (e) {
      db = { certificates: [], nextId: 1 };
    }
  }
  save();
  return db;
}

function save() {
  const dbPath = getDBPath();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

function getDB() {
  return db;
}

function getAllCerts() {
  return db.certificates.sort((a, b) => new Date(b.import_date) - new Date(a.import_date));
}

function getCertById(id) {
  return db.certificates.find(c => c.id === id);
}

function addCert(certData) {
  const cert = {
    id: db.nextId++,
    label: certData.label || '',
    file_name: certData.file_name,
    file_path: certData.file_path,
    file_type: certData.file_type,
    subject: certData.subject || '',
    issuer: certData.issuer || '',
    serial_number: certData.serial_number || '',
    thumbprint: certData.thumbprint || '',
    valid_from: certData.valid_from || '',
    valid_to: certData.valid_to || '',
    has_private_key: certData.has_private_key || 0,
    key_usage: certData.key_usage || '',
    store_location: certData.store_location || '',
    import_date: new Date().toISOString(),
    notes: certData.notes || ''
  };
  db.certificates.push(cert);
  save();
  return cert;
}

function deleteCert(id) {
  db.certificates = db.certificates.filter(c => c.id !== id);
  save();
}

function updateCertLabel(id, label) {
  const cert = db.certificates.find(c => c.id === id);
  if (cert) {
    cert.label = label;
    save();
  }
}

module.exports = {
  initDB,
  getDB,
  getAllCerts,
  getCertById,
  addCert,
  deleteCert,
  updateCertLabel
};
