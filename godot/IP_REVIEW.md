# Godot UI and visual IP review — 2026-10-10

Scope: Godot build based on main e962bf5 (godot-18), including field graphics, shared capsule renderer, battle launch/capture paths and asset provenance. This is an engineering review, not legal clearance.

## Changes and verification
- Field dialogue ends 16 logical pixels above the highest enlarged virtual control hit target. Portrait viewports 720×1280 and 720×1560 tested; actual virtual A dialogue advance tested.
- Starter capsules are children of the table, drawn after its texture and inheriting its Y-sort order. Three before selection; one after the player/rival choose and the lab is re-entered.
- Player uses the original chibi people/peopleBack player artwork at NPC height 90, instead of the differently proportioned walk atlas. Shader movement alternates arms/legs; turns, running, jumping and throwing remain.
- Capsule is an original teal faceted resonance lantern with brass ribs and a leaf-shaped luminous vein. Great/hyper variants use violet/amber. No red/white sphere, equatorial black band or center button. The shared renderer serves starter selection, field pickups, healing and BOTH battle send-out and capture; open/dim states retained.
- Settings expose engine and third-party notices plus Galmuri OFL text; font notice is included in all exports.
- Godot 4.7.2 regression scene and native OpenGL screenshots verified locally. CI runs regression before export and existing Android API36 install/launch, targetSdk36, arm64, signing and 16KB alignment checks.
- Tests are excluded from distributable exports.

## Evidence and limits
- assets/PROVENANCE.json records built-in image generation prompts and says original species/map layouts were used without third-party reference images. This records the stated provenance; it does not independently establish the origin of every historic design or commercial rights under every generation service's terms.
- Visually reviewed people.webp: the protagonist is the brown-haired teal-caped traveler; characters do not use the former red/white cap. Source search of Godot gameplay found no Pokémon/Pokéball brand names. Internal IDs such as ball, great and hyper remain save-compatible; they are not branding.
- Audio OGG files are rendered from repository procedural audio through tools/render-audio.cjs. Composition authorship and historical source originality still require the owner's records.
- Font license is present at godot/fonts/OFL-Galmuri.txt. Engine notices come from Engine.get_license_text/get_copyright_info/get_license_info rather than a copied version-dependent summary.
- The earlier species24 replacement is preserved. Unused walk.webp remains in repository history for traceability; current Player no longer renders it.
- Store listing, screenshots, icon and advertising must be checked separately for affiliation claims, brand names and copied imagery. Generated art is not an automatic exemption from IP rules.
- Visual redesign does not clear patents. Nintendo's 2024-09-19 announcement documents a patent lawsuit concerning another monster game; that announcement does not establish this game's infringement or any current case outcome. A jurisdiction-specific claim comparison by qualified counsel is needed before a commercial clearance conclusion. This review does not perform patent searches or a claim-by-claim analysis.

## Primary sources
- Google Play IP policy: https://support.google.com/googleplay/android-developer/answer/9888072?hl=en
- Google Play impersonation policy: https://support.google.com/googleplay/android-developer/answer/9888374?hl=en
- Godot license guidance: https://docs.godotengine.org/en/stable/about/complying_with_licenses.html
- Nintendo patent suit announcement (historical): https://www.nintendo.co.jp/corporate/release/en/2024/240919.html

The original red/white spherical design was a recognizable similarity risk; no court determination about this asset is claimed. These changes reduce identified visual similarity and improve notices, but do not guarantee non-infringement or Play approval.
