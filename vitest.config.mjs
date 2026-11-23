import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

/* The tests of the Libraries are beside what they test (services/Math/Math.test.js); the ones of Node end in .node.test.js. */
var outside = ['**/*.node.test.js', 'tests/regression/docs-sources.test.js', 'tests/production/**', 'tests/regression/ssr-server.test.js', 'tests/history/**', 'tests/tools/**', 'tests/regression/cli-generator.test.js', 'tests/regression/cli-icons.test.js', 'tests/regression/theming.test.js', 'tests/regression/library-layers.test.js', 'tests/regression/emoji-data.test.js', 'tests/regression/cities.test.js', 'tests/regression/achievements.test.js', 'tests/regression/devices.test.js', 'tests/regression/formats.test.js', 'tests/regression/locales.test.js', 'tests/regression/minify.test.js', 'tests/regression/mangle.test.js', 'tests/regression/designer-cli.test.js', 'tests/regression/single-page-text.test.js', 'tests/regression/tutorials.test.js', 'tests/regression/split.test.js', 'tests/regression/build-languages.test.js', 'tests/regression/dist.test.js', 'tests/regression/expressions.test.js', 'tests/regression/electron.test.js', 'tests/regression/native.test.js', 'tests/regression/builder-multi-application.test.js', 'tests/regression/server.test.js', 'tests/regression/package-release.test.js', 'tests/regression/es5-syntax.test.js', 'tests/regression/runtime-internals.test.js', 'tests/regression/shake.test.js', 'tests/regression/form-order.test.js', 'tests/regression/cli-meta.test.js', 'tests/regression/cli-splash.test.js', 'tests/regression/cli-icon.test.js', 'tests/regression/library-names.test.js', 'tests/regression/language-server.test.js', 'tests/regression/editors-build.test.js', 'tests/regression/editors-branding.test.js', 'tests/regression/headless.test.js', 'tests/regression/frontend-style.test.js', 'tests/regression/docs-site.test.js', 'tests/regression/build-targets.test.js', 'tests/regression/build-base.test.js', 'tests/regression/build-inheritance.test.js'];
var graphics = ['tests/regression/library-scene.test.js', 'tests/regression/game-world.test.js', 'tests/regression/library-scene-editor.test.js'];

/*
 * The other contracts that draw scenes: the programs of a scene are made in seconds, many more beside other files, so
 * they are let run a minute (15 s cut them off under load); they run beside the others all the same.
 */
var scenes = ['libraries/ElemenxGraphics/**/*.test.js', 'libraries/ElemenxGaming/**/*.test.js', 'tests/regression/blueprints.test.js', 'tests/regression/model-formats.test.js', 'tests/regression/library-drawing.test.js', 'tests/regression/library-object-editor.test.js', 'tests/regression/contact-shadows.test.js', 'tests/regression/fps.test.js', 'tests/regression/game-editor.test.js', 'tests/regression/ground-lod.test.js', 'tests/regression/library-effect-blueprints.test.js', 'tests/regression/library-game-race.test.js', 'tests/regression/library-game-strategy.test.js', 'tests/regression/library-material-blueprints.test.js', 'tests/regression/library-render-pipeline.test.js', 'tests/regression/library-rigid.test.js', 'tests/regression/library-scene-behaviours.test.js', 'tests/regression/library-scene-caves.test.js', 'tests/regression/library-scene-editing.test.js', 'tests/regression/library-scene-frames.test.js', 'tests/regression/library-scene-landing.test.js', 'tests/regression/library-scene-roads.test.js', 'tests/regression/library-scene-screens.test.js', 'tests/regression/library-shader-errors.test.js', 'tests/regression/library-triggers.test.js', 'tests/regression/probe-light.test.js', 'tests/regression/scatter-sketch.test.js', 'tests/regression/scene-game-hooks.test.js', 'tests/regression/shadow-cascades.test.js', 'tests/regression/terrain-sketch.test.js', 'tests/regression/hardcode-tables.test.js', 'tests/regression/library-aboard.test.js', 'tests/regression/library-game-dash.test.js', 'tests/regression/library-scene-planet-data.test.js', 'tests/regression/library-tactics.test.js', 'tests/regression/planet-graphs.test.js', 'tests/regression/scatter-proxies.test.js', 'tests/regression/scene-clusters.test.js', 'tests/regression/scene-culling.test.js'];

/* ELEMENX_SCRIPT runs the browser contracts against another build of the framework: npm run test:min uses dist/elemenx.min.js. */
export default defineConfig({
	publicDir: 'tests/public',
	define: {
		__ELEMENX_SCRIPT__: JSON.stringify(process.env.ELEMENX_SCRIPT || '/elemenx.js'),
		/* The most workers a pool of a page of tests has (Workers.Most); 0: as many as the library makes. */
		__ELEMENX_POOL__: JSON.stringify(Number(process.env.ELEMENX_POOL) || 0)
	},
	test: {
		/* 4 files at a time, as the end-to-end tests (ELEMENX_WORKERS sets it): all of the processors froze the machine. */
		maxWorkers: Number(process.env.ELEMENX_WORKERS) || 4,
		browser: {
			enabled: true,
			provider: playwright({
				/* Sound plays without a gesture of the user: the contracts of the Audio Service hear an oscillator. ELEMENX_SOFTWARE draws by the processor, as a runner of CI with no graphics card does. */
				launchOptions: {
					channel: 'chrome',
					args: ['--autoplay-policy=no-user-gesture-required'].concat(process.env.ELEMENX_SOFTWARE ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
				}
			}),
			instances: [
				{browser: 'chromium'}
			],
			headless: true
		},
		coverage: {
			provider: 'v8',
			include: ['elemenx.js'],
			reporter: ['text-summary', 'json-summary', 'json', 'html']
		},
		/*
		 * The contracts share one page, so one that draws by the processor, as on a runner with no graphics card, holds up
		 * the others: what draws in 3D runs after them, a file at a time.
		 */
		projects: [
			/*
			 * The contracts ran beside the scenes, whose workers grow plants and bake planets: under that load a
			 * contract of a component took more than the 15 s a test has (a different one each run: Noise, TopologyIso,
			 * SignaturePad, Countdown). 45 s. Its hooks (loading the framework, defining what a file uses: half a second alone) have as
			 * long as its tests: under the same load they took more than the 30 s a hook has by default (ground-lod, compilers-wasm,
			 * focus-on-open, PlanetEditor, ScenePlanet, a different one each run).
			 */
			{extends: true, test: {name: 'contracts', include: ['tests/**/*.test.js', 'libraries/**/*.test.js'], exclude: outside.concat(graphics, scenes), testTimeout: 45000, hookTimeout: 45000, sequence: {groupOrder: 0}}},
			/*
			 * The scenes after the contracts (groupOrder 1), two files at a time: four beside the contracts fought for the
			 * processor and the graphics card, and the bake of a planet (16 s alone) stretched seven times past the minute a test has.
			 */
			{extends: true, test: {name: 'scenes', include: scenes, exclude: outside.concat(graphics), maxWorkers: 2, testTimeout: 60000, hookTimeout: 60000, sequence: {groupOrder: 1}}},
			{extends: true, test: {name: 'graphics', include: graphics, exclude: outside, maxWorkers: 1, testTimeout: 90000, hookTimeout: 90000, sequence: {groupOrder: 2}}}
		]
	}
});