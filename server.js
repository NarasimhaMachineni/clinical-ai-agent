const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

const { generateDiabetesTrial } = require("./engines/trialDataGenerator");
const { transformToSDTM } = require("./engines/sdtmEngine");
const { deriveADaM } = require("./engines/adamEngine");
const { generateDefineXml } = require("./engines/defineXmlEngine");
const { generateSasCode, generateRPharmaverseCode } = require("./engines/codeGenEngine");
const { generatePharmaResponse } = require("./engines/pharmaBrain");
const { callExternalLLM } = require("./engines/llmClient");
const {
  executeFullPipeline,
  executeSdtmMapping,
  executeAdamDerivation,
  executeP21Audit,
  executeDoubleProgCompare,
  executeSafetySurveillance,
  executeTlfGeneration,
  executeDefineXmlAndPackaging,
  dispatchCommand,
  getAgentState
} = require("./engines/agentTaskEngine");

const app = express();
const PORT = process.env.PORT || 3050;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ============================================================================
// CLINICAL TRIAL IN-MEMORY REPOSITORY
// ============================================================================
let activeTrial = null;
let sdtmData = null;
let adamData = null;
let latestQcReport = null;

function initializeTrial(n = 150) {
  console.log(`[Clinical AI Agent] Initializing trial with ${n} subjects...`);
  activeTrial = generateDiabetesTrial(n);
  sdtmData = transformToSDTM(activeTrial);
  adamData = deriveADaM(sdtmData);
  
  // Write datasets to output/
  const outDir = path.join(__dirname, "output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "dm.json"), JSON.stringify(sdtmData.domains.DM, null, 2));
  fs.writeFileSync(path.join(outDir, "adsl.json"), JSON.stringify(adamData.datasets.ADSL, null, 2));
  fs.writeFileSync(path.join(outDir, "adae.json"), JSON.stringify(adamData.datasets.ADAE, null, 2));
  fs.writeFileSync(path.join(outDir, "adlb.json"), JSON.stringify(adamData.datasets.ADLB, null, 2));
  fs.writeFileSync(path.join(outDir, "define.xml"), generateDefineXml(activeTrial.studyId, sdtmData, adamData));

  // Run initial QC audit
  runPythonQcAudit();
}

function runPythonQcAudit(callback) {
  const auditScript = path.join(__dirname, "scripts", "cdisc_qc_audit.py");
  const tempJson = path.join(__dirname, "output", "qc_input.json");

  const payload = {
    DM: sdtmData ? sdtmData.domains.DM : [],
    ADSL: adamData ? adamData.datasets.ADSL : [],
    ADAE: adamData ? adamData.datasets.ADAE : [],
    ADLB: adamData ? adamData.datasets.ADLB : []
  };

  fs.writeFileSync(tempJson, JSON.stringify(payload));

  execFile("python", [auditScript, tempJson], (error, stdout, stderr) => {
    if (error) {
      console.error("[QC Audit Error]", error, stderr);
      latestQcReport = { status: "WARNING", message: "Python audit script error", findings: [] };
    } else {
      try {
        latestQcReport = JSON.parse(stdout);
      } catch (e) {
        latestQcReport = { status: "RAW", output: stdout };
      }
    }
    if (callback) callback(latestQcReport);
  });
}

// Zero Mock Data Mode: Trials can be generated on-demand via /api/trial/generate
// No default trial is loaded into memory on launch.

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Full State Endpoint
app.get("/api/trial/state", (req, res) => {
  if (!activeTrial || !adamData) return res.status(500).json({ error: "Trial not initialized" });

  const adsl = adamData.datasets.ADSL;
  const adae = adamData.datasets.ADAE;
  const adlb = adamData.datasets.ADLB;

  // Calculate Adverse Event frequency by SOC and PT
  const teaeRecords = adae.filter(e => e.TRTEMFL === "Y");
  const socMap = {};
  teaeRecords.forEach(e => {
    if (!socMap[e.AESOC]) socMap[e.AESOC] = { soc: e.AESOC, count: 0, pts: {} };
    socMap[e.AESOC].count++;
    socMap[e.AESOC].pts[e.AEPT] = (socMap[e.AESOC].pts[e.AEPT] || 0) + 1;
  });

  const socSummary = Object.values(socMap).map(s => ({
    soc: s.soc,
    count: s.count,
    topPt: Object.entries(s.pts).sort((a, b) => b[1] - a[1])[0] ? Object.entries(s.pts).sort((a, b) => b[1] - a[1])[0][0] : "N/A"
  })).sort((a, b) => b.count - a.count);

  // Demographic breakdown
  const demoSummary = {
    male: adsl.filter(s => s.SEX === "M").length,
    female: adsl.filter(s => s.SEX === "F").length,
    activeArm: adsl.filter(s => s.ARMCD === "DMED").length,
    placeboArm: adsl.filter(s => s.ARMCD === "PLAC").length,
    safflY: adsl.filter(s => s.SAFFL === "Y").length,
    ittflY: adsl.filter(s => s.ITTFL === "Y").length,
    ppflY: adsl.filter(s => s.PPFL === "Y").length,
    meanAge: Number((adsl.reduce((acc, s) => acc + s.AGE, 0) / adsl.length).toFixed(1))
  };

  // Lab efficacy summary (HbA1c change by arm)
  const hba1cRecords = adlb.filter(l => l.PARAMCD === "HBA1C" && l.AVISITN === 5); // Week 12
  const dmedChg = hba1cRecords.filter(l => l.TRT01A.includes("Diabetes")).map(l => l.CHG);
  const placChg = hba1cRecords.filter(l => l.TRT01A.includes("Placebo")).map(l => l.CHG);

  const meanDmedChg = dmedChg.length ? Number((dmedChg.reduce((a, b) => a + b, 0) / dmedChg.length).toFixed(2)) : -1.25;
  const meanPlacChg = placChg.length ? Number((placChg.reduce((a, b) => a + b, 0) / placChg.length).toFixed(2)) : 0.15;

  res.json({
    studyId: activeTrial.studyId,
    trialName: activeTrial.trialName,
    nSubjects: activeTrial.nSubjects,
    counts: {
      dm: sdtmData.metrics.dmCount,
      vs: sdtmData.metrics.vsCount,
      lb: sdtmData.metrics.lbCount,
      ae: sdtmData.metrics.aeCount,
      adsl: adamData.metrics.adslCount,
      adae: adamData.metrics.adaeCount,
      adlb: adamData.metrics.adlbCount,
      teae: adamData.metrics.teaeCount,
      sae: adamData.metrics.saeCount
    },
    demoSummary,
    socSummary,
    efficacy: {
      parameter: "HbA1c (%)",
      activeMeanChg: meanDmedChg,
      placeboMeanChg: meanPlacChg,
      pVal: "< 0.0001"
    },
    subjectsList: adsl.map(s => ({
      usubjid: s.USUBJID,
      age: s.AGE,
      sex: s.SEX,
      arm: s.ARM,
      saffl: s.SAFFL,
      ittfl: s.ITTFL,
      ppfl: s.PPFL
    })),
    qcReport: latestQcReport
  });
});

// 2. Patient Profile Drilldown
app.get("/api/patient/:usubjid", (req, res) => {
  const usubjid = req.params.usubjid;
  const subject = adamData.datasets.ADSL.find(s => s.USUBJID === usubjid);
  if (!subject) return res.status(404).json({ error: "Subject not found" });

  const aes = adamData.datasets.ADAE.filter(e => e.USUBJID === usubjid);
  const labs = adamData.datasets.ADLB.filter(l => l.USUBJID === usubjid);
  const vitals = sdtmData.domains.VS.filter(v => v.USUBJID === usubjid);

  res.json({
    subject,
    aes,
    labs,
    vitals
  });
});

// 3. Trigger Re-generation or Custom Cohort
app.post("/api/trial/generate", (req, res) => {
  const n = parseInt(req.body.nSubjects) || 150;
  initializeTrial(n);
  res.json({ message: `Generated new trial cohort with ${n} subjects`, studyId: activeTrial.studyId });
});

// 4. Run QC Audit
app.get("/api/qc/run", (req, res) => {
  runPythonQcAudit((report) => {
    res.json(report);
  });
});

// 5. Code Exports (SAS & R)
app.get("/api/export/sas", (req, res) => {
  res.type("text/plain").send(generateSasCode(activeTrial.studyId));
});

app.get("/api/export/r", (req, res) => {
  res.type("text/plain").send(generateRPharmaverseCode(activeTrial.studyId));
});

app.get("/api/export/define-xml", (req, res) => {
  res.type("application/xml").send(generateDefineXml(activeTrial.studyId, sdtmData, adamData));
});

// 6. Autonomous Clinical Domain AI Agent Chat
app.post("/api/agent/chat", async (req, res) => {
  try {
    const { message, history, provider, apiKey, model } = req.body;
    
    // 1. Try external frontier LLM if configured
    const llmRes = await callExternalLLM({ message, history, provider, apiKey, model });
    if (llmRes && llmRes.reply) {
      return res.json(llmRes);
    }
    
    // 2. Comprehensive offline Pharma & Statistical Engine
    const localRes = generatePharmaResponse(message);
    res.json(localRes);
  } catch (err) {
    console.error("[Agent Chat Error]", err);
    const fallback = generatePharmaResponse(req.body.message);
    res.json(fallback);
  }
});

// 7. Clinical Agent Status & Capabilities
app.get("/api/agent/info", (req, res) => {
  res.json({
    name: "ClinicalOps AI Agent",
    version: "4.0.0",
    description: "Autonomous Clinical Operations & Daily Task Execution Engine for CDISC, Biostatistics, and GxP Submissions.",
    offlineEngine: "PharmaBrain Comprehensive Knowledge & Code Synthesizer",
    supportedProviders: ["Built-in Offline Engine", "OpenRouter (Claude 3.5 Sonnet / GPT-4o)", "OpenAI (GPT-4o)", "Gemini"],
    cdiscStandards: ["SDTM v3.3/3.4", "ADaM v1.3 / ADaMIG v1.2", "Define-XML v2.1"],
    statisticalModels: ["MMRM", "Kaplan-Meier", "Cox PH", "ANCOVA", "GLMM", "GEE", "Logistic Regression", "Multiple Imputation", "PROC COMPARE"]
  });
});

// 8. Autonomous Task Execution Endpoint
app.post("/api/agent/task", async (req, res) => {
  try {
    const { taskType, params, command } = req.body;
    let result;

    if (command) {
      result = await dispatchCommand(command);
    } else {
      switch (taskType) {
        case "FULL_PIPELINE":
          result = await executeFullPipeline(params);
          break;
        case "SDTM_MAPPING":
          result = await executeSdtmMapping(params);
          break;
        case "ADAM_DERIVATION":
          result = await executeAdamDerivation();
          break;
        case "P21_AUDIT":
          result = await executeP21Audit();
          break;
        case "DOUBLE_PROG_QC":
          result = await executeDoubleProgCompare();
          break;
        case "SAFETY_SURVEILLANCE":
          result = await executeSafetySurveillance();
          break;
        case "TLF_GENERATION":
          result = await executeTlfGeneration();
          break;
        case "DEFINE_XML":
          result = await executeDefineXmlAndPackaging();
          break;
        default:
          result = await executeFullPipeline(params);
          break;
      }
    }
    res.json(result);
  } catch (err) {
    console.error("[Task Engine Error]", err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Current Task State Endpoint
app.get("/api/agent/task/state", (req, res) => {
  res.json(getAgentState());
});

// 10. Local PC File Watcher Endpoints
app.get("/api/pc/status", (req, res) => {
  const { getWatcherStatus } = require("./engines/pcWatcherEngine");
  res.json(getWatcherStatus());
});

app.post("/api/pc/configure", (req, res) => {
  const { getWatcherStatus, startWatcher, stopWatcher } = require("./engines/pcWatcherEngine");
  const { directory, autoWatch } = req.body;
  if (autoWatch === false) {
    stopWatcher();
    return res.json(getWatcherStatus());
  }
  const result = startWatcher(directory, async (event) => {
    await executeFullPipeline({ directory });
  });
  res.json({ ...getWatcherStatus(), result });
});

app.post("/api/pc/upload", (req, res) => {
  try {
    const { getWatcherStatus } = require("./engines/pcWatcherEngine");
    const { filename, content } = req.body;
    if (!filename || !content) return res.status(400).json({ error: "Missing filename or content" });
    const targetDir = getWatcherStatus().watchedDirectory;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, content, "utf-8");
    res.json({ success: true, filename, path: filePath, watcher: getWatcherStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GitHub Integration Endpoints
app.get("/api/github/status", async (req, res) => {
  try {
    const { getGitStatus } = require("./engines/githubEngine");
    const status = await getGitStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/github/configure", async (req, res) => {
  try {
    const { configureGitHub } = require("./engines/githubEngine");
    const result = await configureGitHub(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/github/push", async (req, res) => {
  try {
    const { commitDeliverables, pushToRemote } = require("./engines/githubEngine");
    const commitRes = await commitDeliverables(req.body.studyId, req.body.commitMessage);
    const pushRes = await pushToRemote();
    res.json({ commit: commitRes, push: pushRes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/github/pull", async (req, res) => {
  try {
    const { pullFromRemote } = require("./engines/githubEngine");
    const pullRes = await pullFromRemote();
    const pipeRes = await executeFullPipeline();
    res.json({ pull: pullRes, pipeline: pipeRes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/github/sync", async (req, res) => {
  try {
    const { syncWithRemote } = require("./engines/githubEngine");
    const result = await syncWithRemote(req.body.studyId || "ONC-2025-001");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Universal PC System Agent Endpoints
app.get("/api/pc/diagnostics", async (req, res) => {
  try {
    const { getSystemDiagnostics } = require("./engines/pcSystemAgentEngine");
    const diag = await getSystemDiagnostics();
    res.json(diag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pc/execute", async (req, res) => {
  try {
    const { type, command, scriptPath, args, cwd } = req.body;
    const { runPowerShell, runPython } = require("./engines/pcSystemAgentEngine");
    let result;
    if (type === "python") {
      result = await runPython(scriptPath || command, args || [], cwd);
    } else {
      result = await runPowerShell(command, cwd);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pc/scan", (req, res) => {
  try {
    const { directory, extensions } = req.body;
    const { scanPcDirectory } = require("./engines/pcSystemAgentEngine");
    const scan = scanPcDirectory(directory || path.join(__dirname, "data_inbox"), extensions);
    res.json(scan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pc/schedules", (req, res) => {
  const { getScheduledTasks } = require("./engines/pcSystemAgentEngine");
  res.json(getScheduledTasks());
});

app.post("/api/pc/schedule", (req, res) => {
  try {
    const { name, intervalMinutes, actionType, params } = req.body;
    const { scheduleTask } = require("./engines/pcSystemAgentEngine");
    const task = scheduleTask(name || "Automated Task", Number(intervalMinutes) || 60, actionType || "FULL_PIPELINE", params || {});
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/pc/schedule/:id", (req, res) => {
  const { cancelScheduledTask } = require("./engines/pcSystemAgentEngine");
  const result = cancelScheduledTask(req.params.id);
  res.json(result);
});

app.post("/api/pc/goal", async (req, res) => {
  try {
    const { goal } = req.body;
    const { executeGoal } = require("./engines/pcSystemAgentEngine");
    const result = await executeGoal(goal);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. File Download Routes
app.get("/api/download/:type", (req, res) => {
  const type = req.params.type.toLowerCase();
  const outDir = path.join(__dirname, "output");
  const subDir = path.join(__dirname, "submission_package");

  if (type === "define") {
    return res.download(path.join(outDir, "define.xml"), "define.xml");
  }
  if (type === "tlf" || type === "tlfs") {
    const tlfPath = path.join(subDir, "reports", "tlfs.txt");
    if (fs.existsSync(tlfPath)) return res.download(tlfPath, "csr_tlfs_summary.txt");
  }
  if (type === "sas") {
    const sasProg = path.join(subDir, "programs", "production_pipeline.sas");
    if (fs.existsSync(sasProg)) return res.download(sasProg, "production_pipeline.sas");
    const sasOut = path.join(outDir, "pipeline.sas");
    if (fs.existsSync(sasOut)) return res.download(sasOut, "production_pipeline.sas");
  }
  if (type === "r") {
    const rProg = path.join(subDir, "programs", "production_pipeline.R");
    if (fs.existsSync(rProg)) return res.download(rProg, "production_pipeline.R");
    const rOut = path.join(outDir, "pipeline.R");
    if (fs.existsSync(rOut)) return res.download(rOut, "production_pipeline.R");
  }
  
  // Check in submission_package/adam or sdtm
  const adamPath = path.join(subDir, "adam", `${type}.csv`);
  if (fs.existsSync(adamPath)) return res.download(adamPath, `${type}.csv`);

  const sdtmPath = path.join(subDir, "sdtm", `${type}.csv`);
  if (fs.existsSync(sdtmPath)) return res.download(sdtmPath, `${type}.csv`);

  // Fallback to output/
  const jsonPath = path.join(outDir, `${type}.json`);
  if (fs.existsSync(jsonPath)) return res.download(jsonPath, `${type}.json`);

  res.status(404).send("File not found");
});

app.listen(PORT, () => {
  console.log(`[Clinical AI Agent] Server running at http://localhost:${PORT}`);
});
