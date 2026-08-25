import React, { useState } from 'react';

export default function Dashboard({ certs, onSelect, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredCerts = certs.filter(c => {
    const matchSearch = !search ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.file_name.toLowerCase().includes(search.toLowerCase()) ||
      c.issuer.toLowerCase().includes(search.toLowerCase());

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
    </div>
  );
}
