const fs = require('fs');

const engContent = fs.readFileSync('engines/clinicalVerificationEngine.js', 'utf8');
const appContent = fs.readFileSync('app.js', 'utf8');

// Extract function verifyAndRepairClinicalData from engines/clinicalVerificationEngine.js
const engStart = engContent.indexOf('function verifyAndRepairClinicalData(');
const engEnd = engContent.lastIndexOf('module.exports');
if (engStart === -1 || engEnd === -1) {
  console.error('Could not find boundaries in engine!');
  process.exit(1);
}
const engineFn = engContent.slice(engStart, engEnd).trim();

// Find boundaries in app.js
const appStart = appContent.indexOf('function verifyAndRepairClinicalData(dsetName, rows) {');
const appEnd = appContent.indexOf('function verifyAndRepairADaM(dsetName, rows) {');
if (appStart === -1 || appEnd === -1) {
  console.error('Could not find boundaries in app.js!');
  process.exit(1);
}

const newAppContent = appContent.slice(0, appStart) + engineFn + '\n\n' + appContent.slice(appEnd);
fs.writeFileSync('app.js', newAppContent, 'utf8');
console.log('Successfully synced verifyAndRepairClinicalData to app.js');
