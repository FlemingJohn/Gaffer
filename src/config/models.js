/**
 * Central model + runtime configuration for Gaffer.
 *
 * Every model the engine can load is declared here once, so swapping a model
 * (e.g. a bigger LLM on a beefier machine) is a one-line change and nothing
 * downstream needs to know the constant name.
 *
 * The `constant` strings are the exact named exports of `@qvac/sdk` v0.14 — the
 * engine resolves them at runtime (`sdk[constant]`) into registry entries that
 * download on first `loadModel`. All constants below are verified against the
 * official examples. Keep models small for laptop-speed iteration; see
 * scripts/precache-models.js to pre-download before going offline.
 */

const DEVICE = process.env.GAFFER_DEVICE === 'gpu' ? 'gpu' : 'cpu';

/** GPU-offload fragment for llama.cpp-backed models (llm + embed). No-op on cpu. */
const accel = DEVICE === 'gpu' ? { device: 'gpu', gpuLayers: 99 } : {};

export const MODELS = {
  /**
   * Primary reasoning model — drives observation parsing + Halftime Card, and
   * is the base for on-device fine-tuning. Qwen3 is used (not Llama) because the
   * QVAC finetune engine does NOT support the llama architecture, and a LoRA
   * adapter only loads onto a base of the same architecture. Qwen3 also follows
   * the json_schema constraint and coach-language instructions well.
   */
  llm: {
    constant: 'QWEN3_1_7B_INST_Q4',
    modelConfig: { ctx_size: 4096, ...accel },
  },

  /**
   * Tool-capable model for the optional agentic / function-calling path.
   * Verified working with native tools in the QVAC examples. A plain
   * LLAMA_3_2_1B will not reliably emit tool calls; this one + tools:true does.
   */
  toolLlm: {
    constant: 'QWEN3_1_7B_INST_Q4',
    modelConfig: { ctx_size: 4096, tools: true, ...accel },
  },

  /** Embedding model for RAG (GTE-Large → 1024-dim vectors). */
  embed: {
    constant: 'GTE_LARGE_FP16',
    dim: 1024,
    modelConfig: { ...accel },
  },

  /** Speech-to-text for touchline voice capture (file or mic). */
  asr: {
    constant: 'WHISPER_TINY',
    modelConfig: {
      audio_format: 'f32le',
      strategy: 'greedy',
      n_threads: 4,
      language: 'en',
      no_timestamps: false,
    },
    /** Silero VAD model constant, used only for live mic streaming. */
    vadConstant: 'VAD_SILERO_5_1_2',
  },

  /** Text-to-speech to read the Halftime Card back hands-free. */
  tts: {
    constant: 'TTS_EN_SUPERTONIC_Q8_0',
    sampleRate: 44100,
    modelConfig: {
      ttsEngine: 'supertonic',
      language: 'en',
      voice: 'F1',
      ttsSpeed: 1.05,
      ttsNumInferenceSteps: 5,
    },
  },
};

/**
 * On-device fine-tuning config (the differentiator). Produces a LoRA `.gguf`
 * adapter from the team's season of observations; hot-loaded into the LLM via
 * `modelConfig.lora`. NB: despite the SDK key name `trainDatasetDir`, the
 * examples pass a JSONL *file* path here.
 */
export const FINETUNE = {
  baseModel: MODELS.llm.constant,
  datasetFile: 'data/training/team-season.jsonl',
  adapterOutDir: 'data/adapters',
  checkpointDir: 'data/adapters/checkpoints',
  loraModules: 'attn_q,attn_k,attn_v,attn_o,ffn_gate,ffn_up,ffn_down',
  // Card-format examples run ~300 tokens (system roster + observation + JSON card).
  // The finetune default truncates at 128 and silently skips longer rows, so raise it.
  contextLength: 512,
  // Small season set (~10 examples): a few passes imprint the squad roster.
  numberOfEpochs: 4,
  learningRate: 1e-4,
  lrMin: 1e-8,
  assistantLossOnly: true,
  // 0 disables intermediate checkpoints. Writing a full model+optimizer snapshot
  // every few steps dominated wall-clock on the first run; we only need the final
  // adapter from outputParametersDir.
  checkpointSaveSteps: 0,
};

/** Where the embedded RAG index is persisted after `npm run ingest`. */
export const PATHS = {
  ragIndex: 'data/cache/rag-index.json',
  corpus: 'data/corpus/tactics.md',
  ttsOut: 'data/cache/halftime-card.wav',
};

export const RUNTIME = {
  device: DEVICE,
  debug: process.env.GAFFER_DEBUG === 'true',
};
