import React, { useState } from 'react';

export default function ExportCert({ certs }) {
  const [selectedCert, setSelectedCert] = useState(null);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [exportFormat, setExportFormat] = useState('pfx');
  const [destFolder, setDestFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePickFolder = async () => {
    const folder = await window.certAPI.openFolderDialog();
    if (folder) {
      setDestFolder(folder);
      setResult(null);
    }
  };

  const handleExport = async () => {
    if (!selectedCert || !destFolder) return;
    setLoading(true);
    setResult(null);

    try {
      const ext = exportFormat === 'pfx' ? '.pfx' : '.cer';
      const baseName = (selectedCert.file_name || selectedCert.subject || 'certificado').replace(/\.[^.]+$/, '');
      const destPath = destFolder + '\\' + baseName + ext;

      const pw = usePassword ? password : '';
      const res = await window.certAPI.exportCert(selectedCert.id, destPath, pw);
      setResult(res);
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Exportar Certificado</h1>
      </div>

      <div className="import-container">
        <div className="import-card">
          <div className="step-header">
            <div className="step-number">1</div>
            <div>
              <h3>Seleccionar Certificado</h3>
              <p>Elige el certificado a exportar del inventario</p>
            </div>
          </div>

          <select
            className="cert-select"
            value={selectedCert ? selectedCert.id : ''}
            onChange={e => {
              const cert = certs.find(c => c.id === parseInt(e.target.value));
              setSelectedCert(cert);
              setResult(null);
            }}
          >
            <option value="">-- Seleccionar certificado --</option>
            {certs.map(c => (
              <option key={c.id} value={c.id}>
                {c.label || c.subject || c.file_name} ({c.file_type}) - {formatDate(c.valid_to)}
              </option>
            ))}
          </select>

          {selectedCert && (
            <div className="cert-preview">
              <div className="preview-row">
                <span className="preview-label">Asunto:</span>
                <span className="preview-value">{selectedCert.subject || '-'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Emisor:</span>
                <span className="preview-value">{selectedCert.issuer || '-'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Valido hasta:</span>
                <span className="preview-value">{formatDate(selectedCert.valid_to)}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Clave privada:</span>
                <span className="preview-value">{selectedCert.has_private_key ? 'Si' : 'No'}</span>
              </div>
            </div>
          )}

          <div className="step-header" style={{ marginTop: '24px' }}>
            <div className="step-number">2</div>
            <div>
              <h3>Formato de Exportacion</h3>
              <p>Elige el formato de salida</p>
            </div>
          </div>

          <div className="format-options">
            <label className={`format-option ${exportFormat === 'pfx' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="pfx"
                checked={exportFormat === 'pfx'}
                onChange={e => setExportFormat(e.target.value)}
              />
              <div className="format-info">
                <strong>PFX (PKCS#12)</strong>
                <span>Incluye certificado y clave privada</span>
              </div>
            </label>
            <label className={`format-option ${exportFormat === 'cer' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="cer"
                checked={exportFormat === 'cer'}
                onChange={e => setExportFormat(e.target.value)}
              />
              <div className="format-info">
                <strong>CER (Solo publico)</strong>
                <span>Solo el certificado sin clave privada</span>
              </div>
            </label>
          </div>

          {exportFormat === 'pfx' && (
            <>
              <div className="step-header" style={{ marginTop: '24px' }}>
                <div className="step-number">3</div>
                <div>
                  <h3>Proteccion con Contrasena</h3>
                  <p>Puedes exportar con o sin contrasena</p>
                </div>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={e => setUsePassword(e.target.checked)}
                />
                <span>Proteger con contrasena</span>
              </label>

              {usePassword && (
                <input
                  type="password"
                  className="password-input"
                  placeholder="Ingresa la contrasena de exportacion"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              )}

              {!usePassword && (
                <div className="warning-box">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Sin contrasena: el certificado podra ser instalado libremente en cualquier equipo</span>
                </div>
              )}
            </>
          )}

          <div className="step-header" style={{ marginTop: '24px' }}>
            <div className="step-number">{exportFormat === 'pfx' ? '4' : '3'}</div>
            <div>
              <h3>Seleccionar Carpeta de Destino</h3>
              <p>Elige donde guardar el certificado exportado</p>
            </div>
          </div>

          <div className="folder-scan-input">
            <input
              type="text"
              placeholder="Haz clic en Examinar para elegir carpeta..."
              value={destFolder}
              readOnly
            />
            <button className="scan-folder-btn secondary-btn" onClick={handlePickFolder}>
              Examinar
            </button>
          </div>

          {destFolder && (
            <div className="cert-preview" style={{ marginTop: '12px' }}>
              <div className="preview-row">
                <span className="preview-label">Archivo:</span>
                <span className="preview-value">
                  {(selectedCert?.file_name || 'certificado').replace(/\.[^.]+$/, '')}.{exportFormat}
                </span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Ruta:</span>
                <span className="preview-value" style={{ wordBreak: 'break-all' }}>
                  {destFolder}\\{(selectedCert?.file_name || 'certificado').replace(/\.[^.]+$/, '')}.{exportFormat}
                </span>
              </div>
            </div>
          )}

          <button
            className="primary-btn export-btn"
            onClick={handleExport}
            disabled={!selectedCert || !destFolder || loading}
            style={{ marginTop: '20px' }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Exportando...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Certificado
              </>
            )}
          </button>

          {result && (
            <div className={`result-message ${result.success ? 'success' : 'error'}`}>
              {result.success ? (
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
              <span>{result.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
