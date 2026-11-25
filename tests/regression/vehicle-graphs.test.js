import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import vehiclesSource from '../../libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.js?raw';
import effectsSource from '../../libraries/ElemenxGraphics/traits/SceneEffects/SceneEffects.js?raw';
import landingSource from '../../libraries/ElemenxGraphics/traits/SceneLanding/SceneLanding.js?raw';
import cameraSource from '../../libraries/ElemenxGraphics/traits/SceneCamera/SceneCamera.js?raw';
import sceneSource from '../../libraries/ElemenxGraphics/components/Scene/Scene.js?raw';

/* A state of a vehicle of chance (a seeded sequence), as the drives read it. */
function states (count) {
	var seed = 7;
	var list = [];
	var i;

	function next () {
		seed = (seed * 16807) % 2147483647;

		return seed / 2147483647;
	}

	for (i = 0; i < count; i++)
		list.push({
			Steer: next() * 2 - 1, Gas: next() < 0.3 ? 0 : next(), Brake: next() < 0.5 ? 0 : next(), Hand: next(), Shifting: next() < 0.5 ? 0 : next(), Shifted: next() < 0.5 ? -1 : 1,
			Indicate: [-1, 0, 1][Math.floor(next() * 3)], Wipers: next() < 0.5 ? 1 : 0, Swept: next() * 9, Period: 0.8 + next(), Stroke: next() * 0.2 - 0.1, Size: 0.5 + next() * 3,
			Length: 0.1 + next() * 0.4, Front: next() < 0.5 ? 1 : 0, Spin: next() * 90, Forward: next() * 120 - 20, Top: 60 + next() * 60, Rpm: next() * 9000, Redline: 6000 + next() * 3000,
			SpinPitch: next() * 4 - 2, SpinYaw: next() * 4 - 2, SpinRoll: next() * 4 - 2, Turn: 0.5 + next() * 2, Ship: next() < 0.5 ? 1 : 0, Throttle: next(), Landed: next() < 0.5 ? 1 : 0,
			AimYaw: next() * 90 - 45, AimPitch: next() * 40 - 20, Fired: next() < 0.5 ? 1 : 0, FiredAge: next() * 2, Gust: next() * 0.5, Hour: next() * 24,
			Lights: next() < 0.5 ? 1 : 0, Hazard: next() < 0.2 ? 1 : 0, Side: next() < 0.5 ? -1 : 1, Blink: next() * 5, Gear: [-1, 0, 1, 2, 3][Math.floor(next() * 5)], GearKnown: next() < 0.8 ? 1 : 0,
			WasGas: next() < 0.5 ? 1 : 0, Pace: next() * 30, On: next() * 2 - 1, Boost: next() < 0.5 ? 1 : 0,
			Height: next() * 200, Airspeed: next() * 300
		});

	return list;
}

