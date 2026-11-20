<!-- generated -->
# SceneGalaxy

SceneGalaxy: a galaxy as a setting of a scene (Setting galaxy; GalaxyData, docs/SPACE-FORMAT.md). Galaxy is what it shows: a key of GalaxyData.Use, the URL of its file, its data, or options of GalaxyData.Make ({Seed, Kind, Radius, Arms...}).

Its light and its dust are drawn along the ray of each pixel through its shape (GalaxyShapeShader, GalaxyVolumeShader: its thin and thick discs, its arms with clouds of young stars and pink knots on their ridges, beginning at the edge of its bulge or the ends of its bar, its halo; its dust in lanes and threads dimming what lies behind it; each octave of its noise only as fine as a pixel makes out there), with points of its stars and its knots of young ones over it; round the eye its stars one by one (GalaxyFieldShader: cubes of points laid round the eye, as bright as its light there) where its light would be a mist; from inside its disc, the band of it across the sky (a sky of SceneCosmos round its pole, its bulge towards its middle, made again as the eye goes far, in place of its rays: CosmosCubeOf). The eye takes its light as bright as it is (read back from the card a frame later; state Exposure fixes it). It is drawn coarse while the view moves, fine in a few rounds when it stops, then not at all till the view changes (the card rests). As the view comes near the stars of the sectors round it come one by one, each as bright as it is to the eye there: these are its real stars, made of its seed, each with its own system; a press picks the one seen under the pointer. The star picked is marked with its name, its ID and where it is; kept to a star (GalaxyFocus) the view comes as near as its system: the star itself, the bodies of its system marked where they are (a press picks one, two go into its system), and nearer the scene goes into its system by itself. Its black hole too ('centre', GalaxyFocus('')): the view keeps to it, the young stars that go round it close are marked, and its system (GalaxyData.System 'centre') comes as of a star. GalaxyTime (millions of years) turns it as a galaxy turns: the inner stars round sooner than the outer ones (a flat curve).

A drag turns the view round where it looks, a right drag (or with Shift) moves it along the plane of the galaxy, the wheel brings it near or far, a press on a star picks it (event galaxy: {ID, Star}; empty ID: the black hole or none), a double press flies to it; fingers as ever (tap, double tap, pan, pinch). Enter goes into the system of the star picked.

- GalaxyData(): the data shown (null till it came). GalaxyView(): {Target (ly, where it looks), Yaw, Pitch, Distance (ly)}; SetGalaxyView(view) puts it there. GalaxyFocus(id): the view flies to a star (or the centre: '').
- GalaxyStars(): the stars near the view as they are drawn now (each {ID, Name, Place (where it is at GalaxyTime), Mass, Class, Color...}). GalaxyPicked(): the ID of the star picked.
- EnterSystem(id, callback, options): the view flies into the star (options {Now: at once, as a ship jumped there}) and the scene shows its system (Setting space: its System of GalaxyData.System, its Cosmos of where it is in the galaxy); event enter {ID, Star, Key}. LeaveSystem(callback): out to the galaxy again, the view drawing back from the star; event leave {ID}. GalaxyEntered(): the ID of the star whose system is shown ('' in none).

## Methods

- `GalaxyData()`
- `GalaxyView()`
- `SetGalaxyView(view)`
- `GalaxyStars()`
- `GalaxyPicked()`
- `GalaxyEntered()`
- `GalaxyFocus(id)`
- `EnterSystem(id, callback, options)`
- `LeaveSystem(callback)`
