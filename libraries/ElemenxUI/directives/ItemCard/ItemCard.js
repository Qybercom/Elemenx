/*
 * *itemcard="item" shows the card of an item of a game on any element: under the pointer or the focus, beside the
 * element (GameItems.Place), as GameInventory and GameSlot show it. The item is {Name, Rarity, Type, Stats: [{Label,
 * Value}], Description, Class}; an item with nothing more than a name (GameItems.Carded) shows none, and neither does
 * null. The card opens in the top layer (a popover), so no scrolling box, transform or filter around the element cuts
 * or moves it; it follows the element when the page scrolls or moves it (a part above that renders later), and it stays in the DOM next to the element, so it takes the theme of the part of the page it is in.
 * A card a finger opened (a tap on a tablet) closes when the page scrolls, as the tooltips of the system do.
 * It has the classes of GameItemCard (elemenx-game-inventory-card...).
 */
Elemenx.Directive('itemcard', {
	$Meta: {
		Description: '*itemcard="item" shows the card of an item of a game on any element: under the pointer or the focus, beside the element (GameItems.Place), as GameInventory and GameSlot show it.'
	},
	$OnCreate: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Card = null;

		/* The text of a phrase of the dictionaries of the page, or the fallback. */
		data.Text = function (key, fallback) {
			var text = Elemenx.Locale && Elemenx.Locale.Text ? Elemenx.Locale.Text(key) : '';

			return text && text !== key ? text : fallback;
		};

		/* A part of the card: an element of a class with a text. */
		data.Part = function (tag, name, text) {
			var part = document.createElement(tag);

			part.className = name;
			part.textContent = text;

			return part;
		};

		data.Build = function (item) {
			var card = document.createElement('span');
			var stats;
			var classes = (Array.isArray(item.Class) ? item.Class : String(item.Class || '').split(/\s+/)).filter(function (name) {
				return /^[A-Za-z][\w-]*$/.test(name);
			});
			var kind = [item.Rarity ? data.Text('ui.game.' + item.Rarity, item.Rarity) : '', item.Type || ''].filter(Boolean).join(' · ');

			card.className = ['elemenx-game-panel', 'elemenx-game-inventory-card', 'elemenx-item-card', /^(common|uncommon|rare|epic|legendary)$/.test(item.Rarity) ? item.Rarity : 'common'].concat(classes).join(' ');

			card.setAttribute('role', 'tooltip');
			card.setAttribute('popover', 'manual');

			card.id = 'elemenx-item-card-' + Math.random().toString(36).slice(2, 10);

			card.appendChild(data.Part('strong', 'elemenx-game-inventory-name', item.Name || ''));

			if (kind)
				card.appendChild(data.Part('span', 'elemenx-game-inventory-type', kind));

			if (item.Stats && item.Stats.length) {
				stats = data.Part('span', 'elemenx-game-inventory-stats', '');

				stats.setAttribute('role', 'list');

				item.Stats.forEach(function (stat) {
					var row = data.Part('span', 'elemenx-game-inventory-stat', '');

					row.setAttribute('role', 'listitem');
					row.appendChild(data.Part('span', 'elemenx-game-inventory-stat-label', stat.Label));
					row.appendChild(data.Part('span', 'elemenx-game-inventory-stat-value', String(stat.Value)));

					stats.appendChild(row);
				});

				card.appendChild(stats);
			}

			if (item.Description)
				card.appendChild(data.Part('span', 'elemenx-game-inventory-description', item.Description));

			return card;
		};

		data.Show = function () {
			var item = data.Item;
			var place;

			data.Hide();

			if (!item || !context.Component.$Service('GameItems').Carded(item)) return;

			place = context.Component.$Service('GameItems').Place(element);

			data.Card = data.Build(item);

			data.Card.setAttribute('style', 'position: fixed; inset: auto; margin: 0; ' + place);

			element.parentNode.insertBefore(data.Card, element.nextSibling);
			element.setAttribute('aria-describedby', data.Card.id);

			if (data.Card.showPopover)
				data.Card.showPopover();

			data.View = (element.ownerDocument || document).defaultView || window;

			data.View.addEventListener('scroll', data.Scrolled, true);

			data.ByTouch = data.Touched;
			data.Place = place;
			data.Frame = data.View.requestAnimationFrame(data.Follow);
		};

		/* The pointer that pressed the element last: a finger opens a card that a scroll closes. */
		data.Pressed = function (event) {
			data.Touched = event.pointerType === 'touch' || event.pointerType === 'pen';
		};

		data.Scrolled = function () {
			if (data.ByTouch) data.Hide();
			else data.Move();
		};

		/* A scroll (the reader's, or the page that moves as more of it renders) takes the card along with its element. */
		data.Move = function () {
			var place;

			if (!data.Card) return;

			place = context.Component.$Service('GameItems').Place(element);

			if (place !== data.Place)
				data.Card.setAttribute('style', 'position: fixed; inset: auto; margin: 0; ' + place);

			data.Place = place;
		};

		/* The page moves the element without a scroll too (a part above it renders, a panel opens): the card looks at each frame. */
		data.Follow = function () {
			if (!data.Card) return;

			data.Move();

			data.Frame = data.View.requestAnimationFrame(data.Follow);
		};

		data.Hide = function () {
			(data.View || window).removeEventListener('scroll', data.Scrolled, true);
			(data.View || window).cancelAnimationFrame(data.Frame);

			if (!data.Card) return;

			if (data.Card.hidePopover && data.Card.matches(':popover-open'))
				data.Card.hidePopover();

			if (data.Card.parentNode)
				data.Card.parentNode.removeChild(data.Card);

			element.removeAttribute('aria-describedby');

			data.Card = null;
		};

		element.addEventListener('pointerdown', data.Pressed);
		element.addEventListener('mouseenter', data.Show);
		element.addEventListener('mouseleave', data.Hide);
		element.addEventListener('focusin', data.Show);
		element.addEventListener('focusout', data.Hide);
	},

	$OnUpdate: function (context) {
		context.Data.Item = context.Value || null;

		if (context.Data.Card)
			context.Data.Show();
	},

	$OnDestroy: function (context) {
		var element = context.Element;
		var data = context.Data;

		data.Hide();

		element.removeEventListener('pointerdown', data.Pressed);
		element.removeEventListener('mouseenter', data.Show);
		element.removeEventListener('mouseleave', data.Hide);
		element.removeEventListener('focusin', data.Show);
		element.removeEventListener('focusout', data.Hide);
	}
});
