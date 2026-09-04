/**
 * GitHub Integration Engine for Clinical AI Agent
 * Manages version control, automated GxP submission commits, pulling raw datasets,
 * and pushing CDISC deliverables to GitHub.
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const WORKSPACE_DIR = path.join(__dirname, '..');

let githubConfig = {
  enabled: true,
  repoUrl: 'https://github.com/NarasimhaMachineni/clinical-ai-agent.git',
  branch: 'main',
  token: '',
  autoPushOnTaskComplete: true
};

function runGit(args, cwd = WORKSPACE_DIR) {
  return new Promise((resolve) => {
    execFile('git', args, { cwd }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        code: error ? error.code : 0,
        stdout: stdout ? stdout.trim() : '',
        stderr: stderr ? stderr.trim() : ''
      });
    });
  });
}

/**
 * Initialize repository if not already a git repository
 */
async function ensureGitRepo() {
  const gitDir = path.join(WORKSPACE_DIR, '.git');
  if (!fs.existsSync(gitDir)) {
    const initRes = await runGit(['init']);
    // Setup standard gitignore if missing
    const gitignorePath = path.join(WORKSPACE_DIR, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, 'node_modules/\n.env\n*.tmp\n');
    }
    return initRes;
  }
  return { success: true, message: 'Repository already initialized' };
}

/**
 * Get comprehensive Git status
 */
async function getGitStatus() {
  await ensureGitRepo();
  const branchRes = await runGit(['branch', '--show-current']);
  const statusRes = await runGit(['status', '--short']);
  const remoteRes = await runGit(['remote', '-v']);
  const logRes = await runGit(['log', '-1', '--oneline']);

  const currentBranch = branchRes.stdout || 'main';
  const hasChanges = statusRes.stdout.length > 0;
  const remotes = remoteRes.stdout ? remoteRes.stdout.split('\n') : [];
  const originRemote = remotes.find(r => r.includes('origin')) || '';

  return {
    isGitRepo: true,
    branch: currentBranch,
    hasUncommittedChanges: hasChanges,
    changedFilesCount: statusRes.stdout ? statusRes.stdout.split('\n').filter(Boolean).length : 0,
    remote: originRemote,
    lastCommit: logRes.stdout || 'No commits yet',
    config: {
      repoUrl: githubConfig.repoUrl,
      branch: githubConfig.branch,
      autoPush: githubConfig.autoPushOnTaskComplete,
      hasToken: Boolean(githubConfig.token)
    }
  };
}

/**
 * Configure GitHub remote, branch, and credentials
 */
async function configureGitHub(config) {
  if (config.repoUrl) githubConfig.repoUrl = config.repoUrl;
  if (config.branch) githubConfig.branch = config.branch;
  if (config.token !== undefined) githubConfig.token = config.token;
  if (config.autoPush !== undefined) githubConfig.autoPushOnTaskComplete = Boolean(config.autoPush);

  await ensureGitRepo();

  if (githubConfig.repoUrl) {
    // Add or set remote origin
    const remoteCheck = await runGit(['remote']);
    if (remoteCheck.stdout.includes('origin')) {
      await runGit(['remote', 'set-url', 'origin', githubConfig.repoUrl]);
    } else {
      await runGit(['remote', 'add', 'origin', githubConfig.repoUrl]);
    }
  }

  return { success: true, config: githubConfig };
}

/**
 * Automatically commit all deliverables and data files
 */
async function commitDeliverables(studyId = 'STUDY', commitMsg = null) {
  await ensureGitRepo();

  // Add specific deliverables and inbox
  await runGit(['add', 'submission_package', 'output', 'data_inbox']);

  const msg = commitMsg || `[CDISC-GxP] Automated Daily Task Run: ${studyId} - ${new Date().toISOString()}`;
  const commitRes = await runGit(['commit', '-m', msg]);

  let pushRes = null;
  if (githubConfig.autoPushOnTaskComplete && githubConfig.repoUrl) {
    pushRes = await pushToRemote();
  }

  return {
    success: commitRes.success,
    message: commitRes.stdout || commitRes.stderr,
    pushResult: pushRes
  };
}

/**
 * Push to remote GitHub repository
 */
async function pushToRemote() {
  const branch = githubConfig.branch || 'main';
  let pushTarget = 'origin';

  if (githubConfig.token && githubConfig.repoUrl && githubConfig.repoUrl.startsWith('https://')) {
    pushTarget = githubConfig.repoUrl.replace('https://', `https://${encodeURIComponent(githubConfig.token)}@`);
  }

  const res = await runGit(['push', pushTarget, `HEAD:${branch}`]);
  return {
    success: res.success,
    output: res.stdout || res.stderr
  };
}

/**
 * Pull latest data or code from GitHub
 */
async function pullFromRemote() {
  const branch = githubConfig.branch || 'main';
  let pullTarget = 'origin';

  if (githubConfig.token && githubConfig.repoUrl && githubConfig.repoUrl.startsWith('https://')) {
    pullTarget = githubConfig.repoUrl.replace('https://', `https://${encodeURIComponent(githubConfig.token)}@`);
  }

  const res = await runGit(['pull', pullTarget, branch]);
  return {
    success: res.success,
    output: res.stdout || res.stderr
  };
}

/**
 * Complete Bidirectional Live Git Sync: Pull, Add All, GxP Commit, Push
 */
async function syncWithRemote(studyId = 'STUDY') {
  await ensureGitRepo();
  const pullRes = await pullFromRemote();

  await runGit(['add', '-A']);
  const statusRes = await runGit(['status', '--porcelain']);

  let commitRes = { success: true, message: 'Working tree clean, no uncommitted changes.' };
  if (statusRes.stdout && statusRes.stdout.trim().length > 0) {
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const dateStr = d.toISOString().slice(0, 10);
    const msg = `[CDISC-GxP] Live Sync: ${studyId} - ${dateStr} ${timeStr}`;
    commitRes = await runGit(['commit', '-m', msg]);
  }

  const pushRes = await pushToRemote();
  const logRes = await runGit(['log', '-1', '--oneline']);

  return {
    success: pushRes.success,
    pull: pullRes,
    commit: commitRes,
    push: pushRes,
    lastCommit: logRes.stdout || 'Live Sync Completed'
  };
}

module.exports = {
  getGitStatus,
  configureGitHub,
  commitDeliverables,
  pushToRemote,
  pullFromRemote,
  syncWithRemote,
  ensureGitRepo
};
