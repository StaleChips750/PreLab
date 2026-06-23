# PreLab — Blueprint

## 1. What PreLab is
PreLab is a **social app for sharing and discovering FX presets that producers built in BandLab.**
A producer dials in a vocal/mix FX chain inside BandLab, then posts it on PreLab so others can
see the recipe, save it, follow the creator, and open the original in BandLab. Think
"Dribbble / TikTok for BandLab FX chains."

**Core principle:** presets are *created in BandLab*, then *shared and discovered* on PreLab.
PreLab is the social + discovery layer — it is **not** a place that generates presets for you
(the one nuance: the Studio "assist" tools help you *describe/spec* a chain to recreate in BandLab — see §6).

## 2. The hard constraint (why the product is shaped this way)
**BandLab has no public preset API.** You cannot programmatically fetch a preset's parameters
from a share link. So "share a preset" is an **honest, user-driven** flow:
- paste your BandLab **share link** (stored, used as the "Open in BandLab" button),
- enter the **FX chain** details (effects + key params) and metadata (title, genre, track type),
- upload a **cover** image.

PreLab's value is the **social layer + the human-readable FX recipe**, not API magic.

## 3. Architecture
| Layer | Choice | Why |
|---|---|---|
| Frontend | The existing **static HTML/CSS/JS** app | Keeps all the UI work; no rewrite |
| Hosting | **GitHub Pages** (auto-deploys on push) | Already wired; free; static-only |
| Backend | **Supabase** — Postgres + Auth + Storage + Realtime | Called directly from the browser via `supabase-js`; **RLS** secures every row |
| AI (Studio) | **Supabase Edge Function** → LLM provider | Keeps the API key server-side; browser never sees it |

No server framework, no Node host needed — the static site talks to Supabase directly.

## 4. Status (what exists today)
- ✅ **Full UI** (feed, studio, library, friends, chat, profile, modals) — polished, sprite icons, BandLab pills.
- ✅ **Supabase project** provisioned: `prelab` (`ycqejtiouwsbjjwsiwmt`, us-east-2).
- ✅ **Schema + RLS** applied: `profiles, presets, likes, saves, follows` + auto-profile-on-signup + count triggers + security hardening.
- ✅ **Storage bucket** `covers` (public read, owner-scoped writes).
- ✅ Migrations version-controlled in `supabase/migrations/`.
- ⬜ **Frontend not yet wired to the backend** — every interaction is still simulated. This is the next build.

## 5. Data model
```
profiles(id=auth uid, handle unique, display_name, avatar_url, bio, social_links jsonb)
presets(id, author_id→profiles, title, description, bandlab_url, track_type, genre,
        fx_chain jsonb, cover_url, visibility, like_count, save_count, comment_count, created_at)
likes(user_id, preset_id)          -- PK(user,preset)
saves(user_id, preset_id)          -- PK(user,preset)
follows(follower_id, followee_id)  -- PK(follower,followee)
-- later: comments, conversations, messages, notifications
```
Feed = public presets newest-first (or by followees for "Following"), joined to author, with the
viewer's like/save state. Counts kept live by DB triggers. RLS: anyone reads public rows; you
write only your own.

## 6. Feature plan (phased)
**Phase 1 — "genuinely functional" (in progress, approved)**
Real auth (email + OAuth) · real profiles · **create/share a preset** (paste link + FX details + cover)
· real feed from the DB · like / save / follow · library reads real data.

**Phase 2 — social depth**
Comments · search & filters (producers, genre, FX) · notifications · friend requests · profile grid · pagination.

**Phase 3 — messaging + first AI tool**
Realtime chat (share a preset in a thread) · **"Describe It"** = real LLM that turns a description +
FX selection into a usable BandLab settings sheet.

**Phase 4 — audio AI (the Studio tools you want fully working)**
- **Describe It** → LLM generates a real FX recipe from your words. *Fully doable.*
- **Vocal Upload** → analyzes the uploaded vocal (Web Audio: loudness, dynamics, spectral shape,
  reverb estimate) → LLM tailors a chain to it. *Real, grounded.*
- **Preset Ripper** → analyzes a track's measurable traits (spectral balance, compression, stereo
  width, reverb decay, saturation) → LLM maps them to a plausible chain. **Honest limit:** it
  cannot *exactly* reverse-engineer parameters (an unsolved problem) — it's a real, analysis-based
  **estimate**, not magic extraction.

## 7. Deploy / ops
- Push to `claude/skills-plugins-setup-imq071` → GitHub Action auto-builds Pages → live at
  **https://stalechips750.github.io/PreLab/**.
- DB changes go through `supabase/migrations/*.sql` (applied via the Supabase MCP).
- Security advisors are checked after each schema change.

## 8. What I still need from you
1. **OAuth providers** — Google and/or Apple for sign-in? (Apple needs a paid dev account.)
   Email/password works with no setup.
2. **LLM provider + API key** (Anthropic or OpenAI) for the three Studio tools — billed to you,
   stored as a Supabase secret. Not blocking the Phase-1 core.
3. **Audio previews?** Host uploaded preview clips (storage + moderation/copyright exposure) or
   images-only for now?
4. **Moderation/legal** — public user content eventually needs reporting/takedown + Terms/Privacy.

## 9. Next build step
Wire `supabase-js` into the site and ship Phase 1 in order:
**auth → profile → create-preset → live feed → like/save/follow.** Each piece tested against the
real backend before moving on.
