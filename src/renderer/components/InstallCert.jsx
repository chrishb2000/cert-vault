import React, { useState, useEffect } from 'react';

const STORES = [
  { id: 'My', label: 'Personal (My)', description: 'Certificados del usuario actual' },
  { id: 'Root', label: 'Raiz de Confianza', description: 'Autoridades de certificacion raiz' },
  { id: 'CA', label: 'Intermedias', description: 'CA intermedias de certificacion' },
  { id: 'TrustedPublisher', label: 'Editores de Confianza', description: 'Editores de software confiables' }
];

export default function InstallCert({ certs }) {
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedStore, setSelectedStore] = useState('My');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [installedCerts, setInstalledCerts] = useState([]);
  const [viewingStore, setViewingStore] = useState(null);

  const handleInstall = async () => {
    if (!selectedCert) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await window.certAPI.installCert(selectedCert.id, selectedStore);
      setResult(res);
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadInstalled = async (storeName) => {
    setViewingStore(storeName);
    const certs = await window.certAPI.getInstalledCerts(storeName);
    setInstalledCerts(certs);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Instalar en Windows</h1>
      </div>

      <div className="install-container">
        <div className="install-left">
          <div className="import-card">
            <div className="step-header">
              <div className="step-number">1</div>
              <div>
                <h3>Seleccionar Certificado</h3>
                <p>Elige el certificado a instalar en Windows</p>
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
                  {c.label || c.subject || c.file_name} ({c.file_type})
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
                  <span className="preview-label">Clave privada:</span>
                  <span className="preview-value">{selectedCert.has_private_key ? 'Si' : 'No'}</span>
                </div>
              </div>
            )}

            <div className="step-header" style={{ marginTop: '24px' }}>
              <div className="step-number">2</div>
              <div>
                <h3>Almacen de Destino</h3>
                <p>Selecciona donde instalar el certificado</p>
              </div>
            </div>

            <div className="store-options">
              {STORES.map(store => (
                <label key={store.id} className={`store-option ${selectedStore === store.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value={store.id}
                    checked={selectedStore === store.id}
                    onChange={e => setSelectedStore(e.target.value)}
                  />
                  <div className="store-info">
                    <strong>{store.label}</strong>
                    <span>{store.description}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="step-header" style={{ marginTop: '24px' }}>
              <div className="step-number">3</div>
              <div>
                <h3>Instalar Silenciosamente</h3>
                <p>El certificado se instalara sin pedir contrasena</p>
              </div>
            </div>

            <button
              className="primary-btn install-btn"
              onClick={handleInstall}
              disabled={!selectedCert || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Instalando en Windows...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Instalar Silenciosamente
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

        <div className="install-right">
          <div className="import-card">
            <h3>Certificados Instalados en Windows</h3>
            <p className="section-desc">Consulta los certificados actualmente instalados por almacen</p>

            <div className="store-tabs">
              {STORES.map(store => (
                <button
                  key={store.id}
                  className={`store-tab ${viewingStore === store.id ? 'active' : ''}`}
                  onClick={() => loadInstalled(store.id)}
                >
                  {store.label}
                </button>
              ))}
            </div>

            {viewingStore && (
              <div className="installed-list">
                {installedCerts.length === 0 ? (
                  <div className="empty-small">No hay certificados en este almacen</div>
                ) : (
                  installedCerts.map((cert, idx) => (
                    <div key={idx} className="installed-cert-item">
                      <div className="cert-item-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div className="cert-item-info">
                        <span className="cert-item-subject">{cert.subject || 'Sin asunto'}</span>
                        <span className="cert-item-issuer">{cert.issuer || ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
