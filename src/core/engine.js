/**
 * QVAC engine — the one module that imports the SDK.
 *
 * Why dynamic import: the QVAC SDK reads `QVAC_CONFIG_PATH` at import time to
 * decide logging/config. We must set that env var *before* the module loads, so
 * we `await import('@qvac/sdk')` from inside initEngine() rather than statically.
 *
 * Everything else in the app talks to QVAC only through getSdk() + the thin
 * capability wrappers, so the SDK surface stays isolated and swappable.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from './logger.js';

const log = createLogger('engine');

/** Project root (two levels up from src/core/). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @type {Record<string, any> | null} */
let _sdk = null;
/** Track loaded model ids so shutdown can free them all. */
const _loaded = new Set();

/**
 * Initialise the engine: point the SDK at our config and load it.
 * Idempotent — subsequent calls return the cached module.
 * @param {{ configPath?: string }} [opts]
 */
export async function initEngine(opts = {}) {
  if (_sdk) return _sdk;
  process.env.QVAC_CONFIG_PATH = opts.configPath || path.join(ROOT, 'qvac.config.json');
  log.step('loading @qvac/sdk …');
  _sdk = await import('@qvac/sdk');
  log.ok('QVAC SDK ready');
  return _sdk;
}

/** Get the loaded SDK module, or throw if initEngine() has not run. */
export function getSdk() {
  if (!_sdk) throw new Error('Engine not initialised — call initEngine() first.');
  return _sdk;
}

/** Resolve project-relative paths consistently. */
export function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

function makeProgress(label) {
  let lastPct = -1;
  return (p) => {
    const pct = Math.floor(p?.percentage ?? 0);
    if (pct !== lastPct && pct % 10 === 0) {
      lastPct = pct;
      log.debug(`${label}: downloading ${pct}%`);
    }
  };
}

/**
 * Load a model described by a MODELS entry from config.
 * @param {{ constant: string, modelConfig?: object }} spec
 * @param {{ onProgress?: Function, extraConfig?: object, label?: string }} [opts]
 * @returns {Promise<string>} modelId
 */
export async function loadNamedModel(spec, opts = {}) {
  const sdk = getSdk();
  const modelSrc = sdk[spec.constant];
  if (modelSrc === undefined) {
    throw new Error(
      `Unknown QVAC model constant "${spec.constant}". ` +
        `It is not exported by the installed @qvac/sdk — check the version/name.`,
    );
  }
  const modelConfig = { ...(spec.modelConfig || {}), ...(opts.extraConfig || {}) };
  const label = opts.label || spec.constant;
  const attempts = opts.attempts ?? 3;

  log.step(`loading model ${label} …`);
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const modelId = await sdk.loadModel({
        modelSrc,
        modelConfig,
        onProgress: opts.onProgress || makeProgress(label),
      });
      _loaded.add(modelId);
      log.ok(`loaded ${label}`);
      return modelId;
    } catch (e) {
      lastErr = e;
      // The Bare worker's first handshake intermittently exceeds the SDK's 30s
      // RPC-init window on a cold start; the SDK tears the worker down, so a
      // fresh loadModel re-spawns it. Retry only that transient failure.
      const transient = /RPC_INIT_TIMEOUT|timed out|worker/i.test(e?.message || '');
      if (!transient || i === attempts) throw e;
      log.warn(`load ${label} failed (${e.message.split('\n')[0]}); retry ${i}/${attempts - 1}`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

/** Resolve a bare model constant value by name (e.g. for vadModelSrc). */
export function resolveConstant(name) {
  const sdk = getSdk();
  const v = sdk[name];
  if (v === undefined) throw new Error(`Unknown QVAC constant "${name}".`);
  return v;
}

/** Unload a single model. */
export async function unload(modelId) {
  if (!_sdk || !modelId) return;
  try {
    await _sdk.unloadModel({ modelId, clearStorage: false });
  } catch (e) {
    log.warn(`unload failed for ${modelId}: ${e.message}`);
  }
  _loaded.delete(modelId);
}

/** Free all loaded models and close the SDK. Safe to call multiple times. */
export async function shutdown() {
  if (!_sdk) return;
  for (const id of [..._loaded]) await unload(id);
  if (typeof _sdk.close === 'function') {
    try {
      await _sdk.close();
    } catch {
      /* ignore */
    }
  }
  log.ok('engine shut down');
}