/* The drives as the code reckoned them before (drivenOf, drivenMore, lampOn, pops, emitStep of SceneVehicles). */
function before (s) {
	var gear = s.GearKnown ? s.Gear : undefined;
	var braking = s.Brake > 0.05 && s.Forward > -0.5 && gear !== -1;
	var way = s.Hazard ? s.Side : -s.Indicate;

	return {
		steer: s.Steer, gas: s.Gas, brake: s.Brake, hand: s.Hand,
		paddle: s.Shifting > 0 ? s.Shifted : 0, sequential: s.Shifting > 0 ? -s.Shifted : 0, indicator: s.Indicate,
		wipers: s.Wipers ? 0.5 - 0.5 * Math.cos(s.Swept * Math.PI * 2 / s.Period) : 0,
		stroke: s.Stroke / s.Size / s.Length, 'wheel-steer': s.Front ? s.Steer * 0.5 : 0, roll: s.Spin / (Math.PI * 2),
		speed: Math.min(1, Math.abs(s.Forward) / Math.max(1, s.Top)), rpm: Math.min(1, s.Rpm / Math.max(1, s.Redline)),
		pitch: Math.max(-1, Math.min(1, s.SpinPitch / s.Turn)), yaw: Math.max(-1, Math.min(1, s.SpinYaw / s.Turn)), 'roll-air': Math.max(-1, Math.min(1, s.SpinRoll / s.Turn)),
		throttle: s.Throttle, flaps: s.Ship && s.Throttle < 0.3 ? 1 : 0,
		/* New: the gear stays up only high or fast (GearHeight 60 m, GearSpeed 120 m/s); it came down only as a ship landed. */
		airborne: s.Ship && !s.Landed && (s.Height > 60 || s.Airspeed > 120) ? 1 : 0,
		'aim-yaw': s.AimYaw, 'aim-pitch': s.AimPitch, fire: s.Fired ? Math.exp(-Math.max(0, s.FiredAge) * 12) : 0,
		wind: Math.max(0.1, s.Gust), 'clock-hour': (s.Hour % 12) / 12, 'clock-minute': (s.Hour * 60 % 60) / 60,
		'lamp-head': s.Lights ? 1 : 0, 'lamp-rear': braking ? 1 : s.Lights ? 0.3 : 0, 'lamp-brake': braking ? 1 : 0,
		'lamp-reverse': gear === -1 || gear === undefined && s.Forward < -0.3 ? 1 : 0,
		'lamp-indicator': way === s.Side && Math.floor(s.Blink / 0.36) % 2 === 0 ? 1 : 0,
		pop: !s.WasGas || s.Gas || s.Pace < 14 ? 0 : 1, emit: Math.max(0.15, Math.abs(s.On)),
		'thrust-car': (s.Gas ? 0.45 : 0.04) + 0.55 * Math.min(1, s.Pace / s.Top) * (s.Gas ? 1 : 0), 'thrust-boat': s.Gas ? 0.3 + 0.7 * Math.min(1, s.Pace / s.Top) : 0.05,
		'thrust-ship': Math.abs(s.Throttle) * (s.Boost ? 2 : 1)
	};
}

/*
 * Regression: what each moving part, lamp, emitter and pop of a vehicle is driven to was formulas of the code
 * (SceneVehicles: drivenOf, drivenMore, lampOn, pops, emitStep). They are the graph of the library now (blueprints/vehicles/
 * drives, DrivesGraph in its place), the very values (cos and exp within a unit of the last place: those of the graphs).
 */
