/*
 * *mount="source" places custom content in the element: source is a DOM node (moved in), a function
 * (called once with the element) or an object with Element or Render(container, item). Used by ToastHost.
 */
Elemenx.Directive('mount', {
	$OnUpdate: function (context) {
		var element = context.Element;
		var source = context.Value;
		var node = source && source.nodeType ? source : source && source.Element;
		var render = typeof source === 'function' ? source : source && typeof source.Render === 'function' ? source.Render : null;

		if (context.Data.Source === source) return;

		context.Data.Source = source;

		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		if (node) element.appendChild(node);
		else if (render) render(element, source);
	}
});