# Convene — Where Everyone Gathers

A revamp of the original app concept: a single app for discovering events, watching live moments, and connecting with people globally. The core idea is kept; the branding, tone, and visual language are rebuilt to read as a warm, trustworthy product — appealing to families, professionals, event organizers, and businesses alike, not just a nightlife/social crowd.

## Positioning

**Convene** is a global events and community platform: find what's happening nearby or anywhere in the world, watch it live, join the conversation across languages, and build real connections — whether that's a family outing, a professional mixer, or a cultural festival.

- **Tagline:** *Where everyone gathers.*
- **Tone:** Warm and human — approachable and inviting, closer to a well-loved neighborhood or community brand than a party app, while still feeling polished enough for business use.
- **Audience:** Everyone — families, professionals/business travelers, expats and immigrant communities, local event organizers, and venues/brands looking to reach an engaged audience.

## What changed from the original concept

| Original | Revamp | Why |
|---|---|---|
| Neon purple/magenta gradients, nightlife concert imagery | Warm cream, terracotta, and forest green | Reads as approachable and daylight-friendly at a glance, works for a family/community audience, not just nightlife |
| "Pulse360" | "Convene" | Signals gathering and coming together — confident enough for a business mixer, plain enough for a family picnic |
| Generic AI chat icon | "Companion" — a named, branded assistant | Frames the AI feature as a helpful guide, not a gimmick, which reads better to a broad audience |
| Feature labels ("Connect", "Explore") | Same functions, reframed as a coherent product vocabulary (Discover, Live, The Planet, Companion, Create) | Consistent naming across the app instead of a loose feature list |
| A flat 2D city map with pins | **The Planet** — a full-screen, photoreal, draggable Earth with verified coastlines, clouds, city lights, a scrubbable timeline and a real day/night terminator | A pin map says "find something near you." A globe says "people are gathering everywhere, right now" — which is what the product is actually about |

## Core features

1. **The Planet** — the product's front door. A photoreal Earth you drag to orbit, drawn
   by a WebGL shader: coastlines verified against 183 known coordinates, climate regions,
   sea ice, city lights, a drifting cloud layer, and a star field behind it. Every point of
   light is a free gathering.
2. **Ride the dusk** — the terminator is the control, not decoration. Riding it walks the
   evening westward around the planet and lights each place as its own six o'clock arrives.
   Gatherings begin when the light goes, so the product follows the light.
3. **Threshold** — every gathering states how hard it is to walk into alone: how many are
   coming, what share of them arrive on their own, and whether anyone is on the door. The
   real barrier to a room full of strangers is nerve, and nothing else surfaces it.
4. **Echo** — the timeline runs *through* now rather than up to it. Scrub left and the
   points cool from lamplight to ash, each carrying what actually came of it: who came, how
   many came by themselves, how many were still there after it was supposed to end.
5. **My region** — the planet turns to the viewer's own part of the world, derived from
   their time zone. No permission prompt, no location access, no account.
6. **Create** — simple tools for anyone to host and promote a gathering.

### What was removed, and why

- **The AI Companion.** A chat box bolted to an events app is a tired trend that answered
  questions the globe answers better.
- **Moments.** A photo recap feed was an imitation of something people already have. Echo
  replaces it with the three numbers that actually say whether a gathering was worth the walk.
- **Star ratings.** A five-star average is a popularity score. It contradicts Echo, which
  reports what happened instead of how people felt about it afterwards.

Five destinations became three: **The Planet**, **Gatherings**, **Yours**.

## Business model

Convene is deliberately payment-less and login-less — no accounts, no ticketing, no subscription tier anywhere in the app. That's a product decision as much as a business one: a monetization model built on personal data or transaction fees would work against the whole guest-first premise.

- **Free, full stop** — discovering, saving, RSVPing, and hosting all work with zero payment and zero account.
- **No user monetization** — no ads, no data resale, no paywall. Nothing about a person's activity here is for sale.
- **Business/venue partnerships** — the one plausible revenue path: paid placement and analytics tools sold directly to venues, brands, and organizers, never funded by user data.

## Case study

The full portfolio write-up — problem, naming and direction exploration, screen gallery, the guest-first/no-account redesign, and business model:

**https://claude.ai/code/artifact/f3518657-0651-4594-9b60-93d4cc77e12f**

## Try it

A working, tap-through prototype — one phone screen with real navigation, not just static pictures. No login, no signup, no payment info — it opens straight into the app as a guest.

