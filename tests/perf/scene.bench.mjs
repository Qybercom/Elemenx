/*
 * The bench of the frames of 3D: node tests/perf/scene.bench.mjs (npm run test:bench3d) serves the Advanced example,
 * opens Chrome with its window and the graphics card (as a player sees it, at the low priority of the processor), and
 * for each demo of scene-scenarios.js and each level of its light (medium, high, ultra) measures its frames:
 * - the time of a frame (median, 95th percentile, the longest, the hitches over 50 ms), the CPU of the scene a frame;
 * - its draws and triangles (Scene.Drawn), the calls of WebGL a frame (draw*, uniform*, bindTexture, activeTexture,
 *   bufferData, bufferSubData, vertexAttribPointer, useProgram, bindVertexArray, bindFramebuffer), the garbage a frame
 *   (what the heap grew between frames): each of a frame the scenes drew, not of the frames they rested through;
 * - its load: the time to the first picture, the longest task, the programs linked.
 * The level is the one of DemoQuality (the demos keep it in the browser); a demo is warmed 5 seconds, measured 10 (--seconds=N),
 * moved as its scenario says (the car of Racing driven round its track, the keys held down, the view turned). Each level
 * loads the demo anew: what one level moved is not what the next one measures.
 * Arguments: names of demos (all of them by default), --quality=high (one level), --save (writes the numbers to
 * tests/perf/scene-baseline.json), --check (fails when draws, triangles, calls of WebGL or garbage are more than a tenth
 * over the baseline; the times are shown, not checked: they hang on the machine), --detail (the passes of a frame, each
 * framebuffer with its size, its draws and triangles, and the functions that took the processor most).
 * It is a measure, not a test: npm test does not run it.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Checked, Qualities, Scenarios, Tolerance } from './scene-scenarios.mjs';

var require = createRequire(import.meta.url);
var Server = require('../../tools/server.js');
var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
var project = path.join(root, 'examples', 'Advanced');
var baselineFile = path.join(root, 'tests', 'perf', 'scene-baseline.json');
var args = process.argv.slice(2);
var flags = {};

args.filter(function (arg) {
	return arg.indexOf('--') === 0;
}).forEach(function (arg) {
	var parts = arg.substring(2).split('=');

	flags[parts[0]] = parts.length > 1 ? parts[1] : true;
});

var only = args.filter(function (arg) {
	return arg.indexOf('--') !== 0;
});
var seconds = Number(flags.seconds) > 0 ? Number(flags.seconds) : 10;
var qualities = flags.quality ? String(flags.quality).split(',') : Qualities;
var baseline = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : {};
var results = {};
var failures = [];

/* What the page counts: the calls of WebGL (by framebuffer with --detail), the frames, the heap, the long tasks. */
function instrument (given) {
	var quality = given.Quality;
	var detail = given.Detail;
	var bench = window.__bench = {On: false, Detail: detail, Gl: {}, Passes: {}, Pass: 'screen', Size: '', Ids: new WeakMap(), Next: 1, Links: 0, Frames: [], Garbage: 0, Heap: 0, Long: []};
	var proto = WebGL2RenderingContext.prototype;
	var counted = /^(drawArrays|drawElements|drawArraysInstanced|drawElementsInstanced|drawRangeElements|uniform|bindTexture|activeTexture|bufferData|bufferSubData|vertexAttribPointer|vertexAttribIPointer|useProgram|bindVertexArray|bindFramebuffer)/;

	try {
		window.localStorage.setItem('ui-kit-quality', quality);
	}
	catch (error) {
		bench.Storage = false;
	}

	function pass () {
		var key = bench.Pass + ' ' + bench.Size;

		bench.Passes[key] = bench.Passes[key] || {Draws: 0, Triangles: 0};

		return bench.Passes[key];
	}

	Object.getOwnPropertyNames(proto).forEach(function (name) {
		var descriptor = Object.getOwnPropertyDescriptor(proto, name);
		var real = descriptor && descriptor.value;
		var key = /^uniform/.test(name) ? 'uniform*' : /^draw/.test(name) ? 'draw*' : name;
		var draw = /^draw/.test(name);
		var instanced = /Instanced$/.test(name);

		if (typeof real !== 'function') return;

		if (name === 'linkProgram') {
			proto[name] = function () {
				bench.Links++;

				return real.apply(this, arguments);
			};

			return;
		}

		if (name === 'viewport') {
			proto[name] = function (x, y, width, height) {
				bench.Size = width + 'x' + height;

				return real.apply(this, arguments);
			};

			return;
		}

		if (!counted.test(name)) return;

		proto[name] = function (a, b, c, d, e) {
			var one;

			if (name === 'bindFramebuffer' && (a === this.FRAMEBUFFER || a === this.DRAW_FRAMEBUFFER)) {
				if (b && !bench.Ids.has(b))
					bench.Ids.set(b, bench.Next++);

				bench.Pass = b ? 'framebuffer ' + bench.Ids.get(b) : 'screen';
			}

			if (bench.On) {
				bench.Gl[key] = (bench.Gl[key] || 0) + 1;

				if (draw && bench.Detail) {
					one = pass();
					one.Draws++;

					if (a === this.TRIANGLES)
						one.Triangles += Math.floor((name === 'drawRangeElements' ? d : name === 'drawArrays' || name === 'drawArraysInstanced' ? c : b) / 3) * (instanced ? name === 'drawArraysInstanced' ? d : e : 1);
				}
			}

			return real.apply(this, arguments);
		};
	});

	try {
		new PerformanceObserver(function (list) {
			list.getEntries().forEach(function (entry) {
				bench.Long.push(entry.duration);
			});
		}).observe({type: 'longtask', buffered: true});
	}
	catch (error) {
		bench.Long = [];
	}

	var last = 0;

	(function tick (now) {
		var used = performance.memory ? performance.memory.usedJSHeapSize : 0;

		if (bench.On) {
			bench.Frames.push(now - last);

			if (used > bench.Heap)
				bench.Garbage += used - bench.Heap;
		}

		bench.Heap = used;
		last = now;

		requestAnimationFrame(tick);
	})(performance.now());
}

