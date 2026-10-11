/*
 * An icon of a sprite: <Icon Name="add" />. The symbols of the library sprite are copied into the page once (as
 * elemenx-icon-<name>), and every icon draws the shapes of its symbol itself (*glyph), with no <use>: Chrome rebuilds
 * the shadow tree of every <use> on a restyle of the page, and with the developer tools open all the icons stay blank
 * until a theme change is over. data-icon names the icon. Sprite names another sprite file, drawn with <use>.
 */
Elemenx.Component('Icon', {
	$TemplateURL: 'Icon.html',
	$StyleURL: 'Icon.css',
	Name: '',
	Size: 16,
	Label: '',
	Sprite: '',
	Spin: false,
	Ready: false,

	$OnCreate: function () {
		var library;
		var url;
		var copy;

		if (this.Sprite) {
			this.Href = function (sprite, name) {
				return sprite + '#' + name;
			};

			return;
		}

		library = Elemenx.Library('ElemenxUI');
		url = String(library && library.$Root || '').replace(/\/$/, '') + '/icons.svg';
		copy = this.Inline(url);

		/* While the copy loads, the icon refers to the file and waits; Ready then switches it to the copy. */
		this.Ready = !!copy && copy.getAttribute('data-ready') === 'true';

		if (copy && !this.Ready)
			copy.ElemenxWaiting.push(this);

		this.Href = function (sprite, name, ready) {
			return ready ? '#elemenx-icon-' + name : url + '#' + name;
		};
	},

	/*
	 * The hidden <svg id="elemenx-icons"> of the page that holds the copy of the sprite at url, made and filled once per
	 * page; null where it cannot be made. The icons created before it is filled wait in its ElemenxWaiting list.
	 */
	Inline: function (url) {
		var copy = document.getElementById('elemenx-icons');
		var request;

		if (copy)
			return copy;

		if (!document.body || typeof XMLHttpRequest === 'undefined' || typeof DOMParser === 'undefined') return null;

		copy = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

		copy.setAttribute('id', 'elemenx-icons');
		copy.setAttribute('aria-hidden', 'true');
		copy.setAttribute('data-ready', 'false');
		copy.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');

		copy.ElemenxWaiting = [];

		document.body.insertBefore(copy, document.body.firstChild);

		request = new XMLHttpRequest();

		request.open('GET', url);

		request.onload = function () {
			var waiting = copy.ElemenxWaiting;
			var source;
			var symbols;
			var i = 0;

			if (request.status < 200 || request.status >= 300) return;

			source = new DOMParser().parseFromString(request.responseText, 'image/svg+xml');
			symbols = source.querySelectorAll('symbol[id]');

			while (i < symbols.length) {
				symbols[i].setAttribute('id', 'elemenx-icon-' + symbols[i].getAttribute('id'));

				copy.appendChild(document.importNode(symbols[i], true));

				i++;
			}

			copy.setAttribute('data-ready', 'true');

			copy.ElemenxWaiting = [];

			i = 0;

			while (i < waiting.length) {
				try {
					waiting[i].Ready = true;
				}
				catch (error) {
					/* An icon destroyed while the copy loaded has nothing left to switch. */
				}

				i++;
			}
		};

		request.send();

		return copy;
	}
});