**https://claude.ai/code/artifact/4ee53592-ca5e-407d-b02b-feba421d78d0**

Browse Discover, search events, orbit **The Planet** and scrub through time, watch Live, create your own event (it shows up on Discover), RSVP to an event (it shows up on your Profile), chat with the Companion, and toggle settings.

## The web app

The same idea as a responsive website, with the globe promoted all the way to the hero — the planet *is* the landing page. Live streaming is replaced here by **Moments**, an after-the-fact recap feed, which suits a browser better than a live video wall.

**https://claude.ai/code/artifact/8004ec78-296c-47fa-bc32-7219aaa738c8**

Drag the globe, drag the *Convene through time* scrubber, walk the sun round the planet with the day/night slider, play the tour, or search a city. Gatherings outside the current time window stay on the planet as faint marks, so scrubbing forward visibly fills it in.

On the web the planet is not a panel on a page — it *is* the page: a full-bleed dark stage, nothing under the globe but the timeline, and the gathering list moved to its own **Gatherings** tab. Scrolling over the planet travels through time.

Keyboard: `/` or `Cmd/Ctrl-K` jumps to search, `Escape` backs out of anything open, and the timeline takes arrow keys as well as a drag.

## Early design exploration

Before the working prototype existed, the direction was mocked up as static screens — this is where the naming, palette, and layout decisions got made. The prototype above has since grown well past what's pictured here (dark mode, ratings & reviews, Connections, a guest-first no-account redesign, The Planet replacing the flat map, more sample events), so treat these as the starting point, not the current state.

A static overview page with the pitch and links to every screen as individual mockups:

**https://claude.ai/code/artifact/7eca8791-048b-41b4-9bea-5709c8eb571b**

The screens themselves are published as three interactive design canvases (split up so each loads reliably on mobile browsers):

- [Onboarding & Home](https://claude.ai/code/artifact/69e1f789-b606-4e0e-9e76-f25f2eb88b46) — Welcome, Discover, Search, Notifications
- [Explore & Events](https://claude.ai/code/artifact/327dd4c8-80bb-43f1-a08f-653dfdb53dc2) — Explore Map (since replaced by The Planet), Live, Create Event, Event Detail sheet, Invite & Share sheet
- [Account & Branding](https://claude.ai/code/artifact/f5249ed6-5a31-42d4-af36-6c7ea8671ed4) — Companion (AI), Profile, Settings, Launch Splash, App Icon

## Accessibility

Both prototypes are checked against WCAG 2.1 AA, plus WCAG 2.2's dragging-movements
rule, and the checks live in `prototype/tests/` so the claims are reproducible rather
than asserted:

- **Every visible string** was measured against its actual rendered background in both
  themes and across every view. Nothing on either prototype is below AA.
- **The planet is operable without a drag** (WCAG 2.2 SC 2.5.7). The canvas is
  focusable; arrow keys orbit it, `Page Up`/`Page Down` travel through time, `Home`
  recentres it, and it carries a text description of what it is showing.
- **Nothing hidden is reachable.** Closed drawers, sheets and modals are `inert`, so a
  keyboard user can't tab into a dialog that isn't on screen.
- **Focus is visible and managed** — one ring across the product, a skip link as the
  first tab stop, focus moved to the heading on navigation and returned to the opener
  when a dialog closes.
- **Cards are real controls.** Every event card exposes a focusable button rather than
  relying on a click handler attached to a `div`.

## Working on this repo

Two pieces of tooling are checked in so a fresh clone is set up the same way.

The prototype source lives in `prototype/` — two dependency-free HTML files plus the
test suite. See `prototype/README.md`.

**Design skills.** `.claude/skills/` vendors the seven skills from the
[ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
plugin (MIT). They load automatically as project skills — nothing to install.
Provenance and the one local modification are recorded in
`.claude/skills/VENDOR.md`.

**The 21st MCP server.** `.mcp.json` configures it, but reads the API key from
the environment rather than storing it — no secret is in this repo. To use it:

```sh
cp .env.example .env        # git-ignored
# then put your key from https://21st.dev in TWENTYFIRST_API_KEY
export TWENTYFIRST_API_KEY=...
```

Set the variable before starting Claude Code, which will ask you to approve the
server on first use. Without the key set you'll see
`Missing environment variables: TWENTYFIRST_API_KEY` and the server stays off —
everything else in the repo works regardless.