/* The scenes of the page, all ready: prepared, the veil gone. */
function ready () {
	var scenes = Array.prototype.slice.call(document.querySelectorAll('.elemenx-scene')).map(function (element) {
		return Elemenx.Instance(element);
	}).filter(function (scene) {
		return scene && scene.Scene;
	});

	return scenes.length > 0 && scenes.every(function (scene) {
		var inner = scene.Scene();

		return inner.WasPrepared && !inner.Preparing && !inner.Veiled;
	});
}

/* The draws, triangles, CPU and frames of all the scenes of the page since they were made, and the level of their light. */
function drawn () {
	var total = {Frames: 0, Cpu: 0, Draws: 0, Triangles: 0, Level: ''};

	Array.prototype.slice.call(document.querySelectorAll('.elemenx-scene')).forEach(function (element) {
		var scene = Elemenx.Instance(element);
		var made = scene && scene.Drawn ? scene.Drawn() : null;
		if (!made) return;

		total.Frames = Math.max(total.Frames, made.Frames);
		total.Cpu += made.Cpu;
		total.Draws += made.Draws;
		total.Triangles += made.Triangles;
		total.Level = total.Level || (scene.Graphics ? scene.Graphics().Level : '');
	});

	return total;
}

/*
 * What the bench does while it measures (in the page, each 50 ms): the keys held down in every scene, or the car of
 * Racing driven round the line of its road, its next point 30 metres on (A turns it left: its heading grows).
 */
