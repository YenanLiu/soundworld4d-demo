# SoundWorld4D: Executable Scene Episodes

Two authored 32-second episodes combine downloaded 3D assets, recorded source audio, deterministic character animation and time-aligned annotations. This is an interactive research prototype, not the completed VLM data engine or a physically validated dataset.

## Open

From `soundworld-demo`, run `node server.mjs --port 4183`.

- Indoor: http://127.0.0.1:4183/episodes/index.html?scene=indoor
- Outdoor: http://127.0.0.1:4183/episodes/index.html?scene=outdoor

Play starts spatial audio. The first-person camera is the listener; the overview camera does not change reception. The event list seeks to each event. The telemetry table shows source distance, signed azimuth, elevation and path obstruction. Headphone buttons solo individual sources. Room reflections can be bypassed or adjusted for A/B audition. Download exports a script, frame labels, trajectory CSVs, a map and mixed / isolated spatial WAVs. All visible interface, source notes and generated stories are in English.

## Story and Motion

The indoor visitor opens the bedroom door and enters to speak. After the listener passes into the living room, she returns to the handle, pulls the door closed from 24 to 26.5 seconds and releases it. The closing effect's measured peak aligns with closure at 26.5 seconds. Door geometry, arm contact and the audio occlusion proxy share the same hinge state during playback and export. The effect is a recorded virtual pairing, not physically synthesized sound.

Outdoors, a visitor walks and speaks near a stream, pauses using a native standing animation, then continues as the listener crosses the bridge. Walk phase follows travelled distance, Idle has its own motion, and transitions blend rather than freezing a walking pose. Explicit animation times make backward seeking reproducible. Door interaction is authored motion plus inverse kinematics, not a learned policy or a contact-dynamics simulation.

`state.mjs` defines both stories, event dependencies, camera / source paths and door state. `getState()` drives rendering, audio and labels. S1 is fixed; S2 is the moving female speaker. Both episodes have exactly one footstep track (FP), bound to the visible visitor's native walk contact phases. Indoor footsteps cycle through eight actual wood footfalls; outdoor footsteps use eight grass footfalls. Deterministic take selection and speed-dependent levels avoid replaying an identical strike and remain reproducible after seeking. No pitch shifting is used. Contact emission windows preserve recorded decay, and footsteps have a reduced reflection send. Camera/listener motion adds no footstep audio. Indoor D1 is the door latch, and F1 is a pedestal fan with rotor motion and continuous operating sound. Each source has its own exported track. The fan is already on at episode start and keeps running throughout the clip; its visual speed is illustrative, not an RPM-calibrated acoustic model.

## Assets and Methods Alignment

- **Actual methods-library assets:** the door mesh is from VLNVerse (`kujiale_0003/Meshes/door_0000.usd`); music and speech are from AID and EARS. The USD is retained alongside an OpenUSD-derived browser geometry file. Display materials and hinge control are locally adapted. The inspected VLNVerse distribution did not specify a dataset license, so redistribution requires a separate permission check.
- **Additional human library:** Microsoft Rocketbox Female Adult 01, `f_walk_neutral` and `f_idle_neutral_01`, under the included MIT license. This is a realistic civilian model, not live-action footage. The EARS voice is a virtual pairing and has no lip sync.
- **Remaining scene substitutions:** the house is AWS RoboMaker Small House World (MIT-0), and the outdoor environment combines Poly Haven trees, rocks and ground texture (CC0) with authored paths, water, bridge and open-slat park benches. The previously downloaded red wooden benches are retained as unused source assets but no longer placed in the park. No piano model or piano sound is used outdoors. These are not relabelled as full VLNVerse or Infinigen scenes. Full replacement with those scene generators is not implemented here.
- **Audio:** AID supplies the anechoic music-box recording (CC BY 4.0); the old AID single-hit footstep is retained but unused. Footsteps now use Joseph Sardin's lossless BigSoundBank 1518 wood recording and SilentStrikeZ's Freesound 389625 grass HQ preview (CC0). Each provides eight distinct takes with mild band filtering and collection-level gain, not per-hit peak normalization. Cut points, licensing and limitations are recorded in `assets/audio/footsteps/manifest.json`; `tools/prepare-footsteps.py` reproduces the bank. These are surface-category pairings, not matched shoes, exact floors or validated dry sources. EARS p002 supplies female speech, 9.76475 seconds, checked against official metadata (CC BY-NC 4.0). The former male p008 is unused; no voice pitch shifting is applied. The latch is soundofsong's Freesound 647645 recording, the fan is TimBahrij's Freesound 191580 recording, and the stream is a Swale field-recording excerpt (all CC0, not anechoic). Originals/public previews are retained; reflection and fan processing is documented in `assets/audio/acoustics-metadata.json`.

