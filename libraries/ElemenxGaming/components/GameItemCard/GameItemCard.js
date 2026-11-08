/*
 * The card of an item of a game: its Name in the color of its Rarity, its Rarity and Type, its Stats [{Label, Value}]
 * and its Description, on the panel of the theme. Item is the item; Place is where it shows: a style that fixes it to
 * the viewport (GameItems.Place(element) gives the one beside an element). GameInventory and GameSlot show it for the
 * item under the pointer or the focus; any place of the items of a game may show it the same way. Its markup is
 * phrasing content, so it fits inside a button.
 */
Elemenx.Component('GameItemCard', {
	$TemplateURL: 'GameItemCard.html',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The card of an item of a game: its Name in the color of its Rarity, its Rarity and Type, its Stats [{Label, Value}] and its Description, on the panel of the theme.',
		Props: {
			Item: 'The item: {Name, Rarity, Type, Stats, Description}.',
			Place: 'The style that places the card (fixed beside an element: GameItems.Place).'
		},
		Sample: {Item: {Name: 'Sword of dawn', Rarity: 'rare', Type: 'Weapon', Stats: [{Label: 'Attack', Value: 42}], Description: 'Forged at first light.'}, Place: 'position: static;'}
	},
	Item: null,
	Place: '',

	$OnCreate: function () {
		/* A card placed beside an element (GameItems.Place) floats over the page in the top layer; one placed in the flow (position: static) stays there. */
		this.Floating = function (place) {
			return !!place && !/position\s*:\s*(static|relative)/.test(place);
		};

		/* The classes an item asks for (Class: a text of names or a list), for a look of its own. */
		this.Classes = function (value) {
			var list = Array.isArray(value) ? value : String(value || '').split(/\s+/);

			return list.filter(function (name) {
				return /^[A-Za-z][\w-]*$/.test(name);
			});
		};
	}
});
