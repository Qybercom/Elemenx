/*
 * The showcase of Acme: each component live, and its reference, made of its $Meta by Elemenx.Meta(name): what it is,
 * its props with their types and defaults, its events. What a component declares is written once, beside its code.
 */
Elemenx.Component('Showcase', {
	$TemplateURL: 'Showcase.html',
	$StyleURL: 'Showcase.css',
	Names: ['StatCard', 'PriceTag', 'CopyField'],
	Metas: [],
	Said: '',

	$OnCreate: function () {
		this.Metas = this.Names.map(function (name) {
			return Elemenx.Meta(name);
		}).filter(function (meta) {
			return !!meta;
		});
	},

	Opened: function (event) {
		this.Said = 'open: ' + event.Label;
	},

	Copied: function (event) {
		this.Said = 'copy: ' + event.Value;
	},

	Shown: function (value) {
		return value === null || value === undefined || value === '' ? '—' : JSON.stringify(value);
	}
});
