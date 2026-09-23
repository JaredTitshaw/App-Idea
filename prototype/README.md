# Source

The prototypes published as artifacts, kept here so the source outlives any
session.

| File | Published |
|---|---|
| `convene-web.html` | https://claude.ai/code/artifact/8004ec78-296c-47fa-bc32-7219aaa738c8 |
| `convene-app.html` | https://claude.ai/code/artifact/4ee53592-ca5e-407d-b02b-feba421d78d0 |
| `convene.html` (the Field) | https://claude.ai/artifact/BHWzCY93bKbmHx29Snc3vs |
| `convene-experience.html` | https://claude.ai/artifact/LjTQt6Z6ntxRSoecp8sBq5 |

Each is a single self-contained file with no build step. Open it in a browser, or
publish it as an artifact. The one exception is `convene-experience.html`, which loads
three.js r128 from cdnjs.

## The Experience

`convene-experience.html` is one long scroll that plays as a timeline. The scroll
position maps to a value `f` from 0 to 5, and one particle system morphs between six
shapes as `f` moves:

| `f` | Section | What you see |
|---|---|---|
| 0 | hero | light spirals round the Convene mark |
| 1 | burst | the mark tips over and the particles fly apart |
| 2 | manifesto | the ring stands on edge behind "Where everyone gathers" |
| 3 | gallery | the camera flies through smoke past the nine gatherings |
| 4 | lab | a honeycomb lattice behind the link to the Field |
| 5 | outro | the particles tie off as a knot |

In the gallery you can filter by kind, type a question into the ask box ("Spanish",
"on my own", "running now"), step through the gatherings with ‹ ›, and open one by
clicking its card or pressing Open. With reduced motion the scene holds still apart
from what your scrolling moves. If WebGL or three.js is unavailable, the page shows the
same gatherings as a flat list.

## Deep link

`convene.html#field` opens straight on the instrument, skipping the first-visit
feature wheel. The suites use it so they test the field, and `wheeltest.js`
covers the wheel separately.

## Tests

`tests/` holds the Playwright checks used on every change. They need Playwright and
a Chromium binary; the paths at the top of each file point at this container's copies
and are the only thing to adjust elsewhere. Run them from the directory holding the
HTML files:

Tests run against a *wrapped* copy, built by `tests/wrap.py`, which reproduces the
head the artifact publisher injects — including the viewport meta. Without it, mobile
emulation lays out at 980px and every phone-width result is fiction:

```sh
python3 tests/wrap.py convene-web.html wrapped-web.html
python3 tests/wrap.py convene-app.html wrapped-app.html
python3 tests/wrap.py convene-experience.html wrapped-experience.html
```

```sh
node tests/fulltest.js       # 15 interaction checks on the web app
node tests/a11y.js           # 35 accessibility + layout assertions (web)
node tests/app_a11y.js       #  9 accessibility assertions (phone)
node tests/contrast.js       # every visible string measured against WCAG AA (web)
node tests/contrast_app.js   # the same for the phone prototype
node tests/feattest.js       # time-zone region feature + reduced-motion handling
node tests/redesign.js       # dusk ride, Threshold, Echo, and the removals
node tests/fieldtest.js      # convene.html: the reachability rule, route, list, sheet
node tests/animtest.js       # boot self-test, solver optimality, sweep, countdowns
node tests/fxtest.js         # odometer geometry, magnetism bounds, fling, sweep wake
node tests/pulsetest.js      # wheel loader, running-now model, language filters
node tests/wheeltest.js      # the feature wheel: input, snapping, Show me, first-visit rules
node tests/contrast_new.js   # convene.html measured in every state, boot included
node tests/mobrepro.js       # phone layout: scrollable, timeline clear of the nav
node tests/bandtest.js       # globe sizing across the width range
node tests/experiencetest.js     # the Experience: timeline, gallery, ask box, sheet, fallbacks
node tests/contrast_experience.js # its text measured against the rendered 3D pixels behind it
```

The two Experience suites serve three.js from a local copy instead of cdnjs. Point
`THREE_LOCAL` at a `three.min.js` from r128 (default: `tests/three.min.js`). They run
Chromium with SwiftShader so WebGL works headless:

```sh
THREE_LOCAL=/path/to/three.min.js node tests/experiencetest.js
```

The contrast checks walk every rendered text node, resolve the effective background
by climbing the ancestor chain, and compare against the 4.5:1 (or 3:1 for large text)
threshold, in both themes and across every view. They bail out rather than guess on
text sitting over a gradient, so a clean run means measured, not assumed.
