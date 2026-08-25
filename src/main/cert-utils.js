const forge = require('node-forge');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function parseCertFile(filePath, password) {
  const ext = path.extname(filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);
  const result = {
    subject: '',
    issuer: '',
    serialNumber: '',
    thumbprint: '',
    validFrom: '',
    validTo: '',
    hasPrivateKey: false,
    keyUsage: '',
    fileType: ext.replace('.', '').toUpperCase()
  };

  try {
    if (ext === '.pfx' || ext === '.p12') {
      const p12Asn1 = forge.asn1.fromDer(forge.util.binary.raw.encode(fileBuffer));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');

      const keyBags = p12.getBags({ bagType: forge.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.oids.pkcs8ShroudedKeyBag];
      if (keyBag && keyBag.length > 0) {
        result.hasPrivateKey = true;
      }

      const certBags = p12.getBags({ bagType: forge.oids.certBag });
      const certBag = certBags[forge.oids.certBag];
      if (certBag && certBag.length > 0) {
        const cert = certBag[0].cert;
        const cnField = cert.subject.getField('CN');
        result.subject = cnField ? cnField.value : cert.subject.toString();
        const issuerCn = cert.issuer.getField('CN');
        result.issuer = issuerCn ? issuerCn.value : cert.issuer.toString();
        result.serialNumber = cert.serialNumber;
        const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
        result.thumbprint = forge.md.sha1.create().update(derBytes).digest().toHex();
        result.validFrom = cert.validity.notBefore.toISOString();
        result.validTo = cert.validity.notAfter.toISOString();
        const ku = cert.getExtension('keyUsage');
        result.keyUsage = ku ? ku.name : '';
      }
    } else if (ext === '.cer' || ext === '.crt') {
      try {
        const cert = forge.pki.certificateFromAsn1(
          forge.asn1.fromDer(forge.util.binary.raw.encode(fileBuffer))
        );
        const cnField = cert.subject.getField('CN');
        result.subject = cnField ? cnField.value : cert.subject.toString();
        const issuerCn = cert.issuer.getField('CN');
        result.issuer = issuerCn ? issuerCn.value : cert.issuer.toString();
        result.serialNumber = cert.serialNumber;
        const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
        result.thumbprint = forge.md.sha1.create().update(derBytes).digest().toHex();
        result.validFrom = cert.validity.notBefore.toISOString();
        result.validTo = cert.validity.notAfter.toISOString();
        const ku = cert.getExtension('keyUsage');
        result.keyUsage = ku ? ku.name : '';
      } catch (e) {
        // Try PEM fallback
        const derB64 = forge.util.encode64(fileBuffer.toString('binary'));
        const pem = '-----BEGIN CERTIFICATE-----\n' + derB64 + '\n-----END CERTIFICATE-----';
        const cert = forge.pki.certificateFromPem(pem);
        const cnField = cert.subject.getField('CN');
        result.subject = cnField ? cnField.value : cert.subject.toString();
        const issuerCn = cert.issuer.getField('CN');
        result.issuer = issuerCn ? issuerCn.value : cert.issuer.toString();
        result.serialNumber = cert.serialNumber;
        const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
        result.thumbprint = forge.md.sha1.create().update(derBytes).digest().toHex();
        result.validFrom = cert.validity.notBefore.toISOString();
        result.validTo = cert.validity.notAfter.toISOString();
      }
    } else if (ext === '.pem') {
      const pemData = fileBuffer.toString('utf8');
      const cert = forge.pki.certificateFromPem(pemData);
      const cnField = cert.subject.getField('CN');
      result.subject = cnField ? cnField.value : cert.subject.toString();
      const issuerCn = cert.issuer.getField('CN');
      result.issuer = issuerCn ? issuerCn.value : cert.issuer.toString();
      result.serialNumber = cert.serialNumber;
      const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      result.thumbprint = forge.md.sha1.create().update(derBytes).digest().toHex();
      result.validFrom = cert.validity.notBefore.toISOString();
      result.validTo = cert.validity.notAfter.toISOString();
      const ku = cert.getExtension('keyUsage');
      result.keyUsage = ku ? ku.name : '';
    }
  } catch (err) {
    console.error('Error parsing certificate file:', filePath, err.message);
  }

  return result;
}

function parseCertutilOutput(output) {
  const certs = [];
  // Split by certificate blocks (works for both EN and ES)
  const blocks = output.split(/={3,}\s*(?:Certificates|Certificados?)\s*\d*\s*={3,}/i);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const cert = {};

    // Subject / Sujeto - supports both EN and ES
    const subjectMatch = block.match(/(?:Subject|Sujeto)\s*:\s*(.+)/i);
    const issuerMatch = block.match(/(?:Issuer|Emisor)\s*:\s*(.+)/i);
    const serialMatch = block.match(/(?:Serial Number|Numero de serie|N.mero de serie)\s*:\s*(.+)/i);
    const thumbMatch = block.match(/(?:Cert Hash\(sha1\)|Hash de cert\(sha1\))\s*:\s*(.+)/i);
    const validFromMatch = block.match(/NotBefore\s*:\s*(.+)/i);
    const validToMatch = block.match(/NotAfter\s*:\s*(.+)/i);

    if (subjectMatch) cert.subject = subjectMatch[1].trim();
    if (issuerMatch) cert.issuer = issuerMatch[1].trim();
    if (serialMatch) cert.serialNumber = serialMatch[1].trim().replace(/\s/g, '');
    if (thumbMatch) cert.thumbprint = thumbMatch[1].trim().replace(/\s/g, '');
    if (validFromMatch) cert.validFrom = validFromMatch[1].trim();
    if (validToMatch) cert.validTo = validToMatch[1].trim();

    if (cert.subject || cert.issuer) {
      certs.push(cert);
    }
  }

  return certs;
}

