/*
 * The panels a component declares in its template, as the tabs of a Tabs (Tab) and of a Ribbon (RibbonTab): a child
 * component renders an element of a class (its panel) whose data-* attributes describe it, and the owner reads them.
 * Read(root, selector, owner) returns the panels of root (an element of selector inside it, not inside another element
 * of the owner selector inside it: the panels of a nested Tabs are its own). Data(panel) gives the data-* attributes of
 * a panel as {Name: text}, the names in PascalCase (data-key-tip is KeyTip). Watch(root, selector, callback) calls back
 * whenever a panel comes, goes or one of its data-* attributes changes, once a frame at most, and returns the function
 * that stops it.
 */
Elemenx.Service('Panels', {
	$Meta: {
		Description: 'The panels a component declares in its template, as the tabs of a Tabs (Tab) and of a Ribbon (RibbonTab): a child component renders an element of a class (its panel) whose data-* attributes describe it, and the owner reads them.',
		Methods: ['Read(root, selector, owner)', 'Data(panel)', 'Watch(root, selector, callback)']
	},
	Read: function (root, selector, owner) {
		if (!root)
			return [];

		return Array.prototype.filter.call(root.querySelectorAll(selector), function (node) {
			var parent = node.parentElement && node.parentElement.closest(owner);

			return !owner || !parent || parent === root;
		});
	},

	Data: function (panel) {
		var data = {};

		Array.prototype.forEach.call(panel.attributes, function (attribute) {
			if (attribute.name.indexOf('data-') !== 0) return;

			data[attribute.name.substring(5).replace(/(^|-)([a-z])/g, function (all, dash, letter) {
				return letter.toUpperCase();
			})] = attribute.value;
		});

		return data;
	},

	Watch: function (root, selector, callback) {
		var frame = 0;
		var observer;

		function source (node) {
			return node.nodeType === 1 && (node.matches(selector) || !!node.querySelector(selector));
		}

		function relevant (record) {
			if (record.type === 'attributes')
				return record.target.matches(selector) && record.attributeName.indexOf('data-') === 0;

			return Array.prototype.some.call(record.addedNodes, source) || Array.prototype.some.call(record.removedNodes, source);
		}

		observer = new MutationObserver(function (records) {
			if (frame || !records.some(relevant)) return;

			frame = window.requestAnimationFrame(function () {
				frame = 0;

				callback();
			});
		});

		observer.observe(root, {subtree: true, childList: true, attributes: true});

		return function () {
			observer.disconnect();

			if (frame)
				window.cancelAnimationFrame(frame);

			frame = 0;
		};
	}
});
