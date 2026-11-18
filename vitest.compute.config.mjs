import base from './vitest.config.mjs';

/*
 * The bench of the computations of the Libraries (npm run test:compute): noise, heights of grounds, graphs of blocks,
 * ways, each in JavaScript and, where it is made, in WebAssembly. A measure, not a test: npm test does not run it. The
 * browser of the contracts, its projects all but this one.
 */
export default Object.assign({}, base, {
	/* ELEMENX_SAVE=1 keeps the times as tests/perf/compute-baseline.json, what the next runs are compared to. */
	define: Object.assign({}, base.define, {__COMPUTE_SAVE__: JSON.stringify(!!process.env.ELEMENX_SAVE)}),
	test: Object.assign({}, base.test, {
		maxWorkers: 1,
		projects: [
			{extends: true, test: {name: 'compute', include: ['tests/perf/compute.bench.js'], testTimeout: 600000}}
		]
	})
});