function scanWindowsStores() {
  const stores = ['My', 'Root', 'CA', 'TrustedPublisher'];
  const results = [];

  for (const store of stores) {
    try {
      const cmd = `certutil -store "${store}"`;
      const output = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
      const certs = parseCertutilOutput(output);
      for (const cert of certs) {
        cert.store = store;
        cert.source = `Almacen Windows: ${store}`;
        cert.fileType = 'STORE';
        cert.hasPrivateKey = false;
        cert.file_name = cert.subject || 'certificado';
        cert.file_path = '';
      }
      results.push(...certs);
    } catch (err) {
      // Store may be empty or inaccessible
    }
  }

  return results;
}

function scanFolderForCerts(folderPath, maxDepth) {
  const found = [];
  const certExts = ['.pfx', '.p12', '.cer', '.crt', '.pem'];

  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const skipDirs = ['node_modules', 'AppData', '$Recycle.Bin', 'System Volume Information'];
        if (!skipDirs.includes(entry.name)) {
          walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (certExts.includes(ext)) {
          const parsed = parseCertFile(fullPath, '');
          if (parsed.subject || parsed.thumbprint) {
            found.push({
              ...parsed,
              file_path: fullPath,
              file_name: entry.name,
              source: `Archivo: ${path.dirname(fullPath)}`
            });
          } else if (ext === '.pfx' || ext === '.p12') {
            found.push({
              ...parsed,
              subject: entry.name,
              file_path: fullPath,
              file_name: entry.name,
              source: `Archivo: ${path.dirname(fullPath)}`,
              note: 'Protegido con contrasena - se importara al instalar'
            });
          }
        }
      }
    }
  }

  walk(folderPath, 0);
  return found;
}

function scanCommonPaths() {
  const home = os.homedir();
  const paths = [
    path.join(home, 'Desktop'),
    path.join(home, 'Downloads'),
    path.join(home, 'Documents'),
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'OneDrive', 'Downloads'),
    path.join(home, 'OneDrive', 'Documents')
  ];

  const results = [];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const certs = scanFolderForCerts(p, 2);
      results.push(...certs);
    }
  }
  return results;
}

function scanRemovableDrives() {
  const results = [];
  try {
    const output = execSync('wmic logicaldisk where "DriveType=2" get DeviceID', { encoding: 'utf8', timeout: 5000 });
    const lines = output.split('\n').filter(l => l.trim() && !l.includes('DeviceID'));
    for (const line of lines) {
      const match = line.match(/([A-Z]:)/);
      if (match) {
        const drivePath = match[1] + '\\';
        if (fs.existsSync(drivePath)) {
          const certs = scanFolderForCerts(drivePath, 2);
          results.push(...certs);
        }
      }
    }
  } catch (e) {
    // WMI may not be available
  }
  return results;
}

function fullAutoDetect() {
  const allResults = [];

  const storeCerts = scanWindowsStores();
  allResults.push(...storeCerts.map(c => ({ ...c, category: 'store' })));

  const folderCerts = scanCommonPaths();
  allResults.push(...folderCerts.map(c => ({ ...c, category: 'file' })));

  const usbCerts = scanRemovableDrives();
  allResults.push(...usbCerts.map(c => ({ ...c, category: 'removable' })));

  return allResults;
}

module.exports = {
  parseCertFile,
  exportPfxWithCertutil: function(certFilePath, destPath, password) {
    try {
      const pwFlag = password ? `-p "${password}"` : '-p ""';
      const cmd = `certutil -exportpfx -f ${pwFlag} "${certFilePath}" "${destPath}"`;
      execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      return { success: true, path: destPath };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
  getInstalledCertsFromStore: function(storeName) {
    const storeMap = { 'My': 'My', 'Root': 'Root', 'CA': 'CA', 'TrustedPublisher': 'TrustedPublisher' };
    const store = storeMap[storeName] || 'My';
    try {
      const cmd = `certutil -store "${store}"`;
      const output = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
      return parseCertutilOutput(output);
    } catch (err) {
      return [];
    }
  },
  importPfxToStore: function(filePath, password, storeName) {
    const storeMap = { 'My': 'My', 'Root': 'Root', 'CA': 'CA', 'TrustedPublisher': 'TrustedPublisher' };
    const store = storeMap[storeName] || 'My';
    const pwFlag = password ? `-p "${password}"` : '-p ""';
    try {
      const cmd = `certutil -importpfx -f ${pwFlag} -enterprise -q "${store}" "${filePath}"`;
      execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      return { success: true, message: `Certificado instalado en almacen ${store}` };
    } catch (err) {
      return { success: false, message: `Error al instalar: ${err.message}` };
    }
  },
  scanWindowsStores,
  scanFolderForCerts,
  scanCommonPaths,
  scanRemovableDrives,
  fullAutoDetect
};
