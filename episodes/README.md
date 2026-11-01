# SoundWorld4D: Executable Scene Episodes

Two authored 32-second episodes combine downloaded 3D assets, recorded source audio, deterministic character animation and time-aligned annotations. This is an interactive research prototype, not the completed VLM data engine or a physically validated dataset.

## Open

From `soundworld-demo`, run `node server.mjs --port 4183`.

- Indoor: http://127.0.0.1:4183/episodes/index.html?scene=indoor
- Outdoor: http://127.0.0.1:4183/episodes/index.html?scene=outdoor

Play starts spatial audio. The first-person camera is the listener; the overview camera does not change reception. The event list seeks to each event. The telemetry table shows source distance, signed azimuth, elevation and path obstruction. Headphone buttons solo individual sources. Room reflections can be bypassed or adjusted for A/B audition. Download exports a script, frame labels, trajectory CSVs, a map and mixed / isolated spatial WAVs. All visible interface, source notes and generated stories are in English.

The overview defaults to named sources and the current Camera icon, without
debug-style path-point IDs. Camera / listener refers to the moving recording
pose, not the overhead viewing camera. Camera path points optionally displays
C0, C1, etc. with their times in seconds. Consecutive stationary camera poses
share one label with a time range (for example C0 / 0-16 s), even when the view
turns. Source paths retain their colors without P/G/R point labels. Map export
uses the current label mode. This changes annotation display only, not events,
trajectories, source IDs in data exports, or audio.

## Story and Motion

The indoor visitor opens the bedroom door and enters to speak. After the listener passes into the living room, she returns to the handle, pulls the door closed from 24 to 26.5 seconds and releases it. The closing effect's measured peak aligns with closure at 26.5 seconds. Door geometry, arm contact and the audio occlusion proxy share the same hinge state during playback and export. The effect is a recorded virtual pairing, not physically synthesized sound.

Outdoors, a visitor walks and speaks near a stream, pauses using a native standing animation, then continues as the listener crosses the bridge. Walk phase follows travelled distance, Idle has its own motion, and transitions blend rather than freezing a walking pose. Explicit animation times make backward seeking reproducible. Door interaction is authored motion plus inverse kinematics, not a learned policy or a contact-dynamics simulation.

`state.mjs` defines both stories, event dependencies, camera / source paths and door state. `getState()` drives rendering, audio and labels. S1 is fixed; S2 is the moving female speaker. Both episodes have exactly one footstep track (FP), bound to the visible visitor's native walk contact phases. Indoor footsteps cycle through eight actual wood footfalls; outdoor footsteps use eight grass footfalls. Deterministic take selection and speed-dependent levels avoid replaying an identical strike and remain reproducible after seeking. No pitch shifting is used. Contact emission windows preserve recorded decay, and footsteps have a reduced reflection send. Camera/listener motion adds no footstep audio. Indoor D1 is the door latch, and F1 is a pedestal fan with rotor motion and continuous operating sound. Each source has its own exported track. The fan is already on at episode start and keeps running throughout the clip; its visual speed is illustrative, not an RPM-calibrated acoustic model.

## Assets and Methods Alignment

The indoor music box (S1) emits from 0 to 32 seconds. Playback now uses AID's
`music_box_02_RHODE_NT1.wav`, with handling rumble filtered, transients compressed
and short edge fades. The earlier recording was quiet enough to be masked by
the fan and door occlusion. Original recordings and processing are retained in
`assets/audio/music-box-metadata.json`; `tools/prepare-music-audio.py` reproduces
the playback asset from the downloaded ZIP entry. Source position, distance
attenuation remains distance-based. Music has a quieter demonstration source
level and a reduced reflection send. Its occlusion settings attenuate and
low-pass both direct and reflected sound so the diffuse return cannot bypass
the intended muffling. These are audition settings, not measured wall
transmission coefficients. Its mechanism and sound now remain
active during the final camera turn towards the box, rather than stopping before
it comes into view. This is recorded
audio processing, not a newly generated melody or measured loudness calibration.
The outdoor S1 is the stream, not a music box. Use the Music / Melody headphone
button followed by Play to audition the indoor source alone.

Indoor continuous sources are mixed as quiet background sounds, with source
gains of 0.65 (music box), 0.4 (fan) and 0.3 (vacuum). Each has a reduced
reflection send and an occlusion profile that muffles its reflection path as
well as its direct path. Speech, footstep levels, source activity and trajectories
are unchanged. These are demonstration mix settings, not calibrated device SPLs.

