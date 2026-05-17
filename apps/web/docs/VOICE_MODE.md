# CardStack Voice Mode

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Connection Flow](#connection-flow)
- [Study Loop](#study-loop)
- [File Structure](#file-structure)
- [Key Design Decisions](#key-design-decisions)
- [Voice Agent Tools](#voice-agent-tools)
- [Response Lifecycle & Queuing](#response-lifecycle--queuing)
- [Session Configuration](#session-configuration)
- [Error Handling](#error-handling)

---

## Overview

Voice mode allows users to study flashcards hands-free using speech. A voice agent powered by OpenAI's Realtime API (`gpt-realtime-1.5`) reads cards aloud, listens to spoken answers, evaluates responses, and advances through the study queue — all via a WebRTC connection from the browser.

Users can seamlessly switch between voice and manual modes at any point during a study session. The floating mic button in the bottom corner toggles voice mode on and off.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
│                                                                 │
│  ┌──────────────┐     ┌──────────────────┐    ┌──────────────┐ │
│  │  StudyPage    │────▶│ useStudySession  │◀───│  VoiceOverlay│ │
│  │  (UI render)  │     │ (state + logic)  │    │  (WebRTC)    │ │
│  └──────────────┘     └──────────────────┘    └──────┬───────┘ │
│                                                       │         │
│         ┌─────────────────────────────────────────────┘         │
│         │  RTCPeerConnection                                    │
│         │  ├── Audio Track (mic → OpenAI)                       │
│         │  ├── Audio Track (OpenAI → speakers)                  │
│         │  └── Data Channel (JSON events)                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │  WebRTC (audio + data)
          ▼
┌─────────────────────┐         ┌──────────────────────────┐
│  OpenAI Realtime API │◀────────│  /api/realtime/session   │
│  gpt-realtime-1.5    │         │  (ephemeral key minting) │
└─────────────────────┘         └──────────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │  OPENAI_API_KEY   │
                                │  (Doppler secret) │
                                └──────────────────┘
```

### Key Principle: Shared State, Not Separate State

The voice overlay does **not** own any study state. It receives the current card, flip state, and queue length as props from `useStudySession`, and calls the same `handleFlip` and `handleResponse` callbacks that the manual UI buttons use. This means:

- Voice and manual controls always see the same state
- A card rated via voice updates the progress bar, animates the card out, and advances the queue — identically to a button press
- The user can switch between voice and keyboard/touch at any point without desyncing

---

## Connection Flow

```
  User clicks mic          Browser                    Your Server              OpenAI
       │                      │                            │                      │
       │──── click ──────────▶│                            │                      │
       │                      │── POST /api/realtime/     │                      │
       │                      │   session ────────────────▶│                      │
       │                      │                            │── POST /v1/realtime/ │
       │                      │                            │   client_secrets ───▶│
       │                      │                            │◀── { value: ek_... } │
       │                      │◀── { clientSecret } ──────│                      │
       │                      │                            │                      │
       │                      │── getUserMedia (mic) ──────────────────────────── │
       │                      │── RTCPeerConnection ───────────────────────────── │
       │                      │── createOffer() ───────────────────────────────── │
       │                      │── POST /v1/realtime/calls ────────────────────── ▶│
       │                      │   (SDP offer, Bearer ek_...)                      │
       │                      │◀── SDP answer ────────────────────────────────── │
       │                      │                                                   │
       │                      │═══ WebRTC Connected (audio + data channel) ══════│
       │                      │                                                   │
       │                      │── session.update (instructions, tools) ─────────▶│
       │                      │◀── session.updated ──────────────────────────────│
       │                      │── response.create ──────────────────────────────▶│
       │                      │◀── Agent speaks first card ──────────────────────│
       │                      │                                                   │
  User hears card             │                                                   │
```

### Why Ephemeral Keys?

The `OPENAI_API_KEY` never reaches the browser. Instead, our API route mints a short-lived ephemeral key (`ek_...`) via OpenAI's `/v1/realtime/client_secrets` endpoint. The browser uses this key solely for the WebRTC handshake. This is the recommended security pattern for browser-based realtime connections.

---

## Study Loop

```
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  ▼                                                        │
┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│ Agent reads   │    │ Student      │    │ Agent         │  │
│ card front    │───▶│ answers      │───▶│ evaluates     │  │
│ aloud         │    │ (speech)     │    │ answer        │  │
└──────────────┘    └──────────────┘    └───────┬───────┘  │
                                                │          │
                           ┌────────────────────┼──────────┘
                           │                    │
                    ┌──────▼──────┐      ┌──────▼──────┐
                    │ Wrong?      │      │ Correct or  │
                    │ "Not quite, │      │ gave up?    │
                    │ try again"  │      │             │
                    │             │      │ Give verbal │
                    │ (no rating, │      │ feedback +  │
                    │  loop back) │      │ call        │
                    └─────────────┘      │ rate_card() │
                                         └──────┬──────┘
                                                │
                                         ┌──────▼──────┐
                                         │ Tool output  │
                                         │ sent back,   │
                                         │ useEffect    │
                                         │ sends next   │
                                         │ card context │
                                         └──────┬──────┘
                                                │
                                                ▼
                                         (back to top)
```

### Answer Guarding

The agent has strict instructions to **never reveal the answer** until the student either:
- Gives a substantially correct answer, or
- Explicitly gives up ("I give up", "I don't know", "skip", "tell me")

Wrong answers get encouragement to try again, not corrections. Partial answers get acknowledgement of what's right with hints about what's missing.

---

## File Structure

| File | Purpose |
|------|---------|
| `hooks/use-study-session.ts` | Extracted study state hook — owns the queue, current card, flip state, progress, and all study logic. Shared between manual UI and voice mode. |
| `components/voice/voice-overlay.tsx` | Floating mic button + WebRTC connection management. Handles the entire connection lifecycle, data channel events, and tool call execution. |
| `lib/voice/instructions.ts` | System prompt for the voice agent + `buildCardContext()` helper that formats card data for the agent. |
| `lib/voice/tools.ts` | Tool definitions (JSON Schema format for the Realtime API) + `executeToolCall()` which maps tool calls to UI callbacks. |
| `app/api/realtime/session/route.ts` | Server-side API route that mints ephemeral keys. Authenticated via Clerk. |
| `app/(dashboard)/decks/[id]/study/page.tsx` | Study page — now uses `useStudySession` hook and renders `<VoiceOverlay>`. |

---

## Key Design Decisions

### Hook extraction instead of global state

Study session state lives in `useStudySession` — a custom hook scoped to the study page. We chose this over Zustand because:
- The state lives and dies with the page mount — no manual lifecycle cleanup
- Props flow naturally: hook → page → VoiceOverlay (consistent with the existing controlled-component pattern in `<Flashcard>`)
- No global singleton to manage or reset between sessions

### Raw WebRTC instead of the SDK

We use the browser's native `RTCPeerConnection` API directly rather than `@openai/agents` SDK because:
- The SDK's module tree imports Node.js-specific code that crashes during browser-side module evaluation
- Raw WebRTC is straightforward: create peer connection, add mic track, create data channel, do SDP exchange
- The data channel uses the exact same JSON event protocol as the WebSocket API — just sent over `dc.send()` instead of `ws.send()`

### Card context via messages, not instructions

The first card is baked into the system instructions (since it's known at connection time). Subsequent cards are sent as `[CARD CONTEXT]` user messages via `conversation.item.create`. This allows card context to update without reconfiguring the entire session.

### Response queuing

The Realtime API rejects `response.create` if a response is already in progress. The overlay tracks the response lifecycle via `response.created` / `response.done` events and queues any card context that arrives mid-response, flushing it once the current response completes.

---

## Voice Agent Tools

Three tools are registered with the Realtime API session:

### `flip_card`
- **Parameters:** none
- **Triggered by:** student saying "flip the card" or "show me the back"
- **Effect:** calls `handleFlip()` in the study hook, visually flipping the card on screen

### `rate_card`
- **Parameters:** `{ rating: "again" | "hard" | "good" | "easy" }`
- **Triggered by:** agent's evaluation of the student's answer
- **Effect:** calls `handleResponse(rating)` in the study hook, which records the review via `POST /api/cards/{id}/review`, updates the queue, and advances to the next card
- **Special handling:** no `response.create` is sent after this tool — the next card context from the `useEffect` will trigger the agent to speak instead

### `end_session`
- **Parameters:** none
- **Triggered by:** student saying "stop", "quit", or "goodbye", or all cards completed
- **Effect:** disconnects the WebRTC session, shows a toast notification

---

## Response Lifecycle & Queuing

```
  rate_card called                    response.done
       │                                   │
       ▼                                   ▼
  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────────┐
  │ Tool      │───▶│ Queue next   │───▶│ Flush    │───▶│ Agent reads  │
  │ executes, │    │ card context │    │ pending  │    │ next card    │
  │ UI updates│    │ (pending)    │    │ context  │    │ front aloud  │
  └──────────┘    └──────────────┘    └──────────┘    └──────────────┘

  responseActiveRef: true              false → true
  pendingCardContextRef: null → text   text → null
```

This prevents the `conversation_already_has_active_response` error that occurs when sending `response.create` whilst the model is still generating output.

---

## Session Configuration

The session is configured via `session.update` using the **GA protocol** (required for `gpt-realtime-1.5`):

```json
{
  "type": "session.update",
  "session": {
    "type": "realtime",
    "instructions": "...",
    "tools": [...],
    "tool_choice": "auto",
    "audio": {
      "output": {
        "speed": 0.8
      }
    }
  }
}
```

Key configuration notes:
- **`type: "realtime"`** is mandatory for GA models — omitting it causes `invalid_request_error`
- **Server VAD** (voice activity detection) is enabled by default — no explicit `turn_detection` config needed (and the GA API rejects it as an unknown parameter)
- **`input_audio_transcription`** is also not supported as a session-level parameter on GA
- **Speed is set to 0.8** (20% slower than default) for more natural pacing
- **Echo cancellation** is requested via `getUserMedia` constraints to prevent the mic from picking up the agent's voice

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Mic permission denied | Toast: "Microphone access required for voice mode" |
| Ephemeral key fetch fails | Toast: "Failed to connect voice mode", reset to idle |
| SDP negotiation fails | Toast: "Failed to connect voice mode", reset to idle |
| Mid-session disconnect | Data channel `onclose` fires, state resets to idle, manual controls continue working |
| `response.create` during active response | Queued via `pendingCardContextRef`, flushed on `response.done` |
| OpenAI server error | Logged to console, session continues if possible |
| Out of OpenAI credits | `server_error` immediately after `session.created` — no specific handling, displays as connection failure |
