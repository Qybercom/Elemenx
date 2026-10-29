import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

var designer;

describe('Contract: the Designer Service edits projects of pages, components, routes and guards', function () {
	beforeAll(async function () {
		localStorage.removeItem('elemenx-designer:document');
		localStorage.removeItem('elemenx-designer:projects');

		/* A project kept by the designer before there were several of them, its routes in its pages. */
		localStorage.setItem('elemenx-designer:project', JSON.stringify({Mode: 'application', Name: 'Old', Settings: {Title: 'Old', Language: 'en', Theme: '', Router: 'history'}, Documents: [{ID: 'd1', Type: 'page', Name: 'Home', Route: '/', Title: 'Home', Description: '', Props: [], Root: null}, {ID: 'd2', Type: 'page', Name: 'About', Route: '/about', Title: 'About', Description: '', Props: [], Root: null}], Current: 'd1'}));

		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Designer.js');

		designer = Elemenx.Service('Designer');

		designer.Use({Components: [], Classes: {}});
	});

	it('takes a project kept before as the first of the projects, its routes from its pages', function () {
		var project = designer.Project();

		expect(project.Mode).toBe('application');
		expect(project.Name).toBe('Old');
		expect(project.Routes.map(function (route) {
			return [route.Path, route.Page];
		})).toEqual([['/', 'd1'], ['/about', 'd2']]);
		expect(project.Tabs).toEqual(['d1']);
		expect(project.Settings).toMatchObject({Component: '', NotFound: '', Description: '', Icon: ''});
		expect(designer.Projects().map(function (entry) {
			return [entry.Name, entry.Current];
		})).toEqual([['Old', true]]);
	});

	it('makes a project of a mode that stays its own: an application of a page on /, a component, a template', function () {
		var old = designer.Project().ID;
		var shop = designer.Create('application', 'Shop');

		expect(designer.Create('anything')).toBe(null);
		expect(designer.Project()).toMatchObject({ID: shop, Mode: 'application', Name: 'Shop', Tabs: ['d1']});
		expect(designer.Project().Routes).toEqual([{ID: 'r1', Path: '/', Page: 'd1', Guards: [], Failed: ''}]);
		expect(designer.Projects().map(function (entry) {
			return entry.ID;
		}).sort()).toEqual([old, shop].sort());
		expect(designer.Projects().filter(function (entry) {
			return entry.Current;
		})[0].ID).toBe(shop);

		/* A component project: one component, its slot kind in the palette, no place of the pages (an application only). */
		designer.Create('component', 'Badge');

		expect(designer.Project().Documents.map(function (item) {
			return [item.Type, item.Name];
		})).toEqual([['component', 'Badge']]);
		expect(flat()).toContain('slot');
		expect(flat()).not.toContain('outlet');

		expect(designer.Switch(shop)).toBe(true);
		expect(designer.Switch('nothing')).toBe(false);
		expect(designer.Project().Name).toBe('Shop');
	});

	it('opens documents in tabs, each with its tree, and closes them, never the last one', function () {
		var home = designer.Opened();
		var card = designer.AddDocument('component', 'Card');

		expect(designer.Project().Tabs).toEqual([home]);

		designer.Open(card);

		expect(designer.Project().Tabs).toEqual([home, card]);
		expect(designer.Opened()).toBe(card);

		designer.Insert('paragraph', 'root');

		designer.Open(home);

		expect(designer.Template(false)).toBe('');

		designer.Open(card);

		expect(designer.Template(false)).toBe('<p>A paragraph of text.</p>');

		expect(designer.Close(card)).toBe(true);
		expect(designer.Opened()).toBe(home);
		expect(designer.Close(home)).toBe(false);
	});

	it('adds a component with a slot: the slot is a kind of a component only, its name what the component makes', function () {
		var home = designer.Opened();
		var card = designer.Project().Documents[1].ID;
		var slot;

		expect(designer.AddDocument('component', 'Card')).toBe(null);
		expect(designer.AddDocument('component', 'card')).toBe(null);

		expect(flat().indexOf('slot')).toBe(-1);

		designer.Open(card);

		expect(flat().indexOf('slot')).not.toBe(-1);

		slot = designer.Insert('slot', 'root');

		designer.Set(slot, 'Name', 'actions');

		expect(designer.Template(false)).toBe('<p>A paragraph of text.</p>\n<slot name="actions"></slot>');
		expect(designer.Project().Documents[1].Slots).toEqual(['actions']);

		designer.Open(home);
	});

	it('declares the props of a component, which become the fields of its kind on the pages', function () {
		var card = designer.Project().Documents[1].ID;
		var kind;
		var node;

		expect(designer.SetDocument(card, 'Props', [{Name: 'Title', Type: 'text', Default: 'Hello', Description: 'The title'}, {Name: 'Size', Type: 'select', Options: 'small, large', Default: 'large'}, {Name: 'Count', Type: 'number', Default: '3'}])).toBe(true);
		expect(designer.SetDocument(card, 'Props', [{Name: 'Title'}, {Name: 'Title'}])).toBe(false);
		expect(designer.SetDocument(card, 'Props', [{Name: '1st'}])).toBe(false);

		expect(designer.Project().Documents[1].Props).toEqual([
			{Name: 'Title', Type: 'text', Default: 'Hello', Options: [], Description: 'The title'},
			{Name: 'Size', Type: 'select', Default: 'large', Options: ['small', 'large'], Description: ''},
			{Name: 'Count', Type: 'number', Default: 3, Options: [], Description: ''}
		]);

		kind = designer.Kind('Card');

		expect(kind.Group).toBe('project');
		expect(kind.Container).toBe(true);
		expect(kind.Slots).toEqual(['actions']);
		expect(groups()).toContain('project');

		node = designer.Insert('Card', 'root');

		designer.Set(node, 'Title', 'Shop');

		expect(designer.Template(false)).toBe('<Card Title="Shop" />');
	});

	it('shows a component of the project on the canvas as a Component made of its document', function () {
		var canvas = designer.Template(true, '');
		var name = /<(DesignerPart\d+)/.exec(canvas)[1];
		var host = document.createElement('div');
		var instance;

		expect(canvas).not.toContain('<Card');

		instance = Elemenx.Component(name)({Title: 'Shop'});

		host.appendChild(instance.$Element());

		expect(host.querySelector('.elemenx-designer-part p').textContent).toBe('A paragraph of text.');
		expect(instance.Count).toBe(3);

		instance.$Destroy();
	});

	it('never puts a component into itself, nor into one it holds; renames it where it is held, and keeps one that is held', function () {
		var card = designer.Project().Documents[1].ID;
		var home = designer.Opened();
		var panel = designer.AddDocument('component', 'Panel');

		designer.Open(panel);
		designer.Insert('Card', 'root');

		designer.Open(card);

		expect(designer.Insert('Card', 'root')).toBe(null);
		expect(designer.Insert('Panel', 'root')).toBe(null);

		designer.Open(home);

		expect(designer.Used(card)).toEqual(['Home', 'Panel']);
		expect(designer.SetDocument(card, 'Name', 'Panel')).toBe(false);
		expect(designer.SetDocument(card, 'Name', 'Tile')).toBe(true);
		expect(designer.Template(false)).toBe('<Tile Title="Shop" />');
		expect(designer.Source(panel)).toBe('<Tile />');
		expect(designer.RemoveDocument(card)).toBe(false);
		expect(designer.RemoveDocument(panel)).toBe(true);
		expect(designer.Project().Tabs).not.toContain(panel);
	});

	it('keeps a history for each document', function () {
		var home = designer.Opened();
		var card = designer.Project().Documents[1].ID;

		designer.Insert('heading', 'root');

		designer.Open(card);
		designer.Undo();

		expect(designer.Template(false)).toBe('<p>A paragraph of text.</p>\n<slot></slot>');

		designer.Open(home);
		designer.Undo();

		expect(designer.Template(false)).toBe('<Tile Title="Shop" />');
	});

	it('routes the pages of an application, guarded by the guards of the project, a refusal shown by a page', function () {
		var home = designer.Project().Documents[0].ID;
		var about = designer.AddDocument('page', 'About us');
		var route;

		expect(designer.Project().Routes.filter(function (entry) {
			return entry.Page === about;
		})[0].Path).toBe('/about-us');

		route = designer.AddRoute('product/:id', about);

		expect(route).toBeTruthy();
		expect(designer.AddRoute('/product/:id', about)).toBe(null);
		expect(designer.SetRoute(route, 'Path', '/')).toBe(false);
		expect(designer.SetRoute(route, 'Page', 'nothing')).toBe(false);

		expect(designer.AddGuard()).toBe('Guard1');
		expect(designer.AddGuard('lower')).toBe(null);
		expect(designer.SetGuard('Guard1', 'Name', 'Signed')).toBe(true);
		expect(designer.SetGuard('Signed', 'Code', 'return this.$Service(\'Session\').Signed || \'/login\';')).toBe(true);

		expect(designer.SetRoute(route, 'Guards', ['Signed', 'Unknown', 'Signed'])).toBe(true);
		expect(designer.SetRoute(route, 'Failed', home)).toBe(true);

		expect(designer.Project().Routes.filter(function (entry) {
			return entry.ID === route;
		})[0]).toEqual({ID: route, Path: '/product/:id', Page: about, Guards: ['Signed'], Failed: home});
		expect(designer.Project().Guards).toEqual([{Name: 'Signed', Description: '', Code: 'return this.$Service(\'Session\').Signed || \'/login\';'}]);

		/* A guard renamed is renamed on its routes; taken away, it leaves them. */
		designer.SetGuard('Signed', 'Name', 'Member');

		expect(designer.Project().Routes.filter(function (entry) {
			return entry.ID === route;
		})[0].Guards).toEqual(['Member']);

		designer.RemoveGuard('Member');

		expect(designer.Project().Routes.filter(function (entry) {
			return entry.ID === route;
		})[0].Guards).toEqual([]);

		/* A page taken away takes its routes with it. */
		expect(designer.RemoveDocument(about)).toBe(true);
		expect(designer.Project().Routes.map(function (entry) {
			return entry.Path;
		})).toEqual(['/']);
	});

	it('sets the component of the Application, one that holds the place of the pages, and the other settings', function () {
		var layout = designer.AddDocument('component', 'Frame');
		var home = designer.Project().Documents[0].ID;

		designer.Open(layout);

		expect(flat()).toContain('outlet');

		designer.Insert('outlet', 'root');

		expect(designer.Template(false)).toBe('<div class="elemenx-column fill" *outlet="Content"></div>');
		expect(designer.Project().Documents.filter(function (item) {
			return item.ID === layout;
		})[0].Outlet).toBe(true);

		expect(designer.SetSetting('Component', home)).toBe(false);
		expect(designer.SetSetting('Component', layout)).toBe(true);
		expect(designer.SetSetting('NotFound', layout)).toBe(false);
		expect(designer.SetSetting('NotFound', home)).toBe(true);
		expect(designer.SetSetting('Description', 'A shop.')).toBe(true);
		expect(designer.SetSetting('Name', '')).toBe(false);

		expect(designer.Project().Settings).toMatchObject({Component: layout, NotFound: home, Description: 'A shop.'});

		/* The template of the place reads back as it. */
		designer.Import('<div class="elemenx-column fill" *outlet="Content"></div>');

		expect(designer.Root().Children[0].Kind).toBe('outlet');

		designer.Open(home);
	});

	it('writes the project into the text of a file and reads it back as a project of its own', function () {
		var shop = designer.Project().ID;
		var text = designer.ExportProject();
		var copy;

		expect(JSON.parse(text)).toMatchObject({Elemenx: 'designer-project', Version: 1});
		expect(designer.ImportProject('not a project')).toBe(null);

		copy = designer.ImportProject(text);

		expect(copy).toBeTruthy();
		expect(copy).not.toBe(shop);
		expect(designer.Project().Name).toBe('Shop');
		expect(designer.Template(false)).toBe('<Tile Title="Shop" />');

		expect(designer.RemoveProject(copy)).toBe(true);
		expect(designer.Project().ID).not.toBe(copy);
		expect(designer.Projects().map(function (entry) {
			return entry.ID;
		})).not.toContain(copy);

		designer.Switch(shop);

		expect(JSON.parse(localStorage.getItem('elemenx-designer:projects')).Current).toBe(shop);
	});

	it('keeps the projects of a project of elemenx design apart, takes its Components and edits a copy of one, its bindings kept', function () {
		var shop = designer.Project().ID;
		var basket = '<section>\n\t<h2>{{Title}}</h2>\n\t<Pill Label="Pay" [disabled]="!Items.length" (click)="Pay" />\n</section>';
		var copy;

		designer.Scope('Store');

		expect(designer.ProjectsKey).toBe('elemenx-designer:projects:Store');
		expect(designer.Project()).toMatchObject({Mode: 'application', Name: 'Store'});
		expect(designer.Projects().length).toBe(1);

		designer.Extend([
			{Name: 'Basket', Description: 'The basket.', Props: [{Name: 'Title', Type: 'text', Default: 'Cart'}, {Name: 'Items', Type: 'json', Default: []}], Slots: [], Template: basket, Definition: {Title: 'Cart', Items: [], Pay: function () {}}},
			{Name: 'Pill', Props: [{Name: 'Label', Type: 'text', Default: ''}, {Name: 'Disabled', Type: 'bool', Default: false}], Template: '<b>{{Label}}</b>', Definition: {Label: '', Disabled: false}},
			{Name: 'not a name'}
		]);

		expect(designer.Kinds().filter(function (group) {
			return group.ID === 'files';
		})[0].Kinds.map(function (kind) {
			return kind.ID;
		})).toEqual(['Basket', 'Pill']);

		copy = designer.Copy('Basket');

		expect(designer.Copy('Basket')).toBe(copy);
		expect(designer.Copy('Nothing')).toBe(null);
		expect(designer.Project().Documents.filter(function (item) {
			return item.ID === copy;
		})[0]).toMatchObject({Type: 'component', Name: 'Basket', Description: 'The basket.', Origin: 'Basket', Props: [{Name: 'Title', Type: 'text', Default: 'Cart'}, {Name: 'Items', Type: 'json', Default: '[]'}]});
		expect(designer.Source(copy)).toBe(basket);

		/* The copy is the Basket of the palette now; on the canvas it runs as a Component of the definition it came with. */
		expect(groups()).toContain('project');
		expect(designer.Kinds().filter(function (group) {
			return group.ID === 'files';
		})[0].Kinds.map(function (kind) {
			return kind.ID;
		})).toEqual(['Pill']);

		designer.Insert('Basket', 'root');

		expect(designer.Template(false)).toBe('<Basket />');
		expect(designer.Template(true)).toMatch(/<DesignerPart\d+/);

		/* Its canvas shows what the page is made of, not the expressions of the copy. */
		designer.Open(copy);

		expect(designer.Template(true)).not.toContain('(click)');
		expect(designer.Template(true)).toContain('{{ \'{{\' }}Title}}');
		expect(designer.Template(false)).toBe(basket);

		designer.Scope('');

		expect(designer.ProjectsKey).toBe('elemenx-designer:projects');
		expect(designer.Project().ID).toBe(shop);
		expect(JSON.parse(localStorage.getItem('elemenx-designer:projects:Store')).Projects).toBeTruthy();

		designer.Extend([]);
	});
});

function flat () {
	var ids = [];

	designer.Kinds().forEach(function (group) {
		group.Kinds.forEach(function (kind) {
			ids.push(kind.ID);
		});
	});

	return ids;
}

function groups () {
	return designer.Kinds().map(function (group) {
		return group.ID;
	});
}
