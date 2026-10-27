/*
 * The cart: one for the whole Application, so the button in the header, the pages of the products and the checkout
 * show the same. It is kept in the storage of the browser and lives on after a reload. Lines: [{ID, Title, Price,
 * Color, Count}]; Add(product, color), Remove(id, color), Count(), Total(), Clear(); OnChange(callback) hears it.
 */
Elemenx.Service('Cart', {
	$OnCreate: function () {
		this.Store = this.$Storage.Local.Namespace('shop');
		this.Lines = this.Store.Get('cart') || [];
		this.Listeners = [];
	},

	Add: function (product, color) {
		var line = this.Find(product.ID, color);

		if (line) line.Count++;
		else this.Lines.push({ID: product.ID, Title: product.Title, Price: product.Price, Color: color || '', Count: 1});

		this.Changed();
	},

	Remove: function (id, color) {
		this.Lines = this.Lines.filter(function (line) {
			return !(line.ID === id && line.Color === color);
		});

		this.Changed();
	},

	Find: function (id, color) {
		return this.Lines.filter(function (line) {
			return line.ID === id && line.Color === (color || '');
		})[0] || null;
	},

	Count: function () {
		return this.Lines.reduce(function (sum, line) {
			return sum + line.Count;
		}, 0);
	},

	Total: function () {
		return Math.round(this.Lines.reduce(function (sum, line) {
			return sum + line.Price * line.Count;
		}, 0) * 100) / 100;
	},

	Clear: function () {
		this.Lines = [];

		this.Changed();
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	},

	Changed: function () {
		var self = this;

		this.Store.Set('cart', this.Lines);

		this.Listeners.slice().forEach(function (callback) {
			callback(self);
		});
	}
});
