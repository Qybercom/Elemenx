/*
 * A field that finds a city of the Cities Service (the cities of the world from GeoNames, loaded when it is first
 * used): typing lists the cities by name, with their region, country and local time. Value is the ID of the city
 * picked; Country keeps one country (a code of ISO 3166), Limit the number of cities listed, ShowTime the local time.
 * Event: change (the city {ID, Name, Country, Region, Latitude, Longitude, TimeZone}, or null when cleared).
 */
Elemenx.Component('CityInput', {
	$TemplateURL: 'CityInput.html',
	Value: null,
	Country: '',
	Limit: 20,
	ShowTime: true,
	Placeholder: '',
	Clearable: false,
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Options: [],
	Cities: {},
	Query: '',
	Loading: false,

	$OnCreate: function () {
		var self = this;

		this.Service = this.$Service('Cities');

		/* The option of a city: its name, then its region, country and the time there. */
		this.Option = function (city) {
			var place = self.Service.Place(city);
			var time = self.ShowTime && self.ShowTime !== 'false' ? self.Service.Clock(city).Time : '';

			return {Value: city.ID, Label: city.Name, Hint: [place, time].filter(Boolean).join(' · '), Icon: 'map-pin'};
		};

		/* The cities listed, by ID, for the change event. */
		this.Keep = function (cities) {
			var kept = {};

			cities.forEach(function (city) {
				kept[city.ID] = city;
			});

			self.Cities = kept;
			self.Options = cities.map(self.Option);
		};

		if (this.Value != null) {
			this.Service.Find(this.Value, function (error, city) {
				if (city)
					self.Keep([city]);
			});
		}
	},

	Searched: function (text) {
		var self = this;
		var query = String(text || '').trim();

		this.Query = query;

		if (!query) {
			this.Keep([]);

			return;
		}

		this.Loading = true;

		this.Service.Search(query, {Country: this.Country, Limit: Number(this.Limit) || 20}, function (error, cities) {
			if (self.Query !== query) return;

			self.Loading = false;

			self.Keep(error ? [] : cities);
		});
	},

	Changed: function (value) {
		var city = value == null ? null : this.Cities[value] || null;

		this.Value = value;

		if (city)
			this.Keep([city]);

		this.$Emit('change', city);
	}
});