function move (how) {
	var line = null;

	window.clearInterval(window.__benchMove);

	function scenes () {
		return Array.prototype.slice.call(document.querySelectorAll('.elemenx-scene')).map(function (element) {
			return Elemenx.Instance(element);
		}).filter(function (scene) {
			return scene && scene.Scene;
		});
	}

	function press (inner, keys) {
		[inner, inner.Surface, inner.Ground].forEach(function (holder) {
			if (holder && holder.Keys) {
				Object.keys(keys).forEach(function (code) {
					if (keys[code]) holder.Keys[code] = true;
					else delete holder.Keys[code];
				});
			}
		});
	}

	function drive (scene) {
		var inner = scene.Scene();
		var car = null;
		var near = 0;
		var best = Infinity;
		var i;

		Object.keys(inner.Objects).forEach(function (id) {
			if (inner.Objects[id].Car)
				car = inner.Objects[id].Car;
		});

		if (!line) {
			var road = scene.Objects('road')[0];
			var points = road ? (road.Values && road.Values.Points) || road.Points : null;

			line = points && points.length > 1 ? Elemenx.Service('SceneRoads').Line(points, {Closed: true, Step: 6}) : [];
		}

		if (!car || !line.length) {
			press(inner, {KeyW: true});

			return;
		}

		for (i = 0; i < line.length; i++) {
			var far = (line[i].X - car.X) * (line[i].X - car.X) + (line[i].Z - car.Z) * (line[i].Z - car.Z);

			if (far < best) {
				best = far;
				near = i;
			}
		}

		var target = line[(near + 5) % line.length];
		var turn = Math.atan2(target.X - car.X, target.Z - car.Z) - car.Heading;

		turn = Math.atan2(Math.sin(turn), Math.cos(turn));

		press(inner, {KeyW: Math.abs(turn) < 0.6, KeyA: turn > 0.04, KeyD: turn < -0.04});
	}

	/* The view turned round what it looks at, a hundredth of a radian each time: a picture kept while nothing moves is drawn again. */
	function turn (scene) {
		var view;

		if (scene.GalaxyView && scene.Engine().Galaxy) {
			view = scene.GalaxyView();
			view.Yaw += 0.01;

			scene.SetGalaxyView(view);

			return;
		}

		view = scene.Viewpoint();
		view.Yaw += 0.01;

		scene.SetViewpoint(view);
	}

	window.__benchMove = window.setInterval(function () {
		scenes().forEach(function (scene) {
			var keys = {};

			if (how === 'track') {
				drive(scene);

				return;
			}

			if (how === 'turn') {
				turn(scene);

				return;
			}

			(how || []).forEach(function (code) {
				keys[code] = true;
			});

			press(scene.Scene(), keys);
		});
	}, 50);
}

function median (values, part) {
	var sorted = values.slice().sort(function (a, b) {
		return a - b;
	});

	return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * part))] : 0;
}

function round (value, places) {
	var scale = Math.pow(10, places || 0);

	return Math.round(value * scale) / scale;
}

/* The functions that took the processor most in a profile of CDP, by their own time. */
function hottest (profile, count) {
	var times = {};
	var own = {};
	var total = 0;

	profile.samples.forEach(function (id, index) {
		times[id] = (times[id] || 0) + (profile.timeDeltas[index] || 0);
	});

	profile.nodes.forEach(function (node) {
		var frame = node.callFrame;
		var key = (frame.functionName || '(anonymous)') + ' ' + frame.url.split('/').pop().split('?')[0] + ':' + (frame.lineNumber + 1);

		if (/^\((idle|program|garbage collector)\)/.test(frame.functionName)) {
			if (frame.functionName !== '(idle)')
				total += times[node.id] || 0;

			return;
		}

		own[key] = (own[key] || 0) + (times[node.id] || 0);
		total += times[node.id] || 0;
	});

	return Object.keys(own).sort(function (a, b) {
		return own[b] - own[a];
	}).slice(0, count).map(function (key) {
		return (own[key] / total * 100).toFixed(1).padStart(5) + '% ' + key;
	});
}

/* Over the baseline by more than the tolerance: what --check fails on. */
function check (key, made) {
	var before = baseline[key];
	if (!before) return;

	Checked.forEach(function (name) {
		var now = name === 'Gl' ? made.GlTotal : made[name];
		var was = name === 'Gl' ? before.GlTotal : before[name];
		if (was > 0 && now > was * (1 + Tolerance))
			failures.push(key + ': ' + name + ' ' + now + ' over ' + was + ' (+' + Math.round((now / was - 1) * 100) + '%)');
	});
}

function change (key, name, value) {
	var was = baseline[key] ? baseline[key][name] : 0;

	return was ? (value / was * 100 - 100 >= 0 ? '+' : '') + Math.round(value / was * 100 - 100) + '%' : '';
}

