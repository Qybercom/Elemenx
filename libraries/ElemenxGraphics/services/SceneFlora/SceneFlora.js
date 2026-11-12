/*
 * SceneFlora: realistic plants of code, a species a preset of numbers (and later of a picture of it: FloraEditor), each
 * plant of it another of its seed: no file, the same plant for the same seed.
 * - A plant grows as plants do: a trunk (or several stems) up to its crown, then its branches toward the light, by space
 *   colonization (points scattered in the shape of its crown draw the nearest buds toward them, each bud a step a time,
 *   a point reached is used up: Runions 2007); a spruce in whorls (a leader and its tiers of branches); a palm a curved
 *   trunk and its fronds. Its branches as thick as the pipes of what they carry (da Vinci: the sum of the children's
 *   radii to the power Pipe is the parent's), tubes with their bark laid along them; its leaves cards of clusters of
 *   leaves or tufts of needles, lit as the round of its crown is; dead stubs on its bare trunk.
 * - Its textures are drawn of code too: its bark (the height of the plant along it: a pine dark below, orange above; its
 *   relief a normal map) and its leaves (an atlas of four clusters, their alpha the cut, and below them the same in
 *   shade: the leaves deep in its crown). A preset may give its own
 *   pictures instead (Bark.Image, Leaves.Image: {Width, Height, Data} RGBA).
 * - Species() the names of its presets; Preset(name) a copy of one (with what it does not tell); Tree(preset, variant)
 *   the plant {Height, Bark: geometry, Leaves: geometry ({Positions, Normals, UVs, Indices}, metres, standing on 0),
 *   Triangles, Nodes}; Textures(preset) its pictures {Bark, BarkNormal, Leaves} ({Width, Height, Data}); Asset(tree,
 *   textures) the plant as Gltf gives a file (two materials: bark, leaves cut by their alpha and seen from both sides).
 * - FromPicture(picture, base) a species of a photograph of a plant on white or clear (its reference): its bare trunk,
 *   the profile, width, lean and holes of its crown, the colors of its leaves and of its bark; {Preset, Found}.
 * - Define(name, preset or species, options {Variants (8), Size, Sway, Group, Keep (false: not kept in the browser, a
 *   preview of FloraEditor)}) makes it a model of SceneModels: its
 *   Variants made in workers (Work) the first time one is asked for, each another plant of the species; kept in the
 *   browser (SceneCache, under Key(preset, variants)) and taken from there the next time.
 * The same in a page, a worker and Node: it reads no page.
 */