describe('Regression: the drives of the parts of a vehicle, a graph of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints']);
	});

	it('drives each part as the code did, of the same state', function () {
		var code = Elemenx.Service('Blueprints').Code(JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/vehicles/drives'))));

		states(400).forEach(function (state) {
			var made = code.Run({}, state);
			var want = before(state);

			Object.keys(want).forEach(function (key) {
				expect([key, made[key]]).toEqual([key, expect.closeTo(want[key], 12)]);
			});
		});

		expect(vehiclesSource).not.toContain("case 'wheel-steer':");
	});

	/* The wheel: round its axle (not a wheel held still), the front ones steered by half the wheel, down by its stroke. */
	it('turns a wheel as the code did: its spin, its steering, its drop on the spring, no lean', function () {
		var code = Elemenx.Service('Blueprints').Code(JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/vehicles/wheel'))));

		states(200).forEach(function (state, index) {
			var held = index % 3 === 0 ? 1 : 0;
			var made = code.Run({}, {Spin: state.Spin, Steer: state.Steer, Stroke: state.Stroke, Size: state.Size, Front: state.Front, Held: held, Side: 1});

			expect(made.SpinAngle).toBe(held ? 0 : state.Spin);
			expect(made.SteerAngle).toBe(state.Front ? state.Steer * 0.5 : 0);
			expect(made.Drop).toBe(state.Stroke / state.Size);
			expect(made.Camber).toBe(0);
		});

		expect(vehiclesSource).toContain('WheelGraph');
	});

	/* What burns on an engine: longer, brighter and glowing inside as its thrust grows. */
	it('makes the flame of an engine of its thrust as the code did', function () {
		var code = Elemenx.Service('Blueprints').Code(JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/vehicles/thrust'))));

		[0, 0.04, 0.1, 0.3, 0.5, 1, 1.7, 3].forEach(function (thrust) {
			var made = code.Run({}, {Thrust: thrust});

			expect(made.Length).toBe(0.25 + thrust);
			expect(made.Intensity).toBe(Math.min(1, thrust * 6) * (0.9 + 1.5 * Math.min(1, thrust)));
			expect(made.Inside).toBe(0.75);
		});

		expect(effectsSource).not.toContain('seen.Length *= 0.25 + carrier.Thrust');
		expect(vehiclesSource).toContain('DrivesGraph');
	});
});

/*
 * Regression: how a landing looks (the heat of the air: two formulas of the code, unlike; the view, the thrust of each phase,
 * the nose raised) and how a view shakes (a rig held or hovering, the steps, the heat, the kick of a shot: three of the code)
 * are graphs of the library (blueprints/landing/look, blueprints/camera/shake), the very values; and new: a blast near, the
 * engine and the road shake the hero, as the square of all of them.
 */
describe('Regression: the look of a landing and the shake of a view, graphs of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints']);
	});

	function run (name, inputs) {
		return Elemenx.Service('Blueprints').Code(JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + name)))).Run({}, inputs);
	}

	function smooth (from, to, value) {
		var s = Math.max(0, Math.min(1, (value - from) / (to - from)));

		return s * s * (3 - 2 * s);
	}

	function wander (time, seed, rate) {
		return Math.sin(time * rate * 6.2832 + seed * 1.7) * 0.5 + Math.sin(time * rate * 6.2832 * 2.31 + seed * 4.3) * 0.3 + Math.sin(time * rate * 6.2832 * 5.17 + seed * 9.1) * 0.2;
	}

	it('looks as the code did coming down: its heat, its view, its thrust of each phase, its nose', function () {
		states(200).forEach(function (s) {
			var inputs = {Thick: s.Throttle, Speed: s.Spin / 10, Over: s.Hour * 6, Going: s.Ship, Throttle: s.Gas, Manual: s.Landed, T: s.Blink / 5, Landed: s.Fired, Pull: s.Pace, Flat: s.Forward, Top: s.Top};
			var made = run('landing/look', inputs);
			var heat = inputs.Thick * 0.6 * smooth(1.5, 6, inputs.Speed) * Math.exp(-Math.pow((inputs.Over - 65) / 28, 2)) * (inputs.Going ? 0.25 : 1);

			expect(made.Heat).toBeCloseTo(heat, 12);
			expect(made.Fov).toBeCloseTo(1 + heat * 0.12, 12);
			expect(made.Thrust).toBeCloseTo(0.3 + inputs.Throttle * 0.7 + (inputs.Going ? 0.6 : 0), 12);
			expect(made.Raise).toBeCloseTo(inputs.Manual ? 0 : 0.7 * smooth(25, 55, inputs.Over) * (inputs.Going ? 0 : 1), 12);
			expect(made.TransferThrust).toBeCloseTo(1 + 1.5 * Math.sin(Math.PI * inputs.T), 12);
			expect(made.OrbitThrust).toBe(0.05);
			expect(made.HoverThrust).toBeCloseTo(inputs.Landed ? 0 : 0.35 + Math.min(1.6, inputs.Pull / 10 + inputs.Flat / inputs.Top), 12);
		});

		expect(landingSource).not.toContain('Math.exp(-Math.pow((over - 65) / 28, 2))');
		expect(sceneSource).not.toContain('Math.abs(Math.log(surface.Altitude / 80))');
	});

	it('shakes a view as the code did: held, hovering, carried, in the heat, kicked; and of a blast, an engine, a road', function () {
		states(200).forEach(function (s) {
			var time = s.Swept * 3;
			var seed = s.Hour;
			var shake = s.Throttle * 0.3;
			var hover = s.Ship;
			var made = run('camera/shake', {Time: time, Seed: seed, Shake: shake, Hover: hover, Walked: s.Blink, Stride: s.Front * shake * 2, Heat: s.Gas, Size: s.Size, Kick: s.Hand * 0.05, Elapsed: 0.016, Blast: 0, Rpm: 0, Jolt: 0});
			var walk = s.Front * shake * 2;

			expect(made.X).toBeCloseTo(hover ? wander(time, seed, 0.21) * 0.05 * shake / 0.15 : 0, 12);
			expect(made.Y).toBeCloseTo((hover ? wander(time, seed + 2, 0.17) * 0.04 * shake / 0.15 : wander(time, seed + 8, 0.27) * 0.004 * shake * 2) + Math.abs(Math.sin(s.Blink * Math.PI)) * 0.025 * walk, 12);
			expect(made.Pitch).toBeCloseTo(hover ? wander(time, seed + 7, 23) * 0.0006 * shake / 0.15 : (wander(time, seed, 0.27) * 0.007 + wander(time, seed + 1, 7.3) * 0.0016) * shake * 2, 12);
			expect(made.Yaw).toBeCloseTo(hover ? 0 : (wander(time, seed + 3, 0.19) * 0.009 + wander(time, seed + 4, 6.1) * 0.0014) * shake * 2, 12);
			expect(made.Roll).toBeCloseTo((hover ? 0 : wander(time, seed + 6, 0.23) * 0.012 * shake * 2) + Math.sin(s.Blink * Math.PI) * 0.012 * walk, 12);
			expect(made.HeatRight).toBeCloseTo((Math.sin(time * 47) + Math.sin(time * 23) * 0.5) * s.Size * 0.04 * s.Gas, 12);
			expect(made.HeatUp).toBeCloseTo((Math.sin(time * 41 + 1) + Math.sin(time * 19) * 0.5) * s.Size * 0.04 * s.Gas, 12);
			expect(made.KickTaken).toBeCloseTo(Math.min(s.Hand * 0.05, 0.016 * 0.6 + s.Hand * 0.05 * 0.016 * 12), 12);
			expect([made.TraumaPitch, made.TraumaYaw, made.TraumaRoll]).toEqual([0, 0, 0]);
		});

		/* A blast near shakes as the square of it and fades; an engine at its redline and a road shake a little. */
		var blast = run('camera/shake', {Time: 1.3, Seed: 3, Elapsed: 0.1, Blast: 0.8, Rpm: 0, Jolt: 0});
		var engine = run('camera/shake', {Time: 1.3, Seed: 3, Elapsed: 0.1, Blast: 0, Rpm: 1, Jolt: 0});

		expect(Math.abs(blast.TraumaPitch) + Math.abs(blast.TraumaYaw)).toBeGreaterThan(0.001);
		expect(Math.abs(engine.TraumaPitch)).toBeLessThan(Math.abs(blast.TraumaPitch));
		expect(blast.BlastLeft).toBeCloseTo(0.65, 12);
		expect(cameraSource).not.toContain('function wander');

		/* A way far at once (Warp): the view behind the ship shakes as the code did. Regression: sines of its own in the code. */
		states(50).forEach(function (s) {
			var time = s.Swept * 3;
			var made = run('camera/shake', {Time: time, Size: s.Size, Warp: s.Throttle, Elapsed: 0.016, Blast: 0, Rpm: 0, Jolt: 0});

			expect(made.WarpRight).toBeCloseTo((Math.sin(time * 61) + Math.sin(time * 37) * 0.5) * s.Size * 0.012 * s.Throttle, 12);
			expect(made.WarpUp).toBeCloseTo((Math.sin(time * 53 + 1) + Math.sin(time * 29) * 0.5) * s.Size * 0.012 * s.Throttle, 12);
		});

		expect(vehiclesSource).not.toContain('Math.sin(time * 61)');
	});

	/*
	 * A ship in the air banks as the code did (SceneLanding: its turn by its speed up to 40 m/s, 0.9 of it, 0.6 at most, a
	 * third of the way a second); in space less of it (SpaceBank). A car leans on its springs: 1.2 degrees a g it speeds up
	 * or brakes, 2.5 a g it turns, out of it, less as it is stiffer, none off the ground.
	 */
	it('banks a ship as the code did in the air, and leans the body of a car on its springs', function () {
		states(100).forEach(function (s) {
			var turn = s.SpinYaw;
			var flat = s.Pace * 3;
			var air = run('vehicles/bank', {Turn: turn, Speed: flat, Air: 1, Landed: 0});
			var space = run('vehicles/bank', {Turn: turn, Speed: flat, Air: 0, Landed: 0});
			var accel = s.Forward / 4 - 10;
			var lateral = s.Steer * 15;
			var body = run('vehicles/body', {Accel: accel, Lateral: lateral, Stiff: 1, Grounded: 1});

			expect(air.Roll).toBeCloseTo(Math.max(-0.6, Math.min(0.6, turn * Math.min(1, flat / 40) * 0.9)), 12);
			expect(air.Rate).toBe(3);
			expect(Math.abs(space.Roll)).toBeCloseTo(Math.min(0.6, Math.abs(turn * 0.4 * 0.9)), 12);
			expect(body.Pitch).toBeCloseTo(Math.max(-4, Math.min(4, accel / 9.81 * 1.2)) * Math.PI / 180, 12);
			expect(body.Roll).toBeCloseTo(Math.max(-6, Math.min(6, lateral / 9.81 * 2.5)) * Math.PI / 180, 12);
		});

		expect(run('vehicles/bank', {Turn: 1, Speed: 100, Air: 1, Landed: 1}).Roll).toBe(0);
		expect(run('vehicles/body', {Accel: 9.81, Lateral: 0, Stiff: 2, Grounded: 1}).Pitch).toBeCloseTo(0.6 * Math.PI / 180, 12);
		expect(run('vehicles/body', {Accel: 9.81, Lateral: 9.81, Stiff: 1, Grounded: 0}).Roll).toBe(0);
		expect(landingSource).not.toContain('clamp(yawRate * Math.min(1, flat / 40) * 0.9, -0.6, 0.6)');
	});
});

