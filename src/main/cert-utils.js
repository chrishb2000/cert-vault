const forge = require('node-forge');
const { execSync, exec } = require('child_process');
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
        result.subject = cert.subject.getField('CN') ? cert.subject.getField('CN').value : cert.subject.toString();
        result.issuer = cert.issuer.getField('CN') ? cert.issuer.getField('CN').value : cert.issuer.toString();
        result.serialNumber = cert.serialNumber;
        result.thumbprint = forge.md.sha1.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex();
        result.validFrom = cert.validity.notBefore.toISOString();
        result.validTo = cert.validity.notAfter.toISOString();
        result.keyUsage = cert.getExtension('keyUsage') ? cert.getExtension('keyUsage').name : '';
      }
    } else if (ext === '.cer' || ext === '.crt' || ext === '.pem') {
      let pemData;
      if (ext === '.pem') {
        pemData = fileBuffer.toString('utf8');
      } else {
        const derHex = forge.util.encode64(fileBuffer.toString('binary'));
        pemData = '-----BEGIN CERTIFICATE-----\n' + derHex + '\n-----END CERTIFICATE-----';
      }
      const cert = forge.pki.certificateFromPem(pemData);
      result.subject = cert.subject.getField('CN') ? cert.subject.getField('CN').value : cert.subject.toString();
      result.issuer = cert.issuer.getField('CN') ? cert.issuer.getField('CN').value : cert.issuer.toString();
      result.serialNumber = cert.serialNumber;
      result.thumbprint = forge.md.sha1.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex();
      result.validFrom = cert.validity.notBefore.toISOString();
      result.validTo = cert.validity.notAfter.toISOString();
      result.keyUsage = cert.getExtension('keyUsage') ? cert.getExtension('keyUsage').name : '';
    }
  } catch (err) {
    console.error('Error parsing certificate:', err.message);
  }

  return result;
}

function importPfxToStore(filePath, password, storeName) {
  const storeMap = {
    'My': 'My',
    'Root': 'Root',
    'CA': 'CA',
    'TrustedPublisher': 'TrustedPublisher'
  };
  const store = storeMap[storeName] || 'My';
  const pwFlag = password ? `-p "${password}"` : '-p ""';

  try {
    const cmd = `certutil -importpfx -f ${pwFlag} -enterprise -q "${store}" "${filePath}"`;
    execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    return { success: true, message: `Certificado instalado en almacén ${store}` };
  } catch (err) {
    return { success: false, message: `Error al instalar: ${err.message}` };
  }
}

function exportPfxWithCertutil(certFilePath, destPath, password) {
  try {
    const pwFlag = password ? `-p "${password}"` : '-p ""';
    const cmd = `certutil -exportpfx -f ${pwFlag} "${certFilePath}" "${destPath}"`;
    execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    return { success: true, path: destPath };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getInstalledCertsFromStore(storeName) {
  const storeMap = {
    'My': 'My',
    'Root': 'Root',
    'CA': 'CA',
    'TrustedPublisher': 'TrustedPublisher'
  };
  const store = storeMap[storeName] || 'My';

  try {
    const cmd = `certutil -store "${store}"`;
    const output = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
    return parseCertutilOutput(output);
  } catch (err) {
    return [];
  }
}

function parseCertutilOutput(output) {
  const certs = [];
  const blocks = output.split(/(?========================= Certificates ========================)/);

  for (const block of blocks) {
    if (!block.includes('Subject:') && !block.includes('CN =')) continue;

    const cert = {};
    const subjectMatch = block.match(/Subject:\s*(.+)/);
    const issuerMatch = block.match(/Issuer:\s*(.+)/);
    const serialMatch = block.match(/Serial Number:\s*(.+)/);
    const thumbMatch = block.match(/Cert Hash\(sha1\):\s*(.+)/);
    const validFromMatch = block.match(/NotBefore:\s*(.+)/);
    const validToMatch = block.match(/NotAfter:\s*(.+)/);

    if (subjectMatch) cert.subject = subjectMatch[1].trim();
    if (issuerMatch) cert.issuer = issuerMatch[1].trim();
    if (serialMatch) cert.serialNumber = serialMatch[1].trim().replace(/\s/g, '');
    if (thumbMatch) cert.thumbprint = thumbMatch[1].trim().replace(/\s/g, '');
    if (validFromMatch) cert.validFrom = validFromMatch[1].trim();
    if (validToMatch) cert.validTo = validToMatch[1].trim();

    if (cert.subject) {
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
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'AppData') {
          walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (certExts.includes(ext)) {
            try {
              const parsed = parseCertFile(fullPath, '');
              found.push({
                ...parsed,
                file_path: fullPath,
                file_name: entry.name,
                source: `Archivo: ${fullPath}`
              });
            } catch (e) {
              // Skip unparseable files
            }
          }
        }
      }
    } catch (e) {
      // Skip inaccessible directories
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
    const output = execSync('wmic logicaldisk where "DriveType=2" get DeviceID,VolumeName', { encoding: 'utf8', timeout: 5000 });
    const lines = output.split('\n').filter(l => l.trim() && !l.includes('DeviceID'));
    for (const line of lines) {
      const match = line.match(/([A-Z]:)/);
      if (match) {
        const drivePath = match[1] + '\\';
        const certs = scanFolderForCerts(drivePath, 2);
        results.push(...certs);
      }
    }
  } catch (e) {
    // WMI may not be available
  }
  return results;
}

function fullAutoDetect(progressCallback) {
  const allResults = [];

  if (progressCallback) progressCallback('Escaneando almacenes de Windows...');
  const storeCerts = scanWindowsStores();
  allResults.push(...storeCerts.map(c => ({ ...c, category: 'store' })));

  if (progressCallback) progressCallback('Escaneando carpetas comunes...');
  const folderCerts = scanCommonPaths();
  allResults.push(...folderCerts.map(c => ({ ...c, category: 'file' })));

  if (progressCallback) progressCallback('Escaneando unidades extraibles...');
  const usbCerts = scanRemovableDrives();
  allResults.push(...usbCerts.map(c => ({ ...c, category: 'removable' })));

  if (progressCallback) progressCallback('Escaneo completo');
  return allResults;
}

module.exports = {
  parseCertFile,
  importPfxToStore,
  exportPfxWithCertutil,
  getInstalledCertsFromStore,
  scanWindowsStores,
  scanFolderForCerts,
  scanCommonPaths,
  scanRemovableDrives,
  fullAutoDetect
};
