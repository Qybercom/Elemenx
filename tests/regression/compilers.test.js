import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

function compile (job) {
	return new Promise(function (done, failed) {
		Elemenx.Compilers.Run(job, function (error, result) {
			if (error) failed(Object.assign(error, {Result: result}));
			else done(result);
		});
	});
}

function c (value, type) {
	return {Op: 'const', Value: value, Type: type};
}

function v (name) {
	return {Op: 'var', Name: name};
}

function bin (operator, a, b) {
	return {Op: 'bin', Operator: operator, A: a, B: b};
}

function call (name) {
	return {Op: 'call', Name: name, Args: Array.prototype.slice.call(arguments, 1)};
}

/* A tree of branches: each branch two more until depth, their tips in a list; the count by a function that calls itself. */
var tree = {
	Entry: 'grow',
	Functions: [
		{Name: 'branches', Params: [{Name: 'depth', Type: 'int'}], Returns: 'int', Body: [
			{Op: 'if', Test: bin('<=', v('depth'), c(0, 'int')), Then: [{Op: 'return', Value: c(1, 'int')}]},
			{Op: 'return', Value: bin('+', c(1, 'int'), bin('*', c(2, 'int'), call('branches', bin('-', v('depth'), c(1, 'int')))))}
		]},
		{Name: 'grow', Params: [{Name: 'levels', Type: 'int'}], Returns: 'record', Body: [
			{Op: 'let', Name: 'tips', Type: 'list', Value: {Op: 'list', Items: []}},
			{Op: 'let', Name: 'up', Type: 'vec3', Value: c([0, 1, 0], 'vec3')},
			{Op: 'loop', Var: 'i', From: c(0, 'int'), To: v('levels'), Body: [
				{Op: 'let', Name: 'tip', Type: 'vec3', Value: bin('*', v('up'), bin('+', v('i'), c(1)))},
				{Op: 'push', List: v('tips'), Value: v('tip')}
			]},
			{Op: 'let', Name: 'height', Value: c(0)},
			{Op: 'each', Var: 'tip', Type: 'vec3', List: v('tips'), Body: [
				{Op: 'set', Name: 'height', Value: call('max', v('height'), call('y', v('tip')))}
			]},
			{Op: 'return', Value: {Op: 'record', Fields: {
				Count: call('branches', v('levels')),
				Tips: {Op: 'length', List: v('tips')},
				Height: v('height'),
				Side: call('length', call('cross', c([1, 0, 0], 'vec3'), c([0, 0, 2], 'vec3'))),
				Tall: {Op: 'select', Test: bin('>', v('height'), c(2)), A: c('tall'), B: c('low')}
			}}}
		]}
	]
};

