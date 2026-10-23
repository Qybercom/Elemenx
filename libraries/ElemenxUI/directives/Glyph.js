/*
 * *glyph="reference" draws a sprite symbol inside an <svg>. A reference to a symbol of the page ('#elemenx-icon-add')
 * copies the shapes of the symbol into the element, with its viewBox: no <use>, so a restyle of the page (a theme
 * change) does not rebuild one shadow tree per icon, which blanks every icon while the developer tools are open.
 * The fill and stroke attributes of the symbol go to a <g> around the shapes, so a filled or a colored set draws as it
 * is made. Any other reference ('sprite.svg#add') is drawn with <use>. Used by Icon. A symbol that is not in the page yet
 * draws nothing: a reference that waits for Icons.Ready('') (as Icon does) draws once the sprite is in.
 */
Elemenx.Directive('glyph', {
	$Meta: {
		Description: '*glyph="reference" draws a sprite symbol inside an <svg>.'
	},
	$OnUpdate: function (context) {
		var element = context.Element;
		var reference = String(context.Value || '');
		var symbol = reference.charAt(0) === '#' ? document.getElementById(reference.substring(1)) : null;
		var painted = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'style'];
		var group;
		var use;
		var i = 0;

		if (context.Data.Reference === reference) return;

		context.Data.Reference = reference;

		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		if (symbol) {
			element.setAttribute('viewBox', symbol.getAttribute('viewBox') || '0 0 24 24');

			element.innerHTML = symbol.innerHTML;

			while (i < painted.length) {
				if (symbol.hasAttribute(painted[i])) {
					group = group || document.createElementNS('http://www.w3.org/2000/svg', 'g');

					group.setAttribute(painted[i], symbol.getAttribute(painted[i]));
				}

				i++;
			}

			if (!group) return;

			while (element.firstChild) {
				group.appendChild(element.firstChild);
			}

			element.appendChild(group);

			return;
		}

		element.removeAttribute('viewBox');

		if (!reference || reference.charAt(0) === '#') return;

		use = document.createElementNS('http://www.w3.org/2000/svg', 'use');

		use.setAttribute('href', reference);

		element.appendChild(use);
	}
});