- **Actual methods-library assets:** the door mesh is from VLNVerse (`kujiale_0003/Meshes/door_0000.usd`); music and speech are from AID and EARS. The USD is retained alongside an OpenUSD-derived browser geometry file. Display materials and hinge control are locally adapted. The inspected VLNVerse distribution did not specify a dataset license, so redistribution requires a separate permission check.
- **Additional human library:** Microsoft Rocketbox Female Adult 01, `f_walk_neutral` and `f_idle_neutral_01`, under the included MIT license. This is a realistic civilian model, not live-action footage. The EARS voice is a virtual pairing and has no lip sync.
- **Remaining scene substitutions:** the house is AWS RoboMaker Small House World (MIT-0), and the outdoor environment combines Poly Haven trees, rocks and ground texture (CC0) with authored paths, water, bridge and open-slat park benches. The previously downloaded red wooden benches are retained as unused source assets but no longer placed in the park. No piano model or piano sound is used outdoors. These are not relabelled as full VLNVerse or Infinigen scenes. Full replacement with those scene generators is not implemented here.
- **Audio:** AID supplies the anechoic music-box recording (CC BY 4.0); the old AID single-hit footstep is retained but unused. Footsteps now use Joseph Sardin's lossless BigSoundBank 1518 wood recording and SilentStrikeZ's Freesound 389625 grass HQ preview (CC0). Each provides eight distinct takes with mild band filtering and collection-level gain, not per-hit peak normalization. Cut points, licensing and limitations are recorded in `assets/audio/footsteps/manifest.json`; `tools/prepare-footsteps.py` reproduces the bank. These are surface-category pairings, not matched shoes, exact floors or validated dry sources. EARS p002 supplies female speech, 9.76475 seconds, checked against official metadata (CC BY-NC 4.0). The former male p008 is unused; no voice pitch shifting is applied. The latch is soundofsong's Freesound 647645 recording, the fan is TimBahrij's Freesound 191580 recording, and the stream is a Swale field-recording excerpt (all CC0, not anechoic). Originals/public previews are retained; reflection and fan processing is documented in `assets/audio/acoustics-metadata.json`.

`SOURCES.json` records provenance and limitations. `ASSET-MANIFEST.json` contains checksums. The proposed asset libraries are separate from what has actually been imported; no Isaac Sim integration is claimed for this browser viewer.

## Visual Rendering Upgrade

The viewer now uses image-based lighting, Neutral tone mapping, PBR-adapted house
materials, shadow-casting indoor spot lights, screen-space ambient occlusion,
and supersampled output. Standard, High and Ultra select display scales up to
1.5x, 2x and 3x respectively, with an 8.3-megapixel live-render cap. Standard
disables AO; mobile devices initially select Standard. The post-processing
buffers follow the actual drawing-buffer resolution. These settings affect
visual rendering only, not trajectories, event timing or source audio.
Neutral tone mapping replaces the earlier muted AgX look; indoor and outdoor
exposures are adjusted separately. No CSS saturation filter or artificial fog
is applied to the view.

The first-person view supports full screen and PNG capture with a 3840-pixel
long edge. Capture renders a new frame at that resolution, preserves the
current view's aspect ratio, and restores the preview afterwards. It is not
AI upscaling, a photorealistic replacement, or a 4K video export. Paused
episodes do not continuously re-render unchanged frames.

Poly Haven's CC0 Lebombo and Kloppenheim 06 pure-sky HDRIs supply approximate
display lighting. The sky-only outdoor background does not substitute a
photograph for navigable objects. Wood Floor Deck maps add wood surface detail;
Leafy Grass supplies the ground material; Grass Medium 02 adds real geometry
along the stream bank. The original Tree Small 02 leaf alpha is restored.
The bank geometry extends beyond the 24 x 18 m event region to avoid abrupt
background edges. The authored camera and source paths, timings, contact
animation and audio remain unchanged. Water reflection and animated normals
are visual effects, not a simulated flow field.

Asset URLs, licenses and checked file hashes are in
`assets/rendering/SOURCES.json`; the earlier `ASSET-MANIFEST.json` is an inventory
of the previous imports. `tools/prepare-render-assets.mjs` downloads this visual
layer and matching Three.js r180 add-ons. All assets are local at runtime.

The Rocketbox character and RoboMaker house are still older simulation assets.
Their geometric detail, facial animation and baked texture limitations remain;
these rendering changes do not make them photorealistic scans or establish
physical/acoustic fidelity. Lighting strengths and visual roughness are display
settings, not calibrated measurements. Before/after images are in
`output/render-upgrade/`.

