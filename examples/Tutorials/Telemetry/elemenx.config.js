/*
 * The project of the tutorial on live telemetry. Server.WebSocket is its feed, for elemenx dev and elemenx serve: on
 * /feed it sends the channels of a scene ({Type: 'channels', Scene, Channels}) and then their values at a rate of 1 to
 * 120 packets a second ({Type: 'data', Seq, Time, Values: {ID: number}}). The browser asks for another scene ({Type:
 * 'scene', Scene}: car, cluster or ship) and another rate ({Type: 'rate', Hz}). A real project streams from its own
 * machines; this one makes the numbers up from waves and a little noise, the same for the same moment.
 */

/* A channel: {ID, Label, Unit, Min, Max, Kind (dial, bar, number, spark, signal, lamp), Group, Period, Phase, Alarm}. */
function channel (id, label, unit, min, max, kind, group, period, phase, alarm) {
	return {ID: id, Label: label, Unit: unit, Min: min, Max: max, Kind: kind, Group: group, Period: period, Phase: phase || 0, Alarm: alarm === undefined ? null : alarm};
}

/* The scenes, each a set of channels in groups. */
function scenes () {
	var car = [
		channel('speed', 'Speed', 'km/h', 0, 340, 'dial', 'Drive', 9, 0),
		channel('rpm', 'Engine', 'rpm', 0, 15000, 'dial', 'Drive', 3, 1, 14000),
		channel('gear', 'Gear', '', 1, 8, 'number', 'Drive', 9, 0.5),
		channel('throttle', 'Throttle', '%', 0, 100, 'bar', 'Drive', 4.5, 0),
		channel('brake', 'Brake', '%', 0, 100, 'bar', 'Drive', 4.5, 3.1),
		channel('steering', 'Steering', '°', -180, 180, 'number', 'Drive', 6, 2),
		channel('ers', 'ERS', '%', 0, 100, 'bar', 'Energy', 30, 0),
		channel('fuel', 'Fuel', 'kg', 0, 110, 'bar', 'Energy', 600, 1.4),
		channel('oil', 'Oil', '°C', 80, 150, 'bar', 'Engine', 40, 0, 135),
		channel('water', 'Water', '°C', 70, 130, 'bar', 'Engine', 50, 1, 120),
		channel('glat', 'Lateral g', 'g', -5, 5, 'spark', 'Forces', 6, 0),
		channel('glong', 'Longitudinal g', 'g', -5, 5, 'spark', 'Forces', 4.5, 1.2),
		channel('radio', 'Radio', '', 0, 1, 'signal', 'Pit', 20, 0),
		channel('drs', 'DRS', '', 0, 1, 'lamp', 'Pit', 9, 0.3),
		channel('limiter', 'Pit limiter', '', 0, 1, 'lamp', 'Pit', 60, 3),
		channel('laptime', 'Lap', 's', 80, 95, 'number', 'Pit', 90, 0)
	];
	var cluster = [];
	var ship = [
		channel('hull', 'Hull', '%', 0, 100, 'dial', 'Structure', 200, 1.5, null),
		channel('shield', 'Shield', '%', 0, 100, 'dial', 'Structure', 15, 0),
		channel('reactor', 'Reactor', 'GW', 0, 12, 'dial', 'Power', 25, 0.4, 11),
		channel('battery', 'Battery', '%', 0, 100, 'bar', 'Power', 120, 2),
		channel('oxygen', 'Oxygen', '%', 15, 25, 'bar', 'Life', 80, 1, null),
		channel('pressure', 'Cabin', 'kPa', 90, 110, 'number', 'Life', 60, 0.2),
		channel('cabin', 'Cabin temperature', '°C', 15, 30, 'bar', 'Life', 70, 2.1, 27),
		channel('velocity', 'Velocity', 'km/s', 6, 12, 'number', 'Flight', 300, 0),
		channel('altitude', 'Altitude', 'km', 380, 430, 'spark', 'Flight', 90, 0),
		channel('radiation', 'Radiation', 'mSv', 0, 1, 'spark', 'Flight', 7, 1),
		channel('comms', 'Comms', '', 0, 1, 'signal', 'Flight', 25, 0),
		channel('docking', 'Docking', '', 0, 1, 'lamp', 'Flight', 120, 0)
	];
	var k;

	var corners = ['Front left', 'Front right', 'Rear left', 'Rear right'];

	for (k = 1; k <= 4; k++) {
		car.push(
			channel('tyre' + k, corners[k - 1] + ' tyre', '°C', 60, 130, 'bar', 'Tyres', 20 + k * 3, k, 115),
			channel('pressure' + k, corners[k - 1] + ' pressure', 'bar', 1.6, 2.2, 'number', 'Tyres', 40 + k, k),
			channel('brake' + k, corners[k - 1] + ' brake', '°C', 200, 1000, 'bar', 'Brakes', 4 + k / 2, k, 900),
			channel('ride' + k, corners[k - 1] + ' ride', 'mm', 10, 60, 'spark', 'Suspension', 1.5 + k / 4, k)
		);
	}

	for (k = 1; k <= 3; k++) {
		car.push(channel('sector' + k, 'Sector ' + k, 's', 25, 32, 'number', 'Timing', 90, k));
	}

	car.push(channel('delta', 'Delta', 's', -1, 1, 'spark', 'Timing', 12, 0), channel('position', 'Position', '', 1, 20, 'number', 'Timing', 300, 0));

	for (k = 1; k <= 12; k++) {
		ship.push(channel('thruster' + k, 'Thruster ' + k, '%', 0, 100, 'bar', 'Thrusters', 5 + k, k));
	}

	for (k = 1; k <= 6; k++) {
		ship.push(
			channel('cell' + k, 'Cell ' + k, '%', 0, 100, 'bar', 'Cells', 40 + k * 7, k, null),
			channel('bay' + k, 'Bay ' + k, '°C', -20, 40, 'number', 'Bays', 30 + k * 5, k)
		);
	}

	for (k = 1; k <= 24; k++) {
		cluster.push(
			channel('cpu' + k, 'Node ' + k, '%', 0, 100, 'bar', 'CPU', 7 + k % 5, k, 92),
			channel('up' + k, 'Node ' + k, '', 0, 1, 'lamp', 'Nodes', 30 + k, k)
		);
	}

	cluster.push(
		channel('requests', 'Requests', '/s', 0, 50000, 'dial', 'Traffic', 30, 0),
		channel('errors', 'Errors', '/s', 0, 50, 'spark', 'Traffic', 5, 1),
		channel('netin', 'Network in', 'Gb/s', 0, 40, 'spark', 'Traffic', 11, 0),
		channel('netout', 'Network out', 'Gb/s', 0, 40, 'spark', 'Traffic', 13, 2),
		channel('p50', 'Latency p50', 'ms', 5, 40, 'number', 'Latency', 20, 0),
		channel('p99', 'Latency p99', 'ms', 40, 400, 'number', 'Latency', 17, 1, 350),
		channel('memory', 'Memory', '%', 0, 100, 'dial', 'Capacity', 90, 0.7, 90),
		channel('disk', 'Disk', '%', 0, 100, 'bar', 'Capacity', 500, 0),
		channel('eu', 'Europe', '', 0, 1, 'signal', 'Regions', 40, 0),
		channel('us', 'America', '', 0, 1, 'signal', 'Regions', 35, 1),
		channel('asia', 'Asia', '', 0, 1, 'signal', 'Regions', 45, 2),
		channel('failover', 'Failover', '', 0, 1, 'lamp', 'Regions', 70, 0)
	);

	return {car: car, cluster: cluster, ship: ship};
}

