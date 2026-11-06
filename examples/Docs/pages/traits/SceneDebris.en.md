<!-- generated -->
# SceneDebris

SceneDebris: what breaks, and what is beamed away. Break(id, options) breaks a thing with a model into pieces that fly from where it was hit (options Point, Normal, Force (1), Pieces (how many across: 3)), tumble, fall, bounce on the ground and stay a while (Values.DebrisSeconds of the thing, 8) before they sink and go; its glass breaks into shards. The thing is gone (Remove) and the scene tells break ({ID, Pieces, Point}). The Vitals of ElemenxGaming break what dies with Health.Death break.

Teleport(id, place, options, callback) beams a thing with a model to a place ([x, y, z]; on a ground y is found): it breaks up into sparkling grains from the top, glowing in the light of the beam, in a column of motes; then it gathers again at the place the same way (options Seconds of each half, 1.4; Color of the beam). The event teleport tells each half ({ID, Phase: out or in, From, To}); callback(error, {ID, At}) when it stands there.

## Methods

- `Break(id, options)`
- `Teleport(id, place, options, callback)`