`SOURCES.json` records provenance and limitations. `ASSET-MANIFEST.json` contains checksums. The proposed asset libraries are separate from what has actually been imported; no Isaac Sim integration is claimed for this browser viewer.

## Acoustic Scope

Implemented: browser HRTF, inverse-distance attenuation, wall / animated-door raycasts controlling a gain and low-pass occlusion approximation, and indoor convolution reflections. Live playback and offline WAV export share the audio graph and discrete source scheduler. Gains are demonstration settings, not calibrated source power. Source-activity labels describe emission, not the subsequent reverberant tail.

Room reflections use pyroomacoustics 0.10.1 image-source shoebox responses with assumed dimensions and absorption. The bedroom target RT60 is 0.50 s; the living-room target is 0.75 s (estimated decay of the generated IR is about 0.92 s). Direct arrivals are removed from the wet responses, and IR energy is normalized for audition. Two fixed stereo responses crossfade across an authored listener-zone boundary. Reflections are not recomputed from the detailed house mesh or each moving source pose; door occlusion does not constitute a coupled-room reflection solver. No artificial indoor reverb is added outdoors. Source recordings that retain their own room cues remain an acknowledged limitation.

Not implemented or validated: measured house materials or impulse responses, full scene-dependent reflections, diffraction, transmission, Doppler, weather-dependent propagation or calibrated SPL. This prototype demonstrates linked assets, actions, paths and labels; it does not establish high-fidelity physical sound synthesis or complete causal coherence.

## Real-World Scanned Environments

The current house and outdoor assembly are not captured real-world point-cloud scenes. VLNVerse is an editable simulation resource; Infinigen is a procedural generator, not a scan dataset. A real-scan branch can use authorized textured meshes from [HM3D](https://aihabitat.org/datasets/hm3d/) as the static environment, with separate controllable objects inserted. Scanned doors and furniture usually cannot simply be articulated without segmentation and geometry repair. A point cloud can supply capture evidence or visual geometry, but surface reconstruction/proxy meshes, scale, collision/navigation structure and documented acoustic-material assumptions are still needed for the proposed planning and propagation calculations. This import branch is not implemented in the current demo.

## Outputs and Checks

`output/` contains English storyboards, trajectory overviews, 32-second first-person MP4s, stereo spatial WAVs, episode JSONs and 30 Hz camera / source annotations. Videos are 15 fps; outputs align by timestamps. Positions use metres and Y up. Relative coordinates use camera right/up/forward; positive azimuth is right, positive elevation is up. Door angle, contact weight and fan rotor angle are included in frame JSONs.

Run `node --test episodes/tools/state-test.mjs episodes/tools/footsteps-test.mjs` for timing, material-bank diversity and deterministic seek tests. `tools/browser-test.mjs` checks desktop / mobile canvases, playback, audio and ZIP exports. `tools/interaction-test.mjs` inspects hand contact and deterministic animation. `tools/acoustics-test.mjs` checks toe-contact timing, fan motion, discrete footsteps, a reverberant tail, solo/bypass controls and mix clipping. `tools/build-deliverables.mjs` generates screenshots, storyboards, audio and video using Chrome, Playwright and FFmpeg; `tools/audio-test.mjs` validates all exported WAVs. These signal/timing tests do not establish perceptual realism; listening judgment remains necessary.

Geometry audits use sampled rays, not full humanoid collision dynamics. Hand-contact errors are separately recorded. These are focused implementation checks, not the proposed Phase 3 multimodal verifier.
