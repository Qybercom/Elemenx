import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var Split = require('../../tools/split.js');

/* The plan of a build split by its routes (tools/split.js): what goes into a part, what the bundle keeps. */
describe('elemenx build: the plan of a build split by its routes', function () {
	it('reads the routes of the entry: a Path and a Component of a name, not a route with children', function () {
		var routes = Split.Routes("Elemenx.Application('Shop', {$Router: {Waiting: 'Loading', Routes: [\n\t{Path: '/', Component: 'Home'},\n\t// {Path: '/old', Component: 'Old'} ]\n\t{Path: '/users/:id', Component: \"User\", Guard: 'Signed', GuardFailed: {Signed: 'Login'}},\n\t{Path: '/admin', Component: 'Admin', Children: [{Path: 'stats', Component: 'Stats'}]}\n]}});");

		expect(routes.map(function (route) {
			return [route.Path, route.Component];
		})).toEqual([['/', 'Home'], ['/users/:id', 'User'], ['stats', 'Stats']]);
	});

	it('puts what one route alone uses into its part, and keeps the first screen, the shared and what the rest uses', function () {
		var components = {
			Shell: "Elemenx.Component('Shell', {$Template: '<nav></nav><main *outlet=\"Content\"></main>'});",
			Home: "Elemenx.Component('Home', {$Template: '<Card />'});",
			Card: "Elemenx.Component('Card', {$Template: '<div></div>'});",
			Users: "Elemenx.Component('Users', {$Template: '<Table /><Avatar />'});",
			Table: "Elemenx.Component('Table', {$Template: '<Pager />'});",
			Pager: "Elemenx.Component('Pager', {$Template: '<b></b>'});",
			Avatar: "Elemenx.Component('Avatar', {$Template: '<i></i>'});",
			Orders: "Elemenx.Component('Orders', {$Template: '<Table /><Chart />'});",
			Chart: "Elemenx.Component('Chart', {$Template: '<svg></svg>'});",
			Loading: "Elemenx.Component('Loading', {$Template: '<p></p>'});",
			Toast: "Elemenx.Component('Toast', {$Template: '<p></p>'});"
		};
		var entry = "Elemenx.Application('Shop', {$Component: 'Shell', $Router: {Waiting: 'Loading', Routes: [{Path: '/', Component: 'Home'}, {Path: '/users', Component: 'Users'}, {Path: '/orders', Component: 'Orders'}]}});";
		/* A Service of the rest makes a Toast by its name: it stays. */
		var rest = entry + "\nElemenx.Service('Notify', {Show: function () { Elemenx.Component('Toast'); }});";
		var plan = Split.Plan(components, rest, Split.Routes(entry));

		expect(plan.Parts).toEqual({Orders: ['Chart', 'Orders'], Users: ['Avatar', 'Users']});

		/* Table (and its Pager) is used by two routes; Home and its Card are the first screen; Loading and Toast the rest. */
		expect(plan.Main).toEqual(['Card', 'Home', 'Loading', 'Pager', 'Shell', 'Table', 'Toast']);
	});

	it('splits nothing without routes to split', function () {
		var plan = Split.Plan({Root: "Elemenx.Component('Root', {});"}, "Elemenx.Application('A', {$Component: 'Root'});", []);

		expect(plan).toEqual({Main: ['Root'], Parts: {}});
	});
});
