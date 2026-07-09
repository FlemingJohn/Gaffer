# Gaffer — Presentation Script

A spoken script for pitching Gaffer. Read it top to bottom (~4–5 min), or jump to
a section. Lines in *italics* are what you say; lines in **[brackets]** are stage
directions / what to show.

---

## 1. The hook (20 sec)

*"Hi everyone, thanks for having me — I'm [your name], and this is Gaffer.*

*Let me start with a picture. Imagine you're a grassroots football coach. It's
half-time, you're a goal down,
it's freezing, there's no phone signal at the pitch, and you've got fifteen
minutes to fix it. The pro game has a room full of analysts for this moment.
You've got nothing.*

*That's the problem Gaffer solves — and it does the whole thing on your phone,
completely offline."*

**[Show the app open on the Match screen.]**

---

## 2. What is Gaffer? (30 sec)

*"Gaffer is a fully on-device, multimodal RAG system — an offline AI assistant
coach.*

*You tap and speak what you're seeing — 'they keep getting at us down our left
and we're losing every second ball.' About fifteen seconds later you get a
Half-Time Card: what's hurting you, two or three concrete changes that name your
own players, and a drill for next training. It reads the card back to you out
loud, and it draws the shape on a tactics board.*

*The key thing: there's no cloud, no API key, no account. Airplane mode on — it
still works. Every piece of AI runs on the device through Tether's QVAC SDK. A
youth team's data never leaves the phone."*

**[Tap the mic, say the line, let it produce a card. Point at the named players.]**

---

## 3. The key idea — multimodal RAG (45 sec)

*"Under the hood, Gaffer is a RAG system — Retrieval-Augmented Generation. That's
the important part, because it's what stops a small on-device model from just
making tactics up.*

*It's multimodal on both ends. The input is your voice — Whisper turns speech
into text. The output is multimodal too: the card comes back as text on screen,
as spoken audio, and as a drawn tactics board.*

*In the middle is the retrieval step. I've built a knowledge base of 30 real
grassroots coaching tactics — 18 attacking, 12 defensive — in plain coach
language. When you describe a problem, Gaffer finds the three most relevant
tactics by meaning, not keywords. So if you say 'they keep getting at us down our
left,' it retrieves 'overload a flank' even though you never used that word.*

*Those three snippets are the only source material the model is allowed to build
the card from. That's why every card has a 'Grounded in' line — the advice is
tied to real coaching knowledge, not hallucinated.*

*And to be clear on where all this lives — it's all local. The knowledge base is
a markdown file on the device. I embed it once into a small JSON index, and at
match time it's an in-memory RAG — that index sits in memory and gets searched by
cosine similarity. Nothing is stored or retrieved from a server; the retrieval
happens entirely on the phone.*

*I kept it in-memory on purpose — at touchline scale, a few hundred snippets, a
linear cosine scan is instant and needs zero setup or database. But the store is
deliberately behind a tiny interface — just add and search — so this is the piece
that will be integrated with a decentralized store next: QVAC's HyperDB over
Pears, so coaches can share and sync a knowledge base peer-to-peer, still with no
central server. The in-memory RAG is today's fast path; the decentralized backend
is the roadmap, and swapping it in doesn't touch any of the coaching logic."*

**[Optional: show the backend terminal printing the retrieved snippets with scores.]**

---

## 4. The architecture (60 sec)

*"Here's how it fits together. QVAC's AI runs in Node, not the browser, so there
are three simple layers, and all of them live on your device.*

*One — a React web app. That's what you touch. Tap to speak, see the card.*

*Two — a thin Node bridge server. The UI can't call the AI directly, so this
passes audio and text through.*

*Three — the QVAC engine, where all the AI happens. And the half-time pipeline
inside it is five steps:*

- *First, Whisper turns your voice into text.*
- *Second, Qwen3 reads that text and extracts the tactical signals — which zone,
  which phase, how severe.*
- *Third, the RAG step — GTE-Large embeddings find the matching tactics from the
  knowledge base.*
- *Fourth, Qwen3 again — it writes the Half-Time Card, grounded in those
  retrieved snippets, as strict JSON so it's always valid.*
- *Fifth, Supertonic reads the card back out loud.*

*And separately, once before the season, there's a training step — but I'll come
to that, because that's the differentiator."*

**[Show the architecture diagram from the README (the Mermaid flowchart).]**

---

## 5. The models (40 sec)

*"Everything runs on small, open models delivered through QVAC's distributed
registry — they download once, then run fully offline. Five models, each doing
one job:*

- ***Whisper*** *— speech to text, for the voice capture.*
- ***Qwen3 1.7B*** *— the reasoning model. It does two jobs: pulling out the
  problems, and writing the card. I use constrained JSON output so even a small
  model can't produce an invalid card.*
- ***GTE-Large*** *— the embedding model for RAG. It turns text into 1024-dimension
  vectors so we can search by meaning.*
- ***Supertonic*** *— text to speech, to read the card back hands-free.*
- *And ***LoRA fine-tuning*** *on top of Qwen3 — that's how it learns your team.*

