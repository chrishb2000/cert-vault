import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AutoDetect from './components/AutoDetect';
import ImportCert from './components/ImportCert';
import ExportCert from './components/ExportCert';
import CertDetail from './components/CertDetail';
import InstallCert from './components/InstallCert';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [page, setPage] = useState('dashboard');
  const [selectedCert, setSelectedCert] = useState(null);
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    loadCerts();
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const bgColor = theme === 'dark' ? '#0f172a' : '#f8fafc';
    if (window.certAPI && window.certAPI.setBackgroundColor) {
      window.certAPI.setBackgroundColor(bgColor);
    }
  }, [theme]);

  const loadCerts = async () => {
    const data = await window.certAPI.getAllCerts();
    setCerts(data);
  };

  const navigateTo = (pageName, cert = null) => {
    setPage(pageName);
    if (cert) setSelectedCert(cert);
  };

  const renderPage = () => {
    switch (page) {
      case 'autodetect':
        return <AutoDetect onImported={loadCerts} />;
      case 'import':
        return <ImportCert onImported={loadCerts} onNavigate={navigateTo} />;
      case 'export':
        return <ExportCert certs={certs} />;
      case 'install':
        return <InstallCert certs={certs} />;
      case 'detail':
        return <CertDetail cert={selectedCert} onBack={() => navigateTo('dashboard')} onRefresh={loadCerts} />;
      default:
        return <Dashboard certs={certs} onSelect={navigateTo} onRefresh={loadCerts} />;
    }
  };

  return (
    <div className={`app-container theme-${theme}`}>
      <Sidebar
        currentPage={page}
        onNavigate={navigateTo}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
