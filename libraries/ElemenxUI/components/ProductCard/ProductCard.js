/*
 * The card of a product: its Images (dots switch them, and a swipe across, of a finger or of the mouse) or Image, a
 * Badge ('Sale', 'New'; BadgeVariant), the favorite heart (Favorable, Favorite), Brand, Title, Rating (halves) and
 * Reviews, Price and OldPrice in Currency, the Colors
 * ([{Value, Color, Label}]) and Sizes to choose (Color, Size), and the cart button (Cart, InCart). PriceStyle 'corner'
 * puts the price on the image, as a tile of the Metro style. Ratio is the shape of the image ('1:1' by default).
 * Variant and Href as in Card.
 * Events: add ({Color, Size}), favorite ({Favorite}), color ({Color}), size ({Size}).
 */
Elemenx.Component('ProductCard', {
	$TemplateURL: 'ProductCard.html',
	$StyleURL: 'ProductCard.css',
	$Meta: {
		Group: 'commerce',
		Icon: 'cart',
		Description: 'The card of a product: its Images (dots switch them, and a swipe across, of a finger or of the mouse) or Image, a Badge (\'Sale\', \'New\'; BadgeVariant), the favorite heart (Favorable, Favorite), Brand, Title, Rating (halves) and Reviews, Price and OldPrice in Currency, the Colors ([{Value, Color, Label}]) and Sizes to choose (Color, Size), and the cart button (Cart, InCart).',
		Container: true,
		Events: {
			favorite: 'The heart: {Favorite}.',
			color: 'Another color was chosen: {Color}.',
			size: 'Another size was chosen: {Size}.',
			add: 'The cart button: {Color, Size}.'
		},
		Props: {
			Title: 'The name of the product.',
			Brand: 'The brand above the name.',
			Image: 'The URL of the picture.',
			Images: 'Several pictures, switched by dots and swipes.',
			Ratio: 'The shape of the picture (1:1).',
			Badge: 'A badge on the picture (Sale, New).',
			BadgeVariant: 'The tone of the badge.',
			Favorable: 'Shows the heart of the favorites.',
			Favorite: 'The heart is on.',
			Rating: 'The rating, in halves.',
			Reviews: 'The count of reviews.',
			Price: 'The price.',
			OldPrice: 'The price before, struck out.',
			Currency: 'The code of the currency.',
			PriceStyle: {Options: ['default', 'corner'], Description: 'default, or corner (the price on the picture).'},
			Colors: 'The colors to choose: [{Value, Color, Label}].',
			Color: 'The color chosen.',
			Sizes: 'The sizes to choose.',
			Size: 'The size chosen.',
			Cart: 'Shows the cart button.',
			InCart: 'The product is in the cart.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Variant: 'Its look, as in Card.',
			Href: 'Makes the card a link.',
			AddLabel: 'The text of the cart button.',
			InCartLabel: 'The text of the cart button once it is in the cart.',
			FavoriteLabel: 'The name of the heart.',
			RatingLabel: 'What screen readers say of the rating.',
			ColorLabel: 'The name of the choice of the color.',
			SizeLabel: 'The name of the choice of the size.',
			ImagesLabel: 'The name of the pictures for screen readers.',
			ImageLabel: 'The name of a dot ({index}).'
		},
		Sample: {Title: 'Studio headphones', Brand: 'Elemenx Audio', Badge: '−20%', Rating: 4.5, Reviews: 1280, Price: 79.99, OldPrice: 99.99, Color: 'coral'}
	},
	Title: '',
	Brand: '',
	Image: '',
	Images: [],
	Ratio: '1:1',
	Badge: '',
	BadgeVariant: 'danger',
	Favorable: true,
	Favorite: false,
	Rating: null,
	Reviews: null,
	Price: null,
	OldPrice: null,
	Currency: 'USD',
	PriceStyle: 'default',
	Colors: [],
	Color: '',
	Sizes: [],
	Size: '',
	Cart: true,
	InCart: false,
	Disabled: false,
	Variant: 'outlined',
	Href: '',
	Shown: 0,
	AddLabel: '',
	InCartLabel: '',
	FavoriteLabel: '',
	RatingLabel: '',
	ColorLabel: '',
	SizeLabel: '',
	ImagesLabel: '',
	ImageLabel: '',

	$OnCreate: function () {
		var format = this.$Service('Format');

		this.Format = function () {
			return format;
		};

		this.Pictures = function (images, image) {
			return images && images.length ? images : image ? [image] : [];
		};
	},

	Show: function (event, node) {
		this.Shown = Number(node.getAttribute('data-index'));
	},

	/* A swipe across the image: the next one the way the finger went, round at the ends. */
	Swiped: function (event) {
		var count = this.Images && this.Images.length ? this.Images.length : this.Image ? 1 : 0;
		var rtl = window.getComputedStyle(this.$Element()).direction === 'rtl';
		var step = (event.detail.Direction === 'left') !== rtl ? 1 : -1;

		if (count > 1)
			this.Shown = ((this.Shown + step) % count + count) % count;
	},

	Star: function () {
		this.Favorite = !this.Favorite;

		this.$Emit('favorite', {Favorite: this.Favorite});
	},

	PickColor: function (event, node) {
		this.Color = node.getAttribute('data-value');

		this.$Emit('color', {Color: this.Color});
	},

	PickSize: function (event, node) {
		this.Size = node.getAttribute('data-value');

		this.$Emit('size', {Size: this.Size});
	},

	Add: function () {
		this.InCart = true;

		this.$Emit('add', {Color: this.Color, Size: this.Size});
	}
});
