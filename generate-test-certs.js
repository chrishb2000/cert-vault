const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'test-certs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function createCert(cn, daysValid, useOwnKey) {
  const keys = useOwnKey ? forge.pki.rsa.generateKeyPair(2048) : null;

  const cert = forge.pki.createCertificate();
  cert.publicKey = keys ? keys.publicKey : forge.pki.rsa.generateKeyPair(2048).publicKey;

  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setDate(cert.validity.notAfter.getDate() + daysValid);

  cert.setSubject([{ shortName: 'CN', value: cn }]);
  cert.setIssuer([{ shortName: 'CN', value: 'CertVault Test CA' }]);

  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true }
  ]);

  const signingKey = keys ? keys.privateKey : forge.pki.rsa.generateKeyPair(2048).privateKey;
  cert.sign(signingKey, forge.md.sha256.create());

  return { cert, keys };
}

function savePfx(cert, keys, filename, password) {
  if (!keys) return;
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password || '', { algorithm: '3des' });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(forge.asn1.toDer(p12Asn1).getBytes(), 'binary'));
  console.log(`  [OK] ${filename}`);
}

function saveDer(cert, filename) {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(der, 'binary'));
  console.log(`  [OK] ${filename}`);
}

function savePem(cert, filename) {
  fs.writeFileSync(path.join(outputDir, filename), forge.pki.certificateToPem(cert));
  console.log(`  [OK] ${filename}`);
}

console.log('');
console.log('=== Generando certificados de prueba ===');
console.log('');

console.log('1. Certificado valido SIN contrasena:');
const c1 = createCert('test-valid-local.dev', 365, true);
savePfx(c1.cert, c1.keys, 'test-valid-sin-contrasena.pfx', '');

console.log('2. Certificado valido CON contrasena (1234):');
const c2 = createCert('test-valid-secure.dev', 365, true);
savePfx(c2.cert, c2.keys, 'test-valid-con-contrasena.pfx', '1234');

console.log('3. Certificado EXPIRADO:');
const c3 = createCert('test-expired.dev', -30, true);
savePfx(c3.cert, c3.keys, 'test-expired.pfx', '');

console.log('4. Certificado por expirar en 7 dias:');
const c4 = createCert('test-expiring-7dias.dev', 7, true);
savePfx(c4.cert, c4.keys, 'test-expiring-7dias.pfx', '');

console.log('5. Certificado solo publico (CER):');
const c5 = createCert('test-public-only.dev', 365, false);
saveDer(c5.cert, 'test-publico.cer');

console.log('6. Certificado formato PEM:');
const c6 = createCert('test-pem-format.dev', 365, false);
savePem(c6.cert, 'test-pem-format.pem');

console.log('7. Certificado vida larga (2 anos):');
const c7 = createCert('test-long-life.dev', 730, true);
savePfx(c7.cert, c7.keys, 'test-vida-larga.pfx', '');

console.log('8. Certificado contrasena larga:');
const c8 = createCert('test-strong-pw.dev', 365, true);
savePfx(c8.cert, c8.keys, 'test-contrasena-larga.pfx', 'MiClaveSegura2024!');

console.log('');
console.log('=== Generados en: ' + outputDir + ' ===');
console.log('');
console.log('  test-valid-sin-contrasena.pfx   -> Importar sin contrasena');
console.log('  test-valid-con-contrasena.pfx   -> Importar con contrasena: 1234');
console.log('  test-expired.pfx                -> Certificado expirado');
console.log('  test-expiring-7dias.pfx         -> Expira en 7 dias');
console.log('  test-publico.cer                -> Solo publico');
console.log('  test-pem-format.pem             -> Formato PEM');
console.log('  test-vida-larga.pfx             -> Valido 2 anos');
console.log('  test-contrasena-larga.pfx       -> Contrasena larga');
console.log('');
