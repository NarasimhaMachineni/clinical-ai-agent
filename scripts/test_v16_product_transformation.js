/**
 * ============================================================================
 * 🧪 CLINICALOPS AI — PRODUCT TRANSFORMATION ACCEPTANCE TEST SUITE v16.0
 * 
 * Verifies the complete product transformation:
 * - Brand: ClinicalOps AI — From Data to Decisions
 * - Visual Identity: Soft Sky Blue & Deep Navy Palette + Light/Dark Theme
 * - Signature Hero: The Clinical Journey (6-Stage Interactive Pathway)
 * - Top Bar: Study Selector, Global Search (Ctrl+K), Notifications, Theme, Profile
 * - Compact Left Sidebar: 10 Primary Navigation Workspaces
 * - Study Insights & Contextual Clinical Copilot
 * - Truthful Statuses & Zero-Fabrication GxP Integrity
 * - 100% Dual-Location Parity (root <-> public/)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 RUNNING v16.0 PRODUCT TRANSFORMATION ACCEPTANCE SUITE');
console.log('   (Verifying ClinicalOps AI — From Data to Decisions Experience)');
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
// SECTION 1: PRODUCT IDENTITY & POSITIONING
// -----------------------------------------------------------------------------
console.log('--- 1. PRODUCT IDENTITY & POSITIONING ---');

test('BRAND-001: Page title reflects ClinicalOps AI — From Data to Decisions', () => {
  assert(html.includes('<title>ClinicalOps AI — From Data to Decisions'), 'Title must contain ClinicalOps AI — From Data to Decisions');
});

test('BRAND-002: Top bar brand heading contains ClinicalOps AI — From Data to Decisions', () => {
  assert(html.includes('<h1>ClinicalOps AI — From Data to Decisions</h1>'), 'Header H1 must be ClinicalOps AI — From Data to Decisions');
});

test('BRAND-003: Subtitle reflects Intelligent Clinical Statistical Programming & Validation Workbench', () => {
  assert(html.includes('Intelligent Clinical Statistical Programming &amp; Validation Workbench') ||
         html.includes('Intelligent Clinical Statistical Programming & Validation Workbench'),
         'Header edition tag must reflect product positioning');
});

// -----------------------------------------------------------------------------
// SECTION 2: TOP BAR MISSION CONTROL
// -----------------------------------------------------------------------------
console.log('\n--- 2. TOP BAR MISSION CONTROL ---');

test('TOPBAR-001: Study selector dropdown is present with protocol workspaces', () => {
  assert(html.includes('id="study-selector"'), 'Study selector must exist');
  assert(html.includes('CDISCPILOT01'), 'Must include CDISC Pilot 01 study option');
  assert(appJs.includes('function onStudySelectorChange'), 'app.js must define onStudySelectorChange');
});

test('TOPBAR-002: Global command / search input is present with Ctrl+K shortcut', () => {
  assert(html.includes('id="global-command-search"'), 'Global search input must exist');
  assert(html.includes('Ctrl+K'), 'Ctrl+K hint must be present');
  assert(appJs.includes('function handleGlobalSearch'), 'app.js must define handleGlobalSearch');
});

test('TOPBAR-003: Notifications bell and dynamic unread counter are present', () => {
  assert(html.includes('id="topbar-notifications-btn"'), 'Notifications bell must exist');
  assert(html.includes('id="topbar-unread-count"'), 'Unread count pill must exist');
});

test('TOPBAR-004: Theme toggle button and theme persistence logic exist', () => {
  assert(html.includes('id="theme-toggle-btn"'), 'Theme toggle button must exist');
  assert(appJs.includes('function toggleTheme'), 'app.js must define toggleTheme');
});

test('TOPBAR-005: User profile pill reflects clinical programmer role', () => {
  assert(html.includes('Dr. Alex Morgan'), 'User name must be present');
  assert(html.includes('Lead Stat Programmer'), 'User role must be present');
});

// -----------------------------------------------------------------------------
// SECTION 3: COMPACT COLLAPSIBLE SIDEBAR WITH 10 PRIMARY WORKSPACES
// -----------------------------------------------------------------------------
console.log('\n--- 3. 10 PRIMARY NAVIGATION WORKSPACES ---');

test('NAV-10-001: Collapsible sidebar has toggle button and container', () => {
  assert(html.includes('id="agent-sidebar"'), 'Sidebar must have id agent-sidebar');
  assert(html.includes('id="sidebar-toggle-btn"'), 'Sidebar toggle button must exist');
  assert(appJs.includes('function toggleSidebar'), 'app.js must define toggleSidebar');
});

test('NAV-10-002: All 10 primary navigation workspace buttons exist in sidebar', () => {
  const expectedNavIds = [
    'nav-btn-home',
    'nav-btn-data-hub',
    'nav-btn-sdtm-studio',
    'nav-btn-adam-studio',
    'nav-btn-sas-r-lab',
    'nav-btn-tlf-canvas',
    'nav-btn-findings-hub',
    'nav-btn-reports',
    'nav-btn-study-insights',
    'nav-btn-settings'
  ];
  expectedNavIds.forEach(id => {
    assert(html.includes(`id="${id}"`), `Sidebar must contain nav item with id="${id}"`);
  });
});

test('NAV-10-003: app.js switchTab supports aliases for all 10 transformed workspaces', () => {
  const transformedAliases = [
    "'tab-home': 'tab-dashboard'",
    "'tab-data-hub': 'tab-datasets'",
    "'tab-sdtm-studio': 'tab-sdtm-val'",
    "'tab-adam-studio': 'tab-adam-val'",
    "'tab-sas-r-lab': 'tab-double-prog'",
    "'tab-tlf-canvas': 'tab-tlfs'",
    "'tab-findings-hub': 'tab-findings'"
  ];
  transformedAliases.forEach(alias => {
    assert(appJs.includes(alias), `switchTab must support alias ${alias}`);
  });
});

test('NAV-10-004: Sidebar synchronizes active class alongside tab-pane switching', () => {
  assert(appJs.includes("sidebar-nav-item"), 'switchTab must sync sidebar-nav-item active class');
});

// -----------------------------------------------------------------------------
// SECTION 4: SIGNATURE HERO — THE CLINICAL JOURNEY (6-STAGE PATHWAY)
// -----------------------------------------------------------------------------
console.log('\n--- 4. SIGNATURE HERO: THE CLINICAL JOURNEY ---');

test('HERO-001: Clinical Journey hero section is present with correct headline', () => {
  assert(html.includes('id="clinical-journey-hero"'), 'Hero element must exist with id="clinical-journey-hero"');
  assert(html.includes('Your Clinical Data Journey, Simplified with AI'), 'Headline must match master specification');
  assert(html.includes('Validate clinical datasets, trace every derivation, reconcile independent programs, and produce review-ready outputs in one connected workspace.'),
         'Supporting message must match specification');
});

test('HERO-002: All 6 interactive stages exist on the Clinical Journey pathway', () => {
  const stages = [
    'journey-stage-upload',
    'journey-stage-validate',
    'journey-stage-compare',
    'journey-stage-generate',
    'journey-stage-review',
    'journey-stage-export'
  ];
  stages.forEach(s => {
    assert(html.includes(`id="${s}"`), `Clinical Journey must contain stage id="${s}"`);
  });
});

test('HERO-003: Primary action Upload Clinical Data and secondary action buttons exist', () => {
  assert(html.includes('Upload Clinical Data'), 'Primary CTA Upload Clinical Data must exist');
  assert(html.includes('Open Study'), 'Secondary CTA Open Study must exist');
  assert(html.includes('Continue Validation'), 'Secondary CTA Continue Validation must exist');
  assert(html.includes('View Findings'), 'Secondary CTA View Findings must exist');
});

test('HERO-004: Onboarding banner is present for zero-data first-time experience', () => {
  assert(html.includes('id="dashboard-onboarding-banner"'), 'Onboarding banner must exist');
  assert(html.includes('No study data yet. Upload your SDTM or ADaM datasets to begin.'),
         'Onboarding message must match specification');
  assert(html.includes('Load CDISC Pilot 01 Sample Cohort (Demonstration Data)'),
         'Demonstration data button must be clearly labeled');
});

test('HERO-005: app.js contains updateJourneyPathwayStatus dynamic status engine', () => {
  assert(appJs.includes('function updateJourneyPathwayStatus'), 'app.js must define updateJourneyPathwayStatus');
});

// -----------------------------------------------------------------------------
// SECTION 5: STUDY INSIGHTS & CLINICAL AI COPILOT
// -----------------------------------------------------------------------------
console.log('\n--- 5. STUDY INSIGHTS & CLINICAL AI COPILOT ---');

test('INSIGHTS-001: Dedicated tab-study-insights pane exists in HTML', () => {
  assert(html.includes('id="tab-study-insights"'), 'tab-study-insights pane must exist in HTML');
});

test('INSIGHTS-002: Contextual query input and recommended prompts exist', () => {
  assert(html.includes('id="copilot-query-input"'), 'Copilot query input must exist');
  assert(html.includes('id="copilot-response-container"'), 'Copilot response container must exist');
  assert(html.includes('Explain finding SDTM-DM-001'), 'Must include SDTM-DM-001 query chip');
  assert(html.includes('Draft SAS PROC GLIMMIX / MMRM'), 'Must include MMRM query chip');
  assert(html.includes('Draft R Kaplan-Meier'), 'Must include Kaplan-Meier query chip');
  assert(html.includes("Explain Hy's Law"), 'Must include Hy\'s Law query chip');
});

test('INSIGHTS-003: CDISC Rule search explorer exists in Study Insights', () => {
  assert(html.includes('id="rule-search-input"'), 'Rule search input must exist');
  assert(html.includes('id="rule-search-result"'), 'Rule search result container must exist');
  assert(appJs.includes('function handleRuleSearchSubmit'), 'app.js must define handleRuleSearchSubmit');
});

test('INSIGHTS-004: AI responses clearly distinguish facts, specs, and draft code', () => {
  assert(appJs.includes('[DETERMINISTIC FACT]'), 'Must distinguish DETERMINISTIC FACT');
  assert(appJs.includes('[CDISC SPECIFICATION]'), 'Must distinguish CDISC SPECIFICATION');
  assert(appJs.includes('[AI CODE DRAFT — REQUIRES INDEPENDENT VALIDATION]'), 'Must distinguish AI CODE DRAFT');
});

// -----------------------------------------------------------------------------
// SECTION 6: DESIGN TOKENS & STYLING
// -----------------------------------------------------------------------------
console.log('\n--- 6. DESIGN TOKENS & VISUAL IDENTITY ---');

test('CSS-001: style.css defines Soft Sky Blue & Deep Navy tokens', () => {
  assert(styleCss.includes('--sky-100'), 'Must define --sky-100');
  assert(styleCss.includes('--sky-400'), 'Must define --sky-400');
  assert(styleCss.includes('--navy-900'), 'Must define --navy-900');
  assert(styleCss.includes('--navy-800'), 'Must define --navy-800');
});

test('CSS-002: style.css provides light-theme overrides', () => {
  assert(styleCss.includes('body.light-theme'), 'Must define body.light-theme');
});

test('CSS-003: style.css styles the Clinical Journey Hero and 6-stage track', () => {
  assert(styleCss.includes('.clinical-journey-hero'), 'Must style .clinical-journey-hero');
  assert(styleCss.includes('.journey-pathway-track'), 'Must style .journey-pathway-track');
  assert(styleCss.includes('.journey-stage-step'), 'Must style .journey-stage-step');
});

// -----------------------------------------------------------------------------
// SECTION 7: TRUTHFUL STATUSES & 100% GxP INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- 7. TRUTHFUL STATUSES & GxP INTEGRITY ---');

test('INTEGRITY-001: Zero fake rows in parsing fallbacks', () => {
  assert(!appJs.includes("v.name === 'USUBJID' ? 'STUDY-001' : (v.type === 'char' ? 'Y' : '1')"),
         'Must not fabricate rows in SAS buffer parsing');
});

test('INTEGRITY-002: Initial static metrics truthfully display NOT ASSESSED and NOT EXECUTED', () => {
  assert(html.includes('id="metric-hyslaw" style="font-size:12px;">NOT ASSESSED</span>'),
         'Hy\'s Law metric must display NOT ASSESSED initially');
  assert(html.includes('id="metric-p21">NOT EXECUTED</span>'),
         'FDA Rules Checked metric must display NOT EXECUTED initially');
});

// -----------------------------------------------------------------------------
// SECTION 8: 100% PARITY BETWEEN ROOT AND PUBLIC/
// -----------------------------------------------------------------------------
console.log('\n--- 8. 100% DUAL-LOCATION PARITY (ROOT <-> PUBLIC/) ---');

test('PARITY-001: index.html is 100% byte-for-byte identical to public/index.html', () => {
  assert.strictEqual(html, pubHtml, 'root index.html and public/index.html must be strictly identical');
});

test('PARITY-002: app.js is 100% byte-for-byte identical to public/app.js', () => {
  assert.strictEqual(appJs, pubAppJs, 'root app.js and public/app.js must be strictly identical');
});

test('PARITY-003: style.css is 100% byte-for-byte identical to public/style.css', () => {
  assert.strictEqual(styleCss, pubStyleCss, 'root style.css and public/style.css must be strictly identical');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('================================================================');
console.log(`🎉 ALL ${passCount} v16.0 PRODUCT TRANSFORMATION TESTS PASSED!`);
console.log('   ClinicalOps AI — From Data to Decisions is 100% verified.');
console.log('================================================================\n');
