/*
 * Work of the Services of the library off the main thread: workers made of the very source of their methods, with no
 * file of their own to load, so that a long work holds no frame up.
 * - Pool(name, services, size) returns the workers of a name, made once: services {Service: [members] or true} names
 *   what of each Service they carry, true for all of it (Members); a Service gives the source of its members by its
 *   method Source(names); size how many
 *   (by the cores of the device, 1 to 4). Its methods: Run(service, method, args, callback(error, result)) (the
 *   method of the Service in a worker, on the data of args; the lists of numbers of the result come back as they
 *   are, Float32Array or Uint32Array, moved, not copied), Share(key, data) (data each worker keeps under a key, sent to
 *   each once: a method in a worker reads it by this.$Shared(key); the runs that follow see it), Waiting() (how many runs
 *   are not done), Inline() (true with no worker: the runs go at once in the page, as in Node; Share keeps nothing) and
 *   Destroy().
 * - Source(owner, names): the members of an object as the text of an object, its functions as they are written; what a
 *   Service gives by its method Source. A function of it may use only its arguments, this and what a worker has. names
 *   true: the Members of the object.
 * - Members(owner): what a worker carries of a Service told whole: every method of it (not the $ ones) and the data it
 *   names in its list Carried (its tables; not the caches it fills as it runs). Regression: the lists of the members
 *   were written by hand in each pool and drifted apart (a method of one pool was missing in the next).
 * In a worker, this.$Service(name) of a member is what the pool carries of that Service.
 */
Elemenx.Service('Workers', {
	$Meta: {
		Description: 'Work of the Services of the library off the main thread: workers made of the source of their methods.',
		Methods: ['Pool(name, services, size)', 'Source(owner, names)', 'Members(owner)']
	},

	Source: function (owner, names) {
		function text (value) {
			if (typeof value === 'function') return value.toString();

			if (value && typeof value === 'object' && !Array.isArray(value)) {
				return '{' + Object.keys(value).map(function (key) {
					return JSON.stringify(key) + ': ' + text(value[key]);
				}).join(',\n') + '}';
			}

			return JSON.stringify(value === undefined ? null : value);
		}

		return '{' + (names === true ? this.Members(owner) : names).map(function (name) {
			return JSON.stringify(name) + ': ' + text(owner[name]);
		}).join(',\n') + '}';
	},

	Members: function (owner) {
		var carried = Array.isArray(owner.Carried) ? owner.Carried : [];

		return Object.keys(owner).filter(function (name) {
			return name.charAt(0) !== '$' && typeof owner[name] === 'function';
		}).concat(carried.filter(function (name) {
			return owner[name] !== undefined;
		}));
	},

	Pool: function (name, services, size) {
		var self = this;
		var pools = this.Pools = this.Pools || {};
		var count = Math.max(1, Math.min(4, Number(size) || (typeof navigator !== 'undefined' && navigator.hardwareConcurrency || 2) - 1));
		var workers = [];
		var jobs = {};
		var next = 0;
		var inline = typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL;
		var pool;

		if (pools[name])
			return pools[name];

		/* What a worker runs: the members it carries, each Service knowing the others, and the answer to a run. */
		function source () {
			return 'var services = {' + Object.keys(services).map(function (service) {
				return JSON.stringify(service) + ': ' + self.$Service(service).Source(services[service]);
			}).join(',\n') + '};\n'
				+ 'var shared = {};\n'
				+ 'Object.keys(services).forEach(function (name) { services[name].$Service = function (other) { return services[other]; }; services[name].$Shared = function (key) { return shared[key]; }; });\n'
				+ 'function moved (value, list) {\n'
				+ '	if (value && value.buffer instanceof ArrayBuffer) { if (list.indexOf(value.buffer) === -1) list.push(value.buffer); return list; }\n'
				+ '	if (value && typeof value === \'object\') Object.keys(value).forEach(function (key) { moved(value[key], list); });\n'
				+ '	return list;\n'
				+ '}\n'
				+ 'onmessage = function (event) {\n'
				+ '	var job = event.data;\n'
				+ '	var result;\n'
				+ '	if (job.Share !== undefined) { shared[job.Share] = job.Data; return; }\n'
				+ '	try { result = services[job.Service][job.Method].apply(services[job.Service], job.Args); }\n'
				+ '	catch (error) { postMessage({ID: job.ID, Error: String(error && error.message || error)}); return; }\n'
				+ '	postMessage({ID: job.ID, Result: result}, moved(result, []));\n'
				+ '};\n';
		}

		/* A run in the page: what a pool does with no worker, or when its workers failed; the Service is this of its method. */
		function here (job) {
			var service = self.$Service(job.Service);
			var result;

			try {
				result = service[job.Method].apply(service, job.Args);
			}
			catch (error) {
				job.Callback(error);

				return;
			}

			job.Callback(null, result);
		}

		/* Workers that cannot run (a page that forbids them) leave their runs to the page. */
		function fail () {
			inline = true;

			workers.forEach(function (worker) {
				worker.terminate();
			});

			workers = [];

			Object.keys(jobs).forEach(function (id) {
				var job = jobs[id];

				delete jobs[id];

				here(job);
			});
		}

		function answer (event) {
			var data = event.data;
			var job = jobs[data.ID];
			if (!job) return;

			delete jobs[data.ID];

			job.Worker.Waiting--;

			if (data.Error !== undefined) job.Callback(new Error(data.Error));
			else job.Callback(null, data.Result);
		}

		if (!inline) {
			try {
				var url = URL.createObjectURL(new Blob([source()], {type: 'application/javascript'}));

				for (var i = 0; i < count; i++) {
					var worker = new Worker(url);

					worker.Waiting = 0;
					worker.onmessage = answer;
					worker.onerror = fail;

					workers.push(worker);
				}

				URL.revokeObjectURL(url);
			}
			catch (error) {
				fail();
			}
		}

		pool = {
			Run: function (service, method, args, callback) {
				var job = {ID: ++next, Service: service, Method: method, Args: args || [], Callback: callback || function () {}};
				var worker;

				if (inline) {
					here(job);

					return;
				}

				worker = workers.reduce(function (best, each) {
					return each.Waiting < best.Waiting ? each : best;
				});

				job.Worker = worker;
				jobs[job.ID] = job;
				worker.Waiting++;

				worker.postMessage({ID: job.ID, Service: service, Method: method, Args: job.Args});
			},

			/* Data every worker keeps under a name, sent to each once: what the runs of a while share (the field of a ground). */
			Share: function (key, data) {
				if (inline) return;

				workers.forEach(function (worker) {
					worker.postMessage({Share: key, Data: data});
				});
			},

			Waiting: function () {
				return Object.keys(jobs).length;
			},

			Inline: function () {
				return inline;
			},

			Destroy: function () {
				workers.forEach(function (worker) {
					worker.terminate();
				});

				workers = [];
				jobs = {};

				delete pools[name];
			}
		};

		pools[name] = pool;

		return pool;
	}
});
