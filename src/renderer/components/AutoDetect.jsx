import React, { useState } from 'react';

export default function AutoDetect({ onImported }) {
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState(null);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [customFolder, setCustomFolder] = useState('');
  const [progressMsg, setProgressMsg] = useState('');

  const startAutoDetect = async () => {
    setScanning(true);
    setScanType('full');
    setResults([]);
    setSelected(new Set());
    setImportResult(null);
    setProgressMsg('Iniciando escaneo completo...');

    try {
      const res = await window.certAPI.autoDetectCerts();
      setResults(res);
      setProgressMsg(`Escaneo completo: ${res.length} certificados encontrados`);
    } catch (err) {
      setProgressMsg(`Error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const startFolderScan = async () => {
    if (!customFolder) return;
    setScanning(true);
    setScanType('folder');
    setResults([]);
    setSelected(new Set());
    setImportResult(null);
    setProgressMsg(`Escaneando ${customFolder}...`);

    try {
      const res = await window.certAPI.scanFolder(customFolder);
      if (res.success) {
        setResults(res.certs);
        setProgressMsg(res.message);
      } else {
        setProgressMsg(res.message);
      }
    } catch (err) {
      setProgressMsg(`Error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const toggleSelect = (index) => {
    const next = new Set(selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  };

  const handleImportSelected = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const certsToImport = Array.from(selected).map(i => results[i]);
      const res = await window.certAPI.importMultiple(certsToImport);
      setImportResult(res);
      if (res.success) {
        onImported();
        setSelected(new Set());
      }
    } catch (err) {
      setImportResult({ success: false, message: err.message });
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'store': return { text: 'Almacen', color: 'cat-store' };
      case 'file': return { text: 'Archivo', color: 'cat-file' };
      case 'removable': return { text: 'USB', color: 'cat-usb' };
      default: return { text: 'Otro', color: 'cat-other' };
    }
  };

  const storeCerts = results.filter(r => r.category === 'store');
  const fileCerts = results.filter(r => r.category === 'file');
  const usbCerts = results.filter(r => r.category === 'removable');

  return (
    <div className="page">
      <div className="page-header">
        <h1>Auto-Detectar Certificados</h1>
        {results.length > 0 && (
          <span className="badge">{results.length} encontrados</span>
        )}
      </div>

      <div className="autodetect-container">
        <div className="autodetect-actions">
          <div className="action-card primary-action" onClick={!scanning ? startAutoDetect : undefined}>
            <div className={`action-card-icon ${scanning && scanType === 'full' ? 'scanning' : ''}`}>
              {scanning && scanType === 'full' ? (
                <span className="spinner-lg"></span>
              ) : (
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <h3>Escaneo Completo</h3>
            <p>Busca en almacenes de Windows, carpetas del usuario y unidades extraibles</p>
          </div>

          <div className="action-card">
            <div className="action-card-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3>Escanear Carpeta</h3>
            <p>Selecciona una carpeta especifica para buscar certificados</p>
            <div className="folder-scan-input">
              <input
                type="text"
                placeholder="Ruta de la carpeta..."
                value={customFolder}
                onChange={e => setCustomFolder(e.target.value)}
                disabled={scanning}
              />
              <button
                className="scan-folder-btn"
                onClick={startFolderScan}
                disabled={scanning || !customFolder}
              >
                Escanear
              </button>
            </div>
          </div>
        </div>

        {progressMsg && (
          <div className={`progress-msg ${scanning ? 'scanning' : ''}`}>
            {scanning && <span className="spinner-sm"></span>}
            <span>{progressMsg}</span>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="results-header">
              <div className="results-summary">
                <span className="summary-item store-summary">
                  <span className="summary-dot dot-store"></span>
                  Almacenes: {storeCerts.length}
                </span>
                <span className="summary-item file-summary">
                  <span className="summary-dot dot-file"></span>
                  Archivos: {fileCerts.length}
                </span>
                <span className="summary-item usb-summary">
                  <span className="summary-dot dot-usb"></span>
                  USB: {usbCerts.length}
                </span>
              </div>

              <div className="results-actions">
                <label className="checkbox-label small">
                  <input
                    type="checkbox"
                    checked={selected.size === results.length && results.length > 0}
                    onChange={toggleSelectAll}
                  />
                  <span>Seleccionar todos ({selected.size}/{results.length})</span>
                </label>
                <button
                  className="primary-btn import-selected-btn"
                  onClick={handleImportSelected}
                  disabled={selected.size === 0 || importing}
                >
                  {importing ? (
                    <>
                      <span className="spinner"></span>
                      Importando...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4v16m8-8H4" />
                      </svg>
                      Importar Seleccionados ({selected.size})
                    </>
                  )}
                </button>
              </div>
            </div>

            {importResult && (
              <div className={`result-message ${importResult.success ? 'success' : 'error'}`}>
                {importResult.success ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                <span>{importResult.message}</span>
              </div>
            )}

            <div className="cert-table-container">
              <table className="cert-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Nombre / Asunto</th>
                    <th>Emisor</th>
                    <th>Tipo</th>
                    <th>Valido Hasta</th>
                    <th>Clave Privada</th>
                    <th>Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((cert, idx) => {
                    const cat = getCategoryLabel(cert.category);
                    return (
                      <tr key={idx} className={selected.has(idx) ? 'selected-row' : ''} onClick={() => toggleSelect(idx)}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(idx)}
                            onChange={() => toggleSelect(idx)}
                            onClick={e => e.stopPropagation()}
                            className="cert-checkbox"
                          />
                        </td>
                        <td className="cert-name">
                          <div className={`cert-icon cat-bg-${cert.category}`}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                          </div>
                          <span>{cert.subject || cert.file_name || 'Sin nombre'}</span>
                        </td>
                        <td className="issuer-cell">{cert.issuer || '-'}</td>
                        <td><span className="type-badge">{cert.fileType || cert.file_type || '-'}</span></td>
                        <td>{formatDate(cert.validTo || cert.valid_to)}</td>
                        <td>{(cert.hasPrivateKey || cert.has_private_key) ? <span className="yes-badge">Si</span> : <span className="no-badge">No</span>}</td>
                        <td>
                          <span className={`category-badge ${cat.color}`}>{cat.text}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {results.length === 0 && !scanning && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <h3>Sin resultados</h3>
            <p>Inicia un escaneo para encontrar certificados en tu sistema</p>
          </div>
        )}
      </div>
    </div>
  );
}
