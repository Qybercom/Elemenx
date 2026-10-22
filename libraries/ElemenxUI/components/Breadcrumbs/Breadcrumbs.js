/*
 * The path to the present page: Items [{ID, Label, Icon, File, Href, Disabled, Class}], the last one the present page
 * (aria-current="page", not pressed unless CurrentClickable). Icon names an Icon, File a FileIcon (by a file name). A
 * press on an item emits select with {Item, Index}; an item with Href is a link (the Router follows it as any link of
 * the page) and emits select too. Separator: chevron (the default), slash, arrow, dot, or a text of its own. Max (0: all)
 * keeps the first item and the last Max - 1: the ones between are behind a "…" that lists them in a menu. The slots
 * start and end stand before and after the path (a button, a status); Size small, medium or large.
 */
Elemenx.Component('Breadcrumbs', {
	$TemplateURL: 'Breadcrumbs.html',
	$StyleURL: 'Breadcrumbs.css',
	Items: [],
	Separator: 'chevron',
	Max: 0,
	Size: 'medium',
	Label: '',
	CurrentClickable: false,

	$OnCreate: function () {
		/* The last item: the present page. */
		function current (entry, items) {
			return !entry.More && entry.Index === (items || []).length - 1;
		}

		function separatorIcon (separator) {
			return {chevron: 'chevron-right', arrow: 'arrow-right'}[separator || 'chevron'] || '';
		}

		/* The entries shown: the items, or with Max the first, a "…" of the hidden ones, and the last Max - 1. */
		this.Shown = function (items, max) {
			var list = (items || []).map(function (item, index) {
				return {Key: 'item-' + (item.ID !== undefined ? item.ID : index), Item: item, Index: index};
			});
			var limit = Number(max) || 0;
			if (!limit || list.length <= Math.max(limit, 2)) return list;

			return [list[0], {Key: 'more', More: true, Items: list.slice(1, list.length - Math.max(limit - 1, 1)).map(function (entry) {
				return {ID: entry.Index, Label: entry.Item.Label, Icon: entry.Item.Icon || ''};
			})}].concat(list.slice(list.length - Math.max(limit - 1, 1)));
		};

		this.Current = current;

		/* A press on the item does something: a link, or a button (the present page only with CurrentClickable). */
		this.Pressable = function (entry, items, currentClickable) {
			return !entry.More && !entry.Item.Href && !entry.Item.Disabled && (!current(entry, items) || !!currentClickable);
		};

		this.SeparatorIcon = separatorIcon;

		this.SeparatorText = function (separator) {
			if (separator === 'slash') return '/';
			if (separator === 'dot') return '·';

			return separatorIcon(separator) ? '' : String(separator || '');
		};
	},

	Pick: function (event, node) {
		var index = Number(node.getAttribute('data-index'));
		var item = this.Items[index];
		if (!item || item.Disabled) return;

		this.$Emit('select', {Item: item, Index: index});
	},

	/* An item of the "…" menu: its ID is the index of the item. */
	MorePicked: function (choice) {
		var item = this.Items[choice.ID];
		if (item)
			this.$Emit('select', {Item: item, Index: choice.ID});
	}
});
