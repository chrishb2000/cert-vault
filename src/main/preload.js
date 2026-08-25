const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('certAPI', {
  // CRUD
  getAllCerts: () => ipcRenderer.invoke('cert:getAll'),
  getCertById: (id) => ipcRenderer.invoke('cert:getById', id),
  deleteCert: (id) => ipcRenderer.invoke('cert:delete', id),
  updateCertLabel: (id, label) => ipcRenderer.invoke('cert:updateLabel', id, label),

  // Import
  importCert: (filePath, password) => ipcRenderer.invoke('cert:import', filePath, password),
  openImportDialog: () => ipcRenderer.invoke('dialog:openImport'),

  // Export
  exportCert: (certId, destPath, password) => ipcRenderer.invoke('cert:export', certId, destPath, password),
  openExportDialog: (defaultName) => ipcRenderer.invoke('dialog:openExport', defaultName),

  // Install to Windows Store
  installCert: (certId, storeName) => ipcRenderer.invoke('cert:install', certId, storeName),

  // Get installed certs from Windows
  getInstalledCerts: (storeName) => ipcRenderer.invoke('cert:getInstalled', storeName),

  // Auto-detect
  autoDetectCerts: () => ipcRenderer.invoke('cert:autoDetect'),
  scanFolder: (folderPath) => ipcRenderer.invoke('cert:scanFolder', folderPath),
  importMultiple: (certs) => ipcRenderer.invoke('cert:importMultiple', certs),
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

  // Window
  setBackgroundColor: (color) => ipcRenderer.invoke('window:setBackgroundColor', color),

  // System info
  getSystemInfo: () => ipcRenderer.invoke('system:info')
});
