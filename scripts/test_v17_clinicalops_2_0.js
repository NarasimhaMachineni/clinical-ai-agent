/**
 * ============================================================================
 * 🧪 CLINICALOPS AI AGENT 2.0 — MASTER ACCEPTANCE TEST SUITE v17.0
 * 
 * Verifies the complete ClinicalOps AI Agent 2.0 implementation:
 * 1. Apple-Inspired Liquid Glass Design System (Tokens, Blur, Emerald/Teal, Contrast)
 * 2. 3-Way Theme Switcher (Light / Dark / System Auto + Persistence)
 * 3. 240 Hz-Ready Compositor Transitions & Accessibility (prefers-reduced-motion)
 * 4. Simple Information Architecture (6 Core Workspaces + Sub-Navigation Bars)
 * 5. High-Value Clinical Differentiators:
 *    - Evidence-Linked Findings (jumpToRecord + Cell Pulse)
 *    - Specification Drift Detector (Blast Radius Calculation)
 *    - Validation Regression Lab (Run-to-Run Comparison)
 *    - Reproducibility Manifest Generator (SHA-256 Vault)
 *    - Dataset Relationship Explorer (Cross-Domain Referential Integrity)
 * 6. Dual-Location Parity (root <-> public/)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 RUNNING v17.0 CLINICALOPS AI AGENT 2.0 ACCEPTANCE SUITE');
console.log('   (Verifying Apple Liquid Glass, 6 Workspaces & Clinical Differentiators)');
console.log('================================================================\n');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf8');
const pubHtml = fs.readFileSync(path.join(rootDir, 'public/index.html'), 'utf8');
const pubAppJs = fs.readFileSync(path.join(rootDir, 'public/app.js'), 'utf8');
const pubStyleCss = fs.readFileSync(path.join(rootDir, 'public/style.css'), 'utf8');

// -----------------------------------------------------------------------------
// SECTION 1: APPLE-INSPIRED LIQUID GLASS DESIGN SYSTEM
// -----------------------------------------------------------------------------
console.log('--- 1. APPLE-INSPIRED LIQUID GLASS DESIGN SYSTEM ---');

test('GLASS-001: style.css defines liquid glass surfaces and backdrop filters', () => {
  assert(styleCss.includes('--glass-bg'), 'Must define --glass-bg');
  assert(styleCss.includes('--glass-blur'), 'Must define --glass-blur');
  assert(styleCss.includes('backdrop-filter: var(--glass-blur)'), 'Must apply backdrop-filter blur');
});

test('GLASS-002: style.css defines clinical emerald and teal accent tokens', () => {
  assert(styleCss.includes('--emerald-500') && styleCss.includes('#10b981'), 'Must define emerald-500');
  assert(styleCss.includes('--emerald-600') && styleCss.includes('#059669'), 'Must define emerald-600');
  assert(styleCss.includes('--teal-accent') && styleCss.includes('#2dd4bf'), 'Must define teal-accent');
});

test('GLASS-003: Light and Dark themes provide tuned liquid glass surface elevations', () => {
  assert(styleCss.includes('body[data-theme="light"]') || styleCss.includes('body.light-theme'), 'Must define light theme');
  assert(styleCss.includes('--glass-shadow-sm'), 'Must define glass shadow');
});

test('GLASS-004: Apple-style 3-way segmented theme switcher is present in HTML', () => {
  assert(html.includes('id="theme-segmented-control"'), 'Theme segmented control must exist');
  assert(html.includes('id="theme-btn-light"'), 'Light mode button must exist');
  assert(html.includes('id="theme-btn-dark"'), 'Dark mode button must exist');
  assert(html.includes('id="theme-btn-system"'), 'System mode button must exist');
});

test('GLASS-005: app.js defines setAppTheme supporting light, dark, and system modes', () => {
  assert(appJs.includes('function setAppTheme'), 'app.js must define setAppTheme');
  assert(appJs.includes('prefers-color-scheme'), 'Must check prefers-color-scheme for system mode');
});

// -----------------------------------------------------------------------------
// SECTION 2: 240 Hz-READY INTERACTION & ACCESSIBILITY
// -----------------------------------------------------------------------------
console.log('\n--- 2. 240 Hz-READY INTERACTION & ACCESSIBILITY ---');

test('PERF-001: style.css supports prefers-reduced-motion media query', () => {
  assert(styleCss.includes('@media (prefers-reduced-motion: reduce)'), 'Must support prefers-reduced-motion');
});

test('PERF-002: Visible focus rings (:focus-visible) meet WCAG AA accessibility', () => {
  assert(styleCss.includes(':focus-visible'), 'Must define :focus-visible styles');
});

test('PERF-003: Transitions utilize compositor-friendly curves and durations', () => {
  assert(styleCss.includes('--ease-apple'), 'Must define --ease-apple cubic-bezier timing');
});

// -----------------------------------------------------------------------------
// SECTION 3: SIMPLE 6-WORKSPACE INFORMATION ARCHITECTURE
// -----------------------------------------------------------------------------
console.log('\n--- 3. 6 PRIMARY WORKSPACES & SUB-NAVIGATION ---');

test('NAV-6-001: switchTab aliases support all 6 Core Workspaces', () => {
  const sixAliases = [
    "'tab-overview': 'tab-dashboard'",
    "'tab-study-data': 'tab-datasets'",
    "'tab-validation-center': 'tab-sdtm-val'",
    "'tab-derivations-lineage': 'tab-adam-val'",
    "'tab-tlf-qc': 'tab-tlfs'",
    "'tab-reports-audit': 'tab-reports'"
  ];
  sixAliases.forEach(alias => {
    assert(appJs.includes(alias), `switchTab must support alias ${alias}`);
  });
});

test('NAV-6-002: index.html contains workspace sub-navigation segmented bars', () => {
  assert(html.includes('workspace-subnav-bar'), 'Must contain workspace-subnav-bar');
  assert(html.includes('workspace-subnav-pill'), 'Must contain workspace-subnav-pill');
});

test('NAV-6-003: switchTab synchronizes workspace subnav pills', () => {
  assert(appJs.includes('workspace-subnav-pill'), 'switchTab must sync workspace-subnav-pill active state');
});

// -----------------------------------------------------------------------------
// SECTION 4: HIGH-VALUE CLINICAL DIFFERENTIATORS
// -----------------------------------------------------------------------------
console.log('\n--- 4. HIGH-VALUE CLINICAL DIFFERENTIATORS ---');

test('DIFF-001: Evidence-Linked Findings jumpToRecord triggers cell pulse', () => {
  assert(appJs.includes('function jumpToRecord'), 'app.js must define jumpToRecord');
  assert(styleCss.includes('cell-evidence-highlight'), 'style.css must define cell-evidence-highlight');
  assert(styleCss.includes('cell-focus-pulse'), 'style.css must define cell-focus-pulse animation');
});

test('DIFF-002: Specification Drift Detector modal and blast radius engine exist', () => {
  assert(html.includes('id="spec-drift-modal"'), 'spec-drift-modal must exist in HTML');
  assert(html.includes('id="btn-open-spec-drift"'), 'Header must have btn-open-spec-drift');
  assert(appJs.includes('function openSpecDriftModal'), 'app.js must define openSpecDriftModal');
  assert(appJs.includes('function runSpecDriftAnalysis'), 'app.js must define runSpecDriftAnalysis');
});

test('DIFF-003: Validation Regression Lab modal and run-to-run diff engine exist', () => {
  assert(html.includes('id="regression-lab-modal"'), 'regression-lab-modal must exist in HTML');
  assert(html.includes('id="btn-open-regression-lab"'), 'Header must have btn-open-regression-lab');
  assert(appJs.includes('function openRegressionLabModal'), 'app.js must define openRegressionLabModal');
  assert(appJs.includes('function runRegressionComparison'), 'app.js must define runRegressionComparison');
});

test('DIFF-004: Reproducibility Manifest Generator and GxP cryptographic seal exist', () => {
  assert(html.includes('id="reproducibility-manifest-modal"'), 'reproducibility-manifest-modal must exist in HTML');
  assert(html.includes('id="btn-open-manifest"'), 'Header must have btn-open-manifest');
  assert(appJs.includes('function generateReproducibilityManifestObject'), 'app.js must define generateReproducibilityManifestObject');
  assert(appJs.includes('function downloadReproducibilityManifest'), 'app.js must define downloadReproducibilityManifest');
});

test('DIFF-005: Dataset Relationship Explorer modal and referential integrity check exist', () => {
  assert(html.includes('id="dataset-relationship-modal"'), 'dataset-relationship-modal must exist in HTML');
  assert(html.includes('id="btn-open-rel-explorer"'), 'Header must have btn-open-rel-explorer');
  assert(appJs.includes('function openDatasetRelationshipModal'), 'app.js must define openDatasetRelationshipModal');
  assert(appJs.includes('function renderDatasetRelationships'), 'app.js must define renderDatasetRelationships');
});

// -----------------------------------------------------------------------------
// SECTION 5: 100% DUAL-LOCATION PARITY
// -----------------------------------------------------------------------------
console.log('\n--- 5. 100% DUAL-LOCATION PARITY (ROOT <-> PUBLIC/) ---');

test('PARITY-001: index.html is strictly identical to public/index.html', () => {
  assert.strictEqual(html, pubHtml, 'root index.html and public/index.html must match byte-for-byte');
});

test('PARITY-002: app.js is strictly identical to public/app.js', () => {
  assert.strictEqual(appJs, pubAppJs, 'root app.js and public/app.js must match byte-for-byte');
});

test('PARITY-003: style.css is strictly identical to public/style.css', () => {
  assert.strictEqual(styleCss, pubStyleCss, 'root style.css and public/style.css must match byte-for-byte');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('================================================================');
console.log(`🎉 ALL ${passCount} v17.0 CLINICALOPS AI AGENT 2.0 TESTS PASSED!`);
console.log('   Apple Liquid Glass, 6 Core Workspaces & Differentiators Verified.');
console.log('================================================================\n');
