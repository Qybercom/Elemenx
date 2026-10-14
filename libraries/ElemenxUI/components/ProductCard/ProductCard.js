/*
 * The card of a product: its Images (dots switch them) or Image, a Badge ('Sale', 'New'; BadgeVariant), the favorite
 * heart (Favorable, Favorite), Brand, Title, Rating (halves) and Reviews, Price and OldPrice in Currency, the Colors
 * ([{Value, Color, Label}]) and Sizes to choose (Color, Size), and the cart button (Cart, InCart). PriceStyle 'corner'
 * puts the price on the image, as a tile of the Metro style. Ratio is the shape of the image ('1:1' by default).
 * Variant and Href as in Card.
 * Events: add ({Color, Size}), favorite ({Favorite}), color ({Color}), size ({Size}).
 */
Elemenx.Component('ProductCard', {
	$TemplateURL: 'ProductCard.html',
	$StyleURL: 'ProductCard.css',
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
	AddLabel: 'Add to cart',
	InCartLabel: 'In the cart',
	FavoriteLabel: 'Favorite',
	RatingLabel: 'Rating',
	ColorLabel: 'Color',
	SizeLabel: 'Size',
	ImagesLabel: 'Images',
	ImageLabel: 'Image',

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
