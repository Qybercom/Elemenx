<!-- generated -->
# Workers

Work of the Services of the library off the main thread: workers made of the very source of their methods, with no file of their own to load, so that a long work holds no frame up.

- Pool(name, services, size) returns the workers of a name, made once: services {Service: [members] or true} names what of each Service they carry, true for all of it (Members); a Service gives the source of its members by its method Source(names); size how many (by the cores of the device, 1 to 4). Its methods: Run(service, method, args, callback(error, result)) (the method of the Service in a worker, on the data of args; the lists of numbers of the result come back as they are, Float32Array or Uint32Array, moved, not copied), Share(key, data) (data each worker keeps under a key, sent to each once: a method in a worker reads it by this.$Shared(key); the runs that follow see it), Waiting() (how many runs are not done), Inline() (true with no worker: the runs go at once in the page, as in Node; Share keeps nothing) and Destroy().
- Source(owner, names): the members of an object as the text of an object, its functions as they are written; what a Service gives by its method Source. A function of it may use only its arguments, this and what a worker has. names true: the Members of the object.
- Members(owner): what a worker carries of a Service told whole: every method of it (not the $ ones) and the data it names in its list Carried (its tables; not the caches it fills as it runs). Regression: the lists of the members were written by hand in each pool and drifted apart (a method of one pool was missing in the next).

In a worker, this.$Service(name) of a member is what the pool carries of that Service.

## Methods

- `Source(owner, names)`
- `Members(owner)`
- `Pool(name, services, size)`

## Tests

- [Workers runs the methods of Services in workers made of their source, and in the page when it cannot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4630) — `tests/regression/library-scene.test.js`
- [shares data with every worker once: the runs that follow read it, and the next share takes its place](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Workers/Workers.test.js#L49) — `libraries/ElemenxCommon/services/Workers/Workers.test.js`
- [runs a method in the page with its Service as this when there is no worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Workers/Workers.test.js#L73) — `libraries/ElemenxCommon/services/Workers/Workers.test.js`
- [carries a Service told whole: every method of it and the data of its list Carried, not the caches it fills](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Workers/Workers.test.js#L99) — `libraries/ElemenxCommon/services/Workers/Workers.test.js`
