import { describe, expect, it } from 'vitest';
import '../../elemenx.js';

var serial = 0;

function unique (prefix) {
	serial++;

	return prefix + Date.now() + serial;
}

describe('Contract: Elemenx.Meta', function () {
	it('normalizes the $Meta of a Component: props with their types, defaults, options and descriptions', function () {
		var name = unique('MetaCard');

		Elemenx.Component(name, {
			$Template: '<article>{{Title}}<slot></slot></article>',
			$Meta: {
				Group: 'layout',
				Icon: 'layout',
				Description: 'A card.',
				Container: true,
				Children: ['MetaTab'],
				Current: 'Variant',
				Slots: ['actions'],
				Events: ['open'],
				Methods: ['Open()'],
				Sample: {Title: 'Hello'},
				Props: {
					Title: 'The title on top.',
					Count: 'How many.',
					Open: 'Whether it is open.',
					Variant: {Options: ['flat', 'raised'], Schema: null, Description: 'Its look.'},
					Items: {Schema: {ID: 'number', Label: 'text'}, Description: 'The list.'},
					Size: {Type: 'text'},
					Text: {Body: true, Description: 'Its text, also from its body.'}
				}
			},
			Title: '',
			Count: 3,
			Open: false,
			Variant: 'flat',
			Items: [{ID: 1}],
			Size: 'medium',
			Text: '',
			Hidden: 'state, not a prop'
		});

		expect(Elemenx.Meta(name)).toEqual({
			Name: name,
			Kind: 'Component',
			Group: 'layout',
			Icon: 'layout',
			Description: 'A card.',
			Props: [
				{Name: 'Title', Type: 'text', Default: '', Options: null, Schema: null, Body: false, Description: 'The title on top.'},
				{Name: 'Count', Type: 'number', Default: 3, Options: null, Schema: null, Body: false, Description: 'How many.'},
				{Name: 'Open', Type: 'bool', Default: false, Options: null, Schema: null, Body: false, Description: 'Whether it is open.'},
				{Name: 'Variant', Type: 'select', Default: 'flat', Options: ['flat', 'raised'], Schema: null, Body: false, Description: 'Its look.'},
				{Name: 'Items', Type: 'json', Default: [{ID: 1}], Options: null, Schema: {ID: 'number', Label: 'text'}, Body: false, Description: 'The list.'},
				{Name: 'Size', Type: 'text', Default: 'medium', Options: null, Schema: null, Body: false, Description: ''},
				{Name: 'Text', Type: 'text', Default: '', Options: null, Schema: null, Body: true, Description: 'Its text, also from its body.'}
			],
			Slots: ['actions'],
			Container: true,
			Children: ['MetaTab'],
			Current: 'Variant',
			Events: ['open'],
			EventDescriptions: {},
			Methods: ['Open()'],
			Sample: {Title: 'Hello'}
		});
	});

	it('takes the events as {name: description}: Events lists their names, EventDescriptions their descriptions, a copy', function () {
		var name = unique('MetaEvents');
		var meta;

		Elemenx.Component(name, {$Template: '<b></b>', $Meta: {Events: {change: 'The value changed: the new value.', close: 'It closed.'}}});

		meta = Elemenx.Meta(name);

		expect(meta.Events).toEqual(['change', 'close']);
		expect(meta.EventDescriptions).toEqual({change: 'The value changed: the new value.', close: 'It closed.'});

		meta.EventDescriptions.change = 'changed';

		expect(Elemenx.Meta(name).EventDescriptions.change).toBe('The value changed: the new value.');
	});

	it('gives a copy: a change of what it returns does not reach the definition', function () {
		var name = unique('MetaCopy');
		var meta;

		Elemenx.Component(name, {$Template: '<b></b>', $Meta: {Props: {Items: 'A list.'}, Sample: {Items: [1]}}, Items: [1, 2]});

		meta = Elemenx.Meta(name);

		meta.Props[0].Default.push(3);
		meta.Sample.Items.push(2);

		expect(Elemenx.Meta(name).Props[0].Default).toEqual([1, 2]);
		expect(Elemenx.Meta(name).Sample).toEqual({Items: [1]});
	});

	it('reads the $Meta of Services and Directives, a Directive by its name in any case', function () {
		var service = unique('MetaService');
		var directive = unique('metadirective').toLowerCase();

		Elemenx.Service(service, {$Meta: {Description: 'Counts.', Methods: ['Count()']}, Count: function () {
			return 1;
		}});
		Elemenx.Directive(directive, {$Meta: {Description: 'Marks.'}, $OnUpdate: function () {}});

		expect(Elemenx.Meta(service)).toMatchObject({Name: service, Kind: 'Service', Description: 'Counts.', Methods: ['Count()'], Props: []});
		expect(Elemenx.Meta(directive.toUpperCase())).toMatchObject({Name: directive, Kind: 'Directive', Description: 'Marks.'});
	});

	it('is null for a name without a definition or without $Meta, and lists the Components that declare one', function () {
		var plain = unique('MetaPlain');
		var declared = unique('MetaDeclared');

		Elemenx.Component(plain, {$Template: '<b></b>'});
		Elemenx.Component(declared, {$Template: '<b></b>', $Meta: {Group: 'text'}});

		expect(Elemenx.Meta(plain)).toBeNull();
		expect(Elemenx.Meta(unique('MetaNothing'))).toBeNull();

		expect(Elemenx.Meta().map(function (meta) {
			return meta.Name;
		})).toContain(declared);
		expect(Elemenx.Meta().map(function (meta) {
			return meta.Name;
		})).not.toContain(plain);

		expect(function () {
			Elemenx.Meta('a', 'b');
		}).toThrow('Elemenx.Meta expects () or (name)');
	});

	it('keeps $Meta out of the state of an instance', function () {
		var name = unique('MetaState');
		var instance;

		Elemenx.Component(name, {$Template: '<b>{{Title}}</b>', $Meta: {Group: 'text'}, Title: 'x'});

		instance = Elemenx.Component(name)({});

		expect(instance.$Meta).toBeUndefined();
		expect(instance.Title).toBe('x');

		instance.$Destroy();
	});
});
