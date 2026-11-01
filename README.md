# SoundWorld4D Demo

Interactive indoor and outdoor audiovisual episodes with first-person playback,
spatial audio, event timelines, source trajectories and a camera/listener map.
This snapshot includes the latest phone-call pose, door interaction and restored
bedroom wall, named map labels, source-level audio balance, and the material and
sound-parameter inspector with live values and JSON export.

## Run locally

With Node.js 18 or newer, run from this directory:

```sh
node serve.mjs
```

Open `http://127.0.0.1:8080/`. No package installation, API key or external model
service is required. For another port, run `node serve.mjs --port 8081`.
Opening the HTML through `file://` will not work because modules and assets need
HTTP or HTTPS. Click Play to enable audio; headphones are recommended.

## GitHub Repository and Pages

Extract the ZIP and use the **contents of `soundworld4d-github/`** as the repository
root, with `index.html`, `episodes/` and `vendor/` at the top level. Do not commit
the ZIP itself. The package contains the runtime assets, not development logs,
test renders, credentials or unused high-resolution originals.

For GitHub Pages, publish the repository root using the repository's Pages
settings after confirming the third-party redistribution conditions below.
The included `.nojekyll` keeps the site as static files. No build is required.
Relative asset paths support repository sites such as
`https://YOUR-ACCOUNT.github.io/YOUR-REPOSITORY/`.

- Indoor: `episodes/index.html?scene=indoor`
- Outdoor: `episodes/index.html?scene=outdoor`

GitHub does not unpack a ZIP into a working website. Upload or push the extracted
files while preserving their directory structure. `bundle-summary.json` lists
the package size, largest files and files exceeding GitHub upload thresholds.
For many files, a Git client is more convenient than repeated browser uploads.

## Contents

- `episodes/`: viewer source and local models, textures, animations and audio.
- `vendor/`: local Three.js, Lucide and JSZip dependencies and license notices.
- `assets/`: shared ground texture and stream recording.
- `serve.mjs`, `scripts/`: optional local preview server.
- `THIRD_PARTY_NOTICES.md`, `episodes/SOURCES.json`: resource provenance and terms.
- `DEPLOYMENT-MANIFEST.json`: packaged-file sizes and SHA-256 checksums.

The material and sound parameters appear below the event timeline. They identify
recording-to-material assignments, animation-based emission timing, distance and
occlusion settings, and assumed room responses. Both the parameter download and
the episode ZIP include the current parameter report. Visual material labels and
assumed acoustic values are distinguished from measured physical properties.

## Scope and Resource Permissions

This is an authored research demo, not the completed automated generation engine.
It does not include a running VLM director or trained verifier. Its HRTF,
occlusion and room responses are demonstration approximations, not validated
full-scene physical acoustics. See `episodes/README.md` for the technical notes.

**The ZIP is not blanket permission to redistribute third-party assets.**
Existing records identify EARS speech as CC BY-NC 4.0, and do not establish
redistribution permission for the VLNVerse-derived door. Confirm permission or
replace affected assets before making the repository or site public. Retain all
attributions, licenses and source records. Packaging does not change any resource
license, and no new project-wide license is asserted by this release.
