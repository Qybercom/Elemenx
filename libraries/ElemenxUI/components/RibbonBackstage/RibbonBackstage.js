/*
 * The backstage of a Ribbon, as the File view of Microsoft Office: <RibbonBackstage slot="backstage"> with RibbonPage
 * children. The File button of the Ribbon opens it over the window: the list of the pages on the side, the content of
 * the current one beside it. The back button and Escape close it. Page is the current page.
 * Events: page ({ID}). Commands among the pages are reported by the Ribbon (command).
 */
Elemenx.Component('RibbonBackstage', {
	$TemplateURL: 'RibbonBackstage.html',
	Title: '',
	Page: '',
	Pages: [],

	$OnCreate: function () {
		this.Shown = function (page, pages) {
			var first = '';
			var i = 0;

			while (i < pages.length) {
				if (!pages[i].Command && String(pages[i].ID) === String(page)) return pages[i].ID;

				if (!first && !pages[i].Command)
					first = pages[i].ID;

				i++;
			}

			return first;
		};
	},

	$OnReady: function () {
		var self = this;
		var content = this.$Element().querySelector('.elemenx-ribbon-backstage-content');

		function source (node) {
			return node.nodeType === 1 && (node.matches('.elemenx-ribbon-page') || !!node.querySelector('.elemenx-ribbon-page'));
		}

		this.Watcher = new MutationObserver(function (records) {
			var relevant = records.some(function (record) {
				return record.type === 'attributes' || Array.prototype.some.call(record.addedNodes, source) || Array.prototype.some.call(record.removedNodes, source);
			});
			if (relevant)
				self.Sync();
		});

		this.Watcher.observe(content, {subtree: true, childList: true, attributes: true, attributeFilter: ['data-id', 'data-title', 'data-icon', 'data-command', 'data-page']});

		this.Sync();
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();
	},

	/* Reads the declared pages and shows the current one. */
	Sync: function () {
		var content = this.$Element().querySelector('.elemenx-ribbon-backstage-content');
		var nodes = Array.prototype.filter.call(content.querySelectorAll('.elemenx-ribbon-page'), function (node) {
			return node.parentElement.closest('.elemenx-ribbon-backstage-content') === content;
		});
		var pages = nodes.map(function (node) {
			return {ID: node.getAttribute('data-id') || '', Title: node.getAttribute('data-title') || '', Icon: node.getAttribute('data-icon') || '', Command: node.getAttribute('data-command') === 'true'};
		});
		var shown;
		var i = 0;

		if (JSON.stringify(pages) !== JSON.stringify(this.Pages))
			this.Pages = pages;

		shown = String(this.Shown(this.Page, pages));

		while (i < nodes.length) {
			nodes[i].classList.toggle('active', nodes[i].getAttribute('data-id') === shown && !pages[i].Command);

			i++;
		}
	},

	Choose: function (event, node) {
		var id = node.getAttribute('data-id');
		var page = this.Pages.filter(function (entry) {
			return String(entry.ID) === id;
		})[0];

		if (page && page.Command) {
			this.$Element().dispatchEvent(new CustomEvent('elemenx-ribbon-command', {bubbles: true, detail: {ID: id, Item: null, Backstage: true}}));

			return;
		}

		if (String(this.Shown(this.Page, this.Pages)) === id) return;

		this.Page = id;

		this.$Emit('page', {ID: id});
	},

	Back: function () {
		this.$Element().dispatchEvent(new CustomEvent('elemenx-ribbon-close', {bubbles: true, detail: {Focus: true}}));
	},

	Key: function (event) {
		var items;
		var index;

		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();

			this.Back();

			return;
		}

		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

		items = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-ribbon-backstage-back, .elemenx-ribbon-backstage-item'));
		index = items.indexOf(this.$Element().getRootNode().activeElement);

		if (index === -1) return;

		event.preventDefault();

		items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
	}
});
