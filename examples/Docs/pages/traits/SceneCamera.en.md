<!-- generated -->
# SceneCamera

SceneCamera: the cameras of a scene, each an object of kind camera (the trait Camera) with a lens of a real one. The property Camera of the scene (an ID; empty: the view of the scene, as before) or UseCamera(id, {Fly}) says which one shows the world: at once (a cut) or flying to it in Fly seconds; Cameras() lists them.

- Where it stands: X and Y on the map, Lift over the ground (1.6) or Z (a height of its own), turned by Yaw (degrees, 0 looks along +Z as a facing does), Pitch (up) and Roll; Target (an ID) turns it to an object, the middle of its body; Follow (an ID) carries it with an object, At [x, up, ahead] metres from it, turned with it (a camera on a car; one that pitches and rolls, its Turn, takes the camera with it). Rig: tripod, handheld, gimbal, steadicam or drone (see rigged).
- Its lens: Focal (mm, 35) on a sensor Sensor mm wide (36: full frame) gives the angle of the view; Aperture (the f-number, 2.8; empty: all sharp) blurs what is out of focus as a lens of that focal length does, Focus (metres; empty: the Target, or what the middle of the view shows, followed slowly).
- Its exposure: with Aperture, ISO and Shutter (seconds: 0.008 is 1/125) all given it is theirs alone, no eye that opens and shuts (f/16, 1/100 s, ISO 100 under the noon sun shows it as the eye does; ND, stops of a grey filter, darkens it); else the eye of the scene as before. Compensation (stops) adds to either. A Shutter blurs the picture by how the camera moved while it was open (only the camera: what moves before it stays sharp); ISO over 100 brings the grain of it.
- Its filters and its look: Polarizer (0 to 1: takes the reflections off water, glass and what is wet, deepens the sky), Filter (a color over the lens), Temperature (the white balance, K: 6500 is daylight; lower makes the picture bluer) and Tint (-1 green to 1 magenta), Saturation and Contrast (1), LUT (the URL of a strip of a table of colors, its slices side by side, N*N wide and N tall), Aberration (0 to 1: the colors part at the edges), Distortion (-1 a barrel to 1 a pincushion), Vignette (0 to 1; empty: as a lens that open darkens its corners), Grain (0 to 1; empty: of its ISO).

Lens() of the engine gives what the passes of the picture use of the camera that shows the world: {Fov, Exposure (a number when it is its own, else null), Compensation, Coc ({Focal, Scale}: how big the circle of a blur is, null for none), Focus, Shutter, Balance [r, g, b], Saturation, Contrast, Grain, Vignette, Aberration, Distortion, Polarizer, LUT, Cut}.

## Methods

- `UseCamera(id, options)`
- `Cameras()`
