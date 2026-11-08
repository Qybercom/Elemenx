<!-- generated -->
# SceneProbes

Probes: the light that bounces, worked out round the eye of a Scene with a ground, at high and ultra (Graphics().Probes).

What stands round the eye, 64 metres a side and 32 high, is laid in voxels of a metre: slabs of a metre drawn along each of the three axes in their colors (a floor in a slab across y, a wall in one across x or z), a few slabs a frame, then joined (Merge). Each voxel is lit (Lit): the sun as far as the voxels let it to it, the lamps, and what the probes already gather there, so light goes on bouncing frame after frame. A grid of probes two metres apart (32 by 16 by 32) sends 32 rays each through the voxels (Rays), from a free voxel of its block (a probe in a wall is moved out of it), a part of them each frame, each frame other ways: what a ray meets gives its light, what meets nothing the sky. The probes keep what came to them from all round (Reduce: spherical harmonics of the first band, mixed with what they had). Each voxel then gets what its eight probes round it give as far as they see it (Volume), and each surface reads that of the voxels by it (aroundLight of Renderer): its programs pay nothing for it. A room is dark but for its window, under a roof it is dim, a wall by a sunny meadow is green below. A probe in a wall takes what its neighbours have. What walks (models with a skeleton) is not laid: it gets light, it gives none.

For what mirrors (Mirror of SceneLighting) a map of what is round the eye is drawn too: a ray from the eye through the voxels for each texel of an octahedral map (Around), its mipmaps the blur of what is rough, the sky where it met nothing.

The grid follows the eye by 16 metres; while it is laid again the last one is used, then the probes are moved with it. scene.Tuned.Probes false turns it off (to see the picture without it).
