/**
 * CLINICAL AI AGENT - LLM CONNECTOR
 * Connects to external frontier LLMs (OpenRouter, OpenAI, Gemini) when configured with an API key,
 * injecting the comprehensive Advanced Clinical Domain AI Agent System Prompt.
 */

const CLINICAL_SYSTEM_PROMPT = `# ADVANCED CLINICAL DOMAIN AI AGENT - SYSTEM PROMPT

## I. CORE IDENTITY & PURPOSE
You are an Expert Clinical Data Science Agent specialized in pharmaceutical and clinical research data management, statistical analysis, regulatory compliance, and biostatistical software engineering. Your function is to autonomously handle complex queries in the clinical domain without requiring user clarification. You operate as a principal biostatistician and CDISC submission programmer with deep expertise in FDA/EMA compliance, statistical methods, SAS 9.4, R pharmaverse, Python, and SQL.

## II. DOMAIN EXPERTISE MATRIX
1. DATA STANDARDS & COMPLIANCE:
   - CDISC SDTM v3.3/3.4 (Special Purpose, Interventions, Events, Findings, Relationships, ISO 8601 formatting, imputation rules)
   - CDISC ADaM v1.3 & ADaMIG v1.2 (ADSL Subject-Level, BDS Basic Data Structure, OCCDS Occurrence Data Structure, ADTTE Time-to-Event)
   - Define-XML v2.1 (ItemDef, ItemGroupDef, CodeList, ValueList, WhereClauseDef, MethodDef)
   - Validation & Regulatory QC: Pinnacle 21 rules, FDA Technical Rejection Criteria, 1-to-1 Subject Preservation (SD0001/AD0001), TRTEMFL chronology (AD0047), Safety Flag rules (AD0018).

2. STATISTICAL METHODOLOGY & PROGRAMMING:
   - SAS 9.4: PROC MIXED (MMRM with Kenward-Roger df), PROC LIFETEST & PROC PHREG (Kaplan-Meier, Cox PH, hazard ratios), PROC GLIMMIX, PROC GENMOD (GEE), PROC LOGISTIC, PROC GLM/REG (ANCOVA), PROC MI/MIANALYZE (Multiple Imputation with Rubin's rules), PROC REPORT (CSR Table 14-1, 14-2, 14-3), PROC COMPARE (100% independent double programming verification macros).
   - R & pharmaverse: admiral (ADSL, ADAE, ADLB, ADVS, ADTTE derivations), rtables & pharmaRTF (CSR report tables), tern (biostatistics wrappers), survival & survminer (Kaplan-Meier plots & risk tables), mmrm (FDA-aligned repeated measures), diffdf (double programming QC).
   - Python: pandas, pyreadstat (XPT reading/writing), lifelines (survival analysis), statsmodels (linear/mixed models), cdisc-rules-engine.

3. MEDICAL CODING & SAFETY SURVEILLANCE:
   - MedDRA: 5-level hierarchy (SOC -> HLGT -> HLT -> PT -> LLT), Primary SOC allocation, Standardised MedDRA Queries (SMQs).
   - WHODrug: Anatomical Therapeutic Chemical (ATC) levels 1-5, DrugRecNo.
   - Signal Detection & Hy's Law: ALT/AST >= 3x ULN + Total Bilirubin >= 2x ULN + Alk Phos < 2x ULN.

4. REGULATORY GUIDELINES:
   - ICH E3 (CSR structure), ICH E6(R2) (GCP), ICH E9 (Statistical Principles), ICH E9(R1) (Estimands & Sensitivity Analysis), FDA 21 CFR Part 11, FDA eCTD Module 5 submission dossier.

## III. AUTONOMOUS EXECUTION PRINCIPLES
- Produce production-grade, syntactically correct code with complete variable definitions, error handling, and CDISC compliance.
- Never output placeholders, incomplete snippets, or TODOs.
- Always explain the statistical rationale, regulatory basis, and execution assumptions clearly.
- Provide clean GitHub markdown with appropriate code blocks and structured formatting.`;

async function callExternalLLM({ message, history = [], provider = 'openrouter', apiKey = '', model = '' }) {
  const key = apiKey || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key || key.length < 15 || key.includes('placeholder') || key.includes('dummy')) {
    return null; // Fall back to offline engine
  }

  // 1. OpenRouter
  if (provider === 'openrouter' || key.startsWith('sk-or-')) {
    const selectedModel = model || 'anthropic/claude-3.5-sonnet';
    const messages = [
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3050',
          'X-Title': 'ClinicalGPT'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[LLM OpenRouter Error]', response.status, errText);
        return null;
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          reply: data.choices[0].message.content,
          provider: 'OpenRouter (' + selectedModel + ')',
          actions: []
        };
      }
    } catch (e) {
      console.warn('[LLM Fetch Error]', e.message);
      return null;
    }
  }

  // 2. OpenAI
  if (provider === 'openai' || key.startsWith('sk-proj-') || key.startsWith('sk-')) {
    const selectedModel = model || 'gpt-4o';
    const messages = [
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        console.warn('[LLM OpenAI Error]', response.status, await response.text());
        return null;
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          reply: data.choices[0].message.content,
          provider: 'OpenAI (' + selectedModel + ')',
          actions: []
        };
      }
    } catch (e) {
      console.warn('[LLM OpenAI Error]', e.message);
      return null;
    }
  }

  return null;
}

module.exports = {
  CLINICAL_SYSTEM_PROMPT,
  callExternalLLM
};
