# Cine-Stream AI Assisted Cohort Log & Engineering Prompts

This document details the engineering specifications, design philosophy, and AI-assisted dialog sessions utilized to build and optimize **Cine-Stream**.

---

## 🚀 Cohort Sync Overview

- **Engineer Specialization Tracks**: Front-End Specialists vs. Full-Stack Engineers.
- **Sprint Assigned**: May 29, 3:45 PM (Sprint 8)
- **Principal Contact**: Mr. Nakul (8851407750)

---

## 🎨 Design Philosophy: Applied Cinema-Noir

Cine-Stream delivers a sleek aesthetic experience based on standard Swiss/Modern layout parameters:
- **Primary Canvas Color**: Off-Black Slate (`#050505`) to match late-night cinematic ambiance.
- **Brand Accents**: Vibrant Crimson (`#dc0d1c`) highlighting active interactive components.
- **Layout Rhythm**: Generous negative space paired with high-contrast, clean-cut boundaries.

---

## 📓 AI Debugging & Prompt Logs

The following interactive sessions were used as pair-programming blocks to structure core architectural components.

### 🧠 Prompt 1: Secure API Key Handling on Server (Vite + Express Proxying)

> **Query**: *How do we architect a fully verified backend proxy inside a Node.js/Express + Vite setup to secure sensitive v3 and v4 API tokens from TMDB (The Movie Database) without exposing them to client-side browser inspection?*

**Architectural Solution**:
We established a server-side tunnel at `/api/movies` mapping client requests securely:
1. Parse the incoming `TMDB_API_KEY` or `VITE_TMDB_KEY` server-side.
2. Determine token version: if string length > 50 characters, apply newer v4 JWT Header Authentication (`Authorization: Bearer <TOKEN>`); else, fall back securely to classical v3 query signatures (`?api_key=<KEY>`).
3. Handle missing key states gracefully by reverting to a local high-quality custodial movie array seamlessly, preventing the React code from crashing or displaying empty broken blocks on startup.

---

### ⏳ Prompt 2: Core Engineering on Input Debouncing

> **Query**: *Write a lightweight, performance-optimized debounce routine inside a React effect hook that triggers search state changes strictly only after a 500ms typing pause to heavily reduce computed TMDB querying costs.*

**Architectural Solution**:
```tsx
const [searchVal, setSearchVal] = useState<string>("");
const [debouncedSearchVal, setDebouncedSearchVal] = useState<string>("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchVal(searchVal);
  }, 500);

  return () => clearTimeout(timer);
}, [searchVal]);
```

This prevents expensive parallel network fetches on fast keystroke streams, satisfying TMDB's REST request rate safeguards.

---

### 🤖 Prompt 3: AI Mood Matcher Handoff Protocol

> **Query**: *Explain how to wire Google Gemini (via the @google/genai SDK) with a REST search endpoint on the backend. The user describes a mood, Gemini outputs a single real movie title string, and the server silently passes that string into a TMDB search query to serve the final media metadata payload.*

**Architectural Solution**:
We instructed Gemini with a highly tailored system prompt, forcing a strict JSON schema structure return:
```ts
responseSchema: {
  type: Type.OBJECT,
  properties: {
    movieTitle: { type: Type.STRING },
    aiExplanation: { type: Type.STRING }
  },
  required: ["movieTitle", "aiExplanation"]
}
```
Upon getting the payload, the backend:
1. Retains the poetic atmospheric `aiExplanation` for rendering directly.
2. Silently triggers a search through `fetchFromTMDB("search/movie", { query: movieTitle })`.
3. Returns the matched item mapped to our frontend layout schema or falls back smoothly to our local retro catalog should TMDB access be restricted or configured blank/offline.

---

## 🛠️ Verification Metrics

- **Infinite Scrolling**: IntersectionObserver attached to an invisible bottom target triggers `setPage(prev => prev + 1)` and appends page payloads without layout collapse.
- **Favorites Persistence**: Full model objects (`Movie[]`) are stored under `cinestream_favs_payloads` to preserve fully detailed cover cards across sessions.
- **Native Lazy Loading**: Rendered images implement `loading="lazy"` to ensure media loads as it enters the viewport.
