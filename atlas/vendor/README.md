# Atlas vendor libraries

Third-party libraries the atlas needs, **self-hosted** rather than loaded from a
CDN. Before July 20, 2026 these came from unpkg.com, which meant the atlas could
not initialize if unpkg was slow and was flat broken if unpkg was down — an
outage in someone else's infrastructure taking out a page whose data (`nyc.pmtiles`,
the glyph fonts, the geojson) is otherwise entirely local.

Versions are pinned in the filenames. The `index.html` `<script>` tags reference
these exact names, so an update is a deliberate act: download the new version
under its new filename, change the tags, test, commit. **Never hand-edit these
files** — they are build output, and a local edit would be silently destroyed by
the next update.

| File | Version | Source | License |
|---|---|---|---|
| `maplibre-gl-5.6.0.js` / `.css` | 5.6.0 | `https://unpkg.com/maplibre-gl@5.6.0/dist/` | 3-Clause BSD ([text](https://github.com/maplibre/maplibre-gl-js/blob/v5.6.0/LICENSE.txt)) |
| `pmtiles-4.3.0.js` | 4.3.0 | `https://unpkg.com/pmtiles@4.3.0/dist/` | BSD-3-Clause ([repo](https://github.com/protomaps/PMTiles)) |
| `basemaps-5.7.2.js` | 5.7.2 | `https://unpkg.com/@protomaps/basemaps@5.7.2/dist/` | BSD-3-Clause ([repo](https://github.com/protomaps/basemaps)) |

MapLibre's license header is preserved inside its file. The trailing
`//# sourceMappingURL=` comment was stripped from each script because the `.map`
files are not vendored, and leaving the comment makes devtools request a URL that
404s.

## Updating

```sh
cd atlas/vendor
curl -O -L https://unpkg.com/maplibre-gl@<NEW>/dist/maplibre-gl.js   # then rename with the version
```

Rename to `<name>-<version>.<ext>`, strip the trailing `sourceMappingURL` comment,
update the four tags in `../index.html`, and load `/atlas/` to confirm the basemap,
the neighborhood polygons, and the category dots all appear on a **cold** load
(hard-reload with the cache disabled — the whole class of bug this page has had is
first-load-only).

## What is still remote

The UI serif (`Source Serif 4`) still comes from Google Fonts, matching the rest
of the site — the MAP's own pages load it the same way, so self-hosting it here
alone would make the atlas's typography drift from everything around it. It is a
`font-display: swap` stylesheet, so a failure degrades to a fallback serif rather
than breaking the page. The map's own label glyphs (Libre Baskerville) are already
local, in `../fonts/`.
