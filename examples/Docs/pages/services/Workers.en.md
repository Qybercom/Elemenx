<!-- generated -->
# Workers

Work of the Services of the library off the main thread: workers made of the very source of their methods, with no file of their own to load, so that a long work holds no frame up.

- Pool(name, services, size) returns the workers of a name, made once: services {Service: [members]} names what of each Service they carry (a Service gives the source of its members by its method Source(names)); size how many (by the cores of the device, 1 to 4). Its methods: Run(service, method, args, callback(error, result)) (the method of the Service in a worker, on the data of args; the lists of numbers of the result come back as they are, Float32Array or Uint32Array, moved, not copied), Share(key, data) (data each worker keeps under a key, sent to each once: a method in a worker reads it by this.$Shared(key); the runs that follow see it), Waiting() (how many runs are not done), Inline() (true with no worker: the runs go at once in the page, as in Node; Share keeps nothing) and Destroy().
- Source(owner, names): the members of an object as the text of an object, its functions as they are written; what a Service gives by its method Source. A function of it may use only its arguments, this and what a worker has.

In a worker, this.$Service(name) of a member is what the pool carries of that Service.

## Methods

- `Source(owner, names)`
- `Pool(name, services, size)`

## Tests

- [Workers runs the methods of Services in workers made of their source, and in the page when it cannot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4169) — `tests/regression/library-scene.test.js`
- [shares data with every worker once: the runs that follow read it, and the next share takes its place](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Workers/Workers.test.js#L49) — `libraries/ElemenxCommon/services/Workers/Workers.test.js`
- [runs a method in the page with its Service as this when there is no worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Workers/Workers.test.js#L73) — `libraries/ElemenxCommon/services/Workers/Workers.test.js`
