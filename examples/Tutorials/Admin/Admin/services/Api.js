/*
 * The data of the panel. Here it lives in memory and answers after a short pause, as a server would; a real panel
 * makes the same methods ask its server with this.$Network().XHR. callback(error, result).
 */
Elemenx.Service('Api', {
	$OnCreate: function () {
		var names = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth', 'Margaret Hamilton', 'Ken Thompson', 'Frances Allen', 'John Backus', 'Radia Perlman', 'Tim Berners-Lee'];

		this.People = names.map(function (name, index) {
			return {ID: index + 1, Name: name, Email: name.split(' ')[0].toLowerCase() + '@example.com', Role: index % 4 === 0 ? 'admin' : 'customer', Orders: (index * 7) % 23, Joined: '2026-0' + (1 + index % 9) + '-1' + (index % 9)};
		});
	},

	/* An answer after a pause, a copy of it: what the caller changes is not the data. */
	Later: function (callback, value) {
		window.setTimeout(function () {
			callback(null, JSON.parse(JSON.stringify(value)));
		}, 200);
	},

	Users: function (callback) {
		this.Later(callback, this.People);
	},

	Stats: function (callback) {
		this.Later(callback, {
			Users: this.People.length,
			Orders: this.People.reduce(function (sum, person) {
				return sum + person.Orders;
			}, 0),
			Revenue: 48210,
			Months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
			Sales: [3200, 4100, 3900, 5200, 6100, 7400]
		});
	},

	Save: function (user, callback) {
		var found = this.People.filter(function (person) {
			return person.ID === user.ID;
		})[0];

		if (found) {
			found.Name = user.Name;
			found.Email = user.Email;
			found.Role = user.Role;
		}

		this.Later(callback, found || null);
	},

	Remove: function (id, callback) {
		this.People = this.People.filter(function (person) {
			return person.ID !== id;
		});

		this.Later(callback, true);
	}
});