/* The processor of the machine to the others first: the Chrome this starts takes the low priority with it. */
try {
	os.setPriority(os.constants.priority.PRIORITY_LOW);
}
catch (error) {
	console.log('the priority stays as it is: ' + error.message);
}

var config = fs.existsSync(path.join(project, 'elemenx.config.js')) ? require(path.join(project, 'elemenx.config.js')) : {};
var serving = config.Server || {};
var server = Server.Create({Root: project, Request: serving.Request || null, Templates: serving.Templates !== false, WebSocket: serving.WebSocket || null});

await new Promise(function (resolve) {
	server.Listen(0, '127.0.0.1', resolve);
});

var address = 'http://127.0.0.1:' + server.Server.address().port;
var browser = await chromium.launch({headless: false, channel: 'chrome', args: [
	'--enable-gpu', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--window-size=1640,1000',
	'--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'
].concat(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])});
var context = await browser.newContext({viewport: {width: 1600, height: 900}});

console.log('demo@level'.padEnd(24) + 'frame ms'.padStart(14) + 'cpu'.padStart(7) + 'draws'.padStart(14) + 'triangles'.padStart(18) + 'gl calls'.padStart(16) + 'garbage KB'.padStart(18));

for (var scenario of Scenarios) {
	if (only.length && only.indexOf(scenario.Name) === -1) continue;

	for (var index = 0; index < qualities.length; index++) {
		var quality = qualities[index];
		var key = scenario.Name + '@' + quality;
		var cdp = null;
		var page = await context.newPage();
		var errors = [];
		var started = Date.now();

		/* Each level on a page of its own: what one level moved (a ship flown far off) is not what the next one measures. */
		page.on('pageerror', function (error) {
			errors.push(error.message);
		});

		await page.addInitScript(instrument, {Quality: quality, Detail: !!flags.detail});
		await page.goto(address + '/' + scenario.Page + '?demo=' + scenario.Name);

		/* A demo with no Scene (Wait: what shows it) is ready once that is there and a few seconds went by. */
		var shown = await (scenario.Wait ? page.waitForSelector(scenario.Wait, {timeout: 600000}).then(function () {
			return page.waitForTimeout(3000);
		}) : page.waitForFunction(ready, null, {timeout: 600000, polling: 250})).then(function () {
			return true;
		}, function () {
			return false;
		});

		var load = await page.evaluate(function () {
			return {Links: window.__bench.Links, Longest: Math.max.apply(null, [0].concat(window.__bench.Long))};
		});

		load.Ms = Date.now() - started;

		if (!shown) {
			console.log(key.padEnd(24) + ' not ready in 10 minutes' + (errors.length ? ': ' + errors[0] : ''));

			await page.close();

			continue;
		}

		await page.evaluate(move, scenario.Move || null);
		await page.waitForTimeout(5000);

		if (flags.detail) {
			cdp = await context.newCDPSession(page);

			await cdp.send('Profiler.enable');
			await cdp.send('Profiler.setSamplingInterval', {interval: 500});
			await cdp.send('Profiler.start');
		}

		var before = await page.evaluate(function () {
			var bench = window.__bench;

			bench.Gl = {};
			bench.Passes = {};
			bench.Frames = [];
			bench.Garbage = 0;
			bench.On = true;

			return true;
		}).then(function () {
			return page.evaluate(drawn);
		});

		await page.waitForTimeout(seconds * 1000);

		var after = await page.evaluate(drawn);
		var counted = await page.evaluate(function () {
			var bench = window.__bench;

			bench.On = false;

			return {Gl: bench.Gl, Passes: bench.Passes, Frames: bench.Frames, Garbage: bench.Garbage};
		});
		var profile = cdp ? (await cdp.send('Profiler.stop')).profile : null;
		/*
		 * The frames the scenes drew (not those of the page they rested through): what a frame costs is of them. Without a
		 * Scene, the frames of the page.
		 */
		var frames = after.Frames - before.Frames > 0 ? after.Frames - before.Frames : Math.max(1, counted.Frames.length);
		var made = {
			Level: after.Level,
			Frames: counted.Frames.length,
			Frame: round(median(counted.Frames, 0.5), 1),
			P95: round(median(counted.Frames, 0.95), 1),
			Longest: round(Math.max.apply(null, [0].concat(counted.Frames)), 1),
			Hitches: counted.Frames.filter(function (time) {
				return time > 50;
			}).length,
			Cpu: round((after.Cpu - before.Cpu) / frames, 2),
			Draws: Math.round((after.Draws - before.Draws) / frames),
			Triangles: Math.round((after.Triangles - before.Triangles) / frames),
			Gl: {},
			GlTotal: 0,
			Garbage: Math.round(counted.Garbage / frames / 1024)
		};

		Object.keys(counted.Gl).sort().forEach(function (name) {
			made.Gl[name] = Math.round(counted.Gl[name] / frames);
			made.GlTotal += made.Gl[name];
		});

		made.Load = {Ms: load.Ms, Longest: round(load.Longest), Programs: load.Links};

		results[key] = made;

		console.log((key + (made.Level && made.Level !== quality ? ' (' + made.Level + ')' : '')).padEnd(24) +
			(made.Frame + '/' + made.P95).padStart(14) +
			String(made.Cpu).padStart(7) +
			(made.Draws + ' ' + change(key, 'Draws', made.Draws)).padStart(14) +
			(made.Triangles + ' ' + change(key, 'Triangles', made.Triangles)).padStart(18) +
			(made.GlTotal + ' ' + change(key, 'GlTotal', made.GlTotal)).padStart(16) +
			(made.Garbage + ' ' + change(key, 'Garbage', made.Garbage)).padStart(18) +
			(made.Hitches ? '  hitches ' + made.Hitches + ', longest ' + made.Longest + ' ms' : ''));

		console.log('  load ' + Math.round(made.Load.Ms / 100) / 10 + ' s, longest task ' + made.Load.Longest + ' ms, ' + made.Load.Programs + ' programs');

		if (flags.detail) {
			console.log('  calls a frame: ' + Object.keys(made.Gl).map(function (name) {
				return name + ' ' + made.Gl[name];
			}).join(', '));

			/* The passes of a frame by their triangles; those of a draw or two of a quad over a picture (its effects) as one line. */
			var rest = {Count: 0, Draws: 0, Triangles: 0};
			var perFrame = frames;

			Object.keys(counted.Passes).sort(function (a, b) {
				return counted.Passes[b].Triangles - counted.Passes[a].Triangles;
			}).forEach(function (name) {
				var one = counted.Passes[name];

				if (one.Draws / perFrame < 3 && one.Triangles / perFrame < 1000) {
					rest.Count++;
					rest.Draws += one.Draws;
					rest.Triangles += one.Triangles;

					return;
				}

				console.log('  pass ' + name.padEnd(28) + String(Math.round(one.Draws / perFrame)).padStart(7) + ' draws' + String(Math.round(one.Triangles / perFrame)).padStart(11) + ' triangles');
			});

			if (rest.Count)
				console.log('  ' + (rest.Count + ' passes of effects').padEnd(33) + String(Math.round(rest.Draws / perFrame)).padStart(7) + ' draws' + String(Math.round(rest.Triangles / perFrame)).padStart(11) + ' triangles');

			hottest(profile, 15).forEach(function (line) {
				console.log('  ' + line);
			});

			await cdp.detach();
		}

		check(key, made);

		await page.evaluate(function () {
			window.clearInterval(window.__benchMove);
		});

		if (errors.length)
			console.log('  errors: ' + errors.slice(0, 3).join(' | '));

		await page.close();
	}
}

await browser.close();
server.Server.close();

if (flags.save) {
	fs.writeFileSync(baselineFile, JSON.stringify(Object.assign({}, baseline, results), null, '\t') + '\n');

	console.log('saved to tests/perf/scene-baseline.json');
}

if (flags.check && failures.length) {
	console.log('over the baseline:\n' + failures.join('\n'));

	process.exitCode = 1;
}
else if (flags.check) {
	console.log('within the baseline');
}
