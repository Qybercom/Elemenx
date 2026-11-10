import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

var blueprints;

function compile (job) {
	return new Promise(function (done, failed) {
		Elemenx.Compilers.Run(job, function (error, result) {
			if (error) failed(Object.assign(error, {Result: result}));
			else done(result);
		});
	});
}

/* A graph of blocks in a few lines: blocks {id: [type, properties]}, links [[from, out, to, in]]. */
function graph (name, parameters, blocks, links) {
	var made = blueprints.Create('generator', {name: name, parameters: parameters || []});

	Object.keys(blocks).forEach(function (id) {
		blueprints.Add(made, blocks[id][0], {id: id, properties: blocks[id][1] || {}});
	});

	links.forEach(function (link) {
		blueprints.Link(made, [link[0], link[1]], [link[2], link[3]]);
	});

	return made;
}

function define (name, made) {
	Elemenx.Resources('Blueprints', name, made);

	return made;
}

describe('Contract: graphs of blocks as functions, lists and loops, made into the IR of Elemenx.Compilers', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints']);

		blueprints = Elemenx.Service('Blueprints');

		/* A function: Item and Sum in, their sum out. */
		define('test-ir/sum', graph('sum', [], {
			item: ['Input', {Name: 'Item'}], sum: ['Input', {Name: 'Sum'}], add: ['Add'], out: ['Result', {Key: 'Sum'}]
		}, [['item', 'Value', 'add', 'A'], ['sum', 'Value', 'add', 'B'], ['add', 'Out', 'out', 'Value']]));

		/* What it is called with first, so that the blocks that call it have its pins. */
		define('test-ir/branches', graph('branches', [], {depth: ['Input', {Name: 'Depth'}], out: ['Result', {Key: 'Value'}]}, []));

		/* A branch: itself and two branches of one less depth each, while its depth is over 0. */
		define('test-ir/branches', graph('branches', [], {
			depth: ['Input', {Name: 'Depth'}],
			zero: ['Number', {Value: 0}], one: ['Number', {Value: 1}], two: ['Number', {Value: 2}],
			more: ['Compare', {Operator: '>'}], count: ['Select'], less: ['Subtract'],
			children: ['Repeat', {Graph: 'test-ir/branches', Take: 'Value'}],
			total: ['Reduce', {Graph: 'test-ir/sum'}],
			self: ['Add'], out: ['Result', {Key: 'Value'}]
		}, [
			['depth', 'Value', 'more', 'A'], ['zero', 'Value', 'more', 'B'],
			['more', 'Out', 'count', 'Test'], ['two', 'Value', 'count', 'A'], ['zero', 'Value', 'count', 'B'],
			['depth', 'Value', 'less', 'A'], ['one', 'Value', 'less', 'B'],
			['count', 'Out', 'children', 'Count'], ['less', 'Out', 'children', 'Depth'],
			['children', 'List', 'total', 'List'], ['zero', 'Value', 'total', 'Initial'],
			['one', 'Value', 'self', 'A'], ['total', 'Sum', 'self', 'B'], ['self', 'Out', 'out', 'Value']
		]));
	});

	it('runs a graph that calls itself through a list of its own, as a function, by the IR in JavaScript as it runs', async function () {
		var main = graph('main', [{key: 'Depth', type: 'float', value: 3}, {key: 'Seed', type: 'text', value: 'house-7'}, {key: 'Class', type: 'text', value: 'tower'}], {
			depth: ['Parameter', {Key: 'Depth'}], seed: ['Parameter', {Key: 'Seed'}], kind: ['Parameter', {Key: 'Class'}],
			roof: ['Text', {Value: 'roof'}],
			tree: ['Call', {Graph: 'test-ir/branches'}],
			chance: ['Random'],
			table: ['Table', {Rows: {hut: 'thatch', tower: 'flat'}, Default: 'gable'}],
			count: ['Result', {Key: 'Count'}], luck: ['Result', {Key: 'Chance'}], shape: ['Result', {Key: 'Roof'}]
		}, [
			['depth', 'Value', 'tree', 'Depth'], ['tree', 'Value', 'count', 'Value'],
			['seed', 'Value', 'chance', 'Seed'], ['roof', 'Value', 'chance', 'Key'], ['chance', 'Value', 'luck', 'Value'],
			['kind', 'Value', 'table', 'Key'], ['table', 'Value', 'shape', 'Value']
		]);
		var run = blueprints.Compile(main).Run;
		var made = blueprints.IR(main, {Name: 'main'});
		var result;
		var functions;

		expect(made.Diagnostics).toEqual([]);
		expect(made.Module.Functions.map(function (fn) {
			return fn.Name;
		}).sort()).toEqual(['g_main', 'g_test-ir/branches', 'g_test-ir/sum']);

		/* The very same of the graph run and of its code. */
		expect(run({})).toEqual({Count: 15, Chance: blueprints.Hash2('house-7', 'roof'), Roof: 'flat'});
		expect(run({Depth: 5, Class: 'hut'})).toMatchObject({Count: 63, Roof: 'thatch'});

		result = await compile({From: 'blueprint', To: 'js', Value: main, Options: {Name: 'main'}});
		functions = Elemenx.Compilers.Load(result.Value);

		expect(Elemenx.Compilers.Path('blueprint', 'js')).toEqual(['blueprint-ir', 'ir-js']);
		expect(functions['g_main']({}, {})).toEqual(run({}));
		expect(functions['g_main']({Depth: 5, Class: 'hut', Seed: 'other'}, {})).toEqual(run({Depth: 5, Class: 'hut', Seed: 'other'}));
		expect(functions['g_main']({Class: 'castle'}, {}).Roof).toBe('gable');
	});

	it('maps a list and takes one result of each, the values of lists of numbers each by each', async function () {
		var double = define('test-ir/double', graph('double', [], {
			item: ['Input', {Name: 'Item'}], index: ['Input', {Name: 'Index'}], two: ['Number', {Value: 2}],
			times: ['Multiply'], plus: ['Add'], out: ['Result', {Key: 'Value'}], at: ['Result', {Key: 'At'}]
		}, [['item', 'Value', 'times', 'A'], ['two', 'Value', 'times', 'B'], ['times', 'Out', 'plus', 'A'], ['index', 'Value', 'plus', 'B'], ['plus', 'Out', 'out', 'Value'], ['index', 'Value', 'at', 'Value']]));
		var main = graph('lists', [], {
			a: ['Vector', {X: 1, Y: 2, Z: 3}], b: ['Number', {Value: 10}], list: ['List', {Count: 2}],
			map: ['Map', {Graph: 'test-ir/double', Take: 'Value'}], count: ['Count'], second: ['Item'], one: ['Number', {Value: 1}],
			out: ['Result', {Key: 'List'}], size: ['Result', {Key: 'Size'}], pick: ['Result', {Key: 'Second'}]
		}, [
			['a', 'Value', 'list', 'Item1'], ['b', 'Value', 'list', 'Item2'], ['list', 'List', 'map', 'List'],
			['map', 'List', 'out', 'Value'], ['map', 'List', 'count', 'List'], ['count', 'Count', 'size', 'Value'],
			['map', 'List', 'second', 'List'], ['one', 'Value', 'second', 'Index'], ['second', 'Value', 'pick', 'Value']
		]);
		var expected = {List: [[2, 4, 6], 21], Size: 2, Second: 21};
		var functions;

		expect(double.name).toBe('double');
		expect(blueprints.Compile(main).Run({})).toEqual(expected);

		functions = Elemenx.Compilers.Load((await compile({From: 'blueprint', To: 'js', Value: main, Options: {Name: 'lists'}})).Value);

		expect(functions['g_lists']({}, {})).toEqual(expected);
	});

	it('keeps a graph that calls itself with no end from going deeper than 256, in the run and in its code', async function () {
		var endless = define('test-ir/endless', graph('endless', [], {one: ['Number', {Value: 1}], out: ['Result', {Key: 'Value'}]}, []));
		var functions;

		endless = define('test-ir/endless', graph('endless', [], {
			one: ['Number', {Value: 1}], again: ['Repeat', {Graph: 'test-ir/endless'}], out: ['Result', {Key: 'Value'}]
		}, [['one', 'Value', 'again', 'Count'], ['again', 'List', 'out', 'Value']]));

		expect(function () {
			blueprints.Compile(endless).Run({});
		}).toThrow('Elemenx Blueprints: test-ir/endless goes deeper than 256');

		functions = Elemenx.Compilers.Load((await compile({From: 'blueprint', To: 'js', Value: endless, Options: {Name: 'test-ir/endless'}})).Value);

		expect(function () {
			functions['g_test-ir/endless']({}, {});
		}).toThrow('goes deeper than 256');
	});

	it('tells a block of no IR and a graph that is not there, and stops the chain on it', async function () {
		var made = blueprints.IR(graph('noisy', [], {noise: ['Noise'], call: ['Call', {Graph: 'test-ir/nowhere'}], out: ['Result', {Key: 'Value'}], gone: ['Result', {Key: 'Gone'}]}, [['noise', 'Value', 'out', 'Value']]));
		var failed = null;

		expect(made.Diagnostics.map(function (one) {
			return one.Text;
		})).toEqual(['Elemenx Blueprints: no IR for a block Noise']);

		try {
			await compile({From: 'blueprint', To: 'js', Value: graph('noisy', [], {noise: ['Noise'], out: ['Result', {Key: 'Value'}]}, [['noise', 'Value', 'out', 'Value']])});
		}
		catch (error) {
			failed = error;
		}

		expect(failed.message).toBe('Elemenx Blueprints: no IR for a block Noise');
	});

	/* A formula in place of a block of each sum: what a graph of a building is written with. */
	it('reads a formula: its names its inputs, the same of the graph run and of its code, vectors part by part', async function () {
		var main = graph('formula', [{key: 'Floors', type: 'float', value: 4}], {
			floors: ['Parameter', {Key: 'Floors'}], height: ['Number', {Value: 3}], at: ['Vector', {X: 1, Y: 2, Z: 3}],
			top: ['Formula', {Expression: '(Floors - 0.5) * FloorHeight + (Floors > 3 ? 10 : 0)'}],
			moved: ['Formula', {Expression: 'clamp(At * 2 - [1, 1, 1], 0, 4)[2] + count([1, 2]) + -max(1, 2) + round(2.6)'}],
			kind: ['Formula', {Expression: "Floors >= 10 && Floors < 20 ? 'tower' : Floors < 3 || Floors == 7 ? 'low' : 'mid'"}],
			a: ['Result', {Key: 'Top'}], b: ['Result', {Key: 'Moved'}], k: ['Result', {Key: 'Kind'}]
		}, [
			['floors', 'Value', 'top', 'Floors'], ['height', 'Value', 'top', 'FloorHeight'], ['top', 'Value', 'a', 'Value'],
			['at', 'Value', 'moved', 'At'], ['moved', 'Value', 'b', 'Value'], ['floors', 'Value', 'kind', 'Floors'], ['kind', 'Value', 'k', 'Value']
		]);
		var run = blueprints.Compile(main).Run;
		var functions = Elemenx.Compilers.Load((await compile({From: 'blueprint', To: 'js', Value: main, Options: {Name: 'formula'}})).Value);

		expect(blueprints.NodeOf('Formula').Inputs({Expression: 'a + b * a'}).map(function (input) {
			return input.Key;
		})).toEqual(['a', 'b']);
		expect(run({})).toEqual({Top: 20.5, Moved: 7, Kind: 'mid'});
		expect(run({Floors: 12}).Kind).toBe('tower');
		[{}, {Floors: 12}, {Floors: 2}, {Floors: 7}].forEach(function (parameters) {
			expect(functions['g_formula'](parameters, {})).toEqual(run(parameters));
		});
		expect(function () {
			blueprints.Formula('1 + * 2');
		}).toThrow('Elemenx Blueprints: the formula 1 + * 2 has * out of place');
		expect(function () {
			blueprints.Formula('(1 + 2');
		}).toThrow('Elemenx Blueprints: the formula (1 + 2 expects ) at its end');
	});
});

