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
| A flat 2D city map with pins | **The Planet** — a photoreal, draggable Earth with clouds, a scrubbable timeline, a real day/night terminator, and scroll-driven pages | A pin map says "find something near you." A globe says "people are gathering everywhere, right now" — which is what the product is actually about |

## Core features

1. **Discover** — A personalized home feed of nearby and global events, curated by interest, language, and community.
2. **Live** — Real-time streaming of events and moments, with live chat and translation so a global audience can follow along.
3. **The Planet** — The centrepiece. A photoreal Earth you drag to orbit: real coastlines, continental shelves, climate-banded terrain, polar ice, and a drifting cloud layer, all shaded per pixel. Every point on it is a free gathering. Drag the time scrubber (*Right now → Saturday → Sunday → Next week → This month*) and the planet repopulates as you travel forward; "Play the tour" flies you point to point. Tap any point to open the event.
4. **Day & night** — The terminator is real, not decorative: it is computed from the sun's actual position, so the lit half of the planet matches the clock. It tracks live by default, city lights come up on the night side, sun glints off the sea, and dragging the sun slider walks the daylight round the world hour by hour.
5. **Companion** — An AI assistant that recommends events, answers questions, translates in real time, and helps hosts set up an event.
6. **Create** — Simple tools for anyone — an individual, a community group, or a business — to host and promote an event.

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

Scrolling is also a control: the globe stays pinned while five pages move past it, and each one re-poses the planet — into night, forward to the weekend, east into tomorrow morning. Both prototypes do this.

## Early design exploration

Before the working prototype existed, the direction was mocked up as static screens — this is where the naming, palette, and layout decisions got made. The prototype above has since grown well past what's pictured here (dark mode, ratings & reviews, Connections, a guest-first no-account redesign, The Planet replacing the flat map, more sample events), so treat these as the starting point, not the current state.

A static overview page with the pitch and links to every screen as individual mockups:

**https://claude.ai/code/artifact/7eca8791-048b-41b4-9bea-5709c8eb571b**

The screens themselves are published as three interactive design canvases (split up so each loads reliably on mobile browsers):

- [Onboarding & Home](https://claude.ai/code/artifact/69e1f789-b606-4e0e-9e76-f25f2eb88b46) — Welcome, Discover, Search, Notifications
- [Explore & Events](https://claude.ai/code/artifact/327dd4c8-80bb-43f1-a08f-653dfdb53dc2) — Explore Map (since replaced by The Planet), Live, Create Event, Event Detail sheet, Invite & Share sheet
- [Account & Branding](https://claude.ai/code/artifact/f5249ed6-5a31-42d4-af36-6c7ea8671ed4) — Companion (AI), Profile, Settings, Launch Splash, App Icon
