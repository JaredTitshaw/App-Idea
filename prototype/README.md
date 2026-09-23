# Source

The two prototypes published as artifacts, kept here so the source outlives any
session.

| File | Published |
|---|---|
| `convene-web.html` | https://claude.ai/code/artifact/8004ec78-296c-47fa-bc32-7219aaa738c8 |
| `convene-app.html` | https://claude.ai/code/artifact/4ee53592-ca5e-407d-b02b-feba421d78d0 |

Each is a single self-contained file — no build step, no dependencies. Open it in
a browser, or publish it as an artifact.

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
node tests/contrast_new.js   # convene.html measured in every state, boot included
node tests/mobrepro.js       # phone layout: scrollable, timeline clear of the nav
node tests/bandtest.js       # globe sizing across the width range
```

The contrast checks walk every rendered text node, resolve the effective background
by climbing the ancestor chain, and compare against the 4.5:1 (or 3:1 for large text)
threshold, in both themes and across every view. They bail out rather than guess on
text sitting over a gradient, so a clean run means measured, not assumed.
