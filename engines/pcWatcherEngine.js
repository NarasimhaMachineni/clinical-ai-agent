/**
 * Local PC Directory Watcher Engine
 * Monitors the user's PC filesystem for incoming clinical EDC files (CSV/JSON).
 * Automatically triggers the autonomous clinical data science pipeline upon detecting file changes.
 */

const fs = require('fs');
const path = require('path');

let activeWatcher = null;
let debounceTimer = null;
let watcherStatus = {
  active: false,
  watchedDirectory: path.join(__dirname, '..', 'data_inbox'),
  lastEventTimestamp: null,
  lastEventFile: null,
  executionCount: 0
};

/**
 * Start watching a local PC directory
 */
function startWatcher(targetDir, onFileChangeCallback) {
  stopWatcher();

  const resolvedDir = path.resolve(targetDir || watcherStatus.watchedDirectory);
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  watcherStatus.watchedDirectory = resolvedDir;

  try {
    activeWatcher = fs.watch(resolvedDir, (eventType, filename) => {
      if (!filename) return;
      const lower = filename.toLowerCase();
      // Only react to data files
      if (!lower.endsWith('.csv') && !lower.endsWith('.json')) return;

      watcherStatus.lastEventTimestamp = new Date().toISOString();
      watcherStatus.lastEventFile = filename;

      console.log(`[PC Watcher] Detected ${eventType} on ${filename} in ${resolvedDir}`);

      // Debounce by 1500ms to allow file writes to finish
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        watcherStatus.executionCount++;
        if (typeof onFileChangeCallback === 'function') {
          onFileChangeCallback({
            eventType,
            filename,
            directory: resolvedDir,
            timestamp: watcherStatus.lastEventTimestamp
          });
        }
      }, 1500);
    });

    watcherStatus.active = true;
    console.log(`[PC Watcher] Actively monitoring PC folder: ${resolvedDir}`);
    return { success: true, directory: resolvedDir };
  } catch (err) {
    console.error('[PC Watcher Error]', err);
    watcherStatus.active = false;
    return { success: false, error: err.message };
  }
}

/**
 * Stop active directory watcher
 */
function stopWatcher() {
  if (activeWatcher) {
    activeWatcher.close();
    activeWatcher = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  watcherStatus.active = false;
  return { success: true, message: 'PC Watcher stopped' };
}

/**
 * Get current watcher configuration and statistics
 */
function getWatcherStatus() {
  const dir = watcherStatus.watchedDirectory;
  let fileCount = 0;
  let filesList = [];
  if (fs.existsSync(dir)) {
    filesList = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.csv') || f.toLowerCase().endsWith('.json'));
    fileCount = filesList.length;
  }

  return {
    ...watcherStatus,
    fileCount,
    files: filesList
  };
}

module.exports = {
  startWatcher,
  stopWatcher,
  getWatcherStatus
};