/*
 * Contract: what comes with a ship in the air and low over the ground: the cocoon of hot air (red, then white-blue as it
 * heats), a white trail high up, dust its jets blow low, the bang past the speed of sound; and the air trembling behind its
 * engines as hard as they burn. Each an effect of the library (plasma, contrail, jetdust, sonicboom), driven of the graphs.
 */
describe('Contract: the effects that come with a ship, of the graphs of its look', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints']);
	});

	function run (name, inputs, parameters) {
		return Elemenx.Service('Blueprints').Code(JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/' + name)))).Run(parameters || {}, Object.assign({Thick: 0, Speed: 0, Over: 0, Going: 0, Throttle: 0, Manual: 0, T: 0, Landed: 0, Pull: 0, Flat: 0, Top: 1, Height: 0, Size: 1, Push: 0}, inputs));
	}

	it('burns a cocoon coming in hot, leaves a trail high up, blows dust low, knows the speed of sound', function () {
		var hot = run('landing/look', {Thick: 0.9, Speed: 6, Over: 65});
		var cool = run('landing/look', {Thick: 0.9, Speed: 2, Over: 100});
		var trail = run('landing/look', {Thick: 0.9, Speed: 0.4, Over: 11}, {Contrail: 1});
		var low = run('landing/look', {Height: 5, Size: 40, Push: 1});
		var high = run('landing/look', {Height: 400, Size: 40, Push: 1});

		expect(hot.Cocoon).toBe(1);
		expect(hot.CocoonHot).toBeGreaterThan(cool.CocoonHot);
		expect(run('landing/look', {Thick: 1.6, Speed: 6, Over: 65}).CocoonHot).toBe(1);
		expect(cool.Cocoon).toBeLessThan(0.05);
		expect(trail.Contrail).toBe(1);
		expect(run('landing/look', {Thick: 0.9, Speed: 0.4, Over: 30}, {Contrail: 1}).Contrail).toBe(0);

		/* None by default (the parameter Contrail of the graph): it hung over the place a ship landed at as a wall of smoke. */
		expect(run('landing/look', {Thick: 0.9, Speed: 0.4, Over: 11}).Contrail).toBe(0);
		expect(low.Dust).toBe(1);
		expect(high.Dust).toBe(0);
		expect(run('landing/look', {Speed: 0.343}).Mach).toBeCloseTo(1, 12);
		expect(run('vehicles/thrust', {Thrust: 0.4}).Haze).toBe(0.4);
		expect(run('vehicles/thrust', {Thrust: 3}).Haze).toBe(1);

		['plasma', 'contrail', 'jetdust', 'sonicboom'].forEach(function (name) {
			expect(Elemenx.Resources('Blueprints', 'ElemenxGraphics/effects/' + name).type).toBe('effect');
		});
	});
});
