<!-- generated -->
# SceneLighting

Lighting: what a Scene does with its light after it drew. It draws into a texture of floats, so a sun can be far brighter than white, and makes the picture of it: the air between the eye and what it sees (Fog of the distance), rays of the sun through what stands before it, the darkening of corners (ambient occlusion), the glow of what is too bright (bloom), and a filmic curve (ACES) that keeps the colors of highlights.

The bounce of the sun: the view of a map from the sun, in colors and a few times a second, is blurred into a texture every surface reads, so a shadow on a meadow turns green and a wall by a sunny field is lit from below (one bounce, as far as the shadows reach).

The light of a field, instead of the bounce, at high and ultra: all of a ground is drawn from above into a map of colors and heights, houses and trees too. On it each place looks round along twelve ways for what stands near: what it hides of the sky, and what light comes from there, lit by the sun or by the light that already came to it, so light goes on bouncing. A valley is darker than a hill, a shadow by a sunny wall takes its color, a forest is dim under its leaves. It is worked out in strips, a few frames for all of it, and again when the sun or what stands on the ground changes. It sees a height for each place: nothing under a roof, as the outdoors of a game needs no more.

Quality: low, medium, high or ultra; empty chooses by the graphics card and steps down while frames are late.

- low: no picture after the drawing, one shadow, the masses nearer, no grass. A machine with no graphics card gets it.
- medium: bloom, the air, edges smoothed (4 samples).
- high: two shadow maps, rays, ambient occlusion at half size, the bounce, water that mirrors what is on the screen, and frames that add up (TAA: the view shakes by less than a pixel, and each frame is mixed with the last), so what is thin, as grass, does not shimmer.
- ultra: ambient occlusion at full size, the masses farther.

Colors in the texture are encoded by a gamma of 2.2, as the shaders of the scene write them; the picture decodes them.
