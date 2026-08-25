# Cert Vault - Gestor de Certificados Digitales

Aplicacion de escritorio para Windows que permite **importar, exportar e instalar certificados digitales** de forma rapida y segura. Diseñada para migrar certificados entre equipos sin necesidad de recordar contrasenas.

## Caracteristicas Principales

- **Importar certificados**: Soporta formatos PFX, P12, CER, CRT y PEM con o sin contrasena
- **Exportar certificados**: Exporta en PFX (con o sin contrasena) o CER (solo publico)
- **Instalar silenciosamente**: Instala certificados en el almacén de Windows sin pedir contrasena
- **CRUD completo**: Visualiza, busca, filtra, edita y elimina certificados del inventario
- **Migracion entre equipos**: Exporta sin contrasena en el Equipo A, importa e instala en el Equipo B
- **Consulta de almacenes**: Visualiza los certificados instalados en cada almacén de Windows
- **Temas duales**: Tema oscuro y tema claro intercambiables
- **Interfaz limpia**: Ventana maximizada sin barra de menú tradicional

## Flujo de Migracion entre Equipos

1. **Equipo A**: Importa los certificados en Cert Vault
2. **Equipo A**: Exporta los certificados **sin contrasena** (formato PFX)
3. **Equipo B**: Instala Cert Vault
4. **Equipo B**: Importa los certificados PFX exportados
5. **Equipo B**: Usa "Instalar Silenciosamente" para colocarlos en el almacén de Windows
6. Listo. Todos los certificados instalados sin pedir contrasena.

## Prerrequisitos de Sistema

- **Sistema operativo**: Windows 10/11 (64-bit)
- **Node.js**: Version 18 o superior
  - Descargar desde: https://nodejs.org/
  - Se recomienda la version LTS

## Instalacion y Ejecucion

1. Clona o descarga este repositorio
2. Haz doble clic en `run-app.bat`
3. La primera vez, se instalaran las dependencias automaticamente
4. La aplicacion se abrira maximizada

```bash
git clone https://github.com/chrishb2000/cert-vault.git
cd cert-vault
run-app.bat
```

## Estructura del Proyecto

```
cert-vault/
├── src/
│   ├── main/                    # Proceso principal de Electron
│   │   ├── main.js              # Punto de entrada, configuracion de ventana
│   │   ├── preload.js           # Puente IPC (contextBridge)
│   │   ├── db.js                # Inicializacion SQLite
│   │   ├── cert-utils.js        # Wrappers de certutil y PowerShell
│   │   └── ipc-handlers.js      # Manejadores IPC (CRUD)
│   └── renderer/                # Frontend React
│       ├── index.html
│       ├── App.jsx              # Layout principal
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── Dashboard.jsx
│       │   ├── ImportCert.jsx
│       │   ├── ExportCert.jsx
│       │   ├── CertDetail.jsx
│       │   └── InstallCert.jsx
│       └── styles/
│           └── app.css          # Temas claro/oscuro
├── package.json
├── run-app.bat                  # Lanzador ASCII con auto-instalacion
└── README.md
```

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Framework | Electron.js + React |
| UI | CSS Custom (temas claro/oscuro) |
| Certificados | node-forge + certutil.exe |
| Base de datos | SQLite via better-sqlite3 |
| Windows Store | certutil -importpfx |

## Tecnologias del Almacen de Windows

- **Personal (My)**: Certificados del usuario actual
- **Raiz de Confianza (Root)**: Autoridades de certificacion raiz
- **Intermedias (CA)**: CA intermedias
- **Editores de Confianza (TrustedPublisher)**: Editores de software

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Build para produccion
npm run build:win
```

## Formatos Soportados

| Formato | Extension | Contenido |
|---|---|---|
| PKCS#12 | .pfx, .p12 | Certificado + Clave privada |
| DER | .cer, .crt | Solo certificado publico |
| PEM | .pem | Certificado en texto |

## Autor y apoyo

Desarrollado por [Christian Herencia](https://christian-freelance.us/).

Si el proyecto te resulta util, puedes
[invitarme a un cafe mediante PayPal](https://www.paypal.com/donate/?hosted_button_id=YC6YAWBQ7HNSS).

## Licencia

MIT License
