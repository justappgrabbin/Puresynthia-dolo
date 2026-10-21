# Synthia Recursive Media Field v1.1

This revision wires the existing Synthia/Klein machinery into the media field.

## Added in v1.1

- State-driven Boolean operator switching using the exact operator-bank design preserved in `unified.zip`
- XNOR is no longer globally privileged
- All 16 binary Boolean functions are available
- Per-state operator reputation and reinforcement
- Existing Integrated ToolFactory v1.3 vendored and connected to changing-line events
- Changing-line events choose ToolFactory structural level
- Generated tools can attach recursively to the originating 64-node automaton
- Skeletal sprite rig with head, torso, left/right arms, left/right legs, rear/secondary layer
- Per-part centroid, orientation, spread, translation, rotation, and scale estimation
- Articulated morph renderer replaces the previous whole-frame affine dissolve as the default
- Addresses preserve operator selection and inferred Fu-Xi state

## Architectural path

sprite/frame
→ addressed visual state
→ 64-node recursive field
→ state-based Boolean operator switcher
→ changing-line event
→ Integrated ToolFactory
→ generated child capability
→ skeletal morph renderer
→ animation
→ future outcome reinforcement

## Run

```bash
python -m http.server 8080
```

Open:

`http://localhost:8080/demo.html`

## Important

The automatic rig is intentionally generic. It uses normalized body regions so it works without an ML pose estimator. The next refinement should learn or accept character-specific joint anchors and deformation meshes, then store those anchors as addressed persistent character structure.
