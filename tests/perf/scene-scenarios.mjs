/*
 * The scenarios of the bench of 3D (tests/perf/scene.bench.mjs): every demo of the pages /gaming and /graphics of the
 * Advanced example (tests/regression/scene-bench.test.js checks that none is missing). Move: what the bench does while
 * it measures: 'track' drives the car of Racing round its track, a list of keys holds them down (W: on, as a player
 * goes), 'turn' turns the view slowly (a picture kept while nothing moves, the galaxies, is drawn again), none stays
 * still (the demo moves by itself, or not). Wait: what shows a demo with no Scene (it is ready once that is there).
 */
export var Scenarios = [
	{Name: 'Game', Page: 'gaming', Move: ['KeyW']},
	{Name: 'World', Page: 'gaming'},
	{Name: 'Racing', Page: 'gaming', Move: 'track'},
	{Name: 'Orbit', Page: 'gaming', Move: ['KeyW']},
	{Name: 'Universe', Page: 'gaming'},
	{Name: 'Combat', Page: 'gaming', Move: ['KeyW']},
	{Name: 'Terrain', Page: 'graphics', Move: ['KeyW']},
	{Name: 'Locations', Page: 'graphics', Move: ['KeyW']},
	{Name: 'Space', Page: 'graphics'},
	{Name: 'DeepSpace', Page: 'graphics'},
	{Name: 'Galaxy', Page: 'graphics', Move: 'turn'},
	{Name: 'Showcase', Page: 'graphics'},
	{Name: 'Gaits', Page: 'graphics'},
	{Name: 'Models', Page: 'graphics'},
	{Name: 'Textures', Page: 'graphics', Wait: '.elemenx-texture-lab-canvas'},
	{Name: 'Cinema', Page: 'graphics'},
	{Name: 'WorldEditor', Page: 'graphics', Move: 'turn'}
];

/* The levels of the light measured, each chosen (the demos keep it: DemoQuality); auto is not, it changes as it goes. */
export var Qualities = ['medium', 'high', 'ultra'];

/*
 * What --check holds to the baseline, a tenth over it at most: the numbers of a frame that do not hang on the machine
 * (its times are shown, not checked).
 */
export var Checked = ['Draws', 'Triangles', 'Gl', 'Garbage'];

export var Tolerance = 0.1;