var Scenes = scenes();

/* The value of a channel at a moment: a wave between Min and Max, a little noise; a lamp is on in a part of its wave. */
function value (item, time) {
	var wave = Math.sin(time * 2 * Math.PI / item.Period + item.Phase);
	var noise = Math.sin(time * 37.7 + item.Phase * 13) * 0.04;
	var part = Math.max(0, Math.min(1, 0.5 + wave * 0.45 + noise));

	if (item.Kind === 'lamp')
		return wave > 0.6 ? 1 : 0;

	if (item.Kind === 'signal')
		return Math.round(part * 100) / 100;

	if (item.ID === 'gear')
		return Math.max(1, Math.min(8, Math.round(1 + part * 7)));

	return Math.round((item.Min + part * (item.Max - item.Min)) * 10) / 10;
}

function send (connection, message) {
	connection.Send(JSON.stringify(message));
}

/* A packet of a connection: the values of its scene now. */
function packet (connection) {
	var now = Date.now() / 1000;
	var values = {};

	Scenes[connection.Scene].forEach(function (item) {
		values[item.ID] = value(item, now);
	});

	connection.Seq += 1;

	send(connection, {Type: 'data', Seq: connection.Seq, Time: Date.now(), Values: values});
}

/*
 * The packets of a connection, at its rate: by the clock, not by the interval of the timer (a timer of the system may
 * tick every 15 milliseconds or so), the packets due since the start go at each tick.
 */
function start (connection) {
	var began = Date.now();
	var sent = 0;

	clearInterval(connection.Timer);

	connection.Timer = setInterval(function () {
		var due = Math.floor((Date.now() - began) * connection.Hz / 1000);

		while (sent < due) {
			packet(connection);

			sent++;
		}
	}, 5);
}

module.exports = {
	Application: 'Telemetry',
	Entry: 'app.js',
	Index: 'index.html',
	Output: 'dist',
	Server: {
		DevelopmentPort: 4337,
		ProductionPort: 4338,

		WebSocket: {
			Path: '/feed',

			Open: function (connection) {
				connection.Scene = 'car';
				connection.Hz = 20;
				connection.Seq = 0;

				send(connection, {Type: 'channels', Scene: connection.Scene, Channels: Scenes[connection.Scene]});

				start(connection);
			},

			Message: function (connection, text) {
				var message;

				try {
					message = JSON.parse(text);
				}
				catch (error) {
					return;
				}

				if (message.Type === 'scene' && Scenes[message.Scene]) {
					connection.Scene = message.Scene;

					send(connection, {Type: 'channels', Scene: connection.Scene, Channels: Scenes[connection.Scene]});
				}

				if (message.Type === 'rate')
					connection.Hz = Math.max(1, Math.min(120, Math.round(Number(message.Hz) || 20)));

				start(connection);
			},

			Close: function (connection) {
				clearInterval(connection.Timer);
			}
		}
	}
};
