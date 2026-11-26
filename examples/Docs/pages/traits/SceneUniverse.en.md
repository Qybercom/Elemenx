<!-- generated -->
# SceneUniverse

SceneUniverse: a universe as a setting of a scene (Setting universe; UniverseData, docs/UNIVERSE-FORMAT.md). Universe is what it shows: a key of UniverseData.Use, the URL of its file, its data, or options of UniverseData.Make ({Seed, Galaxies, Home...}).

Its galaxies round where the view looks are drawn as they are (the far galaxies of a backdrop: CosmosGalaxyGLSL of SceneCosmos, each of its kind, its north and its seed), as large as they are and as far: a few pixels far off, a disc of arms near; their light falls off as far as their size does (a galaxy smaller than a pixel is a faint point). Their places are megaparsecs (Mpc) from the cube round the view, so the numbers stay small however far it is. A drag turns the view round where it looks, a right drag (or with Shift) moves it, the wheel brings it near or far, a press picks a galaxy (event universe: {ID, Galaxy}), a double press flies to it; fingers as ever. Enter, or coming as near as a few of its radii to the galaxy the view keeps to, goes into it: the scene shows it (Setting galaxy, its Galaxy the data of it, UniverseData.Galaxy), and the systems of its stars see the galaxies round it in their skies (UniverseSky: Far of SceneCosmos). The picked one is marked with its name, its kind and how far it is.

- UniverseData(): the data shown (null till it came). UniverseView(): {Target [x, y, z] (Mpc), Yaw, Pitch, Distance (Mpc)}; SetUniverseView(view). UniverseFocus(id): the view flies to a galaxy. UniversePicked(): the ID picked.
- UniverseGalaxies(): the galaxies round the view as they are drawn ({ID, Name, Kind, Radius, Place, Distance}).
- EnterGalaxy(id, callback, options): into a galaxy (options {Now: at once}); event entergalaxy {ID, Galaxy, Key}. LeaveGalaxy(callback): out to the universe again, the view drawing back from the galaxy; event leavegalaxy {ID}. UniverseEntered(): the ID of the galaxy shown ('' in none).
- UniverseSky(id): the far galaxies seen from a galaxy of the universe, as a backdrop has them (UniverseData.Sky), or null when it is not one of the universe shown.
- UniversePlace(): where the scene lies in its universe (Mpc): the galaxy entered, the place between galaxies it stands in, where the map looks; null with no universe. UniverseDeparture(toward): where a jump between galaxies leaves from toward a place: the edge of the galaxy entered on that side, or the place between galaxies.
- EnterUniverseGalaxy(id, from, callback): into a galaxy at its edge, in the system of the star there nearest the way from a place (Mpc; what a jump between galaxies arrives at: SceneVehicles), callback(error, star ID); UniverseEdge(id, from): that star.
- EnterVoid(place, callback): the scene stands between galaxies at a place (Mpc): empty space, no system, the galaxies round it in its sky as they are seen from there (UniverseData.SkyFrom), its own galaxy a great disc near it; event entervoid {Place}. UniverseVoid(): that place (null in a galaxy).

## Methods

- `UniverseData()`
- `UniverseView()`
- `SetUniverseView(view)`
- `UniverseGalaxies()`
- `UniversePicked()`
- `UniverseEntered()`
- `UniverseFocus(id)`
- `EnterGalaxy(id, callback, options)`
- `LeaveGalaxy(callback)`
- `UniversePlace()`
- `UniverseDeparture(toward)`
- `UniverseVoid()`
- `UniverseEdge(id, from)`
- `EnterUniverseGalaxy(id, from, callback)`
- `EnterVoid(place, callback)`
- `UniverseSky(id)`
