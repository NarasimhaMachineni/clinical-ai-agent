const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClinicalGPT — Pharma &amp; Biostatistics Intelligence AI</title>
  <link rel="stylesheet" href="style.css?v=3.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="chatgpt-layout">

    <!-- =========================================================
         LEFT SIDEBAR (ChatGPT Style)
         ========================================================= -->
    <aside class="chat-sidebar" id="sidebar">
      <div class="sidebar-top">
        <button class="btn-new-chat" id="btn-new-chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Clinical Chat</span>
        </button>
      </div>

      <!-- General Topics List -->
      <div class="sidebar-section-title">Clinical &amp; Code Tracks</div>
      <div class="chat-history-list" id="history-list">
        <div class="history-item active" data-prompt="Write SAS code for PROC MIXED MMRM model for change from baseline">
          <span class="hist-icon">💻</span>
          <span class="hist-text">SAS 9.4 MMRM &amp; Biostats</span>
        </div>
        <div class="history-item" data-prompt="How to derive ADSL and ADAE in R using pharmaverse admiral package">
          <span class="hist-icon">📦</span>
          <span class="hist-text">R pharmaverse &amp; admiral</span>
        </div>
        <div class="history-item" data-prompt="Explain CDISC SDTM v3.3 domain classes, ISO 8601 rules, and Define-XML 2.1">
          <span class="hist-icon">🧬</span>
          <span class="hist-text">CDISC SDTM &amp; ADaM</span>
        </div>
        <div class="history-item" data-prompt="Explain Pinnacle 21 validation rules and 1-to-1 subject preservation assertions">
          <span class="hist-icon">🔍</span>
          <span class="hist-text">Pinnacle 21 QC Rules</span>
        </div>
        <div class="history-item" data-prompt="Explain MedDRA 5-level hierarchy and WHODrug ATC coding standards">
          <span class="hist-icon">💊</span>
          <span class="hist-text">MedDRA &amp; WHODrug Coding</span>
        </div>
      </div>

      <!-- Quick Code Generation Actions -->
      <div class="sidebar-section-title">Instant Code Generators</div>
      <div class="sidebar-quick-actions">
        <button class="sidebar-action-btn" data-prompt="Write a production SAS macro for PROC COMPARE double programming validation">
          <span class="btn-icon">⚡</span>
          <span>PROC COMPARE Macro</span>
        </button>
        <button class="sidebar-action-btn" data-prompt="Generate R code with rtables for Table 14-1.01 Demographic Summary">
          <span class="btn-icon">📊</span>
          <span>rtables Table 14-1</span>
        </button>
        <button class="sidebar-action-btn" data-prompt="How to perform Kaplan-Meier survival analysis in SAS PROC LIFETEST and R">
          <span class="btn-icon">📈</span>
          <span>Kaplan-Meier Survival</span>
        </button>
      </div>

      <!-- User & Regulatory Footer -->
      <div class="sidebar-footer">
        <div class="user-badge">
          <div class="user-avatar">🧬</div>
          <div class="user-info">
            <strong>Clinical Data Science AI</strong>
            <span class="regulatory-tag">SAS • R • Python • CDISC</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- =========================================================
         MAIN CHAT VIEWPORT
         ========================================================= -->
    <main class="chat-main">
      
      <!-- Top Navigation Header -->
      <header class="chat-header">
        <div class="model-selector-box">
          <span class="model-name">ClinicalGPT</span>
          <span class="model-badge">Pharma &amp; Code AI</span>
          <svg class="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>

        <div class="header-right-pills">
          <div class="study-badge">
            <span class="study-dot"></span>
            <span>Pharma Knowledge Base Active</span>
          </div>
          <button class="btn-header-ghost" id="btn-clear-chat" title="Clear current conversation">Clear Chat</button>
        </div>
      </header>

      <!-- Chat Scrollable Thread -->
      <div class="chat-thread-container" id="chat-thread">
        
        <!-- Welcome Hero View (Shown when chat is empty) -->
        <div class="welcome-hero" id="welcome-hero">
          <div class="hero-logo">🧬</div>
          <h2 class="hero-title">How can I assist with your clinical research today?</h2>
          <p class="hero-subtitle">Production SAS 9.4, R pharmaverse, Python, CDISC SDTM/ADaM, Biostatistics &amp; FDA/EMA Submissions</p>

          <div class="prompt-cards-grid">
            <div class="prompt-card" data-prompt="Write SAS code for PROC MIXED MMRM model for change from baseline">
              <div class="card-top">
                <span class="card-icon">💻</span>
                <strong>SAS 9.4 Biostatistics (MMRM)</strong>
              </div>
              <p>Generate production PROC MIXED model with Kenward-Roger degrees of freedom and LSMEANS.</p>
            </div>

            <div class="prompt-card" data-prompt="How to derive ADSL and ADAE datasets in R using the admiral package">
              <div class="card-top">
                <span class="card-icon">📦</span>
                <strong>R pharmaverse (admiral)</strong>
              </div>
              <p>Derive analysis population flags (SAFFL, ITTFL, PPFL) and treatment-emergent AE flags (TRTEMFL).</p>
            </div>

            <div class="prompt-card" data-prompt="How to perform Kaplan-Meier survival analysis in SAS PROC LIFETEST and R">
              <div class="card-top">
                <span class="card-icon">📈</span>
                <strong>Kaplan-Meier Survival (ADTTE)</strong>
              </div>
              <p>Generate PROC LIFETEST, PROC PHREG hazard ratios, and R survminer curves with risk tables.</p>
            </div>

            <div class="prompt-card" data-prompt="Explain Pinnacle 21 validation rules and 1-to-1 subject preservation between DM and ADSL">
              <div class="card-top">
                <span class="card-icon">🔍</span>
                <strong>Pinnacle 21 &amp; CDISC Rules</strong>
              </div>
              <p>Review validation check rules for SDTM/ADaM compliance and FDA eCTD Module 5 submission.</p>
            </div>
          </div>
        </div>

        <!-- Dynamic Message Stream -->
        <div class="messages-stream" id="messages-stream"></div>
      </div>

      <!-- Bottom Floating Composer Capsule -->
      <footer class="chat-composer-footer">
        <div class="composer-capsule">
          <textarea id="prompt-input" rows="1" placeholder="Ask any question in Pharma (e.g. 'Write SAS PROC MIXED code', 'Derive ADTTE in R', 'Explain MedDRA hierarchy')..."></textarea>

          <button class="btn-send-msg" id="btn-send-msg" title="Send Question">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
        <p class="composer-disclaimer">
          ClinicalGPT operates autonomously across SAS 9.4, R pharmaverse, CDISC SDTM/ADaM, and FDA/EMA biostatistics guidelines.
        </p>
      </footer>

    </main>
  </div>

  <script src="app.js?v=3.0"></script>
</body>
</html>
`;

fs.writeFileSync('public/index.html', htmlContent, 'utf8');
console.log('Successfully updated public/index.html without mock data');
