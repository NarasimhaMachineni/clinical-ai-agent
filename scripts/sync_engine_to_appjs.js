const fs = require('fs');

const engContent = fs.readFileSync('engines/clinicalVerificationEngine.js', 'utf8');

// Extract determineCdiscVariableType and verifyAndRepairClinicalData
const engStart = engContent.indexOf('function determineCdiscVariableType(');
const engEnd = engContent.lastIndexOf('module.exports');
if (engStart === -1 || engEnd === -1) {
  console.error('Could not find boundaries in engine!');
  process.exit(1);
}
const engineFns = engContent.slice(engStart, engEnd).trim();

function syncToFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileStart = fileContent.indexOf('function determineCdiscVariableType(');
  const fileEnd = fileContent.indexOf('function verifyAndRepairADaM(dsetName, rows) {');
  if (fileStart === -1 || fileEnd === -1) {
    console.error(`Could not find boundaries in ${filePath}! (fileStart: ${fileStart}, fileEnd: ${fileEnd})`);
    process.exit(1);
  }
  let newContent = fileContent.slice(0, fileStart) + engineFns + '\n\n' + fileContent.slice(fileEnd);
  
  // Also ensure window.clientColumnProfiles is set in processUploadedClinicalFile
  if (!newContent.includes('window.clientColumnProfiles[domain] = audit.columnProfiles;')) {
    newContent = newContent.replace(
      'window.clientAuditLogs[domain] = audit.auditLog;',
      'window.clientAuditLogs[domain] = audit.auditLog;\n  if (!window.clientColumnProfiles) window.clientColumnProfiles = {};\n  window.clientColumnProfiles[domain] = audit.columnProfiles;'
    );
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Successfully synced engine functions to ${filePath}`);
}

syncToFile('app.js');
syncToFile('public/app.js');
