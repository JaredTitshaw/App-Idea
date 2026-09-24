# Source

The prototypes published as artifacts, kept here so the source outlives any
session.

| File | Published |
|---|---|
| `convene-web.html` | https://claude.ai/code/artifact/8004ec78-296c-47fa-bc32-7219aaa738c8 |
| `convene-app.html` | https://claude.ai/code/artifact/4ee53592-ca5e-407d-b02b-feba421d78d0 |
| `convene.html` (the Field) | https://claude.ai/artifact/BHWzCY93bKbmHx29Snc3vs |
| `convene-experience.html` | https://claude.ai/artifact/LjTQt6Z6ntxRSoecp8sBq5 |

Each is a single self-contained file with no build step and no dependencies. Open it
in a browser, or publish it as an artifact.

## The Experience

`convene-experience.html` is an evening you scroll through. It shows a lake at dusk
inside a floating frame, drawn live in WebGL rather than from a photo. Behind the frame
is a blurred copy of the same view. Scrolling works like a clock: the sky runs from
alpenglow to night, and tonight's gatherings come up in the order they start. Each one
is a warm light on the far shore, and its name stands in the landscape between the
mountains and the village, reflected in the water.

| Station | Frame | In the landscape |
|---|---|---|
| Tonight | notched, with a card cut into the corner | WALK INTO / TONIGHT |
| Free | full-bleed | EVERYTHING HERE IS / FREE |
| Nine gatherings | slimmer frame, tiles along the bottom | FERIA, REPAIR, BAIRRO … LANTERNS |
| The Field | full-bleed, night | the last lights on the shore |
| Go out | notched again | NOTHING TO SIGN UP FOR · JUST / GO OUT |

The filters sit in the notch (kind, language, distance) and in the two corner toggles
(on my own, running now). The Ask box turns plain words into those same filters, so you
can always see what it understood. You can open a gathering by clicking its word in the
landscape, its tile, or the list. Saved gatherings and the day/night theme are stored
in this browser only. `#<id>` (for example `#lantern`) opens the page on that gathering.
With reduced motion the scene only moves when you scroll. Without WebGL, the words appear
as plain text over a gradient.

## Deep link

`convene.html#field` opens straight on the instrument, skipping the first-visit
feature wheel. `#list` and `#route` open those screens; with no hash it opens on Tonight. The suites use it so they test the field, and `wheeltest.js`
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
node tests/herotest.js       # convene.html as one framed screen: pickers, rail, screens, fit at every width
node tests/experiencetest.js     # the Experience: timeline, frame, gallery, filters, ask, save, fallbacks
node tests/contrast_experience.js # its text against the rendered landscape, both themes, every station
```

The two Experience suites run Chromium with SwiftShader so WebGL works headless.

The contrast checks walk every rendered text node, resolve the effective background
by climbing the ancestor chain, and compare against the 4.5:1 (or 3:1 for large text)
threshold, in both themes and across every view. They bail out rather than guess on
text sitting over a gradient, so a clean run means measured, not assumed.
