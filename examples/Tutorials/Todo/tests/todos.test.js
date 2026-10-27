import { beforeEach, describe, expect, it } from 'vitest';
import '@qybercom/elemenx/elemenx.js';
import '../Todo/services/Todos.js';

/* The Service alone: no page, no components; each test starts from an empty storage. */
describe('Todos', function () {
	var todos;

	beforeEach(function () {
		localStorage.clear();

		todos = Elemenx.Application('Tests' + Math.random(), {}).$Service('Todos');
	});

	it('adds tasks and counts the ones left', function () {
		todos.Add('Write the tests');
		todos.Add('  Ship it  ');

		expect(todos.List().map(function (item) {
			return item.Title;
		})).toEqual(['Write the tests', 'Ship it']);
		expect(todos.Left()).toBe(2);
	});

	it('refuses a task without a title', function () {
		expect(function () {
			todos.Add('   ');
		}).toThrow('A task needs a title');
	});

	it('ticks, filters and clears the tasks done', function () {
		todos.Add('One');
		todos.Add('Two');
		todos.Toggle(todos.List()[0].ID);

		expect(todos.List('done').length).toBe(1);
		expect(todos.List('active').length).toBe(1);

		todos.ClearDone();

		expect(todos.List().map(function (item) {
			return item.Title;
		})).toEqual(['Two']);
	});

	it('tells its listeners and keeps the tasks in the storage', function () {
		var told = 0;

		todos.OnChange(function () {
			told++;
		});

		todos.Add('Kept');

		expect(told).toBe(1);
		expect(Elemenx.Application('Again' + Math.random(), {}).$Service('Todos').List().length).toBe(1);
	});
});
