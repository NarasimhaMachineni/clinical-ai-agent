/**
 * ClinicalOps AI Agent — v14.0 Acceptance Tests
 * Covers:
 *   STD-001..006  : StandardsRegistry (Section 12)
 *   INTEGRITY-001..005 : Status pill / false-claim elimination (Sections 2-3)
 *   PERF-HUD-001..003 : Performance HUD measured latency (Section 97)
 *
 * Run: node scripts/test_v14_standards_and_integrity.js
 */

'use strict';

// Mock minimal browser globals needed by orchestrator
global.window = global;
global.document = {
  getElementById: () => null,
  createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} }),
  createTextNode: () => ({}),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {} }
};
try { global.navigator = { userAgent: 'Node' }; } catch(e) {
  Object.defineProperty(global, 'navigator', { value: { userAgent: 'Node' }, writable: true });
}
global.performance = {
  now: () => Date.now()
};

let passCount = 0;
let failCount = 0;
const results = [];

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
    passCount++;
    results.push({ label, status: 'PASS' });
  } else {
    console.log(`  ❌ [FAIL] ${label}${detail ? ' — ' + detail : ''}`);
    failCount++;
    results.push({ label, status: 'FAIL', detail });
  }
}

function assertEq(label, actual, expected) {
  const ok = actual === expected;
  assert(label + ` (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`, ok);
}

// Load orchestrator
const orch = require('../engines/clinicalValidationOrchestrator.js');

// ─────────────────────────────────────────────────────────────────────────────
// STD-001..006: StandardsRegistry
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- STD: STANDARDS REGISTRY (Section 12) ---');

const sr = orch.StandardsRegistry;
assert('STD-001: StandardsRegistry exists in exports', !!sr, 'must be exported');
assert('STD-001b: StandardsRegistry is an object with methods', typeof sr === 'object' && typeof sr.getStandard === 'function');

// Version resolution
assertEq('STD-002: SDTMIG active version default is 3.3', sr.getActiveVersion('SDTMIG'), '3.3');
assertEq('STD-002b: ADaMIG active version default is 1.3', sr.getActiveVersion('ADaMIG'), '1.3');
assertEq('STD-002c: Define-XML active version default is 2.1.7', sr.getActiveVersion('DEFINEXML'), '2.1.7');

// Required variable lookup — SDTM
const dmReq = sr.getRequiredVariables('SDTMIG', 'DM');
assert('STD-003: DM required variables non-empty', dmReq.length > 0);
assert('STD-003b: STUDYID is required in DM', dmReq.includes('STUDYID'));
assert('STD-003c: USUBJID is required in DM', dmReq.includes('USUBJID'));
assert('STD-003d: SEX is required in DM', dmReq.includes('SEX'));

// Required variable lookup — ADaM
const adslReq = sr.getRequiredVariables('ADaMIG', 'ADSL');
assert('STD-004: ADSL required variables non-empty', adslReq.length > 0);
assert('STD-004b: SAFFL is required in ADSL', adslReq.includes('SAFFL'));
assert('STD-004c: TRTDURD is required in ADSL', adslReq.includes('TRTDURD'));

// isRequired convenience method
assert('STD-004d: isRequired(DM, STUDYID) → true', sr.isRequired('DM', 'STUDYID') === true);
assert('STD-004e: isRequired(DM, FAKEFIELD) → false', sr.isRequired('DM', 'FAKEFIELD') === false);
assert('STD-004f: isRequired(ADSL, TRTDURD) → true', sr.isRequired('ADSL', 'TRTDURD') === true);

// Domain-to-standard resolution
assertEq('STD-005: resolveStandardForDomain(ADSL) → ADaMIG', sr.resolveStandardForDomain('ADSL'), 'ADaMIG');
assertEq('STD-005b: resolveStandardForDomain(ADAE) → ADaMIG', sr.resolveStandardForDomain('ADAE'), 'ADaMIG');
assertEq('STD-005c: resolveStandardForDomain(DM) → SDTMIG', sr.resolveStandardForDomain('DM'), 'SDTMIG');
assertEq('STD-005d: resolveStandardForDomain(AE) → SDTMIG', sr.resolveStandardForDomain('AE'), 'SDTMIG');

// Citation generation
const cite1 = sr.cite('SDTMIG', '2.2.1');
assert('STD-005e: cite(SDTMIG, 2.2.1) contains version', cite1.includes('3.3') && cite1.includes('SDTMIG'));
const cite2 = sr.cite('ADaMIG', '3.3.4');
assert('STD-005f: cite(ADaMIG, 3.3.4) contains version', cite2.includes('1.3') && cite2.includes('ADaMIG'));

// Version status
assertEq('STD-006: SDTMIG 3.3 status is CURRENT', sr.getVersionStatus('SDTMIG', '3.3'), 'CURRENT');
assertEq('STD-006b: SDTMIG 3.2 status is RETIRED', sr.getVersionStatus('SDTMIG', '3.2'), 'RETIRED');
assertEq('STD-006c: ADaMIG 1.1 status is RETIRED', sr.getVersionStatus('ADaMIG', '1.1'), 'RETIRED');
assertEq('STD-006d: ADaMIG 1.3 status is CURRENT', sr.getVersionStatus('ADaMIG', '1.3'), 'CURRENT');