## Additional Living Sources

The source checkboxes independently enable the dog (G1), perched bird (B1) and
robot vacuum (R1) where available. Outdoors, the dog and bird are initially on;
indoors, the robot is on and the dog is initially off. Body visibility, map
markers, trajectory overlays, telemetry, audio and exported activity flags
follow the same enabled state. Disabled isolated exports are silent.

Quaternius supplies the German shepherd with native Idle and Walk animation,
distributed through Poly Pizza with a CC BY 3.0 attribution requirement.
`assets/living/DOG-CREDITS.txt` retains the author, original source and license.
An authored alert-head motion accompanies recorded barks during planned stops;
it is not a native bark clip or jaw reconstruction. A separate quiet paw channel
uses recorded canine foley, not the person's shoe-step bank. The perched blackbird-like model has authored head and
beak motion. These are illustrative assets, not photorealistic scans or exact
physical-instance matches.

The vacuum is an authored 0.35 m diameter object with visible wheels, brushes,
lidar-style turret and operating light. Its motor runs from 2 to 28 seconds;
its authored living-room route does not represent autonomous navigation.
Recorded dog, bird and vacuum audio comes from BigSoundBank under CC0, not
oscillator approximations. Original WAVs, processing and hashes are retained
under `assets/living/`; `tools/prepare-living-assets.mjs` reproduces the imports.
These sounds are category-compatible, not anechoic or acoustically calibrated.

## Character Motion and Phone-call Staging

Door interaction constrains a palm grip point to the moving lever, rather than
placing the wrist joint directly on it. A door-relative hand pose orients the
palm, curls the fingers near contact, and opens them during release. Wrist
targets account for the grip-point offset, keeping the hand in front of the
door leaf. `tools/door-grip-test.mjs` samples skinned hand vertices throughout
approach, opening, closing and release, checks grip alignment and deterministic
seeking, and saves close-up views. This remains authored IK motion, not a
learned grasp policy, force-based hand contact or a full-body collision solver.

The visitor carries an authored smartphone in her left hand. A separate CCD
IK chain aligns the handset speaker with a head-relative ear point, accounting
for the grip offset. The phone rests against the palm with a diagonal finger
grip. A forward/downward elbow guide stabilizes the bend plane during walking,
and forearm pronation avoids concentrating rotation at the wrist. The pose
blends in before speech and out afterwards, leaving right-hand door interaction
unchanged. This is an authored pose, not force-based finger contact. The handset
is silent: the existing EARS recording remains attached to the person's
mouth-height source. This is visual phone-call staging, not a new recording,
two-sided dialogue or lip synchronization. `phoneWeight` is included in exports.

Continuous moving path segments share one locomotion envelope, so waypoint
crossings no longer repeatedly fade the walk into Idle. Turns use continuous,
deterministic angle transitions, including release from door contact. Native
human gait distance and footfall timings are unchanged.

The dog's positions follow cubic Bezier segments with shared corner velocities
and zero velocity at pauses. Its native vertical body motion is retained, loop
seams are blended, and playback phase follows distance with a stride estimated
from the native planted-paw motion. Bark/Idle weights blend without abrupt
pose switches. These edits do not make the stylized model photorealistic or
establish physical motion/contact accuracy. The map remains a waypoint guide;
exported frame positions contain the actual curved dog trajectory.

Regression tests: `tools/motion-state.test.mjs` and `tools/motion-phone-test.mjs`.
Before/after views are retained in `output/motion-phone/`.
`tools/phone-pose-test.mjs` additionally checks ear alignment, elbow clearance,
wrist bend, frame-to-frame continuity and deterministic joint reset across both
calls at 60 Hz, with close-ups in `output/phone-pose/`. Indoor rig diagnostic
views hide walls for the test camera only; normal episode rendering is unchanged.

### Paw audio and trajectory display

GP is a separate 130 ms paw-footfall channel. Its four contact phases come from
descending paw-height thresholds in the native dog clip and share the same
distance-driven gait phase as the visible legs. These are approximate kinematic
contacts, not a physics solver. Dog pauses produce no new contacts. Turning the
Dog option off disables its body, bark, paw audio and both timeline rows.

Indoor taps use Angellu16's Freesound 533824 dog recording (CC0); outdoor paw
foley uses congusbongus's soft-ground clips derived from sabotovat's Wolf run
(CC BY 3.0). Gains are deliberately lower than the human shoe channel. The
source's exact indoor floor material is undocumented; the outdoor bank is a
canine soft-ground proxy, not an instance-matched grass recording. Sources,
crop positions and licenses are in `assets/living/paws/manifest.json` and
`CREDITS.txt`. `tools/prepare-paw-audio.py` reproduces the processed banks;
`tools/prepare-paw-gait.mjs` extracts the native motion profile.