describe('Contract: Elemenx.Compilers, transitions of kinds of code and the IR', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	it('has the IR made into JavaScript and C++, the languages described as data', function () {
		expect(Elemenx.Compilers.Names()).toEqual(expect.arrayContaining(['ir-js', 'ir-cpp']));
		expect(Elemenx.Compilers.Path('ir', 'js')).toEqual(['ir-js']);
		expect(Elemenx.Compilers.Path('ir', 'nothing')).toBe(null);
		expect(Elemenx.Compilers.Language('cpp').Types.vec3).toBe('vec3');
		expect(function () {
			Elemenx.Compilers.Define('broken', {From: 'a'});
		}).toThrow('Elemenx.Compilers.Define expects (name, {From, To, Compile(job, done)})');
	});

	it('makes JavaScript of a module that calls itself, loops, lists, vectors, records and choices, and runs it', async function () {
		var result = await compile({From: 'ir', To: 'js', Value: tree});
		var made = Elemenx.Compilers.Load(result.Value);

		expect(result.To).toBe('js');
		expect(result.Files[0].Name).toBe('grow.js');
		expect(made.grow(3)).toEqual({Count: 15, Tips: 3, Height: 3, Side: 2, Tall: 'tall'});
		expect(made.branches(10)).toBe(2047);
	});

	it('keeps a function that calls itself from going deeper than MaxDepth: an error, not a lost stack', async function () {
		var endless = {Entry: 'down', Functions: [{Name: 'down', Params: [{Name: 'n', Type: 'int'}], Returns: 'int', Body: [{Op: 'return', Value: call('down', bin('+', v('n'), c(1, 'int')))}]}]};
		var made = Elemenx.Compilers.Load((await compile({From: 'ir', To: 'js', Value: endless, Options: {MaxDepth: 50}})).Value);

		expect(function () {
			made.down(0);
		}).toThrow('Elemenx IR: down goes deeper than 50');

		/* Once it failed, it runs again from the top. */
		expect(function () {
			made.down(0);
		}).toThrow('deeper than 50');
	});

	it('tells what is wrong in a module, and stops the chain on it', async function () {
		var wrong = {Functions: [{Name: 'f', Params: [], Returns: 'float', Body: [{Op: 'return', Value: bin('+', v('missing'), call('nowhere'))}, {Op: 'jump'}]}]};
		var failed = null;

		expect(Elemenx.Compilers.Check(wrong).map(function (one) {
			return one.Text;
		})).toEqual(['Elemenx IR: no variable missing', 'Elemenx IR: no function nowhere', 'Elemenx IR: no statement jump in f']);

		try {
			await compile({From: 'ir', To: 'js', Value: wrong});
		}
		catch (error) {
			failed = error;
		}

		expect(failed.message).toBe('Elemenx IR: no variable missing');
		expect(failed.Result.Diagnostics.length).toBe(3);
		expect(failed.Result.Diagnostics[0]).toMatchObject({Severity: 'error', Line: 0});
	});

	it('goes by as many transitions as it takes: one of an application before the IR', async function () {
		var name = 'json-ir-' + Date.now();
		var result;

		Elemenx.Compilers.Define(name, {From: 'json-of-ir', To: 'ir', Compile: function (job, done) {
			done(null, {Value: JSON.parse(job.Files[0].Text), Log: 'read ' + job.Files[0].Name});
		}});

		expect(Elemenx.Compilers.Path('json-of-ir', 'js')).toEqual([name, 'ir-js']);

		result = await compile({From: 'json-of-ir', To: 'js', Files: [{Name: 'tree.json', Text: JSON.stringify(tree)}]});

		expect(Elemenx.Compilers.Load(result.Value).grow(2).Count).toBe(7);
		expect(result.Log).toBe('read tree.json');
	});

	it('writes C++ of the module: its declarations first, the guard of a function that calls itself, its vectors', async function () {
		var text = (await compile({From: 'ir', To: 'cpp', Value: tree})).Value;

		expect(text).toContain('int f_branches(int f_depth);');
		expect(text).toContain('std::map<std::string, double> f_grow(int f_levels) {');
		expect(text).toContain('for (int f_i = 0; f_i < f_levels; f_i++) {');
		expect(text).toContain('vec3 f_up = vec3{0.0, 1.0, 0.0};');
		expect(text).toContain('struct rt_guard');
	});

	it('calls back an error when no chain of transitions goes there', async function () {
		var failed = null;

		try {
			await compile({From: 'ir', To: 'cobol'});
		}
		catch (error) {
			failed = error;
		}

		expect(failed.message).toBe('Elemenx Compilers: no way from ir to cobol');
	});

	/* Regression: the list of an each was made again at each step and twice in it: a list of a call of a call went exponential. */
	it('makes the list of an each and the end of a loop once, however long they are', async function () {
		var module = {Entry: 'main', Functions: [
			{Name: 'items', Params: [{Name: 'calls', Type: 'list'}], Returns: 'list', Body: [
				{Op: 'push', List: v('calls'), Value: c(1)},
				{Op: 'return', Value: {Op: 'list', Items: [c(1), c(2), c(3)]}}
			]},
			{Name: 'main', Params: [], Returns: 'record', Body: [
				{Op: 'let', Name: 'calls', Type: 'list', Value: {Op: 'list', Items: []}},
				{Op: 'let', Name: 'sum', Value: c(0)},
				{Op: 'each', Var: 'one', Type: 'float', List: call('items', v('calls')), Body: [{Op: 'set', Name: 'sum', Value: bin('+', v('sum'), v('one'))}]},
				{Op: 'loop', Var: 'i', From: c(0, 'int'), To: {Op: 'length', List: call('items', v('calls'))}, Body: []},
				{Op: 'return', Value: {Op: 'record', Fields: {Sum: v('sum'), Calls: {Op: 'length', List: v('calls')}}}}
			]}
		]};
		var made = Elemenx.Compilers.Load((await compile({From: 'ir', To: 'js', Value: module})).Value);

		expect(made.main()).toEqual({Sum: 6, Calls: 2});
	});
});

