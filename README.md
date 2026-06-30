# Gaffer

**The offline, on-device AI assistant coach that learns your team.**

Built for the **Tether Developers Cup - QVAC (Local AI) track**. Every piece of AI
runs on-device through the [QVAC SDK](https://qvac.tether.io): no cloud, no API
keys, no data leaving the machine. A grassroots coach speaks their touchline
observations; at the break Gaffer hands back a **Half-Time Card** - a one-screen
tactical adjustment plus a fix-it drill - grounded in a local knowledge base and
**personalised to your own squad** via on-device fine-tuning.

> The category "AI football coach" is not new. Gaffer's edge is the combination
> no existing product ships: **fully offline + privacy-first + a model that
> trains a private LoRA adapter on _your_ season, on _your_ device.**

## Why it's defensible
- **Offline + private** - youth performance data never touches a server. Cloud
  incumbents (e.g. FootballGPT) can't make that claim.
- **Learns your team** - `finetune()` produces a `.gguf` adapter from your season
  of observations; week 1 gives generic advice, week 8 names your actual players
  and recurring weaknesses.
- **Voice-first** - you can't type on a touchline. Speak; get a spoken card back.

## Architecture (engine only - no frontend yet)

```
voice / text  ->  ASR (Whisper)  ->  signal extraction (LLM)
                                          |
                          RAG retrieve (GTE-Large + cosine)
                                          |
                              Half-Time Card (LLM + Zod-validated JSON)
                                          |
                                   TTS readback (Supertonic)

   season JSONL  ->  finetune()  ->  LoRA adapter  ->  hot-loaded into the LLM
```

The codebase is layered so the QVAC SDK is touched in exactly one place
(`src/core/engine.js`) and the football logic stays pure and testable:

### Module map
| Path | Responsibility |
|---|---|
| `src/config/models.js` | All model constants + runtime config in one place |
| `src/core/engine.js` | QVAC lifecycle: init / load / unload / shutdown (only SDK importer) |
| `src/capabilities/*` | Thin, typed wrappers over QVAC SDK functions |
| `src/rag/*` | Embedding-backed vector store + retriever (SDK-agnostic) |
| `src/domain/*` | Football logic, prompts, Zod + JSON schemas, Card rendering (no SDK) |
| `src/pipeline/matchSession.js` | Orchestrates the end-to-end flow |
| `scripts/*` | Model pre-cache, corpus ingest, fine-tune runner |
| `data/corpus/` | Tactical knowledge base (RAG source) |
| `data/training/` | Season observations (fine-tune source) |

## Models
All models are resolved from the QVAC distributed registry and run on-device.

| Role | Model | Notes |
|---|---|---|
| Reasoning + fine-tune base | `QWEN3_1_7B_INST_Q4` | Qwen3 is required for fine-tuning; the QVAC finetune engine does not support the llama architecture, and a LoRA adapter only loads onto a base of the same architecture. |
| Embeddings (RAG) | `GTE_LARGE_FP16` | 1024-dim vectors |
| Speech-to-text | `WHISPER_TINY` | + Silero VAD for live mic |
| Text-to-speech | `TTS_EN_SUPERTONIC_Q8_0` | 44.1 kHz PCM |

Structured output uses QVAC's constrained `json_schema` response format, so even a
small on-device model cannot emit an out-of-enum value or omit a required field;
Zod then validates defensively after parsing.

## Setup
Requires **Node.js >= 22.17** (QVAC SDK requirement).

```bash
npm install
cp .env.example .env
npm run precache      # pre-download models (gigabytes) before going offline
npm run ingest        # build the RAG index from data/corpus
npm run demo          # generic advice (base model)
npm run finetune      # train the team LoRA adapter from data/training
npm run demo:team     # advice that names your own players (uses the adapter)
```

The first model load downloads weights from the QVAC registry; after that it runs
fully offline. The first `loadModel` of a process can occasionally hit a worker
cold-start timeout - re-run once and it proceeds.

### CLI
```bash
node src/index.js "they're overloading our left and we're a goal down"
node src/index.js --demo            # scripted demo observation
node src/index.js --adapter --demo  # use the fine-tuned team adapter
node src/index.js --voice clip.wav  # transcribe a WAV, then advise
node src/index.js --speak "..."     # also synthesize a spoken card (data/cache/*.wav)
```

## Status
Backend engine working end-to-end on-device: observation -> tactical signals -> RAG
grounding -> Half-Time Card. On-device LoRA fine-tuning produces a team adapter.
Frontend intentionally deferred. Mobile (Expo) is a stretch - the same QVAC code
targets iOS/Android, but desktop Node is the build target for the sprint (no mobile
emulator support).

## License
Apache-2.0.