*Why Qwen3 specifically? Because QVAC's fine-tune engine doesn't support the Llama
architecture, and a trained adapter only loads onto a base of the same
architecture. So the whole thing is built around Qwen3."*

**[Show the Models table from the README.]**

---

## 6. The differentiator — it learns your team (45 sec)

*"RAG gives Gaffer tactics. Fine-tuning gives it *your* team — and this is the
part no cloud coach can safely offer.*

*Before the season you give it a file of your own match notes — each row is a real
half-time moment and the card a good assistant would have written, with your
players named.*

*Here's how the fine-tune actually works. I don't retrain the whole model — that
would be gigabytes and hours. Instead I use LoRA: I freeze the base Qwen3 model
and train only a tiny set of extra weights that layer on top. QVAC's finetune
function runs the full forward-and-backward pass on-device, about four passes over
my season file, roughly half an hour on a laptop CPU. You can watch the loss fall
live — mine went from about three-point-five down to nought-point-nine. The output
is a single 34-megabyte file — a GGUF adapter — and that's your private team
model.*

*At half-time, Gaffer hot-loads that adapter on top of Qwen3 — one config line —
so the exact same pipeline now speaks in your squad. Without the adapter it says
'drop a midfielder to double up.' With it: 'drop Leo to double up on their right
winger, Marcus covers for Tom.'*

*Same code, but now it knows your players — and the training data never left the
device.*

*And because the adapter is just one small file, it's reproducible: I've pushed
the trained adapter to the GitHub repo alongside the code, so a judge can clone it
and run `npm run demo:team` and get the personalised, named-player advice straight
away — without having to sit through the half-hour training run themselves. Retrain
it on your own season and you get your own adapter."*

**[Show the base-vs-adapter comparison table from the README.]**

---

## 7. Why it's novel (25 sec)

*"'AI football coach' isn't a new phrase. But Gaffer combines three things nobody
ships together:*

*Fully offline — airplane mode, no signal, no account.*

*Private by design — a youth team's data never touches a server, so it's safe for
exactly the people cloud tools can't serve.*

*And it learns your team — on-device fine-tuning, so the advice names your
players.*

*Offline, plus private, plus personalised — and that's only possible because the
AI runs locally through QVAC."*

---

## 8. Close (15 sec)

*"So that's Gaffer: a multimodal, on-device RAG coach that a grassroots manager
can actually use — on a cold touchline, with no signal, for free, without handing
a child's data to anyone.*

*The pro game has analysts. Now grassroots has Gaffer."*

**[End on the Half-Time Card / tactics board.]**

---

## Quick-reference cheat sheet

Numbers and names to have ready if a judge asks:

| Thing | Answer |
|---|---|
| Track | Tether Developers Cup — QVAC (Local AI) |
| One-line | Fully on-device, multimodal RAG assistant coach |
| Knowledge base | 30 tactics (18 attacking + 12 defensive), plain markdown |
| Retrieval | Top-3 by cosine similarity, matched by meaning not keywords |
| Where it's stored | Source: `data/corpus/tactics.md` · embedded index: `data/cache/rag-index.json` · searched in-memory (`src/rag/store.js`) — all local |
| RAG backend | **In-memory** cosine scan today (instant, zero setup at touchline scale); interface is just `add()`/`search()` |
| Roadmap | Integrate a **decentralized store** — QVAC HyperDB over Pears — to share/sync the knowledge base peer-to-peer, still no central server. Swap doesn't touch coaching logic |
| Models | Whisper (STT), Qwen3 1.7B (reasoning), GTE-Large (embeddings, 1024-dim), Supertonic (TTS) |
| Training | On-device LoRA on Qwen3, ~4 epochs, ~30 min on CPU |
| Adapter | `trained-lora-adapter.gguf`, ~34 MB — committed to the GitHub repo so judges can run `npm run demo:team` without retraining |
| How it fine-tunes | LoRA: freeze base Qwen3, train only small extra weights · QVAC `finetune()` · ~4 epochs · full fwd+bwd on-device CPU · ~30 min |
| Why Qwen3 | QVAC fine-tune doesn't support Llama; adapter needs same architecture |
| Multimodal | In: voice/text · Out: text + speech + drawn tactics board |
| Privacy | No cloud, no API keys, no account — works in airplane mode |
| Loss curve | ~3.5 → ~0.9 over training |

## Demo flow (if doing it live)

1. **[Start the engine first]** `npm run server`, then `cd web && npm run dev`.
2. Open the app, show it's a fresh team (no fake data) — enter a team name.
3. Add a couple of players on the Team page.
4. On the Match page, tap speak and say:
   *"They keep getting at us down our left, our right-back's caught too high, and
   we're losing every second ball in midfield."*
5. Show the Half-Time Card + the tactics board picking a formation and drawing
   arrows.
6. Hit **Read aloud** — it speaks the card (proves TTS is on-device).
7. **[If you have the backend terminal visible]** point at the RAG pipeline log:
   observation → signals → retrieved tactics with scores → card.
8. Mention: all of that just ran with no network.
