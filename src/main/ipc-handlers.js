const path = require('path');
const fs = require('fs');
const os = require('os');
const { getAllCerts, getCertById, addCert, deleteCert, updateCertLabel } = require('./db');
const { parseCertFile, importPfxToStore, getInstalledCertsFromStore, fullAutoDetect, scanFolderForCerts } = require('./cert-utils');

function registerHandlers(ipcMain, dialog, mainWindow) {

  ipcMain.handle('dialog:openImport', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleccionar Certificado',
      filters: [
        { name: 'Certificados', extensions: ['pfx', 'p12', 'cer', 'crt', 'pem'] },
        { name: 'PFX/PKCS12', extensions: ['pfx', 'p12'] },
        { name: 'Certificados DER/PEM', extensions: ['cer', 'crt', 'pem'] }
      ],
      properties: ['openFile']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:openExport', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar Certificado',
      defaultPath: path.join(os.homedir(), 'Desktop', defaultName || 'certificado.pfx'),
      filters: [
        { name: 'PFX/PKCS12', extensions: ['pfx'] },
        { name: 'Certificado DER', extensions: ['cer'] }
      ]
    });
    if (result.canceled) return null;
    return result.filePath;
  });

  ipcMain.handle('cert:import', async (event, filePath, password) => {
    try {
      const parsed = parseCertFile(filePath, password);
      const fileName = path.basename(filePath);
      const cert = addCert({
        label: parsed.subject || fileName,
        file_name: fileName,
        file_path: filePath,
        file_type: parsed.fileType,
        subject: parsed.subject,
        issuer: parsed.issuer,
        serial_number: parsed.serialNumber,
        thumbprint: parsed.thumbprint,
        valid_from: parsed.validFrom,
        valid_to: parsed.validTo,
        has_private_key: parsed.hasPrivateKey ? 1 : 0,
        key_usage: parsed.keyUsage,
        store_location: ''
      });
      return {
        success: true,
        id: cert.id,
        message: `Certificado "${parsed.subject || fileName}" importado correctamente`,
        cert: parsed
      };
    } catch (err) {
      return { success: false, message: `Error al importar: ${err.message}` };
    }
  });

  ipcMain.handle('cert:getAll', async () => {
    return getAllCerts();
  });

  ipcMain.handle('cert:getById', async (event, id) => {
    return getCertById(id);
  });

  ipcMain.handle('cert:delete', async (event, id) => {
    deleteCert(id);
    return { success: true, message: 'Certificado eliminado del inventario' };
  });

  ipcMain.handle('cert:updateLabel', async (event, id, label) => {
    updateCertLabel(id, label);
    return { success: true };
  });

  ipcMain.handle('cert:export', async (event, certId, destPath, password) => {
    const cert = getCertById(certId);
    if (!cert) {
      return { success: false, message: 'Certificado no encontrado' };
    }
    try {
      const ext = path.extname(destPath).toLowerCase();
      if (ext === '.pfx' || ext === '.p12') {
        const pwFlag = password ? `-p "${password}"` : '-p ""';
        const cmd = `certutil -exportpfx -f ${pwFlag} "${cert.file_path}" "${destPath}"`;
        require('child_process').execSync(cmd, { encoding: 'utf8', timeout: 30000 });
      } else if (ext === '.cer') {
        fs.copyFileSync(cert.file_path, destPath);
      }
      return { success: true, message: `Certificado exportado a: ${destPath}`, path: destPath };
    } catch (err) {
      return { success: false, message: `Error al exportar: ${err.message}` };
    }
  });

  ipcMain.handle('cert:install', async (event, certId, storeName) => {
    const cert = getCertById(certId);
    if (!cert) {
      return { success: false, message: 'Certificado no encontrado' };
    }
    const result = importPfxToStore(cert.file_path, '', storeName);
    return result;
  });

  ipcMain.handle('cert:getInstalled', async (event, storeName) => {
    return getInstalledCertsFromStore(storeName);
  });

  ipcMain.handle('cert:autoDetect', async (event) => {
    return fullAutoDetect();
  });

  ipcMain.handle('cert:scanFolder', async (event, folderPath) => {
    if (!fs.existsSync(folderPath)) {
      return { success: false, message: 'La carpeta no existe', certs: [] };
    }
    const certs = scanFolderForCerts(folderPath, 3);
    return { success: true, certs, message: `Se encontraron ${certs.length} certificados en ${folderPath}` };
  });

  ipcMain.handle('cert:importMultiple', async (event, certsToImport) => {
    const results = [];
    for (const c of certsToImport) {
      try {
        const cert = addCert({
          label: c.subject || c.file_name,
          file_name: c.file_name,
          file_path: c.file_path,
          file_type: c.fileType,
          subject: c.subject,
          issuer: c.issuer,
          serial_number: c.serialNumber,
          thumbprint: c.thumbprint,
          valid_from: c.validFrom,
          valid_to: c.validTo,
          has_private_key: c.hasPrivateKey ? 1 : 0,
          key_usage: c.keyUsage,
          store_location: c.source || ''
        });
        results.push({ success: true, id: cert.id, subject: c.subject || c.file_name });
      } catch (err) {
        results.push({ success: false, subject: c.subject || c.file_name, error: err.message });
      }
    }
    const imported = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    return {
      success: imported > 0,
      message: `Importados: ${imported}, Fallidos: ${failed}`,
      results
    };
  });

  ipcMain.handle('system:info', async () => {
    return {
      platform: os.platform(),
      hostname: os.hostname(),
      user: os.userInfo().username
    };
  });
}

module.exports = { registerHandlers };
