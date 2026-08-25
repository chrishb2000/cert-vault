import React, { useState } from 'react';

export default function ImportCert({ onImported, onNavigate }) {
  const [password, setPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelectFile = async () => {
    const filePath = await window.certAPI.openImportDialog();
    if (filePath) {
      setSelectedFile(filePath);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await window.certAPI.importCert(selectedFile, password);
      setResult(res);
      if (res.success) {
        onImported();
        setPassword('');
        setSelectedFile('');
      }
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getFileName = () => {
    if (!selectedFile) return null;
    return selectedFile.split(/[\\/]/).pop();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Importar Certificado</h1>
      </div>
      <div className="import-container">
        <div className="import-card">
          <div className="step-header">
            <div className="step-number">1</div>
            <div>
              <h3>Seleccionar Archivo</h3>
              <p>Soporta formatos PFX, P12, CER, CRT y PEM</p>
            </div>
          </div>

          <button className="select-file-btn" onClick={handleSelectFile}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {getFileName() || 'Seleccionar archivo de certificado...'}
          </button>

          {selectedFile && (
            <div className="selected-file-info">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{getFileName()}</span>
            </div>
          )}

          <div className="step-header" style={{ marginTop: '24px' }}>
            <div className="step-number">2</div>
            <div>
              <h3>Contraseña (Opcional)</h3>
              <p>Si el certificado tiene contraseña, ingresa aqui</p>
            </div>
          </div>

          <input
            type="password"
            className="password-input"
            placeholder="Contrasena del certificado (dejar vacio si no tiene)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={!selectedFile}
          />

          <div className="step-header" style={{ marginTop: '24px' }}>
            <div className="step-number">3</div>
            <div>
              <h3>Importar</h3>
              <p>El certificado sera analizado y guardado en el inventario</p>
            </div>
          </div>

          <button
            className="primary-btn import-btn"
            onClick={handleImport}
            disabled={!selectedFile || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analizando certificado...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Importar Certificado
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
