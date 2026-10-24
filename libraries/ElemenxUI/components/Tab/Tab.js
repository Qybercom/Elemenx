/*
 * A tab of a Tabs, declared in its template with its content: <Tab ID="general" Label="General">...</Tab>. ID, Label,
 * Icon, Badge, Closable and Disabled describe its tab in the strip (as the items of Tabs); the Tabs shows the content of
 * the current tab under the strip and hides the others. The content in the tab is made with the page; Component names a
 * component made only when the tab first opens (with Props as its props), for the content that costs: a page of
 * settings, a chart, a table of data. Its panel is an elemenx-tab-panel (the Panels Service reads it).
 */
Elemenx.Component('Tab', {
	$TemplateURL: 'Tab.html',
	$StyleURL: 'Tab.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'panel-bottom',
		Description: 'A tab of a Tabs, declared in its template with its content: <Tab ID="general" Label="General">...</Tab>.',
		Container: true,
		Props: {
			ID: 'The ID of the tab: the Value of the Tabs while it is current.',
			Label: 'The text of the tab in the strip.',
			Icon: 'An icon before the label.',
			Badge: 'A badge after the label.',
			Closable: 'Adds the cross that emits close on the Tabs.',
			Disabled: 'The tab cannot be chosen.',
			Component: 'A component made only when the tab first opens.',
			Props: 'The props of that component.'
		}
	},
	ID: '',
	Label: '',
	Icon: '',
	Badge: '',
	Closable: false,
	Disabled: false,
	Component: '',
	Props: null,
	Opened: false,

	$OnCreate: function () {
		var self = this;
		var own = {Instance: null};

		this.Own = function () {
			return own;
		};

		/* The component of Component, made once the tab is open, and made again when Component or Props change. */
		this.Made = function (name, props) {
			return {
				Render: function (container) {
					if (own.Instance)
						own.Instance.$Destroy();

					own.Instance = Elemenx.Component(name)(props || {}, null, {Application: self.$Application()});

					container.appendChild(own.Instance.$Element());
				}
			};
		};
	},

	$OnDestroy: function () {
		if (this.Own().Instance)
			this.Own().Instance.$Destroy();
	},

	/* The Tabs opened this tab (the event tabopen of its panel). */
	Open: function () {
		if (!this.Opened)
			this.Opened = true;
	}
});
