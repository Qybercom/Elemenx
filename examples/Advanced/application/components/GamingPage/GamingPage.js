/*
 * GamingPage (/gaming): the demos of the games of ElemenxGaming, one at a time (?demo=Name; the first by default), in a
 * DemoFrame that keeps a phone in landscape over the whole screen.
 */
Elemenx.Component('GamingPage', {
	$TemplateURL: 'GamingPage.html',
	Demos: [
		{Name: 'Game', Label: 'Game', Note: 'Scene · SceneAboard · SceneGalaxy · Vehicles: one game, one state for all its levels, its commands in tabs: Flight (in the pilot seat round Terra: W and S the speed, A and D yaw, R and F pitch, H warps; G out of the seat to walk in the ship as it flies, E a console or the turret; Land at a place and Take off with the crew walking in it; G by the airlock out into space in a suit), Galaxy (the map of the galaxy: another star, its system, its planets to land on; Home back to Terra; the graphs of the bodies), Character (chosen live; the gaits graphs of the mannequin), Combat (the weapons, 1 to 0, and a range of targets), Racing (a car and a track by the ship, G in and out), Strategy (squads and the view over them to command them)'},
		{Name: 'World', Label: 'Strategy', Note: 'Scene · GameStrategy: a press or a frame selects, a right press orders (on a foe: attack), Ctrl and the right button turn the view, S stops, Ctrl+A all; fingers: a tap selects, a press orders, one finger carries the map'},
		{Name: 'Racing', Label: 'Racing', Note: 'Scene · SceneRoads · Vehicles: a click takes the mouse, W drives, S goes back, A and D steer, Space brakes, Shift drifts, C the hand brake, L the lights, Z and X the indicators, V the camera; on a touch screen the gamepad drives'},
		{Name: 'Orbit', Label: 'Orbit', Note: 'Scene · Vehicles: W and S set the speed, A and D yaw, R and F pitch, Q and E roll, C and X lift, Shift boosts, Space stops it, H warps to the place chosen, J jumps ahead, the mouse looks round; on a touch screen the gamepad flies'},
		{Name: 'Universe', Label: 'Universe', Note: 'Scene · SceneGalaxy · Vehicles: the galaxy, its systems and their grounds in one scene: home in the system of Terra, Galaxy map for another star; T aims, G turns to it, H warps, J jumps while held, [ and ] the step of warp; Go to: a gas and an ice giant (inside down to the core), worlds as Venus, Titan, Mercury (their air, clouds, light and lands of one model); Cockpit; Envelope and Planet graphs'},
		{Name: 'Combat', Label: 'Combat and magic', Note: 'Scene · SceneWeapons, SceneDebris, SceneFracture, SceneEffects; GameCombat: weapons, hits by material, marks, locks, health, what breaks, a transporter beam, circles on any surface'}
	],

	/* The demo shown: the one the address names, else the first. */
	Shown: function (query) {
		var asked = query && query.demo;

		return (this.Demos || []).some(function (demo) {
			return demo.Name === asked;
		}) ? asked : this.Demos[0].Name;
	},

	Choose: function (event) {
		this.$Router().Replace('/gaming?demo=' + encodeURIComponent(event.Name));
	}
});
