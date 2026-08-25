import React, { useState } from 'react';

export default function CertDetail({ cert, onBack, onRefresh }) {
  const [label, setLabel] = useState(cert.label || '');
  const [editing, setEditing] = useState(false);

  if (!cert) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isExpired = new Date(cert.valid_to) <= new Date();

  const handleSaveLabel = async () => {
    await window.certAPI.updateCertLabel(cert.id, label);
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (confirm('Eliminar este certificado del inventario?')) {
      await window.certAPI.deleteCert(cert.id);
      onRefresh();
      onBack();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </button>
        <h1>Detalle del Certificado</h1>
        <div className="header-actions">
          <button className="action-btn danger-btn" onClick={handleDelete}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>

      <div className="detail-container">
        <div className="detail-card main-info">
          <div className="detail-header">
            <div className={`detail-icon ${isExpired ? 'expired' : 'valid'}`}>
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                {!isExpired && <polyline points="9 12 11 14 15 10" />}
              </svg>
            </div>
            <div className="detail-title">
              <div className="label-edit">
                {editing ? (
                  <>
                    <input
                      type="text"
                      className="label-input"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveLabel()}
                    />
                    <button className="save-label-btn" onClick={handleSaveLabel}>Guardar</button>
                  </>
                ) : (
                  <>
                    <h2>{cert.label || cert.subject || cert.file_name}</h2>
                    <button className="edit-label-btn" onClick={() => setEditing(true)}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <span className={`status-badge ${isExpired ? 'expired' : 'valid'}`}>
                {isExpired ? 'Expirado' : 'Valido'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <h3>Informacion del Certificado</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Asunto (Subject)</span>
                <span className="info-value">{cert.subject || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Emisor (Issuer)</span>
                <span className="info-value">{cert.issuer || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Numero de Serie</span>
                <span className="info-value mono">{cert.serial_number || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Huella Digital</span>
                <span className="info-value mono">{cert.thumbprint || '-'}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3>Validez y Seguridad</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Valido Desde</span>
                <span className="info-value">{formatDate(cert.valid_from)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Valido Hasta</span>
                <span className={`info-value ${isExpired ? 'text-error' : 'text-success'}`}>{formatDate(cert.valid_to)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Clave Privada</span>
                <span className="info-value">{cert.has_private_key ? 'Si (exportable)' : 'No'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Uso de Clave</span>
                <span className="info-value">{cert.key_usage || 'No especificado'}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3>Archivo</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Nombre</span>
                <span className="info-value">{cert.file_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tipo</span>
                <span className="info-value"><span className="type-badge">{cert.file_type}</span></span>
              </div>
              <div className="info-row">
                <span className="info-label">Ruta</span>
                <span className="info-value mono small">{cert.file_path}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Fecha de Importacion</span>
                <span className="info-value">{formatDate(cert.import_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