// setActiveVersion
const setResult = sr.setActiveVersion('SDTMIG', '3.4');
assert('STD-006e: setActiveVersion(SDTMIG, 3.4) returns true for valid version', setResult === true);
assertEq('STD-006f: after set, SDTMIG active version is 3.4', sr.getActiveVersion('SDTMIG'), '3.4');
const setInvalid = sr.setActiveVersion('SDTMIG', '9.9');
assert('STD-006g: setActiveVersion(SDTMIG, 9.9) returns false for invalid version', setInvalid === false);
// Reset
sr.setActiveVersion('SDTMIG', '3.3');

// getSummary
const summary = sr.getSummary();
assert('STD-006h: getSummary() returns array with 5 standards', Array.isArray(summary) && summary.length === 5);
assert('STD-006i: getSummary items have required fields', summary.every(s => s.key && s.name && s.abbreviation && s.activeVersion && s.latestVersion));

// Key variables
const dmKeys = sr.getKeyVariables('SDTMIG', 'DM');
assert('STD-006j: DM key variables include STUDYID and USUBJID', dmKeys.includes('STUDYID') && dmKeys.includes('USUBJID'));
assert('STD-006k: DM key variables do NOT include AESEQ (wrong domain)', !dmKeys.includes('AESEQ'));

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRITY-001..005: No false GxP/status claims
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- INTEGRITY: FALSE-STATUS ELIMINATION (Sections 2-3) ---');

const fs = require('fs');
const path = require('path');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// index.html must not have hardcoded GxP PRODUCTION READY in initial HTML
assert('INTEGRITY-001: index.html does NOT contain hardcoded "GxP PRODUCTION READY" in static HTML pill',
  !htmlContent.includes('GxP PRODUCTION READY'),
  'found hardcoded GxP PRODUCTION READY in index.html'
);

// index.html must not have "<5ms" hardcoded
assert('INTEGRITY-002: index.html does NOT contain hardcoded "<5ms" latency claim',
  !htmlContent.includes('&lt;5ms') && !htmlContent.includes('<5ms'),
  'found hardcoded <5ms in index.html'
);

// index.html must not claim "240Hz Fluid" hardcoded
assert('INTEGRITY-003: index.html does NOT contain hardcoded "240Hz Fluid" claim',
  !htmlContent.includes('240Hz Fluid'),
  'found hardcoded 240Hz Fluid in index.html'
);

// app.js setDataSourceMode idle state must say STANDBY
assert('INTEGRITY-004: app.js setDataSourceMode idle branch uses STANDBY not GxP PRODUCTION READY',
  appContent.includes('STANDBY — NO DATA LOADED') && !appContent.includes("'CLINICAL ENGINE: 🟢 GxP PRODUCTION READY'"),
  'found GxP PRODUCTION READY in setDataSourceMode idle branch'
);

// app.js must not have "240Hz Fluid" string
assert('INTEGRITY-005: app.js does NOT contain "240Hz Fluid" in updateGridPerformanceHud',
  !appContent.includes('240Hz Fluid'),
  'found 240Hz Fluid in app.js'
);

// ─────────────────────────────────────────────────────────────────────────────
// PERF-HUD-001..003: Performance HUD uses measured latency
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- PERF-HUD: MEASURED LATENCY (Section 97) ---');

// Verify updateGridPerformanceHud writes to grid-perf-hud-text span, not hud div
assert('PERF-HUD-001: app.js updateGridPerformanceHud targets grid-perf-hud-text span',
  appContent.includes("getElementById('grid-perf-hud-text')"),
  'must use grid-perf-hud-text not grid-perf-hud'
);

// Verify it uses parseFloat to handle numeric latency
assert('PERF-HUD-002: updateGridPerformanceHud uses parseFloat for type-safe latency',
  appContent.includes('parseFloat(latencyMs)'),
  'must validate numeric latency'
);

// Verify renderDatasetTable calculates throughput from actual row count
assert('PERF-HUD-003: renderDatasetTable computes throughput from actual row count',
  appContent.includes('throughputVal') && appContent.includes('visibleRows'),
  'must calculate rows/s from actual row count'
);

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
const total = passCount + failCount;
console.log('\n' + '='.repeat(64));
if (failCount === 0) {
  console.log(`🎉 ALL ${total} OF ${total} v14.0 ACCEPTANCE TESTS PASSED!`);
  console.log('   StandardsRegistry ✅ | Status Integrity ✅ | Perf HUD ✅');
} else {
  console.log(`⚠️  ${passCount}/${total} PASSED — ${failCount} FAILURES`);
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`   ❌ ${r.label}${r.detail ? ' — ' + r.detail : ''}`);
  });
  process.exit(1);
}
console.log('='.repeat(64) + '\n');