Elemenx.Service('SceneFlora', {
	$Meta: {
		Description: 'Realistic plants of code: trunks and branches grown by space colonization (whorls for spruces, fronds for palms), bark and leaves drawn of code, each plant of a species another.',
		Methods: ['Species()', 'Preset(name)', 'Far(name)', 'Tree(preset, variant)', 'Textures(preset)', 'Asset(tree, textures)', 'Define(name, preset, options)', 'FromPicture(picture, base)', 'Key(preset, variants)', 'Work()', 'Source(names)']
	},

	/*
	 * The species: Grow (colonize, whorls, palm), Height [low, high] metres; Trunk {Bare (of the height, under the
	 * crown), Radius (of the base, of the height), Lean, Wander, Stems, Flare, Stubs, Leader (the trunk goes on through the
	 * crown)}; Crown {Profile [[0 its foot to 1 its top, radius 0 to 1]...], Width (its widest radius, of the height),
	 * Lean, Clumps, Hollow (how much its points keep to its outside), Points}; Grow stalks (a clump of stalks: grasses,
	 * reeds, cereals, a sunflower, bamboo, a fern) its Trunk.Stems stalks within Crown.Width of its foot; Growth {Step, Reach, Kill (of the height),
	 * Up, Droop, Pipe, Cut (twigs thinner than Cut times the thinnest left to the leaves)}; Leaves {Kind (broad, needles,
	 * frond, compound: leaflets by pairs), Size (metres), Each (cards a twig), Hang (0 to 1: hanging down in curtains, a
	 * weeping willow), Narrow (0 to 1: long thin leaves), Bloom, Fruit (0 to 1: how many flowers, fruits on its twigs),
	 * BloomColor, BloomSize (small ones in clusters: a lilac), FruitColor, FruitSize (of a tile), Color, Shade, Light; of
	 * stalks: Kind blade (grass) or single (one big leaf) or frond, Each along each stalk from From of it, Base from the
	 * ground on a stalk of Stipe of their length, Rise [inner, outer] (the slope they start at), Wide (half their width
	 * of their length)}; Head {Kind (ear, panicle, cob, disc, burrs; none), Size (metres), Wide, Share (of its stalks), Color}:
	 * the heads of its stalks; Bark {Rings (of a ringed bark up the plant), Pattern (plates, birch, ridges, rings,
	 * smooth, fibrous: a sequoia, bands: a cherry, diamonds: an aspen), Low, High (colors), Split (where the high one
	 * begins, of the height)}; Simple: the plant of the simple style it stands for (PlantStyle of Scene).
	 */
	Presets: {
		pine: {Grow: 'colonize', Height: [16, 26], Trunk: {Bare: 0.6, Radius: 0.016, Lean: 0.04, Wander: 0.25, Stems: 1, Flare: 0.35, Stubs: 0.55, Leader: true}, Crown: {Profile: [[0, 0.35], [0.25, 0.85], [0.55, 1], [0.85, 0.7], [1, 0.25]], Width: 0.2, Lean: 0.25, Clumps: 0.6, Hollow: 0.35, Points: 1600}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.25, Droop: 0.05, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'needles', Size: 1.2, Each: 5, Color: [0.16, 0.3, 0.16], Shade: [0.07, 0.15, 0.08], Light: [0.32, 0.45, 0.24]}, Bark: {Pattern: 'plates', Low: [0.27, 0.22, 0.19], High: [0.74, 0.45, 0.28], Split: 0.35}},
		spruce: {Grow: 'whorls', Height: [14, 24], Trunk: {Bare: 0.08, Radius: 0.014, Lean: 0.01, Wander: 0.05, Stems: 1, Flare: 0.35, Stubs: 0.3, Leader: true}, Crown: {Profile: [[0, 1], [0.5, 0.62], [1, 0.04]], Width: 0.2, Lean: 0.05, Clumps: 0.25, Hollow: 0.5, Points: 0}, Growth: {Step: 0.02, Reach: 0, Kill: 0, Up: 0.15, Droop: 0.35, Pipe: 2.3, Cut: 1.2}, Leaves: {Kind: 'needles', Size: 1.1, Each: 3, Color: [0.11, 0.24, 0.15], Shade: [0.04, 0.11, 0.07], Light: [0.2, 0.36, 0.22]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.24, 0.2], High: [0.42, 0.33, 0.26], Split: 0.6}},
		oak: {Grow: 'colonize', Height: [14, 22], Trunk: {Bare: 0.28, Radius: 0.035, Lean: 0.05, Wander: 0.35, Stems: 1, Flare: 0.6, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.45], [0.2, 0.9], [0.5, 1], [0.8, 0.8], [1, 0.3]], Width: 0.48, Lean: 0.2, Clumps: 0.45, Hollow: 0.4, Points: 1600}, Growth: {Step: 0.017, Reach: 0.12, Kill: 0.024, Up: 0.08, Droop: 0.12, Pipe: 2.4, Cut: 2.4}, Leaves: {Kind: 'broad', Size: 1.6, Each: 4, Color: [0.15, 0.26, 0.09], Shade: [0.05, 0.11, 0.04], Light: [0.28, 0.4, 0.14]}, Bark: {Pattern: 'ridges', Low: [0.28, 0.25, 0.22], High: [0.36, 0.33, 0.29], Split: 0.5}},
		birch: {Grow: 'colonize', Height: [15, 24], Trunk: {Bare: 0.35, Radius: 0.013, Lean: 0.05, Wander: 0.3, Stems: 1, Flare: 0.25, Stubs: 0.45, Leader: true}, Crown: {Profile: [[0, 0.5], [0.3, 0.95], [0.6, 0.85], [1, 0.25]], Width: 0.24, Lean: 0.25, Clumps: 0.55, Hollow: 0.45, Points: 1500}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.12, Droop: 0.3, Pipe: 2.3, Cut: 1.5}, Leaves: {Kind: 'broad', Size: 1.2, Each: 4, Color: [0.24, 0.4, 0.12], Shade: [0.09, 0.18, 0.05], Light: [0.42, 0.56, 0.2]}, Bark: {Pattern: 'birch', Low: [0.2, 0.19, 0.18], High: [0.88, 0.87, 0.83], Split: 0.08}},
		palm: {Grow: 'palm', Height: [9, 15], Trunk: {Bare: 1, Radius: 0.02, Lean: 0.18, Wander: 0.1, Stems: 1, Flare: 0.45, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.3, Lean: 0, Clumps: 0, Hollow: 0, Points: 26}, Growth: {Step: 0.05, Reach: 0, Kill: 0, Up: 0, Droop: 0.45, Pipe: 2, Cut: 1}, Leaves: {Kind: 'frond', Size: 4.6, Each: 1, Color: [0.24, 0.38, 0.13], Shade: [0.1, 0.18, 0.06], Light: [0.45, 0.56, 0.22]}, Bark: {Pattern: 'rings', Low: [0.4, 0.35, 0.29], High: [0.52, 0.46, 0.37], Split: 0.5}},
		bush: {Grow: 'colonize', Height: [1.4, 2.6], Trunk: {Bare: 0.08, Radius: 0.012, Lean: 0.3, Wander: 0.4, Stems: 5, Flare: 0, Stubs: 0, Leader: false}, Crown: {Profile: [[0, 0.55], [0.35, 1], [0.75, 0.85], [1, 0.3]], Width: 0.55, Lean: 0.2, Clumps: 0.4, Hollow: 0.4, Points: 450}, Growth: {Step: 0.035, Reach: 0.2, Kill: 0.045, Up: 0.15, Droop: 0.05, Pipe: 2.2, Cut: 1.3}, Leaves: {Kind: 'broad', Size: 0.55, Each: 4, Color: [0.17, 0.29, 0.1], Shade: [0.06, 0.13, 0.04], Light: [0.32, 0.44, 0.17]}, Bark: {Pattern: 'smooth', Low: [0.3, 0.26, 0.22], High: [0.38, 0.33, 0.27], Split: 0.5}},
		aspen: {Grow: 'colonize', Height: [14, 22], Simple: 'birch', Trunk: {Bare: 0.5, Radius: 0.011, Lean: 0.04, Wander: 0.25, Stems: 1, Flare: 0.2, Stubs: 0.6, Leader: true}, Crown: {Profile: [[0, 0.5], [0.3, 0.9], [0.65, 0.8], [1, 0.2]], Width: 0.2, Lean: 0.25, Clumps: 0.6, Hollow: 0.45, Points: 1100}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.22, Droop: 0.1, Pipe: 2.3, Cut: 1.5}, Leaves: {Kind: 'broad', Size: 1, Each: 4, Color: [0.26, 0.4, 0.14], Shade: [0.1, 0.18, 0.06], Light: [0.48, 0.58, 0.24]}, Bark: {Pattern: 'diamonds', Low: [0.2, 0.2, 0.18], High: [0.7, 0.73, 0.64], Split: 0.1}},
		sequoia: {Grow: 'whorls', Height: [32, 46], Simple: 'sequoia', Trunk: {Bare: 0.3, Radius: 0.028, Lean: 0.01, Wander: 0.06, Stems: 1, Flare: 0.9, Stubs: 0.6, Leader: true}, Crown: {Profile: [[0, 0.75], [0.4, 0.6], [0.8, 0.3], [1, 0.05]], Width: 0.13, Lean: 0.05, Clumps: 0.35, Hollow: 0.5, Points: 0}, Growth: {Step: 0.016, Reach: 0, Kill: 0, Up: 0.12, Droop: 0.25, Pipe: 2.4, Cut: 1.2}, Leaves: {Kind: 'needles', Size: 1.3, Each: 3, Hang: 0.35, Color: [0.16, 0.27, 0.13], Shade: [0.06, 0.12, 0.06], Light: [0.3, 0.42, 0.2]}, Bark: {Pattern: 'fibrous', Low: [0.36, 0.18, 0.11], High: [0.5, 0.27, 0.17], Split: 0.5}},
		willow: {Grow: 'colonize', Height: [10, 16], Simple: 'oak', Trunk: {Bare: 0.3, Radius: 0.045, Lean: 0.15, Wander: 0.6, Stems: 1, Flare: 0.6, Stubs: 0.15, Leader: false}, Crown: {Profile: [[0, 0.6], [0.3, 1], [0.7, 0.95], [1, 0.45]], Width: 0.55, Lean: 0.25, Clumps: 0.45, Hollow: 0.6, Points: 1100}, Growth: {Step: 0.018, Reach: 0.13, Kill: 0.026, Up: 0.18, Droop: 0.35, Pipe: 2.4, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 1.3, Each: 3, Hang: 0.9, Narrow: 0.8, Color: [0.24, 0.36, 0.13], Shade: [0.09, 0.16, 0.05], Light: [0.44, 0.54, 0.22]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.26, 0.21], High: [0.38, 0.33, 0.26], Split: 0.5}},
		poplar: {Grow: 'colonize', Height: [20, 30], Simple: 'birch', Trunk: {Bare: 0.06, Radius: 0.016, Lean: 0.01, Wander: 0.15, Stems: 1, Flare: 0.3, Stubs: 0.2, Leader: true}, Crown: {Profile: [[0, 0.5], [0.15, 0.9], [0.5, 1], [0.85, 0.6], [1, 0.1]], Width: 0.075, Lean: 0.1, Clumps: 0.35, Hollow: 0.45, Points: 1300}, Growth: {Step: 0.014, Reach: 0.08, Kill: 0.016, Up: 0.6, Droop: 0, Pipe: 2.3, Cut: 1.5}, Leaves: {Kind: 'broad', Size: 1, Each: 4, Color: [0.18, 0.32, 0.11], Shade: [0.07, 0.14, 0.05], Light: [0.36, 0.5, 0.2]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.28, 0.24], High: [0.5, 0.5, 0.44], Split: 0.4}},
		chestnut: {Grow: 'colonize', Height: [16, 24], Simple: 'oak', Trunk: {Bare: 0.2, Radius: 0.04, Lean: 0.04, Wander: 0.3, Stems: 1, Flare: 0.7, Stubs: 0.05, Leader: false}, Crown: {Profile: [[0, 0.55], [0.25, 0.95], [0.55, 1], [0.85, 0.75], [1, 0.3]], Width: 0.42, Lean: 0.15, Clumps: 0.35, Hollow: 0.35, Points: 1700}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.12, Droop: 0.18, Pipe: 2.4, Cut: 2.2}, Leaves: {Kind: 'broad', Size: 1.8, Each: 4, Color: [0.13, 0.27, 0.08], Shade: [0.04, 0.11, 0.03], Light: [0.26, 0.42, 0.13]}, Bark: {Pattern: 'plates', Low: [0.3, 0.26, 0.23], High: [0.36, 0.31, 0.27], Split: 0.9}},
		alder: {Grow: 'colonize', Height: [12, 20], Simple: 'birch', Trunk: {Bare: 0.25, Radius: 0.016, Lean: 0.05, Wander: 0.25, Stems: 1, Flare: 0.3, Stubs: 0.4, Leader: true}, Crown: {Profile: [[0, 0.6], [0.3, 1], [0.7, 0.7], [1, 0.15]], Width: 0.22, Lean: 0.2, Clumps: 0.45, Hollow: 0.4, Points: 1300}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.15, Droop: 0.12, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 1.1, Each: 4, Color: [0.12, 0.24, 0.08], Shade: [0.04, 0.1, 0.03], Light: [0.24, 0.38, 0.13]}, Bark: {Pattern: 'ridges', Low: [0.25, 0.24, 0.22], High: [0.4, 0.38, 0.34], Split: 0.5}},
		linden: {Grow: 'colonize', Height: [16, 26], Simple: 'oak', Trunk: {Bare: 0.2, Radius: 0.03, Lean: 0.03, Wander: 0.25, Stems: 1, Flare: 0.55, Stubs: 0.15, Leader: true}, Crown: {Profile: [[0, 0.6], [0.25, 1], [0.6, 0.9], [1, 0.3]], Width: 0.3, Lean: 0.15, Clumps: 0.35, Hollow: 0.4, Points: 1700}, Growth: {Step: 0.016, Reach: 0.12, Kill: 0.024, Up: 0.1, Droop: 0.2, Pipe: 2.4, Cut: 2}, Leaves: {Kind: 'broad', Size: 1.4, Each: 4, Color: [0.2, 0.34, 0.11], Shade: [0.07, 0.14, 0.04], Light: [0.38, 0.5, 0.2]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.28, 0.25], High: [0.4, 0.37, 0.32], Split: 0.5}},
		acacia: {Grow: 'colonize', Height: [12, 20], Simple: 'oak', Trunk: {Bare: 0.35, Radius: 0.025, Lean: 0.1, Wander: 0.45, Stems: 1, Flare: 0.4, Stubs: 0.2, Leader: false}, Crown: {Profile: [[0, 0.5], [0.3, 0.95], [0.7, 0.9], [1, 0.4]], Width: 0.32, Lean: 0.25, Clumps: 0.6, Hollow: 0.5, Points: 1300}, Growth: {Step: 0.017, Reach: 0.12, Kill: 0.024, Up: 0.15, Droop: 0.12, Pipe: 2.3, Cut: 1.8}, Leaves: {Kind: 'compound', Size: 1.1, Each: 4, Bloom: 0.35, BloomColor: [0.95, 0.94, 0.88], Color: [0.24, 0.38, 0.14], Shade: [0.09, 0.17, 0.05], Light: [0.44, 0.56, 0.24]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.25, 0.2], High: [0.38, 0.32, 0.25], Split: 0.5}},
		apple: {Grow: 'colonize', Height: [4, 7], Simple: 'oak', Trunk: {Bare: 0.3, Radius: 0.04, Lean: 0.12, Wander: 0.5, Stems: 1, Flare: 0.3, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.6], [0.3, 1], [0.7, 0.9], [1, 0.35]], Width: 0.55, Lean: 0.2, Clumps: 0.4, Hollow: 0.5, Points: 900}, Growth: {Step: 0.024, Reach: 0.16, Kill: 0.034, Up: 0.12, Droop: 0.2, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 0.7, Each: 4, Fruit: 0.4, FruitColor: [0.72, 0.12, 0.08], FruitSize: 0.04, Color: [0.2, 0.33, 0.11], Shade: [0.07, 0.14, 0.04], Light: [0.38, 0.5, 0.2]}, Bark: {Pattern: 'ridges', Low: [0.33, 0.29, 0.25], High: [0.4, 0.35, 0.3], Split: 0.5}},
		peach: {Grow: 'colonize', Height: [3, 5], Simple: 'oak', Trunk: {Bare: 0.25, Radius: 0.045, Lean: 0.15, Wander: 0.6, Stems: 1, Flare: 0.25, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.65], [0.35, 1], [0.75, 0.85], [1, 0.35]], Width: 0.6, Lean: 0.25, Clumps: 0.4, Hollow: 0.55, Points: 800}, Growth: {Step: 0.026, Reach: 0.17, Kill: 0.036, Up: 0.2, Droop: 0.12, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 0.6, Each: 4, Narrow: 0.6, Fruit: 0.3, FruitColor: [0.93, 0.52, 0.3], FruitSize: 0.04, Color: [0.22, 0.36, 0.12], Shade: [0.08, 0.15, 0.04], Light: [0.42, 0.54, 0.22]}, Bark: {Pattern: 'bands', Low: [0.28, 0.18, 0.15], High: [0.34, 0.22, 0.18], Split: 0.5}},
		apricot: {Grow: 'colonize', Height: [4, 8], Simple: 'oak', Trunk: {Bare: 0.3, Radius: 0.04, Lean: 0.12, Wander: 0.5, Stems: 1, Flare: 0.3, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.6], [0.3, 1], [0.7, 0.9], [1, 0.35]], Width: 0.5, Lean: 0.2, Clumps: 0.45, Hollow: 0.5, Points: 900}, Growth: {Step: 0.024, Reach: 0.16, Kill: 0.034, Up: 0.15, Droop: 0.15, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 0.7, Each: 4, Fruit: 0.35, FruitColor: [0.95, 0.6, 0.15], FruitSize: 0.032, Color: [0.2, 0.34, 0.11], Shade: [0.07, 0.14, 0.04], Light: [0.4, 0.52, 0.2]}, Bark: {Pattern: 'ridges', Low: [0.3, 0.24, 0.2], High: [0.36, 0.29, 0.24], Split: 0.5}},
		cherry: {Grow: 'colonize', Height: [3, 6], Simple: 'oak', Trunk: {Bare: 0.25, Radius: 0.035, Lean: 0.15, Wander: 0.45, Stems: 2, Flare: 0.2, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.6], [0.35, 1], [0.75, 0.85], [1, 0.3]], Width: 0.5, Lean: 0.2, Clumps: 0.4, Hollow: 0.5, Points: 800}, Growth: {Step: 0.026, Reach: 0.17, Kill: 0.036, Up: 0.1, Droop: 0.3, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 0.6, Each: 4, Fruit: 0.4, FruitColor: [0.55, 0.04, 0.06], FruitSize: 0.022, Color: [0.18, 0.32, 0.1], Shade: [0.06, 0.13, 0.04], Light: [0.36, 0.5, 0.2]}, Bark: {Pattern: 'bands', Low: [0.3, 0.18, 0.14], High: [0.37, 0.23, 0.18], Split: 0.5}},
		'sweet-cherry': {Grow: 'colonize', Height: [8, 14], Simple: 'oak', Trunk: {Bare: 0.3, Radius: 0.025, Lean: 0.05, Wander: 0.3, Stems: 1, Flare: 0.35, Stubs: 0.25, Leader: true}, Crown: {Profile: [[0, 0.6], [0.3, 1], [0.65, 0.8], [1, 0.25]], Width: 0.3, Lean: 0.15, Clumps: 0.45, Hollow: 0.45, Points: 1200}, Growth: {Step: 0.018, Reach: 0.13, Kill: 0.026, Up: 0.22, Droop: 0.1, Pipe: 2.3, Cut: 1.6}, Leaves: {Kind: 'broad', Size: 0.9, Each: 4, Fruit: 0.35, FruitColor: [0.62, 0.06, 0.1], FruitSize: 0.024, Color: [0.2, 0.34, 0.11], Shade: [0.07, 0.14, 0.04], Light: [0.4, 0.52, 0.2]}, Bark: {Pattern: 'bands', Low: [0.33, 0.2, 0.16], High: [0.42, 0.28, 0.22], Split: 0.5}},
		hazel: {Grow: 'colonize', Height: [3, 6], Simple: 'bush', Trunk: {Bare: 0.12, Radius: 0.012, Lean: 0.25, Wander: 0.3, Stems: 7, Flare: 0, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.45], [0.35, 0.9], [0.7, 1], [1, 0.45]], Width: 0.42, Lean: 0.2, Clumps: 0.45, Hollow: 0.45, Points: 800}, Growth: {Step: 0.028, Reach: 0.17, Kill: 0.036, Up: 0.2, Droop: 0.15, Pipe: 2.2, Cut: 1.4}, Leaves: {Kind: 'broad', Size: 0.6, Each: 4, Color: [0.19, 0.32, 0.1], Shade: [0.07, 0.13, 0.04], Light: [0.36, 0.48, 0.18]}, Bark: {Pattern: 'smooth', Low: [0.33, 0.27, 0.22], High: [0.42, 0.36, 0.3], Split: 0.5}},
		juniper: {Grow: 'colonize', Height: [1.5, 3.5], Simple: 'bush', Trunk: {Bare: 0.05, Radius: 0.014, Lean: 0.12, Wander: 0.35, Stems: 3, Flare: 0, Stubs: 0.2, Leader: true}, Crown: {Profile: [[0, 0.8], [0.3, 1], [0.7, 0.6], [1, 0.1]], Width: 0.24, Lean: 0.15, Clumps: 0.4, Hollow: 0.5, Points: 700}, Growth: {Step: 0.03, Reach: 0.17, Kill: 0.036, Up: 0.3, Droop: 0.05, Pipe: 2.2, Cut: 1.4}, Leaves: {Kind: 'needles', Size: 0.5, Each: 4, Color: [0.16, 0.28, 0.2], Shade: [0.05, 0.11, 0.08], Light: [0.3, 0.42, 0.32]}, Bark: {Pattern: 'fibrous', Low: [0.32, 0.22, 0.17], High: [0.4, 0.3, 0.24], Split: 0.5}},
		lilac: {Grow: 'colonize', Height: [2.5, 4.5], Simple: 'bush', Trunk: {Bare: 0.15, Radius: 0.012, Lean: 0.2, Wander: 0.3, Stems: 6, Flare: 0, Stubs: 0.1, Leader: false}, Crown: {Profile: [[0, 0.45], [0.35, 0.95], [0.7, 1], [1, 0.5]], Width: 0.38, Lean: 0.2, Clumps: 0.5, Hollow: 0.5, Points: 750}, Growth: {Step: 0.028, Reach: 0.17, Kill: 0.036, Up: 0.25, Droop: 0.08, Pipe: 2.2, Cut: 1.4}, Leaves: {Kind: 'broad', Size: 0.6, Each: 4, Bloom: 1, BloomSize: 0.02, BloomColor: [0.72, 0.5, 0.86], Color: [0.18, 0.32, 0.1], Shade: [0.06, 0.13, 0.04], Light: [0.34, 0.48, 0.18]}, Bark: {Pattern: 'smooth', Low: [0.36, 0.33, 0.3], High: [0.44, 0.41, 0.37], Split: 0.5}},
		fern: {Grow: 'stalks', Height: [0.8, 1.4], Simple: 'fern', Trunk: {Bare: 0, Radius: 0.008, Lean: 0, Wander: 0.1, Stems: 0, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.12, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.1, Reach: 0, Kill: 0, Up: 0, Droop: 0.4, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'frond', Size: 1.2, Each: 0, Base: 14, Rise: [3, 0.5], Stipe: 0.25, Wide: 0.24, Color: [0.2, 0.36, 0.1], Shade: [0.07, 0.15, 0.04], Light: [0.38, 0.54, 0.18]}, Bark: {Pattern: 'smooth', Low: [0.24, 0.2, 0.12], High: [0.3, 0.32, 0.15], Split: 0.5}},
		bamboo: {Grow: 'stalks', Height: [6, 12], Simple: 'reed', Trunk: {Bare: 0, Radius: 0.0045, Lean: 0.06, Wander: 0.08, Stems: 14, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.1, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.03, Reach: 0, Kill: 0, Up: 0, Droop: 0.3, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'blade', Size: 1.2, Each: 40, From: 0.4, Rise: [0.2, 0.2], Wide: 0.14, Color: [0.3, 0.45, 0.15], Shade: [0.11, 0.2, 0.05], Light: [0.5, 0.62, 0.25]}, Bark: {Pattern: 'rings', Rings: 28, Low: [0.32, 0.44, 0.17], High: [0.48, 0.56, 0.24], Split: 0.6}},
		reed: {Grow: 'stalks', Height: [2, 3.5], Simple: 'reed', Trunk: {Bare: 0, Radius: 0.004, Lean: 0.08, Wander: 0.1, Stems: 18, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.16, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.05, Reach: 0, Kill: 0, Up: 0, Droop: 0.2, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'blade', Size: 0.45, Each: 4, From: 0.15, Rise: [0.5, 0.5], Wide: 0.06, Color: [0.32, 0.42, 0.2], Shade: [0.12, 0.18, 0.07], Light: [0.52, 0.6, 0.32]}, Head: {Kind: 'panicle', Size: 0.35, Wide: 0.55, Share: 0.8, Color: [0.56, 0.46, 0.43]}, Bark: {Pattern: 'smooth', Low: [0.42, 0.46, 0.26], High: [0.56, 0.55, 0.34], Split: 0.5}},
		bulrush: {Grow: 'stalks', Height: [1.5, 2.4], Simple: 'reed', Trunk: {Bare: 0, Radius: 0.005, Lean: 0.04, Wander: 0.06, Stems: 7, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.12, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.06, Reach: 0, Kill: 0, Up: 0, Droop: 0.12, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'blade', Size: 1.7, Each: 0, Base: 22, Rise: [6, 2.5], Stipe: 0.03, Wide: 0.03, Color: [0.24, 0.38, 0.14], Shade: [0.09, 0.16, 0.05], Light: [0.42, 0.55, 0.24]}, Head: {Kind: 'cob', Size: 0.32, Wide: 0.26, Share: 1, Color: [0.38, 0.23, 0.12]}, Bark: {Pattern: 'smooth', Low: [0.28, 0.38, 0.16], High: [0.34, 0.44, 0.2], Split: 0.5}},
		wheat: {Grow: 'stalks', Height: [0.8, 1.1], Simple: 'wheat', Trunk: {Bare: 0, Radius: 0.004, Lean: 0.08, Wander: 0.1, Stems: 22, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.12, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.08, Reach: 0, Kill: 0, Up: 0, Droop: 0.25, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'blade', Size: 0.28, Each: 2, From: 0.1, Rise: [0.8, 0.8], Wide: 0.06, Color: [0.62, 0.56, 0.28], Shade: [0.38, 0.32, 0.14], Light: [0.84, 0.76, 0.44]}, Head: {Kind: 'ear', Size: 0.1, Wide: 0.32, Share: 1, Color: [0.85, 0.7, 0.36]}, Bark: {Pattern: 'smooth', Low: [0.66, 0.58, 0.3], High: [0.8, 0.7, 0.4], Split: 0.5}},
		sunflower: {Grow: 'stalks', Height: [1.6, 2.6], Simple: 'wheat', Trunk: {Bare: 0, Radius: 0.011, Lean: 0.05, Wander: 0.15, Stems: 1, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.02, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.05, Reach: 0, Kill: 0, Up: 0, Droop: 0.3, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'single', Size: 0.46, Each: 10, From: 0.1, Rise: [0.6, 0.6], Wide: 0.42, Color: [0.22, 0.36, 0.11], Shade: [0.08, 0.15, 0.04], Light: [0.4, 0.54, 0.2]}, Head: {Kind: 'disc', Size: 0.34, Share: 1, Color: [0.96, 0.74, 0.08]}, Bark: {Pattern: 'smooth', Low: [0.24, 0.32, 0.12], High: [0.3, 0.38, 0.15], Split: 0.5}},
		burdock: {Grow: 'stalks', Height: [1.2, 2], Simple: 'fern', Trunk: {Bare: 0, Radius: 0.011, Lean: 0.15, Wander: 0.2, Stems: 2, Flare: 0, Stubs: 0, Leader: true}, Crown: {Profile: [[0, 1], [1, 1]], Width: 0.08, Lean: 0, Clumps: 0, Hollow: 0, Points: 0}, Growth: {Step: 0.06, Reach: 0, Kill: 0, Up: 0, Droop: 0.25, Pipe: 2, Cut: 0.3}, Leaves: {Kind: 'single', Size: 0.6, Each: 4, From: 0.15, Base: 7, Rise: [0.9, 0.1], Stipe: 0.3, Wide: 0.36, Color: [0.16, 0.3, 0.09], Shade: [0.06, 0.12, 0.03], Light: [0.32, 0.46, 0.16]}, Head: {Kind: 'burrs', Size: 0.32, Wide: 1, Share: 1, Color: [0.62, 0.26, 0.56]}, Bark: {Pattern: 'smooth', Low: [0.32, 0.22, 0.16], High: [0.34, 0.4, 0.18], Split: 0.4}}
	},

	/* What a worker carries of it besides its methods: its presets. */
	Carried: ['Presets'],

	Species: function () {
		return Object.keys(this.Presets);
	},

	/* A preset by name, or one given, with all it does not tell from the pine (a copy: changing it changes nothing here). */
	Preset: function (name) {
		var given = typeof name === 'string' ? this.Presets[name] : name;
		var base = this.Presets.pine;
		var made;

		if (!given)
			throw new Error('Elemenx Flora: unknown species ' + name);

		made = JSON.parse(JSON.stringify(given));
		made.Name = made.Name || (typeof name === 'string' ? name : 'plant');

		['Trunk', 'Crown', 'Growth', 'Leaves', 'Bark'].forEach(function (part) {
			made[part] = Object.assign({}, base[part], made[part] || {});
		});

		made.Grow = made.Grow || 'colonize';
		made.Height = made.Height || base.Height;

		/* Its own pictures are not copied as JSON: kept as given. */
		if (typeof name !== 'string') {
			if (given.Bark && given.Bark.Image)
				made.Bark.Image = given.Bark.Image;

			if (given.Leaves && given.Leaves.Image)
				made.Leaves.Image = given.Leaves.Image;
		}

		return made;
	},

	/*
	 * How a plant of a species looks from far (a proxy of it: the woods of ScenePlanet): {Kind (crown, palm), Height
	 * (metres, its mean), Bare (its trunk under its crown, of its height), Width (its widest radius, of its height),
	 * Profile (its crown), Color (its leaves), Bark (its trunk)}; null for no species, or one of stalks (no tree).
	 */
	Far: function (name) {
		var p;

		if (typeof name !== 'string' || !this.Presets[name]) return null;

		p = this.Preset(name);

		if (p.Grow === 'stalks') return null;

		return {Kind: p.Grow === 'palm' ? 'palm' : 'crown', Height: (p.Height[0] + p.Height[1]) / 2, Bare: p.Grow === 'palm' ? 1 : p.Trunk.Bare, Width: p.Crown.Width, Profile: p.Crown.Profile, Color: p.Leaves.Color, Bark: p.Bark.High};
	},

	Work: function () {
		return this.$Service('Workers').Pool('SceneFlora', {Math: true, Noise: true, Random: true, SceneFlora: true});
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* The plant of a preset, of its variant. */
	Tree: function (preset, variant) {
		var p = this.Preset(preset);
		var random = this.$Service('Random').Sequence(p.Name + ':' + (variant || 0));
		var height = p.Height[0] + (p.Height[1] - p.Height[0]) * random();
		var nodes = [];
		var grown;

		if (p.Grow === 'palm') grown = this.Palm(p, height, random, nodes);
		else if (p.Grow === 'whorls') grown = this.Whorls(p, height, random, nodes);
		else if (p.Grow === 'stalks') grown = this.Stalks(p, height, random, nodes);
		else grown = this.Colonize(p, height, random, nodes);

		return this.Mesh(p, height, random, nodes, grown);
	},

	/* A node of a plant: where it is, its parent, its children, its radius (metres). */
	Node: function (nodes, at, parent, extra) {
		var node = Object.assign({P: at, Parent: parent, Kids: [], R: 0}, extra || {});

		nodes.push(node);

		if (parent >= 0)
			nodes[parent].Kids.push(nodes.length - 1);

		return nodes.length - 1;
	},

	/* Its radius of its crown at t (0 its foot, 1 its top), 0 to 1, of the Profile. */
	Profile: function (profile, t) {
		var k;

		for (k = 1; k < profile.length; k++) {
			if (t <= profile[k][0] || k === profile.length - 1) {
				var a = profile[k - 1];
				var b = profile[k];
				var u = Math.max(0, Math.min(1, (t - a[0]) / ((b[0] - a[0]) || 1)));

				return a[1] + (b[1] - a[1]) * u;
			}
		}

		return profile[0][1];
	},

	/*
	 * A trunk from a foot up to a height, a node every step, wandering and leaning (a stem of a bush leans out more): the
	 * index of its last node.
	 */
	Stem: function (nodes, foot, top, step, lean, wander, random, noise, from) {
		var at = foot.slice();
		var parent = from === undefined ? -1 : from;
		var dir = [lean[0], 1, lean[1]];
		var k = 0;
		var length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);

		dir = [dir[0] / length, dir[1] / length, dir[2] / length];

		if (parent === -1)
			parent = this.Node(nodes, at.slice(), -1, {Trunk: true});

		while (at[1] < top && k < 400) {
			var wx = (noise.At(at[1] * 0.35, k * 0.0 + foot[0] * 3, 1.7) - 0.5) * wander;
			var wz = (noise.At(at[1] * 0.35, foot[2] * 3 + 5.1, 9.3) - 0.5) * wander;
			var d = [dir[0] + wx, dir[1], dir[2] + wz];
			var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

			at = [at[0] + d[0] / l * step, at[1] + d[1] / l * step, at[2] + d[2] / l * step];
			parent = this.Node(nodes, at.slice(), parent, {Trunk: true});

			k++;
		}

		return parent;
	},

	/*
	 * A tree of points drawing its buds (space colonization): its stems to the foot of its crown (its leader through it
	 * when Leader), then points scattered in its crown each draw its nearest bud within Reach a Step toward it, a point
	 * reached within Kill is used up; up toward the light by Up, the far ones bending down by Droop.
	 */
	Colonize: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var step = p.Growth.Step * height;
		var reach = p.Growth.Reach * height;
		var kill = p.Growth.Kill * height;
		var foot = p.Trunk.Bare * height;
		var width = p.Crown.Width * height;
		var side = random() * Math.PI * 2;
		var tops = [];
		var points = [];
		var grid = {};
		var cell = reach;
		var s;
		var i;

		function key (at) {
			return Math.floor(at[0] / cell) + ':' + Math.floor(at[1] / cell) + ':' + Math.floor(at[2] / cell);
		}

		function put (index) {
			var k = key(nodes[index].P);

			(grid[k] = grid[k] || []).push(index);
		}

		/* Its stems: one, or a bush of several leaning out from its foot. */
		for (s = 0; s < Math.max(1, p.Trunk.Stems); s++) {
			var turn = side + s * 2.39996 + random() * 0.6;
			var out = p.Trunk.Stems > 1 ? p.Trunk.Lean * (0.6 + random() * 0.8) : p.Trunk.Lean * random();
			var base = p.Trunk.Stems > 1 ? [Math.cos(turn) * height * 0.03, 0, Math.sin(turn) * height * 0.03] : [0, 0, 0];

			tops.push(this.Stem(nodes, base, p.Trunk.Leader ? height * 0.93 : foot, step, [Math.cos(turn) * out, Math.sin(turn) * out], p.Trunk.Wander, random, noise));
		}

		/* The points of its crown: its profile round, lumpy by Clumps, leaning by Lean, kept to its outside by Hollow. */
		for (i = 0; i < p.Crown.Points; i++) {
			var t = Math.pow(random(), 0.85);
			var a = random() * Math.PI * 2;
			var lump = 1 + (noise.At(Math.cos(a) * 2, t * 3, Math.sin(a) * 2) - 0.5) * 2 * p.Crown.Clumps;
			var r = width * this.Profile(p.Crown.Profile, t) * (1 + p.Crown.Lean * Math.cos(a - side)) * Math.max(0.2, lump);
			var far = r * Math.pow(random(), p.Crown.Hollow);
			var y = foot + (height - foot) * t;

			points.push({P: [Math.cos(a) * far, y, Math.sin(a) * far], Alive: true});
		}

		for (i = 0; i < nodes.length; i++)
			put(i);

		/* Grown a step at a time while a point still draws a bud. */
		for (var round = 0; round < 260; round++) {
			var pulls = {};
			var any = false;

			points.forEach(function (point) {
				var best = -1;
				var nearest = reach;
				var cx;
				var cy;
				var cz;

				if (!point.Alive) return;

				cx = Math.floor(point.P[0] / cell);
				cy = Math.floor(point.P[1] / cell);
				cz = Math.floor(point.P[2] / cell);

				for (var dx = -1; dx <= 1; dx++) {
					for (var dy = -1; dy <= 1; dy++) {
						for (var dz = -1; dz <= 1; dz++) {
							(grid[(cx + dx) + ':' + (cy + dy) + ':' + (cz + dz)] || []).forEach(function (index) {
								var q = nodes[index].P;
								var d = Math.sqrt((q[0] - point.P[0]) * (q[0] - point.P[0]) + (q[1] - point.P[1]) * (q[1] - point.P[1]) + (q[2] - point.P[2]) * (q[2] - point.P[2]));

								if (d < nearest) {
									nearest = d;
									best = index;
								}
							});
						}
					}
				}

				if (best < 0) return;

				if (nearest < kill) {
					point.Alive = false;

					return;
				}

				var q = nodes[best].P;
				var pull = pulls[best] = pulls[best] || [0, 0, 0, 0];

				pull[0] += (point.P[0] - q[0]) / nearest;
				pull[1] += (point.P[1] - q[1]) / nearest;
				pull[2] += (point.P[2] - q[2]) / nearest;
				pull[3]++;
			});

			Object.keys(pulls).forEach(function (index) {
				var from = nodes[index];
				var pull = pulls[index];
				var out = Math.sqrt(from.P[0] * from.P[0] + from.P[2] * from.P[2]) / Math.max(1e-6, width);
				var d = [pull[0] / pull[3], pull[1] / pull[3] + p.Growth.Up - p.Growth.Droop * out, pull[2] / pull[3]];
				var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
				var at;
				var near;

				if (l < 1e-6) return;

				at = [from.P[0] + d[0] / l * step, from.P[1] + d[1] / l * step, from.P[2] + d[2] / l * step];

				/* Not twice the same way. */
				near = from.Kids.some(function (kid) {
					var q = nodes[kid].P;

					return (q[0] - at[0]) * (q[0] - at[0]) + (q[1] - at[1]) * (q[1] - at[1]) + (q[2] - at[2]) * (q[2] - at[2]) < step * step * 0.09;
				});

				if (near) return;

				put(this.Node(nodes, at, Number(index)));

				any = true;
			}, this);

			if (!any) break;
		}

		return {Tops: tops, Width: width, Foot: foot};
	},

	/*
	 * A spruce, a fir: its leader to the top, its branches in whorls a step of a few decimetres apart, as long as its
	 * profile there (a cone), sloping down by Droop and turning up at their tips, each with its side shoots by twos.
	 */
	Whorls: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var step = p.Growth.Step * height;
		var foot = p.Trunk.Bare * height;
		var width = p.Crown.Width * height;
		var leader = [];
		var y;
		var i;

		this.Stem(nodes, [0, 0, 0], height, step, [p.Trunk.Lean * (random() - 0.5), p.Trunk.Lean * (random() - 0.5)], p.Trunk.Wander, random, noise);

		for (i = 0; i < nodes.length; i++)
			leader.push(i);

		for (y = foot; y < height * 0.96; y += height * (0.022 + random() * 0.012)) {
			var t = (y - foot) / (height - foot);
			var length = width * this.Profile(p.Crown.Profile, t) * (0.8 + random() * 0.4);
			var count = 4 + Math.floor(random() * 3);
			var twist = random() * Math.PI * 2;
			var at = leader.reduce(function (best, index) {
				return Math.abs(nodes[index].P[1] - y) < Math.abs(nodes[best].P[1] - y) ? index : best;
			}, leader[0]);
			var b;

			if (length < step) continue;

			for (b = 0; b < count; b++) {
				var a = twist + b / count * Math.PI * 2 + (random() - 0.5) * 0.5;
				var slope = -p.Growth.Droop * (1 - t * 0.7) + (random() - 0.5) * 0.15;

				this.Bough(nodes, at, [Math.cos(a), slope, Math.sin(a)], length, step, p.Growth.Up, random, 2);
			}
		}

		return {Tops: [leader[leader.length - 1]], Width: width, Foot: foot};
	},

	/* A branch of a whorl: steps along its way bending up toward its tip, side shoots by twos on its way (depth more levels). */
	Bough: function (nodes, from, way, length, step, up, random, depth) {
		var l = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]);
		var d = [way[0] / l, way[1] / l, way[2] / l];
		var at = nodes[from].P.slice();
		var parent = from;
		var steps = Math.max(2, Math.round(length / step));
		var k;

		for (k = 0; k < steps; k++) {
			var bend = up * k / steps;
			var e = [d[0], d[1] + bend, d[2]];
			var el = Math.sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);

			at = [at[0] + e[0] / el * step, at[1] + e[1] / el * step, at[2] + e[2] / el * step];
			parent = this.Node(nodes, at.slice(), parent);

			if (depth > 1 && k > 0 && k < steps - 1 && random() < 0.75) {
				var sideways = [-d[2], 0, d[0]];
				var sign = k % 2 ? 1 : -1;

				this.Bough(nodes, parent, [d[0] * 0.6 + sideways[0] * sign, d[1] - 0.15, d[2] * 0.6 + sideways[2] * sign], (steps - k) * step * 0.45, step * 0.8, up * 0.5, random, depth - 1);
			}
		}
	},

	/* A palm: its trunk curving up (a bow and a lean), its fronds from its top arching out and down. */
	Palm: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var turn = random() * Math.PI * 2;
		var lean = p.Trunk.Lean * (0.4 + random() * 0.8);
		var top = this.Stem(nodes, [0, 0, 0], height, p.Growth.Step * height, [Math.cos(turn) * lean, Math.sin(turn) * lean], p.Trunk.Wander, random, noise);

		return {Tops: [top], Width: p.Crown.Width * height, Foot: height, Fronds: Math.max(8, Math.round(p.Crown.Points * (0.8 + random() * 0.4)))};
	},

	/*
	 * A clump of stalks (grasses, reeds, cereals, a sunflower, bamboo): Trunk.Stems stalks from within Crown.Width of its
	 * foot, of 70 to 100% of its height, leaning out by Trunk.Lean and bending out more toward their tops by Growth.Droop;
	 * Leaves.Base leaves from the ground round it (a fern's fronds, a burdock's leaves, a bulrush's blades), each on a stalk
	 * of its own (Leaves.Stipe of its length). Its nodes keep how far along their stalk they are (Along: 0 to 1).
	 */
	Stalks: function (p, height, random, nodes) {
		var noise = this.$Service('Noise').Make({Type: 'simplex', Seed: p.Name + ':' + random(), Fractal: 'fbm', Octaves: 2});
		var step = p.Growth.Step * height;
		var spread = p.Crown.Width * height;
		var scale = height / ((p.Height[0] + p.Height[1]) / 2);
		var stalks = [];
		var basal = [];
		var s;

		function chain (foot, turn, tall, lean, bend, steps) {
			var list = [];
			var at = foot.slice();
			var parent = -1;
			var k;

			for (k = 0; k <= steps; k++) {
				var along = k / steps;
				var out = lean + bend * along * along;
				var wx = (noise.At(at[1] * 0.7, foot[0] * 5, 1.7) - 0.5) * p.Trunk.Wander;
				var wz = (noise.At(at[1] * 0.7, foot[2] * 5 + 5.1, 9.3) - 0.5) * p.Trunk.Wander;
				var d = [Math.cos(turn) * out + wx, 1, Math.sin(turn) * out + wz];
				var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

				parent = this.Node(nodes, at.slice(), parent, {Trunk: true, Along: along});

				list.push(parent);

				at = [at[0] + d[0] / l * tall / steps, at[1] + d[1] / l * tall / steps, at[2] + d[2] / l * tall / steps];
			}

			return list;
		}

		for (s = 0; s < Math.max(0, Math.round(p.Trunk.Stems)); s++) {
			var turn = random() * Math.PI * 2;
			var far = s ? spread * Math.sqrt(random()) : spread * 0.1;
			var tall = height * (s ? 0.7 + random() * 0.3 : 1);
			var foot = [Math.cos(turn) * far, 0, Math.sin(turn) * far];

			stalks.push({Chain: chain.call(this, foot, turn, tall, p.Trunk.Lean * (0.3 + random() * 0.7) * (0.4 + far / Math.max(1e-6, spread)), p.Growth.Droop, Math.max(2, Math.round(tall / step))), Turn: turn});
		}

		/* Its leaves from the ground: rising steep inside, lower outside, each its stalk then its blade. */
		for (s = 0; s < Math.max(0, Math.round(p.Leaves.Base || 0)); s++) {
			var a = s * 2.39996 + random() * 0.5;
			var rise = p.Leaves.Rise || [1, 0.3];
			var slope = rise[0] + (rise[1] - rise[0]) * (s / Math.max(1, p.Leaves.Base - 1)) + (random() - 0.5) * 0.3;
			var length = p.Leaves.Size * scale * (0.75 + random() * 0.45);
			var stipe = length * (p.Leaves.Stipe === undefined ? 0.15 : p.Leaves.Stipe);
			var elevation = Math.atan(slope);
			var start = [Math.cos(a) * spread * 0.3 * random(), 0, Math.sin(a) * spread * 0.3 * random()];
			var list = [this.Node(nodes, start, -1, {Trunk: true, Along: 0})];

			list.push(this.Node(nodes, [start[0] + Math.cos(a) * Math.cos(elevation) * stipe, start[1] + Math.sin(elevation) * stipe, start[2] + Math.sin(a) * Math.cos(elevation) * stipe], list[0], {Trunk: true, Along: 1}));

			basal.push({Chain: list, Turn: a, Slope: slope, Length: length - stipe});
		}

		return {Tops: stalks.map(function (one) {
			return one.Chain[one.Chain.length - 1];
		}), Stalks: stalks, Basal: basal, Width: spread, Foot: 0, Scale: scale};
	},

	/*
	 * Its nodes as meshes: smoothed, as thick as what they carry (Pipe), the trunk flared at its foot; each branch a tube
	 * (its main child going on, the others branches of their own) of as many sides as its thickness needs, its bark
	 * along it (u round it, v up the plant: the height of the plant where it starts and its length after); the twigs
	 * thinner than Cut times the thinnest are left to its leaves; dead stubs on its bare trunk; its leaves cards at its
	 * tips and twigs (a palm its fronds).
	 */
	Mesh: function (p, height, random, nodes, grown) {
		var bark = {Positions: [], Normals: [], UVs: [], Indices: []};
		var leaves = {Positions: [], Normals: [], UVs: [], Indices: []};
		var base = p.Trunk.Radius * height;
		var centre = [0, grown.Foot + (height - grown.Foot) * 0.5, 0];
		var count = nodes.length;
		var i;

		/* Smoothed twice: no zigzag of its steps (its foot and its forks stay). */
		for (var pass = 0; pass < 2; pass++) {
			var moved = nodes.map(function (node) {
				if (node.Parent < 0 || node.Kids.length !== 1) return node.P;

				var a = nodes[node.Parent].P;
				var b = nodes[node.Kids[0]].P;

				return [node.P[0] * 0.5 + (a[0] + b[0]) * 0.25, node.P[1] * 0.5 + (a[1] + b[1]) * 0.25, node.P[2] * 0.5 + (a[2] + b[2]) * 0.25];
			});

			nodes.forEach(function (node, index) {
				node.P = moved[index];
			});
		}

		/* As thick as the pipes of what they carry (children after their parents: from the last). */
		for (i = count - 1; i >= 0; i--) {
			var node = nodes[i];

			node.R = node.Kids.length ? Math.pow(node.Kids.reduce(function (sum, kid) {
				return sum + Math.pow(nodes[kid].R, p.Growth.Pipe);
			}, 0), 1 / p.Growth.Pipe) : 1;
		}

		var roots = nodes.filter(function (node) {
			return node.Parent < 0;
		});
		var widest = roots.reduce(function (most, node) {
			return Math.max(most, node.R);
		}, 1);
		var scale = base / widest;
		var thinnest = scale;

		nodes.forEach(function (node) {
			node.R *= scale;

			/* A palm: as thick all its height. */
			if (p.Grow === 'palm')
				node.R = base * (1 - node.P[1] / height * 0.25);

			/* A stalk: thinner toward its top. */
			if (p.Grow === 'stalks')
				node.R = base * (1 - 0.6 * (node.Along || 0));

			/* Flared at the foot. */
			if (node.Trunk && node.P[1] < height * 0.08)
				node.R *= 1 + p.Trunk.Flare * Math.pow(1 - node.P[1] / (height * 0.08), 2);
		});

		/* Its dead stubs on its bare trunk: short, thin, out and a little down. */
		if (p.Trunk.Stubs > 0) {
			for (i = 0; i < count; i++) {
				var stem = nodes[i];
				if (!stem.Trunk || stem.P[1] < height * 0.12 || stem.P[1] > grown.Foot || random() > p.Trunk.Stubs * 0.35) continue;

				var a = random() * Math.PI * 2;
				var long = height * (0.02 + random() * 0.05);
				var tip = [stem.P[0] + Math.cos(a) * long, stem.P[1] + long * (random() - 0.6) * 0.5, stem.P[2] + Math.sin(a) * long];
				var stub = this.Node(nodes, tip, i, {Dead: true});

				nodes[stub].R = Math.max(thinnest * 0.6, stem.R * 0.06);

				nodes[i].Kids.pop();

				nodes[i].Stubs = (nodes[i].Stubs || []).concat([stub]);
			}
		}

		this.Tubes(nodes, bark, height, thinnest * p.Growth.Cut, p.Grow === 'palm', 9);

		if (p.Grow === 'stalks') this.Blades(p, nodes, grown, random, leaves, 1, 5);
		else if (p.Leaves.Kind === 'frond') this.Fronds(p, nodes[grown.Tops[0]], grown, height, random, leaves, 10);
		else this.Cards(p, nodes, thinnest * p.Growth.Cut * 1.6, centre, random, leaves, 1, 1);

		/*
		 * Its simpler levels, of the same branches (for what is far, SceneScatter): its branches thicker than four and ten
		 * times the cut, of 4 and 3 sides; its leaves fewer and larger cards on the same twigs (as much of them seen: a fifth
		 * and a fourteenth of them, larger by the root of that, as much of the crown covered). Regression: larger by 1.9 and
		 * 3.2, 81 and 72 hundredths of its leaves, the crowns of the trees farther thin and pale over the sunlit ground.
		 */
		var lods = [[4, 4, 0.22, 2.13], [10, 3, 0.07, 3.78]].map(function (level, index) {
			var simpler = {Positions: [], Normals: [], UVs: [], Indices: []};
			var cards = {Positions: [], Normals: [], UVs: [], Indices: []};
			var again = this.$Service('Random').Sequence(p.Name + ':level:' + index);

			this.Tubes(nodes, simpler, height, thinnest * p.Growth.Cut * level[0], p.Grow === 'palm', level[1], true);

			if (p.Grow === 'stalks') this.Blades(p, nodes, grown, again, cards, index ? 0.15 : 0.4, index ? 1 : 3);
			else if (p.Leaves.Kind === 'frond') this.Fronds(p, nodes[grown.Tops[0]], grown, height, again, cards, index ? 3 : 5);
			else this.Cards(p, nodes, thinnest * p.Growth.Cut * 1.6, centre, again, cards, level[2], level[3]);

			return {Bark: this.Typed(simpler), Leaves: this.Typed(cards)};
		}, this);

		return {
			Name: p.Name,
			Height: height,
			Bark: this.Typed(bark),
			Leaves: this.Typed(leaves),
			Lods: lods,
			Triangles: (bark.Indices.length + leaves.Indices.length) / 3,
			Nodes: nodes.length
		};
	},

	Typed: function (geometry) {
		return {Positions: new Float32Array(geometry.Positions), Normals: new Float32Array(geometry.Normals), UVs: new Float32Array(geometry.UVs), Indices: geometry.Positions.length / 3 > 65535 ? new Uint32Array(geometry.Indices) : new Uint16Array(geometry.Indices)};
	},

	/* Its branches as tubes: each chain of its main children one tube, a frame carried along it (no twist). */
	/* sides: the most a tube has; bare: no dead stubs (a simpler level). */
	Tubes: function (nodes, out, height, cut, ringed, sides, bare) {
		var self = this;

		function chains (start) {
			var list = [];
			var chain = [start];
			var at = start;

			for (;;) {
				var node = nodes[at];
				var kids = node.Kids.slice().sort(function (x, y) {
					return nodes[y].R - nodes[x].R;
				});

				if (!bare)
					(node.Stubs || []).forEach(function (stub) {
						list.push([at, stub]);
					});

				if (!kids.length) break;

				kids.slice(1).forEach(function (kid) {
					if (nodes[kid].R >= cut)
						list = list.concat(chains(kid).map(function (one) {
							return one[0] === kid ? [at].concat(one) : one;
						}));
				});

				/* A trunk goes on however thin (a palm's is as thick all its height). */
				if (nodes[kids[0]].R < cut && !nodes[kids[0]].Trunk) break;

				chain.push(kids[0]);

				at = kids[0];
			}

			return [chain].concat(list);
		}

		nodes.forEach(function (node, index) {
			if (node.Parent >= 0) return;

			chains(index).forEach(function (chain) {
				if (chain.length > 1)
					self.Tube(nodes, chain, out, height, ringed, sides);
			});
		});
	},

	Tube: function (nodes, chain, out, height, ringed, most) {
		var start = out.Positions.length / 3;
		var widest = nodes[chain[1]].R;
		var sides = Math.max(3, Math.min(most || 12, Math.round(3 + widest / height * 500)));
		var normal = null;
		var v = nodes[chain[0]].P[1] / height;
		var k;
		var s;

		for (k = 0; k < chain.length; k++) {
			var node = nodes[chain[k]];
			var ahead = nodes[chain[Math.min(chain.length - 1, k + 1)]].P;
			var behind = nodes[chain[Math.max(0, k - 1)]].P;
			var d = [ahead[0] - behind[0], ahead[1] - behind[1], ahead[2] - behind[2]];
			var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
			/* The first ring of a branch as thick as it is, not as its parent. */
			var r = k === 0 ? nodes[chain[1]].R : k === chain.length - 1 && !nodes[chain[k]].Kids.length ? node.R * 0.4 : node.R;
			var binormal;

			d = [d[0] / dl, d[1] / dl, d[2] / dl];

			if (k > 0) {
				var q = nodes[chain[k - 1]].P;

				v += Math.sqrt((node.P[0] - q[0]) * (node.P[0] - q[0]) + (node.P[1] - q[1]) * (node.P[1] - q[1]) + (node.P[2] - q[2]) * (node.P[2] - q[2])) / height;
			}

			/* The frame carried along: its normal the last one made square to the way now. */
			if (!normal)
				normal = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];

			var dot = normal[0] * d[0] + normal[1] * d[1] + normal[2] * d[2];

			normal = [normal[0] - d[0] * dot, normal[1] - d[1] * dot, normal[2] - d[2] * dot];

			var nl = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]) || 1;

			normal = [normal[0] / nl, normal[1] / nl, normal[2] / nl];
			binormal = [d[1] * normal[2] - d[2] * normal[1], d[2] * normal[0] - d[0] * normal[2], d[0] * normal[1] - d[1] * normal[0]];

			/* A palm: the scars of its old leaves in rings. */
			if (ringed)
				r *= 1 + 0.06 * Math.pow(Math.abs(Math.sin(node.P[1] / height * 140)), 6);

			for (s = 0; s <= sides; s++) {
				var a = s / sides * Math.PI * 2;
				var n = [normal[0] * Math.cos(a) + binormal[0] * Math.sin(a), normal[1] * Math.cos(a) + binormal[1] * Math.sin(a), normal[2] * Math.cos(a) + binormal[2] * Math.sin(a)];

				out.Positions.push(node.P[0] + n[0] * r, node.P[1] + n[1] * r, node.P[2] + n[2] * r);
				out.Normals.push(n[0], n[1], n[2]);
				out.UVs.push(s / sides, v);
			}

			if (k > 0) {
				for (s = 0; s < sides; s++) {
					var a0 = start + (k - 1) * (sides + 1) + s;
					var b0 = start + k * (sides + 1) + s;

					out.Indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
				}
			}
		}
	},

	/*
	 * Its leaves: cards at its twigs (those thinner than twig) and tips, Each a twig, Size metres, along the twig and
	 * turned round it, one of the four of the atlas; their normals mostly those of the round of the crown (its middle
	 * out), so it is lit as a mass, not card by card.
	 */
	/* keep: the share of its cards made (larger by scale, as much of the crown covered). */
	Cards: function (p, nodes, twig, centre, random, output, keep, scale) {
		var size = p.Leaves.Size;
		/* Hanging leaves (a weeping willow): their cards turned down, longer, curtains of twigs. */
		var hang = Math.max(0, Math.min(1, p.Leaves.Hang || 0));
		var stretch = 1 + hang * 1.6;
		/* How far its crown goes from its middle: the leaves this far out are in the light. */
		var reach = nodes.reduce(function (most, node) {
			return node.Kids.length ? most : Math.max(most, Math.sqrt((node.P[0] - centre[0]) * (node.P[0] - centre[0]) + (node.P[1] - centre[1]) * (node.P[1] - centre[1]) * 0.49 + (node.P[2] - centre[2]) * (node.P[2] - centre[2])));
		}, 0) * 0.8;

		nodes.forEach(function (node) {
			if (node.Dead || node.R > twig || node.Parent < 0) return;

			var tip = !node.Kids.length;
			var each = tip ? p.Leaves.Each : 1 + (random() < 0.5 ? 1 : 0);

			if (keep < 1)
				each = Math.floor(each * keep + random());

			var from = nodes[node.Parent].P;
			var d = [node.P[0] - from[0], node.P[1] - from[1], node.P[2] - from[2]];
			var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
			var c;

			d = [d[0] / dl, d[1] / dl, d[2] / dl];

			for (c = 0; c < each; c++) {
				var s = size * (0.75 + random() * 0.5) * (scale || 1);
				/* Along the twig, a little up or down, turned round it. */
				var way = [d[0] + (random() - 0.5) * 0.8, d[1] + (random() - 0.5) * 0.8 - (p.Leaves.Kind === 'needles' ? 0 : 0.25), d[2] + (random() - 0.5) * 0.8];
				var wl = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]) || 1;
				var up = [way[0] / wl, way[1] / wl, way[2] / wl];

				if (hang > 0) {
					up = [up[0] * (1 - hang) + (random() - 0.5) * 0.15 * hang, up[1] * (1 - hang) - hang, up[2] * (1 - hang) + (random() - 0.5) * 0.15 * hang];
					wl = Math.sqrt(up[0] * up[0] + up[1] * up[1] + up[2] * up[2]) || 1;
					up = [up[0] / wl, up[1] / wl, up[2] / wl];
				}

				var spin = random() * Math.PI * 2;
				var helper = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
				var across = [up[1] * helper[2] - up[2] * helper[1], up[2] * helper[0] - up[0] * helper[2], up[0] * helper[1] - up[1] * helper[0]];
				var al = Math.sqrt(across[0] * across[0] + across[1] * across[1] + across[2] * across[2]) || 1;
				var third;
				var out;
				var face;
				var round;
				var rl;
				var n;
				var tile = Math.floor(random() * 4);
				var u0 = tile % 2 * 0.5;
				var v0 = Math.floor(tile / 2) * 0.25;
				var start = output.Positions.length / 3;
				var corners = [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]];

				across = [across[0] / al, across[1] / al, across[2] / al];
				third = [up[1] * across[2] - up[2] * across[1], up[2] * across[0] - up[0] * across[2], up[0] * across[1] - up[1] * across[0]];
				face = [across[0] * Math.cos(spin) + third[0] * Math.sin(spin), across[1] * Math.cos(spin) + third[1] * Math.sin(spin), across[2] * Math.cos(spin) + third[2] * Math.sin(spin)];
				round = [node.P[0] - centre[0], (node.P[1] - centre[1]) * 0.7, node.P[2] - centre[2]];
				rl = Math.sqrt(round[0] * round[0] + round[1] * round[1] + round[2] * round[2]) || 1;
				/*
				 * Deep in the crown its leaves are in the shade of the others: their normals turned down, as far as they are in
				 * (out: 1 at its outside), so the sun and the sky light them less (no color of corners in a material of a file).
				 */
				out = Math.min(1, rl / Math.max(1e-6, reach));
				n = [round[0] / rl * 0.75 + up[0] * 0.1, round[1] / rl * 0.75 + 0.25, round[2] / rl * 0.75 + up[2] * 0.1];

				/* The deeper in, the likelier of the darker half of the atlas (a normal turned down is turned back up to the eye). */
				if (random() > out * out)
					v0 += 0.5;

				rl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
				n = [n[0] / rl, n[1] / rl, n[2] / rl];

				corners.forEach(function (corner) {
					var x = corner[0] * s;
					var y = (corner[1] - 0.15) * s * stretch;

					output.Positions.push(node.P[0] + face[0] * x + up[0] * y, node.P[1] + face[1] * x + up[1] * y, node.P[2] + face[2] * x + up[2] * y);
					output.Normals.push(n[0], n[1], n[2]);
					output.UVs.push(u0 + (corner[0] + 0.5) * 0.5, v0 + corner[1] * 0.25);
				});

				output.Indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
			}
		});
	},

	/* The fronds of a palm: from its top, arching out and drooping, each a strip folded down its rib (a V), the frond of the atlas along it. */
	/* segments: along each frond (fewer for a simpler level). */
	Fronds: function (p, top, grown, height, random, out, segments) {
		var count = grown.Fronds;
		var f;

		for (f = 0; f < count; f++) {
			var a = f * 2.39996 + random() * 0.4;
			var rise = 0.9 - f / count * 1.4 + (random() - 0.5) * 0.3;
			var length = p.Leaves.Size * (0.75 + random() * 0.45) * (f < count * 0.25 ? 0.7 : 1);
			var d = [Math.cos(a) * Math.cos(Math.atan(rise)), Math.sin(Math.atan(rise)), Math.sin(a) * Math.cos(Math.atan(rise))];
			var side = [-Math.sin(a), 0, Math.cos(a)];
			var at = top.P.slice();
			var start = out.Positions.length / 3;
			var k;
			var tile = Math.floor(random() * 4);
			var u0 = tile % 2 * 0.5;
			var v0 = Math.floor(tile / 2) * 0.25;

			for (k = 0; k <= segments; k++) {
				var t = k / segments;
				var half = length * 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
				var fold = half * 0.35;
				var n = [d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0]];
				if (n[1] < 0)
					n = [-n[0], -n[1], -n[2]];

				[[-1, 0], [0, 1], [1, 2]].forEach(function (corner) {
					var off = corner[0];

					out.Positions.push(at[0] + side[0] * half * off, at[1] - fold * Math.abs(off), at[2] + side[2] * half * off);
					out.Normals.push(n[0] * 0.7 + side[0] * off * 0.3, n[1] * 0.7 + 0.3, n[2] * 0.7 + side[2] * off * 0.3);
					out.UVs.push(u0 + (off + 1) * 0.25, v0 + t * 0.25);
				});

				if (k > 0) {
					var a0 = start + (k - 1) * 3;
					var b0 = start + k * 3;

					out.Indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1, a0 + 1, b0 + 1, a0 + 2, a0 + 2, b0 + 1, b0 + 2);
				}

				at = [at[0] + d[0] * length / segments, at[1] + d[1] * length / segments, at[2] + d[2] * length / segments];
				/* Drooping more the farther out. */
				d = [d[0], d[1] - p.Growth.Droop * 0.22, d[2]];

				var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

				d = [d[0] / dl, d[1] / dl, d[2] / dl];
			}
		}
	},

	/*
	 * The leaves of a clump of stalks (Stalks): its leaves from the ground on their own stalks, Leaves.Each along each stalk
	 * from Leaves.From of it up (alternating round it, a sunflower's by the golden angle), each a strap of the atlas (a
	 * blade of grass, a big single leaf, a fern's frond) drooping by Growth.Droop; and on the tops of Head.Share of its
	 * stalks their heads: two cards crossed (an ear, a plume, a cob, burrs), a sunflower's disc one facing out. keep: the
	 * share of its leaves made (wider, as much covered), segments along each.
	 */
	Blades: function (p, nodes, grown, random, out, keep, segments) {
		var self = this;
		var kind = p.Leaves.Kind;
		var head = p.Head && p.Head.Kind && p.Head.Kind !== 'none' ? p.Head : null;
		/* Its leaves on the tiles of its atlas: the last of them its head's when it has one. */
		var tiles = head ? 3 : 4;
		var wide = p.Leaves.Wide || (kind === 'blade' ? 0.07 : kind === 'frond' ? 0.3 : 0.38);
		var widen = Math.min(1.8, 1 / Math.sqrt(keep));
		var droop = p.Growth.Droop;

		function kept () {
			return keep >= 1 || random() < keep;
		}

		function tile (deep) {
			return Math.floor(random() * tiles) + (deep ? 4 : 0);
		}

		grown.Basal.forEach(function (leaf, index) {
			if (!kept()) return;

			var from = nodes[leaf.Chain[leaf.Chain.length - 1]].P;
			var elevation = Math.atan(leaf.Slope);
			var d = [Math.cos(leaf.Turn) * Math.cos(elevation), Math.sin(elevation), Math.sin(leaf.Turn) * Math.cos(elevation)];

			/* The inner ones, steeper, in the shade of the outer. */
			self.Strap(out, from, d, leaf.Length, leaf.Length * wide * widen, segments, droop, tile(index < grown.Basal.length * 0.3 && random() < 0.6), kind === 'frond');
		});

		grown.Stalks.forEach(function (stalk) {
			var chain = stalk.Chain;
			var each = Math.max(0, Math.round(p.Leaves.Each || 0));
			var low = p.Leaves.From === undefined ? 0.1 : p.Leaves.From;
			var rise = p.Leaves.Rise || [1, 0.3];
			var slope = (rise[0] + rise[1]) / 2;
			var k;

			for (k = 0; k < each; k++) {
				if (!kept()) continue;

				var along = low + (0.85 - low) * (k + 0.3 + random() * 0.4) / each;
				var at = nodes[chain[Math.min(chain.length - 1, Math.round(along * (chain.length - 1)))]].P;
				var a = stalk.Turn + (kind === 'single' ? k * 2.39996 : k * Math.PI) + (random() - 0.5) * 0.6;
				var elevation = Math.atan(slope + (random() - 0.5) * 0.4);
				var length = p.Leaves.Size * grown.Scale * (1 - along * 0.45) * (0.8 + random() * 0.4);

				self.Strap(out, at, [Math.cos(a) * Math.cos(elevation), Math.sin(elevation), Math.sin(a) * Math.cos(elevation)], length, length * wide * widen, segments, droop, tile(along < 0.3), kind === 'frond');
			}

			if (!head || random() > (head.Share === undefined ? 1 : head.Share)) return;

			var top = nodes[chain[chain.length - 1]].P;
			var below = nodes[chain[Math.max(0, chain.length - 2)]].P;
			var up = [top[0] - below[0], top[1] - below[1], top[2] - below[2]];
			var ul = Math.sqrt(up[0] * up[0] + up[1] * up[1] + up[2] * up[2]) || 1;
			var size = (head.Size || 0.1) * grown.Scale;

			up = [up[0] / ul, up[1] / ul, up[2] / ul];

			if (head.Kind === 'disc') {
				/* A sunflower: its face out to the side and a little down, as wide as it is. */
				var face = [Math.cos(stalk.Turn) * 0.85, -0.35, Math.sin(stalk.Turn) * 0.85];

				self.Head(out, [top[0] + face[0] * size * 0.1, top[1], top[2] + face[2] * size * 0.1], [0, 1, 0], face, size, 1, false);
			}
			else {
				self.Head(out, top, up, null, size, head.Wide || 0.4, true);
			}
		});
	},

	/*
	 * A strap of a leaf from at along d: segments of it, each drooping (droop), as wide as half each side (a frond's
	 * narrowing at both ends, a frond folded down its rib), the tile of the atlas along it (its foot at at).
	 */
	Strap: function (out, at, d, length, half, segments, droop, tile, frond) {
		var side = [-d[2], 0, d[0]];
		var sl = Math.sqrt(side[0] * side[0] + side[2] * side[2]);
		var start = out.Positions.length / 3;
		var u0 = tile % 2 * 0.5;
		var v0 = Math.floor(tile / 2) * 0.25;
		var k;

		side = sl > 1e-6 ? [side[0] / sl, 0, side[2] / sl] : [1, 0, 0];
		d = d.slice();
		at = at.slice();

		for (k = 0; k <= segments; k++) {
			var t = k / segments;
			var w = frond ? half * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) : half * (1 - 0.3 * t);
			var fold = frond ? w * 0.35 : 0;
			var n = [d[1] * side[2] - d[2] * side[1], d[2] * side[0] - d[0] * side[2], d[0] * side[1] - d[1] * side[0]];
			var dl;

			if (n[1] < 0)
				n = [-n[0], -n[1], -n[2]];

			[-1, 0, 1].forEach(function (off) {
				out.Positions.push(at[0] + side[0] * w * off, at[1] - fold * Math.abs(off), at[2] + side[2] * w * off);
				out.Normals.push(n[0] * 0.7 + side[0] * off * 0.3, n[1] * 0.7 + 0.3, n[2] * 0.7 + side[2] * off * 0.3);
				out.UVs.push(u0 + (off + 1) * 0.25, v0 + t * 0.25);
			});

			if (k > 0) {
				var a0 = start + (k - 1) * 3;
				var b0 = start + k * 3;

				out.Indices.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1, a0 + 1, b0 + 1, a0 + 2, a0 + 2, b0 + 1, b0 + 2);
			}

			at = [at[0] + d[0] * length / segments, at[1] + d[1] * length / segments, at[2] + d[2] * length / segments];
			/* Bending down the more the longer it goes. */
			d = [d[0], d[1] - droop * 2.2 / segments, d[2]];
			dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
			d = [d[0] / dl, d[1] / dl, d[2] / dl];
		}
	},

	/*
	 * A head of a stalk on the last tile of its atlas: up from at along up, size tall, wide as wide of it; crossed: two
	 * cards square to each other; else one facing face, centred on at.
	 */
	Head: function (out, at, up, face, size, wide, crossed) {
		var turns = crossed ? [[1, 0, 0], [0, 0, 1]] : [null];

		turns.forEach(function (turn) {
			var across;
			var normal;
			var start = out.Positions.length / 3;
			var base;

			if (turn) {
				across = [up[1] * turn[2] - up[2] * turn[1], up[2] * turn[0] - up[0] * turn[2], up[0] * turn[1] - up[1] * turn[0]];
				normal = turn;
				base = at;
			}
			else {
				across = [-face[2], 0, face[0]];
				normal = face;
				/* Its middle on at: up the card from half below. */
				base = [at[0] - up[0] * size * 0.5, at[1] - up[1] * size * 0.5, at[2] - up[2] * size * 0.5];
			}

			var al = Math.sqrt(across[0] * across[0] + across[1] * across[1] + across[2] * across[2]) || 1;
			var lit = [normal[0] * 0.5, normal[1] * 0.5 + 0.5, normal[2] * 0.5];
			var ll = Math.sqrt(lit[0] * lit[0] + lit[1] * lit[1] + lit[2] * lit[2]) || 1;

			across = [across[0] / al * size * wide * 0.5, across[1] / al * size * wide * 0.5, across[2] / al * size * wide * 0.5];

			[[-1, 0], [1, 0], [1, 1], [-1, 1]].forEach(function (corner) {
				out.Positions.push(base[0] + across[0] * corner[0] + up[0] * size * corner[1], base[1] + across[1] * corner[0] + up[1] * size * corner[1], base[2] + across[2] * corner[0] + up[2] * size * corner[1]);
				out.Normals.push(lit[0] / ll, lit[1] / ll, lit[2] / ll);
				out.UVs.push(0.5 + (corner[0] + 1) * 0.25, 0.25 + corner[1] * 0.25);
			});

			out.Indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
		});
	},

	/*
	 * The head of its stalks in a tile of its atlas (its foot at the foot of the tile, where its stalk ends): an ear of
	 * grains in two rows with their awns, a plume of fine drooping hairs, a cob (a bulrush) with its spike, a disc of seeds
	 * in spirals with its petals round it, burrs (balls of hooks, purple on their tops); its colour Head.Color.
	 */
	HeadPicture: function (p, data, size, ox, oy, tile, random) {
		var kind = p.Head.Kind;
		var color = p.Head.Color || [0.8, 0.7, 0.4];
		var balls = [];
		var lines = [];
		var x;
		var y;
		var i;

		function mix (a, b, k) {
			return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
		}

		function far (px, py, line) {
			var abx = line.B[0] - line.A[0];
			var aby = line.B[1] - line.A[1];
			var k = Math.max(0, Math.min(1, ((px - line.A[0]) * abx + (py - line.A[1]) * aby) / (abx * abx + aby * aby || 1)));
			var qx = line.A[0] + abx * k - px;
			var qy = line.A[1] + aby * k - py;

			return Math.sqrt(qx * qx + qy * qy);
		}

		if (kind === 'ear') {
			for (i = 0; i < 18; i++) {
				var gy = 0.1 + i / 18 * 0.78;
				var side = i % 2 ? 1 : -1;
				var gx = 0.5 + side * 0.13 * (1 - gy * 0.35);

				balls.push({X: gx, Y: gy, R: 0.11 * (1 - gy * 0.3), Tone: random()});
				lines.push({A: [gx, gy], B: [gx + side * 0.08, Math.min(1, gy + 0.3)], Width: 0.006, Tone: random()});
			}

			lines.push({A: [0.5, 0], B: [0.5, 0.9], Width: 0.02, Tone: 0.5});
		}
		else if (kind === 'panicle') {
			lines.push({A: [0.5, 0], B: [0.52, 1], Width: 0.012, Tone: 0.4});

			for (i = 0; i < 110; i++) {
				var py = 0.1 + random() * 0.88;
				var turn = (random() < 0.5 ? -1 : 1) * (0.25 + random() * 0.9);
				var length = (0.12 + random() * 0.3) * (1.15 - py * 0.6);

				lines.push({A: [0.5 + (py - 0.1) * 0.02, py], B: [0.5 + Math.sin(turn) * length, py - Math.cos(turn) * length * 0.35 + length * 0.15], Width: 0.005 + random() * 0.004, Tone: random()});
			}
		}
		else if (kind === 'burrs') {
			for (i = 0; i < 7; i++)
				balls.push({X: 0.22 + random() * 0.56, Y: 0.25 + random() * 0.65, R: 0.08 + random() * 0.04, Tone: random(), Burr: true});

			lines.push({A: [0.5, 0], B: [0.5, 0.6], Width: 0.025, Tone: 0.3});
		}

		for (y = 0; y < tile; y++) {
			for (x = 0; x < tile; x++) {
				var u = (x + 0.5) / tile;
				var v = (y + 0.5) / tile;
				var cover = 0;
				var paint = null;
				var o = ((oy + y) * size + ox + x) * 4;

				if (kind === 'cob') {
					/* Its cob from 0.08 to 0.7, rounded at its ends; its spike above it. */
					var cy = Math.max(0.16, Math.min(0.62, v));
					var dx = (u - 0.5) / 0.36;
					var dy = (v - cy) / 0.08;

					if (dx * dx + dy * dy <= 1) {
						cover = 1;
						paint = mix(color, [0, 0, 0], 0.35 * (Math.abs(dx) * Math.abs(dx)) + random() * 0.12);
					}
					else if (v > 0.6 && v < 0.98 && Math.abs(u - 0.5) < 0.03 * (1 - (v - 0.6) * 1.5)) {
						cover = 1;
						paint = mix(color, [0.75, 0.65, 0.45], 0.6);
					}
				}
				else if (kind === 'disc') {
					var rx = u - 0.5;
					var ry = v - 0.5;
					var r = Math.sqrt(rx * rx + ry * ry);
					var angle = Math.atan2(ry, rx);

					if (r < 0.27) {
						/* Its seeds in the spirals of the golden angle. */
						var spiral = Math.sin(r * 140 + angle * 21) * Math.sin(r * 140 - angle * 34);

						cover = 1;
						paint = mix([0.28, 0.18, 0.08], [0.12, 0.07, 0.03], 0.5 + spiral * 0.5 - r * 1.2);
					}
					else if (r < 0.3 + 0.19 * Math.pow(Math.abs(Math.cos(angle * 11)), 0.6)) {
						cover = 1;
						paint = mix(color, [0, 0, 0], (r - 0.27) * 0.6 + (Math.abs(Math.sin(angle * 11)) * 0.12));
					}
				}

				lines.forEach(function (line) {
					if (far(u, v, line) < line.Width) {
						cover = 1;
						paint = mix(color, kind === 'panicle' ? [1, 0.95, 0.9] : [0.5, 0.45, 0.25], line.Tone * 0.35);
					}
				});

				balls.forEach(function (ball) {
					var bx = u - ball.X;
					var by = v - ball.Y;
					var d = Math.sqrt(bx * bx + by * by);
					/* Burrs: their hooks a ring of spikes. */
					var edge = ball.Burr ? ball.R * (1 + 0.22 * Math.pow(Math.abs(Math.sin(Math.atan2(by, bx) * 9)), 3)) : ball.R;
					if (d > edge) return;

					var lit = 0.65 + 0.35 * (1 - d / ball.R) + ball.Tone * 0.1;

					cover = 1;
					paint = ball.Burr ? (by > ball.R * 0.25 ? mix([0, 0, 0], color, lit) : mix([0, 0, 0], [0.36, 0.42, 0.2], lit)) : mix([0, 0, 0], color, Math.min(1.1, lit));
				});

				if (paint) {
					data[o] = Math.round(Math.max(0, Math.min(1, paint[0])) * 255);
					data[o + 1] = Math.round(Math.max(0, Math.min(1, paint[1])) * 255);
					data[o + 2] = Math.round(Math.max(0, Math.min(1, paint[2])) * 255);
				}

				data[o + 3] = Math.round(cover * 255);
			}
		}
	},

	/*
	 * Its pictures: its bark (Width 256, Height 1024: round its trunk and up the plant; its colors from Low below to High
	 * from Split up, its pattern; its relief as a normal map) and its leaves (an atlas of four clusters, 512 by 1024: the
	 * four in the light above, in the shade below).
	 */
	Textures: function (preset) {
		var p = this.Preset(preset);
		var bark = p.Bark.Image ? {Picture: p.Bark.Image, Normal: this.Flat(p.Bark.Image.Width, p.Bark.Image.Height)} : this.BarkPicture(p);

		return {Bark: bark.Picture, BarkNormal: bark.Normal, Leaves: p.Leaves.Image || this.LeafPicture(p)};
	},

	/* A normal map of nothing: what the bark of its own picture has. */
	Flat: function (width, height) {
		var data = new Uint8Array(width * height * 4);
		var i;

		for (i = 0; i < width * height; i++) {
			data[i * 4] = 128;
			data[i * 4 + 1] = 128;
			data[i * 4 + 2] = 255;
			data[i * 4 + 3] = 255;
		}

		return {Width: width, Height: height, Data: data};
	},

	BarkPicture: function (p) {
		var width = 256;
		var height = 1024;
		var noise = this.$Service('Noise');
		var fine = noise.Make({Type: 'simplex', Seed: p.Name + ':bark', Fractal: 'fbm', Octaves: 4});
		var cells = noise.Make({Type: 'worley', Seed: p.Name + ':plates', Cell: {Return: 'edge', Jitter: 0.9}});
		var bumps = new Float32Array(width * height);
		var data = new Uint8Array(width * height * 4);
		var normal = new Uint8Array(width * height * 4);
		var pattern = p.Bark.Pattern;
		var x;
		var y;

		function smooth (a, b, v) {
			var t = Math.max(0, Math.min(1, (v - a) / (b - a)));

			return t * t * (3 - 2 * t);
		}

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				/* Round the trunk: seamless along u (a circle of the noise), up the plant along v. */
				var a = x / width * Math.PI * 2;
				var cx = Math.cos(a);
				var cz = Math.sin(a);
				var t = y / height;
				var n = fine.At(cx * 3, t * 40, cz * 3);
				var high = smooth(p.Bark.Split - 0.08, p.Bark.Split + 0.08, t + (n - 0.5) * 0.12);
				var color = [p.Bark.Low[0] + (p.Bark.High[0] - p.Bark.Low[0]) * high, p.Bark.Low[1] + (p.Bark.High[1] - p.Bark.Low[1]) * high, p.Bark.Low[2] + (p.Bark.High[2] - p.Bark.Low[2]) * high];
				var bump = n;
				var shade = 1;

				if (pattern === 'plates') {
					/* Plates between deep cracks below; thin flakes peeling above. */
					var edge = cells.At(cx * 2.2, t * 34, cz * 2.2);
					var crack = 1 - smooth(0.02, 0.12, edge);

					bump = (1 - crack) * (0.6 + n * 0.4) * (1 - high * 0.7) + high * n * 0.5;
					shade = 1 - crack * 0.55 * (1 - high * 0.8) + (n - 0.5) * 0.25;
				}
				else if (pattern === 'birch') {
					/* White, dashes of black across it, black fissured at its foot. */
					var dash = fine.At(cx * 9, t * 900, cz * 9);
					var lenticel = smooth(0.72, 0.8, dash) * smooth(0.4, 0.6, fine.At(cx * 2, t * 60, cz * 2));
					var foot = 1 - smooth(0.04, 0.14, t + (n - 0.5) * 0.06);
					var crack2 = 1 - smooth(0.03, 0.1, cells.At(cx * 2, t * 30, cz * 2));

					color = [p.Bark.High[0], p.Bark.High[1], p.Bark.High[2]];
					color = color.map(function (part, index) {
						var black = p.Bark.Low[index];
						var dark = Math.max(lenticel * 0.9, foot * (0.55 + crack2 * 0.4));

						return part + (black - part) * dark;
					});
					bump = 0.5 + (n - 0.5) * 0.3 - lenticel * 0.2 + foot * (1 - crack2) * 0.4;
					shade = 1 + (n - 0.5) * 0.12;
				}
				else if (pattern === 'ridges') {
					/* Deep ridges up the trunk, wandering and joining. */
					var ridge = Math.abs(fine.At(cx * 6, t * 22, cz * 6) - 0.5) * 2;

					bump = 1 - Math.pow(ridge, 0.6);
					shade = 0.7 + bump * 0.45 + (n - 0.5) * 0.2;
				}
				else if (pattern === 'fibrous') {
					/* A sequoia: soft fibres up the trunk in long strips, deep wide furrows between broad ribs. */
					var fibre = Math.abs(fine.At(cx * 16, t * 7, cz * 16) - 0.5) * 2;
					var rib = Math.abs(fine.At(cx * 3.5, t * 2.5, cz * 3.5) - 0.5) * 2;

					bump = (1 - Math.pow(rib, 0.5)) * 0.6 + (1 - fibre) * 0.4;
					shade = 0.6 + bump * 0.55 + (n - 0.5) * 0.15;
				}
				else if (pattern === 'bands') {
					/* A cherry: smooth, shining, its lenticels in pale dashes round it, thin bands of it peeling. */
					var lenticels = smooth(0.64, 0.72, fine.At(cx * 10, t * 520, cz * 10)) * smooth(0.3, 0.5, fine.At(cx * 3, t * 40, cz * 3));
					var peel = smooth(0.62, 0.7, fine.At(cx * 1.5, t * 90, cz * 1.5));

					color = color.map(function (part) {
						return part + (0.58 - part) * lenticels * 0.85;
					});
					bump = 0.5 + (n - 0.5) * 0.2 - lenticels * 0.15 + peel * 0.2;
					shade = 0.95 + (n - 0.5) * 0.12 - peel * 0.12;
				}
				else if (pattern === 'diamonds') {
					/* An aspen, a poplar: pale and smooth, dark diamonds where twigs fell, dark and fissured at its foot. */
					var scar = smooth(0.7, 0.76, fine.At(cx * 1.4, t * 20, cz * 1.4)) * smooth(0.3, 0.5, fine.At(cx * 4, t * 9, cz * 4));
					var base = 1 - smooth(0.04, 0.16, t + (n - 0.5) * 0.06);
					var fissure = 1 - smooth(0.03, 0.1, cells.At(cx * 2, t * 26, cz * 2));

					color = [p.Bark.High[0], p.Bark.High[1], p.Bark.High[2]].map(function (part, index) {
						return part + (p.Bark.Low[index] - part) * Math.max(scar * 0.85, base * (0.5 + fissure * 0.45));
					});
					bump = 0.5 + (n - 0.5) * 0.25 - scar * 0.25 + base * (1 - fissure) * 0.4;
					shade = 1 + (n - 0.5) * 0.14;
				}
				else if (pattern === 'rings') {
					/* The rings of the scars of old leaves. */
					var ring = Math.pow(Math.abs(Math.sin(t * (p.Bark.Rings || 140) * Math.PI + (n - 0.5) * 2)), 4);

					bump = 1 - ring * 0.7 + (n - 0.5) * 0.3;
					shade = 0.8 + bump * 0.25;
				}
				else {
					shade = 0.9 + (n - 0.5) * 0.3;
				}

				var o = (y * width + x) * 4;

				bumps[y * width + x] = bump;
				data[o] = Math.round(Math.max(0, Math.min(1, color[0] * shade)) * 255);
				data[o + 1] = Math.round(Math.max(0, Math.min(1, color[1] * shade)) * 255);
				data[o + 2] = Math.round(Math.max(0, Math.min(1, color[2] * shade)) * 255);
				data[o + 3] = 255;
			}
		}

		/* Its relief: the slopes of its bumps (round its trunk wrapped), as a normal map of tangent space. */
		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				var dx = bumps[y * width + (x + 1) % width] - bumps[y * width + (x + width - 1) % width];
				var dy = bumps[Math.min(height - 1, y + 1) * width + x] - bumps[Math.max(0, y - 1) * width + x];
				var nx = -dx * 2.5;
				var ny = -dy * 2.5;
				var l = Math.sqrt(nx * nx + ny * ny + 1);
				var q = (y * width + x) * 4;

				normal[q] = Math.round((nx / l * 0.5 + 0.5) * 255);
				normal[q + 1] = Math.round((ny / l * 0.5 + 0.5) * 255);
				normal[q + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
				normal[q + 3] = 255;
			}
		}

		/* Its mean color (0 to 1): what a far copy of the plant is painted (SceneModels.Painted). */
		var mean = [0, 0, 0];

		for (x = 0; x < width * height; x += 7) {
			mean[0] += data[x * 4] / 255;
			mean[1] += data[x * 4 + 1] / 255;
			mean[2] += data[x * 4 + 2] / 255;
		}

		mean = mean.map(function (part) {
			return part / Math.ceil(width * height / 7);
		});

		return {Picture: {Width: width, Height: height, Data: data, Mean: mean}, Normal: {Width: width, Height: height, Data: normal}};
	},

	/*
	 * Its leaves: four clusters in an atlas, each a twig from the foot of its tile up with its leaves (broad: ovals with
	 * a darker rib, lighter where they face up; needles: fans of thin lines; a frond: a rib with leaflets each side),
	 * their colors between Shade and Light; where there is no leaf its color is the leaves' mean (no dark rims in its
	 * smaller levels), its alpha 0.
	 */
	LeafPicture: function (p) {
		var size = 512;
		var tall = 1024;
		var tile = 256;
		var data = new Uint8Array(size * tall * 4);
		var random = this.$Service('Random').Sequence(p.Name + ':leaves');
		var kind = p.Leaves.Kind;
		var mean = [0, 0, 0, 0];
		var t;

		function mix (a, b, k) {
			return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
		}

		function line (px, py, ax, ay, bx, by) {
			var abx = bx - ax;
			var aby = by - ay;
			var k = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)));
			var qx = ax + abx * k - px;
			var qy = ay + aby * k - py;

			return {Far: Math.sqrt(qx * qx + qy * qy), Along: k};
		}

		for (t = 0; t < 4; t++) {
			var ox = t % 2 * tile;
			var oy = Math.floor(t / 2) * tile;
			var parts = [];
			var stem = {A: [0.5 + (random() - 0.5) * 0.1, 0.02], B: [0.5 + (random() - 0.5) * 0.2, 0.9]};
			var k;
			var x;
			var y;

			/*
			 * A spray: its twig up the tile and side twigs off it (a frond: a rib up its middle), its leaves along all of them,
			 * overlapping as on a branch (broad: ovals; needles: a bottle brush of thin lines); about half the tile covered.
			 */
			var twigs = [stem];

			/* The last tile the head of its stalks (an ear, a plume, a cob, a disc, burrs). */
			if (t === 3 && p.Head && p.Head.Kind && p.Head.Kind !== 'none') {
				this.HeadPicture(p, data, size, ox, oy, tile, random);

				continue;
			}

			if (kind !== 'frond' && kind !== 'blade' && kind !== 'single') {
				for (k = 0; k < 4; k++) {
					var on = 0.18 + k * 0.17 + random() * 0.05;
					var from = [stem.A[0] + (stem.B[0] - stem.A[0]) * on, stem.A[1] + (stem.B[1] - stem.A[1]) * on];
					var turn = (k % 2 ? 1 : -1) * (0.55 + random() * 0.35);
					var reach = 0.2 + random() * 0.14;

					twigs.push({A: from, B: [Math.max(0.06, Math.min(0.94, from[0] + Math.sin(turn) * reach)), Math.min(0.96, from[1] + Math.cos(turn) * reach)]});
				}
			}

			if (kind === 'needles') {
				twigs.forEach(function (twig, index) {
					var dx = twig.B[0] - twig.A[0];
					var dy = twig.B[1] - twig.A[1];
					var dl = Math.sqrt(dx * dx + dy * dy) || 1;
					var count = index ? 55 : 120;
					var n;

					for (n = 0; n < count; n++) {
						var along = 0.04 + random() * 0.96;
						var bx = twig.A[0] + dx * along;
						var by = twig.A[1] + dy * along;
						var a = Math.atan2(dx / dl, dy / dl) + (random() < 0.5 ? -1 : 1) * (0.55 + random() * 0.55);
						var long = (0.08 + random() * 0.07) * (1 - along * 0.35);

						parts.push({Kind: 'needle', A: [bx, by], B: [bx + Math.sin(a) * long, by + Math.cos(a) * long], Width: 0.0042, Tone: random()});
					}
				});
			}
			else if (kind === 'frond') {
				for (k = 0; k < 46; k++) {
					var f = 0.04 + k / 46 * 0.92;
					var sideA = k % 2 ? 1 : -1;
					var len = 0.42 * Math.sin(Math.PI * Math.min(1, f * 1.1 + 0.05)) + 0.04;

					parts.push({Kind: 'needle', A: [0.5, f], B: [0.5 + sideA * len, f + len * 0.35], Width: 0.016 + 0.01 * random(), Tone: random()});
				}

				stem = {A: [0.5, 0], B: [0.5, 1]};
				twigs = [stem];
			}
			else if (kind === 'blade' || kind === 'single') {
				/*
				 * One leaf the whole tile (a strap of Strap lies along it): a blade of grass, narrow, its tip curling a little;
				 * a single big leaf, wide (a sunflower's, a burdock's), its foot on a short stalk.
				 */
				var bend = (random() - 0.5) * 0.12;

				parts.push({Kind: 'leaf', A: [0.5, kind === 'single' ? 0.08 : 0], B: [0.5 + bend, 0.99], Width: kind === 'single' ? 0.46 : 0.42, Tone: random()});

				stem = kind === 'single' ? {A: [0.5, 0], B: [0.5, 0.1]} : {A: [2, 2], B: [2, 2]};
				twigs = [stem];
			}
			else if (kind === 'compound') {
				/* Compound leaves (an acacia, an ash): small leaflets by pairs each side of each twig, one at its tip. */
				twigs.forEach(function (twig) {
					var dx = twig.B[0] - twig.A[0];
					var dy = twig.B[1] - twig.A[1];
					var dl = Math.sqrt(dx * dx + dy * dy) || 1;
					var count = Math.max(3, Math.round(dl / 0.04));
					var n;

					for (n = 1; n <= count; n++) {
						var along = n / count;
						var sx = twig.A[0] + dx * along;
						var sy = twig.A[1] + dy * along;
						var way = Math.atan2(dx / dl, dy / dl);
						var leaflet = 0.06 + random() * 0.025;

						[-1, 1].forEach(function (sign) {
							var a = n === count ? way : way + sign * (1.05 + random() * 0.3);

							parts.push({Kind: 'leaf', A: [sx, sy], B: [sx + Math.sin(a) * leaflet, sy + Math.cos(a) * leaflet], Width: leaflet * 0.3, Tone: random()});
						});
					}
				});
			}
			else {
				/* Narrow: long thin leaves, closer together (a willow, a peach). */
				var narrow = Math.max(0, Math.min(1, p.Leaves.Narrow || 0));

				twigs.forEach(function (twig) {
					var dx = twig.B[0] - twig.A[0];
					var dy = twig.B[1] - twig.A[1];
					var dl = Math.sqrt(dx * dx + dy * dy) || 1;
					var count = Math.max(3, Math.round(dl / (0.055 * (1 - narrow * 0.4))));
					var n;

					for (n = 1; n <= count; n++) {
						var along = n / count;
						var sx = twig.A[0] + dx * along;
						var sy = twig.A[1] + dy * along;
						var a = Math.atan2(dx / dl, dy / dl) + (n === count ? 0 : (n % 2 ? 1 : -1) * (0.6 - narrow * 0.25 + random() * 0.45));
						var leaf = (0.12 + random() * 0.07) * (1 + narrow * 0.45);

						parts.push({Kind: 'leaf', A: [sx, sy], B: [sx + Math.sin(a) * leaf, sy + Math.cos(a) * leaf], Width: leaf * 0.24 * (1 - narrow * 0.6), Tone: random()});
					}
				});
			}

			/* Its flowers and its fruits on its twigs, over its leaves: as many as Bloom and Fruit. */
			var over = [];

			[['bloom', p.Leaves.Bloom, 22, p.Leaves.BloomSize || 0.032], ['fruit', p.Leaves.Fruit, 10, p.Leaves.FruitSize || 0.03]].forEach(function (sort) {
				/* Small flowers (a lilac): more of them, as much covered, in clusters (its panicles). */
				var small = sort[0] === 'bloom' && sort[3] < 0.025;
				var many = Math.round((sort[1] || 0) * sort[2] * (small ? Math.pow(0.032 / sort[3], 2) : 1));
				var cluster = null;
				var n;

				for (n = 0; n < many; n++) {
					var twig = twigs[Math.floor(random() * twigs.length)];
					var along = 0.3 + random() * 0.7;
					var at = [twig.A[0] + (twig.B[0] - twig.A[0]) * along + (random() - 0.5) * 0.08, twig.A[1] + (twig.B[1] - twig.A[1]) * along + (random() - 0.5) * 0.08];

					if (small) {
						if (n % 14 === 0)
							cluster = [Math.max(0.15, Math.min(0.85, at[0])), Math.max(0.15, Math.min(0.9, at[1]))];

						/* A cone of a panicle: wide at its foot, narrow up its tip. */
						var up = random();

						at = [cluster[0] + (random() - 0.5) * 0.16 * (1 - up * 0.7), cluster[1] + up * 0.16 - 0.04];
					}

					var radius = sort[3] * (0.8 + random() * 0.4);

					over.push({Kind: sort[0], A: at, Width: radius, Tone: random(), Turn: random() * Math.PI * 2, Box: [at[0] - radius, at[1] - radius, at[0] + radius, at[1] + radius]});
				}
			});

			/* Each part a box round it: a pixel tests only those near it. */
			parts.forEach(function (part) {
				part.Box = [Math.min(part.A[0], part.B[0]) - part.Width, Math.min(part.A[1], part.B[1]) - part.Width, Math.max(part.A[0], part.B[0]) + part.Width, Math.max(part.A[1], part.B[1]) + part.Width];
			});

			for (y = 0; y < tile; y++) {
				for (x = 0; x < tile; x++) {
					var u = (x + 0.5) / tile;
					var v = (y + 0.5) / tile;
					var cover = 0;
					var color = null;
					var o = ((oy + y) * size + ox + x) * 4;
					var twig = twigs.reduce(function (best, one, index) {
						var hit = line(u, v, one.A[0], one.A[1], one.B[0], one.B[1]);

						return Math.min(best, hit.Far / (index ? 0.7 : 1));
					}, Infinity);

					parts.forEach(function (part) {
						if (u < part.Box[0] || u > part.Box[2] || v < part.Box[1] || v > part.Box[3]) return;

						var hit = line(u, v, part.A[0], part.A[1], part.B[0], part.B[1]);
						var width = part.Kind === 'leaf' ? part.Width * Math.sin(Math.PI * Math.min(1, hit.Along * 0.95 + 0.05)) : part.Width * (1 - hit.Along * 0.5);
						var inside = Math.max(0, Math.min(1, (width - hit.Far) * tile * 0.7 + 0.5));
						if (inside <= cover) return;

						var light = (1 - hit.Far / Math.max(1e-4, width)) * 0.6 + part.Tone * 0.4;
						var tone = mix(p.Leaves.Shade, p.Leaves.Light, Math.max(0, Math.min(1, light)));

						/* A darker rib down a broad leaf. */
						if (part.Kind === 'leaf' && hit.Far < width * 0.12)
							tone = mix(tone, p.Leaves.Shade, 0.5);

						cover = inside;
						color = mix(p.Leaves.Color, tone, 0.7);
					});

					/* The twig itself, brown. */
					if (kind !== 'frond' && twig < 0.007) {
						cover = 1;
						color = [0.3, 0.24, 0.18];
					}
					else if (kind === 'frond' && Math.abs(u - 0.5) < 0.012) {
						cover = 1;
						color = mix(p.Leaves.Color, [0.55, 0.5, 0.3], 0.4);
					}

					/* Its flowers (five petals, a yellow eye) and fruits (round, lit from above) over all. */
					over.forEach(function (part) {
						if (u < part.Box[0] || u > part.Box[2] || v < part.Box[1] || v > part.Box[3]) return;

						var fx = u - part.A[0];
						var fy = v - part.A[1];
						var far = Math.sqrt(fx * fx + fy * fy);
						var edge = part.Kind === 'bloom' ? part.Width * (0.62 + 0.38 * Math.abs(Math.cos((Math.atan2(fy, fx) + part.Turn) * 2.5))) : part.Width;
						var inside = Math.max(0, Math.min(1, (edge - far) * tile * 0.7 + 0.5));
						var lit;

						if (inside <= 0) return;

						if (part.Kind === 'bloom') {
							lit = 0.85 + part.Tone * 0.15 - far / part.Width * 0.15;
							color = far < part.Width * 0.22 ? [0.95, 0.8, 0.3] : mix([0, 0, 0], p.Leaves.BloomColor || [0.98, 0.96, 0.94], lit);
						}
						else {
							/* Its highlight up and to the left, darker toward its rim. */
							var shine = Math.max(0, 1 - Math.sqrt((fx + part.Width * 0.35) * (fx + part.Width * 0.35) + (fy - part.Width * 0.35) * (fy - part.Width * 0.35)) / (part.Width * 0.45));

							lit = 0.55 + 0.45 * (1 - far / part.Width);
							color = mix(mix([0, 0, 0], p.Leaves.FruitColor || [0.7, 0.1, 0.08], lit), [1, 0.95, 0.85], shine * shine * 0.6);
						}

						cover = Math.max(cover, inside);
					});

					if (color) {
						data[o] = Math.round(color[0] * 255);
						data[o + 1] = Math.round(color[1] * 255);
						data[o + 2] = Math.round(color[2] * 255);
						mean[0] += color[0] * cover;
						mean[1] += color[1] * cover;
						mean[2] += color[2] * cover;
						mean[3] += cover;
					}

					data[o + 3] = Math.round(cover * 255);
				}
			}
		}

		/* Where there is no leaf, the color of the leaves (alpha 0): no dark rims as it is made smaller. */
		mean = [mean[0] / Math.max(1, mean[3]), mean[1] / Math.max(1, mean[3]), mean[2] / Math.max(1, mean[3])];

		for (t = 0; t < size * size; t++) {
			if (data[t * 4 + 3] < 8) {
				data[t * 4] = Math.round(mean[0] * 255);
				data[t * 4 + 1] = Math.round(mean[1] * 255);
				data[t * 4 + 2] = Math.round(mean[2] * 255);
			}
		}

		/* Its lower half the same clusters in the shade of a crown: what its leaves deep in are cut of. */
		for (t = 0; t < size * size; t++) {
			var q = (size * size + t) * 4;

			data[q] = Math.round(data[t * 4] * 0.45);
			data[q + 1] = Math.round(data[t * 4 + 1] * 0.5);
			data[q + 2] = Math.round(data[t * 4 + 2] * 0.45);
			data[q + 3] = data[t * 4 + 3];
		}

		return {Width: size, Height: tall, Data: data, Mean: [mean[0] * 0.75, mean[1] * 0.78, mean[2] * 0.75]};
	},

	/*
	 * A plant as Gltf gives a file: one node, its mesh of two primitives (its bark; its leaves cut by their alpha, seen
	 * from both sides), their materials and the pictures (shared: a species draws them once).
	 */
	Asset: function (tree, textures) {
		function map (image, scale) {
			return {Image: image, Sampler: null, Set: 0, Offset: [0, 0], Repeat: [1, 1], Scale: scale === undefined ? 1 : scale, Strength: 1};
		}

		function material (name, color, rough, cut) {
			return {Name: name, BaseColor: [1, 1, 1, 1], Metallic: 0, Roughness: rough, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: map(color), MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: cut ? 'MASK' : 'OPAQUE', Cutoff: 0.45, DoubleSided: !!cut, Unlit: false, Specular: cut ? 0.25 : 0.3, SpecularColor: [1, 1, 1], SpecularMap: null};
		}

		function image (picture) {
			return {Data: null, Type: '', URI: '', Picture: picture, Mean: picture.Mean || null};
		}

		var bark = material('Bark', 0, 0.9, false);
		var leaves = material('Leaves', 2, 0.85, true);
		var images = [image(textures.Bark), image(textures.BarkNormal), image(textures.Leaves)];

		function primitives (made) {
			return [{Geometry: Object.assign({Colors: null}, made.Bark), Material: 0}, {Geometry: Object.assign({Colors: null}, made.Leaves), Material: 1}].filter(function (primitive) {
				return primitive.Geometry.Positions.length > 0;
			});
		}

		bark.NormalMap = map(1, 1);

		return {
			Nodes: [{Name: tree.Name || 'Plant', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}],
			Meshes: [primitives(tree)],
			/* Its simpler levels, primitives as its mesh's (in the space of its node): what SceneScatter draws farther. */
			Lods: (tree.Lods || []).map(primitives),
			/*
			 * How many times nearer its levels come than those of a thing as large (SceneScatter): one for each 1500 triangles
			 * of it near, 1 to 16 (an oak of 29 000 drawn whole to some 25 m, a bush to 6).
			 */
			Detail: Math.max(1, Math.min(16, tree.Triangles / 1500)),
			Materials: [bark, leaves],
			Images: images,
			Skins: [],
			Animations: [],
			Lights: [],
			Scene: [0]
		};
	},

	/*
	 * A species of a picture of a plant (a photograph on white or clear: its reference), from a preset to start of (base,
	 * the oak by default): {Preset (base with what the picture tells: its bare trunk, the profile of its crown, how wide,
	 * leaning and lumpy it is, the colors of its leaves and of its bark), Found {Box [x0, y0, x1, y1] (pixels of the plant:
	 * the largest of several), Foot (the row where its crown begins), Trunk (its column at its foot), Rows: [[row, left,
	 * right]...] (of its crown, every few rows), Holes (0 to 1, the sky through its crown)}}; null when no plant is found.
	 * picture {Width, Height, Data (RGBA)}.
	 */
	FromPicture: function (picture, base) {
		var width = picture.Width;
		var height = picture.Height;
		var data = picture.Data;
		var preset = this.Preset(base || 'oak');
		var background = [0, 0, 0];
		var mask = new Uint8Array(width * height);
		var columns = new Array(width).fill(0);
		var x;
		var y;
		var k;

		function at (px, py) {
			return (py * width + px) * 4;
		}

		function mean (list) {
			var sum = [0, 0, 0];

			list.forEach(function (color) {
				sum[0] += color[0];
				sum[1] += color[1];
				sum[2] += color[2];
			});

			return sum.map(function (part) {
				return Math.round(part / Math.max(1, list.length) / 255 * 1000) / 1000;
			});
		}

		/* Its background: the mean of its corners; a pixel of the plant is not clear and other than it. */
		[[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]].forEach(function (corner) {
			var o = at(corner[0], corner[1]);

			background[0] += data[o] / 4;
			background[1] += data[o + 1] / 4;
			background[2] += data[o + 2] / 4;
		});

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				var o = at(x, y);
				var far = Math.abs(data[o] - background[0]) + Math.abs(data[o + 1] - background[1]) + Math.abs(data[o + 2] - background[2]);

				if (data[o + 3] > 128 && far > 60) {
					mask[y * width + x] = 1;
					columns[x]++;
				}
			}
		}

		/*
		 * The plants side by side (a row of them, their crowns meeting): their trunks at the foot of all of them, each plant
		 * the columns nearer its trunk than the next one's; the plant is the one of most pixels.
		 */
		var lowest = -1;
		var highest = height;

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				if (!mask[y * width + x]) continue;

				lowest = Math.max(lowest, y);
				highest = Math.min(highest, y);
			}
		}

		if (lowest < 0) return null;

		var feet = [];
		var footing = new Array(width).fill(0);

		for (y = Math.max(highest, Math.round(lowest - (lowest - highest) * 0.08)); y <= lowest; y++) {
			for (x = 0; x < width; x++)
				footing[x] += mask[y * width + x];
		}

		for (x = 0; x < width; x++) {
			if (!footing[x]) continue;

			if (!feet.length || feet[feet.length - 1].To < x - Math.max(2, width * 0.01)) feet.push({From: x, To: x});
			else feet[feet.length - 1].To = x;
		}

		if (!feet.length)
			feet.push({From: 0, To: width - 1});

		/*
		 * Only what stands on its foot as thick as a trunk and goes up from it (a tenth of the height and more): no text by
		 * it (a mark of the picture), nor the tips of hanging leaves that touch the ground.
		 */
		feet.forEach(function (one) {
			/* Its thickest column (a trunk and a figure by it are one foot: not the gap between them). */
			var middle = one.From;
			var row;

			one.Weight = 0;

			for (var c = one.From; c <= one.To; c++) {
				one.Weight += footing[c];

				if (footing[c] > footing[middle])
					middle = c;
			}

			for (row = lowest; row >= highest; row--) {
				var any = false;

				for (var d = Math.max(0, middle - 2); d <= Math.min(width - 1, middle + 2) && !any; d++)
					any = !!mask[row * width + d];

				if (!any) break;
			}

			one.Column = middle;

			if (lowest - row < (lowest - highest) * 0.12)
				one.Weight = 0;
		});

		var heaviest = feet.reduce(function (most, one) {
			return Math.max(most, one.Weight);
		}, 0);

		feet = feet.filter(function (one) {
			return one.Weight >= heaviest * 0.12;
		});

		feet.forEach(function (one, index) {
			var middle = (one.From + one.To) / 2;
			var before = index ? (feet[index - 1].From + feet[index - 1].To) / 2 : -Infinity;
			var after = index < feet.length - 1 ? (feet[index + 1].From + feet[index + 1].To) / 2 : Infinity;

			one.From = Math.max(0, Math.ceil((before + middle) / 2));
			one.To = Math.min(width - 1, Math.floor((middle + after) / 2));
			one.Count = 0;

			for (var c = one.From; c <= one.To; c++)
				one.Count += columns[c];
		});

		var run = feet.reduce(function (best, one) {
			return one.Count > best.Count ? one : best;
		});
		var top = height;
		var bottom = -1;
		var rows = [];
		/*
		 * The plant itself: what is joined to its trunk in its columns (its crown by its branches), not a mark of the picture
		 * nor grass beside it.
		 */
		var plant = new Uint8Array(width * height);
		var seed = run.Column === undefined ? Math.round((run.From + run.To) / 2) : run.Column;
		var stack = [];
		var start = lowest;

		while (start > highest && !mask[start * width + seed])
			start--;

		stack.push(start * width + seed);

		while (stack.length) {
			var cell = stack.pop();
			var cx = cell % width;
			var cy = (cell - cx) / width;

			if (plant[cell] || !mask[cell] || cx < run.From || cx > run.To) continue;

			plant[cell] = 1;

			/* Its eight neighbours: a thin twig of a picture is joined by its corners. */
			for (var dy = -1; dy <= 1; dy++) {
				for (var dx = -1; dx <= 1; dx++) {
					if ((dx || dy) && cx + dx >= 0 && cx + dx < width && cy + dy >= 0 && cy + dy < height)
						stack.push(cell + dy * width + dx);
				}
			}
		}

		mask = plant;

		for (y = 0; y < height; y++) {
			var left = -1;
			var right = -1;

			for (x = run.From; x <= run.To; x++) {
				if (!mask[y * width + x]) continue;

				if (left < 0)
					left = x;

				right = x;
			}

			rows.push(left < 0 ? null : [left, right]);

			if (left >= 0) {
				top = Math.min(top, y);
				bottom = Math.max(bottom, y);
			}
		}

		var tall = bottom - top + 1;
		if (tall < 8) return null;

		/* Its widest row; its crown begins (from below) where a row is a quarter as wide as that. */
		var widest = 0;

		for (y = top; y <= bottom; y++) {
			if (rows[y])
				widest = Math.max(widest, rows[y][1] - rows[y][0] + 1);
		}

		/* Wide as a crown for a band of rows (a twentieth of its height and more): no text nor grass at its foot taken for it. */
		var foot = top;
		var band = Math.max(2, Math.round(tall * 0.06));

		function wide (row) {
			return rows[row] && rows[row][1] - rows[row][0] + 1 > widest * 0.25;
		}

		for (y = bottom; y >= top; y--) {
			var all = true;

			for (k = 0; k < band && all; k++)
				all = y - k < top || wide(y - k);

			if (all) {
				foot = y;

				break;
			}
		}

		/* Its trunk at its foot: the middle of its lowest rows. */
		var trunk = 0;
		var counted = 0;

		for (y = bottom; y > bottom - Math.max(2, tall * 0.04); y--) {
			if (!rows[y]) continue;

			trunk += (rows[y][0] + rows[y][1]) / 2;
			counted++;
		}

		trunk = counted ? trunk / counted : (run.From + run.To) / 2;

		/* The profile of its crown: its half width round its trunk, in nine steps from its foot to its top, each the most of a band. */
		var half = Math.max(1, widest / 2);
		var profile = [];
		var crown = foot - top + 1;
		var found = [];
		var holes = 0;
		var inside = 0;
		var middle = 0;
		var weight = 0;

		for (k = 0; k <= 8; k++) {
			var from = Math.round(foot - crown * Math.max(0, k - 0.5) / 8);
			var to = Math.round(foot - crown * Math.min(8, k + 0.5) / 8);
			var most = 0;

			for (y = Math.max(top, to); y <= Math.min(foot, from); y++) {
				if (rows[y])
					most = Math.max(most, Math.max(trunk - rows[y][0], rows[y][1] - trunk));
			}

			profile.push([Math.round(k / 8 * 1000) / 1000, Math.round(Math.min(1, most / half) * 1000) / 1000]);
		}

		/* The colors of its leaves (its crown, by how light: the darkest fifth its shade, the lightest its light) and the holes in it. */
		var leaves = [];

		for (y = top; y <= foot; y++) {
			if (!rows[y]) continue;

			if ((y - top) % Math.max(1, Math.round(crown / 24)) === 0)
				found.push([y, rows[y][0], rows[y][1]]);

			for (x = rows[y][0]; x <= rows[y][1]; x++) {
				inside++;

				if (!mask[y * width + x]) {
					holes++;

					continue;
				}

				var q = at(x, y);

				leaves.push([data[q], data[q + 1], data[q + 2], data[q] * 0.3 + data[q + 1] * 0.59 + data[q + 2] * 0.11]);

				middle += x;
				weight++;
			}
		}

		leaves.sort(function (a, b) {
			return a[3] - b[3];
		});

		/* The colors of its bark: its bare trunk below its crown, the lower third and the upper. */
		var low = [];
		var high = [];

		for (y = foot + 1; y <= bottom; y++) {
			if (!rows[y]) continue;

			for (x = rows[y][0]; x <= rows[y][1]; x++) {
				if (!mask[y * width + x]) continue;

				var b = at(x, y);

				(y > bottom - (bottom - foot) / 3 ? low : high).push([data[b], data[b + 1], data[b + 2]]);
			}
		}

		var fifth = Math.max(1, Math.floor(leaves.length / 5));
		var made = this.Preset(preset);

		made.Trunk.Bare = Math.round(Math.max(0.03, Math.min(0.9, (bottom - foot) / tall)) * 1000) / 1000;
		made.Trunk.Lean = Math.round(Math.max(-0.3, Math.min(0.3, ((weight ? middle / weight : trunk) - trunk) / tall)) * 1000) / 1000;
		made.Crown.Profile = profile;
		made.Crown.Width = Math.round(Math.max(0.05, Math.min(0.8, half / tall)) * 1000) / 1000;
		/* The sky through its crown: lumpy and open (a pine of tufts), or a dense round (a linden). */
		made.Crown.Clumps = Math.round(Math.max(0.1, Math.min(0.8, holes / Math.max(1, inside) * 1.6)) * 1000) / 1000;
		made.Crown.Hollow = Math.round(Math.max(0.25, Math.min(0.6, 0.6 - holes / Math.max(1, inside) * 0.5)) * 1000) / 1000;

		if (leaves.length > 20) {
			made.Leaves.Shade = mean(leaves.slice(0, fifth));
			made.Leaves.Light = mean(leaves.slice(-fifth));
			made.Leaves.Color = mean(leaves.slice(fifth * 2, fifth * 3));
		}

		if (low.length > 4)
			made.Bark.Low = mean(low);

		if (high.length > 4)
			made.Bark.High = mean(high);

		return {Preset: made, Found: {Box: [run.From, top, run.To, bottom], Foot: foot, Trunk: Math.round(trunk), Rows: found, Holes: Math.round(holes / Math.max(1, inside) * 1000) / 1000}};
	},

	/* The key a species is kept under (SceneCache): its preset, its variants, a sum of the code that grows it. */
	Key: function (preset, variants) {
		var self = this;
		var text;
		var sum = 0;
		var i;

		if (this.Code === undefined) {
			this.Code = 0;

			text = Object.keys(this).filter(function (name) {
				return typeof self[name] === 'function';
			}).sort().map(function (name) {
				return String(self[name]);
			}).join('\n');

			for (i = 0; i < text.length; i++)
				this.Code = (this.Code * 31 + text.charCodeAt(i)) >>> 0;
		}

		text = JSON.stringify(preset);

		for (i = 0; i < text.length; i++)
			sum = (sum * 31 + text.charCodeAt(i)) >>> 0;

		return preset.Name + ':' + variants + ':' + this.Code.toString(36) + ':' + sum.toString(36);
	},

	/*
	 * A species as a model of SceneModels: its Variants (8) made in workers the first time one is asked for (or taken as
	 * they were kept in the browser, SceneCache), its pictures once for all of them. Gives the name.
	 */
	Define: function (name, preset, options) {
		var self = this;
		var given = options || {};
		var p = this.Preset(preset);
		var variants = Math.max(1, Math.round(Number(given.Variants) || 8));
		var info = p.Grow === 'palm' ? 0.8 : p.Leaves.Kind === 'needles' ? 0.45 : 0.4;

		this.$Service('SceneModels').Define(name, {
			URL: 'flora:' + name,
			Group: given.Group || 'nature',
			Type: 'plant',
			Size: given.Size || (p.Height[0] + p.Height[1]) / 2,
			Sway: given.Sway === undefined ? info : given.Sway,
			Variants: variants,
			Flora: p.Name,
			Generate: function (callback) {
				var pool = self.Work();
				var trees = [];
				var textures = null;
				var left = variants + 1;
				var failed = null;
				var cache = self.$Service('SceneCache');
				var kept = p.Bark.Image || p.Leaves.Image || cache.ElemenxDeferred || given.Keep === false ? null : self.Key(p, variants);
				var hot;
				var v;

				function give () {
					/* One set of pictures for all its variants: drawn once on the screen. */
					var images = [textures.Bark, textures.BarkNormal, textures.Leaves].map(function (picture) {
						return {Data: null, Type: '', URI: '', Picture: picture, Mean: picture.Mean || null};
					});

					callback(null, trees.map(function (tree) {
						var asset = self.Asset(tree, textures);

						asset.Images = images;

						return asset;
					}));
				}

				function finish () {
					if (--left) return;

					if (failed) {
						callback(failed, null);

						return;
					}

					if (kept)
						cache.Put('flora', kept, {Trees: trees, Textures: textures});

					give();
				}

				function grow (variant) {
					pool.Run('SceneFlora', 'Tree', [p, variant], function (error, made) {
						failed = failed || error;
						trees[variant] = made;

						finish();
					});
				}

				function make () {
					pool.Run('SceneFlora', 'Textures', [p], function (error, made) {
						failed = failed || error;
						textures = made;

						finish();
					});

					for (v = 0; v < variants; v++)
						grow(v);
				}

				function found (value) {
					trees = value.Trees;
					textures = value.Textures;

					give();
				}

				/*
				 * Grown before (SceneCache, by its preset, its variants and the code that grows it): at once; this page's own
				 * copy first. Not of pictures of its own (they would be its key).
				 */
				hot = kept ? cache.Peek('flora', kept) : undefined;

				if (hot) {
					found(hot);

					return;
				}

				if (!kept || !cache.Knows('flora', kept)) {
					make();

					return;
				}

				cache.Get('flora', kept, function (error, value) {
					if (value && value.Trees && value.Trees.length === variants) found(value);
					else make();
				});
			}
		});

		return name;
	}
});