Motion and Audio have separate timeline groups. Hatched motion bars and solid
audio bars use named tracks and source-specific colors shared with telemetry
and map labels. Co-located shoe/paw emitters do not add duplicate body markers.
The map's Lucide camera icon follows the camera position; the blue triangle
turns with its horizontal optical field of view. Its short display length is
only an orientation cue, not a visibility-distance limit or an audio range.
The icon is excluded from first-person rendering.

## Acoustic Scope

Implemented: browser HRTF, inverse-distance attenuation, wall / animated-door raycasts controlling a gain and low-pass occlusion approximation, and indoor convolution reflections. Live playback and offline WAV export share the audio graph and discrete source scheduler. Gains are demonstration settings, not calibrated source power. Source-activity labels describe emission, not the subsequent reverberant tail.

Room reflections use pyroomacoustics 0.10.1 image-source shoebox responses with assumed dimensions and absorption. The bedroom target RT60 is 0.50 s; the living-room target is 0.75 s (estimated decay of the generated IR is about 0.92 s). Direct arrivals are removed from the wet responses, and IR energy is normalized for audition. Two fixed stereo responses crossfade across an authored listener-zone boundary. Reflections are not recomputed from the detailed house mesh or each moving source pose; door occlusion does not constitute a coupled-room reflection solver. No artificial indoor reverb is added outdoors. Source recordings that retain their own room cues remain an acknowledged limitation.

Not implemented or validated: measured house materials or impulse responses, full scene-dependent reflections, diffraction, transmission, Doppler, weather-dependent propagation or calibrated SPL. This prototype demonstrates linked assets, actions, paths and labels; it does not establish high-fidelity physical sound synthesis or complete causal coherence.

The Environment & acoustics readout shows the assumed room dimensions, average absorption, target and estimated IR decay times, live door state and authored listener IR zone. Atmosphere metadata uses an assumed 20 C, 50% relative humidity and 101.325 kPa baseline for both episodes. These are not measurements or documented settings of the original IR generation. Temperature, humidity, pressure, air absorption and weather do not drive the current audio renderer. The same values and explicit simulation-status flags are included in the sound-parameter JSON and episode exports. Outdoor readouts report no added environmental reflections rather than assigning a fictitious room decay time.

## Real-World Scanned Environments

The current house and outdoor assembly are not captured real-world point-cloud scenes. VLNVerse is an editable simulation resource; Infinigen is a procedural generator, not a scan dataset. A real-scan branch can use authorized textured meshes from [HM3D](https://aihabitat.org/datasets/hm3d/) as the static environment, with separate controllable objects inserted. Scanned doors and furniture usually cannot simply be articulated without segmentation and geometry repair. A point cloud can supply capture evidence or visual geometry, but surface reconstruction/proxy meshes, scale, collision/navigation structure and documented acoustic-material assumptions are still needed for the proposed planning and propagation calculations. This import branch is not implemented in the current demo.

## Outputs and Checks

`output/` contains English storyboards, trajectory overviews, 32-second first-person MP4s, stereo spatial WAVs, episode JSONs and 30 Hz camera / source annotations. Videos are 15 fps; outputs align by timestamps. Positions use metres and Y up. Relative coordinates use camera right/up/forward; positive azimuth is right, positive elevation is up. Door angle, contact weight and fan rotor angle are included in frame JSONs.

Run `node --test episodes/tools/state-test.mjs episodes/tools/footsteps-test.mjs` for timing, material-bank diversity and deterministic seek tests. `tools/browser-test.mjs` checks desktop / mobile canvases, playback, audio and ZIP exports. `tools/interaction-test.mjs` inspects hand contact and deterministic animation. `tools/acoustics-test.mjs` checks toe-contact timing, fan motion, discrete footsteps, a reverberant tail, solo/bypass controls and mix clipping. `tools/build-deliverables.mjs` generates screenshots, storyboards, audio and video using Chrome, Playwright and FFmpeg; `tools/audio-test.mjs` validates all exported WAVs. These signal/timing tests do not establish perceptual realism; listening judgment remains necessary.

Geometry audits use sampled rays, not full humanoid collision dynamics. Hand-contact errors are separately recorded. These are focused implementation checks, not the proposed Phase 3 multimodal verifier.
