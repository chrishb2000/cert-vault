import React, { useState } from 'react';

const STORES = [
  { id: 'My', label: 'Personal (My)', desc: 'Certificados del usuario actual' },
  { id: 'Root', label: 'Raiz de Confianza', desc: 'Autoridades raiz de certificacion' },
  { id: 'CA', label: 'Intermedias (CA)', desc: 'CA intermedias de certificacion' },
  { id: 'TrustedPublisher', label: 'Editores de Confianza', desc: 'Editores de software confiables' }
];

export default function Dashboard({ certs, onSelect, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [installCert, setInstallCert] = useState(null);
  const [installStore, setInstallStore] = useState('My');
  const [installPassword, setInstallPassword] = useState('');
  const [installLoading, setInstallLoading] = useState(false);
  const [installResult, setInstallResult] = useState(null);

  const filteredCerts = certs.filter(c => {
    const matchSearch = !search ||
      (c.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.file_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.issuer || '').toLowerCase().includes(search.toLowerCase());

    if (filter === 'valid') {
      return matchSearch && new Date(c.valid_to) > new Date();
    }
    if (filter === 'expired') {
      return matchSearch && new Date(c.valid_to) <= new Date();
    }
    if (filter === 'privateKey') {
      return matchSearch && c.has_private_key;
    }
    return matchSearch;
  });

  const isExpired = (validTo) => new Date(validTo) <= new Date();

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Eliminar este certificado del inventario?')) {
      await window.certAPI.deleteCert(id);
      onRefresh();
    }
  };

  const openInstallModal = (e, cert) => {
    e.stopPropagation();
    setInstallCert(cert);
    setInstallStore('My');
    setInstallPassword('');
    setInstallResult(null);
  };

  const closeInstallModal = () => {
    setInstallCert(null);
    setInstallResult(null);
  };

  const handleInstall = async () => {
    if (!installCert) return;
    setInstallLoading(true);
    setInstallResult(null);
    try {
      const res = await window.certAPI.installCert(installCert.id, installStore);
      setInstallResult(res);
    } catch (err) {
      setInstallResult({ success: false, message: err.message });
    } finally {
      setInstallLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mis Certificados</h1>
        <span className="badge">{certs.length} certificados</span>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, asunto o emisor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
          <button className={`filter-btn ${filter === 'valid' ? 'active' : ''}`} onClick={() => setFilter('valid')}>Validos</button>
          <button className={`filter-btn ${filter === 'expired' ? 'active' : ''}`} onClick={() => setFilter('expired')}>Expirados</button>
          <button className={`filter-btn ${filter === 'privateKey' ? 'active' : ''}`} onClick={() => setFilter('privateKey')}>Con Clave Privada</button>
        </div>
      </div>

      <div className="cert-table-container">
        {filteredCerts.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h3>No hay certificados</h3>
            <p>Importa tu primer certificado para comenzar</p>
          </div>
        ) : (
          <table className="cert-table">
            <thead>
              <tr>
                <th>Nombre / Asunto</th>
                <th>Emisor</th>
                <th>Tipo</th>
                <th>Valido Hasta</th>
                <th>Clave Privada</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map(cert => (
                <tr key={cert.id} className={isExpired(cert.valid_to) ? 'expired-row' : ''} onClick={() => onSelect('detail', cert)}>
                  <td className="cert-name">
                    <div className="cert-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                    <span>{cert.label || cert.subject || cert.file_name}</span>
                  </td>
                  <td className="issuer-cell">{cert.issuer || '-'}</td>
                  <td><span className="type-badge">{cert.file_type}</span></td>
                  <td>{formatDate(cert.valid_to)}</td>
                  <td>{cert.has_private_key ? <span className="yes-badge">Si</span> : <span className="no-badge">No</span>}</td>
                  <td>{isExpired(cert.valid_to) ? <span className="expired-badge">Expirado</span> : <span className="valid-badge">Valido</span>}</td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn install-btn-row" onClick={(e) => openInstallModal(e, cert)} title="Instalar en Windows">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                      </button>
                      <button className="action-btn view-btn" onClick={(e) => { e.stopPropagation(); onSelect('detail', cert); }} title="Ver detalles">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className="action-btn delete-btn" onClick={(e) => handleDelete(e, cert.id)} title="Eliminar">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {installCert && (
        <div className="modal-overlay" onClick={closeInstallModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Instalar Certificado en Windows</h2>
              <button className="modal-close" onClick={closeInstallModal}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="install-cert-info">
                <div className="cert-icon-lg">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <div className="install-cert-subject">{installCert.subject || installCert.file_name}</div>
                  <div className="install-cert-meta">{installCert.issuer || 'Emisor desconocido'} &middot; {installCert.file_type}</div>
                </div>
              </div>

              <div className="install-section">
                <label className="install-label">Almacen de destino</label>
                <div className="store-grid">
                  {STORES.map(store => (
                    <label key={store.id} className={`store-card ${installStore === store.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        value={store.id}
                        checked={installStore === store.id}
                        onChange={e => setInstallStore(e.target.value)}
                      />
                      <div className="store-card-title">{store.label}</div>
                      <div className="store-card-desc">{store.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="install-section">
                <label className="install-label">Contrasena (opcional)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Dejar vacio si no tiene contrasena"
                  value={installPassword}
                  onChange={e => setInstallPassword(e.target.value)}
                />
              </div>

              {installResult && (
                <div className={`result-message ${installResult.success ? 'success' : 'error'}`}>
                  {installResult.success ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                  <span>{installResult.message}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={closeInstallModal}>Cancelar</button>
              <button className="primary-btn" onClick={handleInstall} disabled={installLoading}>
                {installLoading ? (
                  <>
                    <span className="spinner"></span>
                    Instalando...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    Instalar en Windows
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
