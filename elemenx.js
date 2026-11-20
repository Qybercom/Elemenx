/*
 * Elemenx: a self-contained ES5 browser UI framework in one file.
 * Code style: docs/CODE-STYLE.md. Shared private state: docs/RUNTIME-INTERNALS.md.
 *
 * Every section starts with a one-line header comment holding its name: search for "/* Router" to jump to Router.
 * Large sections have sub-headers "Section: part", for example "/* Network: WebRTC".
 *
 * Sections, top to bottom:
 *   Runtime                  private state shared by all modules through the Runtime object
 *   Utilities                small helpers shared by every module (Own, Assign, AbsoluteURL, CurrentScriptURL, DefinitionURL, OwnerRegistry, EventList, Countdown, MessageListeners, Report, Notify, Invoke)
 *   Identity                 Elemenx.RuntimeID, StartedAt, Title
 *   Outlet                   render slot that swaps one component for another
 *   Reactive                 reactive state: proxies, dependency tracking, effects, batching
 *   Bundle                   Elemenx.Bundle: production bundle registry, resolved before Discovery
 *   Resource                 Elemenx.Resource: files embedded by a bundle, fetched otherwise
 *   Resources                Elemenx.Resources: groups of named data ($Resources of Libraries and Applications), read at once
 *   Locale                   Elemenx.Locale: phrases by key in the language of the page, $T of the templates
 *   Style                    Elemenx.Style: the stylesheets of the document and of the shadow roots of Applications
 *   Discovery                development loading of index.js graphs and entity scripts
 *   Library                  Elemenx.Library and the Application $Use declaration
 *   Service and Guard        Elemenx.Service, Elemenx.Guard and Application-owned service instances
 *   Router ownership         which Router a component belongs to
 *   Directive registry       directive metadata and the built-in if, for, key, outlet, pending, error
 *   Event sources            Elemenx.EventSource: the givers of the events of the templates no element gives by itself
 *   Template and Component   Elemenx.Template, Elemenx.Directive, Elemenx.Component, Elemenx.Instance: compiler, bindings, factory
 *   Meta                     Elemenx.Meta: what Components, Services and Directives declare of themselves ($Meta)
 *   Defined                  Elemenx.Defined: what a name is defined as, and waiting for a definition to come
 *   Router                   Elemenx.Router: routes, guards, browser history
 *   Structural               structural hosts: conditional and collection mounting, deferred children
 *   Cache                    Elemenx.Cache: unloading idle component definitions, sleeping instances (keep-alive)
 *   Network                  Elemenx.Network: XHR, Stream, LongPolling, SSE, Transfer, WebSocket, WebRTC, Metrics, Context
 *   Storage                  Elemenx.Storage: Local, Session, Cookie, IndexedDB, Context
 *   Events                   Elemenx.Events and Elemenx.Pipe
 *   Messaging                Elemenx.Messaging: channels, Window bridges, BroadcastChannel discovery
 *   WebWorker                Elemenx.WebWorker
 *   ServiceWorker            Elemenx.ServiceWorker
 *   Hardware                 Elemenx.Hardware: Serial (Web Serial), USB (WebUSB), Firmware; $Hardware of an owner
 *   Ether                    Elemenx.Ether: data of the whole page by slices, read straight, heard once a frame; $Ether of an owner
 *   Owner resources          wiring and release of the facades owned by Services, Components and Applications
 *   Install                  Elemenx.Install: the page as an application of the system (PWA), its prompt and worker
 *   Widgets                  Elemenx.Widgets: Components of an Application mounted on a page of another site
 *   Splash                   Elemenx.Splash: the splash of the page, gone when the first Application is ready
 *   Motion                   the endless animations of Elemenx rest while their element is out of the viewport
 *   Compilers                Elemenx.Compilers: transitions of kinds of code, the IR between them, text languages as data (js, cpp)
 *   SSR                      pages rendered on a server: the state of their Components ($OnSSR), their markup replaced
 *   Application              Elemenx.Application: ownership, mounting, startup lifecycle
 *   Export                   Elemenx.Version, Elemenx.NoConflict; the window gets this copy, an isolated build keeps it
 *   ServiceWorker bootstrap  runs inside a service worker started by Elemenx.ServiceWorker
 */
(function () {
	/*
	 * Elemenx: the namespace of this copy of the framework. The window gets it last (see Export), unless a copy of the
	 * same version is there already: then this one stops here and the page keeps the first.
	 */
	var Version = '0.12.7';
	var Elemenx = {};
	if (typeof ElemenxIsolated !== 'object' && (typeof globalThis !== 'undefined' ? globalThis : self).Elemenx && (typeof globalThis !== 'undefined' ? globalThis : self).Elemenx.Version === Version) return;

	/* Runtime */
	var Runtime = {};

	/*
	 * An isolated build (a widget on a page of its own) keeps the html element of the page as it is.
	 */
	Runtime.Isolated = typeof ElemenxIsolated === 'object' && !!ElemenxIsolated;

	/*
	 * The hosts of the Applications that render in a shadow root: they take the lang and dir of Elemenx.Locale.
	 */
	Runtime.ShadowHosts = [];

	/*
	 * The URL the workers load the framework from; a framework inline in its page (a single-file build) gives them a
	 * copy of its text.
	 */
	Runtime.ScriptURL = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src || (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(new Blob([document.currentScript.textContent], {type: 'application/javascript'})) : null) : null;
	Runtime.HasDOM = typeof document !== 'undefined';
	Runtime.StartedAt = new Date();

	/* Utilities */
	(function (global) {
		'use strict';

		Runtime.Own = function (object, key) {
			return Object.prototype.hasOwnProperty.call(object, key);
		};

		/*
		 * Reports an exception as an uncaught error, like the DOM does for an exception thrown by an event listener:
		 * reportError dispatches the error event at once, so a handler that calls preventDefault() keeps it out of the console.
		 * Without reportError the exception is rethrown from a timer.
		 */
		Runtime.Report = function (exception) {
			if (typeof global.reportError === 'function') {
				global.reportError(exception);

				return;
			}

			setTimeout(function () {
				throw exception;
			}, 0);
		};

		/*
		 * Calls one event listener in isolation: an exception it throws is reported, and the dispatch
		 * (the next listeners and the code that emitted the event) continues.
		 */
		Runtime.Notify = function (listener, self, args) {
			try {
				listener.apply(self, args);
			}
			catch (exception) {
				Runtime.Report(exception);
			}
		};

		/* Calls a callback (error, value) from inside a promise handler, so an exception it throws is reported, not swallowed. */
		Runtime.Invoke = function (callback, error, value) {
			try {
				if (error) callback(error);
				else callback(null, value);
			}
			catch (exception) {
				Runtime.Report(exception);
			}
		};

		/*
		 * The base of the relative URLs of the document: its address, or for an address that is no base (a page of a blob:
		 * or about: URL, as a frame a script made) the base of the document, else the root of its origin, else file:///.
		 */
		Runtime.BaseURL = function () {
			var candidates = [global.location.href, global.document && global.document.baseURI, global.location.origin + '/'];

			function base (url) {
				try {
					return !!url && !!new URL('x', url).href;
				}
				catch (error) {
					return false;
				}
			}

			return candidates.filter(base)[0] || 'file:///';
		};

		/* Resolves a URL against the document; outside a document (in a worker) the value is kept as it is. */
		Runtime.AbsoluteURL = function (url) {
			if (!Runtime.HasDOM) return String(url);

			return new URL(String(url), Runtime.BaseURL()).href;
		};

		/* The URL of the script being executed, without query and hash: the base of the relative paths of its definitions. */
		Runtime.CurrentScriptURL = function () {
			var script = Runtime.HasDOM ? global.document.currentScript : null;

			return script && script.src ? script.src.split('?')[0].split('#')[0] : null;
		};

		/* Resolves a relative path of a definition against $DefinitionURL; absolute and root paths are kept as they are. */
		Runtime.DefinitionURL = function (definition, url) {
			if (!url || !definition.$DefinitionURL || /^(?:[a-z]+:)?\/\//i.test(url) || url.charAt(0) === '/') return url;

			return definition.$DefinitionURL.substring(0, definition.$DefinitionURL.lastIndexOf('/') + 1) + url.replace(/^\.\//, '');
		};

		/*
		 * Resources created on behalf of an owner (a Service, Component or Application). They leave the registry when
		 * they are destroyed themselves, and the rest is destroyed with the owner. A destroyed owner cannot get new ones.
		 */
		Runtime.OwnerRegistry = function () {
			var owners = new WeakMap();
			var destroyed = new WeakSet();

			return {
				Add: function (owner, resource) {
					var list;

					if (!owner) return;

					list = owners.get(owner);

					if (!list) {
						list = [];

						owners.set(owner, list);
					}

					list.push(resource);
				},
				Remove: function (owner, resource) {
					var list = owner ? owners.get(owner) : null;
					var index;

					if (!list) return;

					index = list.indexOf(resource);

					if (index !== -1)
						list.splice(index, 1);
				},
				Destroyed: function (owner) {
					return !!owner && destroyed.has(owner);
				},
				Destroy: function (owner) {
					var list;

					if (!owner || destroyed.has(owner)) return;

					destroyed.add(owner);

					list = owners.get(owner);

					if (!list) return;

					while (list.length)
						list[0].Destroy();

					owners.delete(owner);
				}
			};
		};

		/* Listeners of the named events of one object. Emit calls each of them in isolation (see Notify) with one shared event. */
		Runtime.EventList = function () {
			var listeners = {};

			return {
				Add: function (name, callback) {
					if (!listeners[name])
						listeners[name] = [];

					listeners[name].push(callback);
				},
				Remove: function (name, callback) {
					var list = listeners[name];
					var index;

					if (!list) return;

					index = list.indexOf(callback);

					if (index !== -1)
						list.splice(index, 1);
				},
				Emit: function (name, event) {
					var copy = (listeners[name] || []).slice();
					var i = 0;

					while (i < copy.length) {
						Runtime.Notify(copy[i], undefined, [event]);

						i++;
					}
				},
				Clear: function () {
					listeners = {};
				}
			};
		};

		/* Waits for count asynchronous steps: callback (error) on the first failure, or callback (null) once all succeeded. */
		Runtime.Countdown = function (count, callback) {
			var remaining = count;
			var failed = false;

			return function (error) {
				if (failed) return;

				if (error) {
					failed = true;

					callback(error);

					return;
				}

				remaining--;

				if (!remaining)
					callback(null);
			};
		};

		/* Listeners of the global message event added through a wrapper, removable by their own callback. */
		Runtime.MessageListeners = function () {
			var handlers = [];

			return {
				Add: function (callback, wrapper) {
					handlers.push({Callback: callback, Wrapper: wrapper});

					global.addEventListener('message', wrapper);
				},
				Remove: function (callback) {
					var i = handlers.length - 1;

					while (i >= 0) {
						if (handlers[i].Callback === callback) {
							global.removeEventListener('message', handlers[i].Wrapper);

							handlers.splice(i, 1);
						}

						i--;
					}
				}
			};
		};

		/*
		 * The own key of source that is key in another case (the attributes of a template come in lower case: value is
		 * Value), or null when none is, or more than one. Of a value and a method of the same letters (FPS and Fps), the
		 * value is the one: a prop is never a method. The names of an object are kept by its lower case once, and read
		 * again when it has another count of keys: a definition is read so at every render of its tags.
		 */
		var caseNames = new WeakMap();

		Runtime.CaseName = function (source, key) {
			var count = Object.keys(source).length;
			var entry = caseNames.get(source);
			var found = {};
			var lower;
			var name;

			if (!entry || entry.Count !== count) {
				entry = {Count: count, Names: {}};

				for (name in source) {
					if (!Runtime.Own(source, name)) continue;

					lower = name.toLowerCase();
					found[lower] = found[lower] || {Values: [], Methods: []};

					found[lower][typeof source[name] === 'function' ? 'Methods' : 'Values'].push(name);
				}

				/* Two values (or two methods and no value) of the same letters: none of them is chosen. */
				for (lower in found) {
					if (!Runtime.Own(found, lower)) continue;

					if (found[lower].Values.length) entry.Names[lower] = found[lower].Values.length === 1 ? found[lower].Values[0] : null;
					else entry.Names[lower] = found[lower].Methods.length === 1 ? found[lower].Methods[0] : null;
				}

				caseNames.set(source, entry);
			}

			lower = String(key).toLowerCase();

			return Runtime.Own(entry.Names, lower) ? entry.Names[lower] : null;
		};

		/* Copies the own enumerable properties of source into target and returns target. */
		Runtime.Assign = function (target, source) {
			var key;

			for (key in source) {
				if (Runtime.Own(source, key))
					target[key] = source[key];
			}

			return target;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Identity */
	(function (global) {
		'use strict';

		var runtimeID = null;

		function RuntimeID () {
			if (runtimeID)
				return runtimeID;

			var crypto = global.crypto;
			var result = '';
			var values;
			var i;

			if (crypto && typeof crypto.getRandomValues === 'function' && typeof Uint32Array !== 'undefined') {
				values = new Uint32Array(4);

				crypto.getRandomValues(values);

				i = 0;
				while (i < values.length) {
					result += (values[i] + 0x100000000).toString(16).slice(1);

					i++;
				}
			}
			else {
				result = Date.now().toString(16) + '-' + Math.floor(Math.random() * 0x100000000).toString(16);
			}

			runtimeID = 'runtime-' + result;

			return runtimeID;
		}

		Elemenx.RuntimeID = RuntimeID;
		Elemenx.StartedAt = function () {
			return new Date(Runtime.StartedAt.getTime());
		};

		/* The listeners of the title and of the icon of the page: a native program follows them (the Platform Service). */
		var headListeners = {Title: [], Icon: []};

		function headListen (kind, callback, on) {
			var list = headListeners[kind];
			var index = list.indexOf(callback);

			if (typeof callback !== 'function')
				throw new Error('Elemenx.' + kind + '.' + (on ? 'OnChange' : 'OffChange') + ' expects a function');

			if (on && index === -1)
				list.push(callback);

			if (!on && index !== -1)
				list.splice(index, 1);
		}

		function headChanged (kind, value) {
			headListeners[kind].slice().forEach(function (callback) {
				Runtime.Notify(callback, null, [value]);
			});
		}

		Elemenx.Title = function (value) {
			if (!Runtime.HasDOM)
				return arguments.length ? Elemenx : '';

			if (!arguments.length)
				return global.document.title;

			var text = value == null ? '' : String(value);

			if (global.document.title !== text) {
				global.document.title = text;

				headChanged('Title', text);
			}

			return Elemenx;
		};

		Elemenx.Title.OnChange = function (callback) {
			headListen('Title', callback, true);

			return Elemenx;
		};

		Elemenx.Title.OffChange = function (callback) {
			headListen('Title', callback, false);

			return Elemenx;
		};

		/*
		 * The icon of the page (its favicon): a URL, the text of an SVG, a data URL, or {Light, Dark} (the browser takes
		 * the one of the scheme of the system); null brings back the icons the page named. Without a value, the icon given
		 * last (null for those of the page).
		 */
		var pageIcons = null;
		var currentIcon = null;

		function iconURL (icon) {
			var text = String(icon).trim();

			return /^<svg[\s>]/i.test(text) || /^<\?xml/i.test(text) ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text) : text;
		}

		function iconKey (icon) {
			return icon && typeof icon === 'object' ? JSON.stringify({Light: icon.Light || null, Dark: icon.Dark || null}) : icon == null ? '' : String(icon);
		}

		Elemenx.Icon = function (value) {
			var head;
			var links;

			if (!arguments.length) return currentIcon;

			if (!Runtime.HasDOM || iconKey(value) === iconKey(currentIcon)) return Elemenx;

			head = global.document.head;
			links = Array.prototype.slice.call(head.querySelectorAll('link[rel~="icon"]'));

			/*
			 * The icons the page named (one it adds later too), kept to bring them back; while they show, one the page took
			 * away itself is forgotten.
			 */
			pageIcons = (pageIcons || []).filter(function (link) {
				return currentIcon !== null || link.parentNode === head;
			});

			links.forEach(function (link) {
				if (!link.hasAttribute('data-elemenx-icon') && pageIcons.indexOf(link) === -1)
					pageIcons.push(link);
			});

			links.forEach(function (link) {
				if (link.parentNode)
					link.parentNode.removeChild(link);
			});

			currentIcon = value == null || value === '' ? null : value;

			if (currentIcon === null) {
				pageIcons.forEach(function (link) {
					head.appendChild(link);
				});
			}
			else {
				/* {Light, Dark}: one link for each scheme; one of them alone is the icon of both. */
				(typeof currentIcon !== 'object' ? [[currentIcon, null]] : currentIcon.Light && currentIcon.Dark ? [[currentIcon.Light, '(prefers-color-scheme: light)'], [currentIcon.Dark, '(prefers-color-scheme: dark)']] : [[currentIcon.Light || currentIcon.Dark, null]]).forEach(function (pair) {
					var link;

					if (!pair[0]) return;

					link = global.document.createElement('link');
					link.rel = 'icon';
					link.href = iconURL(pair[0]);

					link.setAttribute('data-elemenx-icon', '');

					if (pair[1])
						link.media = pair[1];

					head.appendChild(link);
				});
			}

			headChanged('Icon', currentIcon);

			return Elemenx;
		};

		Elemenx.Icon.OnChange = function (callback) {
			headListen('Icon', callback, true);

			return Elemenx;
		};

		Elemenx.Icon.OffChange = function (callback) {
			headListen('Icon', callback, false);

			return Elemenx;
		};

		RuntimeID();
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Outlet */
	(function (global) {
		'use strict';


		function Outlet (element) {
			var current = null;

			function Render (component) {
				if (current === component) return component;

				if (current && current.$Destroy) {
					current.$Destroy();
				}
				else {
					while (element.firstChild)
						element.removeChild(element.firstChild);
				}

				current = component || null;

				if (current)
					element.appendChild(current.$Element ? current.$Element() : current);

				return current;
			}

			function Clear () {
				Render(null);
			}

			/* Takes the component out of the outlet without destroying it: a page of the Router that goes to sleep. */
			function Release () {
				var released = current;
				var node = released && released.$Element ? released.$Element() : released;
				if (node && node.parentNode === element)
					element.removeChild(node);

				current = null;

				return released;
			}

			function Current () {
				return current;
			}

			function Destroy () {
				Clear();
			}

			return {
				Element: function () {
					return element;
				},
				Render: Render,
				Clear: Clear,
				Release: Release,
				Current: Current,
				Destroy: Destroy
			};
		}

		Runtime.Outlet = Outlet;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Reactive */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var targetMap = new WeakMap();
		var proxyCache = new WeakMap();
		var rawCache = new WeakMap();
		var activeConsumer = null;
		var consumerStack = [];
		var batchDepth = 0;
		var pending = new Set();
		var ITERATE = typeof Symbol === 'function' ? Symbol('Elemenx.iterate') : '__elemenx_iterate__';

		function reactiveTarget (value) {
			if (!value || typeof value !== 'object') return false;

			return Array.isArray(value)
				|| Object.getPrototypeOf(value) === Object.prototype
				|| Object.getPrototypeOf(value) === null;
		}

		function cleanup (consumer) {
			var i = 0;

			while (i < consumer.deps.length) {
				consumer.deps[i].delete(consumer);

				i++;
			}

			consumer.deps.length = 0;
		}

		function track (target, key) {
			var map;
			var dep;

			if (!activeConsumer) return;

			map = targetMap.get(target);

			if (!map) {
				map = new Map();

				targetMap.set(target, map);
			}

			dep = map.get(key);

			if (!dep) {
				dep = new Set();

				map.set(key, dep);
			}

			if (!dep.has(activeConsumer)) {
				dep.add(activeConsumer);

				activeConsumer.deps.push(dep);
			}
		}

		function queue (consumer) {
			if (batchDepth) {
				pending.add(consumer);
			}
			else {
				consumer.Run();
			}
		}

		function trigger (target, key) {
			var map = targetMap.get(target);
			if (!map) return;

			var dep = map.get(key);
			if (!dep) return;

			var copy = Array.from(dep);

			copy.forEach(queue);
		}

		function flush () {
			if (batchDepth || !pending.size) return;

			var copy = Array.from(pending);

			pending.clear();

			copy.forEach(function (consumer) {
				consumer.Run();
			});
		}

		function Batch (callback) {
			batchDepth++;

			try {
				return callback();
			}
			finally {
				batchDepth--;

				if (batchDepth < 0)
					batchDepth = 0;

				flush();
			}
		}

		function raw (value) {
			return rawCache.get(value) || value;
		}

		function wrap (value) {
			if (!reactiveTarget(value)) return value;

			/*
			 * A value that is a proxy already stays as it is: the items of a list copied from the state (Rows.slice())
			 * are proxies, and wrapped again at each assignment they would nest, each layer reading the one under it.
			 */
			if (rawCache.has(value)) return value;

			var proxy = proxyCache.get(value);
			if (proxy)
				return proxy;

			proxy = new Proxy(value, {
				get: function (target, key, receiver) {
					var result;

					if (key === '__raw__') return target;

					if (
						Array.isArray(target) &&
						(
							key === 'push' || key === 'pop' ||
							key === 'shift' || key === 'unshift' ||
							key === 'splice' || key === 'reverse' ||
							key === 'sort'
						)
					) {
						result = Reflect.get(target, key, receiver);

						return function () {
							var answer;
							var args = arguments;

							Batch(function () {
								answer = result.apply(receiver, args);
							});

							return answer;
						};
					}

					track(target, key);

					result = Reflect.get(target, key, receiver);

					return wrap(result);
				},

				set: function (target, key, value, receiver) {
					var next = raw(value);
					var had = own(target, key);
					var previous = target[key];
					var oldLength = Array.isArray(target) ? target.length : 0;
					var result = Reflect.set(target, key, next, receiver);
					var arrayIndex = Array.isArray(target) && key !== 'length' && String(+key) === String(key);

					if (!Object.is(previous, next)) {
						trigger(target, key);

						if (arrayIndex && target.length !== oldLength) {
							trigger(target, 'length');
						}

						/* A shorter array: what read its removed items ({{Items[1]}}) reads them again. */
						if (key === 'length' && Array.isArray(target) && target.length < oldLength) {
							var removed = target.length;

							while (removed < oldLength) {
								trigger(target, String(removed));

								removed++;
							}
						}

						if (Array.isArray(target)) {
							if (arrayIndex || key === 'length') {
								trigger(target, ITERATE);
							}
						}
						else if (!had) {
							trigger(target, ITERATE);
						}
					}

					return result;
				},

				/* 'Name' in Data reads whether the key is there: a key added or taken away runs it again. */
				has: function (target, key) {
					if (typeof key !== 'symbol')
						track(target, key);

					return Reflect.has(target, key);
				},

				/* Object.keys(Data), for...in: the keys of the object, read again when one comes or goes. */
				ownKeys: function (target) {
					track(target, Array.isArray(target) ? 'length' : ITERATE);

					return Reflect.ownKeys(target);
				},

				deleteProperty: function (target, key) {
					var had = own(target, key);
					var result = Reflect.deleteProperty(target, key);

					if (had && result) {
						trigger(target, key);
						trigger(target, ITERATE);
					}

					return result;
				}
			});

			proxyCache.set(value, proxy);
			rawCache.set(proxy, value);

			return proxy;
		}

		function Effect (callback, lazy) {
			var consumer = {
				deps: [],
				destroyed: false,

				Run: function () {
					if (consumer.destroyed) return;

					/* A bug: a write, while it ran, to what it had read ran it again inside itself, over its own run half done. It runs once more when it ends. */
					if (consumer.running) {
						consumer.again = true;

						return;
					}

					var result;
					var rounds = 0;

					consumer.running = true;

					try {
						do {
							consumer.again = false;

							cleanup(consumer);

							consumerStack.push(activeConsumer);

							activeConsumer = consumer;

							try {
								result = callback();
							}
							finally {
								activeConsumer = consumerStack.pop();
							}

							rounds++;
						} while (consumer.again && !consumer.destroyed && rounds < 100);
					}
					finally {
						consumer.running = false;
					}

					return result;
				},

				Destroy: function () {
					consumer.destroyed = true;

					cleanup(consumer);

					pending.delete(consumer);
				}
			};

			if (!lazy)
				consumer.Run();

			return consumer;
		}

		Runtime.Reactive = wrap;
		Runtime.Effect = Effect;
		Runtime.BatchReactive = Batch;
		Runtime.Untracked = function (callback) {
			var previousActive = activeConsumer;

			activeConsumer = null;

			try {
				return callback();
			}
			finally {
				activeConsumer = previousActive;
			}
		};

		Runtime.TrackIteration = function (value) {
			var target = raw(value);

			if (target && typeof target === 'object') {
				track(target, ITERATE);
			}

			return value;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Bundle */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var registry = {};
		var loaded = {};
		/* The entities the parts of a bundle carry, type to name to the URL of the part, and the parts being fetched. */
		var parts = {};
		var fetches = {};

		function bucket (type) {
			if (!registry[type])
				registry[type] = {};

			if (!loaded[type])
				loaded[type] = {};

			return registry[type];
		}

		function install (bundle) {
			var type;
			var name;
			var source;

			bundle = bundle || {};

			for (type in bundle) {
				if (!own(bundle, type)) continue;

				source = bundle[type] || {};

				bucket(type);

				for (name in source) {
					if (!own(source, name)) continue;

					if (typeof source[name] !== 'function')
						throw new Error('Elemenx Bundle entity loader must be a function: ' + type + ':' + name);

					registry[type][name] = source[name];
					loaded[type][name] = false;
				}
			}

			return Elemenx;
		}

		function resolvedName (type, name) {
			var source = registry[type];
			if (!source)
				return null;

			return own(source, name) ? name : null;
		}

		function load (type, name) {
			var resolved = resolvedName(type, name);
			var loader;

			if (!resolved) return false;
			if (loaded[type][resolved]) return true;

			loader = registry[type][resolved];
			loaded[type][resolved] = true;

			try {
				loader();
			}
			catch (error) {
				loaded[type][resolved] = false;

				throw error;
			}

			return true;
		}

		function loadType (type) {
			var source = registry[type] || {};
			var name;

			for (name in source) {
				if (own(source, name)) {
					load(type, name);
				}
			}
		}

		/*
		 * A part of a bundle: a script (url, from the script that names it) that brings the loaders of the entities it
		 * names, {Type: [names]}, fetched the first time one of them is wanted (a build split by its routes).
		 */
		function part (url, entities) {
			var target;
			var type;
			var i;

			if (typeof url !== 'string' || !url || !entities || typeof entities !== 'object')
				throw new Error('Elemenx.Bundle.Part expects a URL and {Type: [names]}');

			target = Runtime.HasDOM ? new URL(url, Runtime.CurrentScriptURL() || Runtime.BaseURL()).href : url;

			for (type in entities) {
				if (!own(entities, type)) continue;

				if (!Array.isArray(entities[type]))
					throw new Error('Elemenx.Bundle.Part expects a URL and {Type: [names]}');

				parts[type] = parts[type] || {};

				for (i = 0; i < entities[type].length; i++)
					parts[type][String(entities[type][i])] = target;
			}

			return Elemenx;
		}

		/* The URL of the part that carries an entity the bundles do not have yet; null when none does. */
		function deferred (type, name) {
			return !resolvedName(type, name) && parts[type] && own(parts[type], name) ? parts[type][name] : null;
		}

		/* Fetches the part of an entity (one script for all of its entities), then calls back with null or an error. */
		function fetchPart (type, name, callback) {
			var url = deferred(type, name);
			var script;

			function done (error) {
				var callbacks = fetches[url] || [];
				var i;

				delete fetches[url];

				for (i = 0; i < callbacks.length; i++)
					callbacks[i](error);
			}

			if (!url) {
				callback(resolvedName(type, name) ? null : new Error('Elemenx Bundle has no part of ' + type + ': ' + name));

				return;
			}

			if (fetches[url]) {
				fetches[url].push(callback);

				return;
			}

			fetches[url] = [callback];

			script = global.document.createElement('script');
			script.src = url;
			script.async = true;

			/* What the framework loaded itself: a page rendered for a server leaves it out (Elemenx.Render). */
			script.setAttribute('data-elemenx-loaded', '');

			script.onload = function () {
				done(deferred(type, name) ? new Error('Elemenx Bundle part did not bring ' + type + ': ' + name + ' (' + url + ')') : null);
			};

			script.onerror = function () {
				done(new Error('Elemenx Bundle part failed: ' + url));
			};

			(global.document.head || global.document.documentElement).appendChild(script);
		}

		Runtime.Bundle = {
			Install: install,
			Reload: function (type, name) {
				var resolved = resolvedName(type, name);
				if (!resolved) return false;

				loaded[type][resolved] = false;

				return load(type, resolved);
			},
			Ready: function () {
				var type;

				for (type in registry) {
					if (own(registry, type)) {
						return true;
					}
				}

				return false;
			},
			ResolvedName: resolvedName,

			/* The names of the entities of a type the bundles carry, those of their parts too. */
			Names: function (type) {
				var names = Object.keys(registry[type] || {});

				return names.concat(Object.keys(parts[type] || {}).filter(function (name) {
					return names.indexOf(name) === -1;
				}));
			},

			Load: load,
			LoadType: loadType,
			Deferred: deferred,
			Fetch: fetchPart
		};
		Elemenx.Bundle = install;
		Elemenx.Bundle.Part = part;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Resource */
	(function (global) {
		'use strict';

		var embedded = {};

		function key (url) {
			return Runtime.AbsoluteURL(url);
		}

		/*
		 * Elemenx.Resource(url, text) embeds the text of a file (a sprite, a data file) under its URL, so a bundle carries
		 * it and nothing is fetched; Elemenx.Resource(url) returns the embedded text, or null. Elemenx.Resource.Load(url,
		 * callback) calls back (error, text) with the embedded text, otherwise with the text fetched from the URL.
		 */
		function resource (url, text) {
			if (arguments.length === 2) {
				if (!url || typeof text !== 'string')
					throw new Error('Elemenx.Resource expects (url, text)');

				embedded[key(url)] = text;

				return text;
			}

			if (arguments.length !== 1 || !url)
				throw new Error('Elemenx.Resource expects (url) or (url, text)');

			return Object.prototype.hasOwnProperty.call(embedded, key(url)) ? embedded[key(url)] : null;
		}

		resource.Load = function (url, callback) {
			var text;
			var request;

			if (typeof callback !== 'function')
				throw new Error('Elemenx.Resource.Load expects (url, callback)');

			text = resource(url);

			if (text !== null) {
				callback(null, text);

				return;
			}

			if (typeof XMLHttpRequest === 'undefined') {
				callback(new Error('Elemenx Resource cannot load: ' + url));

				return;
			}

			request = new XMLHttpRequest();

			request.open('GET', url);

			request.onload = function () {
				if (request.status >= 200 && request.status < 300) callback(null, request.responseText);
				else callback(new Error('Elemenx Resource failed: ' + url + ' [' + request.status + ']'));
			};

			request.onerror = function () {
				callback(new Error('Elemenx Resource failed: ' + url));
			};

			request.send();
		};

		Elemenx.Resource = resource;

		/* The URLs of the files embedded, for the groups of resources that are folders. */
		Runtime.EmbeddedURLs = function () {
			return Object.keys(embedded);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Resources */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		/* group: {name: {Text, Application}}, the text of each kept to give a copy at each read. */
		var groups = {};

		function define (group, name, text, application) {
			/* What an Application defined stays: the Libraries of the next Application load after it. */
			var entries = groups[group] = groups[group] || {};
			if (!application && own(entries, name) && entries[name].Application) return;

			entries[name] = {Text: text, Application: !!application};
		}

		/*
		 * Elemenx.Resources(group): the names of the resources of a group (Blueprints, Data...), sorted.
		 * Elemenx.Resources(group, name): a copy of the data of one, or null. Elemenx.Resources(group, name, data) defines
		 * one in code (data: a value of JSON, or its text), in the place of one of the same name. A Library names its
		 * resources by its name (ElemenxGraphics/water); an Application that gives one of that name takes its place.
		 */
		function resources (group, name, data) {
			var entries;
			var text;

			if (!group || typeof group !== 'string' || arguments.length > 1 && (!name || typeof name !== 'string') || arguments.length > 3)
				throw new Error('Elemenx.Resources expects (group), (group, name) or (group, name, data)');

			entries = groups[group] || {};

			if (arguments.length === 1)
				return Object.keys(entries).sort();

			if (arguments.length === 2)
				return own(entries, name) ? JSON.parse(entries[name].Text) : null;

			text = typeof data === 'string' ? data : JSON.stringify(data);

			JSON.parse(text);

			define(group, name, text, true);

			return name;
		}

		/*
		 * Loads what $Resources names: {Group: folder or list}. A folder (a path, blueprints) takes every .json file under
		 * it that the graphs of the owner list or a bundle embeds, named by its path in the folder without .json; a list
		 * takes paths (named by the file without .json) or {Name, URL}. options: Resolve(path) (an absolute URL),
		 * Namespace (put before the names: the name of a Library; none for an Application), Files (the URLs its graphs
		 * list), Application (what it defines stays over what a Library defines). callback(error) once all are in.
		 */
		Runtime.LoadResources = function (spec, options, callback) {
			var jobs = [];
			var wrong = '';
			var done;

			function named (path) {
				return (options.Namespace ? options.Namespace + '/' : '') + path.replace(/\.json$/i, '');
			}

			Object.keys(spec || {}).forEach(function (group) {
				var value = spec[group];
				var folder;

				if (typeof value === 'string') {
					folder = options.Resolve(value.replace(/\/+$/, '') + '/');

					(options.Files || []).concat(Runtime.EmbeddedURLs()).forEach(function (url) {
						var path = url.indexOf(folder) === 0 ? url.substring(folder.length).split(/[?#]/)[0] : '';
						var twice = jobs.some(function (job) {
							return job.URL === url;
						});
						if (/\.json$/i.test(path) && !twice)
							jobs.push({Group: group, Name: named(path), URL: url});
					});

					return;
				}

				(Array.isArray(value) ? value : []).forEach(function (item) {
					if (typeof item === 'string') jobs.push({Group: group, Name: named(item.split('/').pop()), URL: options.Resolve(item)});
					else if (item && item.Name && item.URL) jobs.push({Group: group, Name: String(item.Name), URL: options.Resolve(item.URL)});
					else wrong = group;
				});
			});

			if (wrong) {
				callback(new Error('Elemenx $Resources items must be paths or {Name, URL}: ' + wrong));

				return;
			}

			if (!jobs.length) {
				callback(null);

				return;
			}

			done = Runtime.Countdown(jobs.length, callback);

			jobs.forEach(function (job) {
				Elemenx.Resource.Load(job.URL, function (error, text) {
					if (error) {
						done(error);

						return;
					}

					try {
						JSON.parse(text);
					}
					catch (parseError) {
						done(new Error('Elemenx Resource is not JSON: ' + job.URL + ': ' + parseError.message));

						return;
					}

					define(job.Group, job.Name, text, options.Application);

					done(null);
				});
			});
		};

		Elemenx.Resources = resources;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Locale */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var dictionaries = {};
		var sources = [];
		var loaded = {};
		var listeners = [];
		var fallback = 'en';
		var plurals = ['zero', 'one', 'two', 'few', 'many', 'other'];
		var rightToLeft = ['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'iw', 'ks', 'ps', 'sd', 'ug', 'ur', 'yi'];
		var state = Runtime.Reactive({Language: normalize(Runtime.HasDOM && global.document.documentElement.lang) || 'en', Version: 0});

		/* The language chosen is remembered here; the languages the Applications have ($Locales.Languages), for 'system'. */
		var storageKey = 'elemenx-language';
		var spoken = [];

		function normalize (language) {
			return String(language || '').replace(/_/g, '-').toLowerCase();
		}

		/* The languages a phrase is looked up in: pt-br, then pt, then the fallback language. */
		function chain (language) {
			var result = [];
			var code = normalize(language);

			while (code) {
				if (result.indexOf(code) === -1)
					result.push(code);

				code = code.indexOf('-') === -1 ? '' : code.substring(0, code.lastIndexOf('-'));
			}

			if (result.indexOf(fallback) === -1)
				result.push(fallback);

			return result;
		}

		/* An object whose every key is a plural category holds the forms of one phrase. */
		function pluralForms (value) {
			var keys = Object.keys(value);
			var i = 0;

			if (!keys.length) return false;

			while (i < keys.length) {
				if (plurals.indexOf(keys[i]) === -1 || typeof value[keys[i]] !== 'string') return false;

				i++;
			}

			return true;
		}

		/* Nested groups give keys with dots: {picker: {search: 'Search'}} is picker.search. */
		function flatten (entries, prefix, target) {
			var key;
			var value;

			for (key in entries) {
				if (!own(entries, key)) continue;

				value = entries[key];

				if (typeof value === 'string' || (value && typeof value === 'object' && pluralForms(value))) target[prefix + key] = value;
				else if (value && typeof value === 'object') flatten(value, prefix + key + '.', target);
			}

			return target;
		}

		function add (language, entries) {
			var code = normalize(language);
			var flat;
			var key;

			if (!code || !entries || typeof entries !== 'object')
				throw new Error('Elemenx.Locale.Add expects (language, entries)');

			flat = flatten(entries, '', {});
			dictionaries[code] = dictionaries[code] || {};

			for (key in flat) {
				if (own(flat, key))
					dictionaries[code][key] = flat[key];
			}

			Runtime.BatchReactive(function () {
				state.Version++;
			});
		}

		function category (language, count) {
			if (global.Intl && typeof global.Intl.PluralRules === 'function') {
				try {
					return new global.Intl.PluralRules(language).select(count);
				}
				catch (error) {
					return count === 1 ? 'one' : 'other';
				}
			}

			return count === 1 ? 'one' : 'other';
		}

		function text (key, params) {
			var languages;
			var value;
			var found = null;
			var i = 0;

			/* Both are read for the reactive tracking: a binding that shows a phrase follows the language and the dictionaries. */
			languages = chain(state.Language);

			if (!state.Version)
				return String(key);

			while (i < languages.length && found === null) {
				if (dictionaries[languages[i]] && own(dictionaries[languages[i]], key))
					found = {Language: languages[i], Value: dictionaries[languages[i]][key]};

				i++;
			}

			if (found === null)
				return String(key);

			value = found.Value;

			if (typeof value === 'object')
				value = value[category(found.Language, Number(params && params.count))] || value.other || '';

			return params ? String(value).replace(/\{([A-Za-z0-9_$]+)\}/g, function (all, name) {
				return own(params, name) && params[name] !== null && params[name] !== undefined ? String(params[name]) : all;
			}) : String(value);
		}

		function direction (language) {
			var code = normalize(language === undefined ? state.Language : language);
			var info;

			if (global.Intl && typeof global.Intl.Locale === 'function') {
				try {
					info = new global.Intl.Locale(code);
					info = typeof info.getTextInfo === 'function' ? info.getTextInfo() : info.textInfo;

					if (info && info.direction) return info.direction;
				}
				catch (error) {
					info = null;
				}
			}

			return rightToLeft.indexOf(code.split('-')[0]) === -1 ? 'ltr' : 'rtl';
		}

		/*
		 * Loads the dictionaries of the languages of language from every source, once each; a file that is not there is
		 * a language without phrases of that source. Calls back when all of them are in.
		 */
		function prepare (language, callback) {
			var jobs = [];
			var languages = chain(language);
			var complete;
			var i = 0;
			var j;

			while (i < languages.length) {
				j = 0;

				while (j < sources.length) {
					if (!loaded[sources[j].URL + '|' + languages[i]] && (!sources[j].Languages || sources[j].Languages.indexOf(languages[i]) !== -1))
						jobs.push({Source: sources[j].URL, Language: languages[i]});

					j++;
				}

				i++;
			}

			if (!jobs.length) {
				callback(null);

				return;
			}

			complete = Runtime.Countdown(jobs.length, callback);

			jobs.forEach(function (job) {
				var url = job.Source.replace(/\{language\}/g, job.Language);

				loaded[job.Source + '|' + job.Language] = true;

				Elemenx.Resource.Load(url, function (error, source) {
					var entries;

					if (error) {
						complete(null);

						return;
					}

					try {
						entries = JSON.parse(source);
					}
					catch (parseError) {
						complete(new Error('Elemenx Locale dictionary is not JSON: ' + url));

						return;
					}

					add(job.Language, entries);

					complete(null);
				});
			});
		}

		/* The language remembered (null: none, or the system), and remembering one (null forgets it); an isolated copy keeps none. */
		function remembered (language) {
			try {
				if (!arguments.length)
					return Runtime.Isolated ? null : normalize(global.localStorage.getItem(storageKey)) || null;

				if (Runtime.Isolated) return null;

				if (language) global.localStorage.setItem(storageKey, language);
				else global.localStorage.removeItem(storageKey);
			}
			catch (error) {
				return null;
			}

			return null;
		}

		/* The language of the system among languages: the first of the browser (navigator.languages) it has, as it is or by its base (pt for pt-BR), or null. */
		function systemLanguage (languages) {
			var navigator = global.navigator || {};
			var asked = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
			var code;
			var i = 0;

			while (i < asked.length) {
				code = normalize(asked[i]);

				if (code && languages.indexOf(code) !== -1) return code;

				if (code && languages.indexOf(code.split('-')[0]) !== -1) return code.split('-')[0];

				i++;
			}

			return null;
		}

		/* Loads the dictionaries of code, then switches to it: the lang and dir of the page follow. */
		function use (code, callback) {
			prepare(code, function (error) {
				if (!error && code !== state.Language) {
					Runtime.BatchReactive(function () {
						state.Language = code;
						state.Version++;
					});

					if (Runtime.HasDOM) {
						Runtime.ShadowHosts.concat(Runtime.Isolated ? [] : [global.document.documentElement]).forEach(function (node) {
							node.lang = code;
							node.dir = direction(code);
						});
					}

					notify();
				}

				if (typeof callback === 'function') callback(error || null);
				else if (error) Runtime.Report(error);
			});
		}

		function notify () {
			var list = listeners.slice();
			var i = 0;

			while (i < list.length) {
				try {
					list[i](state.Language);
				}
				catch (exception) {
					Runtime.Report(exception);
				}

				i++;
			}
		}

		/*
		 * Elemenx.Locale: the phrases of the Applications and their Libraries in the language of the page. A key names a
		 * phrase ('picker.search'); its text comes from the dictionary of the language, of its base language (pt for
		 * pt-BR), of the fallback language (en), and is the key itself when none has it. Templates show phrases with
		 * $T(key, params): they follow the language. An Application whose $Locales lists its Languages starts in the
		 * language of the system among them (navigator.languages), or the one chosen before: Language(code) is remembered
		 * (localStorage), Language('system') forgets it and takes the one of the system again ($Locales.System false keeps
		 * the lang of the page).
		 */
		Elemenx.Locale = {
			Language: function (language, callback) {
				var code;

				if (!arguments.length)
					return state.Language;

				code = normalize(language);

				if (!code)
					throw new Error('Elemenx.Locale.Language expects (language) or (language, callback)');

				if (code === 'system') {
					remembered(null);

					code = systemLanguage(spoken) || state.Language;
				}
				else {
					remembered(code);
				}

				use(code, callback);

				return state.Language;
			},
			/* The language of the system among the languages of the Applications, or null: the one Language('system') takes. */
			System: function () {
				return systemLanguage(spoken);
			},
			Fallback: function (language) {
				if (!arguments.length) return fallback;

				fallback = normalize(language) || 'en';

				Runtime.BatchReactive(function () {
					state.Version++;
				});

				return fallback;
			},
			Add: add,
			Text: function (key, params) {
				if (typeof key !== 'string' || !key)
					throw new Error('Elemenx.Locale.Text expects (key) or (key, params)');

				return text(key, params);
			},
			Has: function (key) {
				var languages = chain(state.Language);
				var i = 0;

				while (i < languages.length) {
					if (dictionaries[languages[i]] && own(dictionaries[languages[i]], key)) return true;

					i++;
				}

				return false;
			},
			Direction: direction,
			/*
			 * The key of a keyboard event as the direction of its element reads it: on a right-to-left element the arrows to
			 * the left and to the right swap, so a handler written for left to right keeps its meaning (the next item is
			 * the one toward the end of the line).
			 */
			Key: function (event) {
				var key = event && event.key;
				var target = event && event.target;

				if (key !== 'ArrowLeft' && key !== 'ArrowRight') return key;
				if (!target || target.nodeType !== 1 || typeof global.getComputedStyle !== 'function') return key;
				if (global.getComputedStyle(target).direction !== 'rtl') return key;

				return key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
			},
			/* A place of dictionaries: a URL with {language}; languages lists the ones it has (any one is asked for otherwise). */
			Source: function (url, languages) {
				var i = 0;

				if (typeof url !== 'string' || url.indexOf('{language}') === -1 || (languages !== undefined && !Array.isArray(languages)))
					throw new Error('Elemenx.Locale.Source expects (url with {language}) or (url, languages)');

				url = Runtime.AbsoluteURL(url.replace(/\{language\}/g, '__language__')).replace(/__language__/g, '{language}');

				while (i < sources.length) {
					if (sources[i].URL === url) return;

					i++;
				}

				sources.push({URL: url, Languages: languages ? languages.map(normalize) : null});
			},
			OnChange: function (callback) {
				if (typeof callback !== 'function')
					throw new Error('Elemenx.Locale.OnChange expects (callback)');

				listeners.push(callback);

				return callback;
			},
			OffChange: function (callback) {
				var index = listeners.indexOf(callback);
				if (index !== -1)
					listeners.splice(index, 1);
			}
		};

		/* The dictionaries of the current language, before an Application renders its root. */
		/*
		 * The language of an Application starting, its dictionaries loaded: with the Languages of its $Locales, the one
		 * chosen before, or the one of the system among them, unless $Locales.System is false; the lang of the page else.
		 */
		Runtime.LocaleReady = function (callback, locales) {
			var languages = locales && Array.isArray(locales.Languages) ? locales.Languages.map(normalize) : [];
			var code = null;

			languages.forEach(function (language) {
				if (spoken.indexOf(language) === -1)
					spoken.push(language);
			});

			if (languages.length && locales.System !== false && Runtime.HasDOM) {
				code = remembered();

				if (!code || languages.indexOf(code) === -1)
					code = systemLanguage(languages);
			}

			use(code || state.Language, callback);
		};

		/* Names every template expression sees, under the values of its Component. */
		Runtime.TemplateGlobals = {
			$T: function (key, params) {
				return text(String(key), params);
			}
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Style */
	(function (global) {
		'use strict';

		var sheets = {};
		var order = [];
		var roots = [];

		/* An isolated copy (a widget) keeps the stylesheets out of the document of the page, unless one asks for them. */
		var inDocument = !Runtime.Isolated;

		/*
		 * A stylesheet written for the document, read in a shadow root: html, body and :root are the host there, so
		 * body[data-theme='dark'] .card is :host([data-theme='dark']) .card.
		 */
		function hosted (css) {
			return String(css).replace(/(^|[{}])([^{}@]+)\{/g, function (all, before, selectors) {
				return before + selectors.split(',').map(function (part) {
					return part.replace(/(^|[\s>+~(])(?::root|html|body)((?:\[[^\]]*\]|\.[\w-]+|#[\w-]+|:not\([^)]*\))*)(?![\w-])/g, function (match, start, compound) {
						return start + ':host' + (compound ? '(' + compound + ')' : '');
					});
				}).join(',') + '{';
			});
		}

		function element (sheet, root) {
			var node;

			if (sheet.URL && !root) {
				node = global.document.createElement('link');
				node.rel = 'stylesheet';
				node.href = sheet.URL;
			}
			else {
				node = global.document.createElement('style');
				node.textContent = root ? hosted(sheet.Text) : sheet.Text;
			}

			return node;
		}

		/* The text of a stylesheet of a URL, for a shadow root: a <link> there could not read :root as its host. */
		function text (sheet, callback) {
			if (!sheet.URL) {
				callback(sheet.Text);

				return;
			}

			Elemenx.Resource.Load(sheet.URL, function (error, source) {
				if (!error) {
					sheet.Text = source;

					callback(source);
				}
			});
		}

		function place (sheet, root) {
			var target = root || global.document.head || global.document.documentElement;
			var node = root ? sheet.Roots.get(root) : sheet.Node;

			if (node && node.parentNode === target) {
				if (!sheet.URL && node.tagName === 'STYLE' && node.textContent !== (root ? hosted(sheet.Text) : sheet.Text))
					node.textContent = root ? hosted(sheet.Text) : sheet.Text;

				return;
			}

			if (!root) {
				sheet.Node = element(sheet, null);

				target.appendChild(sheet.Node);

				return;
			}

			text(sheet, function () {
				var created = element(sheet, root);

				sheet.Roots.set(root, created);

				root.appendChild(created);
			});
		}

		/*
		 * Keeps a stylesheet (key: its name; sheet: {Text} or {URL}) in the document and in every shadow root an
		 * Application renders in. A key keeps one stylesheet: a new text takes the place of the old one.
		 */
		function add (key, sheet) {
			var entry = sheets[key];
			var i = 0;

			if (!Runtime.HasDOM) return;

			if (!entry) {
				entry = sheets[key] = {Key: key, Text: '', URL: '', Node: null, Roots: new WeakMap()};

				order.push(key);
			}

			if (sheet.URL) entry.URL = sheet.URL;
			else entry.Text = String(sheet.Text);

			if (inDocument)
				place(entry, null);

			while (i < roots.length) {
				place(entry, roots[i]);

				i++;
			}
		}

		Runtime.AddStyle = add;

		/* Takes a stylesheet out of the document and of every shadow root: the Cache unloads the style of a component. */
		Runtime.RemoveStyle = function (key) {
			var entry = sheets[key];
			var node;
			var i = 0;

			if (!entry) return;

			if (entry.Node && entry.Node.parentNode)
				entry.Node.parentNode.removeChild(entry.Node);

			while (i < roots.length) {
				node = entry.Roots.get(roots[i]);

				if (node && node.parentNode)
					node.parentNode.removeChild(node);

				i++;
			}

			delete sheets[key];

			order.splice(order.indexOf(key), 1);
		};

		/* A shadow root of an Application takes every stylesheet, now and later. */
		/* The document takes every stylesheet, now and later: an Application of an isolated copy that renders in it. */
		Runtime.AddStyleDocument = function () {
			var i = 0;

			if (inDocument) return;

			inDocument = true;

			while (i < order.length) {
				place(sheets[order[i]], null);

				i++;
			}
		};

		Runtime.AddStyleRoot = function (root) {
			var i = 0;

			if (roots.indexOf(root) !== -1) return;

			roots.push(root);

			while (i < order.length) {
				place(sheets[order[i]], root);

				i++;
			}
		};

		/* Elemenx.Style(name, text) keeps a stylesheet in the document and in the shadow roots of the Applications. */
		Elemenx.Style = function (name, css) {
			if (typeof name !== 'string' || !name || typeof css !== 'string')
				throw new Error('Elemenx.Style expects (name, text)');

			add('style:' + name, {Text: css});
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Discovery */
	(function (global) {
		'use strict';

		var own = Runtime.Own;

		var maps = new WeakMap();
		var roots = new WeakMap();
		var builds = new WeakMap();
		/* The graph file of a root of another name than index.js, and the other files the graphs of an owner list (dictionaries, data). */
		var graphs = new WeakMap();
		var files = new WeakMap();
		var scripts = {};
		var pending = {};
		var revision = 0;

		function trimSlash (value) {
			return String(value || '').replace(/\/+$/, '');
		}

		function absolute (base, value) {
			if (/^(?:[a-z]+:)?\/\//i.test(value) || value.charAt(0) === '/') return value;

			return trimSlash(base) + '/' + String(value).replace(/^\.\//, '');
		}

		function basename (url) {
			var clean = String(url || '').split('?')[0].split('#')[0];
			var name = clean.substring(clean.lastIndexOf('/') + 1);

			return name.replace(/\.js$/i, '');
		}

		function requestText (url, callback) {
			var xhr = new XMLHttpRequest();

			xhr.open('GET', url, true);

			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) return;

				if (xhr.status >= 200 && xhr.status < 300) {
					callback(null, xhr.responseText);

					return;
				}

				callback(new Error('Elemenx Discovery failed: ' + url + ' [' + xhr.status + ']'));
			};

			xhr.onerror = function () {
				callback(new Error('Elemenx Discovery failed: ' + url));
			};

			xhr.send(null);
		}

		function parseIndex (source, url) {
			try {
				return (new Function('return (' + source.replace(/;\s*$/, '') + ');'))();
			}
			catch (error) {
				error.message = 'Elemenx Discovery index error in ' + url + ': ' + error.message;

				throw error;
			}
		}

		function buildDirectory (base, map, visited, found, callback, graph) {
			var directory = trimSlash(base);
			var url = graph || directory + '/index.js';

			if (visited[directory]) {
				callback(null);

				return;
			}

			visited[directory] = true;

			requestText(url, function (error, source) {
				if (error) {
					callback(error);

					return;
				}

				var entries;
				var remaining;
				var i = 0;

				try {
					entries = parseIndex(source, url);
				}
				catch (parseError) {
					callback(parseError);

					return;
				}

				if (!Array.isArray(entries)) {
					callback(new Error('Elemenx Discovery index must return an Array: ' + url));

					return;
				}

				remaining = entries.length;

				if (!remaining) {
					callback(null);

					return;
				}

				var complete = Runtime.Countdown(remaining, callback);

				while (i < entries.length) {
					(function (entry) {
						var value;
						var target;
						var name;

						if (typeof entry !== 'string') {
							complete(new Error('Elemenx Discovery index entries must be strings: ' + url));

							return;
						}

						value = entry.replace(/^\.\//, '');
						target = absolute(directory, value);

						if (/\.css(?:[?#].*)?$/i.test(value)) {
							Runtime.AddStyle(target, {URL: target});

							complete(null);

							return;
						}

						if (/\.js(?:[?#].*)?$/i.test(value)) {
							name = basename(value);

							if (map[name] && map[name] !== target) {
								complete(new Error('Elemenx Discovery duplicate entity "' + name + '": ' + map[name] + ' and ' + target));

								return;
							}

							map[name] = target;

							complete(null);

							return;
						}


						if (/\.[a-z0-9]+(?:[?#].*)?$/i.test(value)) {
							found.push(target);

							complete(null);

							return;
						}

						buildDirectory(target, map, visited, found, complete);
					})(entries[i]);

					i++;
				}
			});
		}

		/* graph: the URL of the graph file of the root when it is not its index.js (it is kept for the builds after). */
		function build (application, root, callback, graph) {
			var map = maps.get(application);
			var found = [];
			var callbacks;
			var current;
			var i;

			if (!Runtime.HasDOM) {
				callback(new Error('Elemenx Discovery requires DOM'));

				return;
			}

			if (!root) {
				callback(new Error('Elemenx Application Root is not configured'));

				return;
			}

			// Freeze the Discovery root against the document URL at build time.
			// Route navigation may change location.href later; entity URLs must not
			// change their meaning with the current browser route.
			root = new URL(String(root), Runtime.BaseURL()).href;

			roots.set(application, root);

			if (graph)
				graphs.set(application, new URL(String(graph), Runtime.BaseURL()).href);

			if (map) {
				callback(null, map);

				return;
			}

			current = builds.get(application);

			if (current) {
				current.push(callback);

				return;
			}

			callbacks = [callback];

			builds.set(application, callbacks);

			map = {};

			buildDirectory(root, map, {}, found, function (error) {
				callbacks = builds.get(application) || [];

				builds.delete(application);

				if (!error) {
					maps.set(application, map);
					files.set(application, found);
				}

				i = 0;
				while (i < callbacks.length) {
					callbacks[i](error, error ? null : map);

					i++;
				}
			}, graphs.get(application) || null);
		}

		function scriptURL (url, force) {
			if (!force)
				return url;

			revision++;

			return url + (url.indexOf('?') === -1 ? '?' : '&') + 'elemenx-reload=' + revision;
		}

		function load (application, type, name, force, callback) {
			var map = maps.get(application);
			var url = map && map[name];
			if (!url)
				url = Runtime.Library.ResolvedURL(application, name);

			var building = builds.get(application);
			var key;
			var target;
			var script;
			var callbacks;
			var i;

			/* Retries this load once the Discovery graph of the owner is built. */
			function retry (error) {
				if (error) {
					if (callback)
						callback(error);

					return;
				}

				load(application, type, name, force, callback);
			}

			if (!url && building) {
				building.push(retry);

				return true;
			}

			if (!url && !map && application && roots.get(application)) {
				build(application, roots.get(application), retry);

				return true;
			}

			if (!url) {
				if (callback)
					callback(new Error('Elemenx unknown ' + type + ': ' + name));

				return false;
			}

			key = type + ':' + url;

			if (!force && scripts[key]) {
				if (callback)
					callback(null);

				return true;
			}

			if (!force && pending[key]) {
				if (callback)
					pending[key].push(callback);

				return true;
			}

			callbacks = callback ? [callback] : [];
			pending[key] = callbacks;
			target = scriptURL(url, force);
			script = global.document.createElement('script');
			script.src = target;
			script.async = true;

			/* What the framework loaded itself: a page rendered for a server leaves it out (Elemenx.Render). */
			script.setAttribute('data-elemenx-loaded', '');

			script.onload = function () {
				callbacks = pending[key] || [];
				delete pending[key];

				scripts[key] = true;

				i = 0;
				while (i < callbacks.length) {
					callbacks[i](null);

					i++;
				}
			};

			script.onerror = function () {
				var error = new Error('Elemenx Discovery entity failed: ' + target);

				callbacks = pending[key] || [];
				delete pending[key];

				i = 0;
				while (i < callbacks.length) {
					callbacks[i](error);

					i++;
				}
			};

			(global.document.head || global.document.documentElement).appendChild(script);

			return true;
		}

		function loadDirectory (application, directory, type, callback) {
			var map = maps.get(application);
			var names = [];
			var name;
			var remaining;
			var i = 0;
			var pattern = new RegExp('(?:^|/)' + directory + '(?:/|$)', 'i');

			if (!map) {
				callback(new Error('Elemenx Discovery is not ready'));

				return;
			}

			for (name in map) {
				if (own(map, name) && pattern.test(map[name]))
					names.push(name);
			}

			remaining = names.length;

			if (!remaining) {
				callback(null);

				return;
			}

			var complete = Runtime.Countdown(remaining, callback);

			while (i < names.length) {
				load(application, type, names[i], false, complete);

				i++;
			}
		}

		function loadDirectives (application, callback) {
			loadDirectory(application, 'directives', 'Directive', callback);
		}

		function loadServices (application, callback) {
			loadDirectory(application, 'services', 'Service', callback);
		}

		Runtime.Discovery = {
			Root: function (application, root) {
				if (!application || !root) return null;

				root = new URL(String(root), Runtime.BaseURL()).href;

				roots.set(application, root);

				return root;
			},
			Build: build,
			LoadDirectives: loadDirectives,
			LoadServices: loadServices,

			Ready: function (application) {
				return !!maps.get(application);
			},

			Load: load,

			Reload: function (application, type, name, callback) {
				return load(application, type, name, true, callback);
			},

			ResolvedName: function (application, name) {
				var map = maps.get(application);
				if (!map)
					return null;

				return own(map, name) ? name : null;
			},

			ResolvedURL: function (application, name) {
				var map = maps.get(application);

				return map ? map[name] || null : null;
			},

			/* The names of the entities of the source tree of an Application. */
			Names: function (application) {
				var map = maps.get(application);

				return map ? Object.keys(map) : [];
			},

			/* The URLs of the other files its graphs list: dictionaries, data, pictures. */
			Files: function (application) {
				return (files.get(application) || []).slice();
			}
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Library */
	(function (global) {
		'use strict';
		/*
		 * The root of a system Library: libraries/<name> next to the elemenx.js that runs, on its origin (a framework from a CDN
		 * takes its Libraries from there, not from the site of the page); /libraries/<name> of the page for a framework inline
		 * in its page.
		 */
		function systemRoot (name) {
			var script = Runtime.ScriptURL && /^(?:https?|file):/i.test(Runtime.ScriptURL) ? Runtime.ScriptURL.split('?')[0].split('#')[0] : '';

			return script ? script.substring(0, script.lastIndexOf('/') + 1) + 'libraries/' + name : '/libraries/' + name;
		}

		/*
		 * The system Libraries, each on the ones before it: ElemenxCommon (algorithms that need no page), ElemenxUI (the
		 * Components of a page), ElemenxGraphics (scenes in 3D), ElemenxGaming (what makes a scene a game).
		 */
		function system (name, uses) {
			return {$Root: systemRoot(name), $Locales: {URL: 'locales/{language}.json', Languages: ['en', 'ru']}, $Resources: {Blueprints: 'blueprints', Data: 'resources'}, $Use: uses};
		}

		var definitions = {ElemenxCommon: system('ElemenxCommon', []), ElemenxUI: system('ElemenxUI', ['ElemenxCommon']), ElemenxGraphics: system('ElemenxGraphics', ['ElemenxUI']), ElemenxGaming: system('ElemenxGaming', ['ElemenxGraphics'])};
		var applications = new WeakMap();

		function list (value) {
			if (!value) return [];
			if (typeof value === 'string') return [value];

			if (!Array.isArray(value))
				throw new Error('Elemenx Library Use must be a string or Array');

			return value.slice();
		}

		function root (definition) {
			return Runtime.DefinitionURL(definition, definition.$Root || definition.Root) || null;
		}

		/*
		 * The resources of a Library ($Resources), named by its name: from the files its graph lists, or those a bundle
		 * embeds; before its Services, which read them at once.
		 */
		function libraryResources (entry, callback) {
			var base = root(entry.Definition);

			if (!entry.Definition.$Resources || !base) {
				callback(null);

				return;
			}

			Runtime.LoadResources(entry.Definition.$Resources, {
				Namespace: entry.Name,
				Files: Runtime.Discovery.Files(entry.Owner),
				Resolve: function (path) {
					return Runtime.AbsoluteURL(base.replace(/\/+$/, '') + '/' + path.replace(/^\.\//, ''));
				}
			}, callback);
		}

		/*
		 * The dictionaries of a Library found by $Discovery: locales/{language}.json next to its graph, in the languages its
		 * graph lists.
		 */
		function discoveredLocales (entry) {
			var base = entry.Definition.$Root.replace(/\/+$/, '') + '/locales/';
			var languages = [];

			Runtime.Discovery.Files(entry.Owner).forEach(function (url) {
				var match = url.indexOf(base) === 0 ? /^([A-Za-z]{2,3}(?:-[A-Za-z0-9]+)*)\.json$/.exec(url.substring(base.length)) : null;
				if (match && languages.indexOf(match[1]) === -1)
					languages.push(match[1]);
			});

			if (languages.length)
				Elemenx.Locale.Source(base + '{language}.json', languages);
		}

		/*
		 * The names an Application uses with the Libraries each of them uses ($Use of a Library), each once, every one after
		 * those it uses: ElemenxGaming is ElemenxCommon, ElemenxUI, ElemenxGraphics and ElemenxGaming. A Library that uses
		 * itself, by others or not, is an error.
		 */
		function ordered (values) {
			var result = [];
			var path = [];

			function visit (name) {
				var definition = definitions[name];

				if (path.indexOf(name) !== -1)
					throw new Error('Elemenx Library uses itself: ' + path.slice(path.indexOf(name)).concat([name]).join(' > '));

				if (result.indexOf(name) !== -1) return;

				path.push(name);

				if (definition)
					list(definition.$Use).forEach(visit);

				path.pop();

				result.push(name);
			}

			values.forEach(visit);

			return result;
		}

		/* discovered: the Libraries of $Discovery of the Application, [{Name, Root, Graph}], besides the ones it names. */
		function use (application, value, callback, discovered) {
			var values = ordered(list(value));
			var entries = [];
			var i = 0;

			while (i < values.length) {
				var name = values[i];
				var definition = definitions[name];

				if (!definition) {
					if (global.console && typeof global.console.warn === 'function')
						global.console.warn('Elemenx unknown Library: ' + name);

					i++;

					continue;
				}

				entries.push({Name: name, Definition: definition, Owner: {}});

				/* The dictionaries of the Library ($Locales: a path from its root with {language}, or {URL, Languages}). */
				if (definition.$Locales && root(definition))
					Elemenx.Locale.Source(root(definition).replace(/\/+$/, '') + '/' + (definition.$Locales.URL || definition.$Locales), definition.$Locales.Languages);

				i++;
			}

			(discovered || []).forEach(function (library) {
				entries.push({Name: library.Name, Definition: {$Root: library.Root, $Graph: library.Graph}, Owner: {}, Discovered: true});
			});

			applications.set(application, entries);

			if (!entries.length) {
				callback(null);

				return;
			}

			if (Runtime.Bundle.Ready()) {
				Runtime.Bundle.LoadType('Directive');
				Runtime.Bundle.LoadType('Service');
				Runtime.Bundle.LoadType('Guard');

				bundled(0);

				return;
			}

			/* In a bundle the resources of each Library are embedded: they are read in their order, those of later ones last. */
			function bundled (index) {
				if (!entries[index]) {
					callback(null);

					return;
				}

				libraryResources(entries[index], function (error) {
					if (error) callback(error);
					else bundled(index + 1);
				});
			}

			/* One after another, in their order: what a Library uses is there before it. */
			function next (index) {
				var entry = entries[index];
				var base;

				if (!entry) {
					callback(null);

					return;
				}

				base = root(entry.Definition);

				if (!base) {
					callback(new Error('Elemenx Library Root is not configured: ' + entry.Name));

					return;
				}

				Runtime.Discovery.Build(entry.Owner, base, function (error) {
					var twice;

					if (error) {
						callback(error);

						return;
					}

					twice = repeated(entries, index);

					if (twice) {
						callback(twice);

						return;
					}

					if (entry.Discovered)
						discoveredLocales(entry);

					libraryResources(entry, function (resourceError) {
						if (resourceError) {
							callback(resourceError);

							return;
						}

						Runtime.Discovery.LoadDirectives(entry.Owner, function (directiveError) {
							if (directiveError) {
								callback(directiveError);

								return;
							}

							Runtime.Discovery.LoadServices(entry.Owner, function (serviceError) {
								if (serviceError) {
									callback(serviceError);

									return;
								}

								next(index + 1);
							});
						});
					});
				}, entry.Definition.$Graph || null);
			}

			next(0);
		}

		/* A name a Library defines that one before it defines too: which of them would be found depended on the order. */
		function repeated (entries, index) {
			var names = Runtime.Discovery.Names(entries[index].Owner);
			var i = 0;
			var found;

			while (i < index) {
				found = names.filter(function (name) {
					return Runtime.Discovery.Names(entries[i].Owner).indexOf(name) !== -1;
				})[0];

				if (found)
					return new Error('Elemenx Library ' + entries[index].Name + ' defines ' + found + ', which ' + entries[i].Name + ' defines too');

				i++;
			}

			return null;
		}

		Elemenx.Library = function (name, definition) {
			if (arguments.length === 2) {
				if (!name || !definition || typeof definition !== 'object')
					throw new Error('Elemenx.Library expects (name, definition)');

				if (Runtime.CurrentScriptURL())
					definition.$DefinitionURL = Runtime.CurrentScriptURL();

				definitions[name] = definition;

				return definition;
			}

			if (arguments.length !== 1)
				throw new Error('Elemenx.Library expects (name) or (name, definition)');

			return definitions[name] || null;
		};

		Runtime.Library = {
			Use: use,
			ResolvedURL: function (application, name) {
				var entries = applications.get(application) || [];
				var i = 0;

				while (i < entries.length) {
					var entry = entries[i];
					var resolved = Runtime.Discovery.ResolvedName(entry.Owner, name);
					if (resolved)
						return Runtime.Discovery.ResolvedURL(entry.Owner, resolved);

					i++;
				}

				return null;
			},

			/* The names of the entities of the Libraries an Application uses. */
			Names: function (application) {
				var entries = applications.get(application) || [];
				var names = [];
				var i = 0;

				while (i < entries.length) {
					names = names.concat(Runtime.Discovery.Names(entries[i].Owner));

					i++;
				}

				return names;
			}
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Service and Guard */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var serviceRegistry = {};
		var serviceHandles = {};
		var applicationServiceHandles = new WeakMap();
		var destroyedServiceApplications = new WeakSet();
		var guardRegistry = {};

		function ServiceAccessor (name) {
			var application = this && this.$Application ? this.$Application() : null;

			return serviceHandle(name, application);
		}

		function createService (name, definition, generation, application) {
			var instance = {};
			var startedAt = new Date();
			var key;

			definition = definition || {};

			for (key in definition) {
				if (own(definition, key) && key.charAt(0) !== '$') {
					instance[key] = definition[key];
				}
			}

			instance.$Generation = function () {
				return generation || 0;
			};

			instance.$StartedAt = function () {
				return new Date(startedAt.getTime());
			};

			instance.$Application = function () {
				return application || null;
			};

			instance.$Service = function (serviceName) {
				return serviceHandle(serviceName, application);
			};

			instance.$Provide = function (kind, value) {
				return provide(name, kind, value, application, true);
			};

			instance.$Providers = function (kind, value) {
				return provide(name, kind, value, application, false);
			};

			Runtime.AttachOwnerFacades(instance, name, 0);

			Runtime.InitializeOwnerSubscriptions(instance, definition);

			instance.$Destroy = function () {
				Runtime.DestroyOwnerResources(instance);

				if (typeof definition.$OnDestroy === 'function') {
					definition.$OnDestroy.call(instance);
				}
			};

			if (typeof definition.$OnCreate === 'function') {
				definition.$OnCreate.call(instance);
			}

			return instance;
		}

		/*
		 * The Services that declare in $Provides what they add to a registry ({Registry: {Kind: [names]}}, '*' for any
		 * name), made in the Application that asks: their $OnCreate adds it. registry is the name of the Service that
		 * asks, kind a part of it ('Nodes'), value one name of that kind (none: all of the kind). A Service being made
		 * already is not made again. Returns the names of the Services that provide it; with make false ($Providers) it
		 * only names them and makes none.
		 */
		var providing = [];

		function provide (registry, kind, value, application, make) {
			var names = [];

			Object.keys(serviceRegistry).forEach(function (provider) {
				var provides = serviceRegistry[provider].Definition.$Provides;
				var list = provides && provides[registry] ? provides[registry][kind] : null;
				if (provider === registry || list == null) return;

				list = [].concat(list);

				if (value !== undefined && list.indexOf(value) === -1 && list.indexOf('*') === -1) return;

				names.push(provider);

				if (!make || providing.indexOf(provider) !== -1) return;

				providing.push(provider);

				try {
					serviceHandle(provider, application).$Generation();
				}
				finally {
					providing.splice(providing.indexOf(provider), 1);
				}
			});

			return names;
		}

		function existingServiceTarget (name, application) {
			var entry = serviceRegistry[name];
			if (!entry)
				return null;

			if (application) {
				if (!entry.ApplicationInstances || !entry.ApplicationInstances.has(application)) return null;

				return entry.ApplicationInstances.get(application);
			}

			return entry.Instance || null;
		}

		function removeApplicationInstance (entry, instance) {
			if (!entry || !entry.ApplicationInstanceList || !instance) return;

			var i = entry.ApplicationInstanceList.indexOf(instance);
			if (i !== -1)
				entry.ApplicationInstanceList.splice(i, 1);
		}

		function serviceTarget (name, application) {
			if (application && destroyedServiceApplications.has(application)) return null;

			var entry = serviceRegistry[name];
			if (!entry)
				return null;

			var applicationInstance;

			if (application) {
				entry.ApplicationInstances = entry.ApplicationInstances || new WeakMap();
				entry.ApplicationInstanceList = entry.ApplicationInstanceList || [];

				if (!entry.ApplicationInstances.has(application)) {
					applicationInstance = createService(name, entry.Definition, entry.Generation, application);

					entry.ApplicationInstances.set(application, applicationInstance);
					entry.ApplicationInstanceList.push(applicationInstance);
				}

				return entry.ApplicationInstances.get(application);
			}

			if (!entry.Instance)
				entry.Instance = createService(name, entry.Definition, entry.Generation, null);

			return entry.Instance;
		}

		function serviceHandle (name, application) {
			var map = serviceHandles;
			var handle;

			if (application) {
				map = applicationServiceHandles.get(application);

				if (!map) {
					map = {};

					applicationServiceHandles.set(application, map);
				}
			}

			handle = map[name];

			if (handle)
				return handle;

			var queued = [];
			var loading = false;

			handle = new Proxy({}, {
				get: function (object, property) {
					var target;

					if (property === 'ElemenxServiceHandle') return true;
					if (property === 'ElemenxDeferred') return !serviceRegistry[name];

					if (property === '$Destroy') {
						return function () {
							var entry = serviceRegistry[name];
							if (!entry) return;

							var target = existingServiceTarget(name, application);

							queued = [];

							if (!target) return;

							if (target.$Destroy)
								target.$Destroy();

							if (application && entry.ApplicationInstances) {
								entry.ApplicationInstances.delete(application);

								removeApplicationInstance(entry, target);
							}
							else {
								entry.Instance = null;
							}
						};
					}

					target = serviceTarget(name, application);

					if (target) {
						if (typeof target[property] === 'function') return target[property].bind(target);

						return target[property];
					}

					if (application && !destroyedServiceApplications.has(application) && Runtime.Discovery.Ready(application)) {
						if (!loading) {
							loading = true;

							Runtime.Discovery.Load(application, 'Service', name, false, function (error) {
								if (error) {
									queued = [];

									if (global.console && console.error)
										console.error(error);

									return;
								}

								loading = false;

								var call;
								var resolved = serviceTarget(name, application);
								var i = 0;

								while (i < queued.length) {
									call = queued[i];

									if (resolved && typeof resolved[call.Property] === 'function') {
										resolved[call.Property].apply(resolved, call.Arguments);
									}

									i++;
								}

								queued = [];
							});
						}

						return function () {
							queued.push({
								Property: property,
								Arguments: Array.prototype.slice.call(arguments)
							});
						};
					}

					return undefined;
				},

				set: function (object, property, value) {
					var target = serviceTarget(name, application);

					if (target) target[property] = value;
					else object[property] = value;

					return true;
				}
			});

			map[name] = handle;

			return handle;
		}

		Elemenx.Service = function (name, definition) {
			if (arguments.length === 2) {
				Runtime.RegisterServiceDefinition(name, definition);

				if (Runtime.DefinedTell)
					Runtime.DefinedTell();

				return serviceHandle(name);
			}

			if (arguments.length !== 1)
				throw new Error('Elemenx.Service expects (name) or (name, definition)');

			if (!serviceRegistry[name]) return null;

			return serviceHandle(name);
		};

		Elemenx.Guard = function (name, guard) {
			if (arguments.length === 2) {
				if (typeof guard !== 'function')
					throw new Error('Elemenx.Guard definition must be a function');

				guardRegistry[name] = guard;

				return guard;
			}

			if (arguments.length !== 1)
				throw new Error('Elemenx.Guard expects (name) or (name, guard)');

			return guardRegistry[name] || null;
		};

		Runtime.Service = ServiceAccessor;

		Runtime.ServiceForApplication = function (application, name) {
			return serviceHandle(name, application || null);
		};

		Runtime.DestroyApplicationServices = function (application) {
			destroyedServiceApplications.add(application);

			var name;
			var entry;
			var target;

			for (name in serviceRegistry) {
				if (!own(serviceRegistry, name)) continue;

				entry = serviceRegistry[name];
				target = existingServiceTarget(name, application);

				if (!target) continue;

				if (target.$Destroy)
					target.$Destroy();

				entry.ApplicationInstances.delete(application);

				removeApplicationInstance(entry, target);
			}

			applicationServiceHandles.delete(application);
		};

		Runtime.RegisterServiceDefinition = function (name, definition) {
			var previous = serviceRegistry[name];
			if (previous && previous.Instance && previous.Instance.$Destroy)
				previous.Instance.$Destroy();

			if (previous && previous.ApplicationInstanceList) {
				var i = 0;

				while (i < previous.ApplicationInstanceList.length) {
					if (previous.ApplicationInstanceList[i].$Destroy)
						previous.ApplicationInstanceList[i].$Destroy();

					i++;
				}
			}

			serviceRegistry[name] = {
				Definition: definition || {},
				Instance: null,
				ApplicationInstances: new WeakMap(),
				ApplicationInstanceList: [],
				Generation: previous ? previous.Generation + 1 : 0
			};
		};

		/* The definition of a Service registered under a name, or null. */
		Runtime.ServiceDefinition = function (name) {
			return serviceRegistry[name] ? serviceRegistry[name].Definition : null;
		};

		Runtime.RefreshDeferredService = function (name) {
			return serviceHandles[name] || null;
		};

		Runtime.ResolveGuard = function (guard) {
			if (typeof guard === 'function') return guard;
			if (typeof guard === 'string') return Elemenx.Guard(guard);

			return null;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Router ownership */
	(function () {
		'use strict';

		var componentRouterFacades = new WeakMap();

		Runtime.ComponentRouters = new WeakMap();
		Runtime.ActiveRouter = null;

		Runtime.RouterFor = function (component) {
			var facade = componentRouterFacades.get(component);
			if (facade)
				return facade;

			facade = {
				Pending: [],

				On: function (name, callback) {
					var router = Runtime.ComponentRouters.get(component);

					if (router) {
						router.Owner(component).On(name, callback);
					}
					else {
						facade.Pending.push({
							Name: name,
							Callback: callback
						});
					}

					return facade;
				},

				Go: function (url) {
					var router = Runtime.ComponentRouters.get(component);

					return router ? router.Go(url) : facade;
				},

				Replace: function (url) {
					var router = Runtime.ComponentRouters.get(component);

					return router ? router.Replace(url) : facade;
				},

				Back: function () {
					var router = Runtime.ComponentRouters.get(component);

					return router ? router.Back() : facade;
				},

				Forward: function () {
					var router = Runtime.ComponentRouters.get(component);

					return router ? router.Forward() : facade;
				},

				Current: function () {
					var router = Runtime.ComponentRouters.get(component);

					return router ? router.Current() : [];
				}
			};

			componentRouterFacades.set(component, facade);

			return facade;
		};

		Runtime.AttachRouter = function (component, router) {
			if (!component) return;

			Runtime.ComponentRouters.set(component, router);

			if (component._Component) {
				var resolvedComponent = component._Component();
				if (resolvedComponent && resolvedComponent !== component)
					Runtime.AttachRouter(resolvedComponent, router);
			}

			var facade = Runtime.RouterFor(component);
			var pending = facade.Pending.slice(0);

			facade.Pending.length = 0;

			var i = 0;
			while (i < pending.length) {
				router.Owner(component).On(pending[i].Name, pending[i].Callback);

				i++;
			}
		};

		Runtime.DetachRouterOwner = function (component) {
			var router = Runtime.ComponentRouters.get(component);
			var facade = componentRouterFacades.get(component);

			if (router) {
				router.OffOwner(component);

				Runtime.ComponentRouters.delete(component);
			}

			if (facade) {
				facade.Pending.length = 0;

				componentRouterFacades.delete(component);
			}
		};

		Runtime.WithRouter = function (router, callback) {
			var previous = Runtime.ActiveRouter;
			var result;

			Runtime.ActiveRouter = router;

			try {
				result = callback();
			}
			finally {
				Runtime.ActiveRouter = previous;
			}

			return result;
		};
	})();

	/* Directive registry */
	(function () {
		'use strict';

		Runtime.Directive = {
			Registry: {},
			Aliases: {},
			Prefixes: {},
			Binding: function (attribute) {
				if (
					attribute.length < 3 ||
					attribute.charAt(0) !== '[' ||
					attribute.charAt(attribute.length - 1) !== ']' ||
					attribute.charAt(1) === '('
				) return null;

				return attribute.substring(1, attribute.length - 1);
			},
			Event: function (attribute) {
				var match = /^\(([^\)]+)\)$/.exec(attribute);

				return match ? match[1] : null;
			},
			TwoWay: function (attribute) {
				var match = /^\[\(([^\)]+)\)\]$/.exec(attribute);

				return match ? match[1] : null;
			},
			Ref: function (attribute) {
				var match = /^#(.+)$/.exec(attribute);

				return match ? match[1] : null;
			},
			Register: function (name, definition, internal) {
				var alias;

				name = String(name || '').toLowerCase();

				if (!/^[a-z][a-z0-9_-]*$/.test(name))
					throw new Error('Elemenx invalid directive name: ' + name);

				if (this.Registry[name])
					throw new Error('Elemenx directive already registered: ' + name);

				definition = definition || {};

				if (typeof definition !== 'object')
					throw new TypeError('Elemenx directive definition must be an Object');

				if (!internal && definition.Internal)
					throw new Error('Elemenx directive Internal metadata is reserved');

				if (definition.Structural === true)
					definition.Kind = 'structural';

				if (!definition.Kind)
					definition.Kind = 'behavioral';

				if (definition.Kind === 'structural' && definition.Collection === true && !definition.Host)
					definition.Host = 'collection';

				if (definition.Kind === 'structural' && !definition.Host)
					definition.Host = 'structural';

				definition.Name = name;
				definition.Internal = internal === true;

				this.Registry[name] = definition;

				alias = definition.Alias;

				if (alias)
					this.Aliases[alias] = name;

				return definition;
			},
			Resolve: function (attribute) {
				/* Every element of every template is asked: a plain attribute leaves at its first character. */
				if (attribute.charCodeAt(0) !== 42) return null;

				var match = /^\*([a-z][a-z0-9_-]*)$/i.exec(attribute);
				var name;

				if (!match)
					return null;

				name = match[1].toLowerCase();

				return this.Registry[name] ? {
					Name: name,
					Definition: this.Registry[name]
				} : null;
			},
			Find: function (node, kind) {
				var attrs = node && node.attributes ? node.attributes : [];
				var i = 0;
				var resolved;

				while (i < attrs.length) {
					resolved = this.Resolve(attrs[i].name);

					if (resolved && (!kind || resolved.Definition.Kind === kind)) {
						return {
							Name: resolved.Name,
							Definition: resolved.Definition,
							Attribute: attrs[i].name,
							Expression: attrs[i].value || ''
						};
					}

					i++;
				}

				return null;
			},
			Policy: function (node) {
				var attrs = node && node.attributes ? node.attributes : [];
				var structural = null;
				var directiveArguments = [];
				var i = 0;
				var resolved;

				while (i < attrs.length) {
					resolved = this.Resolve(attrs[i].name);

					if (resolved && resolved.Definition.Kind === 'structural') {
						if (structural)
							throw new Error('Elemenx allows one structural directive per host: *' + structural.Name + ', *' + resolved.Name);

						structural = {Name: resolved.Name, Definition: resolved.Definition};
					}
					else if (resolved && resolved.Definition.Kind === 'argument') {
						directiveArguments.push(resolved);
					}

					i++;
				}

				i = 0;
				while (i < directiveArguments.length) {
					resolved = directiveArguments[i];

					if (!structural || (resolved.Definition.For && resolved.Definition.For !== structural.Definition.Host))
						throw new Error('Elemenx directive argument *' + resolved.Name + ' has no compatible structural host');

					i++;
				}

				return structural;
			},
			AttributeForRole: function (role) {
				var name;
				var definition;

				for (name in this.Registry) {
					if (!Runtime.Own(this.Registry, name)) continue;

					definition = this.Registry[name];

					if (definition.Role === role) {
						return '*' + name;
					}
				}

				return null;
			},
			Arguments: function (node, owner) {
				var result = {};
				var attrs = node && node.attributes ? Array.prototype.slice.call(node.attributes) : [];
				var i = 0;
				var resolved;

				while (i < attrs.length) {
					resolved = this.Resolve(attrs[i].name);

					if (resolved && resolved.Definition.Kind === 'argument' && (!resolved.Definition.For || resolved.Definition.For === owner)) {
						result[resolved.Name] = attrs[i].value || '';

						node.removeAttribute(attrs[i].name);
					}

					i++;
				}

				return result;
			},
			Reserved: function (attribute) {
				var name;

				if (attribute === 'data-elemenx-component') return true;

				for (name in this.Prefixes) {
					if (Runtime.Own(this.Prefixes, name) && attribute.indexOf(this.Prefixes[name]) === 0) {
						return true;
					}
				}

				return this.Resolve(attribute) !== null
					|| this.TwoWay(attribute) !== null
					|| this.Binding(attribute) !== null
					|| this.Event(attribute) !== null
					|| this.Ref(attribute) !== null;
			}
		};

		/*
		 * Built-ins use the same directive registry as application directives.
		 * Alias exists only as a compatibility bridge for the current structural
		 * engine while its handlers are moved behind generic directive capabilities.
		 */
		Runtime.Directive.Register('if', {
			Alias: 'If',
			Structural: true,
			$OnUpdate: function (context) {
				if (context.Value) context.Mount();
				else context.Unmount();
			}
		}, true);
		Runtime.Directive.Register('for', {
			Alias: 'For',
			Structural: true,
			Collection: true,
			$OnCreate: function (context) {
				var classic = context.Expression.split(';');
				var match = /^\s*([A-Za-z_$][\w$]*)\s+(of|in)\s+([\s\S]+)$/.exec(context.Expression);
				var initializer;

				if (classic.length === 3) {
					initializer = /^\s*([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/.exec(classic[0]);

					if (!initializer)
						throw new Error('Elemenx *for initializer must assign a local variable: ' + context.Expression);

					context.Data.Mode = 'classic';
					context.Data.Variable = initializer[1];
					context.Data.Initializer = initializer[2];
					context.Data.Condition = classic[1];
					context.Data.Step = classic[2];

					return;
				}

				if (!match)
					throw new Error('Elemenx *for expects classic for, for..of or for..in syntax: ' + context.Expression);

				context.Data.Mode = match[2];
				context.Data.Variable = match[1];
				context.Data.Source = match[3];
			},
			$OnUpdate: function (context) {
				if (context.Data.Mode === 'classic') {
					context.Render(null, {
						Mode: 'classic',
						Variable: context.Data.Variable,
						Initializer: context.Data.Initializer,
						Condition: context.Data.Condition,
						Step: context.Data.Step,
						Key: context.Argument('key')
					});

					return;
				}

				context.Render(context.Source(context.Data.Source), {
					Mode: context.Data.Mode,
					Variable: context.Data.Variable,
					Key: context.Argument('key')
				});
			}
		}, true);

		/*
		 * *lazy: its host renders when it comes near the viewport (a screen away) or when the browser is idle (a tenth of a
		 * second at most apart), whichever is first, one host at a time in the order of the page, and then stays. A long page shows its first screen at once
		 * and builds the rest in the background, instead of freezing the tab until all of it is built. Its value is the
		 * placeholder that holds the place meanwhile: none (a line), a height (a number of pixels, or a length), or '#id'
		 * of a template of the page (Elemenx.Template) whose markup it shows.
		 */
		var lazyGlobal = typeof globalThis !== 'undefined' ? globalThis : self;
		var lazyQueue = [];
		var lazyIdle = 0;
		var lazyFast = 0;

		function lazyMount (context) {
			var data = context.Data;
			var index = lazyQueue.indexOf(context);
			if (index !== -1)
				lazyQueue.splice(index, 1);

			data.Done = true;

			lazyGlobal.clearTimeout(data.Waiting);

			if (data.Observer)
				data.Observer.disconnect();

			if (data.Holder && data.Holder.parentNode)
				data.Holder.parentNode.removeChild(data.Holder);

			data.Observer = null;
			data.Holder = null;

			if (!data.Destroyed)
				context.Mount();
		}

		/* The placeholder of a value of *lazy: a height (data-elemenx-lazy="sized"), or a template of the page ("template"). */
		function lazyPlaceholder (holder, value) {
			var template = null;

			if (typeof value === 'string' && value.charAt(0) === '#') {
				if (!Runtime.Template.Has(value.substring(1)))
					Runtime.Template.Harvest(document);

				template = Runtime.Template.Get(value.substring(1));
			}

			if (template !== null) {
				holder.setAttribute('data-elemenx-lazy', 'template');

				holder.innerHTML = template;

				return;
			}

			if (typeof value === 'number' && value > 0)
				value = value + 'px';

			if (typeof value === 'string' && value && value.charAt(0) !== '#') {
				holder.setAttribute('data-elemenx-lazy', 'sized');

				holder.style.minHeight = value;
			}
		}

		/* One host a task: the ones near the viewport first, at once; the others when the browser is idle. */
		function lazyNear () {
			return lazyQueue.filter(function (context) {
				return context.Data.Near;
			})[0];
		}

		function lazyNext (fast) {
			var context;

			if (fast) lazyFast = 0;
			else lazyIdle = 0;

			context = lazyNear() || (fast ? null : lazyQueue[0]);

			if (context)
				lazyMount(context);

			lazySchedule();
		}

		function lazySchedule () {
			if (!lazyFast && lazyNear()) {
				lazyFast = lazyGlobal.setTimeout(function () {
					lazyNext(true);
				}, 0);
			}

			if (lazyIdle || !lazyQueue.length) return;

			lazyIdle = typeof lazyGlobal.requestIdleCallback === 'function' ? lazyGlobal.requestIdleCallback(function () {
				lazyNext(false);
			}, {timeout: 100}) : lazyGlobal.setTimeout(function () {
				lazyNext(false);
			}, 16);
		}

		Runtime.Directive.Register('lazy', {
			Alias: 'Lazy',
			Structural: true,
			$OnCreate: function (context) {
				var data = context.Data;

				lazyQueue.push(context);

				lazySchedule();

				if (typeof lazyGlobal.IntersectionObserver !== 'function') return;

				/*
				 * A place the observer can see, one line high (so the hosts of a long page are not all near the viewport at first),
				 * put in once the template around is compiled: the compiler finds the nodes of a template by their position.
				 */
				data.Waiting = lazyGlobal.setTimeout(function () {
					var marker = context.Marker;

					data.Waiting = 0;

					if (data.Done || !marker || !marker.parentNode) return;

					data.Holder = document.createElement('span');

					data.Holder.setAttribute('data-elemenx-lazy', '');
					data.Holder.setAttribute('aria-hidden', 'true');

					data.Holder.style.display = 'block';
					data.Holder.style.minHeight = '1px';

					lazyPlaceholder(data.Holder, context.Value);

					marker.parentNode.insertBefore(data.Holder, marker);

					/* Near the viewport it goes before the others, still one a task: a host that renders moves the next ones away. */
					data.Observer = new lazyGlobal.IntersectionObserver(function (entries) {
						data.Near = entries[entries.length - 1].isIntersecting;

						lazySchedule();
					}, {rootMargin: '100% 0px'});

					data.Observer.observe(data.Holder);
				}, 0);
			},
			$OnDestroy: function (context) {
				context.Data.Destroyed = true;

				lazyMount(context);
			}
		}, true);
		Runtime.Directive.Register('key', {Alias: 'Key', Kind: 'argument', For: 'collection', Role: 'key'}, true);
		Runtime.Directive.Register('keep', {Alias: 'Keep', Kind: 'argument', For: 'structural', Role: 'keep'}, true);
		Runtime.Directive.Register('outlet', {Alias: 'Outlet', Kind: 'behavior', Role: 'outlet'}, true);
		Runtime.Directive.Register('pending', {Alias: 'Pending', Kind: 'status', Role: 'pending'}, true);
		Runtime.Directive.Register('error', {Alias: 'Error', Kind: 'status', Role: 'error'}, true);
	})();

	/* Event sources */
	(function () {
		'use strict';

		/*
		 * The sources of the events of the templates that no element gives by itself (a pinch, a long press, the turn of the
		 * device): a library registers one by the names of its events, and an (event) of any template on an element starts
		 * it there, once for all the names it gives. Attach(element) starts it and returns its stop; it dispatches its
		 * events on the element, a CustomEvent of each name, its data in detail. The last listener of the element gone, it
		 * stops.
		 */
		Runtime.EventSources = {};

		/* Starts the source of an event on an element (none for an event of no source): the release of this listener. */
		Runtime.AttachEventSource = function (node, name) {
			var source = Runtime.Own(Runtime.EventSources, name) ? Runtime.EventSources[name] : null;
			var held;
			var entry = null;
			var i = 0;

			if (!source || !node || node.nodeType !== 1) return null;

			held = node.__ElemenxEventSources || (node.__ElemenxEventSources = []);

			while (i < held.length && !entry) {
				if (held[i].Source === source)
					entry = held[i];

				i++;
			}

			if (!entry) {
				entry = {Source: source, Count: 0, Stop: null};

				held.push(entry);

				entry.Stop = source.Attach(node);
			}

			entry.Count++;

			return function () {
				var at;

				entry.Count--;

				if (entry.Count > 0) return;

				at = held.indexOf(entry);

				if (at !== -1)
					held.splice(at, 1);

				if (typeof entry.Stop === 'function')
					entry.Stop();
			};
		};

		/*
		 * Elemenx.EventSource(names, source): registers source ({Attach(element) → stop}) as the giver of the events of names
		 * (a name or a list of them); Elemenx.EventSource(name): the source of that event, or null. A name of a source
		 * registered again is taken by the new one.
		 */
		Elemenx.EventSource = function (names, source) {
			var list = typeof names === 'string' ? [names] : names;

			if (source === undefined)
				return typeof names === 'string' && Runtime.Own(Runtime.EventSources, names) ? Runtime.EventSources[names] : null;

			if (!list || !list.length || !source || typeof source.Attach !== 'function')
				throw new Error('Elemenx.EventSource needs names and a source with Attach(element).');

			list.forEach(function (name) {
				Runtime.EventSources[String(name)] = source;
			});

			return source;
		};
	})();

	/* Template and Component */
	(function (global) {
		'use strict';

		var own = Runtime.Own;

		/* Component: Directive API */
		Elemenx.Directive = function (name, definition) {
			var made = Runtime.Directive.Register(name, definition);

			if (Runtime.DefinedTell)
				Runtime.DefinedTell();

			return made;
		};

		/* Component: state */
		var componentRegistry = {};
		var componentRouteContext = {$Path: true, $Params: true, $Query: true, $Hash: true};
		var componentGenerations = {};
		var componentOutlets = new WeakMap();
		var componentValues = new WeakMap();
		var componentRouteUpdaters = new WeakMap();
		/* The methods of a Component its expressions call, by its state; the owner of the state an instance holds. */
		var expressionMethods = new WeakMap();
		var stateOwners = new WeakMap();
		/* The placeholders of deferred components, and the behavioral directives of their tags set on them for now. */
		var deferredPlaceholders = new WeakSet();
		var placedDirectives = new WeakMap();
		/* The instance of each root element of a Component (the placeholder of a deferred one: its deferred instance). */
		var elementInstances = new WeakMap();

		/*
		 * The title and the icon of the page: the $Title and the $Icon of an instance (or of an Application), their {{ }}
		 * read in its state and followed; the page shows the ones of the instance it follows now, the last made or shown.
		 */
		var headParts = new WeakMap();
		var headOwners = {Title: null, Icon: null};

		function headValue (part) {
			var source = part.Source;
			if (typeof source !== 'string' || source.indexOf('{{') === -1) return source;

			return source.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, function (all, expression) {
				var value;

				try {
					value = Runtime.EvaluateExpression(expression, part.Scope);
				}
				catch (error) {
					value = '';
				}

				return value == null ? '' : String(value);
			});
		}

		function headSet (kind, value) {
			Runtime.Untracked(function () {
				if (kind === 'Title') Elemenx.Title(value);
				else Elemenx.Icon(value);
			});
		}

		/* The $Title and the $Icon of an owner, read in scope: the page follows them from now. */
		Runtime.HeadOwn = function (owner, definition, scope, effects) {
			var parts = headParts.get(owner) || {};

			['Title', 'Icon'].forEach(function (kind) {
				if (definition['$' + kind] === undefined) return;

				parts[kind] = {Source: definition['$' + kind], Scope: scope};
				headOwners[kind] = owner;

				/* A text with {{ }} follows what it reads, while this owner is the one of the page. */
				effects.push(Runtime.Effect(function () {
					var value = headValue(parts[kind]);

					if (headOwners[kind] === owner)
						headSet(kind, value);
				}));
			});

			headParts.set(owner, parts);
		};

		/* this.$Title(value) and this.$Icon(value): the owner says it itself; without a value, the one of the page. */
		Runtime.HeadSet = function (owner, kind, value, scope) {
			var parts = headParts.get(owner) || {};

			parts[kind] = {Source: value, Scope: scope};

			headParts.set(owner, parts);

			headOwners[kind] = owner;

			headSet(kind, headValue(parts[kind]));
		};

		/* An owner destroyed: the page keeps what it shows, and follows no one until the next. */
		Runtime.HeadForget = function (owner) {
			if (headOwners.Title === owner)
				headOwners.Title = null;

			if (headOwners.Icon === owner)
				headOwners.Icon = null;
		};

		/*
		 * The title and the icon of a page of a Router: each the one of the deepest of its components that has one, else
		 * the one of the Application (a page without its own does not keep the one of the page before).
		 */
		Runtime.HeadOfPage = function (components, application) {
			['Title', 'Icon'].forEach(function (kind) {
				var owners = components.slice().reverse().concat(application ? [application] : []);
				var i = 0;

				while (i < owners.length) {
					var owner = owners[i];
					var parts;

					while (owner && owner._Component && owner._Component() && owner._Component() !== owner) owner = owner._Component();

					parts = owner ? headParts.get(owner) : null;

					if (parts && parts[kind]) {
						headOwners[kind] = owner;

						headSet(kind, headValue(parts[kind]));

						return;
					}

					i++;
				}
			});
		};

		/* The instance of a Component whose element this is, or null. */
		function instanceOf (element) {
			return element && elementInstances.get(element) || null;
		}

		/* What a reference gives: its element, or with instance true the instance of the Component of it (or null). */
		function referred (element, instance) {
			return instance ? instanceOf(element) : element;
		}

		/* The instances of the Components among the elements of a reference, in their order. */
		function referredAll (elements, instance) {
			if (!instance)
				return elements;

			return elements.map(instanceOf).filter(function (each) {
				return each !== null;
			});
		}
		var componentReloading = false;
		var templateResources = {};
		var templatePending = {};
		var templateRevision = 0;
		var styleResources = {};
		var stylePending = {};
		var styleSequence = 0;
		var templateRegistry = {};
		var templateRegistryPending = {};
		var templateLoaders = [];
		var templateDOMObserver = null;

		/* Component: Template registry */
		function templateRegistrySet (name, value) {
			var pending;
			var i = 0;

			name = String(name || '');

			if (!name)
				throw new Error('Elemenx.Template expects a non-empty name');

			templateRegistry[name] = String(value === undefined || value === null ? '' : value);
			pending = templateRegistryPending[name] || [];
			delete templateRegistryPending[name];

			while (i < pending.length) {
				pending[i](null, templateRegistry[name]);

				i++;
			}

			return templateRegistry[name];
		}

		/*
		 * A template of the page: a <template id>, or a <script type="text/html" id> (or text/x-template), whose text keeps
		 * the case of the names of its Components (the parser of a <template> writes them in lower case).
		 */
		function templateScript (node) {
			return node.tagName.toUpperCase() === 'SCRIPT' && /^text\/(?:html|x-template)$/i.test(node.getAttribute('type') || '');
		}

		function harvestTemplateNode (node) {
			if (!node || node.nodeType !== 1 || !node.tagName || (node.tagName.toUpperCase() !== 'TEMPLATE' && !templateScript(node))) return false;

			if (!node.id)
				return false;

			templateRegistrySet(node.id, templateScript(node) ? node.textContent : node.innerHTML);

			if (node.parentNode)
				node.parentNode.removeChild(node);

			return true;
		}

		function harvestTemplates (root) {
			var nodes;
			var snapshot = [];
			var i = 0;

			if (!root) return 0;
			if (harvestTemplateNode(root)) return 1;
			if (!root.querySelectorAll) return 0;

			nodes = root.querySelectorAll('template[id], script[id][type]');

			while (i < nodes.length) {
				snapshot.push(nodes[i]);

				i++;
			}

			i = 0;
			while (i < snapshot.length) {
				harvestTemplateNode(snapshot[i]);

				i++;
			}

			return snapshot.length;
		}

		function requestTemplateLoaders (name) {
			var i = 0;
			var loader;
			var result;

			while (i < templateLoaders.length) {
				loader = templateLoaders[i];
				result = loader(name, function (value) {
					if (value !== undefined && value !== null) {
						templateRegistrySet(name, value);
					}
				});

				if (result !== undefined && result !== null) {
					templateRegistrySet(name, result);
				}

				if (templateRegistry[name] !== undefined) return;

				i++;
			}
		}

		function resolveTemplateID (name, callback) {
			if (templateRegistry[name] === undefined && Runtime.HasDOM && global.document)
				harvestTemplates(document);

			if (templateRegistry[name] !== undefined) {
				callback(null, templateRegistry[name]);

				return;
			}

			if (!templateRegistryPending[name]) {
				templateRegistryPending[name] = [];

				templateRegistryPending[name].push(callback);

				requestTemplateLoaders(name);

				return;
			}

			templateRegistryPending[name].push(callback);
		}

		Runtime.Template = {
			Set: templateRegistrySet,
			Get: function (name) { return templateRegistry[name] !== undefined ? templateRegistry[name] : null; },
			Has: function (name) { return templateRegistry[name] !== undefined; },
			Remove: function (name) { delete templateRegistry[name]; },
			Resolve: resolveTemplateID,
			Harvest: harvestTemplates
		};

		Elemenx.Template = function (name, value) {
			if (arguments.length === 1)
				return Runtime.Template.Get(name);

			if (arguments.length !== 2)
				throw new Error('Elemenx.Template expects (name) or (name, value)');

			return templateRegistrySet(name, value);
		};
		Elemenx.Template.Has = Runtime.Template.Has;
		Elemenx.Template.Remove = Runtime.Template.Remove;
		Elemenx.Template.Loader = function (loader) {
			if (typeof loader !== 'function')
				throw new Error('Elemenx.Template.Loader expects a function');

			templateLoaders.push(loader);

			return Elemenx.Template;
		};

		if (Runtime.HasDOM && global.document) {
			harvestTemplates(document);

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', function () {
					harvestTemplates(document);
				}, {once: true});
			}

			if (global.MutationObserver && document.documentElement) {
				templateDOMObserver = new MutationObserver(function (mutations) {
					var i = 0;
					var j;
					var nodes;

					// The HTML parser inserts <template> before all of its child tokens have
					// necessarily been consumed. Removing that node from a MutationObserver
					// while parsing is still in progress can detach the parser's current
					// insertion target. DOMContentLoaded performs the complete parser harvest.
					if (document.readyState === 'loading') return;

					while (i < mutations.length) {
						nodes = mutations[i].addedNodes;
						j = 0;

						while (j < nodes.length) {
							harvestTemplates(nodes[j]);

							j++;
						}

						i++;
					}
				});

				templateDOMObserver.observe(document.documentElement, {childList: true, subtree: true});
			}
		}

		/* Component: template and style resources */
		function loadTemplateURL (url, force, callback) {
			var request;
			var callbacks;
			var target = url;
			var i;

			if (!force && templateResources[url] !== undefined) {
				callback(null, templateResources[url]);

				return;
			}

			if (!force && templatePending[url]) {
				templatePending[url].push(callback);

				return;
			}

			callbacks = [callback];
			templatePending[url] = callbacks;

			if (force) {
				templateRevision++;

				target += (target.indexOf('?') === -1 ? '?' : '&') + 'elemenx-reload=' + templateRevision;
			}

			request = new XMLHttpRequest();

			request.open('GET', target, true);

			request.onreadystatechange = function () {
				var error = null;

				if (request.readyState !== 4) return;

				if (request.status >= 200 && request.status < 300) {
					templateResources[url] = request.responseText;
				}
				else {
					error = new Error('Elemenx TemplateURL failed: ' + target + ' (' + request.status + ')');
				}

				callbacks = templatePending[url] || [];

				delete templatePending[url];

				i = 0;
				while (i < callbacks.length) {
					callbacks[i](error, templateResources[url]);

					i++;
				}
			};

			request.send(null);
		}

		function loadStyleURL (url, callback) {
			var request;
			var callbacks;
			var i;

			if (styleResources[url] !== undefined) {
				callback(null, styleResources[url]);

				return;
			}

			if (stylePending[url]) {
				stylePending[url].push(callback);

				return;
			}

			callbacks = [callback];
			stylePending[url] = callbacks;
			request = new XMLHttpRequest();

			request.open('GET', url, true);

			request.onreadystatechange = function () {
				var error = null;

				if (request.readyState !== 4) return;

				if (request.status >= 200 && request.status < 300) {
					styleResources[url] = request.responseText;
				}
				else {
					error = new Error('Elemenx StyleURL failed: ' + url + ' (' + request.status + ')');
				}

				callbacks = stylePending[url] || [];
				delete stylePending[url];

				i = 0;
				while (i < callbacks.length) {
					callbacks[i](error, styleResources[url]);

					i++;
				}
			};

			request.send(null);
		}

		function installComponentStyle (name, definition, css) {
			if (!global.document || css === undefined || css === null) return;

			if (!definition.$StyleKey) {
				styleSequence++;

				definition.$StyleKey = name ? 'component:' + name : 'anonymous:' + styleSequence;
			}

			Runtime.AddStyle(definition.$StyleKey, {Text: String(css)});
		}

		/* Component: the use of the definitions (the Cache unloads the idle ones) */
		var componentUse = {};

		/* The live instances of a name: the Cache keeps the resources of a definition while one of them lives. */
		function useComponent (name, component) {
			var use = componentUse[name] || (componentUse[name] = {Count: 0, IdleSince: 0, Evicted: false});
			var destroy = component.$Destroy;
			var released = false;

			use.Count++;
			use.Evicted = false;

			component.$Destroy = function () {
				if (!released) {
					released = true;
					use.Count--;

					if (!use.Count)
						use.IdleSince = Date.now();
				}

				return destroy.apply(component, arguments);
			};
		}

		/* The definitions in use or used once: {Name, Instances, IdleSince, Cached}. */
		Runtime.ComponentUse = function () {
			var list = [];
			var name;

			for (name in componentUse) {
				if (own(componentUse, name))
					list.push({Name: name, Instances: componentUse[name].Count, IdleSince: componentUse[name].IdleSince, Cached: !componentUse[name].Evicted});
			}

			return list;
		};

		/*
		 * Unloads an idle definition: the text of its template and of its style (fetched again by the next instance), its
		 * stylesheet, and the compiled expressions of the templates (compiled again on use). A definition of code keeps its
		 * object: the next instance places its style again.
		 */
		Runtime.EvictComponent = function (name) {
			var use = componentUse[name];
			var factory = componentRegistry[name];
			var definition = factory && factory.Definition;
			if (!use || use.Count || use.Evicted || !definition) return false;

			if (definition.$TemplateURL)
				delete templateResources[definition.$TemplateURL];

			if (definition.$StyleURL) {
				delete styleResources[definition.$StyleURL];
				delete definition.$Style;
			}

			if (definition.$StyleKey)
				Runtime.RemoveStyle(definition.$StyleKey);

			expressionCache = {};
			fragmentCache = {};
			fragmentCount = 0;
			use.Evicted = true;

			return true;
		};

		/*
		 * Component: sleep and wake. The components and directives with $OnSleep or $OnWake, by the element they live on:
		 * an instance that goes to sleep (the Cache keeps it out of the page) puts to sleep the ones inside it.
		 */
		var sleepAware = [];

		function forgetSleepAware (entry) {
			var index = sleepAware.indexOf(entry);
			if (index !== -1)
				sleepAware.splice(index, 1);
		}

		/*
		 * Puts to sleep the components and directives inside an element, and empties its fields of passwords and of
		 * payment cards: a page asleep keeps no secret. Returns them, for Runtime.WakeTree. The hooks run untracked, as
		 * $OnCreate and $OnDestroy: a *if of the owner puts its child to sleep while its effect runs, and what $OnSleep
		 * reads (an event to the owner that changes its state) must not make that effect run itself again.
		 */
		Runtime.SleepTree = function (element) {
			var asleep = sleepAware.filter(function (entry) {
				return element.contains(entry.Root);
			});
			var fields = element.querySelectorAll ? element.querySelectorAll('input[type="password"], input[autocomplete^="cc-"]') : [];
			var i = 0;

			Runtime.Untracked(function () {
				while (i < fields.length) {
					if (fields[i].value) {
						fields[i].value = '';

						fields[i].dispatchEvent(new global.Event('input', {bubbles: true}));
					}

					i++;
				}

				asleep.forEach(function (entry) {
					if (entry.Sleep)
						Runtime.Notify(entry.Sleep, null, []);
				});
			});

			return asleep;
		};

		/* Wakes the components and directives Runtime.SleepTree put to sleep, the ones still alive; untracked too. */
		Runtime.WakeTree = function (asleep) {
			Runtime.Untracked(function () {
				(asleep || []).forEach(function (entry) {
					if (entry.Wake && sleepAware.indexOf(entry) !== -1)
						Runtime.Notify(entry.Wake, null, []);
				});
			});
		};

		/* Component: live and deferred instances */
		var liveComponentInstances = {};

		function trackComponentInstance (name, component) {
			if (!name || !component) return component;

			var list = liveComponentInstances[name] || (liveComponentInstances[name] = []);

			list.push(component);

			return component;
		}

		function untrackComponentInstance (name, component) {
			var list = liveComponentInstances[name];
			if (!list) return;

			var index = list.indexOf(component);
			if (index !== -1)
				list.splice(index, 1);
		}

		/*
		 * The placeholders of deferred components that wait for their definition; the Router waits for the ones of its
		 * route. A component whose owner shows its waiting itself (a *pending status or $OnChildPending) is not among them.
		 */
		var pendingPlaceholders = [];

		function markPending (placeholder, value) {
			var index = pendingPlaceholders.indexOf(placeholder);

			if (value && index === -1) pendingPlaceholders.push(placeholder);
			else if (!value && index !== -1) pendingPlaceholders.splice(index, 1);
		}

		Runtime.HasPendingComponents = function (element) {
			var i = 0;

			while (i < pendingPlaceholders.length) {
				if (element.contains(pendingPlaceholders[i])) return true;

				i++;
			}

			return false;
		};

		function canonicalDeferredInput (value, definition) {
			if (!value || typeof value !== 'object' || !definition || typeof definition !== 'object') return value;

			/*
			 * An array has no names to put in the case of the definition, unless its default holds objects whose names
			 * its items may take: a list of numbers (the levels of a Sparkline) goes as it is, not copied at each update.
			 */
			if (Array.isArray(value) && !(Array.isArray(definition) && definition.length && definition[0] && typeof definition[0] === 'object')) return value;

			var result = Array.isArray(value) ? [] : {};
			var key;
			var target;

			for (key in value) {
				if (!own(value, key)) continue;

				target = key;

				if (!own(definition, target) && typeof key === 'string')
					target = Runtime.CaseName(definition, key) || key;

				result[target] = canonicalDeferredInput(value[key], definition[target]);
			}

			return result;
		}

		function canonicalDeferredData (value, definition, options) {
			/*
			 * A Router packet is transport/context data, not Component props. Keep its
			 * identity intact so CreateComponentFactory can recognize RoutePacket and
			 * install Path/Params/Query/Hash through the dedicated route-context path.
			 */
			if (options && options.RoutePacket === value) return value;

			return canonicalDeferredInput(value, definition);
		}

		function deferredComponent (resolver, data, slotProjection, options) {
			var placeholder = document.createElement('span');
			var current = null;
			var currentDefinition = null;
			var destroyed = false;
			var updates = [];
			var listeners = [];
			var lifecycle = options && options.AsyncLifecycle;
			var reloadParent = null;
			var reloadNext = null;
			var api = {};
			var ownWaiting = !!(lifecycle && (lifecycle.Pending || (lifecycle.Owner && typeof lifecycle.Owner[lifecycle.Hooks && lifecycle.Hooks.$OnChildPending ? lifecycle.Hooks.$OnChildPending : '$OnChildPending'] === 'function')));

			placeholder.style.display = 'contents';

			deferredPlaceholders.add(placeholder);

			elementInstances.set(placeholder, api);

			markPending(placeholder, !ownWaiting);

			/*
			 * The props it is made with: the ones of its tag, and over them the ones its owner changed while it loaded, so
			 * that its $OnCreate and $OnReady see them (a Router packet keeps its identity: they follow it as updates).
			 */
			function madeWith (definition) {
				var made = canonicalDeferredData(data, definition, options);
				var merged = {};
				var change;
				var key;
				var i = 0;

				if (!updates.length || (options && options.RoutePacket === data) || (made && (typeof made !== 'object' || Array.isArray(made)))) return made;

				for (key in made || {}) {
					if (own(made, key))
						merged[key] = made[key];
				}

				while (i < updates.length) {
					change = canonicalDeferredInput(updates[i], definition);

					for (key in change || {}) {
						if (own(change, key))
							merged[key] = change[key];
					}

					i++;
				}

				updates = [];

				return merged;
			}

			function renderStatus (source) {
				if (!source) return;

				var template;
				var fragment;

				while (placeholder.firstChild) placeholder.removeChild(placeholder.firstChild);

				if (typeof source === 'string' && source.charAt(0) === '#') {
					var registered = Runtime.Template.Get(source.substring(1));

					if (registered !== null && registered !== undefined) {
						placeholder.innerHTML = registered;

						return;
					}

					template = document.querySelector(source);

					if (template && template.tagName === 'TEMPLATE') {
						fragment = template.content.cloneNode(true);

						placeholder.appendChild(fragment);

						return;
					}
				}

				placeholder.innerHTML = String(source);
			}

			/* Calls the lifecycle hook of the owner; false when the owner has none. */
			function lifecycleCall (name, error) {
				var owner = lifecycle && lifecycle.Owner;
				var hook = lifecycle && lifecycle.Hooks && lifecycle.Hooks[name] ? lifecycle.Hooks[name] : name;
				var method = owner && owner[hook];
				if (typeof method !== 'function') return false;

				method.call(owner, {
					Name: lifecycle.Name || null,
					$Element: current && current.$Element ? current.$Element() : placeholder,
					Error: error || null
				});

				return true;
			}

			if (lifecycle) {
				renderStatus(lifecycle.Pending);

				lifecycleCall('$OnChildPending', null);
			}

			api.$Generation = function () {
				return current && current.$Generation ? current.$Generation() : 0;
			};

			api.$Application = function () {
				if (current && current.$Application) return current.$Application();
				if (api._parent && api._parent.$Application) return api._parent.$Application();

				return options && options.Application ? options.Application : null;
			};

			api.$Element = function () {
				return current ? current.$Element() : placeholder;
			};

			api._Component = function () {
				var component = current;
				var resolved;

				while (component && component._Component) {
					resolved = component._Component();

					if (!resolved) return null;

					if (resolved === component) break;

					component = resolved;
				}

				return component;
			};

			api.$Parent = function (value) {
				if (arguments.length) {
					if (current) current.$Parent(value);
					else api._parent = value;

					return api;
				}

				return current ? current.$Parent() : api._parent;
			};

			api.$Ref = function (name, instance) {
				if (!current || !current.$Ref) return null;

				return current.$Ref(name, instance);
			};

			api.$Refs = function (name, instance) {
				return current && current.$Refs ? current.$Refs(name, instance) : [];
			};

			/* A copy of the tag: of the instance made, once its definition is in. */
			api.$Copy = function (props) {
				if (!current || !current.$Copy)
					throw new Error('Elemenx $Copy: the Component is not loaded yet');

				return current.$Copy(props);
			};

			/* The props the definition does not declare: of the instance made, once its definition is in. */
			api.$Open = function () {
				if (!current || !current.$Open)
					throw new Error('Elemenx $Open: the Component is not loaded yet');

				return current.$Open();
			};

			/* The method under the one that runs: of the instance made, once its definition is in. */
			api.$Super = function () {
				if (!current || !current.$Super)
					throw new Error('Elemenx $Super: the Component is not loaded yet');

				return current.$Super.apply(current, arguments);
			};

			api._Definition = function () {
				return currentDefinition;
			};

			/* Inputs keep the declaration spelling ([hint]); the resolved Definition knows the real name (Hint). */
			api.$Update = function (value) {
				if (current) current.$Update(canonicalDeferredInput(value, currentDefinition));
				else updates.push(value);

				return api;
			};

			api.$On = function (name, callback) {
				if (current) current.$On(name, callback);
				else listeners.push({Name: name, Callback: callback});

				return api;
			};

			api.$Destroy = function () {
				destroyed = true;
				updates = [];
				listeners = [];

				elementInstances.delete(placeholder);

				markPending(placeholder, false);

				Runtime.DetachRouterOwner(api);

				if (current)
					current.$Destroy();

				current = null;

				if (placeholder.parentNode)
					placeholder.parentNode.removeChild(placeholder);
			};

			api._Pending = function () {
				if (destroyed) return false;

				var oldElement = current ? current.$Element() : placeholder;

				reloadParent = oldElement && oldElement.parentNode;
				reloadNext = oldElement && oldElement.nextSibling;

				if (current)
					current.$Destroy();

				current = null;

				markPending(placeholder, !ownWaiting);

				if (lifecycle)
					renderStatus(lifecycle.Pending);

				if (reloadParent && !placeholder.parentNode) {
					if (reloadNext && reloadNext.parentNode === reloadParent) reloadParent.insertBefore(placeholder, reloadNext);
					else reloadParent.appendChild(placeholder);
				}

				if (oldElement && oldElement !== placeholder)
					moveDirectives(oldElement, placeholder);

				if (lifecycle)
					lifecycleCall('$OnChildPending', null);

				return true;
			};

			api._Error = function (error) {
				if (destroyed) return false;

				markPending(placeholder, false);

				if (lifecycle) {
					renderStatus(lifecycle.Error);

					lifecycleCall('$OnChildError', error);
				}

				return true;
			};

			api._Reload = function (factory) {
				if (destroyed || !factory) return false;

				markPending(placeholder, false);

				var oldElement = current ? current.$Element() : placeholder;
				var parentNode = reloadParent || (oldElement && oldElement.parentNode);
				var nextSibling = reloadNext || (oldElement && oldElement.nextSibling);

				if (current)
					current.$Destroy();

				current = factory(madeWith(factory.Definition), slotProjection, options);
				currentDefinition = factory.Definition;

				var currentRouter = Runtime.ComponentRouters.get(api);
				if (currentRouter)
					Runtime.AttachRouter(current, currentRouter);

				if (api._parent && current.$Parent) {
					current.$Parent(api._parent);
				}

				var i = 0;
				while (i < listeners.length) {
					current.$On(listeners[i].Name, listeners[i].Callback);

					i++;
				}

				i = 0;
				while (i < updates.length) {
					current.$Update(canonicalDeferredInput(updates[i], factory.Definition));

					i++;
				}

				var element = current.$Element();

				if (placeholder.parentNode) {
					placeholder.parentNode.replaceChild(element, placeholder);
				}
				else if (parentNode && !element.parentNode) {
					if (nextSibling && nextSibling.parentNode === parentNode) parentNode.insertBefore(element, nextSibling);
					else parentNode.appendChild(element);
				}

				moveDirectives(placeholder, element, currentDefinition);

				reloadParent = null;
				reloadNext = null;

				if (lifecycle)
					lifecycleCall('$OnChildReady', null);

				return true;
			};

			resolver(function (error, factory) {
				if (destroyed) return;

				markPending(placeholder, false);

				if (error || !factory) {
					var handled = false;

					error = error || new Error('Elemenx deferred component failed');

					if (lifecycle) {
						renderStatus(lifecycle.Error);

						handled = lifecycleCall('$OnChildError', error);
					}

					/* Like the Application: an error that no owner hook received reaches the console. */
					if (!handled && global.console && console.error)
						console.error(error);

					return;
				}

				current = factory(madeWith(factory.Definition), slotProjection, options);
				currentDefinition = factory.Definition;

				var currentRouter = Runtime.ComponentRouters.get(api);
				if (currentRouter)
					Runtime.AttachRouter(current, currentRouter);

				if (api._parent && current.$Parent) {
					current.$Parent(api._parent);
				}

				var i = 0;
				while (i < listeners.length) {
					current.$On(listeners[i].Name, listeners[i].Callback);

					i++;
				}

				i = 0;
				while (i < updates.length) {
					current.$Update(canonicalDeferredInput(updates[i], factory.Definition));

					i++;
				}

				var element = current.$Element();

				if (placeholder.parentNode)
					placeholder.parentNode.replaceChild(element, placeholder);

				moveDirectives(placeholder, element, currentDefinition);

				if (lifecycle && (!current._Component || current._Component()))
					lifecycleCall('$OnChildReady', null);

				updates = [];
				listeners = [];
			});

			return api;
		}

		/* Component: template compiler */
		/*
		 * Compile expressions from trusted TEMPLATE SOURCE only.
		 * Runtime state is supplied as scope and is never concatenated into code.
		 */
		var expressionCache = {};

		function expressionNames (source) {
			/*
			 * Full JavaScript expressions are intentionally supported, so trying
			 * to parse identifiers ourselves would be a second JavaScript parser.
			 * Evaluation therefore still uses `with (scope)`.
			 *
			 * Missing component values are handled by delaying binding evaluation
			 * until the component has received/populated state (see factory below).
			 */
			return String(source || '').replace(/^\s+|\s+$/g, '');
		}

		function compileExpression (source) {
			source = expressionNames(source);

			if (!source) {
				return function () {
					return undefined;
				};
			}

			/*
			 * The methods of the Component and the names of the framework ($T) are seen under the values of the Component,
			 * which come first.
			 */
			if (!expressionCache[source]) {
				expressionCache[source] = (function (evaluate) {
					return function (scope) {
						return evaluate((scope && expressionMethods.get(scope)) || Runtime.TemplateGlobals, scope);
					};
				})(own(precompiledExpressions, source) ? precompiledExpressions[source] : compileSource(source));
			}

			return expressionCache[source];
		}

		/* The function of an expression a build did not precompile; a page that forbids eval (an extension) gets a plain error. */
		function compileSource (source) {
			try {
				return new Function('$globals', '$scope', 'with ($globals) { with ($scope || {}) { return (' + source + '); } }');
			}
			catch (error) {
				if (error && error.name === 'EvalError')
					throw new Error('Elemenx expression is not precompiled and the page forbids eval: ' + source);

				throw error;
			}
		}

		/*
		 * Precompiled expressions: the functions a build wrote as code for the expressions of the templates, by their
		 * source, ($globals, $scope) each, as the compiler makes them. A page whose Content-Security-Policy forbids eval
		 * (a browser extension) runs its templates with them and compiles nothing.
		 */
		var precompiledExpressions = {};

		Elemenx.Expressions = function (map) {
			var source;

			for (source in map) {
				if (!own(map, source)) continue;

				if (typeof map[source] !== 'function')
					throw new Error('Elemenx precompiled expression must be a function: ' + source);

				precompiledExpressions[expressionNames(source)] = map[source];
			}

			return Elemenx;
		};

		Runtime.EvaluateExpression = function (source, scope) {
			return compileExpression(source)(scope || {});
		};

		/*
		 * The text of the template of a definition: $Template is the template itself, a text or a function that returns
		 * one. A name ('#cart') is no template: a template of the registry or of the page is named by $TemplateID.
		 */
		function resolveTemplate (template) {
			var source = typeof template === 'function' ? template() : template || '';
			if (typeof source === 'string' && /^#[A-Za-z_][\w:.-]*$/.test(source))
				throw new Error('Elemenx $Template is the template itself, not a name: use $TemplateID: \'' + source.substring(1) + '\'');

			return String(source);
		}

		function normalizeSelfClosingComponents (html) {
			/*
			 * HTML does not treat <MyComponent /> as self-closing. Normalize
			 * Elemenx-style component tags before the browser HTML parser sees
			 * the template. Native lowercase/void elements are left untouched.
			 */
			return String(html || '').replace(
				/<([A-Z][A-Za-z0-9_.:-]*)(\s[^<>]*?)?\s*\/>/g,
				function (match, tag, attributes) {
					return '<' + tag + (attributes || '') + '></' + tag + '>';
				}
			);
		}

		function protectExpressionAttributes (html) {
			var expressions = [];
			var source = String(html || '').replace(
				/(\s(?:\*[A-Za-z][A-Za-z0-9_-]*|\[[^\]\s]+\])\s*=\s*)(["'])([\s\S]*?)\2/gi,
				function (match, prefix, quote, expression) {
					var index = expressions.length;

					expressions.push(expression);

					return prefix + quote + '__ELEMENX_EXPRESSION_' + index + '__' + quote;
				}
			);

			return {
				Source: source,
				Expressions: expressions
			};
		}

		function restoreExpressionAttributes (fragment, expressions) {
			var elements = fragment.querySelectorAll('*');
			var i = 0;
			var j;
			var attributes;
			var value;
			var match;

			while (i < elements.length) {
				attributes = elements[i].attributes;

				j = 0;

				while (j < attributes.length) {
					value = attributes[j].value;
					match = /^__ELEMENX_EXPRESSION_(\d+)__$/.exec(value);

					if (match && expressions[Number(match[1])] !== undefined) {
						attributes[j].value = expressions[Number(match[1])];
					}

					j++;
				}

				i++;
			}
		}

		/*
		 * A <Fragment> groups nodes without an element of its own. The HTML parser takes it out of a table (an element it does
		 * not know cannot stand there), so it is read as a <template>, which may stand anywhere; openFragments makes it an
		 * element again once the text is parsed. A part written back as text (a row of a *for) has its elemenx-fragment.
		 */
		function fragmentTags (html) {
			return String(html || '').replace(/<(?:Fragment|elemenx-fragment)(?=[\s>])/gi, '<template data-elemenx-fragment').replace(/<\/(?:Fragment|elemenx-fragment)\s*>/gi, '</template>');
		}

		/*
		 * The <template data-elemenx-fragment> of a parsed text, those inside them too: one with nothing on it (no
		 * directive, no slot) leaves its nodes in its place, the one of the whole text excepted; another becomes an
		 * elemenx-fragment element with them, for a *directive or for the slot it fills.
		 */
		function openFragments (container, whole) {
			var found = container.querySelectorAll('template[data-elemenx-fragment]');
			var i = 0;
			var fragment;
			var element;
			var attributes;
			var j;

			while (i < found.length) {
				fragment = found[i];

				fragment.removeAttribute('data-elemenx-fragment');

				openFragments(fragment.content, null);

				if (!fragment.attributes.length && fragment !== whole) {
					fragment.parentNode.replaceChild(fragment.content, fragment);
				}
				else {
					element = document.createElement('elemenx-fragment');
					attributes = fragment.attributes;

					for (j = 0; j < attributes.length; j++)
						element.setAttribute(attributes[j].name, attributes[j].value);

					element.appendChild(fragment.content);

					fragment.parentNode.replaceChild(element, fragment);
				}

				i++;
			}
		}

		/* The <Fragment> that is the whole of a parsed text, or null. */
		function wholeFragment (content) {
			var only = soleElement(content);

			return only && only.tagName === 'TEMPLATE' && only.hasAttribute('data-elemenx-fragment') ? only : null;
		}

		function preserveComponentNames (html) {
			return String(html || '').replace(/<([A-Z][A-Za-z0-9_.:-]*)(?=\s|\/?>)/g, function (match, name) {
				return '<' + name + ' data-elemenx-component="' + name + '"';
			});
		}

		/* The HTML parser writes attribute names in lower case; the SVG attributes that have capitals get them back. */
		var svgAttributeNames = {};

		['viewBox', 'preserveAspectRatio', 'textLength', 'lengthAdjust', 'gradientUnits', 'gradientTransform', 'patternUnits',
			'patternContentUnits', 'patternTransform', 'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'pathLength',
			'startOffset', 'spreadMethod', 'clipPathUnits', 'maskUnits', 'maskContentUnits', 'filterUnits', 'primitiveUnits',
			'stdDeviation', 'baseFrequency', 'numOctaves', 'tableValues', 'kernelMatrix', 'edgeMode', 'attributeName',
			'keyTimes', 'keySplines', 'repeatCount', 'calcMode'].forEach(function (name) {
			svgAttributeNames[name.toLowerCase()] = name;
		});

		function attributeName (node, name) {
			return node.namespaceURI === 'http://www.w3.org/2000/svg' && svgAttributeNames[name] ? svgAttributeNames[name] : name;
		}

		/*
		 * The DOM property a binding names. HTML reads the names of attributes in small letters, so [property.innerHTML]
		 * arrives as innerhtml: the property of the node with that name in any case is found on its prototype chain, once
		 * for each kind of element. A name the node does not have stays as it is (an expando of the page).
		 */
		var propertyNames = {};

		function propertyName (node, name) {
			var lower = name.toLowerCase();
			var key = (node.namespaceURI || '') + ' ' + node.nodeName + ' ' + lower;
			var object = node;
			var names;
			var i;

			if (name in node) return name;

			if (Object.prototype.hasOwnProperty.call(propertyNames, key)) return propertyNames[key];

			propertyNames[key] = name;

			while (object) {
				names = Object.getOwnPropertyNames(object);
				i = 0;

				while (i < names.length) {
					if (names[i].toLowerCase() === lower) {
						propertyNames[key] = names[i];

						return names[i];
					}

					i++;
				}

				object = Object.getPrototypeOf(object);
			}

			return name;
		}

		/*
		 * The parsed templates by their text: an instance clones the parse of its template, it does not parse it again (a
		 * page of a thousand icons parsed one template a thousand times). A thousand texts at most: templates made of data
		 * do not keep growing it. The Cache empties it with the definitions it unloads.
		 */
		var fragmentCache = {};
		var fragmentCount = 0;

		/*
		 * The plans of the templates by their text (as many as the parsed ones, emptied with them): where the compiler has
		 * something to read in a fresh root of a template, before its slots are filled. Elements and Texts are the paths
		 * (the indexes of the children from the root) of its elements with a binding, an event, a directive, a ref or a
		 * {{ }} in a value (Flags: which, as templateSpecial tells), and of its texts with {{ }}, in the order of the document; Inert the paths of the largest parts
		 * that have none of them, no Component and no slot (Structural passes them by); Slots whether it has a slot.
		 */
		var planCache = {};
		var planCount = 0;

		/* The inert parts of the templates of the instances being made: Structural passes each by once (it forgets it then). */
		var inertNodes = Runtime.InertNodes = new WeakSet();

		function templatePlan (root) {
			var plan = {Elements: [], Flags: [], Texts: [], Inert: [], Slots: false};

			/* Whether a part has something for the compiler: the paths of what it has go into the plan on the way. */
			function walk (node, path) {
				var busy = false;
				var children = [];
				var child = node.firstChild;
				var index = 0;
				var flag = templateSpecial(node);
				var i = 0;

				if (flag) {
					plan.Elements.push(path);
					plan.Flags.push(flag);

					busy = true;
				}

				if (componentDeclaration(node) || node.tagName.toLowerCase() === 'slot') {
					plan.Slots = plan.Slots || node.tagName.toLowerCase() === 'slot';
					busy = true;
				}

				while (child) {
					if (child.nodeType === 1) children.push({Path: path.concat(index), Busy: walk(child, path.concat(index))});
					else if (child.nodeType === 3 && child.nodeValue.indexOf('{{') !== -1) plan.Texts.push(path.concat(index));

					if (child.nodeType === 3 && child.nodeValue.indexOf('{{') !== -1)
						busy = true;

					child = child.nextSibling;

					index++;
				}

				while (i < children.length) {
					busy = busy || children[i].Busy;

					i++;
				}

				/* The children of a busy part that have nothing are inert: Structural need not go into them. */
				if (busy) {
					children.forEach(function (entry) {
						if (!entry.Busy)
							plan.Inert.push(entry.Path);
					});
				}

				return busy;
			}

			/* A root with nothing at all: each of its children is inert. */
			if (root.nodeType === 1 && !walk(root, [])) {
				Array.prototype.forEach.call(root.childNodes, function (child, index) {
					if (child.nodeType === 1)
						plan.Inert.push([index]);
				});
			}

			return plan;
		}

		/* The plan of a template (its text) made once, from the fresh root of an instance. */
		function componentPlan (key, root) {
			if (own(planCache, key)) return planCache[key];

			if (planCount >= 1000) {
				planCache = {};
				planCount = 0;
			}

			planCount++;

			return (planCache[key] = templatePlan(root));
		}

		/* The node of a path in a root, or null. */
		function planNode (root, path) {
			var node = root;
			var i = 0;

			while (node && i < path.length) {
				node = node.childNodes[path[i]];

				i++;
			}

			return node || null;
		}

		/* The nodes of a plan in a fresh root of its template, before its slots are filled: {Listed (by what they have), Texts, Inert}. */
		function planNodes (plan, root) {
			function nodes (paths) {
				return paths.map(function (path) {
					return planNode(root, path);
				});
			}

			return {Listed: templateListed(nodes(plan.Elements), plan.Flags), Texts: nodes(plan.Texts), Inert: nodes(plan.Inert)};
		}

		/* Two lists of nodes, each in the order of the document, as one in that order. */
		function documentMerge (a, b) {
			var result = [];
			var i = 0;
			var j = 0;

			while (i < a.length && j < b.length) {
				if (a[i].compareDocumentPosition(b[j]) & 4) result.push(a[i++]);
				else result.push(b[j++]);
			}

			return result.concat(a.slice(i), b.slice(j));
		}

		/*
		 * What the collectors read in a root whose slots are filled: the nodes of its plan still in it (a slot itself goes),
		 * and those of what filled its slots, a walk of each piece only, in the order of the document. {Listed, Texts}.
		 */
		function slottedNodes (root, planned, projected) {
			var listed = {Refs: [], Bindings: [], Directives: [], Events: []};
			var texts = [];
			var walker;
			var node;
			var text;
			var piece;
			var i = 0;

			function kept (each) {
				return each === root || root.contains(each);
			}

			while (i < projected.length) {
				node = projected[i];

				if (node.nodeType === 3 && node.nodeValue.indexOf('{{') !== -1) {
					texts.push(node);
				}
				else if (node.nodeType === 1) {
					piece = templateElements(node);

					Object.keys(listed).forEach(function (kind) {
						Array.prototype.push.apply(listed[kind], piece[kind]);
					});

					walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);

					while ((text = walker.nextNode())) {
						if (text.nodeValue.indexOf('{{') !== -1)
							texts.push(text);
					}
				}

				i++;
			}

			Object.keys(listed).forEach(function (kind) {
				listed[kind] = documentMerge(planned.Listed[kind].filter(kept), listed[kind]);
			});

			return {Listed: listed, Texts: documentMerge(planned.Texts.filter(kept), texts), Inert: planned.Inert};
		}

		function createFragment (html) {
			var key = String(html);
			var parsed = own(fragmentCache, key) ? fragmentCache[key] : null;

			if (!parsed) {
				if (fragmentCount >= 1000) {
					fragmentCache = {};
					fragmentCount = 0;
				}

				parsed = fragmentCache[key] = parseFragment(key);
				fragmentCount++;
			}

			return parsed.cloneNode(true);
		}

		/* The one element of a template among comments and blank text (they are not content of its root), or null. */
		function soleElement (content) {
			var element = null;
			var node = content.firstChild;

			while (node) {
				if (node.nodeType === 1 && element) return null;
				if (node.nodeType === 3 && /\S/.test(node.nodeValue)) return null;

				if (node.nodeType === 1)
					element = node;

				node = node.nextSibling;
			}

			return element;
		}

		function parseFragment (html) {
			var template = document.createElement('template');
			var protectedExpressions = protectExpressionAttributes(html);
			var only;

			template.innerHTML = preserveComponentNames(fragmentTags(normalizeSelfClosingComponents(protectedExpressions.Source)));

			/* The fragments first: the expressions of what they hold are restored with the others. */
			openFragments(template.content, wholeFragment(template.content));

			restoreExpressionAttributes(template.content, protectedExpressions.Expressions);

			only = template.content.childNodes.length === 1 ? template.content.firstChild : soleElement(template.content);

			/* An element of an SVG drawing, parsed inside the <svg> of svgSource and taken out of it. */
			if (only && only.nodeType === 1 && only.hasAttribute('data-elemenx-svg') && only.firstElementChild) return only.removeChild(only.firstElementChild);

			if (only)
				return template.content.removeChild(only);

			var root = document.createElement('div');

			while (template.content.firstChild) {
				root.appendChild(template.content.firstChild);
			}

			return root;
		}

		/* A Component (its object, and its Proxy) to the owner of its references: its own, or the one of the Component it is a part of. */
		var refOwners = new WeakMap();

		/*
		 * Whether an element of a template has something for the compiler: a [binding], an (event), a *directive, a #ref
		 * (the first character of its name tells) or a {{ }} in a value. The others give the collectors nothing to read.
		 */
		/* What an element has for the compiler, as flags: a #ref 1, a [binding] or a {{ }} 2, a *directive 4, an (event) 8; 0 for nothing. */
		function templateSpecial (node) {
			var attrs = node.attributes;
			var flags = 0;
			var code;
			var i = 0;

			while (i < attrs.length) {
				code = attrs[i].name.charCodeAt(0);

				if (code === 35) flags |= 1;
				else if (code === 91) flags |= 2;
				else if (code === 42) flags |= 4;
				else if (code === 40) flags |= 8;

				if (attrs[i].value.indexOf('{{') !== -1)
					flags |= 2;

				i++;
			}

			return flags;
		}

		/* The elements of a list by what they have (flags as templateSpecial gives them): {Refs, Bindings, Directives, Events}. */
		function templateListed (nodes, flags) {
			var listed = {Refs: [], Bindings: [], Directives: [], Events: []};
			var i = 0;

			while (i < nodes.length) {
				if (flags[i] & 1)
					listed.Refs.push(nodes[i]);

				if (flags[i] & 2)
					listed.Bindings.push(nodes[i]);

				if (flags[i] & 4)
					listed.Directives.push(nodes[i]);

				if (flags[i] & 8)
					listed.Events.push(nodes[i]);

				i++;
			}

			return listed;
		}

		/* The elements of a root the compiler reads, in the order of the document (the root first), by what they have: one walk for all the collectors. */
		function templateElements (root) {
			var nodes = [];
			var flags = [];
			var all;
			var flag;
			var i = 0;

			if (root.nodeType === 1 && (flag = templateSpecial(root))) {
				nodes.push(root);
				flags.push(flag);
			}

			if (root.querySelectorAll) {
				all = root.querySelectorAll('*');

				while (i < all.length) {
					if ((flag = templateSpecial(all[i]))) {
						nodes.push(all[i]);
						flags.push(flag);
					}

					i++;
				}
			}

			return templateListed(nodes, flags);
		}

		/* The #name of the elements of a root, in refs; owner marks whose references they are ($Refs). listed: the elements to read (all of them by default). */
		function collectRefs (root, refs, owner, listed) {
			var nodes = (listed || templateElements(root)).Refs;
			var i = 0;
			var j;
			var attrs;
			var name;

			while (i < nodes.length) {
				attrs = Array.prototype.slice.call(nodes[i].attributes);
				j = 0;

				while (j < attrs.length) {
					name = Runtime.Directive.Ref(attrs[j].name);

					if (name) {
						name = name.toLowerCase();

						refs[name] = nodes[i];

						nodes[i].__ElemenxRefName = name;
						/* Whose reference it is: $Refs keeps out the ones of a child Component placed inside. */
						nodes[i].__ElemenxRefOwner = owner;

						nodes[i].removeAttribute(attrs[j].name);
					}

					j++;
				}

				i++;
			}
		}

		function addBinding (bindings, source, binding) {
			binding.expression = source;
			binding.evaluate = compileExpression(source);

			bindings.push(binding);
		}

		/*
		 * True when node belongs to a structural subtree of root: Structural rebuilds that subtree from the pristine
		 * template, so its live bindings would only be evaluated in vain (against state the condition excludes).
		 * The children of a Component under the default structural host are its projection and stay with the owner.
		 */
		/*
		 * The structural directive of each element of a template, found once while the bindings of an instance are collected:
		 * every node asks for the ones of all its ancestors, and each answer reads every attribute of the element.
		 */
		var structuralSeen = null;

		function structuralOf (node) {
			var found;

			if (!structuralSeen)
				return Runtime.Directive.Find(node, 'structural');

			found = structuralSeen.get(node);

			if (found === undefined) {
				found = Runtime.Directive.Find(node, 'structural');

				structuralSeen.set(node, found);
			}

			return found;
		}

		function structuralOwned (node, root) {
			var current = node.nodeType === 1 ? node : node.parentNode;
			var directive;

			while (current && current.nodeType === 1) {
				directive = structuralOf(current);

				if (directive && (directive.Definition.Host !== 'structural' || !componentDeclaration(current))) return true;
				if (current === root) return false;

				current = current.parentNode;
			}

			return false;
		}

		/*
		 * The parts of a text with {{ }}: its plain texts (strings) and its expressions ({Source}), in order; \{{ is a
		 * {{ of the text itself, for a template that shows one. Null for a text without {{. Dynamic tells whether an
		 * expression is among the parts (a text of escapes only is a plain text).
		 */
		Runtime.Interpolation = function (text) {
			var pattern = /\\\{\{|\{\{\s*([\s\S]+?)\s*\}\}/g;
			var parts = [];
			var last = 0;
			var dynamic = false;
			var match;

			text = String(text);

			if (text.indexOf('{{') === -1) return null;

			while ((match = pattern.exec(text))) {
				if (match.index > last)
					parts.push(text.substring(last, match.index));

				if (match[1] === undefined) {
					parts.push('{{');
				}
				else {
					parts.push({Source: match[1]});

					dynamic = true;
				}

				last = pattern.lastIndex;
			}

			if (last < text.length)
				parts.push(text.substring(last));

			return {Parts: parts, Dynamic: dynamic};
		};

		/* The value of the parts of an interpolation: the one expression as it is, or the texts and the values as one text (null and undefined as nothing). */
		Runtime.InterpolationValue = function (parts, evaluate) {
			var result = '';
			var value;
			var i = 0;

			if (parts.length === 1 && typeof parts[0] !== 'string') return evaluate(parts[0]);

			while (i < parts.length) {
				value = typeof parts[i] === 'string' ? parts[i] : evaluate(parts[i]);
				result += value == null ? '' : String(value);

				i++;
			}

			return result;
		};

		/* The {{ }} of the texts of a root (listed: the texts with one, by the plan of its template; all of them by default). */
		function collectTextBindings (root, bindings, listed) {
			var walker = listed ? null : document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
			var nodes = [];
			var node;
			var fragment;
			var text;
			var interpolated;
			var part;
			var j;
			var bindingNode;

			if (listed) {
				listed.forEach(function (each) {
					if (each && !structuralOwned(each, root))
						nodes.push(each);
				});
			}

			while (walker && (node = walker.nextNode())) {
				if (!structuralOwned(node, root))
					nodes.push(node);
			}

			var i = 0;
			while (i < nodes.length) {
				node = nodes[i];
				text = node.nodeValue;

				interpolated = Runtime.Interpolation(text);

				/* A text of escapes only (\{{) is that text without them; one with expressions is its texts and a text node for each expression. */
				if (interpolated && !interpolated.Dynamic) {
					node.nodeValue = interpolated.Parts.join('');
				}
				else if (interpolated) {
					fragment = document.createDocumentFragment();
					j = 0;

					while (j < interpolated.Parts.length) {
						part = interpolated.Parts[j];

						if (typeof part === 'string') {
							fragment.appendChild(document.createTextNode(part));
						}
						else {
							bindingNode = document.createTextNode('');

							fragment.appendChild(bindingNode);

							addBinding(bindings, part.Source, {type: 'text', node: bindingNode});
						}

						j++;
					}

					node.parentNode.replaceChild(fragment, node);
				}

				i++;
			}
		}

		function classBindingState (node) {
			var state = {
				node: node,
				base: {},
				text: [],
				list: [],
				points: {},
				applied: {}
			};

			var i = 0;
			while (i < node.classList.length) {
				state.base[node.classList.item(i)] = true;
				state.applied[node.classList.item(i)] = true;

				i++;
			}

			return state;
		}

		function renderClassBinding (state) {
			var names = {};
			var name;
			var i = 0;

			for (name in state.base)
				if (own(state.base, name))
					names[name] = true;

			/* The classes of class="card {{Kind}}", then the ones of [class], then the ones of [class.name]. */
			while (i < state.text.length) {
				names[state.text[i]] = true;

				i++;
			}

			i = 0;
			while (i < state.list.length) {
				names[state.list[i]] = true;

				i++;
			}

			for (name in state.points) {
				if (!own(state.points, name)) continue;

				if (state.points[name]) names[name] = true;
				else delete names[name];
			}

			/*
			 * Only the classes of the template and its bindings change: a class that a Directive or a script put on
			 * the element (elemenx-draggable, an open state...) stays when the bindings render again.
			 */
			for (name in state.applied) {
				if (own(state.applied, name) && !own(names, name) && state.node.classList.contains(name))
					state.node.classList.remove(name);
			}

			/* A class there already is not added again: classList.add writes the attribute even then, and the styles are computed again. */
			for (name in names) {
				if (own(names, name) && !state.node.classList.contains(name))
					state.node.classList.add(name);
			}

			state.applied = names;
		}

		function styleBindingState (node) {
			var state = {
				node: node,
				base: {},
				text: {},
				map: {},
				points: {},
				managed: {}
			};

			var i = 0;
			var name;

			while (i < node.style.length) {
				name = node.style.item(i);

				state.base[name] = {
					value: node.style.getPropertyValue(name),
					priority: node.style.getPropertyPriority(name)
				};

				i++;
			}

			return state;
		}

		/*
		 * The style of the element as its attribute and its bindings say: the properties a binding no longer sets go back
		 * to the attribute (or go), and only the ones whose value differs are written. Removing them all and setting them
		 * again changed the style at every render, and the browser computed it again each time.
		 */
		function renderStyleBinding (state) {
			var wanted = {};
			var names = {};
			var style = state.node.style;
			var name;
			var item;

			for (name in state.base) {
				if (own(state.base, name))
					wanted[name] = state.base[name];
			}

			/* The properties of style="width: {{W}}px", then the ones of [style], then the ones of [style.name]. */
			for (name in state.text) {
				if (!own(state.text, name)) continue;

				names[name] = true;
				wanted[name] = state.text[name];
			}

			for (name in state.map) {
				if (!own(state.map, name)) continue;

				names[name] = true;
				wanted[name] = state.map[name] == null ? null : {value: String(state.map[name]), priority: ''};
			}

			for (name in state.points) {
				if (!own(state.points, name)) continue;

				names[name] = true;
				wanted[name] = state.points[name] == null ? null : {value: String(state.points[name]), priority: ''};
			}

			for (name in state.managed) {
				if (own(state.managed, name) && !own(wanted, name) && style.getPropertyValue(name) !== '')
					style.removeProperty(name);
			}

			for (name in wanted) {
				if (!own(wanted, name)) continue;

				item = wanted[name];

				if (item === null) {
					if (style.getPropertyValue(name) !== '')
						style.removeProperty(name);
				}
				else if (style.getPropertyValue(name) !== item.value || style.getPropertyPriority(name) !== (item.priority || '')) {
					style.setProperty(name, item.value, item.priority);
				}
			}

			state.managed = names;
		}

		/* The declarations of a text of style, as the browser reads them: {name: {value, priority}}. */
		var styleProbe = null;

		function styleDeclarations (text) {
			var result = {};
			var i = 0;
			var name;

			styleProbe = styleProbe || document.createElement('div').style;
			styleProbe.cssText = text;

			while (i < styleProbe.length) {
				name = styleProbe.item(i);
				result[name] = {value: styleProbe.getPropertyValue(name), priority: styleProbe.getPropertyPriority(name)};

				i++;
			}

			return result;
		}

		/*
		 * The plain attributes of an element with {{ }} (title="{{Hint}}", href="/users/{{ID}}", class="card {{Kind}}"):
		 * a binding of each, and the attribute taken away until it renders, so no browser reads it as it is (an <img>
		 * would ask for src="{{Image}}"). A class and a style are the base of [class.x] and [style.x] of the element.
		 * A Component declaration is left as it is: its attributes are its props.
		 */
		function collectInterpolatedAttributes (node, bindings, states) {
			var attrs = Array.prototype.slice.call(node.attributes);
			var i = 0;
			var name;
			var interpolated;

			while (i < attrs.length) {
				name = attrs[i].name;
				interpolated = /^[[(*#]/.test(name) || Runtime.Directive.Reserved(name) ? null : Runtime.Interpolation(attrs[i].value);

				if (interpolated && !interpolated.Dynamic) {
					node.setAttribute(name, interpolated.Parts.join(''));
				}
				else if (interpolated) {
					node.removeAttribute(name);

					if (name === 'class') {
						states.Class = states.Class || classBindingState(node);

						bindings.push(interpolationBinding({type: 'class-text', node: node, state: states.Class}, attrs[i].value, interpolated.Parts));
					}
					else if (name === 'style') {
						states.Style = states.Style || styleBindingState(node);

						bindings.push(interpolationBinding({type: 'style-text', node: node, state: states.Style}, attrs[i].value, interpolated.Parts));
					}
					else {
						bindings.push(interpolationBinding({type: 'attribute-text', node: node, name: name}, attrs[i].value, interpolated.Parts));
					}
				}

				i++;
			}
		}

		/* A binding of the parts of an interpolation: each expression compiled once, the value of all of them for each render. */
		function interpolationBinding (binding, source, parts) {
			var i = 0;

			while (i < parts.length) {
				if (typeof parts[i] !== 'string')
					parts[i].Evaluate = compileExpression(parts[i].Source);

				i++;
			}

			binding.expression = source;
			binding.evaluate = function (state) {
				return Runtime.InterpolationValue(parts, function (part) {
					return part.Evaluate(state);
				});
			};

			return binding;
		}

		function collectElementBindings (root, bindings, models, listed) {
			var nodes = (listed || templateElements(root)).Bindings;
			var i = 0;
			var j;
			var attrs;
			var attr;
			var key;
			var target;
			var separator;
			var namespace;
			var name;
			var classState;
			var styleState;
			var states;

			while (i < nodes.length) {
				if (structuralOwned(nodes[i], root)) {
					i++;

					continue;
				}

				states = {Class: null, Style: null};

				if (!componentDeclaration(nodes[i]))
					collectInterpolatedAttributes(nodes[i], bindings, states);

				attrs = Array.prototype.slice.call(nodes[i].attributes);
				j = 0;
				classState = states.Class;
				styleState = states.Style;

				while (j < attrs.length) {
					attr = attrs[j];
					target = Runtime.Directive.TwoWay(attr.name);

					if (target !== null) {
						if (target !== 'value' && target !== 'checked' && target !== 'selected')
							throw new Error('Elemenx invalid two-way binding target: [(' + target + ')]');

						key = attr.value;

						models.push({
							key: key,
							node: nodes[i],
							type: target
						});

						nodes[i].removeAttribute(attr.name);

						target = null;
					}
					else {
						target = Runtime.Directive.Binding(attr.name);
					}

					if (target !== null) {
						key = attr.value;
						separator = target.indexOf('.');
						namespace = separator === -1 ? target : target.substring(0, separator);
						name = separator === -1 ? null : target.substring(separator + 1);

						if (target === 'class') {
							if (!classState)
								classState = classBindingState(nodes[i]);

							addBinding(bindings, key, {type: 'class-list', node: nodes[i], state: classState});
						}
						else if (namespace === 'class' && name) {
							if (!classState)
								classState = classBindingState(nodes[i]);

							addBinding(bindings, key, {
								type: 'class-name',
								name: name,
								node: nodes[i],
								state: classState
							});
						}
						else if (target === 'style') {
							if (!styleState)
								styleState = styleBindingState(nodes[i]);

							addBinding(bindings, key, {type: 'style-map', node: nodes[i], state: styleState});
						}
						else if (namespace === 'style' && name) {
							if (!styleState)
								styleState = styleBindingState(nodes[i]);

							addBinding(bindings, key, {
								type: 'style-property',
								name: name,
								node: nodes[i],
								state: styleState
							});
						}
						else if (namespace === 'property' && name) {
							addBinding(bindings, key, {type: 'property', name: propertyName(nodes[i], name), node: nodes[i]});
						}
						else if (namespace === 'attribute' && name) {
							addBinding(bindings, key, {type: 'attribute', name: attributeName(nodes[i], name), node: nodes[i]});
						}
						else if (separator === -1 && target && !componentDeclaration(nodes[i])) {
							addBinding(bindings, key, {type: 'property', name: propertyName(nodes[i], target), node: nodes[i]});
						}
						else {
							/*
							 * Preserve non-DOM target paths for Component ownership. A plain [prop] on a Component
							 * declaration is a Component input, never a property of the placeholder element
							 * (<Select [options]> is parsed as a native <select>, whose options are read-only).
							 */
							j++;

							continue;
						}

						nodes[i].removeAttribute(attr.name);
					}

					j++;
				}

				i++;
			}
		}

		function collectCustomDirectives (root, directives, listed) {
			var nodes = (listed || templateElements(root)).Directives;
			var i = 0;
			var j;
			var attrs;
			var attr;
			var resolved;
			var parent;
			var skip;

			while (i < nodes.length) {
				skip = false;
				parent = nodes[i];

				while (parent) {
					if (parent.nodeType === 1 && structuralOf(parent)) {
						skip = true;

						break;
					}

					if (parent === root) break;

					parent = parent.parentNode;
				}

				if (!skip) {
					attrs = Array.prototype.slice.call(nodes[i].attributes);
					j = 0;

					while (j < attrs.length) {
						attr = attrs[j];
						resolved = Runtime.Directive.Resolve(attr.name);

						if (resolved && resolved.Definition.Kind === 'behavioral') {
							directives.push({
								Name: resolved.Name,
								Definition: resolved.Definition,
								Element: nodes[i],
								Expression: attr.value || ''
							});

							nodes[i].removeAttribute(attr.name);
						}

						j++;
					}
				}

				i++;
			}
		}

		/*
		 * A binding writes the DOM only where it differs (the text, the attribute, the property the element holds now): a
		 * write of the same value still makes the browser compute the styles of the element again. The DOM is what is
		 * compared, not the last value written, so a field the user changed takes the value of its state back.
		 */
		function applyBinding (binding, value) {
			var text;

			if (binding.type === 'text') {
				text = value == null ? '' : String(value);

				if (binding.node.nodeValue !== text)
					binding.node.nodeValue = text;
			}
			else if (binding.type === 'property') {
				if (binding.node[binding.name] !== value)
					binding.node[binding.name] = value;
			}
			else if (binding.type === 'attribute') {
				if (value == null) {
					if (binding.node.hasAttribute(binding.name))
						binding.node.removeAttribute(binding.name);
				}
				else if (binding.node.getAttribute(binding.name) !== String(value)) {
					binding.node.setAttribute(binding.name, String(value));
				}
			}
			/* title="{{Hint}}" is the value itself (null, undefined and false take the attribute away, true leaves it empty); title="{{A}}, {{B}}" is a text. */
			else if (binding.type === 'attribute-text') {
				text = value === true ? '' : value == null || value === false ? null : String(value);

				if (text === null) {
					if (binding.node.hasAttribute(binding.name))
						binding.node.removeAttribute(binding.name);
				}
				else if (binding.node.getAttribute(binding.name) !== text) {
					binding.node.setAttribute(binding.name, text);
				}
			}
			else if (binding.type === 'class-text') {
				binding.state.text = String(value == null || value === false ? '' : value).split(/\s+/).filter(function (word) {
					return word !== '';
				});

				renderClassBinding(binding.state);
			}
			else if (binding.type === 'style-text') {
				binding.state.text = styleDeclarations(value == null || value === false ? '' : String(value));

				renderStyleBinding(binding.state);
			}
			else if (binding.type === 'class-list') {
				if (value == null)
					value = [];

				if (!Array.isArray(value))
					throw new TypeError('[class] binding expects an Array');

				binding.state.list = [];

				/* An item may name several classes, as the attribute class does ('three position-1'): a DOMTokenList refused the space and the render threw. */
				var i = 0;
				while (i < value.length) {
					if (value[i] != null && String(value[i]))
						binding.state.list.push.apply(binding.state.list, String(value[i]).split(/\s+/).filter(function (word) {
							return word !== '';
						}));

					i++;
				}

				renderClassBinding(binding.state);
			}
			else if (binding.type === 'class-name') {
				binding.state.points[binding.name] = !!value;

				renderClassBinding(binding.state);
			}
			else if (binding.type === 'style-map') {
				if (value == null)
					value = {};

				if (typeof value !== 'object' || Array.isArray(value))
					throw new TypeError('[style] binding expects an Object');

				binding.state.map = Runtime.Assign({}, value);

				renderStyleBinding(binding.state);
			}
			else if (binding.type === 'style-property') {
				binding.state.points[binding.name] = value;

				renderStyleBinding(binding.state);
			}
		}

		function activateBindings (bindings, state, effects) {
			var i = 0;

			while (i < bindings.length) {
				(function (binding) {
					effects.push(Runtime.Effect(function () {
						var value;

						try {
							value = binding.evaluate(state);
						}
						catch (error) {
							value = undefined;

							if (!(error && error.name === 'ReferenceError') && global.console && console.error)
								console.error('Elemenx binding expression failed: ' + binding.expression, error);
						}

						applyBinding(binding, value);

						return value;
					}, true));
				})(bindings[i]);

				i++;
			}
		}

		function collectOutlets (root, outlets, listed) {
			var attribute = Runtime.Directive.AttributeForRole('outlet');
			var nodes = (listed || templateElements(root)).Directives.filter(function (node) {
				return node.hasAttribute(attribute);
			});
			var i = 0;
			var name;

			while (i < nodes.length) {
				name = nodes[i].getAttribute(attribute);

				if (name)
					outlets[name] = Runtime.Outlet(nodes[i]);

				nodes[i].removeAttribute(attribute);

				i++;
			}
		}

		/* Fills the slots of a root with what projection holds for each; returns the nodes it put in, in the order of the document. */
		function projectSlots (root, projection) {
			var slots = [];
			var found;
			var groups = projection && projection.Groups ? projection.Groups() : {};
			var used = {};
			var roots = [];
			var projected = [];
			var i;
			var j;
			var slot;
			var name;
			var nodes;
			var parent;
			var k;

			if (!root)
				return projected;

			if (root.nodeType) {
				roots.push(root);
			}
			else if (typeof root.length === 'number') {
				i = 0;

				while (i < root.length) {
					if (root[i] && root[i].nodeType) {
						roots.push(root[i]);
					}

					i++;
				}
			}

			i = 0;
			while (i < roots.length) {
				if (roots[i].nodeType === 1 && roots[i].tagName && roots[i].tagName.toLowerCase() === 'slot') {
					slots.push(roots[i]);
				}

				if (roots[i].querySelectorAll) {
					found = roots[i].querySelectorAll('slot');
					j = 0;

					while (j < found.length) {
						slots.push(found[j]);

						j++;
					}
				}

				i++;
			}

			i = 0;
			while (i < slots.length) {
				slot = slots[i];
				name = slot.getAttribute('name') || '';
				parent = slot.parentNode;
				nodes = used[name] ? [] : (groups[name] || []);
				used[name] = true;
				k = 0;

				if (parent) {
					while (k < nodes.length) {
						parent.insertBefore(nodes[k], slot);

						projected.push(nodes[k]);

						k++;
					}

					/* An empty slot leaves a placeholder: Structural maps live nodes to the pristine template by child index. */
					if (!nodes.length)
						parent.insertBefore(document.createComment('elemenx:slot'), slot);

					parent.removeChild(slot);
				}

				i++;
			}

			/* The slots are found in the order of the document, and each is filled in its place: so are its nodes. */
			return projected;
		}

		/* Component: instance helpers */
		function syncModel (values, model) {
			var value = values[model.key];

			if (model.type === 'checked') {
				value = !!value;

				if (model.node.checked !== value) {
					model.node.checked = value;
				}
			}
			else {
				value = value == null ? '' : String(value);

				if (model.node.value !== value) {
					model.node.value = value;
				}
			}
		}

		function syncModels (models, values) {
			var i = 0;

			while (i < models.length) {
				syncModel(values, models[i]);

				i++;
			}
		}

		function findRef (root, refs, name) {
			var key = String(name).toLowerCase();
			var ref = refs[key] || null;
			if (ref && root.contains(ref)) return ref;

			var nodes;
			var i = 0;

			ref = null;

			if (root.nodeType === 1 && root.__ElemenxRefName === key) {
				ref = root;
			}
			else if (root.querySelectorAll) {
				nodes = root.querySelectorAll('*');

				while (i < nodes.length) {
					if (nodes[i].__ElemenxRefName === key) {
						ref = nodes[i];

						break;
					}

					i++;
				}
			}

			if (ref) {
				refs[key] = ref;

				return ref;
			}

			delete refs[key];

			return null;
		}

		/* The (events) of the elements of a root (listed: the ones to read, all of them by default). */
		function bindEvents (root, api, listen, listed) {
			var nodes = (listed || templateElements(root)).Events;
			var i = 0;
			var j;
			var attrs;
			var attr;
			var eventName;

			while (i < nodes.length) {
				/* A Component declaration keeps its (events) for Structural, also while the Component is still loading. */
				if (nodes[i].hasAttribute('data-elemenx-component') || Runtime.ResolveComponentRegistered(Runtime.ComponentTag(nodes[i], api.$Application ? api.$Application() : null))) {
					i++;

					continue;
				}

				attrs = Array.prototype.slice.call(nodes[i].attributes);
				j = 0;

				while (j < attrs.length) {
					attr = attrs[j];

					eventName = Runtime.Directive.Event(attr.name);

					/* The handler is looked up when the event comes: $OnCreate may set it after the binding. */
					if (eventName !== null) {
						(function (node, eventName, methodName) {
							listen(node, eventName, function (e) {
								Runtime.CallHandler(api, methodName, [e, node]);
							});
						})(nodes[i], eventName, attr.value);

						nodes[i].removeAttribute(attr.name);
					}

					j++;
				}

				i++;
			}
		}

		function bindModels (models, values, effects, listen) {
			var i = 0;
			var model;
			var eventName;

			while (i < models.length) {
				model = models[i];
				eventName = model.type === 'value' ? 'input' : 'change';

				(function (model) {
					effects.push(Runtime.Effect(function () {
						syncModel(values, model);

						return values[model.key];
					}, true));

					listen(model.node, eventName, function () {
						var value;

						if (model.type === 'checked') {
							value = model.node.checked;
						}
						else {
							value = model.node.value;
						}

						values[model.key] = value;
					});
				})(model);

				i++;
			}
		}

		function activateCustomDirectives (customDirectives, api, values, effects) {
			var i = 0;
			var record;
			var context;
			var effect;
			var host;

			while (i < customDirectives.length) {
				record = customDirectives[i];
				host = Runtime.ComponentHosts.get(record.Element);

				/*
				 * On the tag of a Component, which an instance took the place of: the element of the instance, and the next
				 * ones (regression: *hotkey on a Button stayed on the tag gone from the page, and never pressed it).
				 */
				if (host) {
					record.Element = host.Element() || record.Element;

					(function (record) {
						host.Watch(function (element) {
							retargetDirectives([record], element);
						});
					})(record);
				}

				context = {
					Name: record.Name,
					Element: record.Element,
					Component: api,
					Expression: record.Expression,
					Value: undefined,
					Data: {}
				};

				record.Context = context;
				record.Owner = api;

				placeDirectives([record]);

				if (typeof record.Definition.$OnSleep === 'function' || typeof record.Definition.$OnWake === 'function') {
					record.Asleep = {
						Root: record.Element,
						Sleep: typeof record.Definition.$OnSleep === 'function' ? record.Definition.$OnSleep.bind(api, context) : null,
						Wake: typeof record.Definition.$OnWake === 'function' ? record.Definition.$OnWake.bind(api, context) : null
					};

					sleepAware.push(record.Asleep);
				}

				if (typeof record.Definition.$OnCreate === 'function') {
					record.Definition.$OnCreate.call(api, context);
				}

				(function (record, context) {
					var evaluate = record.Expression ? compileExpression(record.Expression) : null;

					effect = Runtime.Effect(function () {
						var value;

						if (evaluate) {
							try {
								value = evaluate(values);
							}
							catch (error) {
								value = undefined;

								if (!(error && error.name === 'ReferenceError') && global.console && console.error)
									console.error('Elemenx directive expression failed: *' + record.Name + '="' + record.Expression + '"', error);
							}
						}

						context.Value = value;

						if (typeof record.Definition.$OnUpdate === 'function') {
							record.Definition.$OnUpdate.call(api, context);
						}

						return value;
					}, true);

					record.Effect = effect;

					effects.push(effect);
				})(record, context);

				i++;
			}
		}

		/* Plain definition values (not $ keys, not methods): the initial state of an instance. */
		/*
		 * A value of a definition for one instance: a plain object or an array is copied, deep, so two instances never
		 * share one (Items: [] of each its own); anything else (a Date, a Map, an element, an object of a class) is kept.
		 */
		function instanceValue (value) {
			var copy;
			var key;
			var i = 0;

			if (Array.isArray(value)) {
				copy = [];

				while (i < value.length) {
					copy.push(instanceValue(value[i]));

					i++;
				}

				return copy;
			}

			if (!value || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) return value;

			copy = {};

			for (key in value) {
				if (own(value, key))
					copy[key] = instanceValue(value[key]);
			}

			return copy;
		}

		function definitionValues (definition) {
			var values = {};
			var key;

			for (key in definition) {
				if (own(definition, key) && key.charAt(0) !== '$' && typeof definition[key] !== 'function') {
					values[key] = instanceValue(definition[key]);
				}
			}

			return values;
		}

		/* Definition methods and $On* hooks become methods of the instance API. */
		/* The plain methods of a definition, as the instance has them now (one may replace them), over the names of the framework. */
		function expressionScope (definition, api) {
			var scope = Object.create(Runtime.TemplateGlobals);
			var name;

			for (name in definition) {
				if (own(definition, name) && typeof definition[name] === 'function' && name.charAt(0) !== '$') {
					(function (name) {
						scope[name] = function () {
							return api[name].apply(api, arguments);
						};
					})(name);
				}
			}

			return scope;
		}

		/*
		 * Calls the handler of an (event) when the event comes: a method of the Component, or a function its state holds
		 * (one $OnCreate set). A part of a *if or a row of a *for calls it on the Component that owns the state.
		 */
		Runtime.CallHandler = function (component, name, args) {
			var values = componentValues.get(component);

			name = String(name).replace(/^\s+|\s+$/g, '');

			if (!handlerName.test(name))
				return handlerExpression(component, name, args || []);

			if (typeof component[name] === 'function') {
				component[name].apply(component, args);

				return true;
			}

			if (!values || typeof values[name] !== 'function') return false;

			values[name].apply(stateOwners.get(component) || component, args);

			return true;
		};

		/* An (event) that names a handler: one name, as (click)="Save" has always been. */
		var handlerName = /^[A-Za-z_$][\w$]*$/;

		/*
		 * An (event) that is no name is an expression, run when the event comes: (click)="Pick(row)", (click)="Open =
		 * !Open", (input)="Query = $event.target.value". It sees the state of the instance and its methods, $event (the
		 * DOM event, or what a Component told with its event) and $node (the element, or the Component, that told it).
		 * In a part of a *if the state is the one of its owner. A row of a *for holds copies of the values of its owner:
		 * a name of the owner is written to the owner (the row has it again at the render that follows), and the names
		 * of the row itself (row, $index) stay its own.
		 */
		function handlerExpression (component, source, args) {
			var values = componentValues.get(component) || {};
			var owner = stateOwners.get(component);
			var shared = owner ? componentValues.get(owner) : null;
			var methods = expressionMethods.get(values) || (shared && expressionMethods.get(shared)) || Runtime.TemplateGlobals;
			var locals = {$event: args[0], $node: args[1]};
			var scope;

			if (shared === values)
				shared = null;

			/* A name of the owner the row has as it is (its copy), or that the row does not have. */
			function ownerName (key) {
				return !!shared && key in shared && (!(key in values) || values[key] === shared[key]);
			}

			scope = new Proxy(values, {
				/* Every name but the methods and the globals (Math, console) is a name of the state: an assignment to a new one lands there, not in the window. */
				has: function (target, key) {
					if (typeof key !== 'string') return false;

					return own(locals, key) || key in values || !!shared && key in shared || !(key in methods) && !(key in global);
				},
				get: function (target, key) {
					if (typeof key !== 'string') return undefined;
					if (own(locals, key)) return locals[key];

					return key in values || !shared ? values[key] : shared[key];
				},
				set: function (target, key, value) {
					if (own(locals, key)) locals[key] = value;
					else if (ownerName(key)) shared[key] = value;
					else values[key] = value;

					return true;
				}
			});

			expressionMethods.set(scope, methods);

			try {
				compileExpression(source)(scope);
			}
			catch (error) {
				if (global.console && console.error)
					console.error('Elemenx handler expression failed: ' + source, error);
			}

			return true;
		}

		/*
		 * New values of props, from the tag that declares a Component or from the page of a widget: its $OnProps hears
		 * them, with the props that changed, once its state holds them. Untracked, as the other hooks: what it reads does
		 * not tie it to the effect of its owner.
		 */
		Runtime.UpdateProps = function (component, changed) {
			var instance = component;

			component.$Update(changed);

			/*
			 * A deferred Component hears them once it is made; before, they are the props it is made with. It hears them
			 * under the names of its state ([label] is Label), as its definition spells them.
			 */
			while (instance && instance._Component && instance._Component() && instance._Component() !== instance) {
				if (instance._Definition && instance._Definition())
					changed = canonicalDeferredInput(changed, instance._Definition());

				instance = instance._Component();
			}

			if (instance && !instance._Component && typeof instance.$OnProps === 'function') {
				Runtime.Untracked(function () {
					instance.$OnProps(changed);
				});
			}
		};

		function copyComponentMethods (definition, target) {
			var methodName;

			for (methodName in definition) {
				if (own(definition, methodName) && typeof definition[methodName] === 'function' && (methodName.charAt(0) !== '$' || methodName.indexOf('$On') === 0)) {
					/*
					 * Methods belong to the Component API, never to reactive state.
					 * This is critical for DirectState structural children: their values
					 * object is the owner's reactive scope, so assigning through the API
					 * Proxy would mutate that scope while its structural effect is running.
					 */
					target[methodName] = definition[methodName];
				}
			}
		}

		/*
		 * A component root carrying a structural directive needs a stable
		 * owner node. Structural() compiles children of Component.Element(),
		 * so without this host a root *if would be skipped completely.
		 * Keep the host transparent to layout while allowing the real root to
		 * participate in the same structural ownership path as nested directives.
		 */
		/*
		 * found, when given, gets the text of the template (Key): its plan is kept under it. A template that is a <Fragment>
		 * is the root of a part (part: a row of a *for, the content of an *if), whose nodes stand in the page with no element
		 * of their own; the one of a Component has an element of its own that takes no room (display: contents).
		 */
		function componentRoot (template, found, part) {
			/* The blank around a template (the final newline of its file) is not content: the element alone is the root. */
			var text = resolveTemplate(template).replace(/^\s+|\s+$/g, '');
			var root = createFragment(text);
			var host;

			if (found)
				found.Key = part ? text + '\u0000part' : text;

			if (root.nodeType === 1 && root.tagName === 'ELEMENX-FRAGMENT' && !root.attributes.length) {
				if (part) {
					root.__ElemenxFragmentRoot = true;

					return root;
				}

				host = document.createElement('span');
				host.style.display = 'contents';

				while (root.firstChild) {
					host.appendChild(root.firstChild);
				}

				return host;
			}

			/* A structural host or a Component declaration at the root gets a host of its own, so it is compiled like a child. */
			if (root.nodeType !== 1 || (!Runtime.Directive.Find(root, 'structural') && !componentDeclaration(root))) return root;

			host = document.createElement('span');
			host.style.display = 'contents';
			host.__ElemenxStructuralRoot = true;

			host.appendChild(root);

			return host;
		}

		/*
		 * The element of a part made of a <Fragment> holds its nodes only while it is out of the page: placed, they stand in
		 * the parent between two comments of their own, and go back into it when it is taken away. Place, Detach, First and
		 * Last are those of any element too (an element is its own first and last node).
		 */
		function fragmentRange (element) {
			var range = element.__ElemenxRange;

			if (!range) {
				range = element.__ElemenxRange = {Start: document.createComment('elemenx:fragment'), End: document.createComment('elemenx:fragment:end')};

				element.insertBefore(range.Start, element.firstChild);
				element.appendChild(range.End);
			}

			return range;
		}

		/* The nodes of a range moved before a node of a parent (at its end without one), the comments that bound it with them. */
		function moveRange (range, parent, before) {
			var node = range.Start;
			var next;

			while (node) {
				next = node === range.End ? null : node.nextSibling;

				parent.insertBefore(node, before || null);

				node = next;
			}
		}

		Runtime.Place = function (element, parent, before) {
			if (element.__ElemenxFragmentRoot) moveRange(fragmentRange(element), parent, before);
			else parent.insertBefore(element, before || null);
		};

		Runtime.Detach = function (element) {
			var range = element.__ElemenxFragmentRoot ? fragmentRange(element) : null;

			if (range && range.Start.parentNode !== element) moveRange(range, element, null);
			else if (!range && element.parentNode) element.parentNode.removeChild(element);
		};

		Runtime.First = function (element) {
			return element.__ElemenxFragmentRoot ? fragmentRange(element).Start : element;
		};

		Runtime.Last = function (element) {
			return element.__ElemenxFragmentRoot ? fragmentRange(element).End : element;
		};

		/* Runs the effects in order: Run evaluates each one and starts tracking its dependencies. */
		function runEffects (effects) {
			var i = 0;

			while (i < effects.length) {
				effects[i].Run();

				i++;
			}
		}

		function destroyCustomDirectives (customDirectives, api) {
			var i = customDirectives.length - 1;
			var record;

			while (i >= 0) {
				record = customDirectives[i];

				if (record.Asleep)
					forgetSleepAware(record.Asleep);

				if (typeof record.Definition.$OnDestroy === 'function')
					record.Definition.$OnDestroy.call(api, record.Context);

				record.Destroyed = true;

				i--;
			}

			customDirectives.length = 0;
		}

		/* Directives set on the placeholder of a deferred component, kept with it to follow the element that comes. */
		function placeDirectives (records) {
			records.forEach(function (record) {
				if (!deferredPlaceholders.has(record.Element)) return;

				if (!placedDirectives.has(record.Element))
					placedDirectives.set(record.Element, []);

				placedDirectives.get(record.Element).push(record);
			});
		}

		/*
		 * Behavioral directives of the tag of a Component, onto the element its instance has now: each ends on the old
		 * element and starts again on the new one with its value.
		 */
		function retargetDirectives (records, to) {
			var moved = records.filter(function (record) {
				return !record.Destroyed && to && record.Element !== to;
			});

			moved.forEach(function (record) {
				var context = record.Context;

				if (typeof record.Definition.$OnDestroy === 'function')
					record.Definition.$OnDestroy.call(record.Owner, context);

				record.Element = to;
				context.Element = to;
				context.Data = {};

				if (record.Asleep)
					record.Asleep.Root = to;

				if (typeof record.Definition.$OnCreate === 'function')
					record.Definition.$OnCreate.call(record.Owner, context);

				if (typeof record.Definition.$OnUpdate === 'function')
					record.Definition.$OnUpdate.call(record.Owner, context);
			});

			placeDirectives(moved);
		}

		/*
		 * The placeholder of a deferred component gives its place to the element of the instance (or takes it back while
		 * the component reloads): the directives of its tag go along (regression: *hotkey on a Button that loaded later
		 * bound a span gone from the page).
		 */
		/*
		 * The class and the style the tag of a Component writes, on the root of its instance: {Class, Style}, texts or
		 * null. The classes and the properties it added before go when they change; the ones of the template stay.
		 */
		Runtime.RootAttributes = function (element, values, definition) {
			var placed = element.__ElemenxRoot || {Classes: [], Styles: []};
			var known = element.__ElemenxRootDefinition || definition || {};
			var classes = values.Class && !propNamed(known, 'class') ? String(values.Class).split(/\s+/).filter(function (name) {
				return name;
			}) : [];
			var styles = [];

			placed.Classes.forEach(function (name) {
				if (classes.indexOf(name) === -1)
					element.classList.remove(name);
			});

			classes.forEach(function (name) {
				element.classList.add(name);
			});

			String(!propNamed(known, 'style') && values.Style || '').split(';').forEach(function (declaration) {
				var colon = declaration.indexOf(':');
				var property = colon === -1 ? '' : declaration.substring(0, colon).trim();
				if (!property) return;

				styles.push(property);

				element.style.setProperty(property, declaration.substring(colon + 1).trim());
			});

			placed.Styles.forEach(function (property) {
				if (styles.indexOf(property) === -1)
					element.style.removeProperty(property);
			});

			element.__ElemenxRoot = {Classes: classes, Styles: styles, Values: values};
		};

		/* Whether a definition has a prop of a name in any case (Class for class). */
		function propNamed (definition, name) {
			var key;

			for (key in definition) {
				if (own(definition, key) && key.toLowerCase() === name) return true;
			}

			return false;
		}

		function moveDirectives (from, to, definition) {
			var records = placedDirectives.get(from);

			/* The class and the style of the tag go from the placeholder to the element of the instance, now that its definition is known. */
			if (definition && to && to.nodeType === 1)
				to.__ElemenxRootDefinition = definition;

			if (from.__ElemenxRoot && to && to.nodeType === 1)
				Runtime.RootAttributes(to, from.__ElemenxRoot.Values, definition);

			/* The #name of the tag goes with it, as the class and the style do. */
			if (from.__ElemenxRefName && to && to.nodeType === 1) {
				to.__ElemenxRefName = from.__ElemenxRefName;
				to.__ElemenxRefOwner = from.__ElemenxRefOwner;
			}

			if (!records) return;

			placedDirectives.delete(from);

			retargetDirectives(records, to);
		}

		/* Template and Component: inheritance */
		/*
		 * A Component extends another ($Extends: 'Button') and takes Traits ($Traits: ['Selectable']): reusable sets of
		 * props, methods and hooks (Elemenx.Trait). The layers merge once, when the Component is registered: the base,
		 * then the Traits in order, then the definition itself; a later layer wins a value or a method, the hooks
		 * ($OnCreate, $OnReady...) all run, the base first ($OnDestroy the other way round), $Meta merges its Props,
		 * Events, Methods, Slots and Children. The template is the one of the last layer that has one; the styles of
		 * every layer apply. this.$Super('Method', args...) calls the method of the layer under the one that runs.
		 * A base or a Trait not loaded yet (a part of the bundle, a file of the sources) is loaded on the first use.
		 */
		var traitRegistry = {};
		var inheritors = {};
		var waiting = {};
		var superStack = [];

		Elemenx.Trait = function (name, definition) {
			if (arguments.length === 1 && typeof name === 'string') return resolveTrait(name);

			if (typeof name !== 'string' || !name || !definition || typeof definition !== 'object')
				throw new Error('Elemenx.Trait expects (name) or (name, definition)');

			if (definition.$Template !== undefined || definition.$TemplateURL !== undefined || definition.$TemplateID !== undefined)
				throw new Error('Elemenx.Trait ' + name + ' has a template: a Trait gives props, methods and hooks');

			if (definition.$StyleURL && !definition.$DefinitionURL && Runtime.CurrentScriptURL())
				definition.$DefinitionURL = Runtime.CurrentScriptURL();

			definition.$StyleURL = Runtime.DefinitionURL(definition, definition.$StyleURL);
			traitRegistry[name] = definition;

			reinherit(name);

			return definition;
		};

		function resolveTrait (name) {
			if (own(traitRegistry, name)) return traitRegistry[name];

			if (Runtime.Bundle.Load('Trait', name) && own(traitRegistry, name)) return traitRegistry[name];

			return null;
		}

		/* The Traits of a definition, checked: their names in order. */
		function traitNames (name, definition) {
			var list = definition.$Traits;
			if (list === undefined || list === null) return [];

			if (!Array.isArray(list) || list.some(function (item) {
				return typeof item !== 'string' || !item;
			}))
				throw new Error('Elemenx Component ' + (name || 'the Component') + ': $Traits expects the names of Traits');

			return list;
		}

		/* What a definition needs and does not have yet: [{Type: 'Component' or 'Trait', Name}]. */
		function missingLayers (name, definition) {
			var missing = [];
			var base = definition.$Extends;
			var seen = {};

			function needTrait (trait) {
				var found;

				if (seen[trait]) return;

				seen[trait] = true;
				found = resolveTrait(trait);

				if (!found) missing.push({Type: 'Trait', Name: trait});
				else traitNames(trait, found).forEach(needTrait);
			}

			if (base !== undefined && (typeof base !== 'string' || !base))
				throw new Error('Elemenx Component ' + (name || 'the Component') + ': $Extends expects the name of a Component');

			if (base && name && base === name)
				throw new Error('Elemenx Component ' + name + ': $Extends makes a cycle: ' + name + ', ' + name);

			if (base && !Runtime.ComponentDefinition(base) && !(Runtime.Bundle.Load('Component', base) && Runtime.ComponentDefinition(base)))
				missing.push({Type: 'Component', Name: base});

			traitNames(name, definition).forEach(needTrait);

			return missing;
		}

		/* A base that waits for its own base, back to the name: a cycle, told before anything waits for ever. */
		function checkCycle (name, base) {
			var chain = [name];
			var at = base;

			while (at) {
				chain.push(at);

				if (at === name)
					throw new Error('Elemenx Component ' + name + ': $Extends makes a cycle: ' + chain.join(', '));

				at = waiting[at];
			}
		}

		/* The $Meta of two layers: the later wins its texts, the Props, Events, Methods, Slots and Children add up. */
		function mergeMeta (under, over) {
			var result = {};
			var key;
			var events;

			if (!under || typeof under !== 'object') return over;
			if (!over || typeof over !== 'object') return under;

			for (key in under) {
				if (own(under, key))
					result[key] = under[key];
			}

			for (key in over) {
				if (own(over, key))
					result[key] = over[key];
			}

			result.Props = Runtime.Assign(Runtime.Assign({}, under.Props || {}), over.Props || {});

			if (Array.isArray(under.Events || []) && Array.isArray(over.Events || [])) {
				result.Events = union(under.Events || [], over.Events || []);
			}
			else {
				events = {};

				[under.Events, over.Events].forEach(function (list) {
					if (Array.isArray(list)) {
						list.forEach(function (event) {
							if (!own(events, event))
								events[event] = '';
						});
					}
					else {
						Runtime.Assign(events, list || {});
					}
				});

				result.Events = events;
			}

			['Methods', 'Slots', 'Children'].forEach(function (field) {
				if (under[field] || over[field])
					result[field] = union(under[field] || [], over[field] || []);
			});

			return result;
		}

		function union (a, b) {
			return a.concat(b.filter(function (item) {
				return a.indexOf(item) === -1;
			}));
		}

		/* Hooks of several layers: each in turn (the base first, or last for $OnDestroy), the last value returned. */
		function chainHooks (key, list) {
			var ordered = key === '$OnDestroy' ? list.slice().reverse() : list;
			if (ordered.length === 1) return ordered[0];

			return function () {
				var result;
				var value;
				var i = 0;

				while (i < ordered.length) {
					value = ordered[i].apply(this, arguments);

					if (value !== undefined)
						result = value;

					i++;
				}

				return result;
			};
		}

		/* A method over others: while it runs, $Super of its name reaches the one under it. */
		function layered (key, list, index) {
			var method = list[index];

			if (index === 0) return method;

			return function () {
				superStack.push({Key: key, List: list, Index: index});

				try {
					return method.apply(this, arguments);
				}
				finally {
					superStack.pop();
				}
			};
		}

		Runtime.CallSuper = function (target, name, method, args) {
			var i = superStack.length - 1;
			var entry = null;

			while (i >= 0 && !entry) {
				if (superStack[i].Key === method)
					entry = superStack[i];

				i--;
			}

			if (!entry || entry.Index <= 0)
				throw new Error('Elemenx $Super: ' + (name || 'the Component') + ' has no ' + method + ' under the one that runs');

			return layered(method, entry.List, entry.Index - 1).apply(target, args);
		};

		/* The style of a layer under the last one: placed under the name of that layer, once. */
		function layerStyle (layer) {
			var definition = layer.Definition;
			var key = (layer.Type === 'Trait' ? 'trait:' : 'component:') + layer.Name;

			if (definition.$Style !== undefined) {
				definition.$StyleKey = definition.$StyleKey || key;

				Runtime.AddStyle(definition.$StyleKey, {Text: String(definition.$Style)});
			}
			else if (definition.$StyleURL) {
				loadStyleURL(definition.$StyleURL, function (error, css) {
					if (error || !global.document) return;

					definition.$StyleKey = definition.$StyleKey || key;

					Runtime.AddStyle(definition.$StyleKey, {Text: String(css)});
				});
			}
		}

		/* The definition of the layers of a Component, merged: the one the factory is made of. */
		function composeDefinition (name, definition) {
			var layers = [];
			var seen = {};
			var result = {};
			var hooks = {};
			var methods = {};
			var templated = null;
			var styled = null;

			function addTrait (trait) {
				var found = resolveTrait(trait);

				if (seen[trait]) return;

				if (!found)
					throw new Error('Elemenx Component ' + (name || 'the Component') + ': unknown Trait ' + trait);

				seen[trait] = true;

				traitNames(trait, found).forEach(addTrait);

				layers.push({Type: 'Trait', Name: trait, Definition: found});
			}

			if (definition.$Extends) {
				if (!Runtime.ComponentDefinition(definition.$Extends))
					throw new Error('Elemenx Component ' + (name || 'the Component') + ': unknown base ' + definition.$Extends + ' in $Extends');

				layers.push({Type: 'Component', Name: definition.$Extends, Definition: Runtime.ComponentDefinition(definition.$Extends)});
			}

			traitNames(name, definition).forEach(addTrait);

			layers.push({Type: 'Own', Name: name, Definition: definition});

			layers.forEach(function (layer) {
				var source = layer.Definition;
				var key;
				var value;

				if (source.$Template !== undefined || source.$TemplateURL || source.$TemplateID)
					templated = layer;

				if (source.$Style !== undefined || source.$StyleURL)
					styled = layer;

				for (key in source) {
					if (!own(source, key) || /^\$(Extends|Traits|Layers|Template|TemplateURL|TemplateID|Style|StyleURL|StyleKey|DefinitionURL)$/.test(key)) continue;

					value = source[key];

					if (key === '$Meta') result.$Meta = mergeMeta(result.$Meta, value);
					else if (/^\$On[A-Z]/.test(key) && typeof value === 'function') (hooks[key] = hooks[key] || []).push(value);
					else if (typeof value === 'function' && key.charAt(0) !== '$') (methods[key] = methods[key] || []).push(value);
					else result[key] = value;
				}
			});

			Object.keys(hooks).forEach(function (key) {
				result[key] = chainHooks(key, hooks[key]);
			});

			Object.keys(methods).forEach(function (key) {
				result[key] = layered(key, methods[key], methods[key].length - 1);
			});

			/* The template of the last layer that has one; a base whose template is the one of its name keeps it by that name. */
			if (templated) {
				['$Template', '$TemplateURL', '$TemplateID'].forEach(function (key) {
					if (templated.Definition[key] !== undefined)
						result[key] = templated.Definition[key];
				});

				if (templated.Type === 'Component' && result.$Template === undefined && !result.$TemplateURL && !result.$TemplateID)
					result.$TemplateID = templated.Name;
			}
			else if (layers[0].Type === 'Component') {
				result.$TemplateID = layers[0].Name;
			}

			if (styled) {
				['$Style', '$StyleURL', '$StyleKey'].forEach(function (key) {
					if (styled.Definition[key] !== undefined)
						result[key] = styled.Definition[key];
				});
			}

			layers.forEach(function (layer) {
				if (layer !== styled && layer.Type !== 'Own' && (layer.Definition.$Style !== undefined || layer.Definition.$StyleURL))
					layerStyle(layer);
			});

			/* What it is made of, for the tools: not $Extends, or a definition made again of this one would merge twice. */
			if (definition.$DefinitionURL)
				result.$DefinitionURL = definition.$DefinitionURL;

			result.$Layers = layers.slice(0, -1).map(function (layer) {
				return {Type: layer.Type, Name: layer.Name};
			});

			return result;
		}

		/* The Components made of a base or a Trait registered again (a reload) are made again of the new one. */
		function reinherit (base) {
			var names = inheritors[base] || [];

			inheritors[base] = [];

			names.forEach(function (child) {
				if (child.Name !== base)
					Elemenx.Component(child.Name, child.Definition);
			});
		}

		function remember (name, definition) {
			var bases = (definition.$Extends ? [definition.$Extends] : []).concat(traitNames(name, definition));

			bases.forEach(function (base) {
				inheritors[base] = (inheritors[base] || []).filter(function (child) {
					return child.Name !== name;
				}).concat([{Name: name, Definition: definition}]);
			});
		}

		/* Loads what a definition misses (a part of the bundle, a file of the sources), then calls back. */
		function loadLayers (missing, application, callback) {
			var left = missing.length;
			var failed = null;

			function done (error) {
				if (error && !failed)
					failed = error;

				left--;

				if (!left)
					callback(failed);
			}

			if (!left) {
				callback(null);

				return;
			}

			missing.forEach(function (item) {
				var factory;

				if (item.Type === 'Trait') {
					if (Runtime.Bundle.Deferred('Trait', item.Name)) Runtime.Bundle.Fetch('Trait', item.Name, done);
					else if (Runtime.Discovery && application) Runtime.Discovery.Load(application, 'Trait', item.Name, false, done);
					else done(new Error('Elemenx: unknown Trait ' + item.Name));

					return;
				}

				factory = Runtime.ResolveComponent(item.Name);

				if (!factory) done(new Error('Elemenx Component: unknown base ' + item.Name + ' in $Extends'));
				else if (factory.ElemenxResolve) factory.ElemenxResolve(application, done);
				else if (Runtime.Bundle.Deferred('Component', item.Name)) Runtime.Bundle.Fetch('Component', item.Name, done);
				else if (Runtime.Discovery && application) Runtime.Discovery.Load(application, 'Component', item.Name, false, done);
				else done(Runtime.ComponentDefinition(item.Name) ? null : new Error('Elemenx Component: unknown base ' + item.Name + ' in $Extends'));
			});
		}

		/* A Component whose base or Traits are not here yet: a placeholder, made of them once they are loaded. */
		function createInheritingFactory (name, definition, missing) {
			var lazy = function (data, slotProjection, options) {
				return deferredComponent(function (ready) {
					lazy.ElemenxResolve(options && options.Application ? options.Application : null, function (error) {
						var factory = Runtime.ResolveComponentRegistered(name);

						ready(error || (factory ? null : new Error('Elemenx unknown Component: ' + name)), factory);
					});
				}, data, slotProjection, options);
			};

			lazy.ComponentName = name;
			lazy.ElemenxLazy = true;

			lazy.ElemenxResolve = function (application, callback) {
				loadLayers(missing, application, function (error) {
					var more;

					if (error) {
						callback(error);

						return;
					}

					try {
						more = missingLayers(name, definition);

						if (more.length) {
							missing = more;

							lazy.ElemenxResolve(application, callback);

							return;
						}

						delete waiting[name];

						if (componentRegistry[name] === lazy)
							CreateComponentFactory(name, definition);
					}
					catch (failure) {
						callback(failure);

						return;
					}

					callback(null);
				});
			};

			if (name)
				componentRegistry[name] = lazy;

			return lazy;
		}

		/* Component: factory */
		/* A component whose template or style is not inline: resources load on first use, then a regular factory takes over. */
		function needsRemoteResources (name, definition) {
			if (definition.$Template === undefined && (definition.$TemplateURL || definition.$TemplateID || name)) return true;

			return !!(definition.$StyleURL && definition.$Style === undefined);
		}

		/* The definitions a Component of a template URL is made of, by the name of that Component. */
		var remoteNames = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

		function createRemoteFactory (name, definition, generation) {
			var templateID;
			var remoteFactory = function (data, slotProjection, options) {
				var component = deferredComponent(function (ready) {
					function finish (html, css) {
						var localDefinition = {};
						var localFactory;
						var key;

						/*
						 * The style of the definition is placed once, under its name: an instance that took $Style
						 * along would place it again under a key of its own, one more stylesheet for every instance.
						 */
						for (key in definition) {
							if (own(definition, key) && key !== '$TemplateURL' && key !== '$StyleURL' && key !== '$DefinitionURL' && key !== '$StyleKey' && key !== '$Style') {
								localDefinition[key] = definition[key];
							}
						}

						if (html !== undefined)
							localDefinition.$Template = html;

						if (css !== undefined) {
							definition.$Style = css;

							installComponentStyle(name, definition, css);
						}

						localFactory = CreateComponentFactory(null, localDefinition, generation);

						/* Its instances are of the name of the Component that loaded it: the key of its state is of that name (SSR). */
						if (remoteNames)
							remoteNames.set(localDefinition, name);

						ready(null, localFactory);
					}

					function withTemplate (error, html) {
						if (error) {
							ready(error);

							return;
						}

						loadStyle(html);
					}

					function loadStyle (html) {
						if (!definition.$StyleURL || definition.$Style !== undefined) {
							finish(html, definition.$Style);

							return;
						}

						loadStyleURL(definition.$StyleURL, function (error, css) {
							if (error) {
								ready(error);

								return;
							}

							finish(html, css);
						});
					}

					if (definition.$TemplateURL && definition.$Template === undefined) {
						loadTemplateURL(definition.$TemplateURL, false, withTemplate);
					}
					else if (definition.$Template === undefined) {
						templateID = definition.$TemplateID || name;

						Runtime.Template.Resolve(templateID, withTemplate);
					}
					else {
						loadStyle(definition.$Template);
					}
				}, data, slotProjection, options);

				if (name && !componentReloading)
					track(component);

				if (name)
					useComponent(name, component);

				return component;
			};

			/* Reload walks the live instances of a name, so a destroyed instance must leave that list. */
			function track (component) {
				var destroy = component.$Destroy;

				trackComponentInstance(name, component);

				component.$Destroy = function () {
					untrackComponentInstance(name, component);

					return destroy.apply(component, arguments);
				};
			}

			remoteFactory.ComponentName = name;
			remoteFactory.Definition = definition;

			if (name)
				componentRegistry[name] = remoteFactory;

			return remoteFactory;
		}

		function CreateComponentFactory (name, definition, generationOverride) {
			var inherited;
			var messagingInstanceSequence = 0;
			var previousFactory = name ? componentRegistry[name] : null;
			var generation = generationOverride !== undefined ? generationOverride : (name ? (componentGenerations[name] || 0) : 0);

			definition = definition || {};

			if (name && (definition.$TemplateURL || definition.$StyleURL) && !definition.$DefinitionURL && Runtime.CurrentScriptURL()) {
				definition.$DefinitionURL = Runtime.CurrentScriptURL();
			}

			definition.$TemplateURL = Runtime.DefinitionURL(definition, definition.$TemplateURL);
			definition.$StyleURL = Runtime.DefinitionURL(definition, definition.$StyleURL);

			/* A Component of a base or of Traits: their layers merged, once they are all here. */
			if (definition.$Extends !== undefined || definition.$Traits !== undefined) {
				inherited = missingLayers(name, definition);

				if (name)
					remember(name, definition);

				if (inherited.length) {
					if (name && definition.$Extends && inherited.some(function (item) {
						return item.Type === 'Component';
					})) {
						checkCycle(name, definition.$Extends);

						waiting[name] = definition.$Extends;
					}

					return createInheritingFactory(name, definition, inherited);
				}

				delete waiting[name];

				definition = composeDefinition(name, definition);
			}

			if (generationOverride === undefined && name && previousFactory && !previousFactory.ElemenxLazy)
				generation++;

			if (name)
				componentGenerations[name] = generation;

			if (needsRemoteResources(name, definition))
				return createRemoteFactory(name, definition, generation);

			if (definition.$Style !== undefined)
				installComponentStyle(name, definition, definition.$Style);

			function factory (data, slotProjection, options) {
				/* Instance: definition values and template */
				var startedAt = new Date();
				var directState = options && options.DirectState === true;
				var initialValues = directState ? {} : definitionValues(definition);
				var found = {Key: ''};
				var root = componentRoot(definition.$Template, found, directState);
				/* Where the compiler has something to read, by the plan of the template: found before the slots are filled. */
				var plan = componentPlan(found.Key, root);
				var planned = planNodes(plan, root);

				/*
				 * Preserve the untouched component DOM before projection/binding/
				 * structural processing. Structural receives this explicitly; it is
				 * never reached through an outer lexical scope.
				 */
				var pristineRoot = root.cloneNode(true);

				/* Instance: state */
				var refs = {};
				/* The references of a part of a Component (a row of its *for, the content of its *if) are the Component's, for $Refs. */
				var refOwner = (directState && options.Owner && refOwners.get(options.Owner)) || refs;
				var outlets = {};
				var bindings = [];
				var models = [];
				var customDirectives = [];
				var values = directState
					? (data && data.__raw__ ? data : Runtime.Reactive(data || {}))
					: Runtime.Reactive(
						options && options.RoutePacket
							? {$Path: '', $Params: {}, $Query: {}, $Hash: ''}
							: {}
					);
				var routeContextReady = false;
				var effects = [];
				var children = [];
				var listeners = [];
				var destroyed = false;
				var structural = null;
				var parentComponent = null;
				var componentEvents = {};
				/* The names of the props of the tag the definition does not declare ($Open). */
				var openNames = {};
				var asleep = null;
				var seenOuter;
				var listed;
				var api;

				/* Instance: template compilation (a template without a slot has nothing to fill) */
				if (plan.Slots)
					planned = slottedNodes(root, planned, projectSlots(root, slotProjection));

				seenOuter = structuralSeen;
				structuralSeen = new Map();

				try {
					/*
					 * The elements the collectors read: those of the plan, and in a template with a slot those of what fills it
					 * too (slottedNodes). Most elements of a template have nothing for them.
					 */
					listed = planned.Listed;

					collectRefs(root, refs, refOwner, listed);

					collectOutlets(root, outlets, listed);

					collectTextBindings(root, bindings, planned.Texts);

					collectElementBindings(root, bindings, models, listed);

					collectCustomDirectives(root, customDirectives, listed);
				}
				finally {
					structuralSeen = seenOuter;
				}

				/* Instance: API methods */
				function Batch (callback) {
					if (destroyed || typeof callback !== 'function') return api;

					Runtime.BatchReactive(function () {
						callback.call(api, values);
					});

					return api;
				}

				/* The element named #name; with instance true the instance of the Component of it. */
				function Ref (name, instance) {
					return referred(findRef(root, refs, name), instance);
				}

				/*
				 * Every element of the Component named #name (the rows of a *for), in the order of the document; with instance
				 * true the instances of the Components among them.
				 */
				function Refs (name, instance) {
					var key = String(name).toLowerCase();
					var found = [];
					var nodes;
					var i = 0;

					if (root.nodeType === 1 && root.__ElemenxRefName === key && root.__ElemenxRefOwner === refOwner)
						found.push(root);

					nodes = root.querySelectorAll ? root.querySelectorAll('*') : [];

					while (i < nodes.length) {
						if (nodes[i].__ElemenxRefName === key && nodes[i].__ElemenxRefOwner === refOwner)
							found.push(nodes[i]);

						i++;
					}

					return referredAll(found, instance);
				}

				/* An event of a source (Event sources) starts it on the element; released with the listener. */
				function listen (node, name, callback) {
					node.addEventListener(name, callback);

					listeners.push({node: node, name: name, callback: callback, release: Runtime.AttachEventSource(node, name)});
				}

				function updateRouteContext (packet) {
					if (!packet) return;

					Runtime.BatchReactive(function () {
						values.$Path = packet.Path;
						values.$Params = packet.Params;
						values.$Query = packet.Query;
						values.$Hash = packet.Hash;

						routeContextReady = true;
					});
				}

				function Update (next) {
					if (destroyed) return api;

					next = next || {};

					var key;

					Runtime.BatchReactive(function () {
						for (key in next) {
							if (own(next, key)) {
								if (!directState && String(key).charAt(0) === '$')
									throw new Error('Elemenx component value uses reserved $ namespace: ' + key);

								if (!directState && !own(definition, key))
									openNames[key] = true;

								values[key] = next[key];
							}
						}
					});

					/*
					 * Structural records are reactive consumers now. Proxy triggers
					 * only records whose expressions actually depend on changed
					 * state; no component-wide Structural.Update() here.
					 */
					return api;
				}

				function On (name, callback) {
					if (!name || typeof callback !== 'function') return api;

					if (!componentEvents[name])
						componentEvents[name] = [];

					componentEvents[name].push(callback);

					return api;
				}

				/*
				 * A change of a value (the event change) also goes up the DOM from the root of the component as the event
				 * elemenx-change with the value in its detail, after the listeners: a form around it hears every field.
				 */
				function Emit (name, data) {
					var list = componentEvents[name];
					var i = 0;
					var copy = list ? list.slice(0) : [];

					while (i < copy.length) {
						Runtime.Notify(copy[i], api, [data, api]);

						i++;
					}

					if (name === 'change' && root && typeof global.CustomEvent === 'function')
						root.dispatchEvent(new global.CustomEvent('elemenx-change', {bubbles: true, detail: data}));

					return api;
				}

				function Parent (value) {
					if (arguments.length) {
						parentComponent = value || null;

						return api;
					}

					return parentComponent;
				}

				function Router () {
					return Runtime.RouterFor(api);
				}

				function Destroy () {
					var part = Runtime.CopyParts.get(api);

					if (destroyed) return;

					destroyed = true;

					/* A copy ($Copy) takes the part it was made in with it. */
					if (part) {
						Runtime.CopyParts.delete(api);

						part.$Destroy();
					}

					if (elementInstances.get(root) === api)
						elementInstances.delete(root);

					Runtime.HeadForget(api);

					Runtime.DetachRouterOwner(api);

					if (structural) {
						structural.Destroy();
						structural = null;
					}

					var i = effects.length - 1;
					while (i >= 0) {
						effects[i].Destroy();

						i--;
					}

					effects.length = 0;

					Runtime.DestroyOwnerResources(api);

					destroyCustomDirectives(customDirectives, api);

					if (asleep)
						forgetSleepAware(asleep);

					/* Untracked as $OnCreate and $OnReady: a row of a *for goes while the effect of the list runs. */
					if (definition.$OnDestroy) {
						Runtime.Untracked(function () {
							definition.$OnDestroy.call(api);
						});
					}

					i = listeners.length - 1;

					while (i >= 0) {
						listeners[i].node.removeEventListener(listeners[i].name, listeners[i].callback);

						if (listeners[i].release)
							listeners[i].release();

						i--;
					}

					listeners.length = 0;

					for (var outletName in outlets)
						if (own(outlets, outletName))
							outlets[outletName].Destroy();

					i = children.length - 1;

					while (i >= 0) {
						children[i].$Destroy();

						i--;
					}

					children.length = 0;

					Runtime.Detach(root);
				}

				/* Instance: API object */
				var apiTarget = {
					$Generation: function () {
						return generation;
					},
					$StartedAt: function () {
						return new Date(startedAt.getTime());
					},
					$Application: function () {
						var parent = Parent();
						if (parent && parent.$Application) return parent.$Application();

						return options && options.Application ? options.Application : null;
					},
					$Element: function () {
						return root;
					},
					$Ref: Ref,
					$Refs: Refs,
					$On: On,
					$Emit: Emit,
					$Parent: Parent,
					$Router: Router,
					$Service: Runtime.Service,
					$Title: function (value) {
						if (!arguments.length)
							return Elemenx.Title();

						Runtime.HeadSet(api, 'Title', value, values);

						return Elemenx;
					},
					$Icon: function (value) {
						if (!arguments.length)
							return Elemenx.Icon();

						Runtime.HeadSet(api, 'Icon', value, values);

						return Elemenx;
					},
					$Batch: Batch,
					$Update: Update,
					$Copy: function (props) {
						var make = options && options.Copy;

						if (!definition.$Copyable)
							throw new Error('Elemenx $Copy: ' + (name || 'the Component') + ' is not $Copyable');

						if (!make)
							throw new Error('Elemenx $Copy: ' + (name || 'the Component') + ' was not made from a tag of a template');

						return make(props);
					},
					$Super: function (method) {
						return Runtime.CallSuper(api, name, method, Array.prototype.slice.call(arguments, 1));
					},
					$Open: function () {
						var result = {};
						var key;

						if (!definition.$Open)
							throw new Error('Elemenx $Open: ' + (name || 'the Component') + ' is not $Open');

						for (key in openNames) {
							if (own(openNames, key))
								result[key] = values[key];
						}

						return result;
					},
					$Destroy: Destroy
				};

				api = apiTarget;

				if (!directState) {
					api = new Proxy(apiTarget, {
						get: function (target, key) {
							if (componentRouteContext[key])
								return routeContextReady ? values[key] : undefined;

							if (key in target)
								return target[key];

							return values[key];
						},
						set: function (target, key, value) {
							if (destroyed && !(String(key).charAt(0) === '$' || key in target)) return true;

							if (String(key).charAt(0) === '$' || key in target) {
								target[key] = value;

								return true;
							}

							values[key] = value;

							return true;
						},
						has: function (target, key) {
							return key in target || key in values;
						}
					});
				}

				if (root && root.nodeType === 1)
					elementInstances.set(root, api);

				refOwners.set(api, refOwner);
				refOwners.set(apiTarget, refOwner);

				/* Instance: ownership and router */
				Runtime.AttachOwnerFacades(api, name || 'Component', messagingInstanceSequence++);

				/* The Cache unloaded the stylesheet of an idle definition of code: its next instance places it again. */
				if (name && definition.$Style !== undefined && componentUse[name] && componentUse[name].Evicted)
					installComponentStyle(name, definition, definition.$Style);

				if (definition.$OnSleep || definition.$OnWake) {
					asleep = {
						Root: root,
						Sleep: definition.$OnSleep ? definition.$OnSleep.bind(api) : null,
						Wake: definition.$OnWake ? definition.$OnWake.bind(api) : null
					};

					sleepAware.push(asleep);
				}

				componentOutlets.set(api, outlets);
				componentValues.set(api, values);
				componentRouteUpdaters.set(api, updateRouteContext);

				if (Runtime.ActiveRouter)
					Runtime.AttachRouter(api, Runtime.ActiveRouter);

				/*
				 * Public component methods live on the instance as well as being
				 * callable from (event) handlers. This makes internal calls such
				 * as this.Refresh() valid and keeps the definition object useful as
				 * the component's method table.
				 */
				copyComponentMethods(definition, apiTarget);

				/*
				 * The expressions of the template call the methods of the definition ({{Format(Price)}}); a part of a *if
				 * shares this state and sees them as well. An instance that holds the state of its owner only points to it.
				 */
				if (!directState) {
					expressionMethods.set(values, expressionScope(definition, api));
				}
				else if (options.Owner) {
					stateOwners.set(api, stateOwners.get(options.Owner) || options.Owner);
				}

				/* Instance: bindings and structural hosts */
				/*
				 * Models must bind before semantic DOM events.
				 *
				 * For controls where both [(checked)] and (change) listen to
				 * the same native event (checkbox/radio), component value must be updated
				 * before the component method reads it.
				 */
				activateBindings(bindings, values, effects);

				bindModels(models, values, effects, listen);

				bindEvents(root, api, listen, listed);

				/* The parts of the template with nothing for it: Structural passes them by, once. */
				planned.Inert.forEach(function (node) {
					if (node)
						inertNodes.add(node);
				});

				structural = Runtime.Structural(api, definition, pristineRoot);

				/*
				 * Do not eagerly evaluate template expressions against an empty
				 * bootstrap object. Application-style components commonly populate
				 * their state in $OnCreate(); with real JavaScript expressions an
				 * absent identifier is a ReferenceError, unlike the old path lookup.
				 *
				 * Components that actually receive props still get their initial
				 * Update before $OnCreate, preserving the existing child lifecycle.
				 */

				/* Instance: initial state and lifecycle */
				if (!directState && Object.keys(initialValues).length) {
					Update(initialValues);
				}

				if (!directState && data && Object.keys(data).length && !(options && options.RoutePacket === data)) {
					Update(data);
				}

				/* Its title and its icon ($Title, $Icon; {{ }} follows its state): the page shows them from now. */
				Runtime.HeadOwn(api, definition, values, effects);

				Runtime.InitializeOwnerSubscriptions(api, definition);

				/*
				 * The listeners of the tag that declares it, and the component of that template, are there before its
				 * hooks: an event that $OnCreate or $OnReady emits reaches its owner.
				 */
				if (options && options.Listeners) {
					options.Listeners.forEach(function (listener) {
						On(listener.Name, listener.Callback);
					});
				}

				if (options && options.Parent)
					parentComponent = options.Parent;

				/*
				 * The hooks run untracked: a component made while an effect of its parent runs (a row of a *for) must not
				 * make that effect depend on what its hooks read, or a write of theirs would render the parent again in the
				 * middle of its own render (the rows of the list came twice).
				 */
				if (definition.$OnCreate) {
					Runtime.Untracked(function () {
						definition.$OnCreate.call(api, data || {});
					});
				}

				/*
				 * Router context becomes part of the component once $OnCreate has completed (it is about the component
				 * itself), and before the first render: a method that an expression calls reads this.$Params as the
				 * template reads $Params, from its first render on.
				 */
				if (options && options.RoutePacket)
					updateRouteContext(options.RoutePacket);

				/* Its data before its first render: of the state a server rendered it with, or of its $OnSSR (SSR). */
				if (!directState)
					Runtime.SSR.Component(api, name || (remoteNames && remoteNames.get(definition)) || '', definition, values, Update, parentComponent);

				/*
				 * Bootstrap is intentionally delayed until after $OnCreate().
				 * This preserves the established semantics: components may populate their
				 * initial state in $OnCreate without expressions seeing an empty scope.
				 */
				runEffects(effects);

				/*
				 * Structural() was compiled before $OnCreate(), but its lazy records
				 * must see the populated initial state. One bootstrap pass creates
				 * component conditions / collections / ordinary *if. Reactive
				 * data-if records then update from their own dependencies.
				 */

				if (structural)
					structural.Update(values);

				activateCustomDirectives(customDirectives, api, values, effects);

				runEffects(customDirectives.filter(function (record) {
					return !!record.Effect;
				}).map(function (record) {
					return record.Effect;
				}));

				/*
				 * Native controls have stateful DOM properties (checked/value).
				 * Do one final bootstrap synchronization after Create() and the
				 * structural pass so initial component values are authoritative as well as
				 * subsequent Proxy updates.
				 */
				syncModels(models, values);

				if (options && options.GuardFailure)
					api.$GuardFailure = options.GuardFailure;

				/*
				 * The component is now fully initialized. Declarative Title is applied
				 * before lifecycle hooks, so Ready may replace it with a dynamic value.
				 */
				if (definition.$OnReady) {
					Runtime.Untracked(function () {
						definition.$OnReady.call(api);
					});
				}

				if (name)
					useComponent(name, api);

				return api;
			}

			factory.ComponentName = name;
			factory.Definition = definition;

			if (name)
				componentRegistry[name] = factory;

			return factory;
		}

		/* Component: runtime bridge and public API */
		Runtime.ResolveComponent = function (name) {
			name = String(name);

			if (componentRegistry[name])
				return componentRegistry[name];

			if (Runtime.Bundle.Load('Component', name)) {
				return Runtime.ResolveComponentRegistered(name);
			}

			/* In a part of the bundle: made once the part is fetched, a placeholder until then. */
			if (Runtime.Bundle.Deferred('Component', name)) {
				var partFactory = function (data, slotProjection, options) {
					return deferredComponent(function (ready) {
						Runtime.Bundle.Fetch('Component', name, function (error) {
							var factory = !error && Runtime.Bundle.Load('Component', name) ? Runtime.ResolveComponentRegistered(name) : null;

							ready(error || (factory ? null : new Error('Elemenx unknown Component: ' + name)), factory);
						});
					}, data, slotProjection, options);
				};

				partFactory.ComponentName = name;
				partFactory.ElemenxLazy = true;

				componentRegistry[name] = partFactory;

				return partFactory;
			}

			if (Runtime.Discovery) {
				var lazyFactory = function (data, slotProjection, options) {
					return deferredComponent(function (ready) {
						var application = options && options.Application ? options.Application : null;

						Runtime.Discovery.Load(application, 'Component', name, false, function (error) {
							var factory = componentRegistry[name] || Runtime.ResolveComponentRegistered(name);
							if (factory === lazyFactory)
								factory = null;

							ready(error, factory);
						});
					}, data, slotProjection, options);
				};

				lazyFactory.ComponentName = name;
				lazyFactory.ElemenxLazy = true;

				componentRegistry[name] = lazyFactory;

				return lazyFactory;
			}

			return null;
		};

		Runtime.ResolveComponentRegistered = function (name) {
			return componentRegistry[name] && !componentRegistry[name].ElemenxLazy ? componentRegistry[name] : null;
		};

		/* The lower case names a template of the page made ambiguous (Foo and FOO), warned once. */
		var ambiguousComponentNames = {};

		/*
		 * The Component of a name in any case: the registered Components, those of the bundles, the source tree of the
		 * Application and its Libraries, or null. Two Components whose names differ only in case are ambiguous: the first
		 * is taken, with a warning.
		 */
		function componentName (name, application) {
			var lower = String(name).toLowerCase();
			var names = Object.keys(componentRegistry).concat(Runtime.Bundle.Names('Component'), application ? Runtime.Discovery.Names(application) : [], application ? Runtime.Library.Names(application) : []);
			var found = [];
			var i = 0;

			while (i < names.length) {
				if (names[i].toLowerCase() === lower && found.indexOf(names[i]) === -1)
					found.push(names[i]);

				i++;
			}

			if (found.length > 1 && !ambiguousComponentNames[lower]) {
				ambiguousComponentNames[lower] = true;

				if (global.console && typeof global.console.warn === 'function')
					global.console.warn('Elemenx Component name is ambiguous in a template of the page: ' + found.join(', '));
			}

			return found[0] || null;
		}

		/*
		 * The name of the Component an element of a template declares: its data-elemenx-component (the name as a template
		 * of text writes it), otherwise its tag. The HTML parser writes the names of a <template> of the page in lower case
		 * (FooComponent becomes foocomponent): an element HTML does not know takes the Component of its name in any case.
		 * The elements HTML knows (button, select, dialog...) stay elements: a Component of such a name needs a template of
		 * text, a <script type="text/html"> template of the page, or data-elemenx-component.
		 */
		Runtime.ComponentTag = function (node, application) {
			var named = node.getAttribute('data-elemenx-component');
			if (named)
				return named;

			if (Object.prototype.toString.call(node) !== '[object HTMLUnknownElement]') return node.tagName;

			return componentName(node.tagName, application) || node.tagName;
		};

		/* An element of a template that declares a Component: named by data-elemenx-component, or one HTML does not know. */
		function componentDeclaration (node) {
			return node.hasAttribute('data-elemenx-component') || Object.prototype.toString.call(node) === '[object HTMLUnknownElement]';
		}

		Runtime.ReloadComponentTemplate = function (name, callback) {
			var factory = Runtime.ResolveComponentRegistered(name);
			var definition = factory && factory.Definition;

			if (!definition || !definition.$TemplateURL) {
				if (callback)
					callback(null);

				return;
			}

			loadTemplateURL(definition.$TemplateURL, true, function (error) {
				if (callback)
					callback(error);
			});
		};

		Runtime.ComponentValues = function (component) {
			return componentValues.get(component) || null;
		};
		Runtime.UpdateComponentRouteContext = function (component, packet) {
			var resolved;

			while (component && component._Component) {
				resolved = component._Component();

				if (!resolved || resolved === component) return;

				component = resolved;
			}

			var update = componentRouteUpdaters.get(component);
			if (update)
				update(packet);
		};

		Runtime.CreateComponent = function (definition) {
			return CreateComponentFactory(null, definition || {});
		};

		Runtime.BeginComponentReload = function (name) {
			var list = liveComponentInstances[name];
			if (!list) return 0;

			var snapshot = list.slice();
			var i = 0;

			while (i < snapshot.length) {
				if (snapshot[i] && snapshot[i]._Pending) {
					snapshot[i]._Pending();
				}

				i++;
			}

			return snapshot.length;
		};

		Runtime.FailComponentReload = function (name, error) {
			var list = liveComponentInstances[name];
			if (!list) return 0;

			var snapshot = list.slice();

			var i = 0;
			while (i < snapshot.length) {
				if (snapshot[i] && snapshot[i]._Error) {
					snapshot[i]._Error(error);
				}

				i++;
			}

			return snapshot.length;
		};

		function reloadTemplateInstances (templateName) {
			var name;
			var factory;
			var definition;
			var count = 0;

			for (name in componentRegistry) {
				if (!own(componentRegistry, name)) continue;

				factory = componentRegistry[name];
				definition = factory && factory.Definition;

				if (!definition || definition.$Template !== undefined || definition.$TemplateURL) continue;
				if ((definition.$TemplateID || name) !== templateName) continue;

				Runtime.BeginComponentReload(name);

				count += Runtime.ReloadComponentInstances(name);
			}

			return count;
		}

		Elemenx.Template.Reload = function (name, value) {
			templateRegistrySet(name, value);

			return reloadTemplateInstances(name);
		};

		Runtime.ReloadComponentInstances = function (name) {
			var list = liveComponentInstances[name];
			if (!list) return 0;

			var factory = Runtime.ResolveComponentRegistered(name);
			if (!factory) return 0;

			var snapshot = list.slice();

			componentReloading = true;

			try {
				var i = 0;

				while (i < snapshot.length) {
					if (snapshot[i] && snapshot[i]._Reload) {
						snapshot[i]._Reload(factory);
					}

					i++;
				}
			}
			finally {
				componentReloading = false;
			}

			return snapshot.length;
		};

		Runtime.ResolveOutlet = function (component, name) {
			if (!component) return null;

			while (component._Component) {
				var resolved = component._Component();
				if (!resolved || resolved === component) return null;

				component = resolved;
			}

			var outlets = componentOutlets.get(component);
			if (!outlets) return null;

			return outlets[name] || null;
		};

		/* The instance of the Component whose root element (or placeholder, for a deferred one) this is, or null. */
		Elemenx.Instance = function (element) {
			return instanceOf(element);
		};

		Elemenx.Component = function (name, definition) {
			var factory;

			if (arguments.length === 1)
				return Runtime.ResolveComponent(name);

			if (arguments.length === 2 && typeof name === 'string') {
				factory = CreateComponentFactory(name, definition || {});

				/* The Components that extend this one, or wait for it, are made of it now. */
				reinherit(name);

				if (Runtime.DefinedTell)
					Runtime.DefinedTell();

				return factory;
			}

			throw new Error('Elemenx.Component expects (name) or (name, definition)');
		};

		/* The definition of a Component registered and loaded under a name, or null. */
		Runtime.ComponentDefinition = function (name) {
			var factory = componentRegistry[name];

			return factory && !factory.ElemenxLazy && factory.Definition ? factory.Definition : null;
		};

		/* The names of the Components registered and loaded. */
		Runtime.ComponentNames = function () {
			return Object.keys(componentRegistry).filter(function (name) {
				return !!Runtime.ComponentDefinition(name);
			});
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Meta */
	(function (global) {
		'use strict';

		var own = Runtime.Own;

		/* The type of a prop from its default value: bool, number, text, or json (a list, an object, null). */
		function typeOf (value) {
			if (typeof value === 'boolean') return 'bool';

			if (typeof value === 'number') return 'number';

			if (typeof value === 'string') return 'text';

			return 'json';
		}

		function copy (value) {
			return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
		}

		/*
		 * What a definition declares of itself in $Meta, normalized: {Name, Kind, Group, Icon, Description, Props, Slots,
		 * Container, Children, Current, Events, EventDescriptions, Methods, Sample}. $Meta.Props names the public props, each
		 * a description or {Type, Options, Schema, Body, Description}; its Default is the value of the definition, its Type
		 * that of the default unless Meta names one. Schema describes the items of a list prop ({ID: 'text', Disabled: 'bool'}); Body marks a text
		 * the component also takes from its body, written there by tools (the code of a CodeView); Children names
		 * the components declared inside it (Tab in Tabs) and Current the prop that names the one shown (Value). $Meta.Events
		 * is a list of names, or {name: description}: Events lists the names, EventDescriptions holds the descriptions.
		 */
		function normalize (name, kind, definition) {
			var meta = definition.$Meta;
			var props = [];
			var events;
			var key;
			var entry;

			if (!meta || typeof meta !== 'object') return null;

			events = meta.Events || [];

			for (key in meta.Props || {}) {
				if (!own(meta.Props, key)) continue;

				entry = typeof meta.Props[key] === 'string' ? {Description: meta.Props[key]} : meta.Props[key] || {};

				props.push({
					Name: key,
					Type: entry.Type || (entry.Options ? 'select' : typeOf(definition[key])),
					Default: typeof definition[key] === 'function' ? undefined : copy(definition[key]),
					Options: entry.Options ? entry.Options.slice() : null,
					Schema: entry.Schema ? copy(entry.Schema) : null,
					Body: !!entry.Body,
					Description: entry.Description || ''
				});
			}

			return {
				Name: name,
				Kind: kind,
				Group: meta.Group || '',
				Icon: meta.Icon || '',
				Description: meta.Description || '',
				Props: props,
				Slots: (meta.Slots || []).slice(),
				Container: !!meta.Container,
				Children: (meta.Children || []).slice(),
				Current: meta.Current || '',
				Events: Array.isArray(events) ? events.slice() : Object.keys(events),
				EventDescriptions: Array.isArray(events) ? {} : copy(events),
				Methods: (meta.Methods || []).slice(),
				Sample: copy(meta.Sample || {})
			};
		}

		function find (name) {
			var definition = Runtime.ComponentDefinition(name);
			if (definition)
				return normalize(name, 'Component', definition);

			definition = Runtime.ServiceDefinition(name);

			if (definition)
				return normalize(name, 'Service', definition);

			definition = own(Runtime.Directive.Registry, name.toLowerCase()) ? Runtime.Directive.Registry[name.toLowerCase()] : null;

			return definition ? normalize(name.toLowerCase(), 'Directive', definition) : null;
		}

		/*
		 * Elemenx.Meta(name): the $Meta of the Component, the Service or the Directive of that name, normalized, or null
		 * (no such definition loaded, or no $Meta in it). Elemenx.Meta(): the ones of every Component loaded.
		 */
		Elemenx.Meta = function (name) {
			if (arguments.length === 1) return find(String(name));

			if (arguments.length)
				throw new Error('Elemenx.Meta expects () or (name)');

			return Runtime.ComponentNames().map(function (component) {
				return normalize(component, 'Component', Runtime.ComponentDefinition(component));
			}).filter(function (meta) {
				return meta !== null;
			});
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Defined */
	(function (global) {
		'use strict';

		/* What waits for a name to be defined: {Names, Kind, Done, Timer, Callback}. */
		var waiting = [];

		/* What a name is defined as now: Component (loaded, not only named), Service or Directive; null for none. */
		function kindOf (name, kind) {
			if ((!kind || kind === 'Component') && Runtime.ComponentDefinition(name)) return 'Component';

			if ((!kind || kind === 'Service') && Elemenx.Service(name)) return 'Service';

			if ((!kind || kind === 'Directive') && Runtime.Directive.Registry[String(name).toLowerCase()]) return 'Directive';

			return null;
		}

		function settle (wait) {
			var found = [];
			var i;

			if (wait.Done) return;

			for (i = 0; i < wait.Names.length; i++) {
				var kind = kindOf(wait.Names[i], wait.Kind);
				if (!kind) return;

				found.push({Name: wait.Names[i], Kind: kind});
			}

			finish(wait, null, wait.List ? found : found[0]);
		}

		function finish (wait, error, result) {
			wait.Done = true;

			if (wait.Timer)
				clearTimeout(wait.Timer);

			waiting = waiting.filter(function (one) {
				return one !== wait;
			});

			wait.Callback(error, error ? null : result);
		}

		/* A definition came (a Component, a Service, a Directive): what waited for it is told, after what defined it. */
		Runtime.DefinedTell = function () {
			if (!waiting.length) return;

			setTimeout(function () {
				waiting.slice().forEach(settle);
			}, 0);
		};

		/*
		 * Elemenx.Defined(name) is what a name is defined as now: 'Component' (its definition loaded), 'Service',
		 * 'Directive', or null. Elemenx.Defined(name or [names], callback, {Kind, Timeout}) calls back (error, {Name, Kind})
		 * (a list of them for a list of names) once each is defined, of Kind when one is given: a Component of another
		 * script, of a Library, of a part of a Bundle loaded later. Always after it returns, even for what is defined
		 * already; Timeout (milliseconds, none by default) gives up with the error 'Elemenx.Defined waited <ms> ms for
		 * <names>'. It returns a function that stops waiting (no callback then).
		 */
		Elemenx.Defined = function (name, callback, options) {
			var settings = options || {};
			var names = Array.isArray(name) ? name.map(String) : [String(name)];
			var wait;

			if (arguments.length === 1 && typeof name === 'string') return kindOf(name, null);

			if (!names.length || typeof callback !== 'function' || settings.Kind && ['Component', 'Service', 'Directive'].indexOf(settings.Kind) === -1)
				throw new Error('Elemenx.Defined expects (name) or (name, callback, {Kind, Timeout})');

			wait = {Names: names, List: Array.isArray(name), Kind: settings.Kind || '', Done: false, Timer: null, Callback: callback};

			waiting.push(wait);

			if (Number(settings.Timeout) > 0) {
				wait.Timer = setTimeout(function () {
					if (!wait.Done)
						finish(wait, new Error('Elemenx.Defined waited ' + Number(settings.Timeout) + ' ms for ' + names.join(', ')));
				}, Number(settings.Timeout));
			}

			setTimeout(function () {
				settle(wait);
			}, 0);

			return function () {
				wait.Done = true;

				if (wait.Timer)
					clearTimeout(wait.Timer);

				waiting = waiting.filter(function (one) {
					return one !== wait;
				});
			};
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Router */
	(function (global) {
		'use strict';

		var own = Runtime.Own;

		/* Router: paths and query */
		function trimPath (path) {
			path = String(path || '/');

			if (path.charAt(0) !== '/') {
				path = '/' + path;
			}

			if (path.length > 1 && path.charAt(path.length - 1) === '/') {
				path = path.substring(0, path.length - 1);
			}

			return path;
		}

		function splitPath (path) {
			var clean = trimPath(path);
			var result = [];

			if (clean === '/') return result;

			var parts = clean.substring(1).split('/');
			var i = 0;

			while (i < parts.length) {
				if (parts[i])
					result.push(decodeURIComponent(parts[i]));

				i++;
			}

			return result;
		}

		function routeParts (path) {
			var value = String(path || '');
			var parts = [];

			if (!value || value === '/') return parts;

			if (value.charAt(0) === '/')
				value = value.substring(1);

			if (value.charAt(value.length - 1) === '/')
				value = value.substring(0, value.length - 1);

			if (!value)
				return parts;

			var raw = value.split('/');
			var i = 0;

			while (i < raw.length) {
				if (raw[i])
					parts.push(raw[i]);

				i++;
			}

			return parts;
		}

		function matchLevel (list, segments, offset, params, chain) {
			var i = 0;
			var route;
			var pattern;
			var nextParams;
			var nextChain;
			var j;
			var value;
			var child;

			while (i < list.length) {
				route = list[i];
				pattern = routeParts(route.Path);
				nextParams = {};
				nextChain = chain.slice(0);

				Runtime.Assign(nextParams, params);

				if (offset + pattern.length <= segments.length) {
					j = 0;

					while (j < pattern.length) {
						value = pattern[j];

						if (value.charAt(0) === ':') {
							nextParams[value.substring(1)] = segments[offset + j];
						}
						else if (value !== segments[offset + j]) {
							break;
						}

						j++;
					}

					if (j === pattern.length) {
						nextChain.push(route);

						if (route.Routes && route.Routes.length) {
							child = matchLevel(route.Routes, segments, offset + pattern.length, nextParams, nextChain);

							if (child)
								return child;
						}

						if (offset + pattern.length === segments.length) {
							return {
								Chain: nextChain,
								Params: nextParams
							};
						}
					}
				}

				i++;
			}

			return null;
		}

		function parseQuery (search) {
			var result = {};
			var value = String(search || '');
			var pair;
			var i = 0;
			var index;
			var key;

			if (value.charAt(0) === '?')
				value = value.substring(1);

			if (!value)
				return result;

			var pairs = value.split('&');

			while (i < pairs.length) {
				pair = pairs[i];
				index = pair.indexOf('=');

				if (index === -1) {
					key = pair;
					value = '';
				}
				else {
					key = pair.substring(0, index);
					value = pair.substring(index + 1);
				}

				key = decodeURIComponent(key.replace(/\+/g, ' '));
				value = decodeURIComponent(value.replace(/\+/g, ' '));

				result[key] = value;

				i++;
			}

			return result;
		}

		function statePacket (url, params) {
			return {
				Path: trimPath(url.pathname),
				Params: params,
				Query: parseQuery(url.search),
				Hash: url.hash ? url.hash.substring(1) : ''
			};
		}

		/* Router: guards and waiting */
		function guardsFor (route) {
			if (route.Guards instanceof Array) return route.Guards;
			if (route.Guard !== undefined) return [route.Guard];

			return [];
		}

		function waiter (operation) {
			return {
				ElemenxWaiter: true,
				Operation: operation
			};
		}

		function fail (reason, data) {
			return {
				ElemenxGuardFailure: true,
				Reason: reason,
				Data: data
			};
		}

		/* A denying guard result as a failure object (false becomes a default failure) that records the guard in field. */
		function guardDenial (result, field, guard) {
			if (result !== false && !(result && result.ElemenxGuardFailure === true)) return result;

			if (result === false)
				result = fail();

			result[field] = guard;

			return result;
		}

		function leaveArguments (context) {
			return {
				$From: context.$From,
				$To: context.$To,
				$Route: context.$Route,
				$Wait: waiter,
				$Fail: fail
			};
		}

		function guardFailureComponent (route, failure) {
			var policy = route && route.GuardFailed;
			if (!policy)
				return null;

			if (typeof policy === 'string' || typeof policy === 'function') return policy;
			if (typeof policy !== 'object') return null;

			if (failure.$Guard !== undefined && policy[failure.$Guard] !== undefined) return policy[failure.$Guard];

			return policy.Default !== undefined ? policy.Default : null;
		}

		/* Router: components and history */
		function bundledComponent (reference) {
			if (typeof reference === 'function') return reference;

			var factory = Runtime.ResolveComponentRegistered(reference);
			if (factory)
				return factory;

			if (Runtime.Bundle.Load('Component', reference)) {
				return Runtime.ResolveComponentRegistered(reference);
			}

			return null;
		}

		function componentFactory (route) {
			// Bundle resolution is synchronous and may register the factory here.
			// Network Discovery remains owned by loadRouteComponents().
			return bundledComponent(route.Component);
		}

		/* The state of a Router entry of the browser history; route is the URL of the route when the page URL does not hold it (Mode memory). */
		function historyState (index, route) {
			var current = global.history.state;
			var state = {};

			if (current && typeof current === 'object')
				Runtime.Assign(state, current);

			state.ElemenxRouterIndex = index;

			if (route !== undefined)
				state.ElemenxRouterURL = route;

			return state;
		}

		function findAnchor (node) {
			while (node && node !== document) {
				if (node.tagName === 'A') return node;

				node = node.parentNode;
			}

			return null;
		}

		/* Router: navigation engine */
		function Router (config) {
			var root = config.Root;
			var rootOutletName = config.Outlet || 'Content';
			var waitingOutletName = config.WaitingOutlet || 'Waiting';
			var routes = config.Routes || [];
			var active = [];
			var sleeping = {};
			var started = false;
			var clickHandler;
			var popHandler;
			var navigationID = 0;
			var events = {};
			var historyIndex = 0;
			var committedURL = null;
			var rollbackPop = false;
			/* A page that is not served over http (a file, the page of an extension, an Electron window) keeps its route in memory. */
			var urlMode = config.Mode === undefined ? (/^https?:$/.test(global.location.protocol) ? 'history' : 'memory') : config.Mode;
			if (urlMode !== 'history' && urlMode !== 'hash' && urlMode !== 'memory')
				throw new Error('Elemenx.Router Mode must be history, hash or memory');

			/* Navigation: events and owners */
			function application () {
				return root && root.$Application ? root.$Application() : null;
			}

			function emit (name, data) {
				var list = events[name];
				if (!list || !list.length) return;

				var copy = list.slice(0);
				var i = 0;

				while (i < copy.length) {
					Runtime.Notify(copy[i].Callback, copy[i].Owner || api, [data, api]);

					i++;
				}
			}

			function on (name, callback, owner) {
				if (!name || typeof callback !== 'function') return api;

				if (!events[name])
					events[name] = [];

				events[name].push({
					Callback: callback,
					Owner: owner || null
				});

				return api;
			}

			function offOwner (owner) {
				var name;
				var list;
				var next;
				var i;

				for (name in events) {
					if (!own(events, name)) continue;

					list = events[name];
					next = [];
					i = 0;

					while (i < list.length) {
						if (list[i].Owner !== owner) {
							next.push(list[i]);
						}

						i++;
					}

					events[name] = next;
				}
			}

			/* Listeners added on behalf of a Component, removed together by OffOwner when the Component is destroyed. */
			function ownerFacade (owner) {
				return {
					On: function (name, callback) {
						on(name, callback, owner);

						return this;
					}
				};
			}

			/* A navigation that cannot load or render its target ends with NavigationError; unheard, the error is reported. */
			function reportNavigationError (context, error) {
				context.$Error = error;

				if (events.NavigationError && events.NavigationError.length) {
					emit('NavigationError', context);

					return;
				}

				Runtime.Report(error);
			}

			/* Navigation: route matching and loading */
			/* The outlet of a route: its own, else the Router outlet for the first level and Content below it. */
			function outletName (route, index) {
				return route.Outlet || (index === 0 ? rootOutletName : 'Content');
			}

			/* Loads a definition through the Discovery of the Router Application; callback (missing) when it has none. */
			function discover (type, reference, missing, callback) {
				var currentApplication = application();

				if (!Runtime.Discovery || !currentApplication || !Runtime.Discovery.Ready(currentApplication)) {
					callback(missing);

					return;
				}

				Runtime.Discovery.Load(currentApplication, type, reference, false, callback);
			}

			/* Creates a route Component under the Router and renders it into outlet. */
			function mountRouteComponent (factory, packet, parent, outlet, guardFailure) {
				var component = Runtime.WithRouter(api, function () {
					return factory(packet, null, {
						Application: application(),
						RoutePacket: packet,
						GuardFailure: guardFailure || null
					});
				});

				Runtime.AttachRouter(component, api);

				component.$Parent(parent);

				outlet.Render(component);

				return component;
			}

			function match (path) {
				return matchLevel(routes, splitPath(path), 0, {}, []);
			}

			function loadRouteComponents (chain, common, callback) {
				var index = common;

				function next (error) {
					if (error || index >= chain.length) {
						callback(error || null);

						return;
					}

					var route = chain[index++];

					if (bundledComponent(route.Component)) {
						next(null);

						return;
					}

					/* The part of the bundle the component of the route is in (a build split by its routes). */
					if (typeof route.Component === 'string' && Runtime.Bundle.Deferred('Component', route.Component)) {
						Runtime.Bundle.Fetch('Component', route.Component, function (error) {
							next(error || (bundledComponent(route.Component) ? null : new Error('Elemenx route component did not register: ' + route.Component)));
						});

						return;
					}

					discover('Component', route.Component, new Error('Elemenx route component not found: ' + route.Component), function (error) {
						if (error) {
							next(error);

							return;
						}

						if (!Runtime.ResolveComponentRegistered(route.Component)) {
							next(new Error('Elemenx route component did not register: ' + route.Component));

							return;
						}

						next(null);
					});
				}

				next(null);
			}

			var waitingComponent = null;
			var waitingElement = null;

			/* Navigation: waiting component */
			function clearWaiting () {
				if (!waitingComponent) return;

				if (waitingElement && waitingElement.parentNode)
					waitingElement.parentNode.removeChild(waitingElement);

				if (waitingComponent.$Destroy)
					waitingComponent.$Destroy();

				waitingComponent = null;
				waitingElement = null;
			}

			/*
			 * Runs callback once the browser has painted: the waiting component shows before the route renders, which can
			 * hold the thread. A hidden page paints no frame, so a timer runs it too.
			 */
			function afterPaint (callback) {
				var done = false;

				function run () {
					if (done) return;

					done = true;

					callback();
				}

				if (global.requestAnimationFrame) {
					global.requestAnimationFrame(function () {
						global.setTimeout(run, 0);
					});
				}

				global.setTimeout(run, 100);
			}

			function showWaiting (prepared, callback) {
				var chain = prepared.Found.Chain;
				var route = chain.length ? chain[chain.length - 1] : null;
				var reference = route && route.Wait !== undefined ? route.Wait : (route && route.Waiting !== undefined ? route.Waiting : (config.Wait !== undefined ? config.Wait : config.Waiting));

				clearWaiting();

				if (!reference) {
					callback(null);

					return;
				}

				function render () {
					var factory = bundledComponent(reference);

					if (!factory) {
						callback(new Error('Elemenx route waiting component not found: ' + reference));

						return;
					}

					var outlet = Runtime.ResolveOutlet(root, waitingOutletName);

					if (!outlet) {
						callback(new Error('Elemenx router waiting outlet not found: ' + waitingOutletName));

						return;
					}

					waitingComponent = Runtime.WithRouter(api, function () {
						return factory(prepared.Packet, null, {
							Application: application(),
							RoutePacket: prepared.Packet
						});
					});

					Runtime.AttachRouter(waitingComponent, api);

					waitingComponent.$Parent(root);

					waitingElement = waitingComponent.$Element ? waitingComponent.$Element() : waitingComponent;

					outlet.Element().appendChild(waitingElement);

					emit('NavigationWaiting', prepared.Packet);

					afterPaint(function () {
						callback(null);
					});
				}

				if (bundledComponent(reference)) {
					render();

					return;
				}

				discover('Component', reference, new Error('Elemenx route waiting component not found: ' + reference), function (error) {
					if (error) {
						callback(error);

						return;
					}

					render();
				});
			}

			/* Navigation: guards */
			function settleWaiter (operation, done, context) {
				var settled = false;

				function finish (result) {
					if (settled) return;

					settled = true;

					emit('GuardEnd', context);

					done(result);
				}

				emit('GuardWait', context);

				if (typeof operation === 'function') {
					operation(finish);

					return;
				}

				/* Guards wait through a callback: a Promise is refused, the navigation is denied and the failure says why. */
				if (operation && typeof operation.then === 'function') {
					finish(fail('InvalidWait', new Error('Elemenx $Wait expects a function (done), not a Promise')));

					return;
				}

				finish(operation);
			}

			function settleGuard (result, done, context) {
				if (result && result.ElemenxWaiter === true) {
					settleWaiter(result.Operation, done, context);

					return;
				}

				emit('GuardEnd', context);

				done(result);
			}

			function runEnterGuards (chain, common, context, done) {
				var routeIndex = common;

				function nextRoute (result) {
					if (result !== true && result !== undefined) {
						done(result);

						return;
					}

					if (routeIndex >= chain.length) {
						done(true);

						return;
					}

					var route = chain[routeIndex];

					context.$FailureRoute = route;

					var list = guardsFor(route);
					var guardIndex = 0;

					routeIndex++;

					function nextGuard (guardResult) {
						if (guardResult !== true && guardResult !== undefined) {
							done(guardResult);

							return;
						}

						if (guardIndex >= list.length) {
							nextRoute(true);

							return;
						}

						var guardReference = list[guardIndex];
						var guard = Runtime.ResolveGuard(guardReference);

						if (!guard) {
							if (typeof guardReference !== 'string') {
								done({ElemenxNavigationError: new Error('Elemenx route guard not found')});

								return;
							}

							discover('Guard', guardReference, new Error('Elemenx route guard not found'), function (error) {
								if (error) {
									done({ElemenxNavigationError: error});

									return;
								}

								nextGuard(true);
							});

							return;
						}

						guardIndex++;

						(function (guardReference) {
							context.$Route = route;
							context.$Guard = guardReference;

							emit('GuardStart', context);

							settleGuard(
								guard.call(context),
								function (result) {
									nextGuard(guardDenial(result, 'Guard', guardReference));
								},
								context
							);
						})(list[guardIndex - 1]);
					}

					nextGuard(true);
				}

				nextRoute(true);
			}

			function runLeaveGuards (common, context, done) {
				var index = active.length - 1;

				function next (result) {
					if (result !== true && result !== undefined) {
						done(result);

						return;
					}

					if (index < common) {
						done(true);

						return;
					}

					var component = active[index].Component;

					index--;

					if (component && component._Component) {
						var resolvedComponent = component._Component();
						if (resolvedComponent)
							component = resolvedComponent;
					}

					var hook = component.$OnRouteLeave;

					if (typeof hook !== 'function') {
						next(true);

						return;
					}

					context.$Route = active[index + 1].Route;
					context.$Guard = '$OnRouteLeave';

					emit('GuardStart', context);

					settleGuard(
						hook.call(component, leaveArguments(context)),
						function (result) {
							next(guardDenial(result, '$Guard', '$OnRouteLeave'));
						},
						context
					);
				}

				next(true);
			}

			/* Navigation: commit */
			/* The key of a page asleep: its level, its component and the parameters of its route (a query does not count). */
			function sleepKey (route, index, packet) {
				return index + '|' + route.Component + '|' + JSON.stringify(packet && packet.Params ? packet.Params : {});
			}

			/* A page that leaves sleeps out of its outlet, when the policy of the Cache keeps it. */
			function sleepPage (entry, outlet) {
				var key = entry.Key;

				outlet.Release();

				if (sleeping[key])
					Runtime.CacheDrop(sleeping[key]);

				sleeping[key] = Runtime.CacheSleep(entry.Component, entry.Component.$Element(), entry.Route.Component, function () {
					delete sleeping[key];
				});
			}

			function destroyFrom (index, stopping) {
				var i = active.length - 1;
				var entry;
				var parent;
				var outlet;

				while (i >= index) {
					entry = active[i];
					parent = i > 0 ? active[i - 1].Component : root;
					outlet = parent && entry.Route ? Runtime.ResolveOutlet(parent, outletName(entry.Route, i)) : null;

					/*
					 * Route components are owned by their Outlet. Clearing through the
					 * Outlet keeps its Current() reference synchronized with Router
					 * teardown. Direct Component.Destroy() leaves a stale Current and a
					 * later Render() destroys the already-recreated route component.
					 */
					if (!stopping && entry.Key && outlet && outlet.Current && outlet.Current() === entry.Component && Runtime.CacheKeeps('router', entry.Definition, undefined)) sleepPage(entry, outlet);
					else if (outlet && outlet.Current && outlet.Current() === entry.Component) outlet.Clear();
					else if (entry.Component) entry.Component.$Destroy();

					i--;
				}

				active.length = index;
			}

			function commit (prepared) {
				var found = prepared.Found;
				var packet = prepared.Packet;
				var common = prepared.Common;
				var parent = root;
				var outlet;
				var route;
				var factory;
				var key;
				var asleep;
				var i = 0;

				while (common > 0 && i < common) {
					Runtime.UpdateComponentRouteContext(active[i].Component, packet);

					i++;
				}

				destroyFrom(common);

				if (common > 0)
					parent = active[common - 1].Component;

				i = common;

				while (i < found.Chain.length) {
					route = found.Chain[i];
					outlet = Runtime.ResolveOutlet(parent, outletName(route, i));

					if (!outlet)
						throw new Error('Elemenx router outlet not found: ' + outletName(route, i));

					factory = componentFactory(route);

					if (!factory)
						throw new Error('Elemenx route component not found: ' + route.Component);

					key = sleepKey(route, i, packet);
					asleep = sleeping[key];

					/* A page asleep under this key wakes in its outlet with the route of now. */
					if (asleep && Runtime.CacheWake(asleep)) {
						delete sleeping[key];

						parent = asleep.Component;

						Runtime.UpdateComponentRouteContext(parent, packet);

						outlet.Render(parent);
					}
					else {
						parent = mountRouteComponent(factory, packet, parent, outlet, route.GuardFailure);
					}

					active.push({
						Route: route,
						Component: parent,
						Key: key,
						Definition: factory.Definition
					});

					i++;
				}

				/* The title and the icon of the page: of its deepest component that has them, else of the Application. */
				Runtime.HeadOfPage(active.map(function (entry) {
					return entry.Component;
				}), application());

				return true;
			}

			/* The components of the route are ready, and the deferred components inside them too (a page shows whole). */
			function routeComponentsReady (from) {
				var i = from;
				var element;

				while (i < active.length) {
					if (active[i].Component && active[i].Component._Component && !active[i].Component._Component()) return false;

					element = active[i].Component && active[i].Component.$Element ? active[i].Component.$Element() : null;

					if (element && Runtime.HasPendingComponents(element)) return false;

					i++;
				}

				return true;
			}

			function finishWaitingAfterCommit (prepared, id, callback) {
				var outlet;

				if (!waitingComponent || !waitingElement) {
					callback();

					return;
				}

				// Waiting has its own outlet, independent from the route Content outlet.
				// Keep it mounted until every deferred route component has resolved.
				outlet = Runtime.ResolveOutlet(root, waitingOutletName);

				if (outlet && waitingElement && !waitingElement.parentNode)
					outlet.Element().appendChild(waitingElement);

				function check () {
					if (id !== navigationID) return;

					if (!routeComponentsReady(prepared.Common)) {
						global.setTimeout(check, 0);

						return;
					}

					clearWaiting();

					callback();
				}

				check();
			}

			/* Navigation: preparation and guard failures */
			function commonPrefix (chain) {
				var common = 0;

				while (common < active.length && common < chain.length && active[common].Route === chain[common]) {
					common++;
				}

				return common;
			}

			function prepare (url) {
				var found = match(url.pathname);
				if (!found)
					return null;

				return {
					URL: url,
					Found: found,
					Packet: statePacket(url, found.Params),
					Common: commonPrefix(found.Chain)
				};
			}

			function navigationPacket (url) {
				var found = match(url.pathname);

				return statePacket(url, found ? found.Params : {});
			}

			function renderGuardFailure (prepared, failure, reference, mode, id, context) {
				var chain = prepared.Found.Chain;
				var failureIndex = chain.indexOf(failure.$Route);
				var failureRoute;
				var failureChain;
				var failurePrepared;

				if (failureIndex === -1) return false;

				failureRoute = {
					Component: reference,
					Outlet: failure.$Route.Outlet,
					GuardFailure: failure
				};

				failureChain = chain.slice(0, failureIndex);

				failureChain.push(failureRoute);

				failurePrepared = {
					URL: prepared.URL,
					Found: {Chain: failureChain, Params: prepared.Found.Params},
					Packet: prepared.Packet,
					Common: commonPrefix(failureChain)
				};

				loadRouteComponents(failureChain, failurePrepared.Common, function (error) {
					if (id !== navigationID) return;

					if (error) {
						reportNavigationError(context, error);

						return;
					}

					writeHistory(mode, prepared.URL);

					emit('NavigationCommit', context);

					try {
						commit(failurePrepared);
					}
					catch (commitError) {
						reportNavigationError(context, commitError);

						return;
					}

					committedURL = new URL(prepared.URL.href);

					if (mode === 'pop' && id === navigationID) {
						var state = global.history.state;

						if (state && typeof state.ElemenxRouterIndex === 'number') {
							historyIndex = state.ElemenxRouterIndex;
						}
					}

					emit('NavigationEnd', context);
				});

				return true;
			}

			function handleGuardFailure (result, context) {
				var failure = result;

				if (failure === false) {
					failure = fail();
				}

				failure.$From = context.$From;
				failure.$To = context.$To;
				failure.$Route = context.$Route;
				failure.$Guard = failure.$Guard || context.$Guard;

				emit('GuardFailed', failure);

				return failure;
			}

			/* Navigation: modes */
			/*
			 * The URL of the current route. Mode history: the URL of the page. Mode hash: the part of the page URL after its
			 * #, which starts with a slash (a # without one is the Hash of the route /). Mode memory: the URL kept in the
			 * history entry, the page URL never changes and its hash belongs to the Application.
			 */
			function routeURL () {
				var hash = global.location.hash;
				var state = global.history.state;

				if (urlMode === 'hash')
					return new URL(hash.charAt(1) === '/' ? hash.substring(1) : '/' + hash, routeBase());

				if (urlMode === 'history')
					return new URL(global.location.href);

				if (state && typeof state.ElemenxRouterURL === 'string') return new URL(state.ElemenxRouterURL, routeBase());

				return new URL(/^https?:$/.test(global.location.protocol) ? global.location.pathname + global.location.search : '/', routeBase());
			}

			/*
			 * The base of the route URLs outside Mode history: a file URL of a page has the path of the file (and a drive letter
			 * on Windows); a page of a blob: URL has the origin it was made in, one of no origin (about:, sandboxed) none.
			 */
			function routeBase () {
				return global.location.protocol !== 'file:' && global.location.origin && global.location.origin !== 'null' ? global.location.origin + '/' : 'file:///';
			}

			function writeState (method, url) {
				var page = url.href;

				if (urlMode === 'hash') page = global.location.href.replace(/#[\s\S]*$/, '') + '#' + url.pathname + url.search + url.hash;
				else if (urlMode === 'memory') page = global.location.href;

				global.history[method](historyState(historyIndex, urlMode === 'memory' ? url.pathname + url.search + url.hash : undefined), '', page);
			}

			/*
			 * The route URL of a link, or null when the Router leaves the link to the page. Outside Mode history the href is
			 * read against the current route; in Mode hash #/path is a route and #name the Hash of the current one, in
			 * Mode memory a link to a # is the Application's own.
			 */
			function linkURL (anchor) {
				var href = anchor.getAttribute('href');

				if (urlMode === 'history')
					return new URL(anchor.href, global.location.href);

				if (href === null) return null;

				if (href.charAt(0) === '#') {
					if (urlMode === 'memory') return null;

					if (href.charAt(1) === '/')
						return new URL(href.substring(1), routeBase());
				}

				var target = new URL(href, (committedURL || routeURL()).href);
				if (target.protocol !== new URL(routeBase()).protocol) return null;

				return target;
			}

			/* Navigation: history and execution */
			function writeHistory (mode, url) {
				if (mode === 'push') {
					historyIndex++;

					writeState('pushState', url);
				}
				else if (mode === 'replace') {
					writeState('replaceState', url);
				}
			}

			function rejectPop (targetIndex) {
				var delta;

				if (targetIndex === null || targetIndex === undefined || targetIndex === historyIndex) {
					if (committedURL)
						writeState('replaceState', committedURL);

					return;
				}

				delta = historyIndex - targetIndex;
				rollbackPop = true;

				global.history.go(delta);
			}

			/* A redirect keeps the decision of the navigation it replaces: the current routes already agreed to leave. */
			function leaveDecided (common, context, done) {
				done(true);
			}

			function execute (prepared, mode, targetHistoryIndex, redirect) {
				var id = ++navigationID;
				var previousURL = committedURL ? new URL(committedURL.href) : routeURL();
				var context = {
					$Service: function (name) {
						return Runtime.ServiceForApplication(application(), name);
					},
					$Wait: waiter,
					$Fail: fail,
					$From: navigationPacket(previousURL),
					$To: prepared.Packet,
					$Route: null,
					$Guard: null
				};

				/* The target could not be loaded or rendered: the URL returns to the committed route. */
				function failed (error) {
					clearWaiting();

					if (mode === 'push' || mode === 'replace') {
						writeState('replaceState', previousURL);
					}
					else if (mode === 'pop') {
						rejectPop(targetHistoryIndex);
					}

					reportNavigationError(context, error);
				}

				/* A history step that reached its target keeps the index of its entry. */
				function adoptPopIndex () {
					if (mode === 'pop' && targetHistoryIndex !== null && targetHistoryIndex !== undefined)
						historyIndex = targetHistoryIndex;
				}

				function redirectTo (path) {
					emit('NavigationCancel', context);

					adoptPopIndex();

					navigate(path, 'replace', true);
				}

				function cancel () {
					emit('NavigationCancel', context);

					if (mode === 'pop')
						rejectPop(targetHistoryIndex);
				}

				emit('NavigationStart', context);

				(redirect ? leaveDecided : runLeaveGuards)(prepared.Common, context, function (leaveResult) {
					if (id !== navigationID) return;

					if (leaveResult !== true && leaveResult !== undefined) {
						if (typeof leaveResult === 'string') {
							redirectTo(leaveResult);
						}
						else {
							handleGuardFailure(leaveResult, context);

							cancel();
						}

						return;
					}

					showWaiting(prepared, function (waitingError) {
						if (id !== navigationID) return;

						if (waitingError) {
							failed(waitingError);

							return;
						}

						runEnterGuards(
							prepared.Found.Chain,
							prepared.Common,
							context,
							function (enterResult) {
								if (id !== navigationID) return;

								if (enterResult && enterResult.ElemenxNavigationError) {
									failed(enterResult.ElemenxNavigationError);

									return;
								}

								if (enterResult !== true && enterResult !== undefined) {
									clearWaiting();

									if (typeof enterResult === 'string') {
										redirectTo(enterResult);
									}
									else {
										var failure = handleGuardFailure(enterResult, context);
										var failureComponent = guardFailureComponent(failure.$Route, failure);
										if (!failureComponent || !renderGuardFailure(prepared, failure, failureComponent, mode, id, context))
											cancel();
									}

									return;
								}

								// Guard success is the navigation commit point. Discovery URLs are
								// absolute from Application bootstrap, so changing location here cannot
								// retarget a deferred component request. This keeps browser history ahead
								// of every target-page load and render operation.
								writeHistory(mode, prepared.URL);

								emit('NavigationCommit', context);

								if (id !== navigationID) return;

								loadRouteComponents(prepared.Found.Chain, prepared.Common, function (componentError) {
									if (id !== navigationID) return;

									if (componentError) {
										failed(componentError);

										return;
									}

									try {
										commit(prepared);
									}
									catch (commitError) {
										failed(commitError);

										return;
									}

									committedURL = new URL(prepared.URL.href);

									adoptPopIndex();

									finishWaitingAfterCommit(prepared, id, function () {
										emit('NavigationEnd', context);
									});
								});
							}
						);
					});
				});
			}

			/*
			 * An unknown path with a NotFound component: the pages shown are asked to leave first ($OnRouteLeave), as for
			 * any navigation; a refusal cancels it (a history step goes back), a path redirects.
			 */
			function notFound (url, mode, targetHistoryIndex) {
				var reference = config.NotFound;
				if (!reference) return false;

				var id = ++navigationID;
				var packet = statePacket(url, {});
				var context = {
					$Service: function (name) {
						return Runtime.ServiceForApplication(application(), name);
					},
					$Wait: waiter,
					$Fail: fail,
					$From: navigationPacket(committedURL || routeURL()),
					$To: packet,
					$Route: null,
					$Guard: null
				};

				function attempt () {
					try {
						render();
					}
					catch (error) {
						reportNavigationError(context, error);
					}
				}

				function render () {
					if (id !== navigationID) return;

					var factory = bundledComponent(reference);
					if (!factory)
						throw new Error('Elemenx NotFound component not found: ' + reference);

					var outlet = Runtime.ResolveOutlet(root, rootOutletName);
					if (!outlet)
						throw new Error('Elemenx router outlet not found: ' + rootOutletName);

					destroyFrom(0);

					active.push({
						Route: null,
						Component: mountRouteComponent(factory, packet, root, outlet, null)
					});

					committedURL = new URL(url.href);
				}

				runLeaveGuards(0, context, function (leaveResult) {
					if (id !== navigationID) return;

					if (leaveResult !== true && leaveResult !== undefined) {
						emit('NavigationCancel', context);

						if (typeof leaveResult === 'string') {
							navigate(leaveResult, 'replace', true);
						}
						else {
							handleGuardFailure(leaveResult, context);

							if (mode === 'pop')
								rejectPop(targetHistoryIndex);
						}

						return;
					}

					writeHistory(mode, url);

					if (mode === 'pop' && targetHistoryIndex !== null && targetHistoryIndex !== undefined)
						historyIndex = targetHistoryIndex;

					if (bundledComponent(reference)) {
						attempt();

						return;
					}

					discover('Component', reference, new Error('Elemenx NotFound component not found: ' + reference), function (error) {
						if (id !== navigationID) return;

						if (error) {
							reportNavigationError(context, error);

							return;
						}

						attempt();
					});
				});

				return true;
			}

			function navigate (url, mode, redirect) {
				var target = new URL(url, urlMode === 'history' ? global.location.href : (committedURL || routeURL()).href);

				/* Outside Mode history a route URL has the protocol of the base of the routes: the page of a blob: URL keeps its routes. */
				if (target.origin !== global.location.origin || target.protocol !== (urlMode === 'history' ? global.location.protocol : new URL(routeBase()).protocol)) {
					global.location.href = target.href;

					return api;
				}

				var prepared = prepare(target);

				if (!prepared) {
					if (!notFound(target, mode))
						global.location.href = target.href;

					return api;
				}

				execute(prepared, mode, undefined, redirect);

				return api;
			}

			/* Navigation: public API */
			function Start () {
				if (started) return api;

				if (!root)
					throw new Error('Elemenx.Router requires Root component');

				clickHandler = function (event) {
					if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

					/* A link in a shadow root reaches the document as its host: the path holds the link itself. */
					var anchor = findAnchor(event.composedPath ? event.composedPath()[0] : event.target);
					if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

					var target = linkURL(anchor);
					if (!target || target.origin !== global.location.origin) return;
					if (!match(target.pathname) && !config.NotFound) return;

					event.preventDefault();

					navigate(target.href, 'push');
				};

				popHandler = function (event) {
					var url;
					var prepared;
					var targetIndex;

					if (rollbackPop) {
						rollbackPop = false;

						return;
					}

					/* Mode memory: an entry without a route is a # of the Application, the route stays. */
					if (urlMode === 'memory' && !(event && event.state && typeof event.state.ElemenxRouterURL === 'string')) return;

					url = routeURL();
					prepared = prepare(url);
					targetIndex = event && event.state && typeof event.state.ElemenxRouterIndex === 'number' ? event.state.ElemenxRouterIndex : null;

					if (prepared) {
						execute(prepared, 'pop', targetIndex);
					}
					else {
						notFound(url, 'pop', targetIndex);
					}
				};

				document.addEventListener('click', clickHandler);
				global.addEventListener('popstate', popHandler);

				started = true;

				committedURL = routeURL();

				writeState('replaceState', committedURL);

				var url = routeURL();
				var prepared = prepare(url);

				if (prepared) {
					execute(prepared, 'start');
				}
				else {
					notFound(url, 'replace');
				}

				return api;
			}

			function Destroy () {
				if (!started) return;

				navigationID++;

				document.removeEventListener('click', clickHandler);
				global.removeEventListener('popstate', popHandler);

				clearWaiting();

				destroyFrom(0, true);

				Object.keys(sleeping).forEach(function (key) {
					Runtime.CacheDrop(sleeping[key]);
				});

				sleeping = {};
				started = false;
			}

			function Current () {
				var result = [];
				var i = 0;

				while (i < active.length) {
					result.push(active[i].Route);

					i++;
				}

				return result;
			}

			var api = {
				On: function (name, callback) {
					return on(name, callback, null);
				},
				Start: Start,
				Go: function (url) {
					return navigate(url, 'push');
				},
				Replace: function (url) {
					return navigate(url, 'replace');
				},
				Back: function () {
					global.history.back();

					return api;
				},
				Forward: function () {
					global.history.forward();

					return api;
				},
				Current: Current,
				Destroy: Destroy
			};

			api.Owner = ownerFacade;
			api.OffOwner = offOwner;

			Runtime.AttachRouter(root, api);

			return api;
		}

		Elemenx.Router = Router;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Structural */
	(function (global) {
		'use strict';

		var own = Runtime.Own;

		/*
		 * The tag of a Component in a template, replaced by the element of its instance: {Element(), Watch(callback)}, the
		 * element of now (null while none is mounted) and callback(element) at each new one. The behavioral directives
		 * of the tag follow it (Template and Component).
		 */
		Runtime.ComponentHosts = new WeakMap();

		/* $Copy: a copy of a tag → the part of its owner it was made in, destroyed with it (Template and Component). */
		Runtime.CopyParts = new WeakMap();

		/* Structural: bindings and props */
		function expression (data, source) {
			try {
				return Runtime.EvaluateExpression(source, data);
			}
			catch (error) {
				if (!(error && error.name === 'ReferenceError') && global.console && console.error) {
					console.error('Elemenx structural expression failed: ' + source, error);
				}

				return undefined;
			}
		}

		function propValue (text, data) {
			var match = /^{{\s*([\s\S]+?)\s*}}$/.exec(text);
			if (match)
				return expression(data, match[1]);

			if (text === '') return true;
			if (text === 'true') return true;
			if (text === 'false') return false;
			if (text === 'null') return null;

			return text;
		}

		function bindingTarget (target) {
			var parts = [];
			var length = target.length;
			var i = 0;
			var start;
			var value;

			/* A name segment; kebab-case is read as camelCase, like the name of a plain attribute. */
			function identifier () {
				var code;

				if (i >= length || !/[A-Za-z_$]/.test(target.charAt(i)))
					throw new Error('Elemenx invalid Component binding target: [' + target + ']');

				start = i++;

				while (i < length) {
					code = target.charAt(i);

					if (code === '-' && /[a-z]/.test(target.charAt(i + 1))) {
						i += 2;

						continue;
					}

					if (!/[\w$]/.test(code)) break;

					i++;
				}

				return target.substring(start, i).replace(/-([a-z])/g, function (match, letter) {
					return letter.toUpperCase();
				});
			}

			parts.push(identifier());

			while (i < length) {
				if (target.charAt(i) === '.') {
					i++;

					parts.push(identifier());

					continue;
				}

				if (target.charAt(i) === '[') {
					i++;
					start = i;

					while (i < length && /\d/.test(target.charAt(i)))
						i++;

					if (start === i || target.charAt(i) !== ']')
						throw new Error('Elemenx invalid Component binding target: [' + target + ']');

					value = parseInt(target.substring(start, i), 10);

					parts.push(value);

					i++;

					continue;
				}

				throw new Error('Elemenx invalid Component binding target: [' + target + ']');
			}

			return parts;
		}

		function canonicalPropKey (source, key) {
			if (!source || (typeof source !== 'object' && typeof source !== 'function') || typeof key !== 'string') return key;
			if (own(source, key)) return key;

			return Runtime.CaseName(source, key) || key;
		}

		function canonicalBindingPath (target, definition) {
			var path = bindingTarget(target);
			var source = definition;
			var i = 0;
			var key;

			while (i < path.length && source != null) {
				key = path[i];

				if (typeof key === 'string') {
					key = canonicalPropKey(source, key);
					path[i] = key;
				}

				source = source[key];

				i++;
			}

			return path;
		}

		/* A value put at a path of props ([style.width] is Style.width), the objects and the arrays on the way made. */
		function assignPath (result, path, value) {
			var root = path[0];
			var current;
			var i = 1;

			if (path.length === 1) {
				result[root] = value;

				return;
			}

			if (!own(result, root))
				result[root] = typeof path[1] === 'number' ? [] : {};

			current = result[root];

			while (i < path.length - 1) {
				if (current[path[i]] === undefined || current[path[i]] === null)
					current[path[i]] = typeof path[i + 1] === 'number' ? [] : {};

				current = current[path[i]];

				i++;
			}

			current[path[path.length - 1]] = value;
		}

		/*
		 * class and style of the tag of a Component go on the root of its instance, unless it has props of those names
		 * (they reach it as props too: a deferred Component, whose definition is not known yet, takes them as its props
		 * name them, and its root the others).
		 */
		function rootAttribute (name, definition) {
			return (name === 'class' || name === 'style') && !own(definition || {}, canonicalPropKey(definition, name));
		}

		/* The class and the style of the tag of a Component for the root of its instance, their {{ }} computed: {Class, Style}, or null. */
		function rootValues (node, data, definition) {
			var values = {Class: null, Style: null};
			var found = false;

			['class', 'style'].forEach(function (name) {
				var text = node.getAttribute(name);
				if (text === null || !rootAttribute(name, definition)) return;

				found = true;
				values[name === 'class' ? 'Class' : 'Style'] = text.replace(/{{\s*([\s\S]+?)\s*}}/g, function (match, source) {
					var value = expression(data, source);

					return value === null || value === undefined ? '' : String(value);
				});
			});

			return found ? values : null;
		}

		/*
		 * The props of the tag of a Component, read once for its blueprint and its definition: the names of its plain
		 * attributes, their values (an expression for a {{ }}), and the paths of its bindings. A tag renders its props
		 * at every change its expressions depend on; what it says of them stays, and is not read again each time.
		 */
		var propsPlans = new WeakMap();

		function propsPlan (node, definition) {
			var plan = propsPlans.get(node);
			var attrs = node.attributes;
			var i = 0;
			var name;
			var target;
			var interpolated;

			if (plan && plan.Definition === definition && plan.Count === attrs.length) return plan;

			plan = {Definition: definition, Count: attrs.length, Plain: [], Bound: [], Models: []};

			while (i < attrs.length) {
				name = attrs[i].name;
				target = Runtime.Directive.Binding(name);

				/*
				 * [(Prop)]="Name": the prop bound as [Prop] is, and Name given what the Component tells when it changes it
				 * (the event its $Model names for the prop, change by default). Any prop of the Component, in any case.
				 */
				if (target === null && Runtime.Directive.TwoWay(name) !== null) {
					target = canonicalBindingPath(Runtime.Directive.TwoWay(name), definition);

					if (target.length !== 1 || typeof target[0] !== 'string' || !definition || !own(definition, target[0]))
						throw new Error('Elemenx invalid two-way binding target: ' + name);

					if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(String(attrs[i].value).trim()))
						throw new Error('Elemenx invalid two-way binding expression: ' + name + '="' + attrs[i].value + '"');

					plan.Bound.push({Path: target, Expression: attrs[i].value});
					plan.Models.push({Prop: target[0], Event: modelEvent(definition, target[0]), Expression: String(attrs[i].value).trim()});

					i++;

					continue;
				}

				if (target === null && !Runtime.Directive.Reserved(name)) {
					name = canonicalPropKey(definition, name.replace(/-([a-z])/g, function (all, letter) {
						return letter.toUpperCase();
					}));
					interpolated = Runtime.Interpolation(attrs[i].value);

					/* Label="{{Name}}" is the value itself, Label="Hello, {{Name}}" a text, Label="\{{x}}" the text {{x}}. */
					if (interpolated && interpolated.Parts.length === 1 && typeof interpolated.Parts[0] !== 'string') {
						plan.Plain.push({Name: name, Expression: interpolated.Parts[0].Source, Parts: null, Value: undefined});
					}
					else if (interpolated && interpolated.Dynamic) {
						plan.Plain.push({Name: name, Expression: null, Parts: interpolated.Parts, Value: undefined});
					}
					else {
						plan.Plain.push({Name: name, Expression: null, Parts: null, Value: interpolated ? interpolated.Parts.join('') : propValue(attrs[i].value, null)});
					}
				}
				else if (target !== null) {
					plan.Bound.push({Path: canonicalBindingPath(target, definition), Expression: attrs[i].value});
				}

				i++;
			}

			propsPlans.set(node, plan);

			return plan;
		}

		/* The event a Component tells a new value of a prop by: what its $Model names for it ({Value: 'input'}), else change. */
		function modelEvent (definition, prop) {
			var model = definition && definition.$Model;

			return model && typeof model === 'object' && own(model, prop) && typeof model[prop] === 'string' ? model[prop] : 'change';
		}

		function props (node, data, definition) {
			var plan = propsPlan(node, definition);
			var result = {};
			var i = 0;
			var entry;

			/*
			 * Plain attributes establish root values first. Path bindings then
			 * overlay their target without depending on source attribute order.
			 */
			while (i < plan.Plain.length) {
				entry = plan.Plain[i];

				if (entry.Expression !== null) {
					result[entry.Name] = expression(data, entry.Expression);
				}
				else if (entry.Parts) {
					result[entry.Name] = Runtime.InterpolationValue(entry.Parts, function (part) {
						return expression(data, part.Source);
					});
				}
				else {
					result[entry.Name] = entry.Value;
				}

				i++;
			}

			i = 0;
			while (i < plan.Bound.length) {
				assignPath(result, plan.Bound[i].Path, expression(data, plan.Bound[i].Expression));

				i++;
			}

			return result;
		}

		function events (node) {
			var result = {};
			var attrs = node.attributes;
			var i = 0;
			var name;

			while (i < attrs.length) {
				name = attrs[i].name;

				var eventName = Runtime.Directive.Event(name);
				if (eventName !== null)
					result[eventName] = attrs[i].value;

				i++;
			}

			return result;
		}

		/* Structural: collection scopes */
		/* A collection never renders more iterations than this, so a wrong loop condition cannot freeze the page. */
		var collectionIterationLimit = 10000;

		function collectionScopes (loopScope, items, options) {
			var result = [];
			var mode = options.Mode || 'of';
			var variable = options.Variable || 'item';
			var source = items;
			var iterator;
			var step;
			var name;
			var scope;
			var conditionAssignment;
			var i = 0;

			if (mode === 'classic') {
				conditionAssignment = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=(?!=)/.exec(options.Condition);
				loopScope[variable] = expression(loopScope, options.Initializer);

				if (conditionAssignment && !own(loopScope, conditionAssignment[1]))
					loopScope[conditionAssignment[1]] = undefined;

				while (i < collectionIterationLimit && expression(loopScope, options.Condition)) {
					scope = Runtime.Assign({}, loopScope);
					scope.$index = i;

					result.push(scope);

					expression(loopScope, options.Step);

					i++;
				}
			}
			else if (mode === 'of') {
				if (source == null)
					source = [];

				Runtime.TrackIteration(source);

				if (typeof Symbol !== 'undefined' && source[Symbol.iterator]) {
					iterator = source[Symbol.iterator]();
					step = iterator.next();

					while (!step.done && i < collectionIterationLimit) {
						scope = Runtime.Assign({}, loopScope);
						scope[variable] = step.value;
						scope.$index = i;

						result.push(scope);

						i++;

						step = iterator.next();
					}
				}
				else {
					while (i < source.length && i < collectionIterationLimit) {
						scope = Runtime.Assign({}, loopScope);
						scope[variable] = source[i];
						scope.$index = i;

						result.push(scope);

						i++;
					}
				}
			}
			else if (mode === 'in') {
				if (source == null)
					source = {};

				Runtime.TrackIteration(source);

				for (name in source) {
					if (!own(source, name)) continue;
					if (i >= collectionIterationLimit) break;

					scope = Runtime.Assign({}, loopScope);
					scope[variable] = name;
					scope.$index = i;

					result.push(scope);

					i++;
				}
			}
			else {
				throw new Error('Elemenx unknown collection render mode: ' + mode);
			}

			if (i >= collectionIterationLimit)
				throw new Error('Elemenx structural collection exceeded the iteration limit (' + collectionIterationLimit + ')');

			return result;
		}

		/* Structural: DOM helpers */
		function contentsHost () {
			var host = document.createElement('span');

			host.style.display = 'contents';

			return host;
		}

		/* Replaces node by an end marker comment: the place where its rendered content goes. */
		function replaceWithMarker (node, text) {
			var end = document.createComment(text);

			node.parentNode.insertBefore(end, node.nextSibling);
			node.parentNode.removeChild(node);

			return end;
		}

		/* The child indexes from the first ancestor accepted by isTop down to node, or null when node is detached before it. */
		function nodePath (node, isTop) {
			var path = [];
			var current = node;

			while (current && !isTop(current)) {
				if (!current.parentNode) return null;

				path.unshift(Array.prototype.indexOf.call(current.parentNode.childNodes, current));

				current = current.parentNode;
			}

			return current ? {Path: path, Top: current} : null;
		}

		/*
		 * The template source of a structural subtree. outerHTML escapes & < > " in attribute values, while
		 * Elemenx expressions are read raw (never HTML-decoded), so expression attributes are written back unescaped.
		 */
		var svgNamespace = 'http://www.w3.org/2000/svg';

		/*
		 * The source of a structural template: an element of an SVG drawing (a <circle> of a *for) is parsed inside an
		 * <svg>, or it would come out as an unknown HTML element; createFragment takes it out again.
		 */
		function svgSource (element, html) {
			if (element.namespaceURI !== svgNamespace || element.localName === 'svg') return html;

			return '<svg data-elemenx-svg="">' + html + '</svg>';
		}

		/*
		 * The expressions of a template as one text: the {{ }} of its texts and its attributes, and the values of its
		 * bindings, its handlers and its directives ([name]="...", (event)="...", *name="..."; a handler set in $OnCreate
		 * is a value, not a method). The names of its tags, its attributes, its classes and its plain texts are no names
		 * of its state: a collection that depended on them read them at every render.
		 */
		function expressionText (html) {
			var parts = [];
			var match;
			var expressions = /\{\{([\s\S]*?)\}\}/g;
			var bound = /\s(?:\[[^\]\s=]+\]|\([^)\s=]+\)|\*[A-Za-z][A-Za-z0-9_-]*)="([^"]*)"/g;

			while ((match = expressions.exec(html)))
				parts.push(match[1]);

			while ((match = bound.exec(html)))
				parts.push(match[1]);

			return parts.join('\n');
		}

		function templateHTML (element) {
			var entities = {amp: '&', lt: '<', gt: '>', quot: '"'};

			return element.outerHTML.replace(/(\s(?:\*[A-Za-z][A-Za-z0-9_-]*|\[[^\]\s]+\])=)"([^"]*)"/g, function (match, prefix, value) {
				value = value.replace(/&(amp|lt|gt|quot);/g, function (entity, name) {
					return entities[name];
				});

				if (value.indexOf('"') === -1)
					return prefix + '"' + value + '"';

				if (value.indexOf("'") === -1)
					return prefix + "'" + value + "'";

				return match;
			});
		}

		function nodeAt (root, path) {
			var current = root;
			var i = 0;

			while (i < path.length && current) {
				current = current.childNodes[path[i]];

				i++;
			}

			return current || null;
		}

		/* Moves the children of a Component declaration into slot groups; ownerToken marks the Structural that declared them. */
		function slotProjection (node, ownerToken) {
			var host = contentsHost();
			var groups = {};
			var blueprints = {};
			var child;
			var name;
			var group;

			while (node.firstChild) {
				child = node.firstChild;
				name = '';

				if (child.nodeType === 1) {
					name = child.getAttribute('slot') || '';

					if (child.hasAttribute('slot'))
						child.removeAttribute('slot');
				}

				group = groups[name];

				if (!group) {
					group = contentsHost();
					group.__ElemenxSlotGroup = name;
					group.__ElemenxProjectionOwner = ownerToken;

					groups[name] = group;

					blueprints[name] = contentsHost();
					blueprints[name].__ElemenxSlotGroup = name;

					host.appendChild(group);
				}

				/* A <Fragment slot="name"> gives what it holds to the slot, without itself (one with a directive stays a host). */
				if (child.nodeType === 1 && child.tagName === 'ELEMENX-FRAGMENT' && !Runtime.Directive.Find(child, 'structural')) {
					while (child.firstChild) {
						blueprints[name].appendChild(child.firstChild.cloneNode(true));
						group.appendChild(child.firstChild);
					}

					node.removeChild(child);

					continue;
				}

				blueprints[name].appendChild(child.cloneNode(true));

				/*
				 * Move the ORIGINAL node into a stable group host.
				 * Bindings keep DOM identity, while Structural() may freely
				 * replace descendants inside this host.
				 */
				group.appendChild(child);
			}

			if (!host.childNodes.length) return null;

			return {
				Host: function () {
					return host;
				},

				Groups: function () {
					var result = {};
					var groupName;

					for (groupName in groups) {
						if (own(groups, groupName)) {
							result[groupName] = [groups[groupName]];
						}
					}

					return result;
				},

				Blueprints: function () {
					return blueprints;
				},

				PrimeBlueprints: function (value) {
					if (value)
						blueprints = value;

					return this;
				}
			};
		}

		/* Structural: definition methods */
		/*
		 * A method of a definition called on a Component, made once for each (the same function at every render): the
		 * scopes of the iterations of a collection compare their values, and a new function each time would tell every
		 * row that its methods changed.
		 */
		var boundMethods = new WeakMap();

		function boundMethod (definition, component, name) {
			var cache = boundMethods.get(component);

			if (!cache || cache.Definition !== definition) {
				cache = {Definition: definition, Methods: {}};

				boundMethods.set(component, cache);
			}

			if (!own(cache.Methods, name)) {
				cache.Methods[name] = function () {
					return definition[name].apply(component, arguments);
				};
			}

			return cache.Methods[name];
		}

		/* Copies the methods of definition accepted by include into target, called on the owning component. */
		function bindMethods (definition, component, target, include) {
			var name;

			for (name in definition) {
				if (own(definition, name) && typeof definition[name] === 'function' && include(name))
					target[name] = boundMethod(definition, component, name);
			}

			return target;
		}

		/* Collection items see the plain methods of their owner. */
		function plainMethod (name) {
			return name.charAt(0) !== '$';
		}

		/* A structural subtree sees every method of its owner except the template and the lifecycle hooks. */
		function subtreeMethod (name) {
			return name !== '$Template' && name.indexOf('$On') !== 0;
		}

		/* The props whose values differ from the previous ones, or null when none changed. */
		function changedValues (previous, next) {
			var result = {};
			var changed = false;
			var name;

			for (name in next) {
				if (own(next, name) && (!previous || previous[name] !== next[name])) {
					result[name] = next[name];

					changed = true;
				}
			}

			return changed ? result : null;
		}

		/* Structural: host engine */
		function Structural (component, definition, blueprintRoot) {
			var directiveHosts = {};

			function directiveHost (name, compiler) {
				if (compiler !== undefined) {
					if (!name || typeof compiler !== 'function')
						throw new Error('Elemenx directive host requires a name and compiler');

					directiveHosts[name] = compiler;

					return compiler;
				}

				return directiveHosts[name] || null;
			}

			function compileDirectiveHost (node, directive) {
				var compiler = directiveHost(directive.Definition.Host);
				if (!compiler)
					throw new Error('Elemenx unknown directive host: ' + directive.Definition.Host);

				return compiler(node, directive);
			}

			var records = [];
			var projectionBlueprintRoot = null;
			var ownerToken = {};
			/* While the content of the tag of a Component compiles: the $OnCreate of its directives, run once it is shown. */
			var deferredCreates = null;

			/* The $OnCreate of a structural directive: now, or with the content of the tag of a Component it is in. */
			function created (definition, context) {
				if (typeof definition.$OnCreate !== 'function') return;

				if (deferredCreates) {
					deferredCreates.push(function () {
						definition.$OnCreate(context);
					});
				}
				else {
					definition.$OnCreate(context);
				}
			}

			function factoryFor (tag) {
				var name = String(tag);
				var factory = Runtime.ResolveComponentRegistered(name);
				if (factory)
					return factory;

				var application = component.$Application();

				if (Runtime.Bundle.ResolvedName('Component', name) || Runtime.Bundle.Deferred('Component', name)) {
					return Runtime.ResolveComponent(name);
				}

				if (application && Runtime.Discovery.Ready(application) && Runtime.Discovery.ResolvedName(application, name)) {
					return Runtime.ResolveComponent(name);
				}

				if (Runtime.Library.ResolvedURL(application, name)) {
					return Runtime.ResolveComponent(name);
				}

				return null;
			}

			function asyncOptions (blueprint, name, extra) {
				var result = extra || {};

				result.Application = component.$Application();

				result.AsyncLifecycle = {
					Owner: component,
					Name: name,
					Pending: blueprint.getAttribute(Runtime.Directive.AttributeForRole('pending')),
					Error: blueprint.getAttribute(Runtime.Directive.AttributeForRole('error'))
				};

				return result;
			}

			/* The listeners of the (events) of a declaration: they call the methods of the component of the template. */
			/* The listeners of the two-way bindings of the tag of a Component: Name = what it told, at the event of the prop. */
			function modelListeners (blueprint, definition) {
				return propsPlan(blueprint, definition).Models.map(function (model) {
					return {Name: model.Event, Callback: function (data, source) {
						Runtime.CallHandler(component, model.Expression + ' = $event', [data, source]);
					}};
				});
			}

			/*
			 * An (event) of the tag of a Component hears an event of the page sent to the root of its instance too, not one
			 * from inside it: a directive on the tag (*copy) tells its copied there. Only an event made by a script (a
			 * CustomEvent): a press on the root of a Button is the click the Button tells itself. Heard once it is sent, and
			 * not when the Component told an event of that name meanwhile: a Component that tells again what a directive of
			 * its own root sends (InfiniteList, *infinite, more) is heard once, by what it tells.
			 */
			function rootListeners (child, eventMap, heard) {
				var root = child.$Element();
				var later = typeof global.queueMicrotask === 'function' ? global.queueMicrotask.bind(global) : function (callback) {
					global.setTimeout(callback, 0);
				};
				var eventName;

				if (!root || root.nodeType !== 1 || typeof root.addEventListener !== 'function') return;

				for (eventName in eventMap) {
					if (own(eventMap, eventName)) {
						(function (name, method) {
							root.addEventListener(name, function (event) {
								var waiting;

								if (event.target !== root || typeof global.CustomEvent !== 'function' || !(event instanceof global.CustomEvent)) return;

								waiting = heard[name] = {Told: false};

								later(function () {
									if (heard[name] === waiting)
										heard[name] = null;

									if (!waiting.Told)
										Runtime.CallHandler(component, method, [event, root]);
								});
							}, true);
						})(eventName, eventMap[eventName]);
					}
				}
			}

			/* The listeners of the (events) of the tag of a Component; heard marks what it told while an event of its root is sent. */
			function listenersFor (eventMap, heard) {
				var result = [];
				var eventName;

				for (eventName in eventMap) {
					if (own(eventMap, eventName)) {
						(function (name, method) {
							result.push({Name: name, Callback: function (data, source) {
								if (heard && heard[name])
									heard[name].Told = true;

								Runtime.CallHandler(component, method, [data, source]);
							}});
						})(eventName, eventMap[eventName]);
					}
				}

				return result;
			}

			function scan (parent) {
				var nodes = [];
				var node = parent.firstChild;
				var i = 0;

				while (node) {
					nodes.push(node);

					node = node.nextSibling;
				}

				while (i < nodes.length) {
					compile(nodes[i]);

					i++;
				}
			}

			function compileProjection (projection) {
				var previousBlueprint;

				if (!projection || !projection.Host) return;

				previousBlueprint = projectionBlueprintRoot;
				projectionBlueprintRoot = projection.Blueprints ? projection.Blueprints() : null;

				scan(projection.Host());

				projectionBlueprintRoot = previousBlueprint;
			}

			function compile (node) {
				if (node.nodeType !== 1) return;

				/* A part of the template with no directive, no Component and no slot in it (its plan): nothing to compile there. */
				if (Runtime.InertNodes.has(node)) {
					Runtime.InertNodes.delete(node);

					return;
				}

				/* A foreign Application mount owns its complete subtree. */
				if (Runtime.ApplicationBoundary(component.$Application(), node)) return;

				/* Directive composition policy is validated before host dispatch. */
				Runtime.Directive.Policy(node);

				/*
				 * Projection is an ownership boundary, not a traversal dead-end.
				 * The declaring Structural instance owns this group and may compile
				 * through it. A receiving component sees the same DOM after slot
				 * placement, but must not compile the projected subtree a second time.
				 */
				if (node.__ElemenxSlotGroup !== undefined && node.__ElemenxProjectionOwner !== ownerToken) return;

				var structuralDirective = Runtime.Directive.Find(node, 'structural');

				/*
				 * A non-default structural host owns the node before component
				 * resolution. The default structural host composes with a Component
				 * boundary, so the Component keeps its own state/lifecycle and receives
				 * the directive as its structural condition.
				 */
				if (structuralDirective && structuralDirective.Definition.Host !== 'structural') {
					compileDirectiveHost(node, structuralDirective);

					return;
				}

				var factory = factoryFor(Runtime.ComponentTag(node, component.$Application()));

				if (factory) {
					compileComponent(node, factory, structuralDirective);

					return;
				}

				if (structuralDirective) {
					compileDirectiveHost(node, structuralDirective);

					return;
				}

				scan(node);
			}

			function isComponentElement (node) {
				return node === component.$Element();
			}

			/* The untouched declaration of node, also inside a projection (where the component DOM is not its source), or null. */
			function pristineNodeFor (node) {
				var found = blueprintFor(node);

				return found === node ? null : found;
			}

			directiveHost('structural', compileStructural);
			directiveHost('collection', compileCollectionDirective);

			function compileComponent (node, factory, structuralDirective) {
				var markerText = 'elemenx:component:' + Runtime.ComponentTag(node, component.$Application()) + ':end';

				if (structuralDirective)
					node.removeAttribute(structuralDirective.Attribute);

				var eventMap = events(node);
				var pristineNode = pristineNodeFor(node);
				var pristineProjection = pristineNode ? slotProjection(pristineNode.cloneNode(true), ownerToken) : null;
				var projected = slotProjection(node, ownerToken);

				/*
				 * Component input attributes belong to the declaration blueprint.
				 * Generic DOM binding collection runs before Structural() and consumes
				 * [property] attributes from the live DOM. Build the Component blueprint
				 * from the pristine tree so [prop] remains available to props(), exactly
				 * like plain attributes and {{...}} interpolation.
				 */
				var blueprint = pristineNode ? pristineNode.cloneNode(true) : node.cloneNode(true);

				if (projected && pristineProjection && pristineProjection.Blueprints)
					projected.PrimeBlueprints(pristineProjection.Blueprints());

				records.push(componentRecord(replaceWithMarker(node, markerText), factory, blueprint, structuralDirective, eventMap, projected, keepArgument(node), node));
			}

			/* *keep on a conditional host: true (an empty value too) or false; undefined without it. */
			function keepArgument (node) {
				var value = Runtime.Directive.Arguments(node, 'structural').keep;
				if (value === undefined) return undefined;

				return !/^\s*false\s*$/.test(value);
			}

			/* Takes the element of a component out of the page and gives it to the Cache asleep. */
			function sleep (child, name, evicted) {
				var element = child.$Element();

				Runtime.Detach(element);

				return Runtime.CacheSleep(child, element, name, evicted);
			}

			function componentRecord (end, factory, blueprint, structuralDirective, eventMap, projected, keep, tag) {
				var child = null;
				var previousProps = null;
				var currentData = null;
				var asleep = null;
				var destroying = false;
				var watchers = [];
				var context;
				var projectedRecords = [];
				var projectedCreates = [];
				var projectedStarted = false;
				var rebuilt = [];
				var stale = false;
				var outerRecords;
				var outerCreates;
				var copies = [];

				/*
				 * Another instance of the tag ($Copy of a $Copyable Component): the tag as it was declared, compiled again in
				 * the scope of its owner (the same bindings and content, a state of its own), the props given in place of
				 * their attributes; out of the page until its caller places it, destroyed with the tag or on its own.
				 */
				function copy (props) {
					var given = props || {};
					var names = Object.keys(given).map(function (key) {
						return key.toLowerCase();
					});
					var source = blueprint.cloneNode(true);
					var part;
					var host;
					var made;

					Array.prototype.slice.call(source.attributes).forEach(function (attribute) {
						var bare = attribute.name.replace(/^\[|\]$/g, '').toLowerCase();
						if (names.indexOf(bare) !== -1 || attribute.name === '*key' || attribute.name.charAt(0) === '#' || (structuralDirective && attribute.name === structuralDirective.Attribute))
							source.removeAttribute(attribute.name);
					});

					part = Runtime.CreateComponent(bindMethods(definition, component, {$Template: svgSource(source, templateHTML(source))}, subtreeMethod))(Runtime.ComponentValues(component), null, {
						DirectState: true,
						Owner: component,
						Application: component.$Application()
					});

					part.$Parent(component);

					host = part.$Element();
					made = Elemenx.Instance(host.__ElemenxStructuralRoot ? host.firstElementChild : host);

					if (!made) {
						part.$Destroy();

						throw new Error('Elemenx $Copy: the tag made no instance');
					}

					copies.push(part);

					Runtime.CopyParts.set(made, part);

					if (names.length)
						made.$Update(given);

					return made;
				}

				/* The element of the instance, to the directives of the tag. */
				function placed () {
					var element = child.$Element();

					watchers.slice().forEach(function (callback) {
						callback(element);
					});
				}

				if (tag) {
					Runtime.ComponentHosts.set(tag, {
						Element: function () {
							return child ? child.$Element() : null;
						},
						Watch: function (callback) {
							watchers.push(callback);
						}
					});
				}

				/*
				 * The content of the tag starts with its first instance, before the hooks of the instance (they see it
				 * built): a Component never shown makes nothing of its content (regression: <Section *if="false"> made the
				 * Components of its content, and its *lazy rendered them, in a tree no page held).
				 */
				function startProjection (data) {
					var i = 0;

					if (stale) {
						rebuildProjection();

						return;
					}

					if (projectedStarted) return;

					projectedStarted = true;

					projectedCreates.forEach(function (create) {
						create();
					});

					while (i < projectedRecords.length) {
						projectedRecords[i].$Update(data || {});

						i++;
					}
				}

				/*
				 * The content of the tag goes with its Component: hidden by a *if (not kept asleep), destroyed, or dropped
				 * asleep by the Cache. Its Components hear $OnDestroy; the next instance builds it again.
				 */
				function dropProjection () {
					var i = projectedRecords.length - 1;
					var groups;
					var name;

					if (!projected || (!projectedStarted && !rebuilt.length)) return;

					while (projectedStarted && i >= 0) {
						projectedRecords[i].$Destroy();

						i--;
					}

					rebuilt.forEach(function (part) {
						part.$Destroy();
					});

					projectedRecords = [];
					projectedStarted = false;
					rebuilt = [];
					stale = true;
					groups = projected.Groups();

					for (name in groups) {
						if (own(groups, name)) {
							while (groups[name][0].firstChild)
								groups[name][0].removeChild(groups[name][0].firstChild);
						}
					}
				}

				/*
				 * The content of the tag built again from its template, as the part of a *if is: a part for each group of
				 * slots, which shares the state of the owner.
				 */
				function rebuildProjection () {
					var groups = projected.Groups();
					var blueprints = projected.Blueprints();
					var name;
					var part;

					stale = false;

					for (name in groups) {
						if (own(groups, name) && blueprints[name]) {
							part = Runtime.CreateComponent(bindMethods(definition, component, {$Template: templateHTML(blueprints[name])}, subtreeMethod))(Runtime.ComponentValues(component), null, {
								DirectState: true,
								Owner: component,
								Application: component.$Application()
							});

							part.$Parent(component);

							groups[name][0].appendChild(part.$Element());

							rebuilt.push(part);
						}
					}
				}

				/* The class and the style of the tag on the root of the instance (a deferred one takes them from its placeholder). */
				function rootUpdate (data) {
					var values = rootValues(blueprint, data, factory.Definition);
					var element = child && child.$Element();
					if (values && element && element.nodeType === 1)
						Runtime.RootAttributes(element, values, factory.Definition);

					/* A bug: #name on a Component tag named nothing, the tag gone; it names the root of the instance. */
					if (tag && tag.__ElemenxRefName && element && element.nodeType === 1) {
						element.__ElemenxRefName = tag.__ElemenxRefName;
						element.__ElemenxRefOwner = tag.__ElemenxRefOwner;
					}
				}

				function createChild (data) {
					var childProps = props(blueprint, data, factory.Definition);
					/* The events of the root of the instance in their way, by name (rootListeners). */
					var heard = {};

					startProjection(data);

					/* The factory registers the listeners and the parent before the hooks of the child run. */
					child = Runtime.Untracked(function () {
						return factory(childProps, projected, asyncOptions(blueprint, factory.ComponentName || blueprint.tagName, {Listeners: listenersFor(eventMap, heard).concat(modelListeners(blueprint, factory.Definition)), Parent: component, Copy: copy}));
					});

					child.$Parent(component);

					rootListeners(child, eventMap, heard);

					end.parentNode.insertBefore(child.$Element(), end);

					previousProps = childProps;

					rootUpdate(data);

					placed();
				}

				context = structuralDirective ? {
					Name: structuralDirective.Name,
					$Element: blueprint,
					Marker: end,
					Component: component,
					Expression: structuralDirective.Expression,
					Value: undefined,
					Data: {},
					Mounted: function () {
						return child !== null;
					},
					Mount: function () {
						/* A child asleep wakes in its place; the props that changed meanwhile reach it on this update. */
						if (!child && asleep && Runtime.CacheWake(asleep)) {
							child = asleep.Component;

							end.parentNode.insertBefore(child.$Element(), end);

							placed();
						}

						asleep = null;

						if (!child)
							createChild(currentData || Runtime.ComponentValues(component));

						return child;
					},
					Unmount: function () {
						if (!child) return;

						if (!destroying && Runtime.CacheKeeps('structural', factory.Definition, keep)) {
							asleep = sleep(child, factory.ComponentName || blueprint.tagName, function () {
								asleep = null;

								dropProjection();
							});
						}
						else {
							child.$Destroy();

							previousProps = null;

							dropProjection();
						}

						child = null;
					}
				} : null;

				/*
				 * Compile projected structure at declaration time. Delaying this until
				 * the child becomes visible lets parent text bindings mutate the live
				 * DOM first; a later structural mount would then snapshot rendered text
				 * instead of the original {{expression}} template.
				 */
				if (projected) {
					outerRecords = records;
					outerCreates = deferredCreates;
					records = projectedRecords;
					deferredCreates = projectedCreates;

					compileProjection(projected);

					records = outerRecords;
					deferredCreates = outerCreates;
				}

				if (context)
					created(structuralDirective.Definition, context);

				var effect = Runtime.Effect(function () {
					var data = Runtime.ComponentValues(component);
					var childProps;

					currentData = data;

					if (context) {
						context.Value = context.Expression ? expression(data, context.Expression) : undefined;

						if (typeof structuralDirective.Definition.$OnUpdate === 'function')
							structuralDirective.Definition.$OnUpdate(context);
					}
					else if (!child) {
						createChild(data);

						/* without a structural directive the child stays for good: the marker is no longer needed */
						end.parentNode.removeChild(end);
					}

					if (!child)
						return false;

					childProps = props(blueprint, data, factory.Definition);

					/*
					 * Props are an input boundary. A retained child may mutate its own
					 * state; propagate only values that actually changed at the parent
					 * boundary.
					 */
					var changedProps = changedValues(previousProps, childProps);
					if (changedProps)
						Runtime.UpdateProps(child, changedProps);

					previousProps = childProps;

					rootUpdate(data);

					return true;
				}, true);

				return {
					$Update: function () {
						effect.Run();
					},

					$Destroy: function () {
						effect.Destroy();

						destroying = true;

						/* Its copies go with it. */
						copies.splice(0).forEach(function (part) {
							part.$Destroy();
						});

						if (asleep) {
							Runtime.CacheDrop(asleep);

							asleep = null;
						}

						if (context) {
							context.Unmount();

							if (typeof structuralDirective.Definition.$OnDestroy === 'function')
								structuralDirective.Definition.$OnDestroy(context);
						}
						else if (child) {
							child.$Destroy();
							child = null;

							previousProps = null;
						}

						/* The content of the tag goes with it; content never started has nothing to undo. */
						dropProjection();

						currentData = null;
					}
				};
			}

			function isSlotGroup (node) {
				return node.nodeType === 1 && node.__ElemenxSlotGroup !== undefined;
			}

			/* The untouched declaration of node: in its slot blueprint while compiling a projection, else in the component DOM. */
			function blueprintFor (node) {
				var found;
				var targetRoot;

				if (projectionBlueprintRoot) {
					found = nodePath(node, isSlotGroup);
					targetRoot = found ? projectionBlueprintRoot[found.Top.__ElemenxSlotGroup || ''] : null;
				}
				else {
					found = blueprintRoot ? nodePath(node, isComponentElement) : null;
					targetRoot = blueprintRoot;
				}

				if (!found || !targetRoot) return node;

				return nodeAt(targetRoot, found.Path) || node;
			}

			function compileCollectionDirective (node, directive) {
				var template = blueprintFor(node).cloneNode(true);
				var argumentsMap = Runtime.Directive.Arguments(template, 'collection');
				var children = [];
				var keyed = {};
				var referencedNames = null;
				var context;
				var end;

				template.removeAttribute(directive.Attribute);

				end = replaceWithMarker(node, 'elemenx:collection:' + directive.Name + ':end');

				function iterationDefinition () {
					var componentRoot = factoryFor(Runtime.ComponentTag(template, component.$Application()));
					var templateSource = componentRoot
						? '<span style="display:contents">' + templateHTML(template) + '</span>'
						: svgSource(template, templateHTML(template));

					return bindMethods(definition, component, {$Template: templateSource}, plainMethod);
				}

				/* Adds the names that source mentions to the names the iterations may read. */
				function reference (source) {
					var pattern = /[A-Za-z_$][A-Za-z0-9_$]*/g;
					var match;

					while ((match = pattern.exec(String(source || '')))) {
						referencedNames[match[0]] = true;
					}
				}

				/*
				 * The scope of the iterations holds the values of the Component that the template and the expressions
				 * name, and depends only on them: a value they never name cannot reach an iteration, and depending on
				 * it would render the whole collection again on every change of the Component.
				 */
				function baseScope (source) {
					var values = Runtime.ComponentValues(component);
					var scope = {};
					var name;
					var value;
					var raw;

					if (!referencedNames) {
						referencedNames = {};

						reference(expressionText(templateHTML(template)));
						reference(directive.Expression);

						for (name in argumentsMap) {
							if (own(argumentsMap, name))
								reference(argumentsMap[name]);
						}
					}

					reference(source);

					/*
					 * The values the template and the expressions name, and only them: a value they never name cannot reach
					 * an iteration, and copying all of the values of the Component went through its state at every render
					 * of the collection. A tracked read, also of a name that is not a value yet, so that adding it renders
					 * again; the plain object behind the state tells which names are values.
					 */
					raw = values.__raw__ || values;

					for (name in referencedNames) {
						if (own(referencedNames, name)) {
							value = values[name];

							if (own(raw, name))
								scope[name] = value;
						}
					}

					return bindMethods(definition, component, scope, plainMethod);
				}

				/* The values of next that differ from previous, or null when none does. */
				function changedScope (previous, next) {
					var changed = null;
					var key;

					for (key in next) {
						if (own(next, key) && (!own(previous, key) || !Object.is(previous[key], next[key]))) {
							changed = changed || {};
							changed[key] = next[key];
						}
					}

					return changed;
				}

				function destroyAll () {
					var i = children.length - 1;
					while (i >= 0) {
						children[i].Child.$Destroy();

						i--;
					}

					children = [];
					keyed = {};
				}

				/*
				 * The items of the last render and the values of the Component they saw: a render of the same items in
				 * the same order only gives the rows the values that changed (the selected one, a value of a form), and
				 * keeps them as they are, without a scope made again for each.
				 */
				var lastItems = null;
				var lastBase = null;

				/* The items of a collection of 'of' as a plain list (read through the state: the collection depends on them), or null. */
				function itemList (items) {
					var list = [];
					var i = 0;
					var source;

					if (!Array.isArray(items)) return null;

					/* The items as the plain array holds them: the collection depends on all of them at once, not on each. */
					Runtime.TrackIteration(items);

					source = items.__raw__ || items;

					while (i < source.length && i < collectionIterationLimit) {
						list.push(source[i]);

						i++;
					}

					return list;
				}

				function sameItems (list) {
					var i = 0;

					if (!list || !lastItems || list.length !== lastItems.length) return false;

					while (i < list.length) {
						if (list[i] !== lastItems[i]) return false;

						i++;
					}

					return true;
				}

				function render (items, options) {
					var base = baseScope();
					var mode = (options && options.Mode) || 'of';
					var list = mode === 'of' ? itemList(items) : null;
					var nextScopes;
					var keySource = options && options.Key ? options.Key : null;
					var nextChildren = [];
					var nextKeyed = {};
					var used = {};
					var i = 0;
					var scope;
					var identity;
					var token;
					var record;
					var child;
					var placeBefore;
					var element;
					var changed;

					/* The same items: the rows stay, the values of the Component that changed go to each of them. */
					if (list && lastBase && sameItems(list) && children.length === list.length) {
						changed = changedScope(lastBase, base);

						if (changed) {
							/* The scope of a row is the state of its iteration: $Update writes the values into it. */
							while (i < children.length) {
								children[i].Child.$Update(changed);

								i++;
							}
						}

						lastBase = base;

						return children.length;
					}

					nextScopes = collectionScopes(base, items, options || {});

					if (!keySource)
						destroyAll();

					while (i < nextScopes.length) {
						scope = nextScopes[i];
						record = null;
						token = null;

						if (keySource) {
							identity = expression(scope, keySource);

							if (identity === null || identity === undefined)
								throw new Error('Elemenx *key resolved to null/undefined: ' + keySource);

							token = typeof identity + ':' + String(identity);

							if (used[token])
								throw new Error('Elemenx duplicate collection key: ' + String(identity));

							used[token] = true;
							record = keyed[token] || null;
						}

						if (record) {
							changed = changedScope(record.Scope, scope);

							if (changed)
								record.Child.$Update(changed);

							record.Scope = scope;
						}
						else {
							child = Runtime.CreateComponent(iterationDefinition())(scope, null, {DirectState: true, Owner: component, Application: component.$Application()});

							child.$Parent(component);

							record = {Child: child, Key: token, Scope: scope};
						}

						nextChildren.push(record);

						if (keySource)
							nextKeyed[token] = record;

						i++;
					}

					if (keySource) {
						i = children.length - 1;

						while (i >= 0) {
							record = children[i];

							if (!nextKeyed[record.Key])
								record.Child.$Destroy();

							i--;
						}
					}

					/*
					 * Place the iterations from the end, moving only the ones out of place: moving an element
					 * that is already in place would take the focus (and the caret) away from it.
					 */
					placeBefore = end;
					i = nextChildren.length - 1;

					while (i >= 0) {
						element = nextChildren[i].Child.$Element();

						/* A row of a <Fragment> is its nodes between its two comments: the last one is where the next row follows. */
						if (Runtime.Last(element).nextSibling !== placeBefore || Runtime.First(element).parentNode !== end.parentNode)
							Runtime.Place(element, end.parentNode, placeBefore);

						placeBefore = Runtime.First(element);

						i--;
					}

					children = nextChildren;
					keyed = nextKeyed;
					lastItems = list;
					lastBase = list ? base : null;

					return children.length;
				}

				context = {
					Name: directive.Name,
					$Element: node,
					Component: component,
					Expression: directive.Expression,
					Value: undefined,
					Data: {},
					Argument: function (name) {
						return argumentsMap[name] === undefined ? null : argumentsMap[name];
					},
					Source: function (source) {
						return expression(baseScope(source), source);
					},
					Render: render
				};

				created(directive.Definition, context);

				var collectionEffect = Runtime.Effect(function () {
					if (typeof directive.Definition.$OnUpdate === 'function') {
						directive.Definition.$OnUpdate(context);
					}

					return children.length;
				}, true);

				records.push({
					$Update: function () {
						collectionEffect.Run();
					},
					$Destroy: function () {
						collectionEffect.Destroy();

						destroyAll();

						if (typeof directive.Definition.$OnDestroy === 'function') {
							directive.Definition.$OnDestroy(context);
						}
					}
				});
			}

			/*
			 * The content of the tag of this Component that its slots put inside node (a slot in a *if of its template):
			 * {Groups()} for the part node makes, or null. The part is made from the pristine template, where the slot is
			 * empty: the groups go into it each time the part is made (regression: a slot in a *if that turned on later
			 * stayed empty).
			 */
			function projectedInto (node) {
				var groups = {};
				var found = false;

				/* A group holds the content of the tag: the groups inside it are of the Components of that content. */
				function walk (parent) {
					var child = parent.firstChild;
					var name;

					while (child) {
						if (child.nodeType === 1 && child.__ElemenxSlotGroup !== undefined && child.__ElemenxProjectionOwner !== ownerToken) {
							name = child.__ElemenxSlotGroup;
							groups[name] = (groups[name] || []).concat([child]);
							found = true;
						}
						else if (child.nodeType === 1) {
							walk(child);
						}

						child = child.nextSibling;
					}
				}

				walk(node);

				return found ? {
					Groups: function () {
						return groups;
					}
				} : null;
			}

			function compileStructural (node, directive) {
				var field = directive.Expression;
				var template = blueprintFor(node).cloneNode(true);
				var keep = keepArgument(template);
				var projected = projectedInto(node);
				var end;
				var child = null;
				var asleep = null;
				var destroying = false;
				var context = {
					Name: directive.Name,
					$Element: node,
					Component: component,
					Expression: field,
					Value: undefined,
					Data: {},
					Mounted: function () {
						return child !== null;
					},
					Mount: function () {
						if (child)
							return child;

						if (asleep && Runtime.CacheWake(asleep)) {
							child = asleep.Component;
							asleep = null;

							Runtime.Place(child.$Element(), end.parentNode, end);

							return child;
						}

						asleep = null;

						var subtreeDefinition = bindMethods(definition, component, {$Template: svgSource(template, templateHTML(template))}, subtreeMethod);

						child = Runtime.CreateComponent(subtreeDefinition)(Runtime.ComponentValues(component), projected, {
							DirectState: true,
							Owner: component,
							Application: component.$Application()
						});

						child.$Parent(component);

						Runtime.Place(child.$Element(), end.parentNode, end);

						return child;
					},
					Unmount: function () {
						if (!child) return;

						if (!destroying && Runtime.CacheKeeps('structural', null, keep)) {
							asleep = sleep(child, '*' + directive.Name, function () {
								asleep = null;
							});
						}
						else {
							child.$Destroy();
						}

						child = null;
					}
				};

				template.removeAttribute(directive.Attribute);

				end = replaceWithMarker(node, 'elemenx:structural:' + directive.Name + ':end');

				context.Marker = end;

				created(directive.Definition, context);

				var structuralEffect = Runtime.Effect(function () {
					context.Value = field ? expression(Runtime.ComponentValues(component), field) : undefined;

					if (typeof directive.Definition.$OnUpdate === 'function') {
						directive.Definition.$OnUpdate(context);
					}

					return context.Value;
				}, true);

				records.push({
					$Update: function () {
						structuralEffect.Run();
					},
					$Destroy: function () {
						structuralEffect.Destroy();

						destroying = true;

						if (asleep) {
							Runtime.CacheDrop(asleep);

							asleep = null;
						}

						context.Unmount();

						if (typeof directive.Definition.$OnDestroy === 'function') {
							directive.Definition.$OnDestroy(context);
						}
					}
				});
			}

			scan(component.$Element());

			return {
				Update: function (data) {
					var i = 0;
					var count = records.length;

					while (i < count) {
						records[i].$Update(data || {});

						i++;
					}

					/*
					 * A first update may compile projected structural records.
					 * Run only the newly-added records once with the same data.
					 */

					while (i < records.length) {
						records[i].$Update(data || {});

						i++;
					}
				},

				Destroy: function () {
					var i = records.length - 1;

					while (i >= 0) {
						records[i].$Destroy();

						i--;
					}

					records = [];
				}
			};
		}

		Runtime.Structural = Structural;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Cache */
	(function (global) {
		'use strict';

		/* Everything off: the definitions stay loaded and every instance is destroyed when it leaves, as without a policy. */
		var policy = {Definitions: {MaxAge: 0, Max: 0}, Instances: {Scope: 'none', MaxAge: 0, Max: 0}};
		var scopes = ['none', 'marked', 'router', 'all'];
		var sleepers = [];
		var timer = 0;

		function copy () {
			return {
				Definitions: {MaxAge: policy.Definitions.MaxAge, Max: policy.Definitions.Max},
				Instances: {Scope: policy.Instances.Scope, MaxAge: policy.Instances.MaxAge, Max: policy.Instances.Max}
			};
		}

		function limit (value, name) {
			if (typeof value !== 'number' || !(value >= 0) || value === Number.POSITIVE_INFINITY)
				throw new Error('Elemenx.Cache expects ' + name + ' to be a number of 0 or more');

			return value;
		}

		/* A policy of the definitions or of the instances, checked key by key; the keys not given stay as they are. */
		function group (target, source, name, keys) {
			var key;

			if (source === undefined) return;

			if (!source || typeof source !== 'object')
				throw new Error('Elemenx.Cache expects ' + name + ' to be an object');

			for (key in source) {
				if (!Runtime.Own(source, key)) continue;

				if (keys.indexOf(key) === -1)
					throw new Error('Elemenx.Cache does not know ' + name + '.' + key);

				if (key === 'Scope') {
					if (scopes.indexOf(source.Scope) === -1)
						throw new Error('Elemenx.Cache expects Instances.Scope to be none, marked, router or all');

					target.Scope = source.Scope;
				}
				else {
					target[key] = limit(source[key], name + '.' + key);
				}
			}
		}

		/*
		 * Whether a component leaves its place asleep instead of being destroyed. kind: 'router' (a page of a Router) or
		 * 'structural' (a conditional host such as *if); explicit: the *keep of the host, or undefined. *keep="false" and
		 * $KeepAlive: false keep it out of every scope; *keep and $KeepAlive: true bring it in from the scope marked on.
		 */
		Runtime.CacheKeeps = function (kind, definition, explicit) {
			var scope = policy.Instances.Scope;
			if (scope === 'none' || explicit === false || (definition && definition.$KeepAlive === false)) return false;

			if (explicit === true || (definition && definition.$KeepAlive === true)) return true;

			return scope === 'all' || (scope === 'router' && kind === 'router');
		};

		/* Keeps a component asleep, out of the page: evicted() tells its place it is gone when the Cache destroys it. */
		Runtime.CacheSleep = function (component, element, name, evicted) {
			var entry = {Component: component, Name: name || '', SleptAt: Date.now(), Asleep: Runtime.SleepTree(element), Evicted: evicted || null};

			sleepers.push(entry);

			trim();

			schedule();

			return entry;
		};

		/* Wakes a component asleep: false when the Cache destroyed it meanwhile. */
		Runtime.CacheWake = function (entry) {
			var index = sleepers.indexOf(entry);
			if (index === -1) return false;

			sleepers.splice(index, 1);

			Runtime.WakeTree(entry.Asleep);

			return true;
		};

		/* Destroys a component asleep whose place goes away. */
		Runtime.CacheDrop = function (entry) {
			var index = sleepers.indexOf(entry);
			if (index === -1) return;

			sleepers.splice(index, 1);

			entry.Component.$Destroy();
		};

		function evict (entry) {
			var index = sleepers.indexOf(entry);
			if (index === -1) return;

			sleepers.splice(index, 1);

			if (entry.Evicted)
				entry.Evicted();

			entry.Component.$Destroy();
		}

		/* Max: the instances asleep longest go first. */
		function trim () {
			while (policy.Instances.Max && sleepers.length > policy.Instances.Max)
				evict(sleepers[0]);
		}

		function sweep () {
			var now = Date.now();
			var definitions = Runtime.ComponentUse();
			var idle;
			var cached;

			sleepers.slice().forEach(function (entry) {
				if (policy.Instances.MaxAge && now - entry.SleptAt >= policy.Instances.MaxAge)
					evict(entry);
			});

			idle = definitions.filter(function (entry) {
				return entry.Cached && !entry.Instances && entry.IdleSince;
			}).sort(function (a, b) {
				return a.IdleSince - b.IdleSince;
			});

			cached = definitions.filter(function (entry) {
				return entry.Cached;
			}).length;

			idle.forEach(function (entry) {
				var old = policy.Definitions.MaxAge && now - entry.IdleSince >= policy.Definitions.MaxAge;
				var many = policy.Definitions.Max && cached > policy.Definitions.Max;
				if ((old || many) && Runtime.EvictComponent(entry.Name))
					cached--;
			});
		}

		/* Whether the policy has something to watch: the age or the number of the definitions, the age of the instances. */
		function watching () {
			return !!(policy.Definitions.MaxAge || policy.Definitions.Max || (policy.Instances.MaxAge && sleepers.length));
		}

		/* A quarter of the shortest age, from a tenth of a second to a minute; a second for a number alone. */
		function interval () {
			var ages = [policy.Definitions.MaxAge, policy.Instances.MaxAge].filter(function (age) {
				return age > 0;
			});
			var shortest = ages.length ? Math.min.apply(Math, ages) : 4000;

			return Math.max(100, Math.min(60000, shortest / 4));
		}

		function schedule () {
			if (timer || !watching()) return;

			timer = global.setTimeout(function () {
				timer = 0;

				sweep();

				schedule();
			}, interval());
		}

		/*
		 * Elemenx.Cache(policy) sets the policy of the cache of the components and returns it; without an argument it
		 * returns it. policy: {Definitions: {MaxAge, Max}, Instances: {Scope, MaxAge, Max}} (milliseconds and counts, 0 for
		 * no limit). Definitions: a definition no instance uses for MaxAge, or beyond the Max of the definitions loaded,
		 * unloads its template, its style and the compiled expressions. Instances: an instance that leaves its place
		 * sleeps out of the page instead of being destroyed, and wakes as it was when it comes back; Scope none (the
		 * default), marked (*keep and $KeepAlive), router (and every page of a Router) or all (and every conditional host;
		 * the items of a collection never sleep); an instance asleep for MaxAge, or beyond the Max asleep, is destroyed.
		 */
		Elemenx.Cache = function (settings) {
			var next = copy();

			if (settings === undefined) return next;

			if (!settings || typeof settings !== 'object')
				throw new Error('Elemenx.Cache expects a policy object');

			Object.keys(settings).forEach(function (key) {
				if (key !== 'Definitions' && key !== 'Instances')
					throw new Error('Elemenx.Cache does not know ' + key);
			});

			group(next.Definitions, settings.Definitions, 'Definitions', ['MaxAge', 'Max']);
			group(next.Instances, settings.Instances, 'Instances', ['Scope', 'MaxAge', 'Max']);

			policy = next;

			if (policy.Instances.Scope === 'none')
				Elemenx.Cache.Clear();

			trim();

			schedule();

			return copy();
		};

		/* What the cache holds: the definitions used ({Name, Instances, Cached, Idle}) and the instances asleep ({Name, Asleep}). */
		Elemenx.Cache.Stats = function () {
			var now = Date.now();

			return {
				Definitions: Runtime.ComponentUse().map(function (entry) {
					return {Name: entry.Name, Instances: entry.Instances, Cached: entry.Cached, Idle: entry.Instances || !entry.IdleSince ? 0 : now - entry.IdleSince};
				}),
				Instances: sleepers.map(function (entry) {
					return {Name: entry.Name, Asleep: now - entry.SleptAt};
				})
			};
		};

		/* Destroys every instance asleep and unloads every definition no instance uses, whatever the policy. */
		Elemenx.Cache.Clear = function () {
			while (sleepers.length)
				evict(sleepers[0]);

			Runtime.ComponentUse().forEach(function (entry) {
				if (entry.Cached && !entry.Instances)
					Runtime.EvictComponent(entry.Name);
			});

			return Elemenx;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Network */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var invoke = Runtime.Invoke;
		var NetworkProtocols = {};

		/* A class of the browser a transport needs, or a plain error where there is none (Node, an old browser): it was "is not a constructor". */
		function browserClass (name, transport) {
			if (typeof global[name] !== 'function')
				throw new Error('Elemenx Network.' + transport + ' needs ' + name + ', which this environment has not');

			return global[name];
		}

		/* Network: shared helpers */
		var textEncoder = global.TextEncoder ? new global.TextEncoder() : null;

		/*
		 * The transports of Network.X(...), by name: each part puts its own in after its function (a build leaves out the
		 * parts its code names nowhere: tools/shake.js), and the facade makes one method of each that is there.
		 */
		var NetworkFactories = {};

		/* Size of a payload in bytes: a string counts as UTF-8, a binary value by its length. */
		function NetworkByteLength (value) {
			if (value === null || value === undefined) return 0;

			if (typeof value === 'string')
				return textEncoder ? textEncoder.encode(value).byteLength : value.length * 2;

			if (value instanceof global.ArrayBuffer) return value.byteLength;
			if (global.ArrayBuffer.isView(value)) return value.byteLength;
			if (global.Blob && value instanceof global.Blob) return value.size;

			return 0;
		}

		/* Adds one or several values of a request header. */
		function NetworkAddHeader (headers, key, value) {
			var name = String(key);
			var values = Array.isArray(value) ? value : [value];
			var i = 0;

			if (!headers[name])
				headers[name] = [];

			while (i < values.length) {
				headers[name].push(values[i]);

				i++;
			}
		}

		/* Emits a Transport event of a resource; Open and Close also stamp its lifecycle. */
		function NetworkTransportEvent (api, events, type, value) {
			if (type === 'Open' && api && api._LifecycleConnected)
				api._LifecycleConnected();

			if (type === 'Close' && api && api._LifecycleClosed)
				api._LifecycleClosed();

			return events.Emit('Transport', type, value);
		}

		/* Encodes an outbound value with the Protocol of a resource, if it has one. */
		function NetworkEncode (protocol, api, input) {
			if (!protocol || typeof protocol.Encode !== 'function') return input;

			return protocol.Encode.call(api, input, api);
		}

		/* Decodes an inbound value with the Protocol of a resource: the decoded {Type, Data}, or null. */
		function NetworkDecode (protocol, api, input) {
			var decoded;

			if (!protocol || typeof protocol.Decode !== 'function') return null;

			decoded = protocol.Decode.call(api, input, api);

			return decoded && decoded.Type ? decoded : null;
		}

		/* Decodes an inbound value and emits it as a Protocol event of the resource. */
		function NetworkDispatch (protocol, api, events, input, transportEvent) {
			var decoded = NetworkDecode(protocol, api, input);
			if (decoded)
				events.Emit('Protocol', decoded.Type, decoded.Data, transportEvent);
		}

		/* Sets every value of every request header on a native XMLHttpRequest. */
		function NetworkApplyHeaders (nativeXHR, headers) {
			var names = Object.keys(headers);
			var i = 0;
			var j;
			var values;

			while (i < names.length) {
				values = headers[names[i]];
				j = 0;

				while (j < values.length) {
					nativeXHR.setRequestHeader(names[i], values[j]);

					j++;
				}

				i++;
			}
		}

		/* Network: lifecycle and structured envelope */
		function NetworkStarted (target) {
			var startedAt = new Date();

			target.$StartedAt = function () {
				return new Date(startedAt.getTime());
			};

			return target;
		}

		function NetworkLifecycle (target) {
			var connectedAt = null;
			var closedAt = null;

			NetworkStarted(target);

			target.$ConnectedAt = function () {
				return connectedAt ? new Date(connectedAt.getTime()) : null;
			};

			target.$ClosedAt = function () {
				return closedAt ? new Date(closedAt.getTime()) : null;
			};

			target._LifecycleConnected = function () {
				connectedAt = new Date();
				closedAt = null;
			};

			target._LifecycleClosed = function () {
				closedAt = new Date();
			};

			return target;
		}

		function NetworkStructuredPack (value) {
			var parts = [];
			var descriptors = [];
			var encoder = new TextEncoder();
			var header;
			var manifest;
			var manifestBytes;
			var view;
			var i;

			function walk (item) {
				var descriptor;
				var output;
				var keys;
				var i;

				if (item instanceof Blob || item instanceof ArrayBuffer || ArrayBuffer.isView(item)) {
					descriptor = {
						Index: parts.length,
						Name: item && item.name ? item.name : null,
						Mime: item && item.type ? item.type : 'application/octet-stream',
						File: typeof global.File === 'function' && item instanceof global.File
					};

					if (item instanceof Blob) descriptor.Size = item.size;
					else if (item instanceof ArrayBuffer) descriptor.Size = item.byteLength;
					else descriptor.Size = item.byteLength;

					parts.push(item);
					descriptors.push(descriptor);

					return {$ElemenxBinary: descriptor.Index};
				}

				if (!item || typeof item !== 'object') return item;

				if (item instanceof Date)
					return {$ElemenxDate: item.toISOString()};

				if (Array.isArray(item)) {
					output = [];
					i = 0;

					while (i < item.length) {
						output.push(walk(item[i]));

						i++;
					}

					return output;
				}

				output = {};
				keys = Object.keys(item);
				i = 0;
				while (i < keys.length) {
					output[keys[i]] = walk(item[keys[i]]);

					i++;
				}

				return output;
			}

			manifest = {Value: walk(value), Parts: descriptors};
			manifestBytes = encoder.encode(JSON.stringify(manifest));

			header = new ArrayBuffer(8);
			view = new DataView(header);

			view.setUint32(0, 0x45585354);
			view.setUint32(4, manifestBytes.byteLength);

			var blobParts = [header, manifestBytes];

			i = 0;
			while (i < parts.length) {
				blobParts.push(parts[i]);

				i++;
			}

			return new Blob(blobParts, {type: 'application/x-elemenx-structured'});
		}

		/* Reads a structured envelope through the Promise-based Blob API and reports the value to callback (error, value). */
		function NetworkStructuredUnpack (blob, callback) {
			if (!blob || blob.type !== 'application/x-elemenx-structured') {
				invoke(callback, null, null);

				return;
			}

			blob.arrayBuffer().then(function (buffer) {
				var value;

				try {
					value = NetworkStructuredRead(buffer);
				}
				catch (error) {
					invoke(callback, error);

					return;
				}

				invoke(callback, null, value);
			}, function (error) {
				invoke(callback, error);
			});
		}

		/* Restores the value packed by NetworkStructuredPack from the bytes of its envelope. */
		function NetworkStructuredRead (buffer) {
			var view = new DataView(buffer);

			if (buffer.byteLength < 8 || view.getUint32(0) !== 0x45585354) {
				throw new Error('Elemenx invalid structured transfer envelope');
			}

			var manifestLength = view.getUint32(4);
			if (8 + manifestLength > buffer.byteLength)
				throw new Error('Elemenx invalid structured transfer manifest');

			var offsets = [];
			var manifest = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, manifestLength)));
			var offset = 8 + manifestLength;
			var i = 0;

			while (i < manifest.Parts.length) {
				offsets.push(offset);

				offset += manifest.Parts[i].Size;

				i++;
			}

			function restore (item) {
				var descriptor;
				var bytes;
				var output;
				var keys;
				var i;

				if (!item || typeof item !== 'object') return item;

				if (own(item, '$ElemenxBinary')) {
					descriptor = manifest.Parts[item.$ElemenxBinary];
					bytes = buffer.slice(offsets[item.$ElemenxBinary], offsets[item.$ElemenxBinary] + descriptor.Size);

					if (descriptor.File && typeof global.File === 'function')
						return new global.File([bytes], descriptor.Name || 'file', {type: descriptor.Mime});

					return new Blob([bytes], {type: descriptor.Mime});
				}

				if (own(item, '$ElemenxDate'))
					return new Date(item.$ElemenxDate);

				if (Array.isArray(item)) {
					output = [];
					i = 0;

					while (i < item.length) {
						output.push(restore(item[i]));

						i++;
					}

					return output;
				}

				output = {};
				keys = Object.keys(item);
				i = 0;

				while (i < keys.length) {
					output[keys[i]] = restore(item[keys[i]]);

					i++;
				}

				return output;
			}

			return restore(manifest.Value);
		}

		function NetworkEvents (target) {
			var events = {};

			function dispatch (name, event, context) {
				var list = events[name];
				if (!list) return;

				var copy = list.slice();
				var i = 0;

				while (i < copy.length) {
					Runtime.Notify(copy[i], target, [event, context || target]);

					i++;
				}
			}

			return {
				On: function (name, callback) {
					if (typeof callback !== 'function') return target;

					if (!events[name])
						events[name] = [];

					events[name].push(callback);

					return target;
				},

				Off: function (name, callback) {
					var list = events[name];
					if (!list)
						return target;

					if (typeof callback !== 'function') {
						delete events[name];

						return target;
					}

					var i = list.length - 1;
					while (i >= 0) {
						if (list[i] === callback) {
							list.splice(i, 1);
						}

						i--;
					}

					if (!list.length)
						delete events[name];

					return target;
				},

				Emit: function (namespace, type, data, context) {
					var event = {
						Namespace: namespace,
						Type: type,
						Data: data,
						Target: target
					};

					dispatch(namespace, event, context);
					dispatch(namespace + '.' + type, event, context);

					return event;
				}
			};
		}

		/* Network: Protocol */
		function NetworkProtocol (name, definition) {
			if (arguments.length === 1)
				return NetworkProtocols[name] || null;

			NetworkProtocols[name] = definition || {};

			return NetworkProtocols[name];
		}

		function ResolveNetworkProtocol (protocol) {
			if (!protocol) return null;

			if (typeof protocol === 'string')
				return NetworkProtocol(protocol);

			return protocol;
		}

		/* Network: XHR */
		function NetworkXHR (configuration) {
			var config = configuration || {};
			var method = config.Method || 'GET';
			var url = config.URL || '';
			var data = own(config, 'Data') ? config.Data : null;
			var headers = {};
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var xhr = null;
			var executing = false;
			var execution = 0;
			var events;
			var api;

			function addHeader (key, value) {
				NetworkAddHeader(headers, key, value);
			}

			function transport (type, data) {
				return events.Emit('Transport', type, data);
			}

			function decode (input, transportEvent) {
				NetworkDispatch(protocol, api, events, input, transportEvent);
			}

			function encode (input) {
				return NetworkEncode(protocol, api, input);
			}

			function responseHeaders (nativeXHR) {
				return {
					Status: nativeXHR.status,
					StatusText: nativeXHR.statusText,
					Headers: nativeXHR.getAllResponseHeaders(),
					URL: nativeXHR.responseURL || url,
					XHR: nativeXHR
				};
			}

			function response (nativeXHR) {
				return {
					Status: nativeXHR.status,
					StatusText: nativeXHR.statusText,
					Headers: nativeXHR.getAllResponseHeaders(),
					Response: nativeXHR.response,
					ResponseText: nativeXHR.responseType === '' || nativeXHR.responseType === 'text' ? nativeXHR.responseText : null,
					URL: nativeXHR.responseURL || url,
					XHR: nativeXHR
				};
			}


			if (config.Headers) {
				Object.keys(config.Headers).forEach(function (key) {
					addHeader(key, config.Headers[key]);
				});
			}

			api = {
				Method: function (value) {
					if (executing) return api;

					method = value;

					return api;
				},

				URL: function (value) {
					if (executing) return api;

					url = value;

					return api;
				},

				Data: function (value) {
					if (executing) return api;

					data = value;

					return api;
				},

				Header: function (key, value) {
					if (executing) return api;

					addHeader(key, value);

					return api;
				},

				Protocol: function (value) {
					if (executing) return api;

					protocol = ResolveNetworkProtocol(value);

					return api;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Off: function (name, callback) {
					return events.Off(name, callback);
				},

				Execute: function () {
					if (executing) return api;

					var requestData;
					var terminal = false;
					var responseStarted = false;

					executing = true;

					if (api._LifecycleConnected)
						api._LifecycleConnected();

					var currentExecution = ++execution;
					var currentXHR = new (browserClass('XMLHttpRequest', 'XHR'))();

					xhr = currentXHR;

					function active () {
						return !terminal && currentExecution === execution && xhr === currentXHR;
					}

					function finish (type, value) {
						if (!active()) return;

						terminal = true;
						executing = false;

						if (api._LifecycleClosed)
							api._LifecycleClosed();

						transport(type, value);
					}

					if (config.Timeout !== undefined)
						currentXHR.timeout = config.Timeout;

					if (config.ResponseType !== undefined)
						currentXHR.responseType = config.ResponseType;

					currentXHR.upload.addEventListener('progress', function (event) {
						if (!active()) return;

						transport('RequestProgress', event);
					});

					currentXHR.upload.addEventListener('load', function (event) {
						if (!active()) return;

						transport('AfterRequest', event);
					});

					currentXHR.addEventListener('readystatechange', function () {
						if (!active()) return;
						if (currentXHR.readyState !== 2 || responseStarted) return;

						responseStarted = true;

						transport('BeforeResponse', responseHeaders(currentXHR));
					});

					currentXHR.addEventListener('progress', function (event) {
						if (!active()) return;

						transport('ResponseProgress', event);
					});

					currentXHR.addEventListener('load', function () {
						if (!active()) return;

						var result = response(currentXHR);
						var responseEvent = transport('AfterResponse', result);

						decode(result.Response, responseEvent);

						finish('Success', result);
					});

					currentXHR.addEventListener('error', function (event) {
						finish('Error', {Event: event, XHR: currentXHR});
					});

					currentXHR.addEventListener('abort', function (event) {
						finish('Abort', {Event: event, XHR: currentXHR});
					});

					currentXHR.addEventListener('timeout', function (event) {
						finish('Timeout', {Event: event, XHR: currentXHR});
					});

					currentXHR.open(method, url, true);

					NetworkApplyHeaders(currentXHR, headers);

					requestData = encode(data);

					transport('BeforeRequest', {
						Method: method,
						URL: url,
						Data: requestData,
						XHR: currentXHR
					});

					currentXHR.send(requestData);

					return api;
				},

				Abort: function () {
					if (xhr && executing) {
						xhr.abort();
					}

					return api;
				},

				XHR: function () {
					return xhr;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.XHR = NetworkXHR;

		/* Network: Stream */
		function NetworkStream (configuration) {
			var config = configuration || {};
			var method = config.Method || 'GET';
			var url = config.URL || '';
			var data = own(config, 'Data') ? config.Data : null;
			var headers = {};
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var controller = null;
			var reader = null;
			var active = false;
			var paused = false;
			var reading = false;
			var resumeRead = null;
			var generation = 0;
			var events;
			var api;

			function addHeader (key, value) {
				NetworkAddHeader(headers, key, value);
			}

			function transport (type, value) {
				return NetworkTransportEvent(api, events, type, value);
			}

			function protocolEvent (type, value, transportEvent) {
				return events.Emit('Protocol', type, value, transportEvent);
			}

			function protocolData (input, transportEvent) {
				if (!protocol) return;

				var packets;
				var i = 0;

				if (typeof protocol.Push === 'function') {
					packets = protocol.Push.call(api, input, api);

					if (!packets) return;

					if (!Array.isArray(packets)) {
						packets = [packets];
					}

					while (i < packets.length) {
						if (packets[i] && packets[i].Type)
							protocolEvent(packets[i].Type, packets[i].Data, transportEvent);

						i++;
					}

					return;
				}

				NetworkDispatch(protocol, api, events, input, transportEvent);
			}

			function encode (input) {
				return NetworkEncode(protocol, api, input);
			}

			function fetchHeaders () {
				var result = {};
				var names = Object.keys(headers);
				var i = 0;

				while (i < names.length) {
					result[names[i]] = headers[names[i]].join(', ');

					i++;
				}

				return result;
			}

			if (config.Headers) {
				Object.keys(config.Headers).forEach(function (key) {
					addHeader(key, config.Headers[key]);
				});
			}

			api = {
				Method: function (value) {
					if (active)
						return api;

					method = value;

					return api;
				},

				URL: function (value) {
					if (active)
						return api;

					url = value;

					return api;
				},

				Data: function (value) {
					if (active)
						return api;

					data = value;

					return api;
				},

				Header: function (key, value) {
					if (active)
						return api;

					addHeader(key, value);

					return api;
				},

				Protocol: function (value) {
					if (active)
						return api;

					protocol = ResolveNetworkProtocol(value);

					return api;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Off: function (name, callback) {
					return events.Off(name, callback);
				},

				Connect: function () {
					var currentGeneration;
					var currentController;
					var body;
					var options;

					if (active)
						return api;

					active = true;
					paused = false;
					reading = false;
					resumeRead = null;
					currentGeneration = ++generation;
					currentController = new global.AbortController();
					controller = currentController;
					body = encode(data);

					options = {
						method: method,
						headers: fetchHeaders(),
						signal: currentController.signal
					};

					if (method !== 'GET' && method !== 'HEAD' && body !== null && body !== undefined) {
						options.body = body;
					}

					transport('BeforeConnect', {
						Method: method,
						URL: url,
						Data: body
					});

					global.fetch(url, options).then(function (response) {
						if (!active || currentGeneration !== generation || controller !== currentController) return;

						transport('Open', {
							Status: response.status,
							StatusText: response.statusText,
							Headers: response.headers,
							URL: response.url,
							Response: response
						});

						if (!response.body || typeof response.body.getReader !== 'function') {
							active = false;
							controller = null;

							transport('Error', {
								Reason: 'ReadableStreamUnavailable',
								Response: response
							});

							return;
						}

						var currentReader = response.body.getReader();

						reader = currentReader;

						function Read () {
							if (!active || paused || reading || currentGeneration !== generation || reader !== currentReader) return;

							reading = true;

							currentReader
								.read()
								.then(function (result) {
									reading = false;

									if (!active || currentGeneration !== generation || reader !== currentReader) return;

									if (result.done) {
										active = false;
										reader = null;
										controller = null;
										resumeRead = null;

										transport('End', {
											Response: response
										});

										return;
									}

									var dataEvent = transport('Data', {
										Data: result.value,
										Bytes: result.value.byteLength,
										Response: response
									});

									protocolData(result.value, dataEvent);

									if (!paused)
										Read();
								})
								.catch(function (error) {
									reading = false;

									if (!active || currentGeneration !== generation || reader !== currentReader) return;

									active = false;
									reader = null;
									controller = null;
									resumeRead = null;

									transport('Error', {
										Error: error,
										Response: response
									});
								});
						}

						resumeRead = Read;

						Read();
					}).catch(function (error) {
						if (!active || currentGeneration !== generation || controller !== currentController) return;

						active = false;
						controller = null;

						transport('Error', {
							Error: error
						});
					});

					return api;
				},

				Pause: function () {
					if (!active || paused) return api;

					paused = true;

					transport('Pause', {
						URL: url
					});

					return api;
				},

				Resume: function () {
					if (!active || !paused) return api;

					paused = false;

					transport('Resume', {
						URL: url
					});

					if (resumeRead)
						resumeRead();

					return api;
				},

				Close: function () {
					if (!active) return api;

					var currentReader = reader;
					var currentController = controller;

					transport('BeforeClose', {
						URL: url
					});

					active = false;
					paused = false;
					reading = false;
					resumeRead = null;
					generation++;
					reader = null;
					controller = null;

					if (currentReader)
						currentReader.cancel().catch(function () { });

					if (currentController)
						currentController.abort();

					transport('Close', {
						URL: url
					});

					return api;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.Stream = NetworkStream;

		/* Network: LongPolling */
		function NetworkLongPolling (configuration) {
			var config = configuration || {};
			var method = config.Method || 'GET';
			var url = config.URL || '';
			var data = own(config, 'Data') ? config.Data : null;
			var headers = {};
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var retry = config.Retry !== undefined ? config.Retry : 1000;
			var active = false;
			var request = null;
			var retryTimer = null;
			var generation = 0;
			var events;
			var api;

			function addHeader (key, value) {
				NetworkAddHeader(headers, key, value);
			}

			function transport (type, value) {
				return NetworkTransportEvent(api, events, type, value);
			}

			function decode (input, transportEvent) {
				NetworkDispatch(protocol, api, events, input, transportEvent);
			}

			function encode (input) {
				return NetworkEncode(protocol, api, input);
			}

			function schedule (currentGeneration) {
				if (!active || currentGeneration !== generation) return;

				retryTimer = global.setTimeout(function () {
					retryTimer = null;

					poll(currentGeneration);
				}, retry);
			}

			function poll (currentGeneration) {
				if (!active || currentGeneration !== generation || request) return;

				var current = new (browserClass('XMLHttpRequest', 'LongPolling'))();

				request = current;

				var body = encode(data);

				transport('BeforeRequest', {
					Method: method,
					URL: url,
					Data: body,
					XHR: current
				});

				current.addEventListener('readystatechange', function () {
					if (!active || currentGeneration !== generation || request !== current) return;
					if (current.readyState !== 2) return;

					transport('BeforeResponse', {
						Status: current.status,
						StatusText: current.statusText,
						XHR: current
					});
				});

				current.addEventListener('load', function () {
					if (!active || currentGeneration !== generation || request !== current) return;

					request = null;

					var dataEvent = transport('Data', {
						Data: current.responseText,
						Status: current.status,
						StatusText: current.statusText,
						XHR: current
					});

					decode(current.responseText, dataEvent);

					transport('AfterResponse', {
						Status: current.status,
						StatusText: current.statusText,
						Response: current.responseText,
						XHR: current
					});

					poll(currentGeneration);
				});

				current.addEventListener('error', function (event) {
					if (!active || currentGeneration !== generation || request !== current) return;

					request = null;

					transport('Error', {
						Event: event,
						XHR: current
					});

					schedule(currentGeneration);
				});

				current.addEventListener('timeout', function (event) {
					if (!active || currentGeneration !== generation || request !== current) return;

					request = null;

					transport('Timeout', {
						Event: event,
						XHR: current
					});

					schedule(currentGeneration);
				});

				current.addEventListener('abort', function () {
					if (currentGeneration !== generation || request !== current) return;

					request = null;
				});

				current.open(method, url, true);

				if (config.Timeout !== undefined)
					current.timeout = config.Timeout;

				NetworkApplyHeaders(current, headers);

				current.send(body);
			}

			if (config.Headers) {
				Object.keys(config.Headers).forEach(function (key) {
					addHeader(key, config.Headers[key]);
				});
			}

			api = {
				Method: function (value) {
					if (active)
						return api;

					method = value;

					return api;
				},

				URL: function (value) {
					if (active)
						return api;

					url = value;

					return api;
				},

				Data: function (value) {
					if (active)
						return api;

					data = value;

					return api;
				},

				Header: function (key, value) {
					if (active)
						return api;

					addHeader(key, value);

					return api;
				},

				Protocol: function (value) {
					if (active)
						return api;

					protocol = ResolveNetworkProtocol(value);

					return api;
				},

				Retry: function (value) {
					if (active)
						return api;

					retry = value;

					return api;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Off: function (name, callback) {
					return events.Off(name, callback);
				},

				Connect: function () {
					if (active)
						return api;

					active = true;

					var currentGeneration = ++generation;

					transport('BeforeConnect', {
						URL: url
					});

					transport('Open', {
						URL: url
					});

					poll(currentGeneration);

					return api;
				},

				Close: function () {
					if (!active) return api;

					transport('BeforeClose', {
						URL: url
					});

					active = false;
					generation++;

					if (retryTimer !== null) {
						global.clearTimeout(retryTimer);

						retryTimer = null;
					}

					var current = request;

					request = null;

					if (current)
						current.abort();

					transport('Close', {
						URL: url
					});

					return api;
				},

				XHR: function () {
					return request;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.LongPolling = NetworkLongPolling;

		/* Network: SSE */
		function NetworkSSE (configuration) {
			var config = configuration || {};
			var url = config.URL || '';
			var withCredentials = config.WithCredentials === true;
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var source = null;
			var connecting = false;
			var generation = 0;
			var events;
			var api;

			function transport (type, value) {
				return NetworkTransportEvent(api, events, type, value);
			}

			function decode (input, transportEvent) {
				NetworkDispatch(protocol, api, events, input, transportEvent);
			}

			api = {
				URL: function (value) {
					if (connecting) return api;

					url = value;

					return api;
				},

				WithCredentials: function (value) {
					if (connecting) return api;

					withCredentials = value === true;

					return api;
				},

				Protocol: function (value) {
					if (connecting) return api;

					protocol = ResolveNetworkProtocol(value);

					return api;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Off: function (name, callback) {
					return events.Off(name, callback);
				},

				Connect: function () {
					if (connecting) return api;

					connecting = true;

					var currentGeneration = ++generation;

					transport('BeforeConnect', {
						URL: url,
						WithCredentials: withCredentials
					});

					var currentSource = new (browserClass('EventSource', 'SSE'))(url, {
						withCredentials: withCredentials
					});

					source = currentSource;

					currentSource.addEventListener('open', function (event) {
						if (!connecting || currentGeneration !== generation || source !== currentSource) return;

						transport('Open', {
							Event: event,
							Source: currentSource
						});
					});

					currentSource.addEventListener('message', function (event) {
						if (!connecting || currentGeneration !== generation || source !== currentSource) return;

						var packet = {
							Data: event.data,
							LastEventID: event.lastEventId,
							Origin: event.origin,
							Event: event,
							Source: currentSource
						};

						var dataEvent = transport('Data', packet);

						decode(event.data, dataEvent);
					});

					currentSource.addEventListener('error', function (event) {
						if (!connecting || currentGeneration !== generation || source !== currentSource) return;

						transport('Error', {
							ReadyState: currentSource.readyState,
							Event: event,
							Source: currentSource
						});
					});

					return api;
				},

				Close: function () {
					if (!source) return api;

					var closedSource = source;

					generation++;

					transport('BeforeClose', {
						Source: closedSource
					});

					closedSource.close();

					connecting = false;
					source = null;

					transport('Close', {
						Source: closedSource
					});

					return api;
				},

				Source: function () {
					return source;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.SSE = NetworkSSE;

		/* Network: Transfer helpers */
		/* Delivers callback (error, value) in a microtask: never synchronously, and as soon as a resolved Promise would. */
		function defer (callback, error, value) {
			global.queueMicrotask(function () {
				invoke(callback, error, value);
			});
		}

		/* Subscriptions made on a transport, so that all of them can be released at once. */
		function NetworkTransportListeners () {
			var listeners = [];

			return {
				On: function (transport, name, callback) {
					if (!transport || typeof transport.On !== 'function') return;

					transport.On(name, callback);

					listeners.push({Name: name, Callback: callback});
				},
				Clear: function (transport) {
					var i = 0;

					if (transport && typeof transport.Off === 'function') {
						while (i < listeners.length) {
							transport.Off(listeners[i].Name, listeners[i].Callback);

							i++;
						}
					}

					listeners = [];
				}
			};
		}

		/* Network: Transfer sources and chunks */
		function makeID () {
			return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0x100000000).toString(36);
		}

		function sourceSize (source) {
			if (!source) return 0;

			if (typeof source.size === 'number') return source.size;
			if (typeof source.byteLength === 'number') return source.byteLength;
			if (ArrayBuffer.isView(source)) return source.byteLength;
			if (typeof source === 'string') return source.length;

			return 0;
		}

		function sourceName (source) {
			return source && source.name ? source.name : null;
		}

		function sourceType (source) {
			return source && source.type ? source.type : 'application/octet-stream';
		}

		function sliceSource (source, start, end) {
			var view;

			if (source instanceof Blob)
				return source.slice(start, end);

			if (source instanceof ArrayBuffer) return source.slice(start, end);

			if (ArrayBuffer.isView(source)) {
				view = new Uint8Array(
					source.buffer,
					source.byteOffset + start,
					Math.min(end - start, source.byteLength - start)
				);

				return view.slice().buffer;
			}

			throw new Error('Elemenx unsupported chunked transfer source');
		}

		/* Hands a chunk to callback (error, buffer) as an ArrayBuffer, always asynchronously. */
		function toArrayBuffer (value, callback) {
			var buffer = binary(value);

			if (buffer) {
				defer(callback, null, buffer);

				return;
			}

			if (value instanceof Blob) {
				value.arrayBuffer().then(function (buffer) {
					invoke(callback, null, buffer);
				}, function (error) {
					invoke(callback, error);
				});

				return;
			}

			defer(callback, new Error('Elemenx unsupported transfer chunk'));
		}

		/* A plain object or array travels as a structured Blob; binary values and strings travel as they are. */
		function transferSource (source) {
			if (source && typeof source === 'object' && !(source instanceof Blob) && !(source instanceof ArrayBuffer) && !ArrayBuffer.isView(source)) return NetworkStructuredPack(source);

			return source;
		}

		function clearFlight (flight) {
			if (!flight || !flight.Timer) return;

			global.clearTimeout(flight.Timer);

			flight.Timer = null;
		}

		/*
		 * Encoder (value, context) returns the encoded value. Encoder (value, context, done) encodes asynchronously
		 * and calls done (error, value) once. Either way the result reaches callback (error, value) asynchronously.
		 */
		function transferEncode (encoder, self, value, context, callback) {
			var settled = false;
			var result;

			function done (error, encoded) {
				if (settled) return;

				settled = true;

				defer(callback, error || null, encoded);
			}

			if (typeof encoder !== 'function') {
				done(null, value);

				return;
			}

			try {
				result = encoder.length >= 3 ? encoder.call(self, value, context, done) : encoder.call(self, value, context);
			}
			catch (error) {
				done(error);

				return;
			}

			if (encoder.length >= 3) return;

			if (result && typeof result.then === 'function') {
				done(new Error('Elemenx Transfer Encoder must return a value or call done (error, value), not return a Promise'));

				return;
			}

			done(null, result);
		}

		/* Network: Transfer outbound engine */
		function NetworkTransferOutbound (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var source = own(config, 'Data') ? config.Data : null;
			var encoder = config.Encoder || null;
			var chunkSize = config.ChunkSize || (64 * 1024);
			var windowSize = config.WindowSize || 8;
			var retry = config.Retry || 1500;
			var maxRetries = own(config, 'MaxRetries') ? config.MaxRetries : 8;
			var transferID = null;
			var offset = 0;
			var nextIndex = 0;
			var acknowledged = 0;
			var inFlight = {};
			var active = false;
			var ending = false;
			var generation = 0;
			var startedAt = 0;
			var sendCompletedAt = 0;
			var responseStartedAt = 0;
			var responseCompletedAt = 0;
			var phase = 'Idle';
			var loaded = 0;
			var total = 0;
			var wholeListeners = NetworkTransportListeners();
			var transportListeners = NetworkTransportListeners();
			var sendQueue = [];
			var draining = false;
			var events;
			var api;

			/* Outbound: events and phase */
			function emit (type, data) {
				return events.Emit('Transfer', type, data);
			}

			function setPhase (value, data) {
				if (phase === value) return;

				phase = value;

				emit('Phase', {
					ID: transferID,
					Phase: value,
					Data: data || null,
					Elapsed: startedAt ? Date.now() - startedAt : 0
				});
			}

			/* Outbound: flights and progress */
			function flightCount () {
				return Object.keys(inFlight).length;
			}

			function clearFlights () {
				var keys = Object.keys(inFlight);
				var i = 0;

				while (i < keys.length) {
					clearFlight(inFlight[keys[i]]);

					i++;
				}

				inFlight = {};
			}

			function chunkProgress () {
				var elapsed = Math.max(1, Date.now() - startedAt);

				emit('Progress', {
					ID: transferID,
					Loaded: acknowledged,
					Sent: offset,
					Total: total,
					Progress: total ? acknowledged / total : 1,
					InFlight: flightCount(),
					Speed: acknowledged * 1000 / elapsed,
					Elapsed: elapsed,
					Mode: 'Chunked'
				});
			}

			/* Outbound: completion and failure */
			/* Releases the flights, the transport listeners and the queued packets of the current transfer. */
			function release () {
				clearFlights();

				wholeListeners.Clear(transport);
				transportListeners.Clear(transport);

				sendQueue = [];
			}

			/* A successful transfer: the times not observed (a chunked transfer has no response phase) collapse to now. */
			function complete (mode, response) {
				var now = Date.now();
				var data;

				active = false;
				loaded = total;

				release();

				if (!sendCompletedAt)
					sendCompletedAt = now;

				if (!responseStartedAt)
					responseStartedAt = now;

				if (!responseCompletedAt)
					responseCompletedAt = now;

				setPhase('Complete');

				data = {
					ID: transferID,
					Loaded: loaded,
					Total: total,
					Elapsed: responseCompletedAt - startedAt,
					Metrics: {
						SendElapsed: sendCompletedAt - startedAt,
						WaitElapsed: Math.max(0, responseStartedAt - sendCompletedAt),
						ResponseElapsed: Math.max(0, responseCompletedAt - responseStartedAt),
						TotalElapsed: responseCompletedAt - startedAt
					}
				};

				if (mode === 'Whole')
					data.Response = response;

				data.Mode = mode;

				emit('Complete', data);
			}

			function fail (type, value) {
				if (!active) return;

				var mode = transport && typeof transport.Send === 'function' ? 'Chunked' : 'Whole';

				active = false;
				generation++;

				release();

				setPhase(type, value);

				emit(type, {
					ID: transferID,
					Loaded: loaded || acknowledged,
					Total: total,
					Elapsed: Date.now() - startedAt,
					Mode: mode,
					Phase: phase,
					Error: value instanceof Error ? value : null,
					TransportEvent: value instanceof Error ? null : value
				});
			}

			/* Outbound: send queue and retries */
			function drainSendQueue () {
				if (!active || draining) return;

				var item;

				draining = true;

				while (sendQueue.length) {
					if (transport && typeof transport.Writable === 'function' && !transport.Writable()) break;

					item = sendQueue[0];

					if (transport.Send(item.Packet) === false) break;

					sendQueue.shift();

					if (typeof item.Accepted === 'function')
						item.Accepted();
				}

				draining = false;
			}

			function sendPacket (packet, accepted) {
				if (!transport || typeof transport.Send !== 'function')
					throw new Error('Elemenx chunked transfer transport must provide Send(data)');

				sendQueue.push({Packet: packet, Accepted: accepted || null});

				drainSendQueue();
			}

			function scheduleRetry (flight, currentGeneration) {
				clearFlight(flight);

				flight.Timer = global.setTimeout(function () {
					if (!active || currentGeneration !== generation || !inFlight[flight.Index]) return;

					if (flight.Retries >= maxRetries) {
						fail('Error', new Error('Elemenx Transfer chunk acknowledgement timeout: ' + flight.Index));

						return;
					}

					flight.Retries++;

					try {
						sendPacket(flight.Packet, function () {
							if (!active || currentGeneration !== generation || !inFlight[flight.Index]) return;

							emit('Retry', {
								ID: transferID,
								Index: flight.Index,
								Retry: flight.Retries
							});

							scheduleRetry(flight, currentGeneration);
						});
					}
					catch (error) {
						fail('Error', error);
					}

				}, retry);
			}

			/* Outbound: chunk pump */
			function finishChunked () {
				if (!active || ending || flightCount() || offset < total) return;

				ending = true;

				try {
					sendPacket(
						{
							Type: 'Transfer',
							Action: 'End',
							ID: transferID,
							Chunks: nextIndex,
							Size: total
						},
						function () {
							if (!active) return;

							sendCompletedAt = Date.now();

							setPhase('WaitingComplete');
						}
					);
				}
				catch (error) {
					fail('Error', error);
				}
			}

			/* Sends an encoded chunk; it stays in flight, with a retry timer, until its Ack arrives. */
			function sendChunk (packet, currentGeneration) {
				var flight = {
					Index: packet.Index,
					Bytes: packet.Bytes,
					Packet: packet,
					Retries: 0,
					Timer: null
				};

				inFlight[packet.Index] = flight;

				try {
					sendPacket(packet, function () {
						if (!active || currentGeneration !== generation || !inFlight[packet.Index]) return;

						emit('Chunk', {
							ID: transferID,
							Index: packet.Index,
							Offset: packet.Offset,
							Bytes: packet.Bytes
						});

						scheduleRetry(flight, currentGeneration);

						pump(currentGeneration);

						chunkProgress();
					});
				}
				catch (error) {
					delete inFlight[packet.Index];
					fail('Error', error);
				}
			}

			/* Reads and encodes one chunk; its flight is reserved from the start, so the window counts it. */
			function prepareChunk (chunkStart, chunkEnd, chunkIndex, chunkValue, currentGeneration) {
				function chunkFailed (error) {
					if (!active || currentGeneration !== generation) return;

					delete inFlight[chunkIndex];

					fail('Error', error);
				}

				inFlight[chunkIndex] = {
					Index: chunkIndex,
					Bytes: chunkEnd - chunkStart,
					Packet: null,
					Retries: 0,
					Timer: null,
					Preparing: true
				};

				toArrayBuffer(chunkValue, function (bufferError, buffer) {
					if (bufferError) {
						chunkFailed(bufferError);

						return;
					}

					transferEncode(encoder, api, buffer, {
						Mode: 'Chunked',
						ID: transferID,
						Index: chunkIndex,
						Offset: chunkStart,
						Size: buffer.byteLength,
						Transport: transport
					}, function (encodeError, payload) {
						if (encodeError) {
							chunkFailed(encodeError);

							return;
						}

						if (!active || currentGeneration !== generation) return;

						sendChunk({
							Type: 'Transfer',
							Action: 'Chunk',
							ID: transferID,
							Index: chunkIndex,
							Offset: chunkStart,
							Bytes: chunkEnd - chunkStart,
							Data: payload
						}, currentGeneration);
					});
				});
			}

			function pump (currentGeneration) {
				if (!active || currentGeneration !== generation) return;

				var start;
				var end;

				while (flightCount() < windowSize && offset < total) {
					start = offset;
					end = Math.min(start + chunkSize, total);
					offset = end;

					prepareChunk(start, end, nextIndex++, sliceSource(source, start, end), currentGeneration);
				}

				finishChunked();
			}

			/* Outbound: acknowledgements */
			function receivePacket (packet) {
				if (!packet || packet.Type !== 'Transfer' || packet.ID !== transferID) return;

				var flight;

				if (packet.Action === 'Ack') {
					flight = inFlight[packet.Index];

					if (!flight) return;

					clearFlight(flight);

					delete inFlight[packet.Index];

					acknowledged += flight.Bytes;

					loaded = acknowledged;

					chunkProgress();

					pump(generation);

					return;
				}

				if (packet.Action === 'Complete') {
					if (!active) return;

					complete('Chunked', null);
				}
			}

			/* Outbound: whole transport */
			function wholeProgress (event) {
				var nativeEvent;
				var elapsed;

				if (!active) return;

				nativeEvent = event.Data;
				loaded = nativeEvent && typeof nativeEvent.loaded === 'number' ? nativeEvent.loaded : loaded;

				if (nativeEvent && nativeEvent.lengthComputable && typeof nativeEvent.total === 'number')
					total = nativeEvent.total;

				elapsed = Math.max(1, Date.now() - startedAt);

				emit('Progress', {
					ID: transferID,
					Loaded: loaded,
					Total: total,
					Progress: total ? loaded / total : 0,
					Speed: loaded * 1000 / elapsed,
					Elapsed: elapsed,
					Event: nativeEvent || null,
					Mode: 'Whole'
				});

				if (total && loaded >= total && !sendCompletedAt) {
					sendCompletedAt = Date.now();

					setPhase('WaitingResponse');
				}
			}

			function executeWhole () {
				transferEncode(encoder, api, source, {
					Mode: 'Whole',
					Transport: transport,
					Name: sourceName(source),
					Type: sourceType(source),
					Size: total
				}, function (error, payload) {
					if (error) {
						fail('Error', error);

						return;
					}

					if (!active) return;

					wholeListeners.On(transport, 'Transport.RequestProgress', wholeProgress);

					wholeListeners.On(transport, 'Transport.BeforeResponse', function (event) {
						if (!active) return;

						if (!sendCompletedAt)
							sendCompletedAt = Date.now();

						responseStartedAt = Date.now();

						setPhase('Receiving', event);
					});

					wholeListeners.On(transport, 'Transport.ResponseProgress', function (event) {
						if (!active) return;

						if (!responseStartedAt)
							responseStartedAt = Date.now();

						setPhase('Receiving', event);
					});

					wholeListeners.On(transport, 'Transport.AfterResponse', function () {
						if (!active) return;

						responseCompletedAt = Date.now();
					});

					wholeListeners.On(transport, 'Transport.Success', function (event) {
						if (!active) return;

						complete('Whole', event.Data);
					});

					wholeListeners.On(transport, 'Transport.Error', function (event) {
						fail('Error', event);
					});

					wholeListeners.On(transport, 'Transport.Timeout', function (event) {
						fail('Timeout', event);
					});

					wholeListeners.On(transport, 'Transport.Abort', function (event) {
						fail('Abort', event);
					});

					try {
						transport.Data(payload);
						transport.Execute();
					}
					catch (transportError) {
						fail('Error', transportError);
					}
				});
			}

			/* Outbound: engine API */
			api = {
				Phase: function () {
					return phase;
				},

				Active: function () {
					return active;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Execute: function () {
					var mode;

					if (active)
						return api;

					if (source === null || source === undefined) {
						emit('Error', {Error: new Error('Elemenx Transfer source is not set')});

						return api;
					}

					source = transferSource(source);

					mode = transport && typeof transport.Send === 'function' ? 'Chunked' : 'Whole';

					if (mode === 'Whole' && (!transport || typeof transport.Data !== 'function' || typeof transport.Execute !== 'function')) {
						emit('Error', {Error: new Error('Elemenx whole transfer transport must provide Data(data) and Execute()')});

						return api;
					}

					transferID = makeID();
					total = sourceSize(source);
					loaded = 0;
					startedAt = Date.now();
					sendCompletedAt = 0;
					responseStartedAt = 0;
					responseCompletedAt = 0;
					phase = 'Idle';
					active = true;

					emit('Start', {
						ID: transferID,
						Name: sourceName(source),
						Type: sourceType(source),
						Size: total,
						Mode: mode,
						ChunkSize: mode === 'Chunked' ? chunkSize : null,
						WindowSize: mode === 'Chunked' ? windowSize : null,
						Transport: transport
					});

					setPhase('Sending');

					if (mode === 'Whole') {
						executeWhole();

						return api;
					}

					offset = 0;
					nextIndex = 0;
					acknowledged = 0;
					inFlight = {};
					sendQueue = [];
					ending = false;
					generation++;

					transportListeners.On(transport, 'Transport.Drain', function () {
						drainSendQueue();
					});

					transportListeners.On(transport, 'Protocol.Transfer', function (event) {
						receivePacket(event.Data);
					});

					try {
						sendPacket(
							{
								Type: 'Transfer',
								Action: 'Start',
								ID: transferID,
								Name: sourceName(source),
								Mime: sourceType(source),
								Size: total,
								ChunkSize: chunkSize
							},
							function () {
								if (!active) return;

								chunkProgress();

								pump(generation);
							}
						);
					}
					catch (error) {
						fail('Error', error);
					}

					return api;
				},

				Receive: function (packet) {
					receivePacket(packet);

					return api;
				},

				Abort: function () {
					if (!active) return api;

					if (transport && typeof transport.Send === 'function') {
						try {
							sendPacket({Type: 'Transfer', Action: 'Abort', ID: transferID});
						}
						catch (error) {
						}
					}
					else if (transport && typeof transport.Abort === 'function') {
						transport.Abort();

						return api;
					}

					fail('Abort', null);

					return api;
				},

				Destroy: function () {
					if (active)
						api.Abort();

					release();

					transport = null;
					source = null;

					return api;
				}
			};

			events = NetworkEvents(api);

			return api;
		}

		/* Network: inbound Transfer payloads */
		function binary (value) {
			if (value instanceof ArrayBuffer) return value;

			if (ArrayBuffer.isView(value))
				return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);

			return null;
		}

		/* Network: Transfer */
		function NetworkTransfer (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var sourceSet = own(config, 'Data');
			var source = sourceSet ? config.Data : null;
			var encoder = config.Encoder || null;
			var chunkSize = config.ChunkSize || (64 * 1024);
			var windowSize = config.WindowSize || 8;
			var retry = config.Retry || 1500;
			var maxRetries = own(config, 'MaxRetries') ? config.MaxRetries : 8;
			var outbound = null;
			var active = false;
			var phase = 'Idle';
			var startedAt = 0;
			var transferID = null;
			var expected = 0;
			var loaded = 0;
			var paused = false;
			var name = null;
			var mime = 'application/octet-stream';
			var listeners = NetworkTransportListeners();
			var events;
			var api;

			/* Inbound: events and phase */
			function emit (type, data) {
				return events.Emit('Transfer', type, data);
			}

			function setPhase (value, data) {
				if (phase === value) return;

				phase = value;

				emit('Phase', {
					ID: transferID,
					Phase: value,
					Data: data || null,
					Elapsed: startedAt ? Date.now() - startedAt : 0
				});
			}

			/* Inbound: progress, completion and failure */
			function emitData (value, bytes) {
				emit('Data', {
					ID: transferID,
					Data: value,
					Bytes: bytes,
					Loaded: loaded,
					Total: expected,
					Mode: 'Inbound'
				});
			}

			/* A received binary chunk: counted, delivered as a Data event, then reported as progress. */
			function receiveBytes (value) {
				loaded += value.byteLength;

				emitData(value, value.byteLength);

				progress();
			}

			function progress () {
				var elapsed = Math.max(1, Date.now() - startedAt);

				emit('Progress', {
					ID: transferID,
					Loaded: loaded,
					Total: expected,
					Progress: expected ? loaded / expected : 0,
					Speed: loaded * 1000 / elapsed,
					Elapsed: elapsed,
					Mode: 'Inbound'
				});
			}

			function complete (response) {
				if (!active) return;

				var endedAt = Date.now();

				active = false;
				paused = false;

				if (!expected)
					expected = loaded;

				setPhase('Complete');

				if (api._LifecycleClosed)
					api._LifecycleClosed();

				listeners.Clear(transport);

				emit('Complete', {
					ID: transferID,
					Name: name,
					Mime: mime,
					Loaded: loaded,
					Total: expected,
					Size: loaded,
					Response: response || null,
					Elapsed: endedAt - startedAt,
					Mode: 'Inbound',
					Metrics: {
						SendElapsed: 0,
						WaitElapsed: 0,
						ResponseElapsed: endedAt - startedAt,
						TotalElapsed: endedAt - startedAt
					}
				});
			}

			function fail (type, value) {
				if (api && api._LifecycleClosed)
					api._LifecycleClosed();

				if (!active) return;

				active = false;
				paused = false;

				setPhase(type, value);

				listeners.Clear(transport);

				emit(type, {
					ID: transferID,
					Loaded: loaded,
					Total: expected,
					Elapsed: Date.now() - startedAt,
					Mode: 'Inbound',
					Phase: phase,
					Error: value instanceof Error ? value : null,
					TransportEvent: value instanceof Error ? null : value
				});
			}

			/* Inbound: protocol packets */
			function receivePacket (packet) {
				if (!active || !packet || packet.Type !== 'Transfer') return;

				if (packet.Action === 'Start') {
					transferID = packet.ID || transferID;
					expected = Number(packet.Size) || 0;
					name = packet.Name || null;
					mime = packet.Mime || mime;
					loaded = 0;

					setPhase('Receiving', packet);

					if (api._LifecycleConnected)
						api._LifecycleConnected();

					emit('Start', {
						ID: transferID,
						Name: name,
						Type: mime,
						Size: expected,
						Mode: 'Inbound',
						Transport: transport
					});

					return;
				}

				if (packet.ID && transferID && packet.ID !== transferID) return;

				if (packet.Action === 'Chunk') {
					var value = binary(packet.Data);

					if (!value) {
						fail('Error', new Error('Elemenx Protocol must decode inbound Transfer chunk Data to binary'));

						return;
					}

					receiveBytes(value);

					return;
				}

				if (packet.Action === 'End' || packet.Action === 'Complete') {
					complete();

					return;
				}

				if (packet.Action === 'Abort')
					fail('Abort', packet);
			}

			/* Inbound: transport events */
			function executeInbound () {
				if (!transport || typeof transport.On !== 'function') {
					emit('Error', {Error: new Error('Elemenx inbound transfer transport must provide On()')});

					return;
				}

				var hasProtocol = false;

				active = true;
				phase = 'Idle';
				startedAt = Date.now();
				transferID = null;
				expected = 0;
				loaded = 0;
				paused = false;
				name = null;
				mime = 'application/octet-stream';

				listeners.On(transport, 'Protocol.Transfer', function (event) {
					hasProtocol = true;

					receivePacket(event.Data);
				});

				listeners.On(transport, 'Transport.ResponseProgress', function (event) {
					var nativeEvent = event.Data;
					if (!active || !nativeEvent) return;

					loaded = typeof nativeEvent.loaded === 'number' ? nativeEvent.loaded : loaded;

					if (nativeEvent.lengthComputable && typeof nativeEvent.total === 'number')
						expected = nativeEvent.total;

					setPhase('Receiving', event);

					progress();
				});

				listeners.On(transport, 'Transport.Success', function (event) {
					if (!active) return;

					var response = event.Data ? event.Data.Response : null;
					var bytes = NetworkByteLength(response);

					loaded = bytes || loaded;

					if (!expected)
						expected = loaded;

					emitData(response, bytes);

					complete(event.Data);
				});

				listeners.On(transport, 'Transport.Data', function (event) {
					if (!active || hasProtocol || !event.Data) return;

					var value = binary(event.Data.Data);
					if (!value) return;

					setPhase('Receiving', event);

					receiveBytes(value);
				});

				listeners.On(transport, 'Transport.End', function () {
					if (!active || hasProtocol) return;

					complete();
				});

				listeners.On(transport, 'Transport.Error', function (event) {
					fail('Error', event);
				});

				listeners.On(transport, 'Transport.Timeout', function (event) {
					fail('Timeout', event);
				});

				listeners.On(transport, 'Transport.Abort', function (event) {
					fail('Abort', event);
				});

				setPhase('Receiving');

				if (typeof transport.Execute === 'function') {
					transport.Execute();

					return;
				}

				if (typeof transport.Connect === 'function' && typeof transport.CreateOffer !== 'function') {
					transport.Connect();
				}
			}

			/* Transfer: outbound delegation */
			function executeOutbound () {
				source = transferSource(source);

				outbound = NetworkTransferOutbound({
					Transport: transport,
					Data: source,
					Encoder: encoder,
					ChunkSize: chunkSize,
					WindowSize: windowSize,
					Retry: retry,
					MaxRetries: maxRetries
				});

				outbound.On('Transfer', function (event) {
					phase = outbound.Phase();
					active = outbound.Active();

					events.Emit('Transfer', event.Type, event.Data);
				});

				active = true;

				outbound.Execute();
			}

			/* Transfer: public API */
			api = {
				Transport: function (value) {
					if (active)
						return api;

					transport = value;

					return api;
				},
				Data: function (value) {
					if (active)
						return api;

					sourceSet = true;
					source = value;

					return api;
				},
				Encoder: function (value) {
					if (active)
						return api;

					encoder = value;

					return api;
				},
				ChunkSize: function (value) {
					if (active)
						return api;

					chunkSize = Math.max(1, Number(value) || 1);

					return api;
				},
				WindowSize: function (value) {
					if (active)
						return api;

					windowSize = Math.max(1, Number(value) || 1);

					return api;
				},
				Retry: function (value) {
					if (active)
						return api;

					retry = Math.max(1, Number(value) || 1);

					return api;
				},
				MaxRetries: function (value) {
					if (active)
						return api;

					maxRetries = Math.max(0, Number(value) || 0);

					return api;
				},
				Phase: function () {
					return outbound ? outbound.Phase() : phase;
				},
				Active: function () {
					return outbound ? outbound.Active() : active;
				},
				On: function (name, callback) {
					return events.On(name, callback);
				},
				Off: function (name, callback) {
					return events.Off(name, callback);
				},
				Execute: function () {
					if (active)
						return api;

					if (sourceSet) executeOutbound();
					else executeInbound();

					return api;
				},
				Send: function (value) {
					if (active)
						return api;

					if (arguments.length) {
						sourceSet = true;
						source = value;
					}

					return api.Execute();
				},
				Receive: function (packet) {
					if (outbound) outbound.Receive(packet);
					else receivePacket(packet);

					return api;
				},
				Pause: function () {
					if (outbound || !active || paused || !transport || typeof transport.Pause !== 'function') return api;

					paused = true;

					transport.Pause();

					emit('Pause', {
						ID: transferID,
						Loaded: loaded,
						Total: expected,
						Mode: 'Inbound'
					});

					return api;
				},
				Resume: function () {
					if (outbound || !active || !paused || !transport || typeof transport.Resume !== 'function') return api;

					paused = false;

					transport.Resume();

					emit('Resume', {
						ID: transferID,
						Loaded: loaded,
						Total: expected,
						Mode: 'Inbound'
					});

					return api;
				},
				Paused: function () {
					return !outbound && paused;
				},
				Abort: function () {
					if (outbound) {
						outbound.Abort();

						return api;
					}

					if (!active) return api;

					if (transport && typeof transport.Abort === 'function') transport.Abort();
					else if (transport && typeof transport.Close === 'function') transport.Close();

					fail('Abort', null);

					return api;
				},
				Destroy: function () {
					if (outbound) outbound.Destroy();
					else if (active) api.Abort();

					listeners.Clear(transport);

					outbound = null;
					transport = null;
					source = null;

					return api;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.Transfer = NetworkTransfer;

		/* Network: TransferReceiver */
		/* The received chunks in index order, or null when their count differs from the announced one. */
		function orderedChunks (chunks, count) {
			var keys = Object.keys(chunks).map(Number).sort(function (a, b) {
				return a - b;
			});
			if (keys.length !== count) return null;

			return keys.map(function (key) {
				return chunks[key];
			});
		}

		function NetworkTransferReceiver (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var transfers = {};
			var protocolListener = null;
			var events;
			var api;

			function emit (type, data) {
				return events.Emit('Transfer', type, data);
			}

			function unbindTransport () {
				if (!transport || !protocolListener || typeof transport.Off !== 'function') return;

				transport.Off('Protocol.Transfer', protocolListener);
				protocolListener = null;
			}

			function bindTransport () {
				if (!transport || typeof transport.On !== 'function') return;

				protocolListener = function (event) {
					receivePacket(event.Data);
				};

				transport.On('Protocol.Transfer', protocolListener);
			}

			function send (packet) {
				if (!transport || typeof transport.Send !== 'function') return false;

				return transport.Send(packet) !== false;
			}

			function bytes (value) {
				var buffer = binary(value);
				if (!buffer)
					throw new Error('Elemenx Protocol must decode transfer chunk Data to binary');

				return buffer;
			}

			function receivePacket (packet) {
				if (!packet || packet.Type !== 'Transfer') return;

				var transfer;
				var chunk;
				var chunks;

				if (packet.Action === 'Start') {
					transfers[packet.ID] = {
						ID: packet.ID,
						Name: packet.Name,
						Mime: packet.Mime,
						Size: packet.Size,
						Chunks: {}
					};

					emit('Start', packet);

					return;
				}

				transfer = transfers[packet.ID];

				if (!transfer) return;

				if (packet.Action === 'Chunk') {
					try {
						chunk = bytes(packet.Data);
					}
					catch (error) {
						emit('Error', {ID: packet.ID, Error: error});

						return;
					}

					if (!own(transfer.Chunks, packet.Index)) {
						transfer.Chunks[packet.Index] = chunk;
					}

					send({Type: 'Transfer', Action: 'Ack', ID: packet.ID, Index: packet.Index});

					emit('Chunk', {ID: packet.ID, Index: packet.Index, Bytes: chunk.byteLength});

					return;
				}

				if (packet.Action === 'End') {
					chunks = orderedChunks(transfer.Chunks, packet.Chunks);

					if (!chunks) {
						emit('Error', {ID: packet.ID, Error: new Error('Elemenx Transfer ended with missing chunks')});

						return;
					}

					send({Type: 'Transfer', Action: 'Complete', ID: packet.ID});

					delete transfers[packet.ID];

					var result = {
						ID: packet.ID,
						Name: transfer.Name,
						Mime: transfer.Mime,
						Size: transfer.Size,
						Blob: new Blob(chunks, {type: transfer.Mime || 'application/octet-stream'})
					};

					emit('Complete', result);

					if (result.Blob.type === 'application/x-elemenx-structured') {
						NetworkStructuredUnpack(result.Blob, function (error, value) {
							if (error) {
								emit('Error', {ID: result.ID, Error: error});

								return;
							}

							result.Data = value;

							emit('Receive', result);
						});
					}
					else {
						emit('Receive', result);
					}

					return;
				}

				if (packet.Action === 'Abort') {
					delete transfers[packet.ID];

					emit('Abort', {ID: packet.ID});
				}
			}

			api = {
				Transport: function (value) {
					unbindTransport();

					transport = value;

					bindTransport();

					return api;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Off: function (name, callback) {
					return events.Off(name, callback);
				},

				Receive: function (packet) {
					receivePacket(packet);

					return api;
				},

				Destroy: function () {
					unbindTransport();

					transfers = {};
					transport = null;

					return api;
				}

			};

			NetworkStarted(api);

			events = NetworkEvents(api);

			bindTransport();

			return api;
		}

		NetworkFactories.TransferReceiver = NetworkTransferReceiver;

		/* Network: WebSocket */
		function NetworkWebSocket (configuration) {
			var config = configuration || {};
			var url = config.URL || '';
			var protocols = config.Protocols || null;
			var binaryType = config.BinaryType || 'blob';
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var bufferHighWaterMark = config.BufferHighWaterMark === undefined ? 4 * 1024 * 1024 : config.BufferHighWaterMark;
			var bufferLowWaterMark = config.BufferLowWaterMark === undefined ? 1024 * 1024 : config.BufferLowWaterMark;
			var drainInterval = config.DrainInterval === undefined ? 10 : config.DrainInterval;
			var socket = null;
			var connecting = false;
			var closing = false;
			var saturated = false;
			var drainTimer = null;
			var events;
			var api;

			function transport (type, value) {
				return NetworkTransportEvent(api, events, type, value);
			}

			function decode (input, transportEvent) {
				NetworkDispatch(protocol, api, events, input, transportEvent);
			}

			function encode (input) {
				return NetworkEncode(protocol, api, input);
			}

			function stopDrainWatch () {
				if (drainTimer === null) return;

				clearTimeout(drainTimer);
				drainTimer = null;
			}

			function watchDrain () {
				stopDrainWatch();

				if (!saturated || !socket || socket.readyState !== global.WebSocket.OPEN) return;

				drainTimer = setTimeout(function () {
					drainTimer = null;

					if (!socket || socket.readyState !== global.WebSocket.OPEN) return;

					if (socket.bufferedAmount <= bufferLowWaterMark) {
						saturated = false;

						transport('Drain', {
							BufferedAmount: socket.bufferedAmount,
							Socket: socket
						});

						return;
					}

					watchDrain();
				}, drainInterval);
			}

			function pressure () {
				if (!socket || socket.readyState !== global.WebSocket.OPEN) return true;

				return saturated || socket.bufferedAmount >= bufferHighWaterMark;
			}

			api = {
				URL: function (value) {
					if (connecting) return api;

					url = value;

					return api;
				},
				Protocols: function (value) {
					if (connecting) return api;

					protocols = value;

					return api;
				},
				BinaryType: function (value) {
					if (connecting) return api;

					binaryType = value;

					return api;
				},
				Protocol: function (value) {
					if (connecting) return api;

					protocol = ResolveNetworkProtocol(value);

					return api;
				},
				On: function (name, callback) {
					return events.On(name, callback);
				},
				Off: function (name, callback) {
					return events.Off(name, callback);
				},
				Connect: function () {
					var Socket;

					if (connecting) return api;

					Socket = browserClass('WebSocket', 'WebSocket');
					connecting = true;
					closing = false;
					saturated = false;

					stopDrainWatch();

					if (protocols === null || protocols === undefined) socket = new Socket(url);
					else socket = new Socket(url, protocols);

					socket.binaryType = binaryType;

					transport('BeforeConnect', {URL: url, Protocols: protocols, Socket: socket});

					socket.addEventListener('open', function (event) {
						if (closing) return;

						transport('Open', {
							Event: event,
							Protocol: socket.protocol,
							Extensions: socket.extensions,
							Socket: socket
						});
					});

					socket.addEventListener('message', function (event) {
						if (closing) return;

						var packet = {Data: event.data, Origin: event.origin, Event: event, Socket: socket};
						var dataEvent = transport('Data', packet);

						decode(event.data, dataEvent);
					});

					socket.addEventListener('error', function (event) {
						if (closing) return;

						transport('Error', {Event: event, Socket: socket});
					});

					socket.addEventListener('close', function (event) {
						var closedSocket = socket;

						connecting = false;
						closing = false;
						saturated = false;

						stopDrainWatch();

						socket = null;

						transport('Close', {
							Code: event.code,
							Reason: event.reason,
							Clean: event.wasClean,
							Event: event,
							Socket: closedSocket
						});
					});

					return api;
				},
				Send: function (data) {
					if (!socket || socket.readyState !== global.WebSocket.OPEN) return false;

					var encoded = encode(data);
					var bytes = NetworkByteLength(encoded);

					if (pressure() || socket.bufferedAmount + bytes > bufferHighWaterMark) {
						if (!saturated) {
							saturated = true;

							transport('Backpressure', {
								BufferedAmount: socket.bufferedAmount,
								Bytes: bytes,
								HighWaterMark: bufferHighWaterMark,
								Socket: socket
							});
						}

						watchDrain();

						return false;
					}

					transport('BeforeSend', {Data: encoded, BufferedAmount: socket.bufferedAmount, Socket: socket});

					socket.send(encoded);

					transport('AfterSend', {Data: encoded, BufferedAmount: socket.bufferedAmount, Socket: socket});

					if (socket.bufferedAmount >= bufferHighWaterMark) {
						saturated = true;

						transport('Backpressure', {
							BufferedAmount: socket.bufferedAmount,
							Bytes: 0,
							HighWaterMark: bufferHighWaterMark,
							Socket: socket
						});

						watchDrain();
					}

					return true;
				},
				Writable: function () {
					return !!(socket && socket.readyState === global.WebSocket.OPEN && !pressure());
				},
				BufferHighWaterMark: function (value) {
					if (value === undefined)
						return bufferHighWaterMark;

					bufferHighWaterMark = Math.max(0, Number(value) || 0);

					return api;
				},
				BufferLowWaterMark: function (value) {
					if (value === undefined)
						return bufferLowWaterMark;

					bufferLowWaterMark = Math.max(0, Number(value) || 0);

					return api;
				},
				DrainInterval: function (value) {
					if (value === undefined) return drainInterval;

					drainInterval = Math.max(1, Number(value) || 1);

					return api;
				},
				Close: function (code, reason) {
					if (!socket) return api;

					if (socket.readyState === global.WebSocket.CONNECTING || socket.readyState === global.WebSocket.OPEN) {
						closing = true;

						transport('BeforeClose', {Code: code, Reason: reason, Socket: socket});

						socket.close(code, reason);
					}

					return api;
				},
				Socket: function () {
					return socket;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.WebSocket = NetworkWebSocket;

		/* Network: WebRTC */
		/*
		 * RTCPeerConnection is Promise-based; WebRTC adapts it to callbacks (error, result) and events, and returns no Promise.
		 * The callback runs outside the promise chain, so an exception thrown by it is reported instead of swallowed.
		 */
		function settle (promise, callback, unhandled) {
			promise.then(function (value) {
				if (callback)
					invoke(callback, null, value);
			}, function (error) {
				if (callback) invoke(callback, error);
				else unhandled(error);
			});
		}

		/* Native state change events of a peer connection: the event, the Transport event and the property that holds the state. */
		var webRTCStateEvents = [
			['connectionstatechange', 'ConnectionState', 'connectionState'],
			['iceconnectionstatechange', 'ICEConnectionState', 'iceConnectionState'],
			['signalingstatechange', 'SignalingState', 'signalingState']
		];

		function NetworkWebRTC (configuration) {
			var config = configuration || {};
			var rtcConfig = config.Configuration || {};
			var channelConfig = config.Channel || {};
			var channelName = config.ChannelName || 'elemenx';
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var connection = null;
			var channel = null;
			var active = false;
			var generation = 0;
			var sendQueue = [];
			var bufferHighWaterMark = config.BufferHighWaterMark === undefined ? 1024 * 1024 : config.BufferHighWaterMark;
			var bufferLowWaterMark = config.BufferLowWaterMark === undefined ? 256 * 1024 : config.BufferLowWaterMark;
			var queueHighWaterMark = config.QueueHighWaterMark === undefined ? 4 * 1024 * 1024 : config.QueueHighWaterMark;
			var queueLowWaterMark = config.QueueLowWaterMark === undefined ? 1024 * 1024 : config.QueueLowWaterMark;
			var queuedBytes = 0;
			var saturated = false;
			var drainTimer = null;
			var events;
			var api;

			/* WebRTC: events and protocol */
			function transport (type, value) {
				return NetworkTransportEvent(api, events, type, value);
			}

			function decode (input, transportEvent) {
				NetworkDispatch(protocol, api, events, input, transportEvent);
			}

			function encode (input) {
				return NetworkEncode(protocol, api, input);
			}

			/* WebRTC: generations */
			/* Every Connect starts a new generation: callbacks of an older connection see that they are stale and do nothing. */
			function sameGeneration (currentGeneration, currentConnection) {
				return currentGeneration === generation && connection === currentConnection;
			}

			function current (currentGeneration, currentConnection) {
				return active && sameGeneration(currentGeneration, currentConnection);
			}

			/* After setLocalDescription: publishes the local description of a connection that is still the current one. */
			function localDescriptionSet (currentGeneration, currentConnection) {
				return function () {
					if (!current(currentGeneration, currentConnection)) return null;

					transport('LocalDescription', {
						Description: currentConnection.localDescription,
						Connection: currentConnection
					});

					return currentConnection.localDescription;
				};
			}

			/* After setRemoteDescription: publishes the remote description of a connection that is still the current one. */
			function remoteDescriptionSet (currentGeneration, currentConnection) {
				if (!current(currentGeneration, currentConnection)) return false;

				transport('RemoteDescription', {
					Description: currentConnection.remoteDescription,
					Connection: currentConnection
				});

				return true;
			}

			/* WebRTC: send queue */
			function pressureBytes () {
				return queuedBytes + (channel ? channel.bufferedAmount : 0);
			}

			function updateWritable () {
				var pressure = pressureBytes();

				if (saturated && pressure <= queueLowWaterMark) {
					saturated = false;

					transport('Drain', {
						BufferedAmount: channel ? channel.bufferedAmount : 0,
						Queued: sendQueue.length,
						QueuedBytes: queuedBytes,
						PressureBytes: pressure,
						Channel: channel,
						Connection: connection
					});
				}
			}

			function scheduleDrain () {
				if (drainTimer !== null) return;

				drainTimer = global.setTimeout(function () {
					drainTimer = null;

					drainSendQueue();
				}, 5);
			}

			function drainSendQueue () {
				if (!channel || channel.readyState !== 'open') return;

				var item;

				while (sendQueue.length && channel.bufferedAmount <= bufferHighWaterMark) {
					item = sendQueue[0];

					try {
						transport('BeforeSend', {
							Data: item.Data,
							BufferedAmount: channel.bufferedAmount,
							Queued: sendQueue.length,
							Channel: channel,
							Connection: connection
						});

						channel.send(item.Data);

						sendQueue.shift();

						queuedBytes -= item.Bytes;

						transport('AfterSend', {
							Data: item.Data,
							BufferedAmount: channel.bufferedAmount,
							Queued: sendQueue.length,
							Channel: channel,
							Connection: connection
						});
					}
					catch (error) {
						transport('Backpressure', {
							Error: error,
							BufferedAmount: channel.bufferedAmount,
							Queued: sendQueue.length,
							Channel: channel,
							Connection: connection
						});

						scheduleDrain();

						return;
					}
				}

				updateWritable();
			}

			/* WebRTC: data channel */
			function attachChannel (value, currentGeneration, currentConnection) {
				var currentChannel = value;

				function live () {
					return current(currentGeneration, currentConnection) && channel === currentChannel;
				}

				channel = currentChannel;
				currentChannel.bufferedAmountLowThreshold = bufferLowWaterMark;

				currentChannel.addEventListener('bufferedamountlow', function () {
					if (!live()) return;

					transport('BufferedAmountLow', {
						BufferedAmount: currentChannel.bufferedAmount,
						Queued: sendQueue.length,
						Channel: currentChannel,
						Connection: currentConnection
					});

					drainSendQueue();
				});

				transport('Channel', {
					Label: currentChannel.label,
					ID: currentChannel.id,
					Ordered: currentChannel.ordered,
					Protocol: currentChannel.protocol,
					Channel: currentChannel,
					Connection: currentConnection
				});

				currentChannel.addEventListener('open', function (event) {
					if (!live()) return;

					transport('Open', {
						Event: event,
						Label: currentChannel.label,
						ID: currentChannel.id,
						Channel: currentChannel,
						Connection: currentConnection
					});

					drainSendQueue();
				});

				currentChannel.addEventListener('message', function (event) {
					if (!live()) return;

					var dataEvent = transport('Data', {
						Data: event.data,
						Event: event,
						Channel: currentChannel,
						Connection: currentConnection
					});

					decode(event.data, dataEvent);
				});

				currentChannel.addEventListener('error', function (event) {
					if (!live()) return;

					transport('Error', {
						Event: event,
						Channel: currentChannel,
						Connection: currentConnection
					});
				});

				currentChannel.addEventListener('close', function (event) {
					if (!sameGeneration(currentGeneration, currentConnection)) return;

					if (channel === currentChannel)
						channel = null;

					transport('ChannelClose', {
						Event: event,
						Label: currentChannel.label,
						ID: currentChannel.id,
						Channel: currentChannel,
						Connection: currentConnection
					});
				});
			}

			/* WebRTC: connection */
			function createConnection () {
				if (active)
					return connection;

				active = true;

				var currentGeneration = ++generation;
				var currentConnection = new (browserClass('RTCPeerConnection', 'WebRTC'))(rtcConfig);

				connection = currentConnection;

				transport('BeforeConnect', {
					Configuration: rtcConfig,
					Connection: currentConnection
				});

				currentConnection.addEventListener('icecandidate', function (event) {
					if (!current(currentGeneration, currentConnection)) return;

					transport('ICECandidate', {
						Candidate: event.candidate,
						Event: event,
						Connection: currentConnection
					});
				});

				webRTCStateEvents.forEach(function (entry) {
					currentConnection.addEventListener(entry[0], function (event) {
						if (!sameGeneration(currentGeneration, currentConnection)) return;

						transport(entry[1], {
							State: currentConnection[entry[2]],
							Event: event,
							Connection: currentConnection
						});
					});
				});

				currentConnection.addEventListener('datachannel', function (event) {
					if (!current(currentGeneration, currentConnection)) return;

					attachChannel(event.channel, currentGeneration, currentConnection);
				});

				return currentConnection;
			}

			/* WebRTC: negotiation */
			/* A negotiation result goes to the callback; without one, a failure becomes a Transport.Error event. */
			function negotiationError (operation, error) {
				transport('Error', {
					Error: error,
					Operation: operation,
					Connection: connection
				});
			}

			function negotiate (operation, callback, promise) {
				settle(promise, typeof callback === 'function' ? callback : null, function (error) {
					negotiationError(operation, error);
				});

				return api;
			}

			/* Settles without a browser call, still after the method has returned. */
			function later (operation, callback, error) {
				global.setTimeout(function () {
					if (typeof callback === 'function') invoke(callback, error, undefined);
					else if (error) negotiationError(operation, error);
				}, 0);

				return api;
			}

			/* WebRTC: public API */
			api = {
				Configuration: function (value) {
					if (active)
						return api;

					rtcConfig = value || {};

					return api;
				},

				ChannelName: function (value) {
					if (active)
						return api;

					channelName = value;

					return api;
				},

				Channel: function (value) {
					if (active)
						return api;

					channelConfig = value || {};

					return api;
				},

				Protocol: function (value) {
					if (active)
						return api;

					protocol = ResolveNetworkProtocol(value);

					return api;
				},

				On: function (name, callback) {
					return events.On(name, callback);
				},

				Off: function (name, callback) {
					return events.Off(name, callback);
				},

				Connect: function (initiator) {
					if (active)
						return api;

					var currentConnection = createConnection();

					if (initiator !== false)
						attachChannel(currentConnection.createDataChannel(channelName, channelConfig), generation, currentConnection);

					return api;
				},

				CreateOffer: function (callback) {
					var currentConnection = createConnection();
					var currentGeneration = generation;

					if (!channel)
						attachChannel(currentConnection.createDataChannel(channelName, channelConfig), currentGeneration, currentConnection);

					return negotiate('CreateOffer', callback, currentConnection.createOffer().then(function (description) {
						if (!current(currentGeneration, currentConnection)) return null;

						return currentConnection.setLocalDescription(description).then(localDescriptionSet(currentGeneration, currentConnection));
					}));
				},

				AcceptOffer: function (description, callback) {
					var currentConnection = createConnection();
					var currentGeneration = generation;

					return negotiate('AcceptOffer', callback, currentConnection
						.setRemoteDescription(description)
						.then(function () {
							if (!remoteDescriptionSet(currentGeneration, currentConnection)) return null;

							return currentConnection.createAnswer();
						})
						.then(function (answer) {
							if (!answer || !current(currentGeneration, currentConnection)) return null;

							return currentConnection.setLocalDescription(answer).then(localDescriptionSet(currentGeneration, currentConnection));
						}));
				},

				AcceptAnswer: function (description, callback) {
					var currentConnection = connection;
					var currentGeneration = generation;

					if (!currentConnection || !active)
						return later('AcceptAnswer', callback, new Error('Elemenx WebRTC connection is not active'));

					return negotiate('AcceptAnswer', callback, currentConnection.setRemoteDescription(description).then(function () {
						if (!remoteDescriptionSet(currentGeneration, currentConnection)) return null;

						return currentConnection.remoteDescription;
					}));
				},

				AddICECandidate: function (candidate, callback) {
					if (!connection || !active || !candidate)
						return later('AddICECandidate', callback, null);

					return negotiate('AddICECandidate', callback, connection.addIceCandidate(candidate));
				},

				Send: function (data) {
					if (!channel || channel.readyState !== 'open') return false;

					var encoded = encode(data);
					var bytes = NetworkByteLength(encoded);
					var pressure = pressureBytes();

					if (saturated || pressure + bytes > queueHighWaterMark) {
						saturated = true;

						transport('Backpressure', {
							Data: encoded,
							Bytes: bytes,
							BufferedAmount: channel.bufferedAmount,
							Queued: sendQueue.length,
							QueuedBytes: queuedBytes,
							PressureBytes: pressure,
							Channel: channel,
							Connection: connection
						});

						return false;
					}

					sendQueue.push({Data: encoded, Bytes: bytes});

					queuedBytes += bytes;

					transport('Queued', {
						Data: encoded,
						BufferedAmount: channel.bufferedAmount,
						Queued: sendQueue.length,
						QueuedBytes: queuedBytes,
						PressureBytes: pressureBytes(),
						Channel: channel,
						Connection: connection
					});

					drainSendQueue();

					return true;
				},

				Writable: function () {
					return !!(channel && channel.readyState === 'open' && !saturated && pressureBytes() < queueHighWaterMark);
				},

				QueueHighWaterMark: function (value) {
					if (value === undefined)
						return queueHighWaterMark;

					if (active)
						return api;

					queueHighWaterMark = Math.max(0, Number(value) || 0);

					return api;
				},

				QueueLowWaterMark: function (value) {
					if (value === undefined)
						return queueLowWaterMark;

					if (active)
						return api;

					queueLowWaterMark = Math.max(0, Number(value) || 0);

					return api;
				},

				BufferHighWaterMark: function (value) {
					if (value === undefined)
						return bufferHighWaterMark;

					if (active)
						return api;

					bufferHighWaterMark = Math.max(0, Number(value) || 0);

					return api;
				},

				BufferLowWaterMark: function (value) {
					if (value === undefined)
						return bufferLowWaterMark;

					if (active)
						return api;

					bufferLowWaterMark = Math.max(0, Number(value) || 0);

					return api;
				},

				Close: function () {
					if (!active) return api;

					var currentChannel = channel;
					var currentConnection = connection;

					transport('BeforeClose', {
						Channel: currentChannel,
						Connection: currentConnection
					});

					active = false;
					generation++;
					sendQueue = [];
					queuedBytes = 0;
					saturated = false;
					channel = null;
					connection = null;

					if (currentChannel)
						currentChannel.close();

					if (currentConnection)
						currentConnection.close();

					transport('Close', {
						Channel: currentChannel,
						Connection: currentConnection
					});

					return api;
				},

				Connection: function () {
					return connection;
				},

				DataChannel: function () {
					return channel;
				}
			};

			NetworkLifecycle(api);

			events = NetworkEvents(api);

			return api;
		}

		NetworkFactories.WebRTC = NetworkWebRTC;

		/* Network: Metrics */
		function metricsNow () {
			return global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
		}

		/* Counters of one direction (TX or RX); Measure* fields describe the current Begin..End measurement, MeasureEnd freezes it at End. */
		function metricsDirection () {
			return {
				Bytes: 0,
				Loaded: 0,
				MeasureStart: 0,
				MeasureEnd: null,
				MeasureStarted: 0,
				MeasureElapsed: 0,
				MeasureActive: false,
				SpeedMin: 0,
				SpeedMax: 0
			};
		}

		function metricsBeginMeasure (direction) {
			direction.MeasureStart = direction.Bytes;
			direction.MeasureEnd = null;
			direction.MeasureStarted = 0;
			direction.MeasureElapsed = 0;
			direction.MeasureActive = false;
			direction.SpeedMin = 0;
			direction.SpeedMax = 0;
		}

		/* The first transferred bytes of a measurement start the time of their direction. */
		function metricsResume (direction, time) {
			if (direction.MeasureActive) return;

			direction.MeasureStarted = time;
			direction.MeasureActive = true;
		}

		/* A finished transfer adds its time, never less than one sample interval. */
		function metricsPause (direction, time, interval) {
			if (!direction.MeasureActive) return;

			direction.MeasureElapsed += Math.max(interval, time - direction.MeasureStarted);
			direction.MeasureStarted = 0;
			direction.MeasureActive = false;
		}

		/* End closes the measurement: bytes transferred later no longer change it. */
		function metricsEndMeasure (direction, time, interval) {
			metricsPause(direction, time, interval);

			direction.MeasureEnd = direction.Bytes;
		}

		function metricsSpeed (direction, speed) {
			if (speed <= 0) return;

			if (direction.SpeedMin === 0 || speed < direction.SpeedMin)
				direction.SpeedMin = speed;

			if (speed > direction.SpeedMax)
				direction.SpeedMax = speed;
		}

		function metricsDirectionSnapshot (direction, speed, time, measured) {
			var elapsed = 0;
			var bytes = 0;
			var end = direction.MeasureEnd === null ? direction.Bytes : direction.MeasureEnd;

			if (measured) {
				elapsed = direction.MeasureElapsed + (direction.MeasureActive ? Math.max(0, time - direction.MeasureStarted) : 0);
				bytes = Math.max(0, end - direction.MeasureStart);
			}

			return {
				Bytes: direction.Bytes,
				Speed: speed,
				SpeedAvg: elapsed > 0 ? bytes * 1000 / elapsed : 0,
				SpeedMin: direction.SpeedMin,
				SpeedMax: direction.SpeedMax,
				MeasureElapsed: elapsed,
				Active: direction.MeasureActive
			};
		}

		/* Bytes of a message event: Data.Data of a Transport event, or the event data itself. */
		function metricsMessageBytes (event) {
			return NetworkByteLength(event && event.Data && own(event.Data, 'Data') ? event.Data.Data : event ? event.Data : null);
		}

		function NetworkMetrics (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var events;
			var running = false;
			var measuring = false;
			var ended = false;
			var started = 0;
			var stopped = 0;
			var measureStarted = 0;
			var measureStopped = 0;
			var directions = {TX: metricsDirection(), RX: metricsDirection()};
			var bindings = [];
			var samples = [];
			var sampleWindow = typeof config.Window === 'number' && config.Window > 0 ? config.Window : 250;
			var sampleInterval = typeof config.Interval === 'number' && config.Interval > 0 ? config.Interval : 50;
			var timer = null;

			/* Metrics: samples and rates */
			function elapsed () {
				if (!started) return 0;

				var end = running ? metricsNow() : stopped;

				return Math.max(0, end - started);
			}

			function prune (time) {
				var threshold = time - sampleWindow;

				while (samples.length && samples[0].Time < threshold) samples.shift();
			}

			/* A finished transfer no longer counts towards the live speed of its direction. */
			function clearRates (name) {
				var i = 0;

				while (i < samples.length) {
					samples[i][name] = 0;

					i++;
				}

				emit();
			}

			function addSample (name, delta) {
				if (!delta) return;

				var time = metricsNow();
				var sample = {Time: time, TX: 0, RX: 0};

				sample[name] = delta;

				samples.push(sample);

				prune(time);
			}

			function rates (time) {
				var i = 0;
				var txBytes = 0;
				var rxBytes = 0;
				var duration;

				prune(time);

				while (i < samples.length) {
					txBytes += samples[i].TX;
					rxBytes += samples[i].RX;

					i++;
				}

				if (!samples.length)
					return {TX: 0, RX: 0};

				duration = Math.min(sampleWindow, Math.max(1, time - samples[0].Time + sampleInterval));

				return {
					TX: txBytes * 1000 / duration,
					RX: rxBytes * 1000 / duration
				};
			}

			function recordExtrema (time) {
				if (!measuring) return;

				var live = rates(time);

				metricsSpeed(directions.TX, live.TX);
				metricsSpeed(directions.RX, live.RX);
			}

			/* Metrics: snapshots and timer */
			function snapshot () {
				var time = metricsNow();
				var totalElapsed = elapsed();
				var live = rates(time);
				var measureEnd = measuring ? time : measureStopped;
				var measureElapsed = measureStarted ? Math.max(0, measureEnd - measureStarted) : 0;
				var measured = !!measureStarted;

				if (measureStarted && !measuring)
					live = {TX: 0, RX: 0};

				return {
					TX: metricsDirectionSnapshot(directions.TX, live.TX, time, measured),
					RX: metricsDirectionSnapshot(directions.RX, live.RX, time, measured),
					Total: directions.TX.Bytes + directions.RX.Bytes,
					Elapsed: totalElapsed,
					MeasureElapsed: measureElapsed,
					Active: measuring,
					Running: running
				};
			}

			function emit () {
				events.Emit('Metrics', 'Update', snapshot());
			}

			function startTimer () {
				if (timer !== null) return;

				timer = global.setInterval(function () {
					if (!running) return;

					recordExtrema(metricsNow());

					emit();
				}, sampleInterval);
			}

			function stopTimer () {
				if (timer === null) return;

				global.clearInterval(timer);
				timer = null;
			}

			/* Metrics: transport listeners */
			/* An ended measurement freezes every counter until the next Begin. */
			function count (name, delta) {
				if (ended) return;

				if (delta > 0 && measuring)
					metricsResume(directions[name], metricsNow());

				directions[name].Bytes += delta;

				addSample(name, delta);

				recordExtrema(metricsNow());

				emit();
			}

			/* Progress events report the bytes loaded so far: only the growth is counted. */
			function progress (name) {
				return function (event) {
					if (!running) return;

					var direction = directions[name];
					var loaded = event.Data && typeof event.Data.loaded === 'number' ? event.Data.loaded : 0;
					var delta = Math.max(0, loaded - direction.Loaded);

					direction.Loaded = loaded;

					count(name, delta);
				};
			}

			function finished (name) {
				return function () {
					if (!running) return;

					metricsPause(directions[name], metricsNow(), sampleInterval);

					clearRates(name);
				};
			}

			function message (name) {
				return function (event) {
					if (!running) return;

					count(name, metricsMessageBytes(event));
				};
			}

			function bind (name, callback) {
				if (!transport || typeof transport.On !== 'function') return;

				transport.On(name, callback);

				bindings.push({Name: name, Callback: callback});
			}

			function unbind () {
				if (!transport || typeof transport.Off !== 'function') {
					bindings = [];

					return;
				}

				var i = 0;
				while (i < bindings.length) {
					transport.Off(bindings[i].Name, bindings[i].Callback);

					i++;
				}

				bindings = [];
			}

			function attach () {
				unbind();

				if (!transport) return;

				bind('Transport.BeforeRequest', function () {
					directions.TX.Loaded = 0;
					directions.RX.Loaded = 0;
				});
				bind('Transport.RequestProgress', progress('TX'));
				bind('Transport.ResponseProgress', progress('RX'));
				bind('Transport.AfterRequest', finished('TX'));
				bind('Transport.AfterResponse', finished('RX'));
				bind('Transport.AfterSend', message('TX'));
				bind('Transport.Data', message('RX'));
			}

			/* Metrics: public API */
			var api = {
				Transport: function (value) {
					if (!arguments.length) return transport;
					if (running) return api;

					transport = value || null;

					attach();

					return api;
				},
				Start: function () {
					if (running) return api;

					running = true;
					ended = false;
					started = metricsNow();
					stopped = 0;
					samples = [];

					startTimer();

					events.Emit('Metrics', 'Start', snapshot());

					return api;
				},
				Stop: function () {
					if (!running) return api;

					if (measuring)
						api.End();

					stopped = metricsNow();
					running = false;

					stopTimer();

					events.Emit('Metrics', 'Stop', snapshot());

					return api;
				},
				Begin: function () {
					if (!running || measuring) return api;

					measuring = true;
					ended = false;
					measureStarted = metricsNow();
					measureStopped = 0;
					samples = [];

					metricsBeginMeasure(directions.TX);
					metricsBeginMeasure(directions.RX);

					events.Emit('Metrics', 'Begin', snapshot());

					return api;
				},
				End: function () {
					if (!running || !measuring) return api;

					measureStopped = metricsNow();

					metricsEndMeasure(directions.TX, measureStopped, sampleInterval);
					metricsEndMeasure(directions.RX, measureStopped, sampleInterval);

					measuring = false;
					ended = true;
					samples = [];

					events.Emit('Metrics', 'End', snapshot());

					return api;
				},
				Active: function () {
					return measuring;
				},
				Reset: function () {
					directions = {TX: metricsDirection(), RX: metricsDirection()};
					measuring = false;
					ended = false;
					measureStarted = 0;
					measureStopped = 0;
					samples = [];
					started = running ? metricsNow() : 0;
					stopped = 0;

					events.Emit('Metrics', 'Reset', snapshot());

					return api;
				},
				Snapshot: function () {
					return snapshot();
				},
				Destroy: function () {
					stopTimer();

					unbind();

					running = false;
					measuring = false;
					transport = null;
					samples = [];

					return api;
				},
				On: function (name, callback) {
					events.On(name, callback);

					return api;
				},
				Off: function (name, callback) {
					events.Off(name, callback);

					return api;
				}
			};

			NetworkStarted(api);

			events = NetworkEvents(api);

			attach();

			if (transport && config.AutoStart !== false)
				api.Start();

			return api;
		}

		NetworkFactories.Metrics = NetworkMetrics;

		/* Network: ownership */
		var NetworkOwners = new WeakMap();
		var DestroyedNetworkOwners = new WeakSet();
		var NetworkContexts = {};

		function destroyNetworkResource (resource) {
			if (!resource) return;

			if (typeof resource.Destroy === 'function') {
				resource.Destroy();

				return;
			}

			if (typeof resource.Abort === 'function')
				resource.Abort();

			if (typeof resource.Close === 'function')
				resource.Close();
		}

		function registerNetworkResource (owner, resource) {
			if (!owner || !resource) return resource;

			if (DestroyedNetworkOwners.has(owner)) {
				destroyNetworkResource(resource);

				throw new Error('Elemenx Network owner is destroyed');
			}

			var resources = NetworkOwners.get(owner);

			if (!resources) {
				resources = [];

				NetworkOwners.set(owner, resources);
			}

			resources.push(resource);

			return resource;
		}

		function destroyNetworkOwner (owner) {
			if (!owner || DestroyedNetworkOwners.has(owner)) return;

			DestroyedNetworkOwners.add(owner);

			var resources = NetworkOwners.get(owner);
			if (!resources) return;

			NetworkOwners.delete(owner);

			var i = resources.length - 1;
			while (i >= 0) {
				destroyNetworkResource(resources[i]);

				i--;
			}

			resources.length = 0;
		}

		/* Network: Context */
		function NetworkContext (name, definition) {
			if (arguments.length === 1) {
				if (typeof name !== 'string') return name || null;

				return NetworkContexts[name] || null;
			}

			var context = definition || {};

			context.__ElemenxNetworkContext = true;
			context.__ElemenxNetworkContextName = name;

			NetworkContexts[name] = context;

			return context;
		}

		function resolveNetworkContext (value) {
			if (!value)
				return null;

			if (typeof value === 'string') return NetworkContext(value);

			return value;
		}

		function applyNetworkContextDefinition (resource, type, context, resolving) {
			var listeners;
			var dependencies;
			var name;
			var result;
			var key;
			var i;

			context = resolveNetworkContext(context);

			if (!context)
				return false;

			name = context.__ElemenxNetworkContextName || null;

			if (name && resolving[name]) return false;

			if (typeof context.Configure === 'function') {
				result = context.Configure(resource, type);

				if (result === false) return false;
			}

			if (name)
				resolving[name] = true;

			dependencies = context.Contexts || [];

			if (!Array.isArray(dependencies))
				dependencies = [dependencies];

			i = 0;

			while (i < dependencies.length) {
				applyNetworkContextDefinition(resource, type, dependencies[i], resolving);

				i++;
			}

			if (context.Protocol && typeof resource.Protocol === 'function') {
				resource.Protocol(context.Protocol);
			}

			listeners = context.On || null;

			if (listeners && typeof resource.On === 'function') {
				for (key in listeners) {
					if (!own(listeners, key)) continue;

					resource.On(key, listeners[key]);
				}
			}

			if (typeof context.BeforeRequest === 'function' && typeof resource.On === 'function') {
				resource.On('Transport.BeforeRequest', context.BeforeRequest);
			}

			if (typeof context.BeforeConnect === 'function' && typeof resource.On === 'function') {
				resource.On('Transport.BeforeConnect', context.BeforeConnect);
			}

			if (name)
				delete resolving[name];

			return true;
		}

		function applyNetworkContext (resource, type, value) {
			applyNetworkContextDefinition(resource, type, value, {});

			return resource;
		}

		function attachNetworkContext (resource, type) {
			resource.Context = function (value) {
				applyNetworkContext(resource, type, value);

				return resource;
			};

			return resource;
		}

		/* Network: facade and public API */
		function createNetworkFacade (owner, inheritedContext) {
			function create (type, configuration, localContext) {
				if (owner && DestroyedNetworkOwners.has(owner))
					throw new Error('Elemenx Network owner is destroyed');

				var resource = NetworkFactories[type](configuration);

				attachNetworkContext(resource, type);

				if (inheritedContext)
					resource.Context(inheritedContext);

				if (localContext && localContext !== inheritedContext)
					resource.Context(localContext);

				return registerNetworkResource(owner, resource);
			}

			var facade = {};

			Object.keys(NetworkFactories).forEach(function (type) {
				facade[type] = function (configuration, context) {
					if (typeof configuration === 'string' || (configuration && configuration.__ElemenxNetworkContext)) {
						context = configuration;
						configuration = undefined;
					}

					return create(type, configuration, context);
				};
			});

			facade.Protocol = NetworkProtocol;

			return facade;
		}

		function createOwnedNetworkAccessor (owner) {
			var plain = createNetworkFacade(owner, null);

			function NetworkAccessor (context) {
				if (owner && DestroyedNetworkOwners.has(owner))
					throw new Error('Elemenx Network owner is destroyed');

				if (!context)
					return plain;

				return createNetworkFacade(owner, context);
			}

			return NetworkAccessor;
		}

		var Network = createNetworkFacade(null, null);

		Network.Context = NetworkContext;
		Elemenx.Network = Network;
		Runtime.NetworkFor = createOwnedNetworkAccessor;
		Runtime.DestroyNetworkOwner = destroyNetworkOwner;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Storage */
	(function (global) {
		'use strict';

		var own = Runtime.Own;

		function encodeValue (value) {
			return JSON.stringify({
				Value: value
			});
		}

		function decodeValue (value) {
			if (value === null) return null;

			var parsed;

			try {
				parsed = JSON.parse(value);
			}
			catch (error) {
				return null;
			}

			if (!parsed || !own(parsed, 'Value')) return null;

			return parsed.Value;
		}

		function normalizeNamespace (value) {
			value = String(value || '');
			value = value.replace(/^\.+|\.+$/g, '');

			return value;
		}

		/*
		 * The storage of the browser of a name (localStorage, sessionStorage), or one in memory where the page may not use
		 * it: a sandboxed frame without allow-same-origin, storage the user blocked, no DOM (Node). Reading the property
		 * there throws a SecurityError, and Elemenx did not load at all.
		 */
		var memoryStorages = {};

		function browserStorage (name) {
			var storage = null;

			try {
				storage = global[name] || null;
			}
			catch (error) {
				storage = null;
			}

			if (!storage && !own(memoryStorages, name))
				memoryStorages[name] = memoryStorage();

			return storage || memoryStorages[name];
		}

		/* A Storage of the browser in memory: what it keeps goes with the page. */
		function memoryStorage () {
			var items = {};
			var storage = {
				length: 0,
				key: function (index) {
					var names = Object.keys(items);

					return index < names.length ? names[index] : null;
				},
				getItem: function (name) {
					return own(items, name) ? items[name] : null;
				},
				setItem: function (name, value) {
					items[name] = String(value);
					storage.length = Object.keys(items).length;
				},
				removeItem: function (name) {
					delete items[name];
					storage.length = Object.keys(items).length;
				},
				clear: function () {
					items = {};
					storage.length = 0;
				}
			};

			return storage;
		}

		function createWebStorage (storage, prefix) {
			prefix = prefix || '';

			function key (name) {
				return prefix + String(name);
			}

			function clearNamespace () {
				if (!prefix) {
					storage.clear();

					return;
				}

				var names = [];
				var i = 0;

				while (i < storage.length) {
					var name = storage.key(i);
					if (name && name.indexOf(prefix) === 0)
						names.push(name);

					i++;
				}

				i = 0;

				while (i < names.length) {
					storage.removeItem(names[i]);

					i++;
				}
			}

			return {
				Get: function (name) {
					return decodeValue(storage.getItem(key(name)));
				},

				Set: function (name, value) {
					storage.setItem(key(name), encodeValue(value));

					return this;
				},

				Has: function (name) {
					return storage.getItem(key(name)) !== null;
				},

				Remove: function (name) {
					storage.removeItem(key(name));

					return this;
				},

				Clear: function () {
					clearNamespace();

					return this;
				},

				Namespace: function (name) {
					name = normalizeNamespace(name);

					return createWebStorage(storage, prefix + (name ? (name + '.') : ''));
				}
			};
		}

		function encodeCookie (value) {
			return encodeURIComponent(String(value));
		}

		function decodeCookie (value) {
			try {
				return decodeURIComponent(value);
			}
			catch (error) {
				return value;
			}
		}

		function cookieString (name, value, options) {
			options = options || {};

			var output = encodeURIComponent(name) + '=' + encodeCookie(value);

			if (options.Path)
				output += '; Path=' + options.Path;

			if (options.Domain)
				output += '; Domain=' + options.Domain;

			if (options.MaxAge !== undefined && options.MaxAge !== null)
				output += '; Max-Age=' + options.MaxAge;

			if (options.Expires)
				output += '; Expires=' + (options.Expires instanceof Date ? options.Expires.toUTCString() : options.Expires);

			if (options.SameSite)
				output += '; SameSite=' + options.SameSite;

			if (options.Secure)
				output += '; Secure';

			return output;
		}

		/*
		 * The cookies of the document, or ones in memory where the page has none it may use: a sandboxed frame without
		 * allow-same-origin (document.cookie throws a SecurityError), no DOM (Node). What memory keeps goes with the page.
		 */
		var memoryCookies = {};

		function readCookies () {
			try {
				return document.cookie || '';
			}
			catch (error) {
				return Object.keys(memoryCookies).map(function (name) {
					return name + '=' + memoryCookies[name];
				}).join('; ');
			}
		}

		function writeCookie (text) {
			var pair = text.split(';')[0];
			var separator = pair.indexOf('=');

			try {
				document.cookie = text;
			}
			catch (error) {
				if (/;\s*Max-Age=0(;|$)/.test(text)) delete memoryCookies[pair.substring(0, separator)];
				else memoryCookies[pair.substring(0, separator)] = pair.substring(separator + 1);
			}
		}

		function createCookieStorage (prefix) {
			prefix = prefix || '';

			function key (name) {
				return prefix + String(name);
			}

			function all () {
				var result = {};
				var text = readCookies();
				var parts = text ? text.split(';') : [];
				var i = 0;

				while (i < parts.length) {
					var part = parts[i].replace(/^\s+/, '');
					var separator = part.indexOf('=');
					var name;
					var value;

					if (separator !== -1) {
						name = decodeURIComponent(part.substring(0, separator));
						value = part.substring(separator + 1);
						result[name] = decodeCookie(value);
					}

					i++;
				}

				return result;
			}

			return {
				Get: function (name) {
					var values = all();

					name = key(name);

					return own(values, name) ? values[name] : null;
				},

				Set: function (name, value, options) {
					writeCookie(cookieString(key(name), value, options));

					return this;
				},

				Has: function (name) {
					var values = all();

					return own(values, key(name));
				},

				Remove: function (name, options) {
					options = options || {};

					var removeOptions = Runtime.Assign({}, options);

					removeOptions.MaxAge = 0;
					removeOptions.Expires = new Date(0);

					writeCookie(cookieString(key(name), '', removeOptions));

					return this;
				},

				Clear: function (options) {
					var values = all();
					var name;

					for (name in values) {
						if (!own(values, name)) continue;
						if (prefix && name.indexOf(prefix) !== 0) continue;

						this.Remove(prefix ? name.substring(prefix.length) : name, options);
					}

					return this;
				},

				Namespace: function (name) {
					name = normalizeNamespace(name);

					return createCookieStorage(prefix + (name ? (name + '.') : ''));
				}
			};
		}

		function createStorageOperation (executor) {
			var listeners = Runtime.EventList();
			var executed = false;
			var finished = false;

			function emit (name, data) {
				listeners.Emit(name, {Type: name, Data: data});
			}

			var operation = {
				On: function (name, callback) {
					listeners.Add(name, callback);

					return this;
				},

				Execute: function () {
					if (executed) return this;

					executed = true;

					try {
						executor(
							function (data) {
								if (finished) return;

								finished = true;

								emit('Success', data);
							},
							function (error) {
								if (finished) return;

								finished = true;

								emit('Error', error);
							}
						);
					}
					catch (error) {
						if (!finished) {
							finished = true;

							emit('Error', error);
						}
					}

					return this;
				}
			};

			return operation;
		}

		/* Storage: IndexedDB schema */
		function createIndexes (store, indexes) {
			indexes = indexes || {};

			var indexName;

			for (indexName in indexes) {
				if (!own(indexes, indexName)) continue;
				if (store.indexNames.contains(indexName)) continue;

				var options = indexes[indexName] || {};
				var nativeOptions = {};
				var keyPath = options.KeyPath !== undefined ? options.KeyPath : indexName;

				if (options.Unique)
					nativeOptions.unique = true;

				if (options.MultiEntry)
					nativeOptions.multiEntry = true;

				store.createIndex(indexName, keyPath, nativeOptions);
			}
		}

		function applySchema (db, transaction, stores) {
			var storeName;

			for (storeName in stores) {
				if (!own(stores, storeName)) continue;

				var options = stores[storeName] || {};
				var store;

				if (!db.objectStoreNames.contains(storeName)) {
					var nativeOptions = {};

					if (options.KeyPath !== undefined && options.KeyPath !== null)
						nativeOptions.keyPath = options.KeyPath;

					if (options.AutoIncrement)
						nativeOptions.autoIncrement = true;

					store = db.createObjectStore(storeName, nativeOptions);
				}
				else {
					store = transaction.objectStore(storeName);
				}

				createIndexes(store, options.Indexes);
			}
		}

		/* A connection closed under a waiting operation: the database is reopened once. */
		function recoverableConnectionError (error) {
			if (!error)
				return false;

			return error.name === 'InvalidStateError';
		}

		/* Storage: IndexedDB transaction requests */
		function createTransactionRequest (request) {
			var listeners = Runtime.EventList();
			var settled = false;
			var succeeded = false;
			var result;

			function emit (name, data) {
				listeners.Emit(name, {Type: name, Data: data});
			}

			request.onsuccess = function () {
				settled = true;
				succeeded = true;
				result = request.result;

				emit('Success', result);
			};

			request.onerror = function () {
				settled = true;

				emit('Error', request.error);
			};

			return {
				On: function (name, callback) {
					listeners.Add(name, callback);

					if (settled && name === 'Success' && succeeded)
						callback({Type: name, Data: result});

					if (settled && name === 'Error' && !succeeded)
						callback({Type: name, Data: request.error});

					return this;
				}
			};
		}

		function createTransactionStore (transaction, storeName) {
			var store = transaction.objectStore(storeName);

			return {
				Get: function (key) {
					return createTransactionRequest(store.get(key));
				},

				Put: function (key, value) {
					return createTransactionRequest(store.put(value, key));
				},

				Remove: function (key) {
					return createTransactionRequest(store.delete(key));
				},

				Clear: function () {
					return createTransactionRequest(store.clear());
				},

				Index: function (indexName) {
					var index = store.index(indexName);

					return {
						Get: function (key) {
							return createTransactionRequest(index.get(key));
						},

						GetAll: function (key) {
							return createTransactionRequest(key === undefined ? index.getAll() : index.getAll(key));
						}
					};
				}
			};
		}

		/* Storage: IndexedDB database */
		function createIndexedDB (name, definition) {
			definition = definition || {};

			var version = definition.Version || 1;
			var stores = definition.Stores || {};
			var database = null;
			var opening = false;
			var waiting = [];

			/* IndexedDB: connection */
			function settleWaiting (error) {
				var copy = waiting.slice();

				waiting = [];
				opening = false;

				var i = 0;
				while (i < copy.length) {
					if (error) copy[i].Error(error);
					else copy[i].Success(database);

					i++;
				}
			}

			function open (success, error) {
				if (database) {
					success(database);

					return;
				}

				waiting.push({
					Success: success,
					Error: error
				});

				if (opening) return;

				opening = true;

				var request = global.indexedDB.open(name, version);

				request.onupgradeneeded = function (event) {
					var db = event.target.result;
					var transaction = event.target.transaction;

					applySchema(db, transaction, stores);

					if (typeof definition.Upgrade === 'function') {
						definition.Upgrade({
							Database: db,
							Transaction: transaction,
							OldVersion: event.oldVersion,
							NewVersion: event.newVersion
						});
					}
				};

				request.onsuccess = function (event) {
					var connection = event.target.result;

					database = connection;

					connection.onversionchange = function () {
						invalidateDatabase(connection);
					};

					connection.onclose = function () {
						if (database === connection)
							database = null;
					};

					settleWaiting(null);
				};

				request.onerror = function () {
					settleWaiting(request.error || new Error('Elemenx IndexedDB open failed'));
				};

				request.onblocked = function () {
					settleWaiting(new Error('Elemenx IndexedDB open blocked'));
				};
			}

			function invalidateDatabase (db) {
				if (database !== db) return;

				try {
					db.close();
				}
				catch (closeError) {
				}

				database = null;
			}

			/* Opens the database and a native transaction on it; ready (transaction) runs once the transaction exists. */
			function openTransaction (storeNames, mode, requireStores, error, ready) {
				var attempt = 0;

				function execute () {
					open(function (db) {
						var transaction;
						var i = 0;

						while (requireStores && i < storeNames.length) {
							if (!db.objectStoreNames.contains(storeNames[i])) {
								error(new Error('Elemenx IndexedDB store not found: ' + storeNames[i]));

								return;
							}

							i++;
						}

						try {
							transaction = db.transaction(storeNames, mode);
						}
						catch (transactionError) {
							if (attempt === 0 && recoverableConnectionError(transactionError)) {
								attempt++;

								invalidateDatabase(db);

								execute();

								return;
							}

							error(transactionError);

							return;
						}

						ready(transaction);
					}, error);
				}

				execute();
			}

			/* IndexedDB: operations */
			function storeOperation (storeName, mode, action) {
				return createStorageOperation(function (success, error) {
					openTransaction([storeName], mode, true, error, function (transaction) {
						var request;

						try {
							request = action(transaction.objectStore(storeName));
						}
						catch (operationError) {
							error(operationError);

							return;
						}

						request.onsuccess = function () {
							success(request.result);
						};

						request.onerror = function () {
							error(request.error || transaction.error || new Error('Elemenx IndexedDB operation failed'));
						};
					});
				});
			}

			function indexOperation (storeName, indexName, action) {
				return storeOperation(storeName, 'readonly', function (store) {
					return action(store.index(indexName));
				});
			}

			function createIndex (storeName, indexName) {
				return {
					Get: function (key) {
						return indexOperation(storeName, indexName, function (index) {
							return index.get(key);
						});
					},

					GetAll: function (key) {
						return indexOperation(storeName, indexName, function (index) {
							return key === undefined ? index.getAll() : index.getAll(key);
						});
					},

					Count: function (key) {
						return indexOperation(storeName, indexName, function (index) {
							return key === undefined ? index.count() : index.count(key);
						});
					}
				};
			}

			function createStore (storeName) {
				return {
					Get: function (key) {
						return storeOperation(storeName, 'readonly', function (store) {
							return store.get(key);
						});
					},

					GetAll: function () {
						return storeOperation(storeName, 'readonly', function (store) {
							return store.getAll();
						});
					},

					Count: function () {
						return storeOperation(storeName, 'readonly', function (store) {
							return store.count();
						});
					},

					Put: function (key, value) {
						return storeOperation(storeName, 'readwrite', function (store) {
							return store.put(value, key);
						});
					},

					Remove: function (key) {
						return storeOperation(storeName, 'readwrite', function (store) {
							return store.delete(key);
						});
					},

					Clear: function () {
						return storeOperation(storeName, 'readwrite', function (store) {
							return store.clear();
						});
					},

					Index: function (indexName) {
						return createIndex(storeName, String(indexName));
					}
				};
			}

			function transactionOperation (storeNames, mode, callback) {
				return createStorageOperation(function (success, error) {
					openTransaction(storeNames, mode || 'readonly', false, error, function (transaction) {
						var failed = false;
						var api = {
							Store: function (storeName) {
								return createTransactionStore(transaction, String(storeName));
							},

							Abort: function () {
								transaction.abort();
							}
						};

						transaction.oncomplete = function () {
							if (!failed)
								success(true);
						};

						transaction.onerror = function (event) {
							var source = event && event.target;

							if (failed) return;

							/* Requests pending at Abort() fail with AbortError first; the abort itself is reported by onabort. */
							if (source && source !== transaction && source.error && source.error.name === 'AbortError') return;

							failed = true;

							error(transaction.error || new Error('Elemenx IndexedDB transaction failed'));
						};

						transaction.onabort = function () {
							if (failed) return;

							failed = true;

							error(transaction.error || new Error('Elemenx IndexedDB transaction aborted'));
						};

						try {
							callback(api);
						}
						catch (callbackError) {
							failed = true;

							transaction.abort();

							error(callbackError);
						}
					});
				});
			}

			/* IndexedDB: public API */
			return {
				Store: function (storeName) {
					return createStore(String(storeName));
				},

				Transaction: function (storeNames, mode, callback) {
					if (typeof mode === 'function') {
						callback = mode;
						mode = 'readonly';
					}

					if (!(storeNames instanceof Array))
						storeNames = [storeNames];

					return transactionOperation(storeNames, mode, callback);
				},

				Close: function () {
					if (database)
						database.close();

					database = null;

					return this;
				},

				Delete: function () {
					var self = this;

					return createStorageOperation(function (success, error) {
						self.Close();

						var request = global.indexedDB.deleteDatabase(name);

						request.onsuccess = function () {
							success(true);
						};

						request.onerror = function () {
							error(request.error || new Error('Elemenx IndexedDB delete failed'));
						};
					});
				}
			};
		}

		var contextRegistry = {};

		function StorageContext (name, definition) {
			name = String(name || '');

			if (arguments.length === 2) {
				contextRegistry[name] = definition || {};

				return contextRegistry[name];
			}

			if (arguments.length === 1)
				return own(contextRegistry, name) ? contextRegistry[name] : null;

			throw new Error('Elemenx.Storage.Context expects (name) or (name, definition)');
		}

		function copyObject (source) {
			return Runtime.Assign({}, source || {});
		}

		function mergeIndexedDBDefinition (target, source) {
			if (!source)
				return target;

			if (source.Name !== undefined)
				target.Name = source.Name;

			if (source.Version !== undefined)
				target.Version = source.Version;

			if (source.Upgrade !== undefined)
				target.Upgrade = source.Upgrade;

			target.Stores = target.Stores || {};

			var storeName;
			var indexName;

			for (storeName in source.Stores) {
				if (!own(source.Stores, storeName)) continue;

				var sourceStore = source.Stores[storeName] || {};
				var targetStore = target.Stores[storeName] || {};
				var mergedStore = copyObject(targetStore);

				if (sourceStore.KeyPath !== undefined)
					mergedStore.KeyPath = sourceStore.KeyPath;

				if (sourceStore.AutoIncrement !== undefined)
					mergedStore.AutoIncrement = sourceStore.AutoIncrement;

				mergedStore.Indexes = copyObject(targetStore.Indexes);

				for (indexName in sourceStore.Indexes) {
					if (!own(sourceStore.Indexes, indexName)) continue;

					mergedStore.Indexes[indexName] = copyObject(sourceStore.Indexes[indexName]);
				}

				target.Stores[storeName] = mergedStore;
			}

			return target;
		}

		function resolveContext (context, result, stack) {
			if (!context) return;

			var definition;
			var dependencies;
			var i = 0;

			if (typeof context === 'string') {
				definition = StorageContext(context);

				if (!definition)
					throw new Error('Elemenx unknown Storage Context: ' + context);
			}
			else {
				definition = context;
			}

			if (stack.indexOf(definition) !== -1)
				throw new Error('Elemenx circular Storage Context dependency');

			stack.push(definition);

			dependencies = definition.Contexts || [];

			if (!Array.isArray(dependencies))
				dependencies = [dependencies];

			while (i < dependencies.length) {
				resolveContext(dependencies[i], result, stack);

				i++;
			}

			stack.pop();

			if (definition.Namespace)
				result.Namespaces.push(normalizeNamespace(definition.Namespace));

			if (definition.IndexedDB)
				mergeIndexedDBDefinition(result.IndexedDB, definition.IndexedDB);
		}

		function createStorageFacade (context) {
			var resolved = {
				Namespaces: [],
				IndexedDB: {Stores: {}}
			};
			var cookie = createCookieStorage('');
			var session = createWebStorage(browserStorage('sessionStorage'), '');
			var local = createWebStorage(browserStorage('localStorage'), '');
			var i = 0;

			resolveContext(context, resolved, []);

			while (i < resolved.Namespaces.length) {
				if (resolved.Namespaces[i]) {
					cookie = cookie.Namespace(resolved.Namespaces[i]);
					session = session.Namespace(resolved.Namespaces[i]);
					local = local.Namespace(resolved.Namespaces[i]);
				}

				i++;
			}

			function IndexedDB (name, definition) {
				var configured = resolved.IndexedDB;

				if (arguments.length === 0) {
					if (!configured.Name)
						throw new Error('Elemenx Storage Context does not define IndexedDB.Name');

					return createIndexedDB(configured.Name, configured);
				}

				return createIndexedDB(name, definition);
			}

			return {
				Cookie: cookie,
				Session: session,
				Local: local,
				IndexedDB: IndexedDB
			};
		}

		function Storage (context) {
			return createStorageFacade(context);
		}

		var RawStorage = createStorageFacade(null);

		Storage.Cookie = RawStorage.Cookie;
		Storage.Session = RawStorage.Session;
		Storage.Local = RawStorage.Local;
		Storage.IndexedDB = createIndexedDB;
		Storage.Context = StorageContext;

		Elemenx.Storage = Storage;
		Runtime.StorageFor = function () {
			return Storage;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Events */
	(function (global) {
		'use strict';

		var ownedResources = Runtime.OwnerRegistry();
		var sockets = [];
		var sequence = 0;
		var pipeTypes = {};

		function Pipe (name, factory) {
			name = String(name);

			if (arguments.length === 1)
				return pipeTypes[name] || null;

			if (typeof factory !== 'function')
				throw new Error('Elemenx Pipe factory must be a function');

			pipeTypes[name] = factory;

			return Elemenx;
		}

		function pipeDescriptor (descriptor) {
			if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor))
				throw new Error('Elemenx Pipe descriptor must be an object');

			var names = Object.keys(descriptor);
			if (names.length !== 1)
				throw new Error('Elemenx Pipe descriptor must contain exactly one Pipe');

			var name = names[0];
			var factory = pipeTypes[name];
			if (!factory)
				throw new Error('Elemenx Pipe is not registered: ' + name);

			var instance = factory(descriptor[name]);
			if (!instance || typeof instance.Use !== 'function')
				throw new Error('Elemenx Pipe must provide Use(value, pass)');

			return instance;
		}

		function Pipeline (descriptors) {
			var pipes = [];
			var destroyed = false;
			var i = 0;

			while (i < descriptors.length) {
				pipes.push(pipeDescriptor(descriptors[i]));

				i++;
			}

			return {
				Use: function (value, pass) {
					if (destroyed) return;

					function next (index, current) {
						if (destroyed) return;

						if (index >= pipes.length) {
							pass(current);

							return;
						}

						pipes[index].Use(current, function (output) { next(index + 1, output); });
					}

					next(0, value);
				},
				Destroy: function () {
					if (destroyed) return;

					destroyed = true;

					var j = 0;
					while (j < pipes.length) {
						if (typeof pipes[j].Destroy === 'function') {
							pipes[j].Destroy();
						}

						j++;
					}

					pipes = [];
				}
			};
		}

		Pipe('Debouncer', function (threshold) {
			threshold = Math.max(1, Number(threshold) || 1);

			var hasCurrent = false;
			var current;
			var target;
			var targetCount = 0;

			return {Use: function (event, pass) {
				var value = event.Data;

				if (hasCurrent && value === current) {
					target = undefined;
					targetCount = 0;

					return;
				}

				if (value !== target) {
					target = value;
					targetCount = 1;
				}
				else {
					targetCount++;
				}

				if (targetCount < threshold) return;

				hasCurrent = true;
				current = target;
				target = undefined;
				targetCount = 0;

				pass(event);
			}};
		});

		Pipe('Filter', function (size) {
			size = Math.max(1, Number(size) || 1);

			var samples = [];

			return {Use: function (event, pass) {
				samples.push(event);

				if (samples.length < size) return;

				var best = samples[0];
				var bestCount = 0;
				var i = 0;

				while (i < samples.length) {
					var count = 0;
					var j = 0;

					while (j < samples.length) {
						if (samples[j].Data === samples[i].Data) {
							count++;
						}

						j++;
					}

					if (count > bestCount) {
						best = samples[i];
						bestCount = count;
					}

					i++;
				}

				samples = [];

				pass(best);
			}};
		});

		Pipe('Gate', function (timeout) {
			timeout = Math.max(0, Number(timeout) || 0);

			var timer = null;
			var pending = null;

			return {
				Use: function (event, pass) {
					if (!event.Data) {
						if (timer !== null)
							clearTimeout(timer);

						timer = null;
						pending = null;

						return;
					}

					if (timer !== null) return;

					pending = event;
					timer = setTimeout(function () {
						var output = pending;

						timer = null;
						pending = null;

						if (output)
							pass(output);
					}, timeout);
				},
				Destroy: function () {
					if (timer !== null)
						clearTimeout(timer);

					timer = null;
					pending = null;
				}
			};
		});

		function Event (source, channel, data) {
			var context = null;
			var event = {
				Source: source,
				Channel: String(channel),
				Data: data
			};

			event.Is = function (name, pipes, handler) {
				if (event.Channel !== String(name)) return false;

				if (typeof pipes === 'function') {
					handler = pipes;
					pipes = null;
				}

				if (!pipes) {
					if (typeof handler === 'function') {
						handler(event);
					}

					return true;
				}

				if (!Array.isArray(pipes)) {
					pipes = [pipes];
				}

				if (typeof handler !== 'function')
					throw new Error('Elemenx Event.Is pipeline requires a handler');

				if (!context || !context.Socket)
					throw new Error('Elemenx Event.Is pipeline requires an Events delivery context');

				var index = context.Index++;

				context.Socket.Pipe(context.Slot + ':' + index, pipes, event, handler);

				return true;
			};

			event._Context = function (value) { context = value; };

			return event;
		}

		function EventsSocket (owner) {
			var subscriptions = {};
			var pipelines = {};
			var id = 'elemenx:Events:' + sequence++;
			var destroyed = false;
			var api;

			function ensure () {
				if (destroyed)
					throw new Error('Elemenx Events Socket is destroyed');
			}

			function On (channel, callback) {
				ensure();

				channel = String(channel);

				if (typeof callback !== 'function')
					throw new Error('Elemenx Events.On callback must be a function');

				if (!subscriptions[channel])
					subscriptions[channel] = [];

				if (subscriptions[channel].indexOf(callback) === -1) {
					subscriptions[channel].push(callback);
				}

				return api;
			}

			function Off (channel, callback) {
				ensure();

				channel = String(channel);

				var list = subscriptions[channel];
				if (!list)
					return api;

				if (!callback) {
					delete subscriptions[channel];

					return api;
				}

				var index = list.indexOf(callback);
				if (index !== -1)
					list.splice(index, 1);

				if (!list.length)
					delete subscriptions[channel];

				return api;
			}

			function Emit (channel, data) {
				ensure();

				var event = Event(api, channel, data);
				var copy = sockets.slice(0);
				var i = 0;

				while (i < copy.length) {
					copy[i].Deliver(event);

					i++;
				}

				return api;
			}

			function PipeEvent (rule, descriptors, event, handler) {
				var key = event.Channel + ':' + rule;
				if (!pipelines[key])
					pipelines[key] = Pipeline(descriptors);

				pipelines[key].Use(event, handler);
			}

			function Deliver (event) {
				if (destroyed) return;

				var list = subscriptions[event.Channel];
				if (!list || !list.length) return;

				var copy = list.slice(0);
				var i = 0;

				while (i < copy.length) {
					event._Context({Socket: api, Slot: i, Index: 0});

					Runtime.Notify(copy[i], undefined, [event]);

					event._Context(null);

					i++;
				}
			}

			function Channels () {
				return Object.keys(subscriptions);
			}

			function Destroy () {
				if (destroyed) return;

				destroyed = true;

				var index = sockets.indexOf(api);
				if (index !== -1)
					sockets.splice(index, 1);

				ownedResources.Remove(owner, api);

				var keys = Object.keys(pipelines);
				var i = 0;

				while (i < keys.length) {
					pipelines[keys[i]].Destroy();

					i++;
				}

				pipelines = {};
				subscriptions = {};
			}

			api = {ID: id, On: On, Off: Off, Emit: Emit, Channels: Channels, Destroy: Destroy, Deliver: Deliver, Pipe: PipeEvent};

			sockets.push(api);

			ownedResources.Add(owner, api);

			return api;
		}

		function Events () {
			return EventsSocket(null);
		}

		Elemenx.Pipe = Pipe;
		Runtime.CreatePipeline = Pipeline;
		Elemenx.Events = Events;
		Runtime.EventsFor = function (owner) {
			return function () {
				if (ownedResources.Destroyed(owner))
					throw new Error('Elemenx Events owner is destroyed');

				return EventsSocket(owner);
			};
		};
		Runtime.InitializeEventsOwner = function (owner, definition) {
			var channels = definition && definition.$Events;
			var handler = definition && definition.$OnEvent;

			if (!channels) return null;

			if (!Array.isArray(channels)) {
				channels = [channels];
			}

			var socket = Runtime.EventsFor(owner)();
			var i = 0;

			while (i < channels.length) {
				if (typeof channels[i] !== 'string')
					throw new Error('Elemenx $Events expects channel names as strings');

				(function (channel) {
					socket.On(channel, function (event) {
						if (typeof handler === 'function') {
							handler.call(owner, event);
						}
					});
				})(channels[i]);

				i++;
			}

			return socket;
		};
		Runtime.DestroyEventsOwner = function (owner) {
			ownedResources.Destroy(owner);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Messaging */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var contexts = {};
		var ownedResources = Runtime.OwnerRegistry();
		var entities = new WeakMap();
		var globalSequence = 0;
		var windowBridges = typeof WeakMap === 'function' ? new WeakMap() : null;
		var messagingContexts = {};
		var messagingOrigins = {};

		function MessagingFabric () {
			var sockets = [];
			var bridges = [];
			var seen = {};
			var seenOrder = [];
			var messageSequence = 0;

			function MessageID () {
				messageSequence++;

				return Elemenx.RuntimeID() + ':' + messageSequence;
			}

			function Remember (id) {
				if (!id || seen[id]) return false;

				seen[id] = true;

				seenOrder.push(id);

				while (seenOrder.length > 2048)
					delete seen[seenOrder.shift()];

				return true;
			}

			function Add (socket) {
				sockets.push(socket);
			}

			function Remove (socket) {
				var i = sockets.indexOf(socket);
				if (i === -1) return;

				sockets.splice(i, 1);
			}

			function Send (source, channel, data, transfer, origin, messageID) {
				messageID = messageID || MessageID();

				if (!Remember(messageID)) return;

				var copy = sockets.slice();
				var bridgeCopy = bridges.slice();
				var remoteCount = 0;
				var i = 0;

				if (transfer && transfer.length) {
					while (i < bridgeCopy.length) {
						if (bridgeCopy[i] !== origin && bridgeCopy[i].Transferable !== false) {
							remoteCount++;
						}

						i++;
					}

					if (remoteCount > 1)
						throw new Error('Elemenx Messaging transferable payload cannot be delivered across multiple bridges');
				}

				i = 0;

				while (i < copy.length) {
					copy[i].Deliver(source, channel, data);

					i++;
				}

				i = 0;

				while (i < bridgeCopy.length) {
					if (bridgeCopy[i] !== origin && (!transfer || !transfer.length || bridgeCopy[i].Transferable !== false)) {
						bridgeCopy[i].Send(source, channel, data, transfer, messageID);
					}

					i++;
				}
			}

			function Bridge (endpoint, options) {
				var bridge;
				var handler;

				options = options || {};

				bridge = {
					Transferable: options.Transferable !== false,
					Send: function (source, channel, data, transfer, messageID) {
						var packet = {
							ElemenxMessaging: true,
							ElemenxMessagingProtocol: 1,
							MessageID: messageID,
							Runtime: Elemenx.RuntimeID(),
							Source: source,
							Channel: channel,
							Data: data
						};

						if (transfer && transfer.length) endpoint.postMessage(packet, transfer);
						else endpoint.postMessage(packet);
					}
				};

				handler = function (event) {
					var packet = event.data;
					if (!packet || packet.ElemenxMessaging !== true) return;
					if (packet.ElemenxMessagingProtocol !== undefined && packet.ElemenxMessagingProtocol !== 1) return;

					Send(packet.Source, packet.Channel, packet.Data, null, bridge, packet.MessageID);
				};

				endpoint.addEventListener('message', handler);

				if (endpoint.start)
					endpoint.start();

				bridges.push(bridge);

				return {
					Destroy: function () {
						var index = bridges.indexOf(bridge);

						endpoint.removeEventListener('message', handler);

						if (index !== -1)
							bridges.splice(index, 1);
					}
				};
			}

			return {
				Add: Add,
				Remove: Remove,
				Send: Send,
				Bridge: Bridge
			};
		}

		var messagingFabric = MessagingFabric();

		function Context (name, definition) {
			if (arguments.length === 1)
				return contexts[name] || null;

			contexts[name] = definition || {};

			return contexts[name];
		}

		function resolveContexts (input, output, stack) {
			var definition;
			var dependencies;
			var i = 0;

			if (!input) return;

			if (typeof input === 'string') {
				if (stack[input])
					throw new Error('Elemenx Messaging Context cycle: ' + input);

				definition = Context(input);

				if (!definition)
					throw new Error('Elemenx Messaging Context not found: ' + input);

				stack[input] = true;
			}
			else {
				definition = input;
			}

			dependencies = definition.Contexts || [];

			if (!Array.isArray(dependencies))
				dependencies = [dependencies];

			while (i < dependencies.length) {
				resolveContexts(dependencies[i], output, stack);

				i++;
			}

			output.push(definition);

			if (typeof input === 'string')
				delete stack[input];
		}

		function MessagingSocket (context, owner) {
			var id = null;
			var subscriptions = {};
			var automatic = {};
			var pipelines = {};
			var ownCallbacks = [];
			var destroyed = false;
			var internalID = 'elemenx:Messaging:' + globalSequence++;
			var entity = owner ? entities.get(owner) : null;
			var entityChannel = entity ? 'elemenx:' + entity.Name : null;
			var entityInstanceChannel = entity ? entityChannel + ':' + entity.Index : null;
			var api;

			function ensure () {
				if (destroyed)
					throw new Error('Elemenx Messaging Socket is destroyed');
			}

			function addAutomatic (channel) {
				if (!channel) return;

				automatic[String(channel)] = true;
			}

			function OwnChannel () {
				return id || entityInstanceChannel || internalID;
			}

			function ID (value) {
				if (!arguments.length) return id;

				ensure();

				id = value === null || value === undefined || value === '' ? null : String(value);

				return api;
			}

			function On (channel, callback) {
				if (arguments.length === 1 && typeof channel === 'function') {
					ensure();

					if (ownCallbacks.indexOf(channel) === -1)
						ownCallbacks.push(channel);

					return api;
				}

				ensure();

				channel = String(channel);

				if (!subscriptions[channel])
					subscriptions[channel] = [];

				if (subscriptions[channel].indexOf(callback) === -1) {
					subscriptions[channel].push(callback);
				}

				return api;
			}

			function Off (channel, callback) {
				var list;
				var i;

				if (arguments.length === 1 && typeof channel === 'function') {
					i = ownCallbacks.indexOf(channel);

					if (i !== -1)
						ownCallbacks.splice(i, 1);

					return api;
				}

				channel = String(channel);
				list = subscriptions[channel];

				if (!list)
					return api;

				if (!callback) {
					delete subscriptions[channel];

					return api;
				}

				i = list.indexOf(callback);

				if (i !== -1)
					list.splice(i, 1);

				if (!list.length)
					delete subscriptions[channel];

				return api;
			}

			function Send (channel, data, options) {
				var transfer = null;

				ensure();

				if (Runtime.PrepareMessagingSend)
					Runtime.PrepareMessagingSend(String(channel));

				if (options && options.Transferable === true) {
					transfer = [data];
				}

				messagingFabric.Send(OwnChannel(), String(channel), data, transfer, null);

				return api;
			}

			function Channels () {
				var result = [];
				var seen = {};
				var channel;

				function add (value) {
					if (!value || seen[value]) return;

					seen[value] = true;

					result.push(value);
				}

				add(OwnChannel());
				add(entityChannel);
				add(entityInstanceChannel);

				for (channel in automatic) {
					if (own(automatic, channel)) {
						add(channel);
					}
				}

				for (channel in subscriptions) {
					if (own(subscriptions, channel)) {
						add(channel);
					}
				}

				return result;
			}

			function PipeMessage (rule, descriptors, message, handler) {
				var key = message.Channel + ':' + rule;
				if (!pipelines[key])
					pipelines[key] = Runtime.CreatePipeline(descriptors);

				pipelines[key].Use(message, handler);
			}

			function Deliver (source, channel, data) {
				var callbacks = [];
				var explicit = subscriptions[channel];
				var context = null;
				var message;
				var i = 0;
				var ownChannel = channel === OwnChannel();
				var member = ownChannel || channel === entityChannel || channel === entityInstanceChannel || automatic[channel] || explicit;
				if (destroyed || !member) return;

				if (ownChannel)
					callbacks = callbacks.concat(ownCallbacks);

				if (explicit)
					callbacks = callbacks.concat(explicit);

				if (!callbacks.length) return;

				message = {
					Channel: channel,
					Source: source,
					Data: data
				};
				message.Is = function (name, pipes, handler) {
					if (message.Channel !== String(name)) return false;

					if (typeof pipes === 'function') {
						handler = pipes;
						pipes = null;
					}

					if (!pipes) {
						if (typeof handler === 'function') {
							handler(message);
						}

						return true;
					}

					if (!Array.isArray(pipes)) {
						pipes = [pipes];
					}

					if (typeof handler !== 'function')
						throw new Error('Elemenx Message.Is pipeline requires a handler');

					if (!context || !context.Socket)
						throw new Error('Elemenx Message.Is pipeline requires a Messaging delivery context');

					var index = context.Index++;

					context.Socket.Pipe(context.Slot + ':' + index, pipes, message, handler);

					return true;
				};

				while (i < callbacks.length) {
					context = {Socket: api, Slot: i, Index: 0};

					Runtime.Notify(callbacks[i], undefined, [message]);

					context = null;

					i++;
				}
			}

			function Destroy () {
				if (destroyed) return;

				destroyed = true;

				var keys = Object.keys(pipelines);
				var p = 0;

				while (p < keys.length) {
					pipelines[keys[p]].Destroy();

					p++;
				}

				pipelines = {};
				subscriptions = {};
				automatic = {};
				ownCallbacks = [];

				messagingFabric.Remove(api);

				ownedResources.Remove(owner, api);
			}

			function applyContext (input) {
				var resolved = [];
				var definition;
				var channels;
				var i = 0;
				var k;

				resolveContexts(input, resolved, {});

				while (i < resolved.length) {
					definition = resolved[i];

					if (definition.ID !== undefined)
						ID(definition.ID);

					channels = definition.Channels || [];
					k = 0;

					while (k < channels.length) {
						addAutomatic(channels[k]);

						k++;
					}

					i++;
				}
			}

			addAutomatic(entityChannel);
			addAutomatic(entityInstanceChannel);

			api = {
				ID: ID,
				On: On,
				Off: Off,
				Send: Send,
				Channels: Channels,
				Destroy: Destroy,
				Deliver: Deliver,
				Pipe: PipeMessage
			};

			messagingFabric.Add(api);

			ownedResources.Add(owner, api);

			if (context)
				applyContext(context);

			return api;
		}

		function WindowBridge (target, options, owner) {
			var origin;
			var handlers = Runtime.MessageListeners();
			var bridge;
			var handle;
			var destroyed = false;
			var registry;
			var active;
			var pending = [];
			var announcementTimer = null;

			if (!Runtime.HasDOM)
				throw new Error('Elemenx Messaging Window is only available in a DOM runtime');

			if (typeof target === 'string') {
				var root = owner && typeof owner.$Element === 'function' ? owner.$Element() : global.document;

				if (root && root.matches && root.matches(target)) target = root;
				else target = root && root.querySelector ? root.querySelector(target) : null;
			}

			if (target && typeof target.postMessage !== 'function' && target.contentWindow)
				target = target.contentWindow;

			if (!target || typeof target.postMessage !== 'function')
				throw new Error('Elemenx Messaging Window expects a Window, iframe or selector');

			options = options || {};
			origin = options.Origin;

			if (origin === undefined || origin === null || origin === '') {
				origin = global.location && global.location.origin ? global.location.origin : '*';

				if (origin === 'null')
					origin = '*';
			}

			origin = String(origin);
			active = options.Active !== false;

			if (windowBridges) {
				registry = windowBridges.get(target);

				if (registry && registry[origin]) return registry[origin];
			}

			var endpoint = {
				postMessage: function (packet, transfer) {
					if (!active) {
						pending.push({Packet: packet, Transfer: transfer});

						return;
					}

					if (transfer && transfer.length) target.postMessage(packet, origin, transfer);
					else target.postMessage(packet, origin);
				},
				addEventListener: function (event, callback) {
					var wrapper;

					if (event !== 'message') return;

					wrapper = function (messageEvent) {
						if (messageEvent.source !== target) return;
						if (origin !== '*' && messageEvent.origin !== origin) return;

						callback(messageEvent);
					};

					handlers.Add(callback, wrapper);
				},
				removeEventListener: function (event, callback) {
					if (event === 'message')
						handlers.Remove(callback);
				}
			};

			bridge = messagingFabric.Bridge(endpoint, {Transferable: options.Transferable !== false});

			function Activate () {
				if (destroyed || active) return handle;

				active = true;

				var item;

				if (announcementTimer !== null) {
					global.clearTimeout(announcementTimer);

					announcementTimer = null;
				}

				while (pending.length) {
					item = pending.shift();

					if (item.Transfer && item.Transfer.length) target.postMessage(item.Packet, origin, item.Transfer);
					else target.postMessage(item.Packet, origin);
				}

				return handle;
			}

			function Announce () {
				if (destroyed || active) return handle;

				WindowAnnouncement(target);

				if (announcementTimer === null) {
					announcementTimer = global.setTimeout(function RetryAnnouncement () {
						announcementTimer = null;

						if (destroyed || active) return;

						Announce();
					}, 50);
				}

				return handle;
			}

			handle = {
				Target: function () { return target; },
				Origin: function () { return origin; },
				Active: function () { return active; },
				Activate: Activate,
				Announce: Announce,
				Destroy: function () {
					if (destroyed) return;

					destroyed = true;

					if (announcementTimer !== null) {
						global.clearTimeout(announcementTimer);

						announcementTimer = null;
					}

					pending = [];

					bridge.Destroy();

					bridge = null;

					if (windowBridges) {
						registry = windowBridges.get(target);

						if (registry && registry[origin] === handle) {
							delete registry[origin];
						}
					}

					ownedResources.Remove(owner, handle);
				}
			};

			if (windowBridges) {
				registry = windowBridges.get(target);

				if (!registry) {
					registry = {};

					windowBridges.set(target, registry);
				}

				registry[origin] = handle;
			}

			ownedResources.Add(owner, handle);

			return handle;
		}

		function MessagingOriginAllowed (origin) {
			if (!origin)
				return false;

			var ownOrigin = global.location && global.location.origin ? global.location.origin : null;
			if (ownOrigin && ownOrigin !== 'null' && origin === ownOrigin) return true;

			return messagingOrigins['*'] === true || messagingOrigins[String(origin)] === true;
		}

		function MessagingOrigins (origins) {
			if (origins === undefined)
				return Object.keys(messagingOrigins);

			var list = Array.isArray(origins) ? origins : [origins];
			var i = 0;

			while (i < list.length) {
				if (list[i] !== undefined && list[i] !== null && String(list[i])) {
					var trustedOrigin = String(list[i]);

					messagingOrigins[trustedOrigin] = true;

					if (Runtime.HasDOM) {
						if (global.parent && global.parent !== global)
							WindowBridge(global.parent, {Origin: trustedOrigin, Active: false}, null).Announce();

						if (global.opener)
							WindowBridge(global.opener, {Origin: trustedOrigin, Active: false}, null).Announce();
					}
				}

				i++;
			}

			return Messaging;
		}

		function WindowAnnouncement (target) {
			if (!target || target === global || typeof target.postMessage !== 'function') return;

			target.postMessage({
				ElemenxMessagingWindow: 'HELLO',
				ElemenxMessagingProtocol: 1,
				Runtime: Elemenx.RuntimeID()
			}, '*');
		}

		function InitializeWindowDiscovery () {
			if (!Runtime.HasDOM) return;

			global.addEventListener('message', function (event) {
				var packet = event.data;
				if (!packet || !packet.ElemenxMessagingWindow) return;
				if (packet.ElemenxMessagingProtocol !== 1) return;
				if (!event.source || typeof event.source.postMessage !== 'function') return;
				if (!MessagingOriginAllowed(event.origin)) return;

				if (packet.ElemenxMessagingWindow === 'HELLO') {
					WindowBridge(event.source, {Origin: event.origin}, null).Activate();

					event.source.postMessage({
						ElemenxMessagingWindow: 'WELCOME',
						ElemenxMessagingProtocol: 1,
						Runtime: Elemenx.RuntimeID()
					}, event.origin);
				}
				else if (packet.ElemenxMessagingWindow === 'WELCOME') {
					WindowBridge(event.source, {Origin: event.origin}, null).Activate();
				}
			});

			if (global.parent && global.parent !== global) {
				WindowAnnouncement(global.parent);
			}

			if (global.opener)
				WindowAnnouncement(global.opener);
		}

		function Messaging (context) {
			return MessagingSocket(context, null);
		}

		Messaging.Context = Context;
		Messaging.Origins = MessagingOrigins;
		Messaging.Window = function (target, options) { return WindowBridge(target, options, null); };

		Elemenx.Messaging = Messaging;

		Runtime.SetMessagingEntity = function (owner, name, index) {
			entities.set(owner, {
				Name: String(name || 'Entity'),
				Index: index || 0
			});
		};

		Runtime.MessagingFor = function (owner) {
			var accessor = function (context) {
				if (ownedResources.Destroyed(owner))
					throw new Error('Elemenx Messaging owner is destroyed');

				return MessagingSocket(context, owner);
			};

			accessor.Window = function (target, options) {
				if (ownedResources.Destroyed(owner))
					throw new Error('Elemenx Messaging owner is destroyed');

				return WindowBridge(target, options, owner);
			};

			return accessor;
		};

		Runtime.InitializeMessagingOwner = function (owner, definition) {
			var declaration = definition && definition.$Messaging;
			var handler = definition && definition.$OnMessage;

			if (declaration === undefined || declaration === null || declaration === false) return null;

			var context;

			if (typeof declaration === 'string') {
				context = {ID: declaration};
			}
			else if (Array.isArray(declaration)) {
				context = {Channels: declaration};
			}
			else if (typeof declaration === 'object') {
				context = {
					Contexts: declaration.Context !== undefined ? declaration.Context : declaration.Contexts,
					Channels: declaration.Channels || []
				};

				if (declaration.ID !== undefined) {
					context.ID = declaration.ID;
				}
			}
			else {
				throw new Error('Elemenx $Messaging expects an ID string, Channels array or configuration object');
			}

			var socket = Runtime.MessagingFor(owner)(context);

			if (typeof handler !== 'function') return socket;

			var channels = socket.Channels();

			var i = 0;
			while (i < channels.length) {
				socket.On(channels[i], function (message) {
					handler.call(owner, message);
				});

				i++;
			}

			return socket;
		};

		Runtime.AttachMessagingBridge = function (endpoint, options) {
			return messagingFabric.Bridge(endpoint, options);
		};

		InitializeWindowDiscovery();

		if (Runtime.HasDOM && typeof global.BroadcastChannel === 'function') {
			var broadcastChannel = new global.BroadcastChannel('Elemenx:Messaging');

			broadcastChannel.addEventListener('message', function (event) {
				var packet = event.data;
				if (!packet || packet.ElemenxMessagingContext !== true) return;
				if (packet.ElemenxMessagingProtocol !== 1 || !packet.Runtime) return;
				if (packet.Runtime === Elemenx.RuntimeID()) return;

				messagingContexts[packet.Runtime] = true;

				if (packet.Type === 'HELLO')
					broadcastChannel.postMessage({
						ElemenxMessagingContext: true,
						ElemenxMessagingProtocol: 1,
						Type: 'WELCOME',
						Runtime: Elemenx.RuntimeID()
					});
			});

			Runtime.AttachMessagingBridge(broadcastChannel, {
				Transferable: false
			});

			broadcastChannel.postMessage({
				ElemenxMessagingContext: true,
				ElemenxMessagingProtocol: 1,
				Type: 'HELLO',
				Runtime: Elemenx.RuntimeID()
			});
		}

		Runtime.DestroyMessagingOwner = function (owner) {
			ownedResources.Destroy(owner);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* WebWorker */
	(function (global) {
		'use strict';

		var definitions = {};
		var ownedResources = Runtime.OwnerRegistry();
		var handles = [];
		var manualStops = new WeakMap();

		function normalizeDefinition (name, definition) {
			var result = Runtime.Assign({}, definition || {});

			if (result.StartMode === undefined) {
				result.StartMode = 'auto';
			}

			if (result.StartMode !== 'auto' && result.StartMode !== 'manual' && result.StartMode !== 'lazy') {
				throw new Error('Elemenx WebWorker StartMode must be auto, manual or lazy: ' + name);
			}

			if (result.Channel === undefined) {
				result.Channel = name;
			}

			return result;
		}

		function register (name, definition) {
			definitions[name] = normalizeDefinition(name, definition);

			return definitions[name];
		}

		function createHandle (name, definition, owner) {
			var worker = null;
			var bridge = null;
			var blobURL = null;
			var state = 'Stopped';
			var destroyed = false;
			var listeners = Runtime.EventList();
			var api;

			function Emit (event, data) {
				listeners.Emit(event, {Type: event, Worker: api, State: state, Data: data});
			}

			function On (event, callback) {
				if (typeof callback !== 'function')
					throw new Error('Elemenx WebWorker.On callback must be a function');

				listeners.Add(event, callback);

				return api;
			}

			function Off (event, callback) {
				listeners.Remove(event, callback);

				return api;
			}

			function State () {
				return state;
			}

			function Native () {
				return worker;
			}

			function cleanupNative () {
				if (bridge)
					bridge.Destroy();

				if (worker)
					worker.terminate();

				if (blobURL)
					URL.revokeObjectURL(blobURL);

				bridge = null;
				worker = null;
				blobURL = null;
			}

			function Start () {
				if (destroyed)
					throw new Error('Elemenx WebWorker is destroyed: ' + name);

				if (!Runtime.HasDOM)
					throw new Error('Elemenx WebWorker Start is only available in a page runtime');

				if (state === 'Starting' || state === 'Running') return api;

				if (!definition.Script)
					throw new Error('Elemenx WebWorker Script is required: ' + name);

				cleanupNative();

				manualStops.set(api, false);

				state = 'Starting';

				Emit('Starting');

				var frameworkURL = definition.Framework || Runtime.ScriptURL;
				if (!frameworkURL)
					throw new Error('Elemenx runtime script URL is unknown');

				frameworkURL = Runtime.AbsoluteURL(frameworkURL);

				var scriptURL = Runtime.AbsoluteURL(definition.Script);
				var source = 'importScripts(' + JSON.stringify(frameworkURL) + ');\n'
					+ 'self.ElemenxWorkerName = ' + JSON.stringify(name) + ';\n'
					+ 'self.ElemenxWorkerChannel = ' + JSON.stringify(String(definition.Channel)) + ';\n'
					+ 'importScripts(' + JSON.stringify(scriptURL) + ');\n'
					+ 'postMessage({ ElemenxWorker: true, Type: \'Ready\' });\n';

				var blob = new Blob([source], {type: 'application/javascript'});

				blobURL = URL.createObjectURL(blob);

				function failed (event) {
					if (destroyed) return;

					state = 'Error';

					Emit('Error', event);
				}

				try {
					worker = new global.Worker(blobURL);
					bridge = Runtime.AttachMessagingBridge(worker);

					worker.addEventListener('message', function (event) {
						var packet = event.data;

						if (destroyed || state !== 'Starting') return;
						if (!packet || packet.ElemenxWorker !== true || packet.Type !== 'Ready') return;

						state = 'Running';

						Emit('Running');
					});

					worker.addEventListener('error', failed);
					worker.addEventListener('messageerror', failed);
				}
				catch (error) {
					cleanupNative();

					state = 'Error';

					Emit('Error', error);

					throw error;
				}

				return api;
			}

			function Stop () {
				if (destroyed) return api;

				if (state === 'Stopped') {
					manualStops.set(api, true);

					return api;
				}

				manualStops.set(api, true);

				cleanupNative();

				state = 'Stopped';

				Emit('Stop');

				return api;
			}

			function Destroy () {
				if (destroyed) return;

				cleanupNative();

				destroyed = true;
				state = 'Stopped';

				Emit('Stop');

				listeners.Clear();

				var index = handles.indexOf(api);
				if (index !== -1)
					handles.splice(index, 1);

				ownedResources.Remove(owner, api);
			}

			api = {
				Name: function () {
					return name;
				},
				Channel: function () {
					return String(definition.Channel);
				},
				StartMode: function () {
					return definition.StartMode;
				},
				State: State,
				Native: Native,
				Start: Start,
				Stop: Stop,
				On: On,
				Off: Off,
				Destroy: Destroy
			};

			handles.push(api);

			manualStops.set(api, false);

			ownedResources.Add(owner, api);

			if (definition.StartMode === 'auto')
				Start();

			return api;
		}

		function Web (name, definition) {
			if (arguments.length === 2) definition = register(name, definition);
			else definition = definitions[name];

			if (!definition)
				throw new Error('Elemenx WebWorker not found: ' + name);

			return createHandle(name, definition, null);
		}

		function Attach () {
			if (Runtime.HasDOM)
				throw new Error('Elemenx Worker.Attach is only available inside a worker runtime');

			if (global.clients && typeof global.clients.matchAll === 'function') {
				var routes = {};
				var handlers = Runtime.MessageListeners();
				var endpoint = {
					postMessage: function (packet, transfer) {
						var channel = String(packet.Channel);
						var route = routes[channel];

						if (transfer && transfer.length)
							throw new Error('Elemenx ServiceWorker Messaging does not support Transferable payloads yet');

						if (route) {
							global.clients.get(route).then(function (client) {
								if (client) {
									client.postMessage(packet);

									return;
								}

								delete routes[channel];
							});

							return;
						}

						global.clients
							.matchAll({
								type: 'window',
								includeUncontrolled: true
							})
							.then(function (clients) {
								var i = 0;

								while (i < clients.length) {
									clients[i].postMessage(packet);

									i++;
								}
							});
					},
					addEventListener: function (event, callback) {
						if (event !== 'message') return;

						var wrapper = function (messageEvent) {
							var packet = messageEvent.data;

							if (packet && packet.ElemenxMessaging === true && (packet.ElemenxMessagingProtocol === undefined || packet.ElemenxMessagingProtocol === 1) && messageEvent.source) {
								routes[String(packet.Source)] = messageEvent.source.id;
							}

							callback(messageEvent);
						};

						handlers.Add(callback, wrapper);
					},
					removeEventListener: function (event, callback) {
						if (event === 'message')
							handlers.Remove(callback);
					}
				};

				return Runtime.AttachMessagingBridge(endpoint);
			}

			return Runtime.AttachMessagingBridge(global);
		}

		function DestroyOwner (owner) {
			ownedResources.Destroy(owner);
		}

		function PrepareMessagingSend (channel) {
			var copy = handles.slice();
			var handle;
			var i = 0;

			while (i < copy.length) {
				handle = copy[i];

				if (handle.StartMode() === 'lazy' && handle.State() === 'Stopped' && handle.Channel() === String(channel) && manualStops.get(handle) !== true) {
					handle.Start();
				}

				i++;
			}
		}

		Elemenx.WebWorker = Web;

		Runtime.WebWorkerFor = function (owner) {
			return function (name, definition) {
				if (ownedResources.Destroyed(owner))
					throw new Error('Elemenx WebWorker owner is destroyed');

				if (arguments.length === 2) {
					definition = register(name, definition);

					return createHandle(name, definition, owner);
				}

				var application = owner && owner.$Application ? owner.$Application() : null;
				var shared = application && application.$WebWorker ? application.$WebWorker(name) : null;
				if (shared)
					return shared;

				definition = definitions[name];

				if (!definition)
					throw new Error('Elemenx WebWorker not found: ' + name);

				return createHandle(name, definition, owner);
			};
		};

		Runtime.PrepareMessagingSend = PrepareMessagingSend;
		Runtime.DestroyWebWorkerOwner = DestroyOwner;

		Runtime.AttachWorkerMessaging = Attach;

		/* Inside a worker: one that listens and posts (Node, without a DOM, is no worker and threw here). */
		if (!Runtime.HasDOM && !global.clients && typeof global.addEventListener === 'function' && typeof global.postMessage === 'function') {
			Attach();
		}

	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* ServiceWorker */
	(function (global) {
		'use strict';

		var definitions = {};
		var handles = [];
		var ownedResources = Runtime.OwnerRegistry();

		function normalizeDefinition (name, definition) {
			var result = Runtime.Assign({}, definition || {});
			if (!result.Script)
				throw new Error('Elemenx ServiceWorker Script is required: ' + name);

			if (result.Scope === undefined)
				result.Scope = './';

			if (result.Channel === undefined)
				result.Channel = name;

			return result;
		}

		function registerDefinition (name, definition) {
			definitions[name] = normalizeDefinition(name, definition);

			return definitions[name];
		}

		function createEndpoint (serviceWorker) {
			var handlers = [];

			return {
				postMessage: function (packet, transfer) {
					if (transfer && transfer.length) serviceWorker.postMessage(packet, transfer);
					else serviceWorker.postMessage(packet);
				},
				addEventListener: function (event, callback) {
					if (event !== 'message') return;

					var wrapper = function (messageEvent) {
						if (messageEvent.source !== serviceWorker) return;

						callback(messageEvent);
					};

					handlers.push({Callback: callback, Wrapper: wrapper});

					global.navigator.serviceWorker.addEventListener('message', wrapper);
				},
				removeEventListener: function (event, callback) {
					if (event !== 'message') return;

					var i = handlers.length - 1;

					while (i >= 0) {
						if (handlers[i].Callback === callback) {
							global.navigator.serviceWorker.removeEventListener('message', handlers[i].Wrapper);

							handlers.splice(i, 1);
						}

						i--;
					}
				}
			};
		}

		function createHandle (name, definition, owner) {
			var registration = null;
			var active = null;
			var bridge = null;
			var state = 'Unregistered';
			var destroyed = false;
			var listeners = Runtime.EventList();
			var api;

			function Emit (event, data) {
				listeners.Emit(event, {Type: event, Worker: api, State: state, Data: data});
			}

			function setState (value, data) {
				if (state === value) return;

				state = value;

				Emit(value, data);
			}

			function On (event, callback) {
				if (typeof callback !== 'function')
					throw new Error('Elemenx ServiceWorker.On callback must be a function');

				listeners.Add(event, callback);

				return api;
			}

			function Off (event, callback) {
				listeners.Remove(event, callback);

				return api;
			}

			function attachActive (worker) {
				if (!worker || active === worker) return;

				if (bridge)
					bridge.Destroy();

				active = worker;
				bridge = Runtime.AttachMessagingBridge(createEndpoint(worker));

				setState('Active', worker);
			}

			function observeRegistration (value) {
				var installing;

				registration = value;

				if (registration.active) attachActive(registration.active);
				else if (registration.waiting) setState('Waiting', registration.waiting);
				else if (registration.installing) setState('Installing', registration.installing);

				registration.addEventListener('updatefound', function () {
					installing = registration.installing;

					if (!installing) return;

					setState('Installing', installing);

					installing.addEventListener('statechange', function () {
						if (installing.state === 'installed' && registration.waiting)
							setState('Waiting', registration.waiting);

						if (registration.active)
							attachActive(registration.active);
					});
				});

				global.navigator.serviceWorker.addEventListener('controllerchange', function () {
					if (registration && registration.active) {
						attachActive(registration.active);
					}
				});
			}

			function Register () {
				if (destroyed)
					throw new Error('Elemenx ServiceWorker handle is destroyed: ' + name);

				if (!Runtime.HasDOM || !global.navigator.serviceWorker)
					throw new Error('Elemenx ServiceWorker is not available in this runtime');

				if (state !== 'Unregistered' && state !== 'Error') return api;

				var frameworkURL = Runtime.AbsoluteURL(definition.Framework || Runtime.ScriptURL);
				var scriptURL = Runtime.AbsoluteURL(definition.Script);
				var serviceURL = frameworkURL;
				var separator = serviceURL.indexOf('?') === -1 ? '?' : '&';

				serviceURL += separator
					+ 'elemenx_service_worker=1&elemenx_script=' + encodeURIComponent(scriptURL)
					+ '&elemenx_name=' + encodeURIComponent(name)
					+ '&elemenx_channel=' + encodeURIComponent(String(definition.Channel));

				setState('Registering');

				global.navigator.serviceWorker
					.register(serviceURL, {scope: definition.Scope})
					.then(function (value) {
						if (destroyed) return;

						observeRegistration(value);
					})
					.catch(function (error) {
						if (destroyed) return;

						setState('Error', error);
					});

				return api;
			}

			function Update () {
				if (destroyed)
					throw new Error('Elemenx ServiceWorker handle is destroyed: ' + name);

				if (!registration) return api;

				registration
					.update()
					.catch(function (error) {
						setState('Error', error);
					});

				return api;
			}

			/* The registration of this scope, read through the Promise-based browser API: callback (error, registration). */
			function registrationForScope (callback) {
				global.navigator.serviceWorker.getRegistration(Runtime.AbsoluteURL(definition.Scope)).then(function (value) {
					Runtime.Invoke(callback, null, value);
				}, function (error) {
					Runtime.Invoke(callback, error);
				});
			}

			function Unregister () {
				if (destroyed) return api;

				var current = registration;

				setState('Unregistering');

				if (!current) {
					registrationForScope(function (error, value) {
						if (destroyed) return;

						if (error) {
							setState('Error', error);

							return;
						}

						if (!value) {
							setState('Unregistered', {Result: false, Registered: false});

							return;
						}

						registration = value;

						Unregister();
					});

					return api;
				}

				current
					.unregister()
					.then(function (result) {
						if (destroyed) return;

						registrationForScope(function (error, value) {
							if (destroyed) return;

							if (error) {
								setState('Error', error);

								return;
							}

							registration = value || null;

							if (value) {
								observeRegistration(value);

								setState('Active', {Result: result, Registered: true});

								return;
							}

							setState('Unregistered', {Result: result, Registered: false});
						});
					})
					.catch(function (error) {
						if (destroyed) return;

						setState('Error', error);
					});

				return api;
			}

			function Registered (callback) {
				if (typeof callback !== 'function')
					throw new Error('Elemenx ServiceWorker.Registered callback must be a function');

				registrationForScope(function (error, value) {
					callback(!error && !!value);
				});

				return api;
			}

			function Controlled () {
				return !!global.navigator.serviceWorker.controller;
			}

			function Reachable () {
				return !!bridge && !!active;
			}

			function Destroy () {
				if (destroyed) return;

				if (bridge)
					bridge.Destroy();

				bridge = null;
				active = null;
				destroyed = true;

				listeners.Clear();

				var index = handles.indexOf(api);
				if (index !== -1)
					handles.splice(index, 1);

				ownedResources.Remove(owner, api);
			}

			api = {
				Name: function () {
					return name;
				},
				Channel: function () {
					return String(definition.Channel);
				},
				Scope: function () {
					return definition.Scope;
				},
				State: function () {
					return state;
				},
				Registration: function () {
					return registration;
				},
				Registered: Registered,
				Controlled: Controlled,
				Reachable: Reachable,
				Register: Register,
				Update: Update,
				Unregister: Unregister,
				On: On,
				Off: Off,
				Destroy: Destroy
			};

			handles.push(api);

			ownedResources.Add(owner, api);

			Register();

			return api;
		}

		function Service (name, definition) {
			if (!Runtime.HasDOM)
				throw new Error('Elemenx.ServiceWorker is only available in a page runtime');

			if (arguments.length === 2) definition = registerDefinition(name, definition);
			else definition = definitions[name];

			if (!definition)
				throw new Error('Elemenx ServiceWorker not found: ' + name);

			return createHandle(name, definition);
		}

		function DestroyOwner (owner) {
			ownedResources.Destroy(owner);
		}

		Elemenx.ServiceWorker = Service;

		Runtime.ServiceWorkerFor = function (owner) {
			return function (name, definition) {
				if (ownedResources.Destroyed(owner))
					throw new Error('Elemenx ServiceWorker owner is destroyed');

				if (arguments.length === 2) definition = registerDefinition(name, definition);
				else definition = definitions[name];

				if (!definition)
					throw new Error('Elemenx ServiceWorker not found: ' + name);

				return createHandle(name, definition, owner);
			};
		};

		Runtime.DestroyServiceWorkerOwner = DestroyOwner;

	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Hardware */
	(function (global) {
		'use strict';

		/*
		 * Elemenx.Hardware: devices joined to the computer, through the browser. Every method takes callback(error, result);
		 * error.name is the name of the browser error ('NotFoundError' when the user picks none, 'NotSupportedError' when
		 * the browser has no way to them). $Hardware of a Service, a Component or an Application is the same, its own: the
		 * ports and the devices it opened are closed and its listeners forgotten when it is destroyed.
		 * - Serial: serial ports (COM ports, UART: boards, GPS, scales, printers...) through Web Serial (Chrome and Edge on the
		 *   desktop, HTTPS or localhost). Supported(); Request({Filters: [{VendorID, ProductID}]}, callback): the user picks a
		 *   port (from a press: the browser asks for a gesture); Ports(callback): those the user already allowed; On and Off
		 *   ('connect' or 'disconnect', callback): a port joins or leaves ({Port}). A port: Info {VendorID, ProductID};
		 *   Open({BaudRate (9600), DataBits, StopBits, Parity, FlowControl, Text}, callback) opens it and starts reading: the
		 *   data event carries what comes (a text with Text: true, the default, or a Uint8Array), the line event each line of
		 *   text; Write(data, callback) sends a text or bytes; Signals({DTR, RTS, Break}, callback); Close(callback); On(name,
		 *   callback) and Off for data, line, error and close; Opened(); Native, the port of the browser.
		 * - USB: devices with a driver of their own through WebUSB (not those the system keeps: keyboards, disks). Supported();
		 *   Request({Filters: [{VendorID, ProductID, ClassCode}]}, callback); Devices(callback); On and Off ('connect' or
		 *   'disconnect', callback) ({Device}). A device: Info {VendorID, ProductID, Name, Manufacturer, Serial};
		 *   Open({Configuration (1), Interface (0)}, callback) opens it and claims the interface; TransferIn(endpoint,
		 *   length, callback) reads (a Uint8Array); TransferOut(endpoint, data, callback) writes a text or bytes (the count
		 *   written); Control({Type, Recipient, Request, Value, Index}, data or length, callback): a control transfer, in with
		 *   a length, out with data; Close(callback); Opened(); Native.
		 * - Firmware: programs written on the flash of a board, by protocols (Define(name, {Flash, Detect, Read}), Names();
		 *   esp, the ROM loader of the ESP32 family: ESP32, ESP32-S3, ESP32-C3, Chips()). Flash(port, parts [{Offset, Bytes}],
		 *   {Protocol (esp), Baud (460800), Erase (true: the whole flash first), Verify (false: no MD5 checked), Reset (false:
		 *   the board left in its loader), Flash {Size (4MB...), Mode (qio, qout, dio, dout), Frequency (80m, 40m...): the
		 *   header of the bootloader set so}, Partitions (the table the parts are checked by, else theirs at 0x8000), Progress
		 *   ({Stage: connect, erase, write, verify, done; Done, Total bytes})}, callback(error, {Chip, Written, Parts [{Offset,
		 *   Size, MD5}]})) gives {Cancel()} (an AbortError); parts over each other, past the flash or an app longer than its
		 *   partition are a DataError before the board is touched. Detect(port, options, callback) tells the chip ({Chip,
		 *   Family, Bootloader}); Read(port, offset, length, options, callback) reads its flash (a Uint8Array). Parts(files
		 *   [{Name, Bytes}], chip): a build of arduino-cli at its offsets (a merged image at 0); Manifest(manifest, chip,
		 *   read(path, callback), callback): the parts of a manifest of ESP Web Tools; Patch(image, {Chip, Mode, Frequency,
		 *   Size}): an image of a bootloader set for a flash (its SHA-256 made again); Digest(bytes, md5 or sha256).
		 *   Partitions: the table of an ESP32 (ESP-IDF) at 0x8000 (Offset): Parse(bytes or CSV text) gives [{Name, Type,
		 *   SubType, Offset, Size, Flags}], Make(list) its bytes (with its MD5), CSV(list) its text, Check(list, flash bytes)
		 *   what is wrong with it ([{Partition, Text}]), Preset(name) and Presets(): the tables of Arduino (default, huge_app,
		 *   min_spiffs, no_ota).
		 * One handle for each port and each device of the browser, whoever asks for it: its state and its listeners stay.
		 */
		var owned = Runtime.OwnerRegistry();
		var handles = {serial: [], usb: []};
		/* The listeners of connect and disconnect: [{Owner, Callback}] by kind and name, and the browser object they hear. */
		var heard = {serial: {connect: [], disconnect: [], Target: null}, usb: {connect: [], disconnect: [], Target: null}};

		function fail (name, message) {
			var error = new Error(message);

			error.name = name;

			return error;
		}

		function api (kind) {
			return global.navigator && global.navigator[kind] ? global.navigator[kind] : null;
		}

		function noop () {}

		/* The connect and disconnect events of the browser heard once, of the object it has now (a test may give another). */
		function hear (kind) {
			var target = api(kind);
			var state = heard[kind];
			if (!target || state.Target === target) return;

			if (state.Target) {
				state.Target.removeEventListener('connect', state.Changed);
				state.Target.removeEventListener('disconnect', state.Changed);
			}

			state.Target = target;
			state.Changed = function (event) {
				var native = kind === 'serial' ? event.target && event.target !== target ? event.target : event.port : event.device;
				var made = kind === 'serial' ? {Port: serialPort(native)} : {Device: usbDevice(native)};

				state[event.type].slice().forEach(function (entry) {
					Runtime.Notify(entry.Callback, null, [made]);
				});
			};

			target.addEventListener('connect', state.Changed);
			target.addEventListener('disconnect', state.Changed);
		}

		function on (kind, owner, name, callback) {
			var list = heard[kind][name];
			var entry;

			if (!list || typeof callback !== 'function') return;

			hear(kind);

			entry = {Owner: owner, Callback: callback};
			entry.Destroy = function () {
				var index = list.indexOf(entry);
				if (index !== -1)
					list.splice(index, 1);

				owned.Remove(owner, entry);
			};

			list.push(entry);

			owned.Add(owner, entry);
		}

		function off (kind, owner, name, callback) {
			(heard[kind][name] || []).filter(function (entry) {
				return entry.Owner === owner && entry.Callback === callback;
			}).forEach(function (entry) {
				entry.Destroy();
			});
		}

		/* What a handle opened for an owner: closed with it. */
		function hold (owner, handle) {
			var entry = {Handle: handle};

			if (!owner) return;

			entry.Destroy = function () {
				owned.Remove(owner, entry);

				if (handle.Opened())
					handle.Close(noop);
			};

			handle.Holders.push({Owner: owner, Entry: entry});

			owned.Add(owner, entry);
		}

		function release (handle) {
			handle.Holders.splice(0).forEach(function (holder) {
				owned.Remove(holder.Owner, holder.Entry);
			});
		}

		function known (kind, native) {
			var found = handles[kind].filter(function (entry) {
				return entry.Native === native;
			})[0];

			return found ? found.Handle : null;
		}

		function bytesOf (data) {
			return typeof data === 'string' ? new TextEncoder().encode(data) : data;
		}

		/* Hardware: Serial */
		function serialPort (port) {
			var made = known('serial', port);
			var info = port.getInfo ? port.getInfo() : {};
			var listeners = {data: [], line: [], error: [], close: []};
			var state = {Open: false, Reader: null, Text: true, Rest: ''};
			var decoder = typeof TextDecoder === 'function' ? new TextDecoder() : null;
			var handle;

			if (made)
				return made;

			function emit (name, value) {
				listeners[name].slice().forEach(function (callback) {
					Runtime.Notify(callback, null, [value]);
				});
			}

			function read () {
				var reader = port.readable && port.readable.getReader();
				if (!reader) return;

				state.Reader = reader;

				(function next () {
					reader.read().then(function (result) {
						var text;
						var lines;

						if (result.done) {
							reader.releaseLock();

							state.Reader = null;

							return;
						}

						if (state.Text && decoder) {
							text = decoder.decode(result.value, {stream: true});
							lines = (state.Rest + text).split(/\r?\n/);

							state.Rest = lines.pop();

							emit('data', text);

							lines.forEach(function (line) {
								emit('line', line);
							});
						}
						else {
							emit('data', result.value);
						}

						next();
					}, function (error) {
						state.Reader = null;

						emit('error', error);
					});
				})();
			}

			handle = {
				Info: {VendorID: info.usbVendorId == null ? null : info.usbVendorId, ProductID: info.usbProductId == null ? null : info.usbProductId},
				Native: port,
				Holders: [],
				Opened: function () {
					return state.Open;
				},
				Open: function (options, callback) {
					var given = options || {};
					var done = callback || noop;

					state.Text = given.Text !== false;
					state.Rest = '';

					port.open({baudRate: Number(given.BaudRate) || 9600, dataBits: given.DataBits || 8, stopBits: given.StopBits || 1, parity: given.Parity || 'none', flowControl: given.FlowControl || 'none'}).then(function () {
						state.Open = true;

						hold(handle.Owner, handle);

						read();

						done(null, handle);
					}, done);
				},
				Write: function (data, callback) {
					var done = callback || noop;
					var bytes = bytesOf(data);
					var writer;

					if (!state.Open || !port.writable) {
						done(new Error('Elemenx Serial: the port is not open'));

						return;
					}

					writer = port.writable.getWriter();

					writer.write(bytes).then(function () {
						writer.releaseLock();

						done(null, bytes.length);
					}, function (error) {
						writer.releaseLock();

						done(error);
					});
				},
				Signals: function (signals, callback) {
					var given = signals || {};
					var done = callback || noop;
					var value = {};

					if (given.DTR != null)
						value.dataTerminalReady = !!given.DTR;

					if (given.RTS != null)
						value.requestToSend = !!given.RTS;

					if (given.Break != null)
						value.break = !!given.Break;

					port.setSignals(value).then(function () {
						done(null, true);
					}, done);
				},
				Close: function (callback) {
					var done = callback || noop;
					var reader = state.Reader;

					/* Its reading stopped first: a port that is read is not let close. */
					function shut () {
						port.close().then(function () {
							state.Open = false;

							release(handle);

							emit('close', handle);

							done(null, true);
						}, done);
					}

					if (reader) reader.cancel().then(shut, shut);
					else shut();
				},
				On: function (name, callback) {
					if (listeners[name])
						listeners[name].push(callback);
				},
				Off: function (name, callback) {
					if (listeners[name]) {
						listeners[name] = listeners[name].filter(function (item) {
							return item !== callback;
						});
					}
				}
			};

			handles.serial.push({Native: port, Handle: handle});

			return handle;
		}

		/* Hardware: USB */
		function usbDevice (device) {
			var made = known('usb', device);
			var claimed = null;
			var handle;

			if (made)
				return made;

			function setup (options) {
				return {requestType: options.Type || 'vendor', recipient: options.Recipient || 'device', request: Number(options.Request) || 0, value: Number(options.Value) || 0, index: Number(options.Index) || 0};
			}

			handle = {
				Info: {VendorID: device.vendorId, ProductID: device.productId, Name: device.productName || '', Manufacturer: device.manufacturerName || '', Serial: device.serialNumber || ''},
				Native: device,
				Holders: [],
				Opened: function () {
					return !!device.opened;
				},
				Open: function (options, callback) {
					var given = options || {};
					var done = callback || noop;

					device.open().then(function () {
						if (device.configuration === null)
							return device.selectConfiguration(given.Configuration == null ? 1 : Number(given.Configuration));
					}).then(function () {
						claimed = given.Interface == null ? 0 : Number(given.Interface);

						return device.claimInterface(claimed);
					}).then(function () {
						hold(handle.Owner, handle);

						done(null, handle);
					}, done);
				},
				TransferIn: function (endpoint, length, callback) {
					device.transferIn(Number(endpoint), Number(length) || 64).then(function (result) {
						callback(null, result.data ? new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength) : new Uint8Array(0));
					}, callback);
				},
				TransferOut: function (endpoint, data, callback) {
					var done = callback || noop;

					device.transferOut(Number(endpoint), bytesOf(data)).then(function (result) {
						done(null, result.bytesWritten);
					}, done);
				},
				Control: function (options, data, callback) {
					var done = callback || noop;
					var call = typeof data === 'number' ? device.controlTransferIn(setup(options || {}), data) : device.controlTransferOut(setup(options || {}), data == null ? undefined : bytesOf(data));

					call.then(function (result) {
						done(null, result.data ? new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength) : result.bytesWritten);
					}, done);
				},
				Close: function (callback) {
					var done = callback || noop;

					/* Its interface let go first (a failure to is no matter: closing lets it go too). */
					function shut () {
						device.close().then(function () {
							claimed = null;

							release(handle);

							done(null, true);
						}, done);
					}

					if (claimed === null) shut();
					else device.releaseInterface(claimed).then(shut, shut);
				}
			};

			handles.usb.push({Native: device, Handle: handle});

			return handle;
		}

		/* Hardware: Digests */

		/* MD5 of bytes (RFC 1321): 16 bytes. What a loader tells of what it wrote, and the sum of a partition table. */
		function md5 (bytes) {
			var shifts = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
			var table = [];
			var length = bytes.length;
			var padded = new Uint8Array(((length + 8) >> 6) + 1 << 6);
			var words = new Uint32Array(padded.length >> 2);
			var state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
			var out = new Uint8Array(16);
			var i;
			var j;

			for (i = 0; i < 64; i++)
				table[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;

			padded.set(bytes);

			padded[length] = 0x80;

			for (i = 0; i < words.length; i++)
				words[i] = padded[i * 4] | padded[i * 4 + 1] << 8 | padded[i * 4 + 2] << 16 | padded[i * 4 + 3] << 24;

			words[words.length - 2] = length << 3 >>> 0;
			words[words.length - 1] = Math.floor(length / 536870912);

			for (i = 0; i < words.length; i += 16) {
				var a = state[0];
				var b = state[1];
				var c = state[2];
				var d = state[3];

				for (j = 0; j < 64; j++) {
					var f;
					var g;
					var turn;

					if (j < 16) {
						f = b & c | ~b & d;
						g = j;
					}
					else if (j < 32) {
						f = d & b | ~d & c;
						g = (5 * j + 1) % 16;
					}
					else if (j < 48) {
						f = b ^ c ^ d;
						g = (3 * j + 5) % 16;
					}
					else {
						f = c ^ (b | ~d);
						g = 7 * j % 16;
					}

					turn = a + f + table[j] + words[i + g] >>> 0;
					a = d;
					d = c;
					c = b;
					b = b + (turn << shifts[j] | turn >>> 32 - shifts[j]) >>> 0;
				}

				state[0] = state[0] + a >>> 0;
				state[1] = state[1] + b >>> 0;
				state[2] = state[2] + c >>> 0;
				state[3] = state[3] + d >>> 0;
			}

			for (i = 0; i < 16; i++)
				out[i] = state[i >> 2] >>> (i % 4) * 8 & 255;

			return out;
		}

		/* SHA-256 of bytes (FIPS 180-4): 32 bytes. What an image of an ESP32 carries at its end, made again when its header changes. */
		function sha256 (bytes) {
			var k = [];
			var h = [];
			var length = bytes.length;
			var padded = new Uint8Array(((length + 8) >> 6) + 1 << 6);
			var w = new Uint32Array(64);
			var out = new Uint8Array(32);
			var primes = [];
			var n = 2;
			var i;
			var j;

			while (primes.length < 64) {
				var prime = true;

				for (j = 0; j < primes.length && primes[j] * primes[j] <= n; j++) {
					if (n % primes[j] === 0) {
						prime = false;

						break;
					}
				}

				if (prime)
					primes.push(n);

				n++;
			}

			for (i = 0; i < 64; i++) {
				k[i] = (Math.pow(primes[i], 1 / 3) % 1) * 4294967296 >>> 0;

				if (i < 8)
					h[i] = (Math.pow(primes[i], 1 / 2) % 1) * 4294967296 >>> 0;
			}

			padded.set(bytes);

			padded[length] = 0x80;
			padded[padded.length - 4] = length >>> 21 & 255;
			padded[padded.length - 3] = length >>> 13 & 255;
			padded[padded.length - 2] = length >>> 5 & 255;
			padded[padded.length - 1] = length << 3 & 255;
			padded[padded.length - 5] = Math.floor(length / 536870912) & 255;

			function rotate (x, by) {
				return x >>> by | x << 32 - by;
			}

			for (i = 0; i < padded.length; i += 64) {
				var v = h.slice();

				for (j = 0; j < 64; j++) {
					if (j < 16) {
						w[j] = (padded[i + j * 4] << 24 | padded[i + j * 4 + 1] << 16 | padded[i + j * 4 + 2] << 8 | padded[i + j * 4 + 3]) >>> 0;
					}
					else {
						w[j] = (rotate(w[j - 2], 17) ^ rotate(w[j - 2], 19) ^ w[j - 2] >>> 10) + w[j - 7] + (rotate(w[j - 15], 7) ^ rotate(w[j - 15], 18) ^ w[j - 15] >>> 3) + w[j - 16] >>> 0;
					}

					var t1 = v[7] + (rotate(v[4], 6) ^ rotate(v[4], 11) ^ rotate(v[4], 25)) + (v[4] & v[5] ^ ~v[4] & v[6]) + k[j] + w[j] >>> 0;
					var t2 = (rotate(v[0], 2) ^ rotate(v[0], 13) ^ rotate(v[0], 22)) + (v[0] & v[1] ^ v[0] & v[2] ^ v[1] & v[2]) >>> 0;

					v[7] = v[6];
					v[6] = v[5];
					v[5] = v[4];
					v[4] = v[3] + t1 >>> 0;
					v[3] = v[2];
					v[2] = v[1];
					v[1] = v[0];
					v[0] = t1 + t2 >>> 0;
				}

				for (j = 0; j < 8; j++)
					h[j] = h[j] + v[j] >>> 0;
			}

			for (i = 0; i < 32; i++)
				out[i] = h[i >> 2] >>> 24 - (i % 4) * 8 & 255;

			return out;
		}

		function hex (bytes) {
			var text = '';
			var i;

			for (i = 0; i < bytes.length; i++)
				text += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);

			return text;
		}

		/* Hardware: Partitions */

		/*
		 * The partition table of an ESP32 (ESP-IDF): 32 bytes an entry (magic AA 50, type, subtype, offset, size, a label of
		 * 16 bytes, flags), then an entry of its MD5 (EB EB, 14 bytes FF, the MD5 of the entries), FF to 0xC00; at 0x8000 of
		 * the flash. A partition: {Name, Type (app, data or a number), SubType (factory, ota_0..ota_15, test; ota, phy, nvs,
		 * coredump, nvs_keys, efuse, undefined, fat, spiffs, littlefs; or a number), Offset, Size, Flags (encrypted,
		 * readonly)}.
		 */
		var TableOffset = 0x8000;
		var TableSize = 0xC00;
		var PartitionTypes = {app: 0x00, data: 0x01};
		var AppTypes = {factory: 0x00, test: 0x20};
		var DataTypes = {ota: 0x00, phy: 0x01, nvs: 0x02, coredump: 0x03, nvs_keys: 0x04, efuse: 0x05, undefined: 0x06, esphttpd: 0x80, fat: 0x81, spiffs: 0x82, littlefs: 0x83};
		var ota;

		for (ota = 0; ota < 16; ota++)
			AppTypes['ota_' + ota] = 0x10 + ota;

		/* The tables of the boards of Arduino of 4 MB: what arduino-cli lays by its partition scheme. */
		var PartitionPresets = {
			'default': [['nvs', 'data', 'nvs', 0x9000, 0x5000], ['otadata', 'data', 'ota', 0xe000, 0x2000], ['app0', 'app', 'ota_0', 0x10000, 0x140000], ['app1', 'app', 'ota_1', 0x150000, 0x140000], ['spiffs', 'data', 'spiffs', 0x290000, 0x160000], ['coredump', 'data', 'coredump', 0x3F0000, 0x10000]],
			'huge_app': [['nvs', 'data', 'nvs', 0x9000, 0x5000], ['otadata', 'data', 'ota', 0xe000, 0x2000], ['app0', 'app', 'ota_0', 0x10000, 0x300000], ['spiffs', 'data', 'spiffs', 0x310000, 0xE0000], ['coredump', 'data', 'coredump', 0x3F0000, 0x10000]],
			'min_spiffs': [['nvs', 'data', 'nvs', 0x9000, 0x5000], ['otadata', 'data', 'ota', 0xe000, 0x2000], ['app0', 'app', 'ota_0', 0x10000, 0x1E0000], ['app1', 'app', 'ota_1', 0x1F0000, 0x1E0000], ['spiffs', 'data', 'spiffs', 0x3D0000, 0x20000], ['coredump', 'data', 'coredump', 0x3F0000, 0x10000]],
			'no_ota': [['nvs', 'data', 'nvs', 0x9000, 0x5000], ['otadata', 'data', 'ota', 0xe000, 0x2000], ['app0', 'app', 'ota_0', 0x10000, 0x200000], ['spiffs', 'data', 'spiffs', 0x210000, 0x1E0000], ['coredump', 'data', 'coredump', 0x3F0000, 0x10000]]
		};

		function nameOf (table, code) {
			var found = Object.keys(table).filter(function (key) {
				return table[key] === code;
			})[0];

			return found === undefined ? code : found;
		}

		function codeOf (table, value) {
			if (typeof value === 'number') return value;
			if (table[String(value).trim()] !== undefined) return table[String(value).trim()];

			return parseNumber(value);
		}

		/* A number of a table of partitions: decimal, 0x hex, with K or M. */
		function parseNumber (value) {
			var text = String(value === undefined || value === null ? '' : value).trim();
			var scale = 1;
			var made;

			if (!text)
				return Number.NaN;

			if (/[kK]$/.test(text)) {
				scale = 1024;
				text = text.slice(0, -1);
			}
			else if (/[mM]$/.test(text)) {
				scale = 1024 * 1024;
				text = text.slice(0, -1);
			}

			made = /^0x/i.test(text) ? parseInt(text, 16) : Number(text);

			return made * scale;
		}

		function partition (name, type, subtype, offset, size, flags) {
			var kind = typeof type === 'number' ? nameOf(PartitionTypes, type) : String(type).trim();
			var sub = typeof subtype === 'number' ? nameOf(kind === 'app' ? AppTypes : DataTypes, subtype) : String(subtype).trim();

			return {Name: String(name).trim(), Type: kind, SubType: sub, Offset: offset, Size: size, Flags: flags || []};
		}

		/* A table from its bytes (a partitions.bin, or a whole flash from 0x8000 on) or from its text (a CSV of ESP-IDF). */
		function parsePartitions (source) {
			if (typeof source === 'string') return parseCSV(source);

			var bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
			var list = [];
			var at;

			for (at = 0; at + 32 <= bytes.length; at += 32) {
				var view = new DataView(bytes.buffer, bytes.byteOffset + at, 32);
				var label = '';
				var c;

				if (bytes[at] !== 0xAA || bytes[at + 1] !== 0x50) break;

				for (c = 12; c < 28 && bytes[at + c]; c++)
					label += String.fromCharCode(bytes[at + c]);

				var flags = view.getUint32(28, true);

				list.push(partition(label, bytes[at + 2], bytes[at + 3], view.getUint32(4, true), view.getUint32(8, true), (flags & 1 ? ['encrypted'] : []).concat(flags & 2 ? ['readonly'] : [])));
			}

			return list;
		}

		/* A CSV of ESP-IDF: Name, Type, SubType, Offset, Size, Flags; an offset left out comes after the one before (apps on 64 KB). */
		function parseCSV (text) {
			var list = [];
			var next = TableOffset + 0x1000;

			text.split(/\r?\n/).forEach(function (line) {
				var cells = line.replace(/#.*$/, '').split(',').map(function (cell) {
					return cell.trim();
				});
				var kind;
				var offset;
				var size;

				if (cells.length < 5 || !cells[0]) return;

				kind = cells[1];
				offset = cells[3] ? parseNumber(cells[3]) : kind === 'app' ? Math.ceil(next / 0x10000) * 0x10000 : Math.ceil(next / 0x1000) * 0x1000;
				size = parseNumber(cells[4]);

				list.push(partition(cells[0], kind, /^\d|^0x/i.test(cells[2]) ? parseNumber(cells[2]) : cells[2], offset, size, cells[5] ? cells[5].split(/[:\s]+/).filter(function (flag) {
					return !!flag;
				}) : []));

				next = offset + size;
			});

			return list;
		}

		function toCSV (list) {
			return ['# Name, Type, SubType, Offset, Size, Flags'].concat(list.map(function (one) {
				return [one.Name, one.Type, one.SubType, '0x' + one.Offset.toString(16), '0x' + one.Size.toString(16), (one.Flags || []).join(':')].join(', ');
			})).join('\n') + '\n';
		}

		/* The bytes of a table: its entries, the entry of their MD5, FF to its end (0xC00). */
		function makePartitions (list) {
			var bytes = new Uint8Array(TableSize);
			var view = new DataView(bytes.buffer);
			var at = 0;

			bytes.fill(0xFF);

			list.forEach(function (one) {
				var kind = codeOf(PartitionTypes, one.Type);
				var c;

				bytes[at] = 0xAA;
				bytes[at + 1] = 0x50;
				bytes[at + 2] = kind;
				bytes[at + 3] = codeOf(kind === 0 ? AppTypes : DataTypes, one.SubType);

				view.setUint32(at + 4, one.Offset, true);
				view.setUint32(at + 8, one.Size, true);

				for (c = 0; c < 16; c++)
					bytes[at + 12 + c] = c < one.Name.length ? one.Name.charCodeAt(c) & 255 : 0;

				view.setUint32(at + 28, ((one.Flags || []).indexOf('encrypted') !== -1 ? 1 : 0) | ((one.Flags || []).indexOf('readonly') !== -1 ? 2 : 0), true);

				at += 32;
			});

			bytes[at] = 0xEB;
			bytes[at + 1] = 0xEB;

			bytes.set(md5(bytes.subarray(0, at)), at + 16);

			return bytes;
		}

		/*
		 * What is wrong with a table on a flash of so many bytes: [{Partition (its index, -1 the table), Text}], [] when
		 * nothing. Its partitions inside the flash, past the table, not over each other, apps on 64 KB and the rest on 4 KB,
		 * names of 15 characters at most and each its own, an app at least, the slots of updates with their otadata.
		 */
		function checkPartitions (list, flash) {
			var found = [];
			var size = Number(flash) || 0;
			var names = {};
			var apps = 0;
			var slots = 0;
			var otadata = false;

			if (list.length > 95)
				found.push({Partition: -1, Text: 'more than 95 partitions'});

			list.forEach(function (one, index) {
				var kind = codeOf(PartitionTypes, one.Type);
				var sub = codeOf(kind === 0 ? AppTypes : DataTypes, one.SubType);

				if (!one.Name || one.Name.length > 15)
					found.push({Partition: index, Text: 'its name is empty or longer than 15 characters'});

				if (names[one.Name])
					found.push({Partition: index, Text: 'its name is that of another'});

				if (!(kind >= 0 && kind <= 254))
					found.push({Partition: index, Text: 'its type is none of app, data or a number'});

				if (!(sub >= 0 && sub <= 254))
					found.push({Partition: index, Text: 'its subtype is not known'});

				if (!(one.Size > 0))
					found.push({Partition: index, Text: 'it has no size'});

				if (one.Offset < TableOffset + 0x1000)
					found.push({Partition: index, Text: 'it begins before the end of the table (0x9000)'});

				if (kind === 0 && one.Offset % 0x10000)
					found.push({Partition: index, Text: 'an app begins on 64 KB'});

				if (kind !== 0 && one.Offset % 0x1000)
					found.push({Partition: index, Text: 'it begins on 4 KB'});

				if (size && one.Offset + one.Size > size)
					found.push({Partition: index, Text: 'it goes past the end of the flash'});

				names[one.Name] = true;

				if (kind === 0)
					apps++;

				if (kind === 0 && sub >= 0x10 && sub < 0x20)
					slots++;

				if (kind === 1 && sub === 0)
					otadata = true;

				list.forEach(function (other, at) {
					if (at > index && one.Offset < other.Offset + other.Size && other.Offset < one.Offset + one.Size)
						found.push({Partition: index, Text: 'it lies over ' + other.Name});
				});
			});

			if (!apps)
				found.push({Partition: -1, Text: 'it has no app'});

			if (slots && !otadata)
				found.push({Partition: -1, Text: 'its slots of updates have no otadata'});

			return found;
		}

		var Partitions = {
			Parse: parsePartitions,
			Make: makePartitions,
			Check: checkPartitions,
			CSV: toCSV,
			Preset: function (name) {
				var preset = PartitionPresets[name];

				return preset ? preset.map(function (row) {
					return partition(row[0], row[1], row[2], row[3], row[4]);
				}) : null;
			},
			Presets: function () {
				return Object.keys(PartitionPresets);
			},
			Offset: TableOffset
		};

		/* Hardware: Firmware */

		/*
		 * The chips a protocol knows, as data: {Name, Family (of a manifest of ESP Web Tools), Magic (the values of the register
		 * a loader tells it by), ID (of GET_SECURITY_INFO), Bootloader (its offset), Encrypted (its FLASH_BEGIN takes the flag),
		 * Sizes and Frequencies (the codes of the header of an image)}.
		 */
		var Sizes = {'1MB': 0x00, '2MB': 0x10, '4MB': 0x20, '8MB': 0x30, '16MB': 0x40, '32MB': 0x50, '64MB': 0x60, '128MB': 0x70};
		var Chips = [
			{Name: 'ESP32', Family: 'ESP32', Magic: [0x00f01d83], ID: 0, Bootloader: 0x1000, Encrypted: false, Frequencies: {'40m': 0x0, '26m': 0x1, '20m': 0x2, '80m': 0xf}},
			{Name: 'ESP32-S3', Family: 'ESP32-S3', Magic: [0x9], ID: 9, Bootloader: 0x0, Encrypted: true, Frequencies: {'80m': 0xf, '40m': 0x0, '26m': 0x1, '20m': 0x2}},
			{Name: 'ESP32-C3', Family: 'ESP32-C3', Magic: [0x6921506f, 0x1b31506f, 0x4881606f, 0x4361606f], ID: 5, Bootloader: 0x0, Encrypted: true, Frequencies: {'80m': 0xf, '40m': 0x0, '26m': 0x1, '20m': 0x2}}
		];
		var Modes = {qio: 0, qout: 1, dio: 2, dout: 3};
		var protocols = {};

		function chipOf (name) {
			return Chips.filter(function (chip) {
				return chip.Name === name || chip.Family === name;
			})[0] || null;
		}

		function bytesOfSize (text) {
			var match = /^(\d+)MB$/.exec(String(text || ''));

			return match ? Number(match[1]) * 1024 * 1024 : 0;
		}

		/*
		 * The header of an image of a bootloader set for a flash ({Chip, Mode, Frequency, Size}, each 'keep' or left out: as it
		 * is): a copy; the SHA-256 at its end made again when it has one (byte 23).
		 */
		function patchImage (image, flash) {
			var given = flash || {};
			var chip = chipOf(given.Chip) || Chips[0];
			var bytes = new Uint8Array(image);
			var mode = Modes[given.Mode];
			var size = Sizes[given.Size];
			var frequency = chip.Frequencies[given.Frequency];
			var at;
			var count;
			var s;

			if (bytes.length < 24 || bytes[0] !== 0xE9) return bytes;

			if (mode !== undefined)
				bytes[2] = mode;

			if (size !== undefined)
				bytes[3] = bytes[3] & 0x0F | size;

			if (frequency !== undefined)
				bytes[3] = bytes[3] & 0xF0 | frequency;

			if (bytes[23] !== 1) return bytes;

			/* Its end: its segments, then to 16 bytes with its checksum last; its SHA-256 after. */
			count = bytes[1];
			at = 24;

			for (s = 0; s < count && at + 8 <= bytes.length; s++)
				at += 8 + (bytes[at + 4] | bytes[at + 5] << 8 | bytes[at + 6] << 16 | bytes[at + 7] << 24);

			at += 16 - at % 16;

			if (at + 32 <= bytes.length)
				bytes.set(sha256(bytes.subarray(0, at)), at);

			return bytes;
		}

		/*
		 * The parts of a build of arduino-cli ([{Name, Bytes}]: its files) at their offsets for a chip: a merged image at 0, the
		 * bootloader at that of the chip, the partitions at 0x8000, boot_app0 at 0xe000, the app at 0x10000.
		 */
		function partsOf (files, chipName) {
			var chip = chipOf(chipName) || Chips[0];
			var merged = (files || []).filter(function (file) {
				return /merged\.bin$/i.test(file.Name);
			})[0];
			var parts = [];

			if (merged)
				return [{Offset: 0, Bytes: merged.Bytes, Name: merged.Name}];

			(files || []).forEach(function (file) {
				var name = String(file.Name);
				var offset = /bootloader\.bin$/i.test(name) ? chip.Bootloader : /partitions\.bin$/i.test(name) ? TableOffset : /boot_app0\.bin$/i.test(name) ? 0xe000 : /\.bin$/i.test(name) ? 0x10000 : -1;
				if (offset >= 0)
					parts.push({Offset: offset, Bytes: file.Bytes, Name: name});
			});

			return parts.sort(function (a, b) {
				return a.Offset - b.Offset;
			});
		}

		/*
		 * A manifest of ESP Web Tools ({builds: [{chipFamily, parts: [{path, offset}]}]}): the parts of its build for a chip,
		 * each read by read(path, callback(error, bytes)).
		 */
		function manifestParts (manifest, chipName, read, callback) {
			var chip = chipOf(chipName);
			var build = ((manifest || {}).builds || []).filter(function (one) {
				return chip && one.chipFamily === chip.Family;
			})[0];
			var parts = [];
			var left;

			if (!build) {
				callback(fail('NotFoundError', 'Elemenx Firmware: the manifest has no build for ' + chipName));

				return;
			}

			left = build.parts.length;

			if (!left) {
				callback(null, []);

				return;
			}

			build.parts.forEach(function (part, index) {
				read(part.path, function (error, bytes) {
					if (left <= 0) return;

					if (error) {
						left = 0;

						callback(error);

						return;
					}

					parts[index] = {Offset: Number(part.offset), Bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), Name: part.path};

					if (--left === 0)
						callback(null, parts);
				});
			});
		}

		/*
		 * What is wrong with parts before they are written on a flash of so many bytes, with a table (theirs at 0x8000, or
		 * given): over each other, past the flash, an app longer than its partition. A DataError with them all, or null.
		 */
		function checkParts (parts, size, table) {
			var problems = [];
			var list = table || null;

			parts.forEach(function (part, index) {
				if (part.Offset === TableOffset && !list)
					list = parsePartitions(part.Bytes);

				if (size && part.Offset + part.Bytes.length > size)
					problems.push('the part at 0x' + part.Offset.toString(16) + ' goes past the end of the flash');

				parts.forEach(function (other, at) {
					if (at > index && part.Offset < other.Offset + other.Bytes.length && other.Offset < part.Offset + part.Bytes.length)
						problems.push('the parts at 0x' + part.Offset.toString(16) + ' and 0x' + other.Offset.toString(16) + ' lie over each other');
				});
			});

			(list || []).forEach(function (one) {
				parts.forEach(function (part) {
					if (codeOf(PartitionTypes, one.Type) === 0 && part.Offset === one.Offset && part.Bytes.length > one.Size)
						problems.push('the app (' + part.Bytes.length + ' bytes) is longer than its partition ' + one.Name + ' (' + one.Size + ' bytes)');
				});
			});

			return problems.length ? fail('DataError', 'Elemenx Firmware: ' + problems.join('; ')) : null;
		}

		/* The facade of Firmware of an owner: what it flashes is let go (cancelled) when it is destroyed. */
		function createFirmware (owner) {
			function run (kind, port, args, options, callback) {
				var given = options || {};
				var name = given.Protocol || 'esp';
				var protocol = protocols[name];
				var entry = {};
				var job;

				if (!protocol || typeof protocol[kind] !== 'function') {
					callback(fail('NotSupportedError', 'Elemenx Firmware: no protocol ' + name + ' that can ' + kind));

					return {Cancel: noop};
				}

				entry.Destroy = function () {
					owned.Remove(owner, entry);

					if (job)
						job.Cancel();
				};

				if (owner)
					owned.Add(owner, entry);

				job = protocol[kind].apply(null, [port].concat(args, [given, function (error, result) {
					if (owner)
						owned.Remove(owner, entry);

					callback(error || null, result);
				}])) || {Cancel: noop};

				return job;
			}

			return {
				Define: function (name, protocol) {
					protocols[String(name)] = protocol;

					return protocol;
				},
				Names: function () {
					return Object.keys(protocols);
				},
				/* Parts [{Offset, Bytes}] written on the flash of the board of a port; {Cancel()} stops it (an AbortError). */
				Flash: function (port, parts, options, callback) {
					var given = options || {};
					var list = (parts || []).map(function (part) {
						return {Offset: Number(part.Offset) || 0, Bytes: part.Bytes instanceof Uint8Array ? part.Bytes : new Uint8Array(part.Bytes), Name: part.Name || ''};
					}).sort(function (a, b) {
						return a.Offset - b.Offset;
					});
					var wrong = checkParts(list, bytesOfSize(given.Flash && given.Flash.Size), given.Partitions || null);

					if (wrong) {
						callback(wrong);

						return {Cancel: noop};
					}

					return run('Flash', port, [list], given, callback);
				},
				Detect: function (port, options, callback) {
					return run('Detect', port, [], options, callback);
				},
				Read: function (port, offset, length, options, callback) {
					return run('Read', port, [offset, length], options, callback);
				},
				Parts: partsOf,
				Manifest: manifestParts,
				Patch: patchImage,
				Partitions: Partitions,
				Chips: function () {
					return JSON.parse(JSON.stringify(Chips));
				},
				Digest: function (bytes, kind) {
					var data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

					return kind === 'sha256' ? sha256(data) : md5(data);
				}
			};
		}

		/* Hardware: Firmware esp */

		/*
		 * The ROM loader of the ESP32 family over a serial port: no program of its own sent first (the stub of esptool), so no
		 * compression. Reset into it by DTR and RTS (the classic circuit of a board, or the USB-JTAG-Serial of S3 and C3),
		 * SLIP frames, sync, the chip told, a faster speed, SPI attached and its size set, the flash erased (all of it with
		 * Erase), each part written in blocks of 1 KB and its MD5 checked, the board reset to run it.
		 */
		var Esp = {
			Sync: 0x08, ReadReg: 0x0a, Begin: 0x02, Data: 0x03, End: 0x04, Attach: 0x0d, Params: 0x0b, Baud: 0x0f, Md5: 0x13, ReadFlash: 0x0e, Security: 0x14,
			Block: 0x400, Magic: 0x40001000
		};

		function u32 (list, value) {
			list.push(value & 255, value >>> 8 & 255, value >>> 16 & 255, value >>> 24 & 255);

			return list;
		}

		function slip (bytes) {
			var out = [0xC0];
			var i;

			for (i = 0; i < bytes.length; i++) {
				if (bytes[i] === 0xC0) out.push(0xDB, 0xDC);
				else if (bytes[i] === 0xDB) out.push(0xDB, 0xDD);
				else out.push(bytes[i]);
			}

			out.push(0xC0);

			return new Uint8Array(out);
		}

		/* A link to the loader on a port: frames it heard (SLIP undone), one waiter at a time. */
		function espLink (port) {
			var link = {Port: port, Frames: [], Waiter: null, Frame: null, Escape: false, Cancelled: false, Baud: 115200};

			link.Heard = function (chunk) {
				var i;

				for (i = 0; i < chunk.length; i++) {
					var byte = chunk[i];

					if (byte === 0xC0) {
						if (link.Frame && link.Frame.length)
							link.Frames.push(new Uint8Array(link.Frame));

						link.Frame = [];
					}
					else if (link.Frame) {
						if (link.Escape) {
							link.Frame.push(byte === 0xDC ? 0xC0 : byte === 0xDD ? 0xDB : byte);

							link.Escape = false;
						}
						else if (byte === 0xDB) {
							link.Escape = true;
						}
						else {
							link.Frame.push(byte);
						}
					}
				}

				if (link.Waiter)
					link.Waiter();
			};

			return link;
		}

		function later (link, ms, next) {
			setTimeout(next, ms);
		}

		/* A command and its answer: callback(error, {Value, Data}); the answers of other commands are left aside. */
		function espCommand (link, op, data, checksum, timeout, callback) {
			var packet = [0x00, op, data.length & 255, data.length >> 8 & 255];
			var timer;
			var done = false;

			u32(packet, checksum || 0);

			packet = packet.concat(Array.prototype.slice.call(data));

			function finish (error, result) {
				if (done) return;

				done = true;
				link.Waiter = null;

				clearTimeout(timer);

				callback(error, result);
			}

			link.Waiter = function () {
				while (link.Frames.length) {
					var frame = link.Frames.shift();
					var size;
					var body;
					var status;

					if (frame.length < 8 || frame[0] !== 0x01 || frame[1] !== op) continue;

					size = frame[2] | frame[3] << 8;
					body = frame.subarray(8, 8 + size);

					/* The loader of the ROM ends what it tells with 4 bytes: its status, then its error. */
					status = body.length >= 4 ? body[body.length - 4] : body.length >= 2 ? body[body.length - 2] : 0;

					if (status) {
						finish(fail('NetworkError', 'Elemenx Firmware esp: the loader refused the command 0x' + op.toString(16) + ' (error 0x' + (body[body.length - 3] || 0).toString(16) + ')'));

						return;
					}

					finish(null, {Value: (frame[4] | frame[5] << 8 | frame[6] << 16 | frame[7] << 24) >>> 0, Data: body.subarray(0, Math.max(0, body.length - 4))});

					return;
				}
			};

			timer = setTimeout(function () {
				finish(fail('TimeoutError', 'Elemenx Firmware esp: no answer to the command 0x' + op.toString(16)));
			}, timeout);

			link.Port.Write(slip(packet), function (error) {
				/* The answer may have come before the write told it was done: then nothing is waited for. */
				if (error) finish(error);
				else if (link.Waiter) link.Waiter();
			});
		}

		/* Into the loader by DTR and RTS (DTR holds IO0 down, RTS holds EN): the classic circuit, or the USB-JTAG-Serial. */
		function espReset (link, kind, callback) {
			var port = link.Port;
			var steps = kind === 'usb' ? [[{DTR: false, RTS: false}, 100], [{DTR: true, RTS: false}, 100], [{DTR: false, RTS: true}, 100], [{DTR: false, RTS: false}, 0]] : [[{DTR: false, RTS: true}, 100], [{DTR: true, RTS: false}, 50], [{DTR: false}, 0]];
			var index = 0;

			(function next () {
				var step = steps[index++];

				if (!step) {
					callback(null);

					return;
				}

				port.Signals(step[0], function (error) {
					if (error) {
						callback(error);

						return;
					}

					later(link, step[1], next);
				});
			})();
		}

		/* Sync with the loader: up to 7 tries of each reset (the classic one first, the USB one first of an Espressif USB). */
		function espSync (link, callback) {
			var usb = link.Port.Info && link.Port.Info.VendorID === 0x303a;
			var resets = usb ? ['usb', 'classic'] : ['classic', 'usb'];
			var sync = [0x07, 0x07, 0x12, 0x20];
			var r = 0;
			var i;

			for (i = 0; i < 32; i++)
				sync.push(0x55);

			(function reset () {
				var tries = 0;

				if (r >= resets.length) {
					callback(fail('TimeoutError', 'Elemenx Firmware esp: the loader does not answer (hold BOOT and press RESET, then try again)'));

					return;
				}

				espReset(link, resets[r++], function (error) {
					if (error) {
						callback(error);

						return;
					}

					(function attempt () {
						if (link.Cancelled) {
							callback(fail('AbortError', 'Elemenx Firmware: cancelled'));

							return;
						}

						link.Frames = [];

						espCommand(link, Esp.Sync, sync, 0, 300, function (failed) {
							if (!failed) {
								/* It answers each sync many times: those left are let go. */
								later(link, 50, function () {
									link.Frames = [];

									callback(null);
								});

								return;
							}

							if (++tries < 7) attempt();
							else reset();
						});
					})();
				});
			})();
		}

		/* The chip: by its magic register, else by GET_SECURITY_INFO (newer revisions). */
		function espDetect (link, callback) {
			espCommand(link, Esp.ReadReg, u32([], Esp.Magic), 0, 1000, function (error, made) {
				var chip = error ? null : Chips.filter(function (one) {
					return one.Magic.indexOf(made.Value) !== -1;
				})[0];

				if (chip) {
					callback(null, chip);

					return;
				}

				espCommand(link, Esp.Security, [], 0, 1000, function (failed, info) {
					var id = !failed && info.Data.length >= 15 ? info.Data[11] | info.Data[12] << 8 | info.Data[13] << 16 | info.Data[14] << 24 : -1;
					var found = Chips.filter(function (one) {
						return one.ID && one.ID === id;
					})[0];

					if (found) callback(null, found);
					else callback(fail('NotSupportedError', 'Elemenx Firmware esp: a chip this protocol does not know (0x' + (made ? made.Value.toString(16) : '?') + ')'));
				});
			});
		}

		/* The port opened for the loader (closed first if it was open), the link on it, synced and its chip told. */
		function espOpen (port, options, callback) {
			var link = espLink(port);

			function open () {
				port.Open({BaudRate: 115200, Text: false}, function (error) {
					if (error) {
						callback(error);

						return;
					}

					port.On('data', link.Heard);

					espSync(link, function (failed) {
						if (failed) {
							espClose(link, false, function () {
								callback(failed);
							});

							return;
						}

						espDetect(link, function (wrong, chip) {
							if (wrong) {
								espClose(link, false, function () {
									callback(wrong);
								});

								return;
							}

							link.Chip = chip;

							callback(null, link);
						});
					});
				});
			}

			if (port.Opened()) port.Close(open);
			else open();

			return link;
		}

		/* The port let go; with reset, the board reset to run what it has (RTS holds EN down a moment). */
		function espClose (link, reset, callback) {
			var port = link.Port;

			function close () {
				port.Off('data', link.Heard);
				port.Close(function () {
					callback();
				});
			}

			if (!reset) {
				close();

				return;
			}

			port.Signals({DTR: false, RTS: true}, function () {
				later(link, 100, function () {
					port.Signals({RTS: false}, close);
				});
			});
		}

		/* A faster speed: the loader told, the port opened again at it. */
		function espBaud (link, baud, callback) {
			if (!baud || baud === link.Baud) {
				callback(null);

				return;
			}

			espCommand(link, Esp.Baud, u32(u32([], baud), 0), 0, 1000, function (error) {
				if (error) {
					callback(error);

					return;
				}

				link.Port.Off('data', link.Heard);
				link.Port.Close(function () {
					link.Port.Open({BaudRate: baud, Text: false}, function (failed) {
						if (failed) {
							callback(failed);

							return;
						}

						link.Baud = baud;

						link.Port.On('data', link.Heard);

						later(link, 50, function () {
							link.Frames = [];

							callback(null);
						});
					});
				});
			});
		}

		function espFlash (port, parts, options, callback) {
			var flashBytes = bytesOfSize(options.Flash && options.Flash.Size) || 4 * 1024 * 1024;
			var progress = typeof options.Progress === 'function' ? options.Progress : noop;
			var total = parts.reduce(function (sum, part) {
				return sum + part.Bytes.length;
			}, 0);
			var written = 0;
			var report = [];
			var link;
			var finished = false;

			function finish (error, result) {
				if (finished) return;

				finished = true;

				if (!link || !link.Port.Opened()) {
					callback(error, result);

					return;
				}

				espClose(link, !error && options.Reset !== false, function () {
					callback(error, result);
				});
			}

			function step (stage, done) {
				Runtime.Notify(progress, null, [{Stage: stage, Done: written, Total: total}]);

				if (link && link.Cancelled) finish(fail('AbortError', 'Elemenx Firmware: cancelled'));
				else done();
			}

			function command (op, data, checksum, timeout, next) {
				espCommand(link, op, data, checksum, timeout, function (error, made) {
					if (error) finish(error);
					else if (link.Cancelled) finish(fail('AbortError', 'Elemenx Firmware: cancelled'));
					else next(made);
				});
			}

			/* Begin over a region: erase size, blocks, block size, offset (and not encrypted, of the newer chips). */
			function begin (offset, size, blocks, next) {
				var data = u32(u32(u32(u32([], size), blocks), Esp.Block), offset);

				if (link.Chip.Encrypted)
					u32(data, 0);

				/* Erasing takes its time: 30 s a megabyte at most. */
				command(Esp.Begin, data, 0, Math.max(3000, size / 1048576 * 30000), next);
			}

			function part (index) {
				var one = parts[index];
				var bytes;
				var blocks;
				var seq = 0;

				if (!one) {
					step('done', function () {
						command(Esp.End, u32([], 1), 0, 3000, function () {
							finish(null, {Chip: link.Chip.Name, Written: written, Parts: report});
						});
					});

					return;
				}

				bytes = one.Offset === link.Chip.Bootloader && options.Flash ? patchImage(one.Bytes, Object.assign({Chip: link.Chip.Name}, options.Flash)) : one.Bytes;
				blocks = Math.ceil(bytes.length / Esp.Block);

				step('erase', function () {
					begin(one.Offset, bytes.length, blocks, function () {
						(function block () {
							var chunk;
							var data;
							var sum = 0xEF;
							var k;

							if (seq >= blocks) {
								verify();

								return;
							}

							chunk = new Uint8Array(Esp.Block);

							chunk.fill(0xFF);
							chunk.set(bytes.subarray(seq * Esp.Block, Math.min(bytes.length, (seq + 1) * Esp.Block)));

							for (k = 0; k < chunk.length; k++)
								sum ^= chunk[k];

							data = u32(u32(u32(u32([], chunk.length), seq), 0), 0).concat(Array.prototype.slice.call(chunk));

							command(Esp.Data, data, sum, 3000, function () {
								written += Math.min(Esp.Block, bytes.length - seq * Esp.Block);
								seq++;

								step('write', block);
							});
						})();
					});
				});

				/* What the flash has now, by its MD5, the same as what was written. */
				function verify () {
					var want = hex(md5(bytes));

					if (options.Verify === false) {
						report.push({Offset: one.Offset, Size: bytes.length, MD5: want});

						part(index + 1);

						return;
					}

					step('verify', function () {
						command(Esp.Md5, u32(u32(u32(u32([], one.Offset), bytes.length), 0), 0), 0, Math.max(3000, bytes.length / 1048576 * 8000), function (made) {
							var got = made.Data.length >= 32 ? String.fromCharCode.apply(null, Array.prototype.slice.call(made.Data, 0, 32)).toLowerCase() : hex(made.Data.subarray(0, 16));

							if (got !== want) {
								finish(fail('DataError', 'Elemenx Firmware esp: the flash at 0x' + one.Offset.toString(16) + ' does not hold what was written (MD5 ' + got + ', not ' + want + ')'));

								return;
							}

							report.push({Offset: one.Offset, Size: bytes.length, MD5: want});

							part(index + 1);
						});
					});
				}
			}

			link = espOpen(port, options, function (error, opened) {
				if (error) {
					finish(error);

					return;
				}

				link = opened;

				step('connect', function () {
					espBaud(link, Number(options.Baud) || 460800, function (failed) {
						if (failed) {
							finish(failed);

							return;
						}

						command(Esp.Attach, [0, 0, 0, 0, 0, 0, 0, 0], 0, 3000, function () {
							command(Esp.Params, u32(u32(u32(u32(u32(u32([], 0), flashBytes), 0x10000), 0x1000), 0x100), 0xffff), 0, 3000, function () {
								if (!options.Erase) {
									part(0);

									return;
								}

								/* The whole flash erased: a begin over all of it, its blocks none. */
								step('erase', function () {
									begin(0, flashBytes, 0, function () {
										part(0);
									});
								});
							});
						});
					});
				});
			});

			return {
				Cancel: function () {
					link.Cancelled = true;
				}
			};
		}

		function espDetectPort (port, options, callback) {
			var link = espOpen(port, options, function (error, opened) {
				if (error) {
					callback(error);

					return;
				}

				espClose(opened, options.Reset !== false, function () {
					callback(null, {Chip: opened.Chip.Name, Family: opened.Chip.Family, Bootloader: opened.Chip.Bootloader});
				});
			});

			return {
				Cancel: function () {
					link.Cancelled = true;
				}
			};
		}

		/* Bytes of the flash read by the loader, 64 at a time (READ_FLASH_SLOW: slow, for a table of partitions and the like). */
		function espRead (port, offset, length, options, callback) {
			var link = espOpen(port, options, function (error, opened) {
				var out = new Uint8Array(length);
				var at = 0;

				if (error) {
					callback(error);

					return;
				}

				(function next () {
					var size = Math.min(64, length - at);

					if (at >= length) {
						espClose(opened, options.Reset !== false, function () {
							callback(null, out);
						});

						return;
					}

					if (opened.Cancelled) {
						espClose(opened, false, function () {
							callback(fail('AbortError', 'Elemenx Firmware: cancelled'));
						});

						return;
					}

					espCommand(opened, Esp.ReadFlash, u32(u32([], offset + at), size), 0, 3000, function (failed, made) {
						if (failed) {
							espClose(opened, false, function () {
								callback(failed.name === 'NetworkError' ? fail('NotSupportedError', 'Elemenx Firmware esp: the loader of this chip reads no flash') : failed);
							});

							return;
						}

						out.set(made.Data.subarray(0, size), at);

						at += size;

						next();
					});
				})();
			});

			return {
				Cancel: function () {
					link.Cancelled = true;
				}
			};
		}

		protocols.esp = {Flash: espFlash, Detect: espDetectPort, Read: espRead};

		/* A handle given to an owner: what it opens is held for it (its Owner, the last that asked for it). */
		function given (handle, owner) {
			handle.Owner = owner;

			return handle;
		}

		/* The facade of an owner (null: Elemenx.Hardware, of nobody). */
		function createHardware (owner) {
			var serial = {
				Supported: function () {
					return !!api('serial');
				},
				Request: function (options, callback) {
					var done = typeof options === 'function' ? options : callback;
					var filters = (typeof options === 'function' ? {} : options || {}).Filters || [];

					if (!api('serial')) {
						done(fail('NotSupportedError', 'Elemenx Serial: this browser has no Web Serial'));

						return;
					}

					api('serial').requestPort({filters: filters.map(function (filter) {
						var result = {};

						if (filter.VendorID != null)
							result.usbVendorId = Number(filter.VendorID);

						if (filter.ProductID != null)
							result.usbProductId = Number(filter.ProductID);

						return result;
					})}).then(function (port) {
						done(null, given(serialPort(port), owner));
					}, done);
				},
				Ports: function (callback) {
					if (!api('serial')) {
						callback(null, []);

						return;
					}

					api('serial').getPorts().then(function (ports) {
						callback(null, ports.map(function (port) {
							return given(serialPort(port), owner);
						}));
					}, callback);
				},
				On: function (name, callback) {
					on('serial', owner, name, callback);
				},
				Off: function (name, callback) {
					off('serial', owner, name, callback);
				}
			};
			var usb = {
				Supported: function () {
					return !!api('usb');
				},
				Request: function (options, callback) {
					var done = typeof options === 'function' ? options : callback;
					var filters = (typeof options === 'function' ? {} : options || {}).Filters || [];

					if (!api('usb')) {
						done(fail('NotSupportedError', 'Elemenx USB: this browser has no WebUSB'));

						return;
					}

					api('usb').requestDevice({filters: filters.map(function (filter) {
						var result = {};

						if (filter.VendorID != null)
							result.vendorId = Number(filter.VendorID);

						if (filter.ProductID != null)
							result.productId = Number(filter.ProductID);

						if (filter.ClassCode != null)
							result.classCode = Number(filter.ClassCode);

						return result;
					})}).then(function (device) {
						done(null, given(usbDevice(device), owner));
					}, done);
				},
				Devices: function (callback) {
					if (!api('usb')) {
						callback(null, []);

						return;
					}

					api('usb').getDevices().then(function (devices) {
						callback(null, devices.map(function (device) {
							return given(usbDevice(device), owner);
						}));
					}, callback);
				},
				On: function (name, callback) {
					on('usb', owner, name, callback);
				},
				Off: function (name, callback) {
					off('usb', owner, name, callback);
				}
			};

			return {Serial: serial, USB: usb, Firmware: createFirmware(owner)};
		}

		Elemenx.Hardware = createHardware(null);
		Runtime.HardwareFor = createHardware;
		Runtime.DestroyHardwareOwner = function (owner) {
			owned.Destroy(owner);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Ether */
	(function (global) {
		'use strict';

		/*
		 * Elemenx.Ether: data kept for the whole page, read where it lies. Elemenx.Ether(name) is a slice, a plain object
		 * of its own (made empty the first time), the same object always: its fields are read straight, no call, no copy.
		 * Who writes into it changes its fields where they are and tells it once, Touch(name, path) (path: 'ship.Depth',
		 * or none for all of it), or Set(name, path, value) does both; Version(name) is how many times it was told, for
		 * what is worked out of it and kept till it changes. On(name, path, callback) hears it: callback(slice, paths) at
		 * most once a frame, and only when a path told is the one heard, inside it or round it ('ship' hears
		 * 'ship.Depth', 'ship.Depth' hears 'ship'); Off takes it away. No actions, no reducers, no copies: a scene writes
		 * sixty times a second, the page wakes once a frame. $Ether of a Service, a Component or an Application is the same,
		 * its own: what it hears it stops hearing when it is destroyed; Mirror(name, path, field) puts the value at the
		 * path into its field as it changes (its template follows). A worker has its own Ether.
		 */
		var slices = {};
		var versions = {};
		var listeners = [];
		var told = {};
		var waiting = false;
		var gone = typeof WeakSet === 'function' ? new WeakSet() : null;

		function named (name) {
			if (typeof name !== 'string' || !name)
				throw new Error('Elemenx.Ether expects a name');

			return name;
		}

		function slice (name) {
			named(name);

			if (!Object.prototype.hasOwnProperty.call(slices, name)) {
				slices[name] = {};
				versions[name] = 0;
			}

			return slices[name];
		}

		function pathOf (path) {
			if (path === undefined || path === null || path === '') return '';
			if (Array.isArray(path)) return path.join('.');

			if (typeof path !== 'string')
				throw new Error('Elemenx.Ether expects a path of names: ship.Depth');

			return path;
		}

		/* One is the other, inside it or round it, by whole names. */
		function meets (a, b) {
			if (a === '' || b === '' || a === b) return true;

			return a.indexOf(b + '.') === 0 || b.indexOf(a + '.') === 0;
		}

		function valueAt (object, path) {
			var names = path ? path.split('.') : [];
			var value = object;
			var i;

			for (i = 0; i < names.length; i++) {
				if (value === null || value === undefined) return undefined;

				value = value[names[i]];
			}

			return value;
		}

		function frame (callback) {
			if (typeof global.requestAnimationFrame === 'function') global.requestAnimationFrame(callback);
			else setTimeout(callback, 16);
		}

		/* Once a frame: each listener of a slice told whose path meets a path told, once. */
		function deliver () {
			var now = told;

			waiting = false;
			told = {};

			listeners.slice().forEach(function (listener) {
				var paths = now[listener.Name];
				var met;

				if (!paths || listeners.indexOf(listener) === -1) return;

				met = paths.filter(function (path) {
					return meets(path, listener.Path);
				});

				if (met.length)
					Runtime.Notify(listener.Callback, null, [slices[listener.Name], met]);
			});
		}

		function touch (name, path) {
			var paths;

			slice(name);

			path = pathOf(path);
			versions[name]++;
			paths = told[name] = told[name] || [];

			if (paths.indexOf(path) === -1)
				paths.push(path);

			if (!waiting) {
				waiting = true;

				frame(deliver);
			}
		}

		function listen (owner, name, path, callback) {
			if (typeof callback !== 'function')
				throw new Error('Elemenx.Ether expects a callback');

			var listener = {Name: named(name), Path: pathOf(path), Callback: callback, Owner: owner};

			slice(name);

			/* An owner destroyed hears nothing more. */
			if (owner && gone && gone.has(owner)) return listener;

			listeners.push(listener);

			return listener;
		}

		function unlisten (owner, name, path, callback) {
			path = pathOf(path);

			listeners = listeners.filter(function (listener) {
				return !(listener.Name === name && listener.Path === path && listener.Callback === callback && (!owner || listener.Owner === owner));
			});
		}

		function createEther (owner) {
			var ether = function (name) {
				return slice(name);
			};

			ether.Touch = function (name, path) {
				touch(name, path);

				return ether;
			};

			ether.Set = function (name, path, value) {
				var names = pathOf(path).split('.');
				var place = slice(name);
				var i;

				if (!names[0])
					throw new Error('Elemenx.Ether expects a path of names: ship.Depth');

				for (i = 0; i < names.length - 1; i++) {
					if (!place[names[i]] || typeof place[names[i]] !== 'object')
						place[names[i]] = {};

					place = place[names[i]];
				}

				place[names[names.length - 1]] = value;

				touch(name, path);

				return ether;
			};

			ether.Version = function (name) {
				slice(name);

				return versions[name];
			};

			ether.On = function (name, path, callback) {
				listen(owner, name, path, callback);

				return ether;
			};

			ether.Off = function (name, path, callback) {
				unlisten(owner, named(name), path, callback);

				return ether;
			};

			/* The value at a path of a slice in a field of its owner, now and as it changes (only of an owner). */
			if (owner) {
				ether.Mirror = function (name, path, field) {
					if (typeof field !== 'string' || !field)
						throw new Error('Elemenx.Ether expects a field to mirror into');

					owner[field] = valueAt(slice(name), pathOf(path));

					listen(owner, name, path, function (data) {
						owner[field] = valueAt(data, pathOf(path));
					});

					return ether;
				};
			}

			return ether;
		}

		Elemenx.Ether = createEther(null);
		Runtime.EtherFor = createEther;
		Runtime.DestroyEtherOwner = function (owner) {
			listeners = listeners.filter(function (listener) {
				return listener.Owner !== owner;
			});

			if (gone && owner)
				gone.add(owner);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Owner resources */
	(function (global) {
		'use strict';

		/*
		 * Services, Components and Applications own Network resources, Messaging and Events sockets and workers.
		 * These helpers wire and release them in one place; the release order is part of the lifecycle contract.
		 * A build may leave out the sections an Application does not use (Network, Storage, Events, Messaging and the
		 * workers): their facades are then not there.
		 */
		Runtime.AttachOwnerFacades = function (owner, name, index) {
			if (Runtime.NetworkFor)
				owner.$Network = Runtime.NetworkFor(owner);

			if (Runtime.StorageFor)
				owner.$Storage = Runtime.StorageFor(owner);

			if (Runtime.WebWorkerFor)
				owner.$WebWorker = Runtime.WebWorkerFor(owner);

			if (Runtime.ServiceWorkerFor)
				owner.$ServiceWorker = Runtime.ServiceWorkerFor(owner);

			if (Runtime.MessagingFor) {
				Runtime.SetMessagingEntity(owner, name, index);

				owner.$Messaging = Runtime.MessagingFor(owner);
			}

			if (Runtime.EventsFor)
				owner.$Events = Runtime.EventsFor(owner);

			if (Runtime.HardwareFor)
				owner.$Hardware = Runtime.HardwareFor(owner);

			if (Runtime.EtherFor)
				owner.$Ether = Runtime.EtherFor(owner);
		};

		Runtime.InitializeOwnerSubscriptions = function (owner, definition) {
			if (Runtime.InitializeEventsOwner)
				Runtime.InitializeEventsOwner(owner, definition);

			if (Runtime.InitializeMessagingOwner)
				Runtime.InitializeMessagingOwner(owner, definition);
		};

		Runtime.DestroyOwnerResources = function (owner) {
			if (Runtime.DestroyNetworkOwner)
				Runtime.DestroyNetworkOwner(owner);

			if (Runtime.DestroyMessagingOwner)
				Runtime.DestroyMessagingOwner(owner);

			if (Runtime.DestroyEventsOwner)
				Runtime.DestroyEventsOwner(owner);

			if (Runtime.DestroyWebWorkerOwner)
				Runtime.DestroyWebWorkerOwner(owner);

			if (Runtime.DestroyServiceWorkerOwner)
				Runtime.DestroyServiceWorkerOwner(owner);

			if (Runtime.DestroyHardwareOwner)
				Runtime.DestroyHardwareOwner(owner);

			if (Runtime.DestroyEtherOwner)
				Runtime.DestroyEtherOwner(owner);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Install */
	(function (global) {
		'use strict';

		/*
		 * The page as an application of the system (a PWA, PWA of elemenx.config.js). The prompt of the browser to install
		 * it (beforeinstallprompt) is kept from the start of the page instead of showing on its own, so the Application
		 * decides when: Elemenx.Install.Available() tells it may, Prompt(callback) shows it, callback(error, {Outcome:
		 * 'accepted' or 'dismissed'}). Installed() is true in the window of the installed application (and in a native
		 * program, installed already), Manual() on a system that installs by its own menu only (Safari of iOS: Share, Add
		 * to Home Screen). State() is {Available, Installed, Manual}; OnChange(callback) hears it change, OffChange takes the
		 * callback away. The service worker a build names (<meta name="elemenx-pwa-worker">) is registered once the page
		 * has loaded: it keeps the files of the build for the page to run offline.
		 *
		 * Its updates: State() has Version (the build the page runs, once its worker answers) and Waiting (a new build is
		 * there, waiting to take its place). Update(callback) asks the server for a new build: callback(error, {Available,
		 * Version, Current}). Apply(callback) updates at once, whatever is there: the new build takes the place of the one
		 * before and every page of it reloads; without a new build the worker and its files are forgotten and the page
		 * reloads from the network (it keeps the files again). PWA.Update of the build: auto (a new build is taken at once,
		 * for the next start), prompt (it waits for Apply; checked at the start and every hour), manual (it waits for Apply,
		 * checked by Update only).
		 */
		var prompt = null;
		var installed = false;
		var listeners = [];
		var registration = null;
		var policy = 'auto';
		var version = null;
		var waiting = null;
		var controlled = false;

		function standalone () {
			if (!Runtime.HasDOM) return false;
			if (global.ElemenxNative) return true;

			return (typeof global.matchMedia === 'function' && global.matchMedia('(display-mode: standalone)').matches) || global.navigator.standalone === true;
		}

		/* Safari of iOS and iPadOS: no prompt, its Share menu adds the page to the Home Screen. */
		function manual () {
			var agent = Runtime.HasDOM ? String(global.navigator.userAgent || '') : '';
			var apple = /iPad|iPhone|iPod/.test(agent) || (/Macintosh/.test(agent) && global.navigator.maxTouchPoints > 1);

			return apple && !standalone();
		}

		function state () {
			return {Available: !!prompt && !installed, Installed: installed || standalone(), Manual: manual(), Waiting: !!waiting, Version: version};
		}

		/* The version of the build of a worker (it answers on a channel), or null when it does not answer. */
		function versionOf (worker, callback) {
			var channel = new global.MessageChannel();
			var done = false;
			var timer = global.setTimeout(function () {
				finish(null);
			}, 3000);

			function finish (value) {
				if (done) return;

				done = true;

				global.clearTimeout(timer);

				callback(value);
			}

			channel.port1.onmessage = function (event) {
				finish(event.data && event.data.Version ? String(event.data.Version) : null);
			};

			worker.postMessage({Type: 'elemenx-pwa-version'}, [channel.port2]);
		}

		/* A worker of a new build, once installed: the build waits (or, with update auto, is taken already). */
		function arrived (worker, callback) {
			function ready () {
				versionOf(worker, function (value) {
					waiting = value || 'new';

					changed();

					if (callback)
						callback(waiting);
				});
			}

			if (worker.state === 'installed' || worker.state === 'activating' || worker.state === 'activated') {
				ready();

				return;
			}

			worker.addEventListener('statechange', function listen () {
				if (worker.state === 'redundant') {
					worker.removeEventListener('statechange', listen);

					if (callback)
						callback(null);
				}

				if (worker.state !== 'installed' && worker.state !== 'activated') return;

				worker.removeEventListener('statechange', listen);

				ready();
			});
		}

		/* The version of the build the worker of the page runs: at once, or once the first worker of the page is active. */
		function current (value) {
			var worker = value.active || value.installing || value.waiting;

			function ask () {
				versionOf(worker, function (answer) {
					version = answer;

					changed();
				});
			}

			if (!worker) return;

			if (worker.state === 'activated') {
				ask();

				return;
			}

			worker.addEventListener('statechange', function listen () {
				if (worker.state !== 'activated') return;

				worker.removeEventListener('statechange', listen);

				ask();
			});
		}

		/* The registration of the worker: the version of the build, the new builds that come, the checks of prompt. */
		function watch (value) {
			registration = value;

			current(value);

			/* A new build taken (update auto, or another page applied it): the version that runs now. */
			global.navigator.serviceWorker.addEventListener('controllerchange', function () {
				current(value);
			});

			if (value.waiting && controlled)
				arrived(value.waiting);

			value.addEventListener('updatefound', function () {
				if (value.installing && controlled)
					arrived(value.installing);
			});

			if (policy === 'prompt') {
				value.update().catch(function () {});

				global.setInterval(function () {
					value.update().catch(function () {});
				}, 3600000);
			}
		}

		function reload () {
			global.location.reload();
		}

		/* The worker of the build and its files forgotten: callback(error) once both are gone. */
		function forget (callback) {
			var done = Runtime.Countdown(2, callback);

			function failed (error) {
				done(error instanceof Error ? error : new Error(String(error)));
			}

			if (registration) registration.unregister().then(function () {
				done(null);
			}, failed);
			else done(null);

			if (!global.caches) {
				done(null);

				return;
			}

			global.caches.keys().then(function (keys) {
				var names = keys.filter(function (key) {
					return key.indexOf('elemenx-pwa-') === 0;
				});
				var gone = Runtime.Countdown(names.length, done);

				if (!names.length)
					done(null);

				names.forEach(function (key) {
					global.caches.delete(key).then(function () {
						gone(null);
					}, failed);
				});
			}, failed);
		}

		function changed () {
			var value = state();

			listeners.slice().forEach(function (listener) {
				listener(value);
			});
		}

		/* The worker of the build, once the page has loaded: it does not compete with the files of the start. */
		function register () {
			var meta = global.document.querySelector('meta[name="elemenx-pwa-worker"]');
			if (!meta || !global.navigator.serviceWorker || typeof global.navigator.serviceWorker.register !== 'function') return;

			policy = meta.getAttribute('data-update') || 'auto';
			controlled = !!global.navigator.serviceWorker.controller;

			/* A new build taken by another page of it (its Apply): this one reloads too, but for the first worker of the page. */
			global.navigator.serviceWorker.addEventListener('controllerchange', function () {
				if (controlled && policy !== 'auto')
					reload();
			});

			global.navigator.serviceWorker.register(meta.getAttribute('content'), {scope: meta.getAttribute('data-scope') || '/'}).then(watch, function (error) {
				Runtime.Report(error);
			});
		}

		if (Runtime.HasDOM && typeof global.addEventListener === 'function') {
			global.addEventListener('beforeinstallprompt', function (event) {
				event.preventDefault();

				prompt = event;

				changed();
			});

			global.addEventListener('appinstalled', function () {
				installed = true;
				prompt = null;

				changed();
			});

			if (global.document.readyState === 'complete') register();
			else global.addEventListener('load', register);
		}

		Elemenx.Install = {
			Available: function () {
				return state().Available;
			},
			Installed: function () {
				return state().Installed;
			},
			Manual: function () {
				return state().Manual;
			},
			State: state,
			Prompt: function (callback) {
				var event = prompt;

				callback = callback || function () {};

				if (!event || installed) {
					callback(new Error('Elemenx.Install has no prompt of the browser: the page is installed, not installable here, or not yet'));

					return;
				}

				/* A prompt shows once: the browser may give another one later. */
				prompt = null;

				event.prompt();

				event.userChoice.then(function (choice) {
					if (choice && choice.outcome === 'accepted')
						installed = true;

					changed();

					callback(null, {Outcome: choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed'});
				}, function (error) {
					changed();

					callback(error instanceof Error ? error : new Error(String(error)));
				});

				changed();
			},
			Update: function (callback) {
				callback = callback || function () {};

				if (!registration) {
					callback(new Error('Elemenx.Install has no worker: the build is not a PWA that runs offline, or the page has not loaded yet'));

					return;
				}

				registration.update().then(function () {
					var worker = registration.installing || registration.waiting;

					if (!worker) {
						callback(null, {Available: !!waiting, Version: waiting, Current: version});

						return;
					}

					arrived(worker, function (value) {
						callback(null, {Available: !!value, Version: value, Current: version});
					});
				}, function (error) {
					callback(error instanceof Error ? error : new Error(String(error)));
				});
			},
			Apply: function (callback) {
				var workers = Runtime.HasDOM && global.navigator.serviceWorker;

				callback = callback || function () {};

				if (!workers) {
					reload();

					return;
				}

				/* A new build waits: it takes the place of the one before, and every page of it reloads (controllerchange). */
				if (registration && registration.waiting) {
					controlled = true;
					policy = 'prompt';

					registration.waiting.postMessage({Type: 'elemenx-pwa-apply'});

					return;
				}

				/* Taken already (update auto): the page of the new build. */
				if (waiting) {
					reload();

					return;
				}

				/* Nothing new: the worker and its files are forgotten, the page comes from the network and keeps them again. */
				forget(function (error) {
					if (error) callback(error);
					else reload();
				});
			},
			OnChange: function (callback) {
				if (typeof callback === 'function' && listeners.indexOf(callback) === -1)
					listeners.push(callback);

				return Elemenx.Install;
			},
			OffChange: function (callback) {
				listeners = listeners.filter(function (listener) {
					return listener !== callback;
				});

				return Elemenx.Install;
			}
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Widgets */
	(function (global) {
		'use strict';

		/*
		 * Elemenx.Widgets: the Components of an Application on a page of another site, as widgets. The page loads the
		 * code once (a build of elemenx build --widget: widget.js in its head) and marks the places of the widgets:
		 * <div data-elemenx-widget="Cart" data-props='{"Currency": "EUR"}'></div>. Define(name, {Component, Application,
		 * Props, Events, Shadow}) names a widget: its Component, the name of its Application, the props it starts with,
		 * the events of the Component the page hears as DOM events of the element (they bubble, detail the data), and
		 * Shadow false to render in the element itself (by default in a shadow root of it: the styles of the page stay out,
		 * the ones of the framework go in). Watch(root) mounts every place in root (the document) and the ones that come
		 * later, takes away the ones that go, and follows their data-props; it returns the function that stops it.
		 * Mount(element, name, props) mounts one from code: {Name, Element, Update(props), On(event, callback),
		 * Unmount()}; Unmount(element) takes one away; Names() lists the widgets defined. The widgets of one Application
		 * share its Services and its state; a widget is made once its Application has started.
		 */
		var defined = {};
		var mounted = [];

		function entryOf (element) {
			var i = 0;

			while (i < mounted.length) {
				if (mounted[i].Element === element) return mounted[i];

				i++;
			}

			return null;
		}

		/* The props of a place: its data-props, a JSON object. */
		function propsOf (element) {
			var text = element.getAttribute('data-props');
			var value;

			if (!text)
				return {};

			try {
				value = JSON.parse(text);
			}
			catch (error) {
				Runtime.Report(new Error('Elemenx.Widgets: the data-props of a widget is not JSON: ' + text));

				return {};
			}

			return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
		}

		/* New props of a widget: its Component takes them, or the ones it will be made with, while its Application starts. */
		function update (entry, props) {
			var key;

			if (entry.Instance) {
				Runtime.UpdateProps(entry.Instance, props || {});

				return;
			}

			for (key in props || {}) {
				if (Runtime.Own(props, key))
					entry.Props[key] = props[key];
			}
		}

		function listen (entry, name, callback) {
			entry.Instance.$On(name, function (data) {
				callback(data);
			});
		}

		function handle (entry) {
			return {
				Name: entry.Name,
				Element: entry.Element,
				Update: function (props) {
					if (mounted.indexOf(entry) !== -1)
						update(entry, props);
				},
				On: function (name, callback) {
					if (entry.Instance) listen(entry, name, callback);
					else entry.Listeners.push([name, callback]);
				},
				Unmount: function () {
					unmount(entry.Element);
				}
			};
		}

		function mount (element, name, props) {
			var widget = defined[name];
			var entry = entryOf(element);
			var application;
			var target;
			var instance;
			var key;
			var values = {};

			if (!element || element.nodeType !== 1)
				throw new Error('Elemenx.Widgets.Mount expects (element, name, props)');

			if (!widget)
				throw new Error('Elemenx.Widgets does not know the widget ' + name);

			/* Mounted already: the same widget takes the props, another one takes its place. */
			if (entry && entry.Name === name) {
				update(entry, props);

				return handle(entry);
			}

			if (entry)
				unmount(element);

			for (key in widget.Props || {}) {
				if (Runtime.Own(widget.Props, key))
					values[key] = widget.Props[key];
			}

			for (key in props || {}) {
				if (Runtime.Own(props, key))
					values[key] = props[key];
			}

			application = widget.Application ? Elemenx.Application(widget.Application) : null;
			target = element;

			if (widget.Shadow !== false) {
				target = element.shadowRoot || element.attachShadow({mode: 'open'});

				Runtime.AddStyleRoot(target);

				if (Runtime.ShadowHosts.indexOf(element) === -1)
					Runtime.ShadowHosts.push(element);

				element.lang = Elemenx.Locale.Language();
				element.dir = Elemenx.Locale.Direction();
			}
			else if (Runtime.Isolated) {
				Runtime.AddStyleDocument();
			}

			entry = {Element: element, Name: name, Instance: null, Target: target, Props: values, Listeners: []};

			mounted.push(entry);

			/* Its Component is made once its Application has started (its Services and its Libraries are there then). */
			Runtime.WhenStarted(application, function () {
				if (mounted.indexOf(entry) === -1) return;

				instance = Elemenx.Component(widget.Component)(entry.Props, null, {Application: application});
				entry.Instance = instance;

				target.appendChild(instance.$Element());

				(widget.Events || []).forEach(function (event) {
					instance.$On(event, function (data) {
						element.dispatchEvent(new global.CustomEvent(event, {bubbles: true, detail: data}));
					});
				});

				entry.Listeners.splice(0).forEach(function (pair) {
					listen(entry, pair[0], pair[1]);
				});
			});

			element.setAttribute('data-elemenx-widget-mounted', name);

			return handle(entry);
		}

		function unmount (element) {
			var entry = entryOf(element);
			var index;

			if (!entry)
				return false;

			mounted.splice(mounted.indexOf(entry), 1);

			if (entry.Instance)
				entry.Instance.$Destroy();

			while (entry.Target.firstChild)
				entry.Target.removeChild(entry.Target.firstChild);

			index = Runtime.ShadowHosts.indexOf(element);

			if (index !== -1)
				Runtime.ShadowHosts.splice(index, 1);

			element.removeAttribute('data-elemenx-widget-mounted');

			return true;
		}

		/* The places of root (an element, or the document) with a widget defined here; the ones of other widgets are left. */
		function scan (root) {
			var places = [];

			if (root.nodeType === 1 && root.hasAttribute('data-elemenx-widget'))
				places.push(root);

			Array.prototype.forEach.call(root.querySelectorAll ? root.querySelectorAll('[data-elemenx-widget]') : [], function (element) {
				places.push(element);
			});

			places.forEach(function (element) {
				var name = element.getAttribute('data-elemenx-widget');
				var entry = entryOf(element);
				if (!Runtime.Own(defined, name) || (entry && entry.Name === name)) return;

				try {
					mount(element, name, propsOf(element));
				}
				catch (error) {
					Runtime.Report(error);
				}
			});
		}

		function watch (root) {
			var observer;

			root = root || global.document;

			if (!Runtime.HasDOM)
				throw new Error('Elemenx.Widgets.Watch needs a document');

			/* The places of the page once it is parsed; the ones that come and go, after. */
			if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', function () {
				scan(root);
			});
			else scan(root);

			observer = new global.MutationObserver(function (records) {
				records.forEach(function (record) {
					var entry;

					if (record.type === 'attributes') {
						entry = entryOf(record.target);

						if (record.attributeName === 'data-props' && entry) update(entry, propsOf(record.target));
						else if (record.attributeName === 'data-elemenx-widget' && entry && entry.Name !== record.target.getAttribute('data-elemenx-widget')) unmount(record.target);

						scan(record.target);

						return;
					}

					Array.prototype.forEach.call(record.addedNodes, function (node) {
						if (node.nodeType === 1)
							scan(node);
					});
				});

				/* A place gone from the page: its widget goes. */
				mounted.slice().forEach(function (entry) {
					if (!entry.Element.isConnected)
						unmount(entry.Element);
				});
			});

			observer.observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-elemenx-widget', 'data-props']});

			return function () {
				observer.disconnect();
			};
		}

		Elemenx.Widgets = {
			Define: function (name, options) {
				if (typeof name !== 'string' || !name || !options || typeof options.Component !== 'string' || !options.Component)
					throw new Error('Elemenx.Widgets.Define expects (name, {Component, Application, Props, Events, Shadow})');

				defined[name] = options;

				return Elemenx.Widgets;
			},
			Mount: mount,
			Unmount: unmount,
			Watch: watch,
			Names: function () {
				return Object.keys(defined);
			}
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Splash */
	(function (global) {
		'use strict';

		/*
		 * The splash of the page: #elemenx-splash, which a build puts at the top of its body (the Splash of
		 * elemenx.config.js). It goes when the first Application is ready or fails, not before data-min milliseconds from
		 * the start of the page, and at the latest data-timeout milliseconds after it; it fades (the class
		 * elemenx-splash-out) and leaves the page. Elemenx.Splash.Hold() keeps it past the ready until Hide(), which takes
		 * it away; Visible() tells whether it is still there.
		 *
		 * A splash with data-progress shows the percent of the page loaded: data-total is the bytes of the scripts and
		 * styles of the page (the build writes it), counted as they come (the resources of the Performance API), at most
		 * 95 until the ready, then 100. Progress(percent) gives the percent of the Application itself instead (the data it
		 * loads while it holds the splash). The percent is data-progress and the CSS variable --elemenx-splash-progress
		 * of the splash, the aria-valuenow of its .elemenx-splash-progress and the text of its .elemenx-splash-percent.
		 */
		var held = 0;
		var hidden = null;
		var shown = -1;
		var manual = false;
		var counted = {};
		var loaded = 0;
		var tracker = null;

		function node () {
			return Runtime.HasDOM ? global.document.getElementById('elemenx-splash') : null;
		}

		/* The milliseconds since the page started. */
		function since () {
			return global.performance && typeof global.performance.now === 'function' ? global.performance.now() : 0;
		}

		/* A percent shown: the attribute and the CSS variable of the splash, its bar for screen readers and its text. */
		function show (percent) {
			var element = node();
			var value;
			var bar;
			var text;

			if (!element || element === hidden) return;

			value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
			shown = value;
			bar = element.querySelector('.elemenx-splash-progress');
			text = element.querySelector('.elemenx-splash-percent');

			element.setAttribute('data-progress', String(value));
			element.style.setProperty('--elemenx-splash-progress', String(value));

			if (bar)
				bar.setAttribute('aria-valuenow', String(value));

			if (text)
				text.textContent = value + '%';
		}

		/* The bytes of the resources loaded so far, each once, of the data-total of the splash: never back, at most 95. */
		function count (entries) {
			var element = node();
			var total = element ? Number(element.getAttribute('data-total')) || 0 : 0;
			var i;

			if (manual || !element || element === hidden || total <= 0) return;

			for (i = 0; i < entries.length; i++) {
				if (counted[entries[i].name]) continue;

				counted[entries[i].name] = true;
				loaded += Number(entries[i].decodedBodySize) || 0;
			}

			if (Math.min(95, loaded / total * 100) > shown)
				show(Math.min(95, loaded / total * 100));
		}

		/* Counting starts once the page has a splash with data-progress and data-total. */
		function track () {
			var element = node();
			var performance = global.performance;

			if (tracker || manual || !element || !element.hasAttribute('data-progress') || !(Number(element.getAttribute('data-total')) > 0)) return;
			if (!performance || typeof performance.getEntriesByType !== 'function') return;

			count(performance.getEntriesByType('resource'));

			if (typeof global.PerformanceObserver !== 'function') return;

			tracker = new global.PerformanceObserver(function (list) {
				count(list.getEntries());
			});

			try {
				tracker.observe({type: 'resource', buffered: true});
			}
			catch (error) {
				tracker.observe({entryTypes: ['resource']});
			}
		}

		function untrack () {
			if (tracker)
				tracker.disconnect();

			tracker = null;
		}

		function hide () {
			var element = node();
			if (!element || element === hidden) return;

			if (element.hasAttribute('data-progress') && !manual)
				show(100);

			untrack();

			hidden = element;
			shown = -1;
			manual = false;
			counted = {};
			loaded = 0;

			global.setTimeout(function () {
				element.classList.add('elemenx-splash-out');

				global.setTimeout(function () {
					if (element.parentNode)
						element.parentNode.removeChild(element);
				}, 300);
			}, Math.max(0, (Number(element.getAttribute('data-min')) || 0) - since()));
		}

		/* The latest the splash stays: its data-timeout, once the page has it. */
		function limit () {
			var element = node();
			var timeout = element ? Number(element.getAttribute('data-timeout')) || 0 : 0;
			if (timeout > 0)
				global.setTimeout(hide, Math.max(0, timeout - since()));

			track();
		}

		Runtime.Splash = {
			Ready: function () {
				if (!held)
					hide();
			}
		};

		Elemenx.Splash = {
			Hold: function () {
				held++;

				track();

				return Elemenx.Splash;
			},
			Progress: function (percent) {
				if (!arguments.length)
					return shown < 0 ? null : shown;

				manual = true;

				untrack();

				show(percent);

				return Elemenx.Splash;
			},
			Hide: function () {
				held = 0;

				hide();

				return Elemenx.Splash;
			},
			Visible: function () {
				var element = node();

				return !!element && element !== hidden;
			}
		};

		if (Runtime.HasDOM && global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', limit);
		else limit();
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Motion */
	(function (global) {
		'use strict';

		/*
		 * The endless animations of Elemenx (a spinner, a skeleton, a pulse: the names of the framework, elemenx-*) rest
		 * while their element is out of the viewport. One that runs anywhere on a long page made the browser walk and
		 * paint the whole page at every frame: a page of many of them took a whole core while nothing on it moved for the
		 * reader. An animation of the application (another name) is left as it is.
		 */

		if (!Runtime.HasDOM || typeof global.IntersectionObserver !== 'function' || !global.Element || !global.Element.prototype.getAnimations) return;

		var watched = new WeakSet();
		var hidden = new WeakSet();
		var rested = new WeakSet();
		var observer;

		/* The endless animations of the framework on element and on its pseudo-elements (::after), not on its children. */
		function endless (element) {
			return element.getAnimations({subtree: true}).filter(function (animation) {
				var effect = animation.effect;

				return effect && effect.target === element && /^elemenx-/.test(animation.animationName || '') && effect.getTiming().iterations === Number.POSITIVE_INFINITY;
			});
		}

		function rest (animation) {
			if (animation.playState !== 'running') return;

			animation.pause();

			rested.add(animation);
		}

		function wake (animation) {
			if (!rested.has(animation)) return;

			rested.delete(animation);

			if (animation.playState === 'paused')
				animation.play();
		}

		function forget (element) {
			observer.unobserve(element);

			watched.delete(element);
			hidden.delete(element);
		}

		observer = new global.IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				var element = entry.target;
				var list = element.isConnected ? endless(element) : [];

				if (!list.length) {
					forget(element);

					return;
				}

				if (entry.isIntersecting) hidden.delete(element);
				else hidden.add(element);

				list.forEach(entry.isIntersecting ? wake : rest);
			});
		});

		/* An animation that starts on an element out of the viewport rests at once; the observer tells the first answer. */
		global.document.addEventListener('animationstart', function (event) {
			var element = event.target;
			if (!/^elemenx-/.test(event.animationName || '') || !element || element.nodeType !== 1) return;

			if (!watched.has(element)) {
				watched.add(element);

				observer.observe(element);

				return;
			}

			if (hidden.has(element))
				endless(element).forEach(rest);
		}, true);
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Compilers */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		/* name: {Name, From, To, Compile(job, done)}, in the order they were defined. */
		var transitions = {};
		var order = [];
		/* name: a text language, the data its code is written by. */
		var languages = {};

		/*
		 * The IR, what every front end gives and every back end reads: a module {Functions: [{Name, Params: [{Name, Type}],
		 * Returns, Body}], Entry}. A body is a list of statements: {Op: 'let', Name, Type, Value}, {Op: 'set', Name, Value},
		 * {Op: 'if', Test, Then, Else}, {Op: 'loop', Var, From, To, Body} (Var from From up to To, not it), {Op: 'each', Var,
		 * List, Body}, {Op: 'push', List, Value}, {Op: 'return', Value}, {Op: 'expr', Value}. An expression: {Op: 'const',
		 * Value, Type}, {Op: 'var', Name}, {Op: 'call', Name, Args} (a function of the module, or one of the language),
		 * {Op: 'bin', Operator (+ - * / % < <= > >= == != && ||), A, B}, {Op: 'un', Operator (- !), A}, {Op: 'list', Items,
		 * Type}, {Op: 'index', List, At}, {Op: 'length', List}, {Op: 'field', Object, Key}, {Op: 'record', Fields: {key:
		 * expression}}, {Op: 'select', Test, A, B}. Types: float, int, bool, text, vec2, vec3, vec4, list (of anything),
		 * record, any, floats (a list of numbers: index and length of it in every language, of numbers too: wasm keeps it in
		 * its memory, glsl as rt_floats). Arithmetic on vectors is each of their numbers (a number with a vector: the number for
		 * each).
		 */
		/* floats: a list of numbers, of what a back end of numbers holds too (wasm: in its memory; glsl: rt_floats of RT_CAP). */
		var Types = ['float', 'int', 'bool', 'text', 'vec2', 'vec3', 'vec4', 'list', 'record', 'any', 'void', 'floats'];
		var Statements = ['let', 'set', 'if', 'loop', 'each', 'push', 'return', 'expr'];
		var Expressions = ['const', 'var', 'call', 'bin', 'un', 'list', 'index', 'length', 'field', 'record', 'select'];
		var Binary = ['+', '-', '*', '/', '%', '<', '<=', '>', '>=', '==', '!=', '&&', '||', '&', '|', '^', '<<', '>>', '>>>'];
		/* Of int: its 32 bits (>>> fills with nought from the left). */
		var Bits = ['&', '|', '^', '<<', '>>', '>>>'];
		/* The functions every language has, by the types of what they give. */
		var Builtins = {
			sin: 'float', cos: 'float', tan: 'float', asin: 'float', acos: 'float', atan: 'float', atan2: 'float', sqrt: 'float',
			pow: 'float', exp: 'float', log: 'float', abs: 'float', floor: 'float', ceil: 'float', round: 'float', fract: 'float',
			min: 'float', max: 'float', clamp: 'float', mix: 'float', step: 'float', smoothstep: 'float', sign: 'float',
			vec2: 'vec2', vec3: 'vec3', vec4: 'vec4', dot: 'float', cross: 'vec3', length: 'float', normalize: 'vec3',
			distance: 'float', x: 'float', y: 'float', z: 'float', w: 'float', random: 'float', hash: 'float', text: 'text',
			/* Of the values of a graph: each(op, a, b) by each number (a number goes with each part), cast(value, type), get(record, key, default). */
			each: 'any', cast: 'any', get: 'any',
			/* Of what has no type told: isList(value), has(record, key), ends(text, end), cut(text, count): the text without its last count characters. */
			isList: 'bool', has: 'bool', ends: 'bool', cut: 'text',
			/* Of numbers of 32 bits: toInt(x) (its whole part, as many times 2^32 off as it takes, as JavaScript's x | 0), toFloat(i), trunc(x), ldexp(x, k) (x times 2^k), ilogb(x) (the k of 2^k under x). */
			toInt: 'int', toFloat: 'float', trunc: 'float', ldexp: 'float', ilogb: 'int'
		};

		function vector (type) {
			return type === 'vec2' || type === 'vec3' || type === 'vec4';
		}

		function told (diagnostics, text, place) {
			diagnostics.push({File: place && place.File || '', Line: place && place.Line || 0, Column: place && place.Column || 0, Severity: 'error', Text: text});
		}

		/* The type of an expression, its variables in scope ({name: type}); unknown parts are told in diagnostics. */
		function typeOf (expression, scope, module, diagnostics) {
			var item = expression || {};
			var found;
			var a;
			var b;

			if (Expressions.indexOf(item.Op) === -1) {
				told(diagnostics, 'Elemenx IR: no expression ' + item.Op);

				return 'any';
			}

			if (item.Op === 'const')
				return item.Type || (typeof item.Value === 'boolean' ? 'bool' : typeof item.Value === 'string' ? 'text' : Array.isArray(item.Value) ? (item.Value.length >= 2 && item.Value.length <= 4 ? 'vec' + item.Value.length : 'list') : 'float');

			if (item.Op === 'var') {
				/* In scope: its own or of a scope round it (the scopes of bodies are made of the ones round them). */
				if (!(item.Name in scope))
					told(diagnostics, 'Elemenx IR: no variable ' + item.Name);

				return item.Name in scope ? scope[item.Name] : 'any';
			}

			if (item.Op === 'call') {
				(item.Args || []).forEach(function (arg) {
					typeOf(arg, scope, module, diagnostics);
				});

				found = module.Functions.filter(function (one) {
					return one.Name === item.Name;
				})[0];

				if (found)
					return found.Returns || 'void';

				if (own(Builtins, item.Name)) {
					a = item.Args && item.Args.length ? typeOf(item.Args[0], scope, module, []) : 'float';

					/* What works on each number gives what it was given: abs of a vec3 a vec3. */
					return Builtins[item.Name] === 'float' && vector(a) && ['dot', 'length', 'distance', 'x', 'y', 'z', 'w'].indexOf(item.Name) === -1 ? a : Builtins[item.Name];
				}

				told(diagnostics, 'Elemenx IR: no function ' + item.Name);

				return 'any';
			}

			if (item.Op === 'bin') {
				if (Binary.indexOf(item.Operator) === -1)
					told(diagnostics, 'Elemenx IR: no operator ' + item.Operator);

				a = typeOf(item.A, scope, module, diagnostics);
				b = typeOf(item.B, scope, module, diagnostics);

				if (['<', '<=', '>', '>=', '==', '!=', '&&', '||'].indexOf(item.Operator) !== -1) return 'bool';

				if (Bits.indexOf(item.Operator) !== -1) return 'int';

				if (vector(a)) return a;

				if (vector(b)) return b;

				return a === 'int' && b === 'int' ? 'int' : a === 'text' || b === 'text' ? 'text' : 'float';
			}

			if (item.Op === 'un')
				return item.Operator === '!' ? 'bool' : typeOf(item.A, scope, module, diagnostics);

			if (item.Op === 'list') {
				(item.Items || []).forEach(function (one) {
					typeOf(one, scope, module, diagnostics);
				});

				return 'list';
			}

			if (item.Op === 'index') {
				typeOf(item.At, scope, module, diagnostics);

				a = typeOf(item.List, scope, module, diagnostics);

				return vector(a) || a === 'floats' ? 'float' : item.Type || 'any';
			}

			if (item.Op === 'length') {
				typeOf(item.List, scope, module, diagnostics);

				return 'int';
			}

			if (item.Op === 'field') {
				typeOf(item.Object, scope, module, diagnostics);

				return item.Type || 'any';
			}

			if (item.Op === 'record') {
				Object.keys(item.Fields || {}).forEach(function (key) {
					typeOf(item.Fields[key], scope, module, diagnostics);
				});

				return 'record';
			}

			typeOf(item.Test, scope, module, diagnostics);

			return typeOf(item.A, scope, module, diagnostics);
		}

		/* The statements of a body checked, the variables they declare added to their scope. */
		function checkBody (body, scope, module, fn, diagnostics) {
			(body || []).forEach(function (statement) {
				var inner;

				if (!statement || Statements.indexOf(statement.Op) === -1) {
					told(diagnostics, 'Elemenx IR: no statement ' + (statement && statement.Op) + ' in ' + fn.Name);

					return;
				}

				if (statement.Op === 'let') {
					if (Types.indexOf(statement.Type || typeOf(statement.Value, scope, module, diagnostics)) === -1)
						told(diagnostics, 'Elemenx IR: no type ' + statement.Type);

					scope[statement.Name] = statement.Type || typeOf(statement.Value, scope, module, diagnostics);
				}
				else if (statement.Op === 'set') {
					if (!(statement.Name in scope))
						told(diagnostics, 'Elemenx IR: no variable ' + statement.Name + ' in ' + fn.Name);

					typeOf(statement.Value, scope, module, diagnostics);
				}
				else if (statement.Op === 'if') {
					typeOf(statement.Test, scope, module, diagnostics);

					checkBody(statement.Then, Object.create(scope), module, fn, diagnostics);
					checkBody(statement.Else, Object.create(scope), module, fn, diagnostics);
				}
				else if (statement.Op === 'loop' || statement.Op === 'each') {
					inner = Object.create(scope);

					if (statement.Op === 'loop') {
						typeOf(statement.From, scope, module, diagnostics);
						typeOf(statement.To, scope, module, diagnostics);
					}
					else {
						typeOf(statement.List, scope, module, diagnostics);
					}

					inner[statement.Var] = statement.Op === 'loop' ? 'int' : statement.Type || 'any';

					checkBody(statement.Body, inner, module, fn, diagnostics);
				}
				else if (statement.Op === 'push') {
					typeOf(statement.List, scope, module, diagnostics);
					typeOf(statement.Value, scope, module, diagnostics);
				}
				else if (statement.Value) {
					typeOf(statement.Value, scope, module, diagnostics);
				}
			});
		}

		/* Whether a module is whole: its functions, their statements and expressions, the types of what they declare. */
		function check (module) {
			var diagnostics = [];
			var names = {};

			if (!module || !Array.isArray(module.Functions)) {
				told(diagnostics, 'Elemenx IR: a module has Functions');

				return diagnostics;
			}

			module.Functions.forEach(function (fn) {
				var scope = {};

				if (!fn.Name || own(names, fn.Name))
					told(diagnostics, 'Elemenx IR: a function needs a name of its own: ' + fn.Name);

				names[fn.Name] = true;

				(fn.Params || []).forEach(function (param) {
					scope[param.Name] = param.Type || 'any';
				});

				checkBody(fn.Body, scope, module, fn, diagnostics);
			});

			if (module.Entry && !own(names, module.Entry))
				told(diagnostics, 'Elemenx IR: no entry ' + module.Entry);

			return diagnostics;
		}

		/* The functions that call themselves, by others or not: those a back end keeps from going too deep. */
		function recursive (module) {
			var calls = {};
			var found = {};

			function walk (value, list) {
				if (!value || typeof value !== 'object') return;

				if (Array.isArray(value)) {
					value.forEach(function (one) {
						walk(one, list);
					});

					return;
				}

				if (value.Op === 'call')
					list.push(value.Name);

				Object.keys(value).forEach(function (key) {
					walk(value[key], list);
				});
			}

			module.Functions.forEach(function (fn) {
				calls[fn.Name] = [];

				walk(fn.Body, calls[fn.Name]);
			});

			Object.keys(calls).forEach(function (name) {
				var seen = {};
				var stack = calls[name].slice();

				while (stack.length) {
					var next = stack.pop();

					if (next === name) {
						found[name] = true;

						break;
					}

					if (own(seen, next) || !own(calls, next)) continue;

					seen[next] = true;
					stack = stack.concat(calls[next]);
				}
			});

			return found;
		}

		/* The operators of a language for int with int, where they wrap round. */
		var IntOperators = {'+': 'IntAdd', '-': 'IntSubtract', '*': 'IntMultiply', '%': 'IntModulo'};

		/* A template of a language filled: {name} by what is given. */
		function fill (template, values) {
			return String(template).replace(/\{(\w+)\}/g, function (whole, key) {
				return own(values, key) ? String(values[key]) : whole;
			});
		}

		/*
		 * The code of a module in a text language (its data: Types, Literals, Operators, Vectors, Builtins, Statements,
		 * Function, Prototype, Runtime, Module), lines indented by tabs. options: MaxDepth (how deep a function that calls
		 * itself may go, 256).
		 */
		function emit (module, language, options) {
			var lines = [];
			/* The lists of numbers of the module, each a constant of it once (Statements.Constant): not made again at each call. */
			var constants = [];
			var constantNames = {};
			var settings = options || {};
			var deep = recursive(module);
			var diagnostics = [];

			function literal (value, type) {
				if (type === 'floats') {
					return language.Literals.Floats ? language.Literals.Floats(value.map(function (one) {
						return literal(Number(one), 'float');
					}), settings) : fill(language.Expressions.List, {items: value.map(function (one) {
						return literal(Number(one), 'float');
					}).join(', ')});
				}

				if (type === 'bool' || typeof value === 'boolean')
					return value ? language.Literals.True : language.Literals.False;

				if (type === 'text' || typeof value === 'string') return JSON.stringify(String(value));

				if (Array.isArray(value)) {
					return fill(language.Vectors[type || 'vec' + value.length] || language.Expressions.List, {items: value.map(function (one) {
						return literal(one, 'float');
					}).join(', '), x: literal(value[0], 'float'), y: literal(value[1], 'float'), z: literal(value[2], 'float'), w: literal(value[3], 'float')});
				}

				if (type === 'int')
					return String(Math.round(Number(value) || 0));

				if (typeof value === 'number' && !isFinite(value))
					return value !== value ? language.Literals.NaN || '(0 / 0)' : (value < 0 ? '(-' : '(') + (language.Literals.Infinity || 'Infinity') + ')';

				/* A whole number written with its exponent (1e+21) takes no .0 after it. */
				return fill(language.Literals.Float, {value: Number(value) === Math.round(Number(value)) && !/e/i.test(String(Number(value))) ? String(Number(value)) + language.Literals.Whole : String(Number(value))});
			}

			function expression (item, scope) {
				var a;
				var b;
				var ta;
				var tb;
				var template;

				if (item.Op === 'const' && item.Type === 'floats' && language.Statements.Constant) {
					var text = literal(item.Value || [], 'floats');

					if (!own(constantNames, text)) {
						constantNames[text] = 'rt_c' + constants.length;

						constants.push(fill(language.Statements.Constant, {name: constantNames[text], value: text}));
					}

					return constantNames[text];
				}

				if (item.Op === 'const')
					return literal(item.Value, item.Type);

				if (item.Op === 'var')
					return language.Name(item.Name);

				if (item.Op === 'call') {
					var args = (item.Args || []).map(function (arg) {
						return expression(arg, scope);
					});
					var typed = item.Args && item.Args.length ? typeOf(item.Args[0], scope, module, diagnostics) : 'float';

					template = own(language.Builtins, item.Name + ':' + typed) ? language.Builtins[item.Name + ':' + typed] : language.Builtins[item.Name];

					if (template && !module.Functions.some(function (fn) {
						return fn.Name === item.Name;
					})) {
						return fill(template, args.reduce(function (made, arg, index) {
							made[index] = arg;

							return made;
						}, {args: args.join(', ')}));
					}

					return fill(language.Expressions.Call, {name: language.Name(item.Name), args: args.join(', ')});
				}

				if (item.Op === 'bin') {
					a = expression(item.A, scope);
					b = expression(item.B, scope);
					ta = typeOf(item.A, scope, module, diagnostics);
					tb = typeOf(item.B, scope, module, diagnostics);

					/* Arithmetic of vectors: by the vector operations of the language, a number spread over a vector. */
					if ((vector(ta) || vector(tb)) && '+-*/'.indexOf(item.Operator) !== -1 && language.Vectors.Operators) {
						return fill(language.Vectors.Operators[item.Operator], {a: a, b: b, type: vector(ta) ? ta : tb, ta: ta, tb: tb});
					}

					template = language.Operators[item.Operator];

					if (item.Operator === '/' && ta === 'int' && tb === 'int' && language.Operators.IntDivide)
						template = language.Operators.IntDivide;

					/* Whole numbers of 32 bits wrap round, as in C and in wasm: a hash of them is the same in each. */
					if (ta === 'int' && tb === 'int' && own(IntOperators, item.Operator) && language.Operators[IntOperators[item.Operator]])
						template = language.Operators[IntOperators[item.Operator]];

					return fill(template, {a: a, b: b});
				}

				if (item.Op === 'un')
					return fill(language.Operators[item.Operator === '!' ? 'Not' : 'Negate'], {a: expression(item.A, scope)});

				if (item.Op === 'list') {
					return fill(language.Expressions.List, {items: (item.Items || []).map(function (one) {
						return expression(one, scope);
					}).join(', ')});
				}

				if (item.Op === 'index')
					return fill(typeOf(item.List, scope, module, diagnostics) === 'floats' && language.Expressions.IndexFloats || language.Expressions.Index, {list: expression(item.List, scope), at: expression(item.At, scope)});

				if (item.Op === 'length')
					return fill(typeOf(item.List, scope, module, diagnostics) === 'floats' && language.Expressions.LengthFloats || language.Expressions.Length, {list: expression(item.List, scope)});

				if (item.Op === 'field')
					return fill(language.Expressions.Field, {object: expression(item.Object, scope), key: item.Key, quoted: JSON.stringify(String(item.Key))});

				if (item.Op === 'record') {
					return fill(language.Expressions.Record, {fields: Object.keys(item.Fields || {}).map(function (key) {
						return fill(language.Expressions.RecordField, {key: key, quoted: JSON.stringify(key), value: expression(item.Fields[key], scope)});
					}).join(', ')});
				}

				return fill(language.Expressions.Select, {test: expression(item.Test, scope), a: expression(item.A, scope), b: expression(item.B, scope)});
			}

			function line (depth, text) {
				lines.push(new Array(depth + 1).join('\t') + text);
			}

			function body (list, scope, depth, fn) {
				(list || []).forEach(function (statement) {
					var inner;
					var type;

					if (statement.Op === 'let') {
						type = statement.Type || typeOf(statement.Value, scope, module, diagnostics);
						scope[statement.Name] = type;

						line(depth, fill(language.Statements.Let, {type: language.Types[type] || language.Types.any, name: language.Name(statement.Name), value: expression(statement.Value, scope)}));
					}
					else if (statement.Op === 'set') {
						line(depth, fill(language.Statements.Set, {name: language.Name(statement.Name), value: expression(statement.Value, scope)}));
					}
					else if (statement.Op === 'if') {
						line(depth, fill(language.Statements.If, {test: expression(statement.Test, scope)}));

						body(statement.Then, Object.create(scope), depth + 1, fn);

						if (statement.Else && statement.Else.length) {
							line(depth, language.Statements.Else);

							body(statement.Else, Object.create(scope), depth + 1, fn);
						}

						line(depth, language.Statements.End);
					}
					else if (statement.Op === 'loop') {
						inner = Object.create(scope);
						inner[statement.Var] = 'int';

						line(depth, fill(language.Statements.Loop, {int: language.Types.int, var: language.Name(statement.Var), end: language.Name(statement.Var + '_to'), from: expression(statement.From, scope), to: expression(statement.To, scope)}));

						body(statement.Body, inner, depth + 1, fn);

						line(depth, language.Statements.End);
					}
					else if (statement.Op === 'each') {
						inner = Object.create(scope);
						inner[statement.Var] = statement.Type || 'any';

						/* Its list and its end told once: a list of a call is not made again at each step (Regression: m_flat of m_flat went exponential). */
						line(depth, fill(language.Statements.Each, {type: language.Types[statement.Type || 'any'], var: language.Name(statement.Var), list: expression(statement.List, scope), of: language.Name(statement.Var + '_of'), index: language.Name(statement.Var + '_at')}));

						body(statement.Body, inner, depth + 1, fn);

						line(depth, language.Statements.End);
					}
					else if (statement.Op === 'push') {
						line(depth, fill(language.Statements.Push, {list: expression(statement.List, scope), value: expression(statement.Value, scope)}));
					}
					else if (statement.Op === 'return') {
						line(depth, fill(statement.Value ? language.Statements.Return : language.Statements.ReturnNothing, {value: statement.Value ? expression(statement.Value, scope) : ''}));
					}
					else {
						line(depth, fill(language.Statements.Expr, {value: expression(statement.Value, scope)}));
					}
				});
			}

			function signature (fn, template) {
				return fill(template, {returns: language.Types[fn.Returns || 'void'] || language.Types.any, name: language.Name(fn.Name), params: (fn.Params || []).map(function (param) {
					return fill(language.Param, {type: language.Types[param.Type || 'any'] || language.Types.any, name: language.Name(param.Name)});
				}).join(', ')});
			}

			/*
			 * Once (Options.Once, a language of directives: glsl): each function, its prototype too, only when no module before it
			 * in the same text made it (ENX_<name>): modules of graphs and the noise of the Noise Service side by side in a shader.
			 */
			var once = !!(settings.Once && language.Directives);

			if (language.Prototype) {
				module.Functions.forEach(function (fn) {
					if (once)
						line(0, '#ifndef ENX_' + language.Name(fn.Name));

					line(0, signature(fn, language.Prototype));

					if (once)
						line(0, '#endif');
				});
			}

			module.Functions.forEach(function (fn) {
				var scope = {};

				(fn.Params || []).forEach(function (param) {
					scope[param.Name] = param.Type || 'any';
				});

				if (once)
					line(0, '#ifndef ENX_' + language.Name(fn.Name) + '\n#define ENX_' + language.Name(fn.Name));

				line(0, signature(fn, language.Function));

				/* One that calls itself: as deep as MaxDepth, then an error, not a stack gone. */
				if (deep[fn.Name] && language.Guard) {
					line(1, fill(language.Guard.Enter, {max: Number(settings.MaxDepth) || 256, name: JSON.stringify(fn.Name)}));

					body(fn.Body, scope, 2, fn);

					line(1, language.Guard.Leave);
				}
				else {
					body(fn.Body, scope, 1, fn);
				}

				line(0, language.Statements.End);

				if (once)
					line(0, '#endif');
			});

			return {Text: fill(language.Module, {runtime: typeof language.Runtime === 'function' ? language.Runtime(settings) : language.Runtime || '', functions: constants.concat(lines).join('\n'), entry: language.Name(module.Entry || (module.Functions[0] && module.Functions[0].Name) || ''), names: module.Functions.map(function (fn) {
				return fill(language.Export || '{name}', {name: language.Name(fn.Name), key: JSON.stringify(fn.Name)});
			}).join(', ')}), Diagnostics: diagnostics};
		}

		/*
		 * JavaScript of ES5: vectors are arrays, lists arrays, records objects. Its module is the text of a function body
		 * that returns {name: function} of the module (Elemenx.Compilers.Load makes them).
		 */
		var javascript = {
			Name: function (name) {
				return 'f_' + String(name).replace(/[^A-Za-z0-9_]/g, '_');
			},
			Types: {float: 'var', int: 'var', bool: 'var', text: 'var', vec2: 'var', vec3: 'var', vec4: 'var', list: 'var', record: 'var', any: 'var', void: '', floats: 'var'},
			Literals: {True: 'true', False: 'false', Float: '{value}', Whole: ''},
			Operators: {'+': '({a} + {b})', '-': '({a} - {b})', '*': '({a} * {b})', '/': '({a} / {b})', '%': '({a} % {b})', IntDivide: '(({a} / {b}) | 0)', IntAdd: '(({a} + {b}) | 0)', IntSubtract: '(({a} - {b}) | 0)', IntMultiply: 'Math.imul({a}, {b})', '&': '({a} & {b})', '|': '({a} | {b})', '^': '({a} ^ {b})', '<<': '({a} << {b})', '>>': '({a} >> {b})', '>>>': '(({a} >>> {b}) | 0)', '<': '({a} < {b})', '<=': '({a} <= {b})', '>': '({a} > {b})', '>=': '({a} >= {b})', '==': '({a} === {b})', '!=': '({a} !== {b})', '&&': '({a} && {b})', '||': '({a} || {b})', Not: '(!{a})', Negate: '(-{a})'},
			Vectors: {vec2: '[{x}, {y}]', vec3: '[{x}, {y}, {z}]', vec4: '[{x}, {y}, {z}, {w}]', Operators: {'+': 'rt_op({a}, {b}, 0)', '-': 'rt_op({a}, {b}, 1)', '*': 'rt_op({a}, {b}, 2)', '/': 'rt_op({a}, {b}, 3)'}},
			Builtins: {
				sin: 'rt_each(Math.sin, {0})', cos: 'rt_each(Math.cos, {0})', tan: 'Math.tan({0})', asin: 'Math.asin({0})', acos: 'Math.acos({0})', atan: 'Math.atan({0})', atan2: 'Math.atan2({0}, {1})',
				sqrt: 'rt_each(Math.sqrt, {0})', pow: 'Math.pow({0}, {1})', exp: 'Math.exp({0})', log: 'Math.log({0})', abs: 'rt_each(Math.abs, {0})', floor: 'rt_each(Math.floor, {0})', ceil: 'rt_each(Math.ceil, {0})',
				round: 'rt_each(Math.round, {0})', fract: 'rt_each(rt_fract, {0})', min: 'Math.min({0}, {1})', max: 'Math.max({0}, {1})', clamp: 'Math.min(Math.max({0}, {1}), {2})',
				mix: 'rt_mix({0}, {1}, {2})', step: '({1} < {0} ? 0 : 1)', smoothstep: 'rt_smooth({0}, {1}, {2})', sign: 'rt_each(rt_sign, {0})',
				vec2: '[{0}, {1}]', vec3: '[{0}, {1}, {2}]', vec4: '[{0}, {1}, {2}, {3}]', dot: 'rt_dot({0}, {1})', cross: 'rt_cross({0}, {1})', length: 'Math.sqrt(rt_dot({0}, {0}))',
				normalize: 'rt_op({0}, Math.sqrt(rt_dot({0}, {0})) || 1, 3)', distance: 'Math.sqrt(rt_dot(rt_op({0}, {1}, 1), rt_op({0}, {1}, 1)))', x: '{0}[0]', y: '{0}[1]', z: '{0}[2]', w: '{0}[3]',
				random: 'rt_random({0})', hash: 'rt_hash(rt_key({0}), rt_key({1}))', text: 'String({0})',
				each: 'rt_e({0}, {1}, {2})', cast: 'rt_cast({0}, {1})', get: 'rt_get({args})',
				isList: 'Array.isArray({0})', has: '(!!{0} && typeof {0} === "object" && Object.prototype.hasOwnProperty.call({0}, {1}))', ends: '(String({0}).slice(-String({1}).length) === String({1}))', cut: 'String({0}).slice(0, -({1}))',
				toInt: '({0} | 0)', toFloat: '(+{0})', trunc: 'rt_each(rt_trunc, {0})', ldexp: 'rt_ldexp({0}, {1})', ilogb: 'rt_ilogb({0})',
				/* Of a number (the type of the first argument after the colon): no test of a vector at each call. */
				'abs:float': 'Math.abs({0})', 'floor:float': 'Math.floor({0})', 'ceil:float': 'Math.ceil({0})', 'sqrt:float': 'Math.sqrt({0})', 'trunc:float': 'rt_trunc({0})', 'fract:float': 'rt_fract({0})', 'sign:float': 'rt_sign({0})', 'mix:float': 'rt_mixf({0}, {1}, {2})', 'abs:int': 'Math.abs({0})', 'floor:int': 'Math.floor({0})', 'ceil:int': 'Math.ceil({0})', 'sqrt:int': 'Math.sqrt({0})', 'trunc:int': 'rt_trunc({0})', 'fract:int': 'rt_fract({0})', 'sign:int': 'rt_sign({0})', 'mix:int': 'rt_mixf({0}, {1}, {2})'
			},
			/* sin, cos, tan, asin, acos, atan, atan2, exp, log, pow and round are the own ones of the runtime (OwnMath): the numbers of wasm. */
			OwnMath: true,
			Expressions: {Call: '{name}({args})', List: '[{items}]', Index: '{list}[{at}]', Length: '{list}.length', Field: '{object}[{quoted}]', Record: '{{fields}}', RecordField: '{quoted}: {value}', Select: '({test} ? {a} : {b})'},
			Statements: {Constant: 'var {name} = {value};', Let: 'var {name} = {value};', Set: '{name} = {value};', If: 'if ({test}) {', Else: '} else {', End: '}', Loop: 'for (var {var} = {from}, {end} = {to}; {var} < {end}; {var}++) {', Each: 'for (var {index} = 0, {of} = {list}, {var}; {index} < {of}.length; {index}++) { {var} = {of}[{index}];', Push: '{list}.push({value});', Return: 'return {value};', ReturnNothing: 'return;', Expr: '{value};'},
			Param: '{name}',
			Function: 'function {name}({params}) {',
			Guard: {Enter: 'if (++rt_depth > {max}) { rt_depth = 0; throw new Error("Elemenx IR: " + {name} + " goes deeper than {max}"); } try {', Leave: '} finally { rt_depth--; }'},
			Runtime: [
				'var rt_depth = 0;',
				'function rt_each(f, a) { return typeof a === "number" ? f(a) : a.map(function (v) { return f(v); }); }',
				'function rt_fract(v) { return v - Math.floor(v); }',
				'function rt_sign(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }',
				'function rt_op(a, b, o) { if (typeof a === "number" && typeof b === "number") return o === 0 ? a + b : o === 1 ? a - b : o === 2 ? a * b : a / b; var n = typeof a === "number" ? b.length : a.length, r = [], i, x, y; for (i = 0; i < n; i++) { x = typeof a === "number" ? a : a[i]; y = typeof b === "number" ? b : b[i]; r.push(o === 0 ? x + y : o === 1 ? x - y : o === 2 ? x * y : x / y); } return r; }',
				'function rt_dot(a, b) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }',
				'function rt_cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }',
				'function rt_mix(a, b, t) { return typeof a === "number" ? a + (b - a) * t : rt_op(a, rt_op(rt_op(b, a, 1), t, 2), 0); }',
				'function rt_smooth(e0, e1, x) { var t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1); return t * t * (3 - 2 * t); }',
				'function rt_hash(a, b) { var h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; return (h >>> 0) / 4294967296; }',
				'function rt_key(v) { var h = 0, i; if (typeof v === "number") return Math.round(v * 1000) | 0; v = String(v); for (i = 0; i < v.length; i++) h = (Math.imul(h, 31) + v.charCodeAt(i)) | 0; return h; }',
				'var rt_ops = {add: function (a, b) { return a + b; }, sub: function (a, b) { return a - b; }, mul: function (a, b) { return a * b; }, div: function (a, b) { return b ? a / b : 0; }, min: Math.min, max: Math.max, pow: function (a, b) { return f_m_pow(a, b); }, step: function (e, x) { return x < e ? 0 : 1; }, sin: function (x) { return f_m_sin(x); }, cos: function (x) { return f_m_cos(x); }, abs: Math.abs, floor: Math.floor, exp: function (x) { return f_m_exp(x); }, fract: function (x) { return x - Math.floor(x); }, sqrt: function (x) { return Math.sqrt(Math.max(0, x)); }, saturate: function (x) { return Math.max(0, Math.min(1, x)); }};',
				'function rt_e(op, a, b) { var f = rt_ops[op], n, r = [], i; if (!Array.isArray(a) && !Array.isArray(b)) return f(Number(a) || 0, Number(b) || 0); n = Math.max(Array.isArray(a) ? a.length : 0, Array.isArray(b) ? b.length : 0); for (i = 0; i < n; i++) r.push(f(Number(Array.isArray(a) ? a[i] : a) || 0, Number(Array.isArray(b) ? b[i] : b) || 0)); return r; }',
				'var rt_sizes = {float: 1, vec2: 2, vec3: 3, vec4: 4, int: 1, bool: 1};',
				'function rt_numbers(v, n) { var l, i; if (typeof v === "string" && /^#[0-9a-f]{6,8}$/i.test(v)) { l = []; for (i = 1; i < v.length; i += 2) l.push(parseInt(v.slice(i, i + 2), 16) / 255); } else if (Array.isArray(v)) { l = v.map(Number); } else { l = [Number(v) || 0]; while (l.length < n) l.push(l[0]); } while (l.length < n) l.push(n === 4 && l.length === 3 ? 1 : 0); return l.slice(0, n); }',
				'function rt_cast(v, to) { var n = rt_sizes[to], l; if (to === "text") return v == null ? "" : String(v); if (to === "bool") return Array.isArray(v) ? !!v[0] : !!v; if (!n) return v; if (typeof v === "string" && !/^#/.test(v)) return n === 1 ? Number(v) || 0 : rt_numbers(Number(v) || 0, n); l = rt_numbers(typeof v === "boolean" ? (v ? 1 : 0) : v, n); return n === 1 ? l[0] : l; }',
				'function rt_get(r, k, d) { return r && Object.prototype.hasOwnProperty.call(r, k) ? r[k] : d; }',
				'function rt_random(state) { state[0] = (state[0] + 0x6D2B79F5) >>> 0; var v = Math.imul(state[0] ^ (state[0] >>> 15), state[0] | 1); v ^= v + Math.imul(v ^ (v >>> 7), v | 61); return ((v ^ (v >>> 14)) >>> 0) / 4294967296; }',
				'function rt_trunc(v) { return v < 0 ? Math.ceil(v) : Math.floor(v); }',
				'function rt_mixf(a, b, t) { return a + (b - a) * t; }',
				'function rt_ldexp(x, k) { if (k > 1023) { x *= 8.98846567431158e307; k -= 1023; if (k > 1023) { x *= 8.98846567431158e307; k -= 1023; if (k > 1023) k = 1023; } } else if (k < -1022) { x *= 2.004168360008973e-292; k += 969; if (k < -1022) { x *= 2.004168360008973e-292; k += 969; if (k < -1022) k = -1022; } } return x * Math.pow(2, k); }',
				'var rt_bits = new DataView(new ArrayBuffer(8));',
				'function rt_ilogb(x) { var e; rt_bits.setFloat64(0, x); e = (rt_bits.getUint32(0) >>> 20) & 2047; if (e === 0) { rt_bits.setFloat64(0, x * 18014398509481984); return ((rt_bits.getUint32(0) >>> 20) & 2047) - 1077; } return e - 1023; }'
			].join('\n'),
			Export: '{key}: {name}',
			Module: '{runtime}\n{functions}\nreturn {{names}};'
		};

		/*
		 * C++ (17): vectors are vec2..vec4 of the runtime, lists std::vector<double>, records std::map<std::string, double>;
		 * what a board or a host builds (the front ends give it the IR, a compiler of the application makes it a binary).
		 */
		var cpp = {
			Name: function (name) {
				return 'f_' + String(name).replace(/[^A-Za-z0-9_]/g, '_');
			},
			Types: {float: 'double', int: 'int', bool: 'bool', text: 'std::string', vec2: 'vec2', vec3: 'vec3', vec4: 'vec4', list: 'std::vector<double>', record: 'std::map<std::string, double>', any: 'auto', void: 'void', floats: 'std::vector<double>'},
			Literals: {True: 'true', False: 'false', Float: '{value}', Whole: '.0', Infinity: 'INFINITY'},
			Operators: {'+': '({a} + {b})', '-': '({a} - {b})', '*': '({a} * {b})', '/': '({a} / {b})', '%': 'std::fmod({a}, {b})', IntAdd: '(int)((uint32_t){a} + (uint32_t){b})', IntSubtract: '(int)((uint32_t){a} - (uint32_t){b})', IntMultiply: '(int)((uint32_t){a} * (uint32_t){b})', '&': '({a} & {b})', '|': '({a} | {b})', '^': '({a} ^ {b})', '<<': '(int)((uint32_t){a} << {b})', '>>': '({a} >> {b})', '>>>': '(int)((uint32_t){a} >> {b})', '<': '({a} < {b})', '<=': '({a} <= {b})', '>': '({a} > {b})', '>=': '({a} >= {b})', '==': '({a} == {b})', '!=': '({a} != {b})', '&&': '({a} && {b})', '||': '({a} || {b})', Not: '(!{a})', Negate: '(-{a})'},
			Vectors: {vec2: 'vec2{{x}, {y}}', vec3: 'vec3{{x}, {y}, {z}}', vec4: 'vec4{{x}, {y}, {z}, {w}}', Operators: {'+': '({a} + {b})', '-': '({a} - {b})', '*': '({a} * {b})', '/': '({a} / {b})'}},
			Builtins: {
				sin: 'std::sin({0})', cos: 'std::cos({0})', tan: 'std::tan({0})', asin: 'std::asin({0})', acos: 'std::acos({0})', atan: 'std::atan({0})', atan2: 'std::atan2({0}, {1})',
				sqrt: 'std::sqrt({0})', pow: 'std::pow({0}, {1})', exp: 'std::exp({0})', log: 'std::log({0})', abs: 'std::abs({0})', floor: 'std::floor({0})', ceil: 'std::ceil({0})',
				round: 'std::round({0})', fract: 'rt_fract({0})', min: 'std::min<double>({0}, {1})', max: 'std::max<double>({0}, {1})', clamp: 'std::min<double>(std::max<double>({0}, {1}), {2})',
				mix: '({0} + ({1} - {0}) * {2})', step: '({1} < {0} ? 0.0 : 1.0)', smoothstep: 'rt_smooth({0}, {1}, {2})', sign: '(({0} > 0) - ({0} < 0))',
				vec2: 'vec2{{0}, {1}}', vec3: 'vec3{{0}, {1}, {2}}', vec4: 'vec4{{0}, {1}, {2}, {3}}', dot: 'dot({0}, {1})', cross: 'cross({0}, {1})', length: 'std::sqrt(dot({0}, {0}))',
				normalize: '({0} / std::sqrt(dot({0}, {0})))', distance: 'std::sqrt(dot({0} - {1}, {0} - {1}))', x: '{0}.x', y: '{0}.y', z: '{0}.z', w: '{0}.w',
				random: 'rt_random({0})', hash: 'rt_hash({0}, {1})', text: 'std::to_string({0})',
				each: 'rt_e({0}, {1}, {2})', cast: '({0})', get: '{0}[{1}]',
				toInt: '(int)({0})', toFloat: '(double)({0})', trunc: 'std::trunc({0})', ldexp: 'std::ldexp({0}, {1})', ilogb: 'std::ilogb({0})',
				isList: 'true', has: '({0}.count({1}) > 0)', ends: '({0}.size() >= {1}.size() && {0}.compare({0}.size() - {1}.size(), {1}.size(), {1}) == 0)', cut: '{0}.substr(0, {0}.size() - {1})'
			},
			Expressions: {Call: '{name}({args})', List: 'std::vector<double>{{items}}', Index: '{list}[{at}]', Length: '(int){list}.size()', Field: '{object}["{key}"]', Record: 'std::map<std::string, double>{{fields}}', RecordField: '{"{key}", {value}}', Select: '({test} ? {a} : {b})'},
			Statements: {Let: '{type} {name} = {value};', Set: '{name} = {value};', If: 'if ({test}) {', Else: '} else {', End: '}', Loop: 'for ({int} {var} = {from}; {var} < {to}; {var}++) {', Each: 'for (auto {var} : {list}) {', Push: '{list}.push_back({value});', Return: 'return {value};', ReturnNothing: 'return;', Expr: '{value};'},
			Param: '{type} {name}',
			Function: '{returns} {name}({params}) {',
			Prototype: '{returns} {name}({params});',
			Guard: {Enter: 'struct rt_guard { rt_guard() { if (++rt_depth > {max}) throw std::runtime_error("deeper than {max}"); } ~rt_guard() { rt_depth--; } } rt_kept; {', Leave: '}'},
			Runtime: [
				'#include <cmath>',
				'#include <cstdint>',
				'#include <map>',
				'#include <stdexcept>',
				'#include <string>',
				'#include <vector>',
				'#include <algorithm>',
				'static int rt_depth = 0;',
				'struct vec2 { double x, y; };',
				'struct vec3 { double x, y, z; };',
				'struct vec4 { double x, y, z, w; };',
				'inline vec2 operator+(vec2 a, vec2 b) { return {a.x + b.x, a.y + b.y}; }',
				'inline vec2 operator-(vec2 a, vec2 b) { return {a.x - b.x, a.y - b.y}; }',
				'inline vec2 operator*(vec2 a, double k) { return {a.x * k, a.y * k}; }',
				'inline vec2 operator/(vec2 a, double k) { return {a.x / k, a.y / k}; }',
				'inline vec3 operator+(vec3 a, vec3 b) { return {a.x + b.x, a.y + b.y, a.z + b.z}; }',
				'inline vec3 operator-(vec3 a, vec3 b) { return {a.x - b.x, a.y - b.y, a.z - b.z}; }',
				'inline vec3 operator*(vec3 a, vec3 b) { return {a.x * b.x, a.y * b.y, a.z * b.z}; }',
				'inline vec3 operator*(vec3 a, double k) { return {a.x * k, a.y * k, a.z * k}; }',
				'inline vec3 operator*(double k, vec3 a) { return a * k; }',
				'inline vec3 operator/(vec3 a, double k) { return {a.x / k, a.y / k, a.z / k}; }',
				'inline double dot(vec2 a, vec2 b) { return a.x * b.x + a.y * b.y; }',
				'inline double dot(vec3 a, vec3 b) { return a.x * b.x + a.y * b.y + a.z * b.z; }',
				'inline vec3 cross(vec3 a, vec3 b) { return {a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x}; }',
				'inline double rt_fract(double v) { return v - std::floor(v); }',
				'inline double rt_smooth(double e0, double e1, double x) { double t = std::min(std::max((x - e0) / (e1 - e0), 0.0), 1.0); return t * t * (3 - 2 * t); }',
				'inline double rt_hash(int a, int b) { uint32_t h = (uint32_t)(a ^ 0x9e3779b9) * 0x85ebca6bu ^ (uint32_t)(b + 0x632be5ab) * 0xc2b2ae35u; h ^= h >> 15; h *= 0x2c1b3c6du; h ^= h >> 12; return h / 4294967296.0; }',
				'inline double rt_e(const std::string& op, double a, double b) { if (op == "add") return a + b; if (op == "sub") return a - b; if (op == "mul") return a * b; if (op == "div") return b != 0 ? a / b : 0; if (op == "min") return std::min(a, b); if (op == "max") return std::max(a, b); if (op == "pow") return std::pow(a, b); if (op == "step") return b < a ? 0 : 1; if (op == "sin") return std::sin(a); if (op == "cos") return std::cos(a); if (op == "abs") return std::abs(a); if (op == "floor") return std::floor(a); if (op == "exp") return std::exp(a); if (op == "fract") return a - std::floor(a); if (op == "sqrt") return std::sqrt(std::max(0.0, a)); return std::min(1.0, std::max(0.0, a)); }',
				'inline double rt_random(std::vector<double>& state) { uint32_t s = (uint32_t)state[0] + 0x6D2B79F5u; state[0] = s; uint32_t v = (s ^ (s >> 15)) * (s | 1u); v ^= v + (v ^ (v >> 7)) * (v | 61u); return (v ^ (v >> 14)) / 4294967296.0; }'
			].join('\n'),
			Module: '{runtime}\n{functions}\n'
		};

		/*
		 * GLSL ES 3.00 (WebGL2): functions of numbers for a shader, the text of them to put in its source (no main; their
		 * names as Name gives them, f_ before). What the GPU computes in floats of 32 bits: the same formulas as js and wasm,
		 * not their numbers to the bit. Of numbers only (float, int, bool, vec2..vec4): a text, a list, a record, a call of
		 * itself (a shader has no stack) are told (Prepare: Elemenx glsl: <what> in <function> is not of numbers...), and int
		 * and float are made one or the other where they meet (GLSL mixes none of them by itself).
		 */
		var GlslTypes = {float: 'float', int: 'int', bool: 'bool', vec2: 'vec2', vec3: 'vec3', vec4: 'vec4', void: 'void', floats: 'rt_floats'};
		var GlslBuiltins = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'exp', 'log', 'round', 'hash'].concat(['abs', 'floor', 'ceil', 'sqrt', 'trunc', 'fract', 'sign', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep', 'vec2', 'vec3', 'vec4', 'dot', 'cross', 'length', 'normalize', 'distance', 'x', 'y', 'z', 'w', 'toInt', 'toFloat', 'ldexp', 'ilogb']);
		/* The functions of numbers that take floats: an int given to one is made a float. */
		var GlslFloats = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'pow', 'exp', 'log', 'round', 'abs', 'floor', 'ceil', 'sqrt', 'trunc', 'fract', 'sign', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep', 'vec2', 'vec3', 'vec4', 'dot', 'cross', 'length', 'normalize', 'distance', 'ilogb', 'hash'];

		var glsl = {
			Name: function (name) {
				/* Two underscores are kept for GLSL itself. */
				return 'f_' + String(name).replace(/[^A-Za-z0-9_]/g, '_').replace(/__/g, '_u_');
			},
			Types: {float: 'float', int: 'int', bool: 'bool', text: 'float', vec2: 'vec2', vec3: 'vec3', vec4: 'vec4', list: 'float', record: 'float', any: 'float', void: 'void', floats: 'rt_floats'},
			Literals: {True: 'true', False: 'false', Float: '{value}', Whole: '.0', Infinity: 'uintBitsToFloat(0x7F800000u)', NaN: 'uintBitsToFloat(0x7FC00000u)', Floats: function (items, options) {
				var cap = glslCap(options);
				var all = items.slice(0, cap);

				while (all.length < cap)
					all.push('0.0');

				return 'rt_floats(float[RT_CAP](' + all.join(', ') + '), ' + Math.min(cap, items.length) + ')';
			}},
			Operators: {'+': '({a} + {b})', '-': '({a} - {b})', '*': '({a} * {b})', '/': '({a} / {b})', '%': 'rt_fmod({a}, {b})', IntDivide: '({a} / {b})', IntModulo: 'rt_imod({a}, {b})', IntAdd: '({a} + {b})', IntSubtract: '({a} - {b})', IntMultiply: '({a} * {b})', '&': '({a} & {b})', '|': '({a} | {b})', '^': '({a} ^ {b})', '<<': '({a} << ({b} & 31))', '>>': '({a} >> ({b} & 31))', '>>>': 'rt_ushr({a}, {b})', '<': '({a} < {b})', '<=': '({a} <= {b})', '>': '({a} > {b})', '>=': '({a} >= {b})', '==': '({a} == {b})', '!=': '({a} != {b})', '&&': '({a} && {b})', '||': '({a} || {b})', Not: '(!{a})', Negate: '(-{a})'},
			Vectors: {vec2: 'vec2({x}, {y})', vec3: 'vec3({x}, {y}, {z})', vec4: 'vec4({x}, {y}, {z}, {w})', Operators: {'+': '({a} + {b})', '-': '({a} - {b})', '*': '({a} * {b})', '/': '({a} / {b})'}},
			Builtins: {
				sin: 'sin({0})', cos: 'cos({0})', tan: 'tan({0})', asin: 'asin({0})', acos: 'acos({0})', atan: 'atan({0})', atan2: 'atan({0}, {1})',
				sqrt: 'sqrt({0})', pow: 'pow({0}, {1})', exp: 'exp({0})', log: 'log({0})', abs: 'abs({0})', floor: 'floor({0})', ceil: 'ceil({0})',
				round: 'floor({0} + 0.5)', fract: 'fract({0})', min: 'min({0}, {1})', max: 'max({0}, {1})', clamp: 'clamp({0}, {1}, {2})',
				mix: 'mix({0}, {1}, {2})', step: 'step({0}, {1})', smoothstep: 'rt_smooth({0}, {1}, {2})', sign: 'sign({0})',
				vec2: 'vec2({args})', vec3: 'vec3({args})', vec4: 'vec4({args})', dot: 'dot({0}, {1})', cross: 'cross({0}, {1})', length: 'length({0})',
				normalize: 'rt_normalize({0})', distance: 'distance({0}, {1})', x: '{0}.x', y: '{0}.y', z: '{0}.z', w: '{0}.w',
				hash: 'rt_hash({0}, {1})', toInt: 'int({0})', toFloat: 'float({0})', trunc: 'trunc({0})', ldexp: 'rt_ldexp({0}, {1})', ilogb: 'rt_ilogb({0})',
				'abs:int': 'abs({0})', 'min:int': 'min({0}, {1})', 'max:int': 'max({0}, {1})', 'clamp:int': 'clamp({0}, {1}, {2})', 'sign:int': 'sign({0})'
			},
			Expressions: {Call: '{name}({args})', List: 'float[]({items})', Index: '{list}[{at}]', IndexFloats: '{list}.v[{at}]', Length: '{list}.length()', LengthFloats: '{list}.n', Field: '{object}', Record: '0.0', RecordField: '{value}', Select: '({test} ? {a} : {b})'},
			Statements: {Constant: 'const rt_floats {name} = {value};', Let: '{type} {name} = {value};', Set: '{name} = {value};', If: 'if ({test}) {', Else: '} else {', End: '}', Loop: 'for (int {var} = {from}, {end} = {to}; {var} < {end}; {var}++) {', Each: '{', Push: '', Return: 'return {value};', ReturnNothing: 'return;', Expr: '{value};'},
			Param: '{type} {name}',
			Function: '{returns} {name}({params}) {',
			Prototype: '{returns} {name}({params});',
			/*
			 * Its lists of numbers of RT_CAP at most (Options.ListSize, 256): their numbers and how many. Once in a shader however
			 * many modules are in it (RT_RUNTIME): the noise of the Noise Service and a graph of numbers side by side.
			 */
			Runtime: function (options) {
				return '#ifndef RT_RUNTIME\n#define RT_RUNTIME\n#define RT_CAP ' + glslCap(options) + '\nstruct rt_floats { float v[RT_CAP]; int n; };\n' + glslRuntime + '\n#endif';
			},
			Module: '{runtime}\n{functions}\n',
			/* Its text takes the directives of a preprocessor (#ifndef): Options.Once. */
			Directives: true,
			Prepare: function (module, options) {
				return glslReady(module, options);
			}
		};

		/* The most numbers a list of numbers of glsl holds (Options.ListSize). */
		function glslCap (options) {
			return Math.max(1, Math.round(Number(options && options.ListSize) || 256));
		}

		var glslRuntime = [
			'float rt_fmod(float a, float b) { return a - b * trunc(a / b); }',
			'int rt_imod(int a, int b) { return a - b * (a / b); }',
			'int rt_ushr(int a, int b) { return int(uint(a) >> uint(b & 31)); }',
			'float rt_smooth(float e0, float e1, float x) { float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }',
			'vec2 rt_smooth(float e0, float e1, vec2 x) { vec2 t = clamp((x - e0) / (e1 - e0), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }',
			'vec3 rt_smooth(float e0, float e1, vec3 x) { vec3 t = clamp((x - e0) / (e1 - e0), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }',
			'vec4 rt_smooth(float e0, float e1, vec4 x) { vec4 t = clamp((x - e0) / (e1 - e0), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }',
			'vec2 rt_normalize(vec2 v) { float l = length(v); return v / (l > 0.0 ? l : 1.0); }',
			'vec3 rt_normalize(vec3 v) { float l = length(v); return v / (l > 0.0 ? l : 1.0); }',
			'vec4 rt_normalize(vec4 v) { float l = length(v); return v / (l > 0.0 ? l : 1.0); }',
			'int rt_key(float v) { return int(floor(v * 1000.0 + 0.5)); }',
			'float rt_hash(float x, float y) { uint a = uint(rt_key(x)); uint b = uint(rt_key(y)); uint h = (a ^ 0x9e3779b9u) * 0x85ebca6bu ^ (b + 0x632be5abu) * 0xc2b2ae35u; h ^= h >> 15u; h *= 0x2c1b3c6du; h ^= h >> 12u; return float(h) / 4294967296.0; }',
			'float rt_ldexp(float x, int k) { int h = k / 2; return x * exp2(float(h)) * exp2(float(k - h)); }',
			'int rt_ilogb(float x) { return x == 0.0 ? -2147483647 : ((floatBitsToInt(abs(x)) >> 23) & 255) - 127; }'
		].join('\n');

		/*
		 * The kernel language: functions of numbers as C writes them, what the IR of a library is written in (its noise, the
		 * functions of Math of the runtime) and what an application may write its own in. Types float, int (32 bits: its
		 * arithmetic wraps, as in C), bool, vec2, vec3, vec4, void; a constant of the module: `float NAME = 1.5;`;
		 * statements: a declaration (`float a = 1.0, b;`), `a = ...` (and += -= *= /= %= &= |= ^= <<= >>=, ++, --),
		 * `if (...) ... else ...`, `for (int i = A; i < B; i++)` (or <=), `return`, a block `{...}`; expressions of C
		 * (?:, || && | ^ & == != < <= > >= << >> >>> + - * / %, unary - ! ~), calls (of the module, the builtins of the IR,
		 * int(x) and float(x) to change a type), .x .y .z .w of a vector, true, false, inf; the comments of C, of a line and of a block.
		 * Gives {Module, Diagnostics}: Line and Column of what is wrong.
		 */
		var KernelTypes = ['float', 'int', 'bool', 'vec2', 'vec3', 'vec4', 'void'];

		function kernel (text) {
			var source = String(text || '');
			var tokens = [];
			var diagnostics = [];
			var constants = {};
			var functions = [];
			var line = 1;
			var column = 1;
			var index = 0;
			var pattern = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|(\d+\.\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|\d+[eE][+-]?\d+)|(0[xX][0-9a-fA-F]+|\d+)|([A-Za-z_]\w*)|(>>>=|>>>|<<=|>>=|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|&&|\|\||==|!=|<=|>=|<<|>>|[-+*\/%<>=!&|^~?:;,.(){}[\]])|([\s\S])/g;
			var match;

			/* The text cut into tokens {Kind: float, int, name, sign, end; Text; Line; Column}. */
			while ((match = pattern.exec(source))) {
				var kind = match[1] ? 'float' : match[2] ? 'int' : match[3] ? 'name' : match[4] ? 'sign' : match[5] ? 'wrong' : '';

				if (kind === 'wrong') diagnostics.push({File: '', Line: line, Column: column, Severity: 'error', Text: 'Elemenx kernel: unexpected ' + match[5]});
				else if (kind) tokens.push({Kind: kind, Text: match[0], Line: line, Column: column});

				match[0].split('').forEach(function (character) {
					if (character === '\n') {
						line++;
						column = 1;
					}
					else {
						column++;
					}
				});
			}

			tokens.push({Kind: 'end', Text: '', Line: line, Column: column});

			function peek (offset) {
				return tokens[Math.min(tokens.length - 1, index + (offset || 0))];
			}

			function is (text, offset) {
				var token = peek(offset);

				return (token.Kind === 'sign' || token.Kind === 'name') && token.Text === text;
			}

			function wrong (text, token) {
				var place = token || peek();

				throw {Kernel: true, Line: place.Line, Column: place.Column, Text: 'Elemenx kernel: ' + text};
			}

			function take (text) {
				if (!is(text))
					wrong('expected ' + text + ', not ' + (peek().Text || 'the end'));

				return tokens[index++];
			}

			function name () {
				if (peek().Kind !== 'name')
					wrong('expected a name, not ' + (peek().Text || 'the end'));

				return tokens[index++].Text;
			}

			function type () {
				var token = peek();
				if (token.Kind !== 'name' || KernelTypes.indexOf(token.Text) === -1)
					wrong('expected a type, not ' + (token.Text || 'the end'));

				index++;

				/* float[]: a list of numbers. */
				if (token.Text === 'float' && is('[') && is(']', 1)) {
					index += 2;

					return 'floats';
				}

				return token.Text;
			}

			function typed () {
				return peek().Kind === 'name' && KernelTypes.indexOf(peek().Text) !== -1;
			}

			function c (value, kind) {
				return {Op: 'const', Value: value, Type: kind};
			}

			function bin (operator, a, b) {
				return {Op: 'bin', Operator: operator, A: a, B: b};
			}

			/* Expressions, by the order of C: the ternary, then the binary ones from the loosest, then unary, then postfix. */
			var levels = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '<=', '>', '>='], ['<<', '>>', '>>>'], ['+', '-'], ['*', '/', '%']];

			function expression () {
				var test = binary(0);
				var a;

				if (!is('?')) return test;

				index++;
				a = expression();

				take(':');

				return {Op: 'select', Test: test, A: a, B: expression()};
			}

			function binary (level) {
				var left;
				var operator;

				if (level >= levels.length) return unary();

				left = binary(level + 1);

				while (peek().Kind === 'sign' && levels[level].indexOf(peek().Text) !== -1) {
					operator = tokens[index++].Text;
					left = bin(operator, left, binary(level + 1));
				}

				return left;
			}

			function unary () {
				if (is('-')) {
					index++;

					return {Op: 'un', Operator: '-', A: unary()};
				}

				if (is('!')) {
					index++;

					return {Op: 'un', Operator: '!', A: unary()};
				}

				if (is('~')) {
					index++;

					return bin('^', unary(), c(-1, 'int'));
				}

				if (is('+')) {
					index++;

					return unary();
				}

				return postfix(primary());
			}

			function postfix (value) {
				var made = value;
				var field;

				while (is('.') || is('[')) {
					/* A number of a list or a vector: a[i]. */
					if (is('[')) {
						index++;
						made = {Op: 'index', List: made, At: expression()};

						take(']');

						continue;
					}

					index++;
					field = name();

					if (field === 'length') {
						made = {Op: 'length', List: made};

						continue;
					}

					if (['x', 'y', 'z', 'w'].indexOf(field) === -1)
						wrong('a vector has x, y, z and w, not ' + field);

					made = {Op: 'call', Name: field, Args: [made]};
				}

				return made;
			}

			function primary () {
				var token = peek();
				var called;
				var args;
				var made;

				if (token.Kind === 'float') {
					index++;

					return c(Number(token.Text), 'float');
				}

				if (token.Kind === 'int') {
					index++;

					/* A whole number past 32 bits is a number of float, as JavaScript would keep it. */
					return Number(token.Text) > 2147483647 && !/^0[xX]/.test(token.Text) ? c(Number(token.Text), 'float') : c(Number(token.Text) | 0, 'int');
				}

				if (is('(')) {
					index++;
					made = expression();

					take(')');

					return made;
				}

				if (token.Kind !== 'name')
					wrong('unexpected ' + (token.Text || 'the end'));

				index++;

				if (token.Text === 'true' || token.Text === 'false') return c(token.Text === 'true', 'bool');

				if (token.Text === 'inf')
					return c(Infinity, 'float');

				if (is('(')) {
					index++;
					args = [];

					while (!is(')')) {
						args.push(expression());

						if (!is(')'))
							take(',');
					}

					index++;
					called = token.Text === 'int' ? 'toInt' : token.Text === 'float' ? 'toFloat' : token.Text;

					return {Op: 'call', Name: called, Args: args};
				}

				if (own(constants, token.Text)) return constants[token.Text];

				return {Op: 'var', Name: token.Text};
			}

			/* The statements of a body, up to its }. */
			function block (list) {
				take('{');

				while (!is('}')) {
					if (peek().Kind === 'end')
						wrong('a block is not closed');

					statement(list);
				}

				index++;
			}

			function single (list) {
				if (is('{')) block(list);
				else statement(list);
			}

			function assignment (list) {
				var target = name();
				var operator;

				if (is('++') || is('--')) {
					operator = tokens[index++].Text;

					list.push({Op: 'set', Name: target, Value: bin(operator === '++' ? '+' : '-', {Op: 'var', Name: target}, c(1, 'int'))});

					return;
				}

				operator = peek().Text;

				if (['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>='].indexOf(operator) === -1)
					wrong('expected = after ' + target);

				index++;

				list.push({Op: 'set', Name: target, Value: operator === '=' ? expression() : bin(operator.slice(0, -1), {Op: 'var', Name: target}, expression())});
			}

			function statement (list) {
				var kind;
				var test;
				var then;
				var otherwise;
				var variable;
				var from;
				var to;
				var body;

				if (is('{')) {
					block(list);

					return;
				}

				if (is('if')) {
					index++;

					take('(');

					test = expression();

					take(')');

					then = [];

					single(then);

					otherwise = [];

					if (is('else')) {
						index++;

						single(otherwise);
					}

					list.push({Op: 'if', Test: test, Then: then, Else: otherwise});

					return;
				}

				if (is('for')) {
					index++;

					take('(');
					take('int');

					variable = name();

					take('=');

					from = expression();

					take(';');

					if (name() !== variable)
						wrong('a for counts its own variable up');

					if (is('<')) {
						index++;
						to = expression();
					}
					else {
						take('<=');

						to = bin('+', expression(), c(1, 'int'));
					}

					take(';');

					if (name() !== variable || !is('++'))
						wrong('a for goes up by ++ of its variable');

					index++;

					take(')');

					body = [];

					single(body);

					list.push({Op: 'loop', Var: variable, From: from, To: to, Body: body});

					return;
				}

				if (is('return')) {
					index++;

					list.push(is(';') ? {Op: 'return'} : {Op: 'return', Value: expression()});

					take(';');

					return;
				}

				if (typed()) {
					kind = type();

					do {
						variable = name();

						if (is('=')) {
							index++;

							list.push({Op: 'let', Name: variable, Type: kind, Value: expression()});
						}
						else {
							list.push({Op: 'let', Name: variable, Type: kind, Value: kind === 'float' ? c(0, 'float') : kind === 'int' ? c(0, 'int') : kind === 'bool' ? c(false, 'bool') : c([0, 0, 0, 0].slice(0, Number(kind.charAt(3))), kind)});
						}
					} while (is(',') && ++index);

					take(';');

					return;
				}

				if (peek().Kind === 'name' && (is('=', 1) || is('++', 1) || is('--', 1) || peek(1).Kind === 'sign' && /^(?:[-+*\/%&|^]|<<|>>|>>>)=$/.test(peek(1).Text))) {
					assignment(list);

					take(';');

					return;
				}

				list.push({Op: 'expr', Value: expression()});

				take(';');
			}

			/* A function, or a constant of the module: type name ( ... ) { ... } or type name = value; */
			function top () {
				var returns = type();
				var named = name();
				var params = [];
				var body = [];

				if (is('=')) {
					index++;

					constants[named] = expression();

					take(';');

					return;
				}

				take('(');

				while (!is(')')) {
					params.push({Type: type(), Name: name()});

					if (!is(')'))
						take(',');
				}

				index++;

				block(body);

				functions.push({Name: named, Params: params, Returns: returns, Body: body});
			}

			try {
				while (peek().Kind !== 'end')
					top();
			}
			catch (error) {
				if (!error || !error.Kernel)
					throw error;

				diagnostics.push({File: '', Line: error.Line, Column: error.Column, Severity: 'error', Text: error.Text});
			}

			return {Module: {Functions: functions, Entry: functions.length ? functions[functions.length - 1].Name : ''}, Diagnostics: diagnostics.length ? diagnostics : check({Functions: functions})};
		}

		/*
		 * The functions of Math of the runtime of js and wasm, of the kernel language: the very same numbers in both, in any
		 * browser and in Node (the Math of a browser may differ from another's in the last digit). After fdlibm: sines and
		 * cosines reduced by three parts of pi / 2 (exact as far as 2^20 pi / 2, rough past it), exp and log by 2^k (ldexp,
		 * ilogb), atan by its four ranges; pow of a whole exponent (to 64) by squares, else exp(y log x).
		 */
		var OwnMath = [
			'float PIO2_1 = 1.57079632673412561417e+00; float PIO2_1T = 6.07710050650619224932e-11;',
			'float PIO2_2 = 6.07710050630396597660e-11; float PIO2_2T = 2.02226624879595063154e-21;',
			'float INVPIO2 = 6.36619772367581382433e-01;',
			'float m_ksin(float x, float y) {',
			'	float z = x * x; float v = z * x;',
			'	float r = 8.33333333332248946124e-03 + z * (-1.98412698298579493134e-04 + z * (2.75573137070700676789e-06 + z * (-2.50507602534068634195e-08 + z * 1.58969099521155010221e-10)));',
			'	return x - ((z * (0.5 * y - v * r) - y) - v * -1.66666666666666324348e-01);',
			'}',
			'float m_kcos(float x, float y) {',
			'	float z = x * x;',
			'	float r = z * (4.16666666666666019037e-02 + z * (-1.38888888888741095749e-03 + z * (2.48015872894767294178e-05 + z * (-2.75573143513906633035e-07 + z * (2.08757232129817482790e-09 + z * -1.13596475577881948265e-11)))));',
			'	float hz = 0.5 * z; float w = 1.0 - hz;',
			'	return w + (((1.0 - w) - hz) + (z * r - x * y));',
			'}',
			/* The quarter of x (0 to 3), its rest from it (high and low part): one function, two results by a vector. */
			'vec3 m_reduce(float x) {',
			'	float n = floor(x * INVPIO2 + 0.5);',
			'	float r = x - n * PIO2_1; float w = n * PIO2_1T;',
			'	float t = r; w = n * PIO2_2; r = t - w; w = n * PIO2_2T - ((t - r) - w);',
			'	float y0 = r - w; float y1 = (r - y0) - w;',
			'	return vec3(float(int(n - 4.0 * floor(n * 0.25))), y0, y1);',
			'}',
			'float m_sin(float x) {',
			'	if (abs(x) < 0.7853981633974483) return m_ksin(x, 0.0);',
			'	vec3 q = m_reduce(x); int n = int(q.x);',
			'	if (n == 0) return m_ksin(q.y, q.z);',
			'	if (n == 1) return m_kcos(q.y, q.z);',
			'	if (n == 2) return -m_ksin(q.y, q.z);',
			'	return -m_kcos(q.y, q.z);',
			'}',
			'float m_cos(float x) {',
			'	if (abs(x) < 0.7853981633974483) return m_kcos(x, 0.0);',
			'	vec3 q = m_reduce(x); int n = int(q.x);',
			'	if (n == 0) return m_kcos(q.y, q.z);',
			'	if (n == 1) return -m_ksin(q.y, q.z);',
			'	if (n == 2) return -m_kcos(q.y, q.z);',
			'	return m_ksin(q.y, q.z);',
			'}',
			'float m_tan(float x) { return m_sin(x) / m_cos(x); }',
			'float m_exp(float x) {',
			'	if (x != x) return x;',
			'	if (x > 7.09782712893383973096e+02) return inf;',
			'	if (x < -7.45133219101941108420e+02) return 0.0;',
			'	float k = floor(x * 1.44269504088896338700e+00 + 0.5);',
			'	float hi = x - k * 6.93147180369123816490e-01; float lo = k * 1.90821492927058770002e-10; float r = hi - lo;',
			'	float t = r * r;',
			'	float c = r - t * (1.66666666666666019037e-01 + t * (-2.77777777770155933842e-03 + t * (6.61375632143793436117e-05 + t * (-1.65339022054652515390e-06 + t * 4.13813679705723846039e-08))));',
			'	return ldexp(1.0 - ((lo - (r * c) / (2.0 - c)) - hi), int(k));',
			'}',
			'float m_log(float x) {',
			'	if (x != x || x < 0.0) return (x - x) / 0.0;',
			'	if (x == 0.0) return -inf;',
			'	if (x == inf) return x;',
			'	int k = ilogb(x); float m = ldexp(x, -k);',
			'	if (m > 1.4142135623730951) { m = m * 0.5; k = k + 1; }',
			'	float f = m - 1.0; float hfsq = 0.5 * f * f; float s = f / (2.0 + f); float z = s * s; float w = z * z;',
			'	float t1 = w * (3.999999999940941908e-01 + w * (2.222219843214978396e-01 + w * 1.531383769920937332e-01));',
			'	float t2 = z * (6.666666666666735130e-01 + w * (2.857142874366239149e-01 + w * (1.818357216161805012e-01 + w * 1.479819860511658591e-01)));',
			'	float dk = float(k);',
			'	return dk * 6.93147180369123816490e-01 - ((hfsq - (s * (hfsq + t2 + t1) + dk * 1.90821492927058770002e-10)) - f);',
			'}',
			'float m_atan(float x) {',
			'	if (x != x) return x;',
			'	float ax = abs(x);',
			'	if (ax >= 7.378697629483821e19) return x > 0.0 ? 1.5707963267948966 : -1.5707963267948966;',
			'	if (ax < 3.725290298461914e-9) return x;',
			'	int id = -1; float t = x;',
			'	if (ax >= 0.4375) {',
			'		if (ax < 1.1875) { if (ax < 0.6875) { id = 0; t = (2.0 * ax - 1.0) / (2.0 + ax); } else { id = 1; t = (ax - 1.0) / (ax + 1.0); } }',
			'		else { if (ax < 2.4375) { id = 2; t = (ax - 1.5) / (1.0 + 1.5 * ax); } else { id = 3; t = -1.0 / ax; } }',
			'	}',
			'	float z = t * t; float w = z * z;',
			'	float s1 = z * (3.33333333333329318027e-01 + w * (1.42857142725034663711e-01 + w * (9.09088713343650656196e-02 + w * (6.66107313738753120669e-02 + w * (4.97687799461593236017e-02 + w * 1.62858201153657823623e-02)))));',
			'	float s2 = w * (-1.99999999998764832476e-01 + w * (-1.11111104054623557880e-01 + w * (-7.69187620504482999495e-02 + w * (-5.83357013379057348645e-02 + w * -3.65315727442169155270e-02))));',
			'	if (id < 0) return x - x * (s1 + s2);',
			'	float hi = id == 0 ? 4.63647609000806093515e-01 : id == 1 ? 7.85398163397448278999e-01 : id == 2 ? 9.82793723247329054082e-01 : 1.57079632679489655800e+00;',
			'	float lo = id == 0 ? 2.26987774529616870924e-17 : id == 1 ? 3.06161699786838301793e-17 : id == 2 ? 1.39033110312309984516e-17 : 6.12323399573676603587e-17;',
			'	float made = hi - ((t * (s1 + s2) - lo) - t);',
			'	return x < 0.0 ? -made : made;',
			'}',
			'float m_atan2(float y, float x) {',
			'	if (x != x || y != y) return x + y;',
			'	bool up = y > 0.0 || y == 0.0 && 1.0 / y > 0.0;',
			'	if (x == 0.0) { if (y == 0.0) return 1.0 / x > 0.0 ? y : up ? 3.1415926535897931160 : -3.1415926535897931160; return up ? 1.5707963267948966 : -1.5707963267948966; }',
			'	if (abs(x) == inf && abs(y) == inf) { float q = x > 0.0 ? 0.7853981633974483 : 2.356194490192345; return up ? q : -q; }',
			'	float z = m_atan(abs(y / x));',
			'	if (x > 0.0) return up ? z : -z;',
			'	return up ? 3.1415926535897931160 - (z - 1.2246467991473531772e-16) : (z - 1.2246467991473531772e-16) - 3.1415926535897931160;',
			'}',
			'float m_asin(float x) { return m_atan2(x, sqrt((1.0 - x) * (1.0 + x))); }',
			'float m_acos(float x) { return m_atan2(sqrt((1.0 - x) * (1.0 + x)), x); }',
			'float m_round(float x) { float r = floor(x); return x - r >= 0.5 ? r + 1.0 : r; }',
			/* The rest of a / b, exact as js's %: b times the greatest power of 2 under it taken off, as many times as their exponents are apart. */
			'float m_fmod(float a, float b) {',
			'	if (a != a || b != b || abs(a) == inf || b == 0.0) return (a - a) / 0.0;',
			'	float x = abs(a); float y = abs(b);',
			'	if (x < y) return a;',
			'	int ey = ilogb(y); int n = ilogb(x) - ey + 1;',
			'	for (int i = 0; i < n; i++) { if (x >= y) { float t = ldexp(y, ilogb(x) - ey); if (t > x) t = t * 0.5; x = x - t; } }',
			'	return a < 0.0 ? -x : x;',
			'}',
			'float m_pow(float x, float y) {',
			'	if (y != y) return y;',
			'	if (y == 0.0) return 1.0;',
			'	if (x != x) return x;',
			'	bool whole = floor(y) == y && abs(y) < 9007199254740992.0;',
			'	bool odd = whole && abs(y - 2.0 * floor(y * 0.5)) == 1.0;',
			'	if (abs(y) == inf) { if (abs(x) == 1.0) return (x - x) / 0.0; return (abs(x) > 1.0) == (y > 0.0) ? inf : 0.0; }',
			'	if (x == 0.0) { bool negative = 1.0 / x < 0.0; if (y > 0.0) return odd && negative ? -0.0 : 0.0; return odd && negative ? -inf : inf; }',
			'	if (abs(x) == inf) { if (y > 0.0) return x < 0.0 && odd ? -inf : inf; return x < 0.0 && odd ? -0.0 : 0.0; }',
			'	if (x < 0.0 && !whole) return (x - x) / 0.0;',
			'	float made = 1.0;',
			'	if (whole && abs(y) <= 64.0) {',
			'		float base = abs(x); int e = int(abs(y));',
			'		for (int i = 0; i < 7; i++) { if ((e & 1) == 1) made = made * base; e = e >> 1; base = base * base; }',
			'		if (y < 0.0) made = 1.0 / made;',
			'	}',
			'	else if (y == 0.5) { made = sqrt(abs(x)); }',
			'	else { made = m_exp(y * m_log(abs(x))); }',
			'	return x < 0.0 && odd ? -made : made;',
			'}'
		].join('\n');

		var mathModule = null;
		var mathMade = null;

		/*
		 * The own Math as functions of js, made once: {sin, cos, tan, asin, acos, atan, atan2, exp, log, pow, round, fmod}, the
		 * numbers of every module of js and wasm, for code written by hand that has to give the same (an interpreter of graphs).
		 */
		function ownFunctions () {
			var made;

			if (mathMade)
				return mathMade;

			if (!mathModule)
				mathModule = kernel(OwnMath).Module;

			made = (new Function(emit(mathModule, languages.js, {}).Text))();
			mathMade = {};

			['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'pow', 'round', 'fmod'].forEach(function (name) {
				mathMade[name] = made['m_' + name];
			});

			return mathMade;
		}

		/*
		 * A module whose calls of sin, cos, tan, asin, acos, atan, atan2, exp, log, pow and round (of numbers, or of each
		 * part of a vector) go to the functions of OwnMath, those added to it (with what they call): what js and wasm run.
		 */
		function ownMath (module, remainder) {
			var names = {sin: 'm_sin', cos: 'm_cos', tan: 'm_tan', asin: 'm_asin', acos: 'm_acos', atan: 'm_atan', atan2: 'm_atan2', exp: 'm_exp', log: 'm_log', pow: 'm_pow', round: 'm_round'};
			var defined = {};
			var needed = {};
			var made;

			if (!mathModule)
				mathModule = kernel(OwnMath).Module;

			module.Functions.forEach(function (fn) {
				defined[fn.Name] = true;
			});

			function scopeOf (fn) {
				var scope = {};

				(fn.Params || []).forEach(function (param) {
					scope[param.Name] = param.Type || 'any';
				});

				return scope;
			}

			/* An expression with its calls of Math to the own ones; scope: the types of the variables, to know a vector. */
			function swap (value, scope) {
				var type;
				var copy;

				if (!value || typeof value !== 'object') return value;

				if (Array.isArray(value)) {
					return value.map(function (one) {
						return swap(one, scope);
					});
				}

				copy = {};

				Object.keys(value).forEach(function (key) {
					copy[key] = key === 'Body' || key === 'Then' || key === 'Else' ? value[key] : swap(value[key], scope);
				});

				/* remainder (wasm): % of numbers not both whole by m_fmod, exact as js's (wasm has no rest of floats). */
				if (remainder && copy.Op === 'bin' && copy.Operator === '%' && !vector(typeOf(value.A, scope, module, [])) && !vector(typeOf(value.B, scope, module, [])) && !(typeOf(value.A, scope, module, []) === 'int' && typeOf(value.B, scope, module, []) === 'int')) {
					needed.m_fmod = true;

					return {Op: 'call', Name: 'm_fmod', Args: [copy.A, copy.B]};
				}

				/*
				 * each of pow, sin, cos or exp (of what may be a vector): the runtime of js turns them by the own ones too
				 * (rt_ops), so these come with the module. Regression: they went to the Math of the browser, a graph a last bit
				 * off its run.
				 */
				if (copy.Op === 'call' && copy.Name === 'each' && copy.Args && copy.Args[0] && copy.Args[0].Op === 'const' && ['pow', 'sin', 'cos', 'exp'].indexOf(copy.Args[0].Value) !== -1)
					needed[names[copy.Args[0].Value]] = true;

				if (copy.Op === 'call' && own(names, copy.Name) && !own(defined, copy.Name)) {
					needed[names[copy.Name]] = true;
					type = copy.Args && copy.Args.length ? typeOf(value.Args[0], scope, module, []) : 'float';

					/* Of a vector: of each of its parts (vec3(sin(x(v)), ...)). */
					if (vector(type)) {
						return {Op: 'call', Name: type, Args: ['x', 'y', 'z', 'w'].slice(0, Number(type.charAt(3))).map(function (part) {
							return {Op: 'call', Name: names[copy.Name], Args: copy.Args.map(function (arg) {
								return vector(typeOf(arg, scope, module, [])) ? {Op: 'call', Name: part, Args: [arg]} : arg;
							})};
						})};
					}

					copy.Name = names[copy.Name];
				}

				return copy;
			}

			function body (list, scope) {
				return (list || []).map(function (statement) {
					var made = swap(statement, scope);
					var inner;

					if (statement.Op === 'let')
						scope[statement.Name] = statement.Type || typeOf(statement.Value, scope, module, []);

					if (statement.Op === 'if') {
						made.Then = body(statement.Then, Object.create(scope));
						made.Else = body(statement.Else, Object.create(scope));
					}
					else if (statement.Op === 'loop' || statement.Op === 'each') {
						inner = Object.create(scope);
						inner[statement.Var] = statement.Op === 'loop' ? 'int' : statement.Type || 'any';
						made.Body = body(statement.Body, inner);
					}

					return made;
				});
			}

			made = {Functions: module.Functions.map(function (fn) {
				return Object.assign({}, fn, {Body: body(fn.Body, scopeOf(fn))});
			}), Entry: module.Entry};

			/* What the own functions call in turn, then each of them once. */
			function add (name) {
				var fn = mathModule.Functions.filter(function (one) {
					return one.Name === name;
				})[0];
				if (!fn || own(defined, name)) return;

				defined[name] = true;

				JSON.stringify(fn.Body, function (key, value) {
					if (value && value.Op === 'call' && /^m_/.test(value.Name))
						add(value.Name);

					return value;
				});

				made.Functions.push(fn);
			}

			Object.keys(needed).forEach(add);

			return made;
		}

		/*
		 * WebAssembly of the IR: the binary of a module of numbers (float, int, bool, vec2..vec4; a vector is as many
		 * numbers), its functions exported by their names. Its Math is the own one (OwnMath), its whole numbers wrap as in
		 * js: each function gives the very numbers of js. A module of texts, lists or records is not of wasm: Diagnostics
		 * say what of it (the js of the same module runs it). options: MaxDepth (as js), Batch (true, or the names of
		 * functions: each also as batch:<name>(count, input, output), count runs on numbers of 8 bytes in the memory, its
		 * parameters one after another from input, its results from output). {Bytes, Exports: [{Name, Params, Returns}],
		 * Diagnostics}.
		 */
		var WasmTypes = {float: 1, int: 1, bool: 1, vec2: 2, vec3: 3, vec4: 4, void: 0, floats: 1};
		var WasmBuiltins = ['abs', 'floor', 'ceil', 'sqrt', 'trunc', 'fract', 'sign', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep', 'vec2', 'vec3', 'vec4', 'dot', 'cross', 'length', 'normalize', 'distance', 'x', 'y', 'z', 'w', 'toInt', 'toFloat', 'ldexp', 'ilogb'];

		/* The bytes of a number of LEB128: unsigned, or signed (a value of 64 bits by two halves is not needed here). */
		function leb (value, signed) {
			var made = [];
			var more = true;
			var n = value;

			while (more) {
				var byte = signed ? n & 127 : n % 128;

				n = signed ? n >> 7 : Math.floor(n / 128);
				more = signed ? !(n === 0 && (byte & 64) === 0 || n === -1 && (byte & 64) !== 0) : n > 0;

				made.push(more ? byte | 128 : byte);
			}

			return made;
		}

		function f64Bytes (value) {
			var view = new DataView(new ArrayBuffer(8));

			view.setFloat64(0, value, true);

			return [0, 1, 2, 3, 4, 5, 6, 7].map(function (at) {
				return view.getUint8(at);
			});
		}

		function textBytes (text) {
			var made = [];
			var i;

			for (i = 0; i < text.length; i++) {
				var code = text.charCodeAt(i);

				if (code < 128) made.push(code);
				else if (code < 2048) made.push(192 | code >> 6, 128 | code & 63);
				else made.push(224 | code >> 12, 128 | code >> 6 & 63, 128 | code & 63);
			}

			return leb(made.length).concat(made);
		}

		function section (id, items) {
			var content = leb(items.length);

			items.forEach(function (item) {
				content = content.concat(item);
			});

			return [id].concat(leb(content.length), content);
		}

		/* What of a module wasm cannot hold: [{Severity: 'error', Text}]. */
		/* What of a module is not of numbers, for a back end of numbers (tag: wasm or glsl; its builtins, its types, the expressions it has besides). */
		function unsupported (module, tag, builtins, types, more, cap) {
			var found = [];
			var names = {};
			var kinds = types || WasmTypes;
			var calls = builtins || WasmBuiltins;

			module.Functions.forEach(function (fn) {
				names[fn.Name] = true;
			});

			function say (text, fn) {
				if (found.length < 20)
					told(found, 'Elemenx ' + (tag || 'wasm') + ': ' + text + ' in ' + fn.Name + ' is not of numbers (its js runs it)');
			}

			function walk (value, fn) {
				if (!value || typeof value !== 'object') return;

				if (Array.isArray(value)) {
					value.forEach(function (one) {
						walk(one, fn);
					});

					return;
				}

				if (value.Op && ['const', 'var', 'call', 'bin', 'un', 'select', 'let', 'set', 'if', 'loop', 'return', 'expr'].concat(more || []).indexOf(value.Op) === -1)
					say(value.Op, fn);

				/* A list of numbers of the module: glsl holds it (as many as cap), wasm none (its numbers go in its code: unrolled). */
				if (value.Op === 'const' && value.Type === 'floats') {
					if ((more || []).indexOf('floats') === -1) say('a constant list of numbers', fn);
					else if (cap && (value.Value || []).length > cap) say('a list of ' + value.Value.length + ' numbers (of ' + cap + ' at most: Options.ListSize)', fn);
				}
				else if (value.Op === 'const' && typeof value.Value !== 'number' && typeof value.Value !== 'boolean' && !(Array.isArray(value.Value) && value.Value.length >= 2 && value.Value.length <= 4)) {
					say('a constant ' + JSON.stringify(value.Value), fn);
				}

				if (value.Op === 'let' && value.Type && !own(kinds, value.Type))
					say('a ' + value.Type + ' ' + value.Name, fn);

				if (value.Op === 'call' && !own(names, value.Name) && calls.indexOf(value.Name) === -1)
					say(value.Name + '()', fn);

				Object.keys(value).forEach(function (key) {
					walk(value[key], fn);
				});
			}

			module.Functions.forEach(function (fn) {
				if (!own(kinds, fn.Returns || 'void'))
					say('a result of ' + fn.Returns, fn);

				(fn.Params || []).forEach(function (param) {
					if (!own(kinds, param.Type || 'any') || param.Type === 'void')
						say('a parameter of ' + (param.Type || 'any'), fn);
				});

				walk(fn.Body, fn);
			});

			return found;
		}

		/*
		 * A module made ready for GLSL: what is not of numbers told (as for wasm; sin and the like are GLSL's own), a function
		 * that calls itself told (a shader has no stack), and int, float and bool made one another where they meet, as js
		 * takes them: GLSL turns none of them into another by itself. {Module, Diagnostics}.
		 */
		function glslReady (module, options) {
			var diagnostics = unsupported(module, 'glsl', GlslBuiltins, GlslTypes, ['index', 'length', 'floats'], glslCap(options));
			var deep = recursive(module);
			var functions = {};

			Object.keys(deep).forEach(function (name) {
				if (deep[name])
					told(diagnostics, 'Elemenx glsl: ' + name + ' calls itself, and a shader has no stack (its js runs it)');
			});

			if (diagnostics.length)
				return {Module: module, Diagnostics: diagnostics};

			module.Functions.forEach(function (fn) {
				functions[fn.Name] = fn;
			});

			function type (value, scope) {
				return typeOf(value, scope, module, []);
			}

			function constant (value, kind) {
				return {Op: 'const', Value: value, Type: kind};
			}

			/* A value of a type as another: a number of a bool 1 or 0, a bool of a number not 0, a vector of a number in each part. */
			function to (value, from, kind) {
				if (from === kind || !own(GlslTypes, from) || !own(GlslTypes, kind) || from === 'void' || kind === 'void' || from === 'floats' || kind === 'floats') return value;

				if (vector(kind) && !vector(from))
					return {Op: 'call', Name: kind, Args: [to(value, from, 'float')]};

				if (vector(from)) return value;

				if (kind === 'bool')
					return {Op: 'bin', Operator: '!=', A: value, B: constant(0, from)};

				if (from === 'bool')
					return {Op: 'select', Test: value, A: constant(1, kind), B: constant(0, kind)};

				return {Op: 'call', Name: kind === 'int' ? 'toInt' : 'toFloat', Args: [value]};
			}

			function fix (value, scope) {
				var made;
				var a;
				var b;

				if (!value || typeof value !== 'object' || value.Op === 'const' || value.Op === 'var') return value;

				if (value.Op === 'call') {
					made = Object.assign({}, value, {Args: (value.Args || []).map(function (arg, index) {
						var fixed = fix(arg, scope);
						var from = type(fixed, scope);
						var fn = functions[value.Name];
						if (fn)
							return to(fixed, from, ((fn.Params || [])[index] || {}).Type || from);

						if (value.Name === 'ldexp')
							return to(fixed, from, index ? 'int' : 'float');

						return GlslFloats.indexOf(value.Name) !== -1 && (from === 'int' || from === 'bool') ? to(fixed, from, 'float') : fixed;
					})});

					/* min, max and clamp of whole numbers stay whole; of a whole and a float, floats. */
					if (['min', 'max', 'clamp'].indexOf(value.Name) !== -1 && value.Args.every(function (arg) {
						return type(arg, scope) === 'int';
					})) {
						made.Args = value.Args.map(function (arg) {
							return fix(arg, scope);
						});
					}

					return made;
				}

				if (value.Op === 'bin') {
					a = fix(value.A, scope);
					b = fix(value.B, scope);

					if (value.Operator === '&&' || value.Operator === '||')
						return Object.assign({}, value, {A: to(a, type(a, scope), 'bool'), B: to(b, type(b, scope), 'bool')});

					if (Bits.indexOf(value.Operator) !== -1)
						return Object.assign({}, value, {A: to(a, type(a, scope), 'int'), B: to(b, type(b, scope), 'int')});

					/* Of an int and anything else of numbers (a float, a vector): floats; a bool in arithmetic, 1 or 0. */
					if (type(a, scope) === 'bool' && ['==', '!='].indexOf(value.Operator) === -1)
						a = to(a, 'bool', 'float');

					if (type(b, scope) === 'bool' && ['==', '!='].indexOf(value.Operator) === -1)
						b = to(b, 'bool', 'float');

					if (type(a, scope) === 'int' && type(b, scope) !== 'int')
						a = to(a, 'int', 'float');

					if (type(b, scope) === 'int' && type(a, scope) !== 'int')
						b = to(b, 'int', 'float');

					return Object.assign({}, value, {A: a, B: b});
				}

				if (value.Op === 'un') {
					a = fix(value.A, scope);

					return Object.assign({}, value, {A: value.Operator === '!' ? to(a, type(a, scope), 'bool') : a});
				}

				if (value.Op === 'index') {
					a = fix(value.At, scope);

					return Object.assign({}, value, {List: fix(value.List, scope), At: to(a, type(a, scope), 'int')});
				}

				if (value.Op === 'select') {
					made = fix(value.Test, scope);
					a = fix(value.A, scope);
					b = fix(value.B, scope);

					if (type(a, scope) !== type(b, scope)) {
						a = to(a, type(a, scope), vector(type(b, scope)) ? type(b, scope) : 'float');
						b = to(b, type(b, scope), type(a, scope));
					}

					return Object.assign({}, value, {Test: to(made, type(made, scope), 'bool'), A: a, B: b});
				}

				return value;
			}

			function body (list, scope, fn) {
				return (list || []).map(function (statement) {
					var made = Object.assign({}, statement);
					var inner;

					if (statement.Op === 'let') {
						made.Value = fix(statement.Value, scope);

						if (statement.Type)
							made.Value = to(made.Value, type(made.Value, scope), statement.Type);

						scope[statement.Name] = statement.Type || type(made.Value, scope);
					}
					else if (statement.Op === 'set') {
						made.Value = fix(statement.Value, scope);
						made.Value = to(made.Value, type(made.Value, scope), scope[statement.Name]);
					}
					else if (statement.Op === 'if') {
						made.Test = fix(statement.Test, scope);
						made.Test = to(made.Test, type(made.Test, scope), 'bool');
						made.Then = body(statement.Then, Object.create(scope), fn);
						made.Else = body(statement.Else, Object.create(scope), fn);
					}
					else if (statement.Op === 'loop') {
						inner = Object.create(scope);
						inner[statement.Var] = 'int';
						made.From = to(fix(statement.From, scope), type(fix(statement.From, scope), scope), 'int');
						made.To = to(fix(statement.To, scope), type(fix(statement.To, scope), scope), 'int');
						made.Body = body(statement.Body, inner, fn);
					}
					else if (statement.Op === 'return' && statement.Value) {
						made.Value = fix(statement.Value, scope);
						made.Value = to(made.Value, type(made.Value, scope), fn.Returns || 'void');
					}
					else if (statement.Value) {
						made.Value = fix(statement.Value, scope);
					}

					return made;
				});
			}

			return {Module: {Functions: module.Functions.map(function (fn) {
				var scope = {};

				(fn.Params || []).forEach(function (param) {
					scope[param.Name] = param.Type || 'float';
				});

				return Object.assign({}, fn, {Body: body(fn.Body, scope, fn)});
			}), Entry: module.Entry}, Diagnostics: []};
		}

		function wasm (given, options) {
			var settings = options || {};
			var diagnostics = check(given);
			var module;
			var deep;
			var types = [];
			var typeKeys = {};
			var indices = {};
			var bodies = [];
			var exports = [];
			var described = [];
			var max = Number(settings.MaxDepth) || 256;
			var helpers = {};
			var count = 0;
			var batch = settings.Batch === true ? null : settings.Batch || [];

			if (diagnostics.length)
				return {Diagnostics: diagnostics};

			module = ownMath(given, true);
			diagnostics = unsupported(module, 'wasm', WasmBuiltins, WasmTypes, ['index', 'length']);

			if (diagnostics.length)
				return {Diagnostics: diagnostics};

			deep = recursive(module);

			/* How many of the first parameters of a function its batch is given once (Fixed of {Name, Fixed}), -1 for no batch. */
			function batchOf (name) {
				var found;

				if (batch === null) return 0;

				found = batch.filter(function (one) {
					return (typeof one === 'string' ? one : one && one.Name) === name;
				})[0];

				return found === undefined ? -1 : typeof found === 'string' ? 0 : Number(found.Fixed) || 0;
			}

			/* The value types of a type of the IR: a vector as its numbers. */
			function values (type) {
				if (type === 'int' || type === 'bool' || type === 'floats') return [0x7F];
				if (type === 'void') return [];

				return new Array(WasmTypes[type] || 1).join(',').split(',').map(function () {
					return 0x7C;
				});
			}

			function typeIndex (params, results) {
				var key = params.join(',') + '>' + results.join(',');

				if (!own(typeKeys, key)) {
					typeKeys[key] = types.length;

					types.push([0x60].concat(leb(params.length), params, leb(results.length), results));
				}

				return typeKeys[key];
			}

			/* The functions in order: those of the module, the helpers of the runtime, the guards of the deep ones, the batches. */
			module.Functions.forEach(function (fn) {
				indices[fn.Name] = count++;
			});

			function helper (name) {
				if (!own(helpers, name))
					helpers[name] = count++;

				return helpers[name];
			}

			helper('ldexp');
			helper('ilogb');
			helper('toInt');

			module.Functions.forEach(function (fn) {
				if (deep[fn.Name])
					indices['guard:' + fn.Name] = count++;
			});

			module.Functions.forEach(function (fn) {
				if (batchOf(fn.Name) >= 0)
					indices['batch:' + fn.Name] = count++;
			});

			/* The code of a function: its locals (after the parameters), its bytes. */
			function compile (fn) {
				var code = [];
				var locals = [];
				var next = 0;
				var scope = {};
				var returns = fn.Returns || 'void';

				function local (type) {
					var made = next++;
					if (made >= paramsCount)
						locals.push(type);

					return made;
				}

				function slots (type) {
					return values(type).map(function (kind) {
						return local(kind);
					});
				}

				var paramsCount = 0;

				(fn.Params || []).forEach(function (param) {
					paramsCount += values(param.Type).length;
				});

				(fn.Params || []).forEach(function (param) {
					scope[param.Name] = {Type: param.Type, Slots: values(param.Type).map(function () {
						return next++;
					})};
				});

				function op () {
					Array.prototype.forEach.call(arguments, function (one) {
						if (Array.isArray(one)) code.push.apply(code, one);
						else code.push(one);
					});
				}

				function f64 (value) {
					op(0x44, f64Bytes(value));
				}

				function i32 (value) {
					op(0x41, leb(value | 0, true));
				}

				function get (index) {
					op(0x20, leb(index));
				}

				function set (index) {
					op(0x21, leb(index));
				}

				/* What is on the stack (of a type) made a float, or an int (as toInt). */
				function toFloat (type) {
					if (type === 'int' || type === 'bool')
						op(0xB7);
				}

				/*
				 * As js's x | 0, in its place, of no branch: its whole part by 64 bits, its low 32 (as many times 2^32 off as it
				 * takes); nought of NaN and of what is 2^63 or more (Infinity). Regression: by a test and a branch it was twice the
				 * time of js's, three times a point of the lattice of a noise.
				 */
				var converted = null;

				function toInt (type) {
					if (type === 'int' || type === 'bool') return;

					if (converted === null)
						converted = local(0x7C);

					op(0x22, leb(converted), 0xFC, 0x06, 0xA7, 0x41, 0, 0x20, leb(converted), 0x44, f64Bytes(9223372036854775808), 0x63, 0x1B);
				}

				function to (from, wanted) {
					if (wanted === 'int' || wanted === 'bool') toInt(from);
					else if (!vector(wanted)) toFloat(from);
				}

				/* An expression evaluated into new locals: their indices, its type. */
				function stored (item, local_scope) {
					var type = expression(item, local_scope);
					var made = slots(type);

					made.slice().reverse().forEach(set);

					return {Type: type, Slots: made};
				}

				function parts (stash, size) {
					return vector(stash.Type) ? stash.Slots : new Array(size).join(',').split(',').map(function () {
						return stash.Slots[0];
					});
				}

				/* A builtin of each number: its arguments stored, each part done by work(the locals of its arguments). */
				function each (args, local_scope, work, wanted) {
					var stashes = args.map(function (arg) {
						var stash = stored(arg, local_scope);

						if (!vector(stash.Type) && stash.Type !== 'float') {
							get(stash.Slots[0]);

							toFloat(stash.Type);

							stash.Slots = [local(0x7C)];

							set(stash.Slots[0]);

							stash.Type = 'float';
						}

						return stash;
					});
					var size = wanted || stashes.reduce(function (most, stash) {
						return Math.max(most, vector(stash.Type) ? WasmTypes[stash.Type] : 1);
					}, 1);
					var at;

					for (at = 0; at < size; at++) {
						work(stashes.map(function (stash) {
							return parts(stash, size)[at];
						}));
					}

					return size === 1 ? 'float' : 'vec' + size;
				}

				function call (item, local_scope) {
					var name = item.Name;
					var args = item.Args || [];
					var fn = module.Functions.filter(function (one) {
						return one.Name === name;
					})[0];
					var stash;
					var a;

					if (fn) {
						(fn.Params || []).forEach(function (param, index) {
							to(args[index] ? expression(args[index], local_scope) : (op(0x44, f64Bytes(0)), 'float'), param.Type);
						});

						op(0x10, leb(indices[deep[name] ? 'guard:' + name : name]));

						return fn.Returns || 'void';
					}

					/* Of numbers, each used once in its order: straight on the stack. */
					if (['abs', 'floor', 'ceil', 'sqrt', 'trunc', 'min', 'max', 'clamp'].indexOf(name) !== -1 && args.every(function (arg) {
						return !vector(typeOf(arg, typesOf(local_scope), module, []));
					})) {
						args.forEach(function (arg, index) {
							toFloat(expression(arg, local_scope));

							if (name === 'clamp' && index > 0)
								op(index === 1 ? 0xA5 : 0xA4);
						});

						if (name !== 'clamp')
							op({abs: 0x99, floor: 0x9C, ceil: 0x9B, sqrt: 0x9F, trunc: 0x9D, min: 0xA4, max: 0xA5}[name]);

						return 'float';
					}

					if (['abs', 'floor', 'ceil', 'sqrt', 'trunc'].indexOf(name) !== -1) {
						return each(args, local_scope, function (got) {
							get(got[0]);

							op({abs: 0x99, floor: 0x9C, ceil: 0x9B, sqrt: 0x9F, trunc: 0x9D}[name]);
						});
					}

					if (name === 'fract') {
						return each(args, local_scope, function (got) {
							get(got[0]);
							get(got[0]);

							op(0x9C, 0xA1);
						});
					}

					if (name === 'sign') {
						return each(args, local_scope, function (got) {
							/* x > 0 ? 1 : x < 0 ? -1 : 0 */
							f64(1);
							f64(-1);
							f64(0);

							get(got[0]);

							f64(0);

							op(0x63, 0x1B);

							get(got[0]);

							f64(0);

							op(0x64, 0x1B);
						});
					}

					if (name === 'min' || name === 'max') {
						return each(args, local_scope, function (got) {
							get(got[0]);
							get(got[1]);

							op(name === 'min' ? 0xA4 : 0xA5);
						});
					}

					if (name === 'clamp') {
						return each(args, local_scope, function (got) {
							get(got[0]);
							get(got[1]);

							op(0xA5);

							get(got[2]);

							op(0xA4);
						});
					}

					if (name === 'mix') {
						return each(args, local_scope, function (got) {
							get(got[0]);
							get(got[1]);
							get(got[0]);

							op(0xA1);

							get(got[2]);

							op(0xA2, 0xA0);
						});
					}

					if (name === 'step') {
						return each(args, local_scope, function (got) {
							f64(0);
							f64(1);

							get(got[1]);
							get(got[0]);

							op(0x63, 0x1B);
						});
					}

					if (name === 'smoothstep') {
						return each(args, local_scope, function (got) {
							var t = local(0x7C);

							get(got[2]);
							get(got[0]);

							op(0xA1);

							get(got[1]);
							get(got[0]);

							op(0xA1, 0xA3);

							f64(0);

							op(0xA5);

							f64(1);

							op(0xA4);

							set(t);

							get(t);
							get(t);

							op(0xA2);

							f64(3);
							f64(2);

							get(t);

							op(0xA2, 0xA1, 0xA2);
						});
					}

					if (name === 'vec2' || name === 'vec3' || name === 'vec4') {
						args.slice(0, WasmTypes[name]).forEach(function (arg) {
							toFloat(expression(arg, local_scope));
						});

						for (a = args.length; a < WasmTypes[name]; a++)
							f64(0);

						return name;
					}

					if (['x', 'y', 'z', 'w'].indexOf(name) !== -1) {
						/* Of a variable: its local, as it is. */
						if (args[0].Op === 'var' && local_scope[args[0].Name] && vector(local_scope[args[0].Name].Type)) {
							get(local_scope[args[0].Name].Slots[Math.min(local_scope[args[0].Name].Slots.length - 1, ['x', 'y', 'z', 'w'].indexOf(name))]);

							return 'float';
						}

						stash = stored(args[0], local_scope);

						get(stash.Slots[Math.min(stash.Slots.length - 1, ['x', 'y', 'z', 'w'].indexOf(name))]);

						return 'float';
					}

					if (name === 'dot' || name === 'length' || name === 'distance' || name === 'normalize') {
						var first = stored(args[0], local_scope);
						var second = name === 'dot' || name === 'distance' ? stored(args[1], local_scope) : first;
						var size = first.Slots.length;
						var sum = local(0x7C);
						var length;

						f64(0);

						set(sum);

						for (a = 0; a < size; a++) {
							if (name === 'distance') {
								get(first.Slots[a]);
								get(second.Slots[a]);

								op(0xA1);

								stash = local(0x7C);

								set(stash);

								get(stash);
								get(stash);
							}
							else {
								get(first.Slots[a]);
								get(second.Slots[a]);
							}

							op(0xA2);

							get(sum);

							op(0xA0);

							set(sum);
						}

						get(sum);

						if (name === 'dot') return 'float';

						op(0x9F);

						if (name !== 'normalize') return 'float';

						/* v / (length || 1) */
						length = local(0x7C);

						set(length);

						get(length);

						f64(1);

						get(length);

						f64(0);

						op(0x62, 0x1B);

						set(length);

						for (a = 0; a < size; a++) {
							get(first.Slots[a]);
							get(length);

							op(0xA3);
						}

						return first.Type;
					}

					if (name === 'cross') {
						var u = stored(args[0], local_scope).Slots;
						var v = stored(args[1], local_scope).Slots;

						[[1, 2], [2, 0], [0, 1]].forEach(function (pair) {
							get(u[pair[0]]);
							get(v[pair[1]]);

							op(0xA2);

							get(u[pair[1]]);
							get(v[pair[0]]);

							op(0xA2, 0xA1);
						});

						return 'vec3';
					}

					if (name === 'toInt') {
						toInt(expression(args[0], local_scope));

						return 'int';
					}

					if (name === 'toFloat') {
						toFloat(expression(args[0], local_scope));

						return 'float';
					}

					if (name === 'ldexp') {
						toFloat(expression(args[0], local_scope));

						toInt(expression(args[1], local_scope));

						op(0x10, leb(helpers.ldexp));

						return 'float';
					}

					toFloat(expression(args[0], local_scope));

					op(0x10, leb(helpers.ilogb));

					return 'int';
				}

				/* Both sides of an operator: as floats (vectors part by part), or as ints when both are. */
				function binary (item, local_scope) {
					var operator = item.Operator;
					var a;
					var b;
					var whole;
					var stashA;
					var stashB;
					var size;
					var at;

					if (operator === '&&' || operator === '||') {
						to(expression(item.A, local_scope), 'bool');

						op(0x04, 0x7F);

						if (operator === '&&') {
							to(expression(item.B, local_scope), 'bool');

							op(0x05);

							i32(0);
						}
						else {
							i32(1);

							op(0x05);

							to(expression(item.B, local_scope), 'bool');
						}

						op(0x0B);

						return 'bool';
					}

					if (Bits.indexOf(operator) !== -1) {
						toInt(expression(item.A, local_scope));
						toInt(expression(item.B, local_scope));

						op({'&': 0x71, '|': 0x72, '^': 0x73, '<<': 0x74, '>>': 0x75, '>>>': 0x76}[operator]);

						return 'int';
					}

					/* Of numbers, not of vectors: both straight on the stack, as ints when both are (no locals between). */
					a = typeOf(item.A, typesOf(local_scope), module, []);
					b = typeOf(item.B, typesOf(local_scope), module, []);
					whole = (a === 'int' || a === 'bool') && (b === 'int' || b === 'bool');

					if (!vector(a) && !vector(b) && operator !== '%' && !(whole && operator === '/')) {
						if (whole) {
							toInt(expression(item.A, local_scope));
							toInt(expression(item.B, local_scope));
						}
						else {
							toFloat(expression(item.A, local_scope));
							toFloat(expression(item.B, local_scope));
						}

						if (own({'<': 1, '<=': 1, '>': 1, '>=': 1, '==': 1, '!=': 1}, operator)) {
							op(whole ? {'<': 0x48, '<=': 0x4C, '>': 0x4A, '>=': 0x4E, '==': 0x46, '!=': 0x47}[operator] : {'<': 0x63, '<=': 0x65, '>': 0x64, '>=': 0x66, '==': 0x61, '!=': 0x62}[operator]);

							return 'bool';
						}

						op(whole ? {'+': 0x6A, '-': 0x6B, '*': 0x6C}[operator] : {'+': 0xA0, '-': 0xA1, '*': 0xA2, '/': 0xA3}[operator]);

						return whole ? 'int' : 'float';
					}

					stashA = stored(item.A, local_scope);
					stashB = stored(item.B, local_scope);
					a = stashA.Type;
					b = stashB.Type;
					whole = (a === 'int' || a === 'bool') && (b === 'int' || b === 'bool');

					if (vector(a) || vector(b)) {
						size = Math.max(vector(a) ? WasmTypes[a] : 1, vector(b) ? WasmTypes[b] : 1);

						for (at = 0; at < size; at++) {
							get(parts(stashA, size)[at]);

							toFloat(vector(a) ? 'float' : a);

							get(parts(stashB, size)[at]);

							toFloat(vector(b) ? 'float' : b);

							if (operator === '%') {
								/* a - b * trunc(a / b) */
								var x = local(0x7C);
								var y = local(0x7C);

								set(y);
								set(x);

								get(x);
								get(x);
								get(y);

								op(0xA3, 0x9D);

								get(y);

								op(0xA2, 0xA1);
							}
							else {
								op({'+': 0xA0, '-': 0xA1, '*': 0xA2, '/': 0xA3}[operator] || 0xA0);
							}
						}

						return 'vec' + size;
					}

					get(stashA.Slots[0]);

					if (!whole)
						toFloat(a);

					get(stashB.Slots[0]);

					if (!whole)
						toFloat(b);

					if (whole) {
						if (own({'<': 1, '<=': 1, '>': 1, '>=': 1, '==': 1, '!=': 1}, operator)) {
							op({'<': 0x48, '<=': 0x4C, '>': 0x4A, '>=': 0x4E, '==': 0x46, '!=': 0x47}[operator]);

							return 'bool';
						}

						if (operator === '+' || operator === '-' || operator === '*') {
							op({'+': 0x6A, '-': 0x6B, '*': 0x6C}[operator]);

							return 'int';
						}

						if (operator === '%') {
							/* b == 0 ? 0 : a rem b (js gives NaN, which an int keeps as nought): no trap of wasm. */
							set(stashB.Slots[0]);
							set(stashA.Slots[0]);

							get(stashB.Slots[0]);

							op(0x45, 0x04, 0x7F);

							i32(0);

							op(0x05);

							get(stashA.Slots[0]);
							get(stashB.Slots[0]);

							op(0x6F, 0x0B);

							return 'int';
						}

						/* As js: (a / b) | 0. */
						set(stashB.Slots[0]);
						set(stashA.Slots[0]);

						get(stashA.Slots[0]);

						op(0xB7);

						get(stashB.Slots[0]);

						op(0xB7, 0xA3);

						toInt('float');

						return 'int';
					}

					if (own({'<': 1, '<=': 1, '>': 1, '>=': 1, '==': 1, '!=': 1}, operator)) {
						op({'<': 0x63, '<=': 0x65, '>': 0x64, '>=': 0x66, '==': 0x61, '!=': 0x62}[operator]);

						return 'bool';
					}

					if (operator === '%') {
						var p = local(0x7C);
						var q = local(0x7C);

						set(q);
						set(p);

						get(p);
						get(p);
						get(q);

						op(0xA3, 0x9D);

						get(q);

						op(0xA2, 0xA1);

						return 'float';
					}

					op({'+': 0xA0, '-': 0xA1, '*': 0xA2, '/': 0xA3}[operator]);

					return 'float';
				}

				function expression (item, local_scope) {
					var type;
					var named;
					var wanted;
					var a;
					var b;

					if (item.Op === 'const') {
						if (typeof item.Value === 'boolean') {
							i32(item.Value ? 1 : 0);

							return 'bool';
						}

						if (Array.isArray(item.Value)) {
							item.Value.forEach(function (one) {
								f64(Number(one));
							});

							return 'vec' + item.Value.length;
						}

						if (item.Type === 'int') {
							i32(Math.round(item.Value));

							return 'int';
						}

						f64(Number(item.Value));

						return 'float';
					}

					if (item.Op === 'var') {
						named = local_scope[item.Name];

						if (!named)
							throw {Wasm: true, Text: 'Elemenx wasm: no variable ' + item.Name + ' in ' + fn.Name};

						named.Slots.forEach(get);

						return named.Type;
					}

					if (item.Op === 'call')
						return call(item, local_scope);

					if (item.Op === 'bin')
						return binary(item, local_scope);

					if (item.Op === 'un') {
						if (item.Operator === '!') {
							to(expression(item.A, local_scope), 'bool');

							op(0x45);

							return 'bool';
						}

						type = expression(item.A, local_scope);

						if (type === 'int' || type === 'bool') {
							a = local(0x7F);

							set(a);

							i32(0);

							get(a);

							op(0x6B);

							return 'int';
						}

						if (vector(type)) {
							var negated = slots(type);

							negated.slice().reverse().forEach(set);
							negated.forEach(function (slot) {
								get(slot);

								op(0x9A);
							});

							return type;
						}

						op(0x9A);

						return 'float';
					}

					/* A number of a list (its address, 8 bytes on: after its length) or of a vector (its part of that index). */
					if (item.Op === 'index') {
						type = expression(item.List, local_scope);

						if (type === 'floats') {
							to(expression(item.At, local_scope), 'int');

							i32(3);

							op(0x74, 0x6A, 0x2B, 3, 8);

							return 'float';
						}

						var parted = slots(type);
						var picked = local(0x7C);
						var place = local(0x7F);

						parted.slice().reverse().forEach(set);

						to(expression(item.At, local_scope), 'int');

						set(place);

						get(parted[0]);

						set(picked);

						parted.slice(1).forEach(function (slot, k) {
							get(slot);
							get(picked);
							get(place);

							i32(k + 1);

							op(0x46, 0x1B);

							set(picked);
						});

						get(picked);

						return 'float';
					}

					if (item.Op === 'length') {
						type = expression(item.List, local_scope);

						if (type === 'floats') {
							op(0x2B, 3, 0, 0xAA);

							return 'int';
						}

						values(type).forEach(function () {
							op(0x1A);
						});

						i32(WasmTypes[type] || 1);

						return 'int';
					}

					/* select: lazy, as js's ?: — of the type of its first branch, a float if the other is one. */
					var test = expression(item.Test, local_scope);

					to(test, 'bool');

					a = typeOf(item.A, typesOf(local_scope), module, []);
					b = typeOf(item.B, typesOf(local_scope), module, []);
					wanted = vector(a) ? a : vector(b) ? b : a === 'float' || b === 'float' || a === 'any' || b === 'any' ? 'float' : a;

					op(0x04, vector(wanted) ? leb(typeIndex([], values(wanted)), true) : values(wanted)[0]);

					to(expression(item.A, local_scope), wanted);

					op(0x05);

					to(expression(item.B, local_scope), wanted);

					op(0x0B);

					return wanted;
				}

				function typesOf (local_scope) {
					var made = {};
					var key;


					for (key in local_scope)
						made[key] = local_scope[key].Type;

					return made;
				}

				function statements (list, local_scope) {
					(list || []).forEach(function (statement) {
						var type;
						var target;
						var inner;
						var end;

						if (statement.Op === 'let') {
							type = statement.Type || typeOf(statement.Value, typesOf(local_scope), module, []);
							target = {Type: type === 'bool' ? 'bool' : type, Slots: slots(type)};

							to(expression(statement.Value, local_scope), type);

							target.Slots.slice().reverse().forEach(set);

							local_scope[statement.Name] = target;
						}
						else if (statement.Op === 'set') {
							target = local_scope[statement.Name];

							if (!target)
								throw {Wasm: true, Text: 'Elemenx wasm: no variable ' + statement.Name + ' in ' + fn.Name};

							to(expression(statement.Value, local_scope), target.Type);

							target.Slots.slice().reverse().forEach(set);
						}
						else if (statement.Op === 'if') {
							to(expression(statement.Test, local_scope), 'bool');

							op(0x04, 0x40);

							statements(statement.Then, Object.create(local_scope));

							if (statement.Else && statement.Else.length) {
								op(0x05);

								statements(statement.Else, Object.create(local_scope));
							}

							op(0x0B);
						}
						else if (statement.Op === 'loop') {
							inner = Object.create(local_scope);
							inner[statement.Var] = {Type: 'int', Slots: [local(0x7F)]};
							end = local(0x7F);

							to(expression(statement.From, local_scope), 'int');

							set(inner[statement.Var].Slots[0]);

							/* As js's i < to: to a whole number up (ceil) when it is not one. */
							type = expression(statement.To, local_scope);

							if (type !== 'int' && type !== 'bool') {
								op(0x9B);

								toInt('float');
							}

							set(end);

							op(0x02, 0x40, 0x03, 0x40);

							get(inner[statement.Var].Slots[0]);
							get(end);

							op(0x4E, 0x0D, 1);

							statements(statement.Body, inner);

							get(inner[statement.Var].Slots[0]);

							i32(1);

							op(0x6A);

							set(inner[statement.Var].Slots[0]);

							op(0x0C, 0, 0x0B, 0x0B);
						}
						else if (statement.Op === 'return') {
							if (statement.Value) to(expression(statement.Value, local_scope), returns);
							else values(returns).forEach(function (kind) {
								if (kind === 0x7F) i32(0);
								else f64(0);
							});

							op(0x0F);
						}
						else {
							type = expression(statement.Value, local_scope);

							values(type).forEach(function () {
								op(0x1A);
							});
						}
					});
				}

				statements(fn.Body, scope);

				/* Off its end: noughts (js gives undefined). */
				values(returns).forEach(function (kind) {
					if (kind === 0x7F) i32(0);
					else f64(0);
				});

				op(0x0B);

				return {Locals: locals, Code: code};
			}

			/* A body of bytes: its locals by runs of one type, its code. */
			function body (locals, code) {
				var runs = [];

				locals.forEach(function (kind) {
					if (runs.length && runs[runs.length - 1][1] === kind) runs[runs.length - 1][0]++;
					else runs.push([1, kind]);
				});

				var made = leb(runs.length);

				runs.forEach(function (run) {
					made = made.concat(leb(run[0]), [run[1]]);
				});

				made = made.concat(code);

				return leb(made.length).concat(made);
			}

			var functionTypes = [];

			try {
				module.Functions.forEach(function (fn) {
					var params = [];
					var made = compile(fn);

					(fn.Params || []).forEach(function (param) {
						params = params.concat(values(param.Type));
					});

					functionTypes[indices[fn.Name]] = typeIndex(params, values(fn.Returns || 'void'));
					bodies[indices[fn.Name]] = body(made.Locals, made.Code);

					described.push({Name: fn.Name, Params: (fn.Params || []).map(function (param) {
						return param.Type;
					}), Returns: fn.Returns || 'void'});
				});
			}
			catch (error) {
				if (!error || !error.Wasm)
					throw error;

				told(diagnostics, error.Text);

				return {Diagnostics: diagnostics};
			}

			/* ldexp(x, k): x times 2^k, by as many steps as js's rt_ldexp takes. */
			functionTypes[helpers.ldexp] = typeIndex([0x7C, 0x7F], [0x7C]);
			bodies[helpers.ldexp] = body([], [].concat(
				[0x20, 1, 0x41], leb(1023, true), [0x4A, 0x04, 0x40],
				[0x20, 0, 0x44], f64Bytes(8.98846567431158e307), [0xA2, 0x21, 0, 0x20, 1, 0x41], leb(1023, true), [0x6B, 0x21, 1],
				[0x20, 1, 0x41], leb(1023, true), [0x4A, 0x04, 0x40],
				[0x20, 0, 0x44], f64Bytes(8.98846567431158e307), [0xA2, 0x21, 0, 0x20, 1, 0x41], leb(1023, true), [0x6B, 0x21, 1],
				[0x20, 1, 0x41], leb(1023, true), [0x4A, 0x04, 0x40, 0x41], leb(1023, true), [0x21, 1, 0x0B],
				[0x0B],
				[0x05],
				[0x20, 1, 0x41], leb(-1022, true), [0x48, 0x04, 0x40],
				[0x20, 0, 0x44], f64Bytes(2.004168360008973e-292), [0xA2, 0x21, 0, 0x20, 1, 0x41], leb(969, true), [0x6A, 0x21, 1],
				[0x20, 1, 0x41], leb(-1022, true), [0x48, 0x04, 0x40],
				[0x20, 0, 0x44], f64Bytes(2.004168360008973e-292), [0xA2, 0x21, 0, 0x20, 1, 0x41], leb(969, true), [0x6A, 0x21, 1],
				[0x20, 1, 0x41], leb(-1022, true), [0x48, 0x04, 0x40, 0x41], leb(-1022, true), [0x21, 1, 0x0B],
				[0x0B],
				[0x0B],
				[0x0B],
				/* x * reinterpret((k + 1023) << 52) */
				[0x20, 0, 0x20, 1, 0x41], leb(1023, true), [0x6A, 0xAC, 0x42, 52, 0x86, 0xBF, 0xA2, 0x0B]
			));

			/* ilogb(x): its exponent, a number under 2^-1022 lifted by 2^54 first. */
			functionTypes[helpers.ilogb] = typeIndex([0x7C], [0x7F]);
			bodies[helpers.ilogb] = body([0x7F], [].concat(
				[0x20, 0, 0xBD, 0x42, 52, 0x88, 0xA7, 0x41], leb(2047, true), [0x71, 0x21, 1],
				[0x20, 1, 0x45, 0x04, 0x7F],
				[0x20, 0, 0x44], f64Bytes(18014398509481984), [0xA2, 0xBD, 0x42, 52, 0x88, 0xA7, 0x41], leb(2047, true), [0x71, 0x41], leb(1077, true), [0x6B],
				[0x05, 0x20, 1, 0x41], leb(1023, true), [0x6B, 0x0B, 0x0B]
			));

			/* toInt(x): the same as in its place (toInt of compile), for the parameters of a batch. */
			functionTypes[helpers.toInt] = typeIndex([0x7C], [0x7F]);
			bodies[helpers.toInt] = body([], [].concat([0x20, 0, 0xFC, 0x06, 0xA7, 0x41, 0, 0x20, 0, 0x44], f64Bytes(9223372036854775808), [0x63, 0x1B, 0x0B]));

			/* A deep one by its guard: as deep as MaxDepth, then the trap of unreachable, told by the global Deep. */
			module.Functions.forEach(function (fn) {
				var params = [];
				var code = [0x23, 0, 0x41, 1, 0x6A, 0x24, 0, 0x23, 0, 0x41].concat(leb(max, true), [0x4A, 0x04, 0x40, 0x41, 1, 0x24, 1, 0x00, 0x0B]);
				var at = 0;

				if (!deep[fn.Name]) return;

				(fn.Params || []).forEach(function (param) {
					params = params.concat(values(param.Type));
				});

				params.forEach(function () {
					code = code.concat([0x20], leb(at++));
				});

				code = code.concat([0x10], leb(indices[fn.Name]), [0x23, 0, 0x41, 1, 0x6B, 0x24, 0, 0x0B]);
				functionTypes[indices['guard:' + fn.Name]] = typeIndex(params, values(fn.Returns || 'void'));
				bodies[indices['guard:' + fn.Name]] = body([], code);
			});

			/*
			 * batch:<name>(count, input, output, fixed): count runs, the numbers of each from input (its first Fixed parameters
			 * from fixed, the same for each), its results to output.
			 */
			module.Functions.forEach(function (fn) {
				var ins = [];
				var outs = values(fn.Returns || 'void');
				var code = [];
				var locals = [];
				var at = 0;
				var kept = [];
				var target = indices[deep[fn.Name] ? 'guard:' + fn.Name : fn.Name];
				var fixed = 0;

				if (!own(indices, 'batch:' + fn.Name)) return;

				(fn.Params || []).forEach(function (param, index) {
					ins = ins.concat(values(param.Type));

					if (index < batchOf(fn.Name))
						fixed = ins.length;
				});

				described.filter(function (one) {
					return one.Name === fn.Name;
				})[0].Fixed = fixed;

				/* locals: 4 i (index), then one of each result */
				locals.push(0x7F);

				outs.forEach(function (kind) {
					locals.push(kind);
				});

				code = code.concat([0x02, 0x40, 0x03, 0x40, 0x20, 4, 0x20, 0, 0x4E, 0x0D, 1]);

				ins.forEach(function (kind) {
					code = code.concat(at < fixed ? [0x20, 3, 0x2B, 3] : [0x20, 1, 0x2B, 3], leb((at < fixed ? at : at - fixed) * 8));

					if (kind === 0x7F)
						code = code.concat([0x10], leb(helpers.toInt));

					at++;
				});

				code = code.concat([0x10], leb(target));

				outs.forEach(function (kind, index) {
					kept.unshift(5 + index);
				});

				kept.forEach(function (slot) {
					code = code.concat([0x21], leb(slot));
				});

				outs.forEach(function (kind, index) {
					code = code.concat([0x20, 2, 0x20], leb(5 + index), kind === 0x7F ? [0xB7] : [], [0x39, 3], leb(index * 8));
				});

				code = code.concat(
					[0x20, 1, 0x41], leb((ins.length - fixed) * 8, true), [0x6A, 0x21, 1],
					[0x20, 2, 0x41], leb(outs.length * 8, true), [0x6A, 0x21, 2],
					[0x20, 4, 0x41, 1, 0x6A, 0x21, 4, 0x0C, 0, 0x0B, 0x0B, 0x0B]
				);

				functionTypes[indices['batch:' + fn.Name]] = typeIndex([0x7F, 0x7F, 0x7F, 0x7F], []);
				bodies[indices['batch:' + fn.Name]] = body(locals, code);

				exports.push(textBytes('batch:' + fn.Name).concat([0x00], leb(indices['batch:' + fn.Name])));
			});

			module.Functions.forEach(function (fn) {
				exports.push(textBytes(fn.Name).concat([0x00], leb(indices[deep[fn.Name] ? 'guard:' + fn.Name : fn.Name])));
			});

			exports.push(textBytes('memory').concat([0x02, 0]));
			exports.push(textBytes('depth').concat([0x03, 0]));
			exports.push(textBytes('deep').concat([0x03, 1]));

			return {Bytes: new Uint8Array([0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00].concat(
				section(1, types),
				/*
				 * Its memory is not its own: env.memory, given (one for all the modules of a page, of a worker). Regression: each
				 * module of each ground had its own, the browser keeps a great space for each, and past a few hundred it had no more:
				 * Out of memory: Cannot allocate Wasm memory.
				 */
				section(2, [textBytes('env').concat(textBytes('memory'), [0x02, 0x00, 1])]),
				section(3, functionTypes.map(function (index) {
					return leb(index);
				})),
				section(6, [[0x7F, 1, 0x41, 0, 0x0B], [0x7F, 1, 0x41, 0, 0x0B]]),
				section(7, exports),
				section(10, bodies)
			)), Exports: described, MaxDepth: max, Diagnostics: []};
		}

		/*
		 * A module of wasm made (Bytes of ir-wasm, or the Value of its result): {Functions: {name: function} (a vector as an
		 * array, a bool as a bool, as js gives them), Batch(name, input (numbers: the parameters of each run one after
		 * another), count) (a Float64Array of the results of each run one after another), Memory}. callback(error, made):
		 * compiled off the thread; without one it is made at once (a worker, a small module).
		 */
		var sharedMemory = null;

		/* The memory of all the modules of wasm of the page (env.memory of each): its batches run one at a time. */
		function memory () {
			if (!sharedMemory)
				sharedMemory = new WebAssembly.Memory({initial: 1});

			return sharedMemory;
		}

		function instance (given, callback) {
			var value = given && given.Bytes ? given : {Bytes: given, Exports: null};

			function made (compiled) {
				var live = new WebAssembly.Instance(compiled, {env: {memory: memory()}});
				var raw = live.exports;

				/*
				 * The lists of numbers of a call (its parameters of floats) written to the memory from a place on: each its length,
				 * then its numbers; their addresses by the index of their parameters.
				 */
				function lists (params, given, from) {
					var places = {};
					var at = from;
					var need = from;
					var i;

					for (i = 0; i < params.length; i++) {
						if (params[i] === 'floats')
							need += ((given[i] || []).length + 1) * 8;
					}

					if (need === from) return places;

					if (need > raw.memory.buffer.byteLength)
						raw.memory.grow(Math.ceil((need - raw.memory.buffer.byteLength) / 65536));

					for (i = 0; i < params.length; i++) {
						if (params[i] !== 'floats') continue;

						var list = given[i] || [];
						var into = new Float64Array(raw.memory.buffer, at, list.length + 1);

						into[0] = list.length;

						into.set(list, 1);

						places[i] = at;
						at += (list.length + 1) * 8;
					}

					return places;
				}
				var functions = {};
				var described = value.Exports || [];

				described.forEach(function (fn) {
					var run = raw[fn.Name];
					if (typeof run !== 'function') return;

					functions[fn.Name] = function () {
						var args = [];
						var result;
						var i;
						var places = lists(fn.Params, arguments, 0);

						for (i = 0; i < fn.Params.length; i++) {
							if (fn.Params[i] === 'floats') args.push(places[i]);
							else if (vector(fn.Params[i])) args.push.apply(args, Array.prototype.slice.call(arguments[i] || [], 0, WasmTypes[fn.Params[i]]));
							else args.push(fn.Params[i] === 'bool' ? (arguments[i] ? 1 : 0) : arguments[i]);
						}

						raw.depth.value = 0;

						try {
							result = run.apply(null, args);
						}
						catch (error) {
							if (raw.deep.value) {
								raw.deep.value = 0;

								throw new Error('Elemenx IR: ' + fn.Name + ' goes deeper than ' + (value.MaxDepth || 256));
							}

							throw error;
						}

						return fn.Returns === 'bool' ? !!result : result;
					};
				});

				return {
					Functions: functions,
					Memory: raw.memory,
					Batch: function (name, input, count, fixed) {
						var fn = described.filter(function (one) {
							return one.Name === name;
						})[0];
						var run = raw['batch:' + name];
						var all = 0;
						var given;
						var ins;
						var outs;
						var bytes;
						var have;
						var output;

						if (!fn || !run)
							throw new Error('Elemenx Compilers: no batch of ' + name);

						fn.Params.forEach(function (type) {
							all += WasmTypes[type];
						});

						given = fn.Fixed || 0;
						ins = all - given;
						outs = WasmTypes[fn.Returns] || 0;
						/* The memory: what is fixed, the input, the output. */
						bytes = (given + (ins + outs) * count) * 8;
						have = raw.memory.buffer.byteLength;

						if (bytes > have)
							raw.memory.grow(Math.ceil((bytes - have) / 65536));

						/* Its lists of numbers (fixed: one for all its runs) after its output, their addresses in their places of fixed. */
						var values = Array.prototype.slice.call(fixed || [], 0, given);
						var placed = lists(fn.Params, fixed || [], bytes);

						Object.keys(placed).forEach(function (index) {
							values[index] = placed[index];
						});

						if (given)
							new Float64Array(raw.memory.buffer, 0, given).set(values);

						new Float64Array(raw.memory.buffer, given * 8, ins * count).set(input.length > ins * count ? Array.prototype.slice.call(input, 0, ins * count) : input);

						raw.depth.value = 0;

						run(count, given * 8, (given + ins * count) * 8, 0);

						output = new Float64Array(outs * count);

						output.set(new Float64Array(raw.memory.buffer, (given + ins * count) * 8, outs * count));

						return output;
					}
				};
			}

			if (typeof callback !== 'function')
				return made(new WebAssembly.Module(value.Bytes));

			WebAssembly.compile(value.Bytes).then(function (compiled) {
				var result;

				try {
					result = made(compiled);
				}
				catch (error) {
					callback(error);

					return;
				}

				callback(null, result);
			}, function (error) {
				callback(error);
			});

			return undefined;
		}

		function define (name, definition) {
			var given = definition || {};
			if (!name || typeof name !== 'string' || !given.From || !given.To || typeof given.Compile !== 'function')
				throw new Error('Elemenx.Compilers.Define expects (name, {From, To, Compile(job, done)})');

			if (!own(transitions, name))
				order.push(name);

			transitions[name] = {Name: name, From: String(given.From), To: String(given.To), Compile: given.Compile};

			return name;
		}

		/* The shortest chain of transitions from a kind to another (breadth first, in the order they were defined), or null. */
		function path (from, to) {
			var queue = [{At: from, Chain: []}];
			var seen = {};

			seen[from] = true;

			while (queue.length) {
				var step = queue.shift();
				if (step.At === to) return step.Chain;

				order.forEach(function (name) {
					var transition = transitions[name];

					if (transition.From === step.At && !own(seen, transition.To)) {
						seen[transition.To] = true;

						queue.push({At: transition.To, Chain: step.Chain.concat([name])});
					}
				});
			}

			return null;
		}

		/*
		 * Runs a job {From, To, Files: [{Name, Text}], Entry, Options} along the chain of its kinds, each transition given
		 * the result of the one before as its job. callback(error, result {To, Files, Diagnostics, Log, Value}): an error
		 * when no chain goes there or a step fails; diagnostics of type error stop the chain too (the error says the first).
		 */
		function run (job, callback) {
			var given = job || {};
			var chain;
			var log = [];

			if (typeof callback !== 'function')
				throw new Error('Elemenx.Compilers.Run expects (job, callback)');

			chain = given.From && given.To ? path(String(given.From), String(given.To)) : null;

			if (!chain) {
				callback(new Error('Elemenx Compilers: no way from ' + given.From + ' to ' + given.To));

				return;
			}

			function next (index, current) {
				var transition = transitions[chain[index]];
				var answered = false;

				if (!transition) {
					callback(null, Object.assign({}, current, {To: given.To, Log: log.join('\n')}));

					return;
				}

				try {
					transition.Compile({From: transition.From, To: transition.To, Files: current.Files || [], Entry: current.Entry || given.Entry, Options: given.Options || {}, Value: current.Value}, function (error, result) {
						var made = result || {};
						var failed = (made.Diagnostics || []).filter(function (one) {
							return one.Severity === 'error';
						})[0];

						if (answered) return;

						answered = true;

						if (made.Log)
							log.push(made.Log);

						if (error || failed) {
							callback(error || new Error(failed.Text), {To: transition.To, Files: made.Files || [], Diagnostics: made.Diagnostics || [], Log: log.join('\n')});

							return;
						}

						next(index + 1, {Files: made.Files || [], Entry: made.Entry || current.Entry, Value: made.Value, Diagnostics: made.Diagnostics || []});
					});
				}
				catch (error) {
					if (!answered) {
						answered = true;

						callback(error);
					}
				}
			}

			next(0, {Files: given.Files || [], Entry: given.Entry, Value: given.Value, Diagnostics: []});
		}

		/* A transition from the IR to a text language: the module is the Value of the job, or the JSON of its first file. */
		function emitting (name, extension) {
			return function (job, done) {
				var module = job.Value || JSON.parse(job.Files[0].Text);
				var diagnostics = check(module);
				var ready;
				var made;

				if (!diagnostics.length && languages[name].OwnMath)
					module = ownMath(module);

				/* What a language asks of a module first (Prepare: {Module, Diagnostics}): glsl, its types made to meet. */
				if (!diagnostics.length && typeof languages[name].Prepare === 'function') {
					ready = languages[name].Prepare(module, job.Options);
					module = ready.Module;
					diagnostics = ready.Diagnostics || [];
				}

				if (diagnostics.length) {
					done(null, {Diagnostics: diagnostics});

					return;
				}

				made = emit(module, languages[name], job.Options);

				done(null, {Files: [{Name: (job.Entry || module.Entry || 'module') + '.' + extension, Text: made.Text}], Diagnostics: made.Diagnostics, Value: made.Text});
			};
		}

		function language (name, definition) {
			if (arguments.length === 1)
				return own(languages, name) ? languages[name] : null;

			if (!name || !definition || !definition.Statements || !definition.Module)
				throw new Error('Elemenx.Compilers.Language expects (name) or (name, definition)');

			languages[name] = definition;

			define('ir-' + name, {From: 'ir', To: name, Compile: emitting(name, definition.Extension || name)});

			return name;
		}

		/*
		 * Elemenx.Compilers: transitions of kinds of code and the IR between them.
		 * - Define(name, {From, To, Compile(job, done)}), Names(), Path(from, to) (the names of the shortest chain),
		 *   Run(job, callback(error, result)): a job goes from its From to its To by as many transitions as it takes.
		 * - Check(module): what is wrong in a module of the IR ([{File, Line, Column, Severity, Text}]).
		 * - Language(name, definition): a text language described as data, with its transition ir-<name>; Language(name)
		 *   gives it (Prepare(module): what it asks of a module first, {Module, Diagnostics}). Built in: js (ES5), cpp
		 *   (C++17) and glsl (ES 3.00, of numbers only).
		 * - Load(text): the functions of a module of js made ({name: function}).
		 */
		Elemenx.Compilers = {
			Define: define,
			Names: function () {
				return order.slice();
			},
			Path: function (from, to) {
				return path(String(from), String(to));
			},
			Run: run,
			Check: check,
			Language: language,
			Load: function (text) {
				return (new Function(String(text)))();
			},
			Instance: instance,
			Math: ownFunctions
		};

		define('kernel-ir', {From: 'kernel', To: 'ir', Compile: function (job, done) {
			var made = kernel(job.Value !== undefined ? job.Value : (job.Files[0] || {}).Text);

			done(null, {Diagnostics: made.Diagnostics, Value: made.Module, Files: [{Name: (job.Entry || made.Module.Entry || 'module') + '.ir.json', Text: JSON.stringify(made.Module)}]});
		}});

		define('ir-wasm', {From: 'ir', To: 'wasm', Compile: function (job, done) {
			var made = wasm(job.Value || JSON.parse(job.Files[0].Text), job.Options);

			done(null, made.Bytes ? {Diagnostics: made.Diagnostics, Value: {Bytes: made.Bytes, Exports: made.Exports, MaxDepth: made.MaxDepth}, Files: [{Name: (job.Entry || 'module') + '.wasm', Bytes: made.Bytes}]} : {Diagnostics: made.Diagnostics});
		}});

		language('js', Object.assign({Extension: 'js'}, javascript));
		language('cpp', Object.assign({Extension: 'cpp'}, cpp));
		language('glsl', Object.assign({Extension: 'glsl'}, glsl));
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* SSR */
	(function (global) {
		'use strict';

		/*
		 * A page rendered on a server: its markup in the mount of its Application (the mount has data-elemenx-ssr, the version
		 * of the framework that rendered it) and its state in <script type="application/json" data-elemenx-state>, {Version,
		 * Application, URL, Components: {key: fields}}. A Component loads its data in $OnSSR(done, context): on the server the
		 * page waits for every done(error), and the fields of each such Component go into the state; on the client a Component
		 * whose key is in the state starts with its fields (and $OnSSR is not called), one that is not calls $OnSSR there.
		 * The key of a Component is its place in the tree of Components: the key of its owner, its name and how many of that
		 * name its owner made before it (Page#0/Card#2), the same on both sides whatever comes late.
		 */
		var keys = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
		var counts = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
		var roots = {};
		var made = [];
		var state = null;
		var waiting = [];

		Runtime.SSR = {
			/* True while this copy renders a page for a server (its page sets ElemenxSSR first): $OnSSR is awaited and its fields are kept. */
			Server: typeof ElemenxSSR === 'object' && !!ElemenxSSR,
			/* The $OnSSR not done yet. */
			Pending: 0
		};

		/* The state of the page: the Components of every state script of the document, each script read once. */
		function pageState () {
			var scripts;
			var i = 0;

			state = state || {};

			if (!Runtime.HasDOM || !global.document.querySelectorAll) return state;

			scripts = global.document.querySelectorAll('script[type="application/json"][data-elemenx-state]');

			while (i < scripts.length) {
				if (!scripts[i].ElemenxRead) {
					scripts[i].ElemenxRead = true;

					try {
						Runtime.Assign(state, JSON.parse(scripts[i].textContent || '{}').Components || {});
					}
					catch (error) {
						Runtime.Report(error);
					}
				}

				i++;
			}

			return state;
		}

		/* The fields of a Component that go into the state: its own values that JSON keeps, not its methods nor its $ names. */
		function fieldsOf (values) {
			var result = {};

			Object.keys(values).forEach(function (key) {
				var value = values[key];
				var text;

				if (typeof value === 'function' || key.charAt(0) === '$' || key.charAt(0) === '_') return;

				try {
					text = JSON.stringify(value);
				}
				catch (error) {
					return;
				}

				if (text !== undefined)
					result[key] = JSON.parse(text);
			});

			return result;
		}

		function keyOf (api, name, parent) {
			var owner = parent && keys ? keys.get(parent) : '';
			var count = parent && counts ? counts.get(parent) : roots;
			var key;

			if (!count) {
				count = {};

				counts.set(parent, count);
			}

			count[name] = (count[name] || 0) + 1;
			key = (owner ? owner + '/' : '') + name + '#' + (count[name] - 1);

			if (keys)
				keys.set(api, key);

			return key;
		}

		/*
		 * A Component made: its key, and its data. From the state of the page when it has its key there (the entry let go
		 * then: a key comes once, a Component made again is the next of its name), else by its $OnSSR; on the server its
		 * fields are kept when it is done.
		 */
		Runtime.SSR.Component = function (api, name, definition, values, update, parent) {
			var key = keyOf(api, name || 'Component', parent);
			var page;
			var entry;
			var finished = false;

			if (typeof definition.$OnSSR !== 'function') return;

			page = Runtime.SSR.Server ? {} : pageState();

			if (Runtime.Own(page, key)) {
				update(page[key]);

				delete page[key];

				return;
			}

			entry = {Key: key, Values: values};

			if (Runtime.SSR.Server) {
				made.push(entry);

				Runtime.SSR.Pending++;
			}

			Runtime.Untracked(function () {
				definition.$OnSSR.call(api, function (error) {
					if (finished) return;

					finished = true;

					if (error)
						Runtime.Report(error);

					if (Runtime.SSR.Server) {
						Runtime.SSR.Pending--;

						settle();
					}
				}, {Server: Runtime.SSR.Server, Key: key, URL: Runtime.HasDOM && global.location ? global.location.href : ''});
			});
		};

		/* The fields of every Component a server render loaded, by their keys. */
		Runtime.SSR.State = function () {
			var result = {};

			made.forEach(function (entry) {
				result[entry.Key] = fieldsOf(entry.Values);
			});

			return result;
		};

		/* Calls back once no $OnSSR is pending, after the renders their data brought (a few ticks with none). */
		function settle () {
			var calm = 0;

			if (!waiting.length) return;

			(function check () {
				if (Runtime.SSR.Pending) return;

				calm++;

				if (calm < 3) {
					setTimeout(check, 0);

					return;
				}

				waiting.splice(0).forEach(function (callback) {
					callback();
				});
			})();
		}

		Runtime.SSR.Settled = function (callback) {
			waiting.push(callback);

			settle();
		};

		/* The markup a server sent into a mount: what replaces it (or what it becomes) once the Application is ready. */
		Runtime.SSR.Markup = function (mount) {
			var nodes = [];
			var i = 0;

			if (!mount || !mount.getAttribute || mount.getAttribute('data-elemenx-ssr') === null) return null;

			while (i < mount.childNodes.length) {
				nodes.push(mount.childNodes[i]);

				i++;
			}

			return nodes;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Application */
	(function (global) {
		'use strict';

		var own = Runtime.Own;
		var applications = {};
		var mountOwners = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
		var mountedApplications = [];
		var started = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
		/* What a server render waits for, by Application: its page there ({Done, Error}). */
		var rendered = {};

		function applicationMountOwner (element) {
			if (!mountOwners || !element) return null;

			return mountOwners.get(element) || null;
		}

		/*
		 * Calls callback once an Application has started: its Libraries, its dictionaries, its Services and its Components
		 * ready (a widget of it is made then); at once when it has, or for a value that is no Application.
		 */
		Runtime.WhenStarted = function (application, callback) {
			var state = application && started ? started.get(application) : null;

			if (!state || state.Done) {
				callback();

				return;
			}

			state.Waiting.push(callback);
		};

		Runtime.ApplicationBoundary = function (application, element) {
			var owner = applicationMountOwner(element);

			return !!(owner && owner !== application);
		};

		function rememberMount (application, element) {
			var i = 0;

			while (i < mountedApplications.length) {
				if (mountedApplications[i].Application === application) {
					mountedApplications[i].Mount = element;

					return;
				}

				i++;
			}

			mountedApplications.push({Application: application, Mount: element});
		}

		function forgetMount (application) {
			var i = mountedApplications.length - 1;

			while (i >= 0) {
				if (mountedApplications[i].Application === application) {
					mountedApplications.splice(i, 1);
				}

				i--;
			}
		}

		function nestedMounts (application, element) {
			var result = [];
			var i = 0;

			while (i < mountedApplications.length) {
				if (mountedApplications[i].Application !== application && element !== mountedApplications[i].Mount && element.contains(mountedApplications[i].Mount)) {
					result.push(mountedApplications[i].Mount);
				}

				i++;
			}

			return result;
		}

		function mountElement (value) {
			if (!Runtime.HasDOM) return null;

			if (!value)
				return global.document.body;

			if (typeof value === 'string')
				return global.document.querySelector(value);

			return value;
		}

		/* Application: status, router and nested mounts */
		/* Replaces the mount content with a status: HTML, a registered Template '#name' or a <template> element '#id'. */
		function renderApplicationStatus (mount, source) {
			Runtime.Template.Harvest(mount);

			var template;
			var fragment;

			while (mount.firstChild)
				mount.removeChild(mount.firstChild);

			if (!source) return;

			if (typeof source === 'string' && source.charAt(0) === '#') {
				var registered = Runtime.Template.Get(source.substring(1));

				if (registered !== null && registered !== undefined) {
					mount.innerHTML = registered;

					return;
				}

				template = document.querySelector(source);

				if (template && template.tagName === 'TEMPLATE') {
					fragment = template.content.cloneNode(true);

					mount.appendChild(fragment);

					return;
				}
			}

			mount.innerHTML = String(source);
		}

		/* The declarative $Router without Root: the Router always belongs to the root Component. */
		function applicationRouterDefinition (value, root) {
			var routerDefinition = {};
			var key;

			for (key in value) {
				if (!own(value, key)) continue;
				if (key === 'Root') continue;

				routerDefinition[key] = value[key];
			}

			routerDefinition.Root = root;

			return routerDefinition;
		}

		/* Mounts of other Applications inside this mount survive the render of the root Component. */
		function detachMounts (mounts) {
			var i = 0;

			while (i < mounts.length) {
				if (mounts[i].parentNode)
					mounts[i].parentNode.removeChild(mounts[i]);

				i++;
			}
		}

		/* A detached mount returns in place of its placeholder with the same id, or at the end of the mount. */
		function restoreMounts (mount, mounts) {
			var i = 0;

			while (i < mounts.length) {
				var preservedMount = mounts[i];
				var placeholder = preservedMount.id ? mount.querySelector('#' + preservedMount.id) : null;

				if (placeholder && placeholder.parentNode) placeholder.parentNode.replaceChild(preservedMount, placeholder);
				else mount.appendChild(preservedMount);

				i++;
			}
		}

		/* Application: discovery */

		/* True when the root Component and every Component of its templates are registered or bundled. */
		function componentGraphAvailable (componentName) {
			var factory = Runtime.ResolveComponentRegistered(componentName);
			var bundled;
			var inspected = {};

			function inspectFactory (currentFactory) {
				var componentDefinition = currentFactory && currentFactory.Definition || {};
				var template = componentDefinition.$Template;
				var match;
				var tag;
				var childFactory;
				var childBundle;
				var expression;

				if (typeof template !== 'string') return false;

				expression = /<\s*([A-Za-z][A-Za-z0-9_-]*)\b/g;

				while ((match = expression.exec(template))) {
					tag = match[1];

					/*
					 * Preserve the source spelling here. DOM parsing lowercases custom
					 * PascalCase tags, which makes an unbundled hybrid dependency
					 * indistinguishable from an ordinary HTML element before Discovery
					 * has built its map. Elemenx Components are candidates when their
					 * source tag is PascalCase or a custom-element style name.
					 */
					if (tag.indexOf('-') === -1 && tag.charAt(0) === tag.charAt(0).toLowerCase()) continue;

					childFactory = Runtime.ResolveComponentRegistered(tag);

					if (!childFactory) {
						childBundle = Runtime.Bundle.ResolvedName('Component', tag);

						if (!childBundle) return false;

						Runtime.Bundle.Load('Component', childBundle);

						childFactory = Runtime.ResolveComponentRegistered(childBundle);

						if (!childFactory) return false;
					}

					if (childFactory.ComponentName && inspected[String(childFactory.ComponentName).toLowerCase()]) continue;

					if (childFactory.ComponentName)
						inspected[String(childFactory.ComponentName).toLowerCase()] = true;

					if (!inspectFactory(childFactory)) return false;
				}

				return true;
			}

			if (!factory) {
				bundled = Runtime.Bundle.ResolvedName('Component', componentName);

				if (bundled) {
					Runtime.Bundle.Load('Component', bundled);

					factory = Runtime.ResolveComponentRegistered(componentName);
				}
			}

			if (!factory)
				return false;

			if (factory.ComponentName)
				inspected[String(factory.ComponentName).toLowerCase()] = true;

			return inspectFactory(factory);
		}

		/*
		 * The Libraries of $Discovery: [{Name, Root, Graph}] from paths (from the definition, as $Root) of a folder with its
		 * index.js or of a graph file of any name, or {Path, Name}. A Library is named by Name, its graph file other than
		 * index.js, or its folder.
		 */
		function discoveredLibraries (definition) {
			var value = definition.$Discovery;
			if (value === undefined || value === null) return [];

			if (!Array.isArray(value))
				throw new Error('Elemenx.Application $Discovery expects an Array of paths or {Path, Name}');

			return value.map(function (entry) {
				var item = typeof entry === 'string' ? {Path: entry} : entry;
				var target;
				var graph;
				var root;

				if (!item || typeof item.Path !== 'string' || !item.Path || (item.Name !== undefined && typeof item.Name !== 'string'))
					throw new Error('Elemenx.Application $Discovery expects an Array of paths or {Path, Name}');

				target = Runtime.DefinitionURL(definition, item.Path.replace(/\/+$/, ''));

				if (Runtime.HasDOM)
					target = new URL(target, Runtime.BaseURL()).href;

				graph = /\.js(?:[?#].*)?$/i.test(target) ? target : null;
				root = graph ? target.substring(0, target.lastIndexOf('/')) : target;

				return {
					Name: item.Name || (graph && !/\/index\.js(?:[?#].*)?$/i.test(graph) ? graph.substring(graph.lastIndexOf('/') + 1).replace(/\.js(?:[?#].*)?$/i, '') : root.substring(root.lastIndexOf('/') + 1)),
					Root: root,
					Graph: graph
				};
			});
		}

		/* Application: reload */
		function reloadApplicationEntity (application, type, entityName, callback) {
			var bundled = Runtime.Bundle.ResolvedName(type, entityName);

			if (type !== 'Component' && type !== 'Service')
				throw new Error('Elemenx Reload expects Component or Service');

			if (type === 'Component' && Runtime.BeginComponentReload) {
				Runtime.BeginComponentReload(entityName);
			}

			if (bundled) {
				try {
					Runtime.Bundle.Reload(type, bundled);

					if (type === 'Service' && Runtime.RefreshDeferredService) {
						Runtime.RefreshDeferredService(entityName);
					}

					if (type === 'Component' && Runtime.ReloadComponentInstances) {
						Runtime.ReloadComponentInstances(entityName);
					}

					if (callback)
						callback(null);
				}
				catch (error) {
					if (type === 'Component' && Runtime.FailComponentReload) {
						Runtime.FailComponentReload(entityName, error);
					}

					if (callback)
						callback(error);
				}

				return application;
			}

			return Runtime.Discovery.Reload(application, type, entityName, function (error) {
				if (error && type === 'Component' && Runtime.FailComponentReload) {
					Runtime.FailComponentReload(entityName, error);
				}

				if (!error && type === 'Service' && Runtime.RefreshDeferredService) {
					Runtime.RefreshDeferredService(entityName);
				}

				if (!error && type === 'Component' && Runtime.ReloadComponentTemplate) {
					Runtime.ReloadComponentTemplate(entityName, function (templateError) {
						if (templateError && Runtime.FailComponentReload) {
							Runtime.FailComponentReload(entityName, templateError);
						}

						if (!templateError && Runtime.ReloadComponentInstances) {
							Runtime.ReloadComponentInstances(entityName);
						}

						if (callback)
							callback(templateError);
					});

					return;
				}

				if (callback)
					callback(error);
			});
		}

		/* Application: instance */
		function createApplication (name, definition) {
			var startedAt = new Date();
			var destroyed = false;
			var root = null;
			var router = null;
			var webWorkers = {};
			var serviceWorkers = {};
			var ownedMount = null;
			var shadow = null;
			var served = null;
			var api = {};

			definition = definition || {};

			/* Instance: public API */
			/*
			 * Its title and its icon ($Title, $Icon; {{ }} read in it), the ones of the page while a page of its Router has
			 * none of its own.
			 */
			var headEffects = [];

			api.$Title = function (value) {
				if (!arguments.length)
					return Elemenx.Title();

				Runtime.HeadSet(api, 'Title', value, api);

				return Elemenx;
			};

			api.$Icon = function (value) {
				if (!arguments.length)
					return Elemenx.Icon();

				Runtime.HeadSet(api, 'Icon', value, api);

				return Elemenx;
			};

			Runtime.HeadOwn(api, definition, api, headEffects);

			api.$Name = function () {
				return name;
			};

			api.$StartedAt = function () {
				return new Date(startedAt.getTime());
			};

			api.$Root = function () {
				return definition.$Root || null;
			};

			api.$Libraries = function () {
				return typeof (definition.$Use || definition.Use) === 'string' ? [definition.$Use || definition.Use] : (definition.$Use || definition.Use || []).slice();
			};

			api.$Mount = function () {
				return mountElement(definition.$Mount);
			};

			api.$Application = function () {
				return api;
			};

			api.$Template = function (templateName, value) {
				if (arguments.length === 1)
					return Elemenx.Template(templateName);

				return Elemenx.Template(templateName, value);
			};
			api.$Template.Has = Elemenx.Template.Has;
			api.$Template.Remove = Elemenx.Template.Remove;
			api.$Template.Loader = Elemenx.Template.Loader;
			api.$Template.Reload = Elemenx.Template.Reload;

			api.$Network = function (context, value) {
				if (arguments.length === 2) {
					Elemenx.Network.Context(context, value);

					return api;
				}

				return Runtime.NetworkFor(api)(context);
			};

			api.$Storage = function (context, value) {
				if (arguments.length === 2) {
					Elemenx.Storage.Context(context, value);

					return api;
				}

				return Elemenx.Storage(context);
			};

			if (Runtime.EventsFor)
				api.$Events = Runtime.EventsFor(api);

			/* Its ports and devices, closed when it is destroyed (DestroyOwnerResources). */
			if (Runtime.HardwareFor)
				api.$Hardware = Runtime.HardwareFor(api);

			/* What it hears of the Ether, heard no more when it is destroyed (DestroyOwnerResources). */
			if (Runtime.EtherFor)
				api.$Ether = Runtime.EtherFor(api);

			api.$Messaging = function (context, value) {
				if (arguments.length === 2) {
					Elemenx.Messaging.Context(context, value);

					return api;
				}

				return Runtime.MessagingFor(api)(context);
			};

			api.$WebWorker = function (workerName, value) {
				if (arguments.length === 1)
					return webWorkers[workerName] || null;

				var handle = Runtime.WebWorkerFor(api)(workerName, value);

				webWorkers[workerName] = handle;

				return handle;
			};

			api.$ServiceWorker = function (workerName, value) {
				var serviceWorker = Runtime.ServiceWorkerFor(api);

				if (arguments.length === 1 && serviceWorkers[workerName]) return serviceWorkers[workerName];

				serviceWorkers[workerName] = arguments.length === 1 ? serviceWorker(workerName) : serviceWorker(workerName, value);

				return serviceWorkers[workerName];
			};

			api.$Service = function (serviceName, value) {
				if (arguments.length === 2) {
					Runtime.RegisterServiceDefinition(serviceName, value);

					return api;
				}

				return Runtime.ServiceForApplication(api, serviceName);
			};

			api.$Reload = function (type, entityName, callback) {
				return reloadApplicationEntity(api, type, entityName, callback);
			};

			api.$Component = function () {
				return root;
			};

			api.$Router = function () {
				return router;
			};

			api.$Destroy = function () {
				if (destroyed) return;

				destroyed = true;

				headEffects.forEach(function (effect) {
					effect.Destroy();
				});

				Runtime.HeadForget(api);

				if (router && router.$Destroy)
					router.$Destroy();

				router = null;

				if (root && root.$Destroy)
					root.$Destroy();

				root = null;

				if (mountOwners && ownedMount && mountOwners.get(ownedMount) === api)
					mountOwners.delete(ownedMount);

				forgetMount(api);

				ownedMount = null;

				var workerName;

				Runtime.DestroyOwnerResources(api);

				Runtime.DestroyApplicationServices(api);

				for (workerName in serviceWorkers) {
					if (!own(serviceWorkers, workerName)) continue;

					if (serviceWorkers[workerName] && serviceWorkers[workerName].Destroy) {
						serviceWorkers[workerName].Destroy();
					}
				}

				if (applications[name] === api) {
					delete applications[name];
					delete rendered[name];
				}
			};

			Runtime.InitializeOwnerSubscriptions(api, definition);

			if (started)
				started.set(api, {Done: false, Waiting: []});

			if (typeof definition.$Bootstrap === 'function') {
				definition.$Bootstrap.call(api);
			}

			/*
			 * Where the Application renders: its mount element, or with $Shadow (true, 'open' or 'closed') a shadow root on
			 * it, which takes every stylesheet of the framework and keeps the ones of the page out. An isolated build (a
			 * widget) renders in a shadow root unless $Shadow is false.
			 */
			function renderTarget () {
				var host = mountElement(definition.$Mount);
				var mode = definition.$Shadow === undefined && Runtime.Isolated ? true : definition.$Shadow;
				if (host && !mode && Runtime.Isolated)
					Runtime.AddStyleDocument();

				if (!host || !mode) return host;

				if (!shadow) {
					shadow = host.shadowRoot || host.attachShadow({mode: mode === 'closed' ? 'closed' : 'open'});

					Runtime.AddStyleRoot(shadow);

					if (Runtime.ShadowHosts.indexOf(host) === -1)
						Runtime.ShadowHosts.push(host);

					if (Runtime.Isolated || !host.lang) {
						host.lang = Elemenx.Locale.Language();
						host.dir = Elemenx.Locale.Direction();
					}
				}

				return shadow;
			}

			/* Instance: status and lifecycle */
			function applicationStatus (source) {
				var mount = renderTarget();
				if (!mount) return;

				renderApplicationStatus(mount, source);
			}

			function startRouter () {
				if (destroyed || router || !definition.$Router || !root) return;

				router = Elemenx.Router(applicationRouterDefinition(definition.$Router, root));

				/*
				 * Over the markup of a server: it goes once the page of the first navigation is there (or it failed), not
				 * before; a page rendered for a server is done then too.
				 */
				if (served || Runtime.SSR.Server) {
					['NavigationEnd', 'NavigationError', 'NavigationCancel'].forEach(function (event) {
						router.On(event, function (context) {
							reveal();

							if (rendered[name] && !rendered[name].Done)
								rendered[name] = {Done: true, Error: event === 'NavigationError' && context ? context.$Error || null : null};
						});
					});
				}

				router.Start();
			}

			function applicationLifecycle (method, error) {
				if (method === '$OnReady')
					startRouter();

				/* A failed Application shows its error, not the splash. */
				if (method === '$OnError' && Runtime.Splash)
					Runtime.Splash.Ready();

				if (typeof api[method] !== 'function') {
					if (method === '$OnError' && error && global.console && typeof global.console.error === 'function')
						global.console.error(error);

					return;
				}

				api[method].call(api, {
					Name: definition.$Component || null,
					$Element: mountElement(definition.$Mount),
					Error: error || null
				});
			}

			function fail (error) {
				applicationStatus(definition.$Error || null);

				applicationLifecycle('$OnError', error);
			}

			/* A loading step of a living Application: its failure fails the Application, its success runs next. */
			function loaded (next) {
				return function (error) {
					if (destroyed) return;

					if (error) {
						fail(error);

						return;
					}

					next();
				};
			}

			/* Instance: root */
			function createRoot () {
				if (destroyed || !definition.$Component || root) return;

				var factory = Elemenx.Component(definition.$Component);
				var mount = renderTarget();
				var mountOwner;

				if (!factory)
					throw new Error('Elemenx Application component not found: ' + definition.$Component);

				if (!mount)
					throw new Error('Elemenx Application mount not found: ' + definition.$Mount);

				Runtime.Template.Harvest(mount);

				if (mountOwners) {
					mountOwner = mountOwners.get(mount);

					if (mountOwner && mountOwner !== api)
						throw new Error('Elemenx Application mount conflict: ' + name + ' cannot mount to an element owned by ' + mountOwner.$Name());

					mountOwners.set(mount, api);

					ownedMount = mount;

					rememberMount(api, mount);
				}

				var options = {
					Application: api,
					AsyncLifecycle: {
						Owner: api,
						Name: definition.$Component,
						Pending: definition.$Pending || null,
						Error: definition.$Error || null,
						Hooks: {
							$OnChildPending: '$OnPending',
							$OnChildReady: '$OnReady',
							$OnChildError: '$OnError'
						}
					}
				};
				var preservedMounts = nestedMounts(api, mount);
				var markup = Runtime.SSR.Markup(mount);

				detachMounts(preservedMounts);

				root = factory(definition.$State || {}, null, options);

				/* Over the markup of a server: the root is made out of sight beside it, and takes its place once ready. */
				if (markup && root.$Element().style) {
					served = {Nodes: markup, Mount: mount, Element: root.$Element(), Display: root.$Element().style.display};
					root.$Element().style.display = 'none';
				}

				mount.appendChild(root.$Element());

				restoreMounts(mount, preservedMounts);

				if (!root._Component || root._Component()) {
					applicationLifecycle('$OnReady', null);
				}
			}

			/* Instance: start */
			function startApplicationRoot () {
				if (destroyed || root) return;

				if (Runtime.Bundle.Ready()) {
					Runtime.Bundle.LoadType('Directive');
					Runtime.Bundle.LoadType('Service');
					Runtime.Bundle.LoadType('Guard');
				}

				var discoveryRoot = Runtime.DefinitionURL(definition, definition.$Root);

				if (discoveryRoot) {
					Runtime.Discovery.Root(api, discoveryRoot);
				}

				/* Started: what waits for it (its widgets) goes on. */
				if (started && started.get(api) && !started.get(api).Done) {
					started.get(api).Done = true;

					started.get(api).Waiting.splice(0).forEach(function (callback) {
						callback();
					});
				}

				/* An Application without a Component of its own (of widgets, Elemenx.Widgets) finds theirs by its root. */
				if (!definition.$Component) return;

				/*
				 * A fully resolvable registry/bundle graph starts without touching the
				 * source tree. The Discovery root is only remembered here; the map is
				 * built lazily by Discovery.Load if a later explicit resource is absent.
				 */
				if (definition.$Root && componentGraphAvailable(definition.$Component)) {
					createRoot();

					return;
				}

				if (!definition.$Root || !Runtime.Discovery) {
					createRoot();

					return;
				}

				/*
				 * Do not clear the Application mount merely because Discovery starts.
				 * Pending UI belongs to an explicit Pending definition; without one the
				 * existing host DOM (including parser-owned TemplateID resources) must
				 * remain available until the root is ready.
				 */
				if (definition.$Pending !== undefined && definition.$Pending !== null) {
					applicationStatus(definition.$Pending);
				}

				applicationLifecycle('$OnPending', null);

				Runtime.Discovery.Build(api, discoveryRoot, function (error) {
					if (destroyed) return;

					/*
					 * Production bundles intentionally omit the source Application graph.
					 * Discovery remains the preferred hybrid fallback when its Root exists,
					 * but a failed Build must not prevent an independently bundled root from
					 * starting. This decision is per Application, never global.
					 */
					if (error) {
						if (componentGraphAvailable(definition.$Component)) createRoot();
						else fail(error);

						return;
					}

					Runtime.Discovery.LoadDirectives(api, loaded(function () {
						Runtime.Discovery.LoadServices(api, loaded(createRoot));
					}));
				});
			}

			/* The fields, the open details and the focus of a markup, in the order of the document, and its scrolled elements by their place. */
			function readerState (nodes) {
				var state = {Fields: [], Details: [], Scrolled: [], Focused: -1};
				var focusable = [];

				function walk (node, place) {
					var children = node.childNodes || [];
					var i = 0;

					if (node.nodeType !== 1) return;

					if (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName))
						state.Fields.push(node);

					if (node.tagName === 'DETAILS')
						state.Details.push(node);

					if (place && (node.scrollTop || node.scrollLeft))
						state.Scrolled.push({Place: place, Tag: node.tagName, Top: node.scrollTop, Left: node.scrollLeft});

					if (node.tabIndex >= 0 || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(node.tagName))
						focusable.push(node);

					while (i < children.length) {
						walk(children[i], place ? place.concat([i]) : null);

						i++;
					}
				}

				/* The places of the parts that scroll are taken from the first element: the root of the markup, as the root made of it. */
				nodes.forEach(function (node) {
					walk(node, node === Array.prototype.filter.call(nodes, function (each) {
						return each.nodeType === 1;
					})[0] ? [] : null);
				});

				state.Focused = focusable.indexOf(global.document.activeElement);
				state.Focusable = focusable;

				return state;
			}

			/*
			 * $Hydrate: what the reader did in the markup of the server before the scripts ran goes on in the root that takes
			 * its place: what was typed and chosen, the details opened, the scroll of each part, the focus.
			 */
			function adopt () {
				var before = readerState(served.Nodes);
				var after = readerState([served.Element]);

				before.Fields.forEach(function (field, index) {
					var other = after.Fields[index];
					if (!other || other.tagName !== field.tagName || other.type !== field.type || (other.name || '') !== (field.name || '')) return;

					if (field.type === 'checkbox' || field.type === 'radio') other.checked = field.checked;
					else if (field.tagName === 'SELECT') other.selectedIndex = field.selectedIndex;
					else if (field.type !== 'file' && field.value !== other.value) other.value = field.value;

					if (field.value !== field.defaultValue || field.checked !== field.defaultChecked)
						other.dispatchEvent(new global.Event(field.tagName === 'SELECT' || field.type === 'checkbox' || field.type === 'radio' ? 'change' : 'input', {bubbles: true}));
				});

				before.Details.forEach(function (details, index) {
					if (after.Details[index])
						after.Details[index].open = details.open;
				});

				return {Before: before, After: after};
			}

			/* After the swap: the scroll of each part and the focus, in the root now in the page. */
			function adopted (taken) {
				taken.Before.Scrolled.forEach(function (scrolled) {
					var node = served.Element;
					var i = 0;

					while (node && i < scrolled.Place.length) {
						node = node.childNodes[scrolled.Place[i]];

						i++;
					}

					if (node && node.tagName === scrolled.Tag) {
						node.scrollTop = scrolled.Top;
						node.scrollLeft = scrolled.Left;
					}
				});

				if (taken.Before.Focused !== -1 && taken.After.Focusable[taken.Before.Focused] && taken.After.Focusable[taken.Before.Focused].focus)
					taken.After.Focusable[taken.Before.Focused].focus({preventScroll: true});
			}

			/* The markup of the server goes and the root shows, at once: the page is never empty between them. */
			function reveal () {
				var taken;

				if (!served) return;

				if (definition.$Hydrate)
					taken = adopt();

				served.Nodes.forEach(function (node) {
					if (node.parentNode === served.Mount)
						served.Mount.removeChild(node);
				});

				/* Only what hid it goes: the styles its bindings gave it meanwhile stay. */
				served.Element.style.display = served.Display;

				if (served.Element.getAttribute('style') === '')
					served.Element.removeAttribute('style');

				if (taken)
					adopted(taken);

				served.Mount.removeAttribute('data-elemenx-ssr');

				served = null;
			}

			api.$OnPending = definition.$OnPending || null;
			api.$OnReady = function (args) {
				startRouter();

				if (!router) {
					reveal();

					rendered[name] = {Done: true, Error: null};
				}

				if (typeof definition.$OnReady === 'function')
					definition.$OnReady.call(api, args);

				/* The splash of the page goes with the first Application ready (its $OnReady may hold it); a build without one has no Splash. */
				if (Runtime.Splash)
					Runtime.Splash.Ready();
			};

			/* Failed: a page rendered for a server is done with the error; the hook of the definition, else the console, gets it. */
			api.$OnError = function (args) {
				var error = args && args.Error ? args.Error : null;

				rendered[name] = {Done: true, Error: error || new Error('Elemenx Application failed: ' + name)};

				if (typeof definition.$OnError === 'function') definition.$OnError.call(api, args);
				else if (error && global.console && typeof global.console.error === 'function') global.console.error(error);
			};

			/* The root renders once the dictionaries of the language are in: no key shows in place of its phrase. */
			function startLocalized () {
				Runtime.LocaleReady(function (error) {
					if (destroyed) return;

					if (error)
						Runtime.Report(error);

					applicationResources(loaded(startApplicationRoot));
				}, definition.$Locales && typeof definition.$Locales === 'object' ? definition.$Locales : null);
			}

			/*
			 * The resources of the Application ($Resources), after those of its Libraries and over them: a folder of it takes
			 * the files its graph lists (built now for that) or a bundle embeds.
			 */
			function applicationResources (next) {
				var spec = definition.$Resources;
				var discoveryRoot = Runtime.DefinitionURL(definition, definition.$Root);
				var folders = Object.keys(spec || {}).some(function (group) {
					return typeof spec[group] === 'string';
				});

				function read (files) {
					Runtime.LoadResources(spec, {
						Application: true,
						Files: files,
						Resolve: function (path) {
							return Runtime.AbsoluteURL(Runtime.DefinitionURL(definition, path));
						}
					}, next);
				}

				if (!spec) {
					next(null);

					return;
				}

				if (!folders || !discoveryRoot || !Runtime.Discovery || Runtime.Bundle.Ready()) {
					read([]);

					return;
				}

				Runtime.Discovery.Build(api, discoveryRoot, function (error) {
					read(error ? [] : Runtime.Discovery.Files(api));
				});
			}

			function startRoot () {
				var use = definition.$Use || definition.Use;

				if (definition.$Locales)
					Elemenx.Locale.Source(Runtime.DefinitionURL(definition, definition.$Locales.URL || definition.$Locales), definition.$Locales.Languages);

				if ((!use && !discovered.length) || !Runtime.Library) {
					startLocalized();

					return;
				}

				Runtime.Library.Use(api, use || [], loaded(startLocalized), discovered);
			}

			var discovered = discoveredLibraries(definition);

			if (Runtime.HasDOM && global.document.readyState === 'loading') {
				global.document.addEventListener('DOMContentLoaded', startRoot, {once: true});
			}
			else {
				startRoot();
			}

			return api;
		}

		Elemenx.Application = function (name, definition) {
			if (arguments.length === 1)
				return applications[name] || null;

			if (arguments.length !== 2 || typeof name !== 'string')
				throw new Error('Elemenx.Application expects (name) or (name, definition)');

			if (applications[name])
				throw new Error('Elemenx Application already exists: ' + name);

			if (definition && !definition.$DefinitionURL && Runtime.CurrentScriptURL())
				definition.$DefinitionURL = Runtime.CurrentScriptURL();

			rendered[name] = {Done: false, Error: null};
			applications[name] = createApplication(name, definition);

			return applications[name];
		};

		/*
		 * The page as a server sends it, in a page rendered for a server (ElemenxSSR set before the framework): once every
		 * Application has its page (the first navigation of its Router) and no $OnSSR is pending, each mount gets
		 * data-elemenx-ssr and the body a state script, and callback(error, html, state) has the HTML of the document and
		 * {Version, URL, Components}. The first Application that failed gives its error.
		 */
		Elemenx.Render = function (callback) {
			var tries = 0;

			if (typeof callback !== 'function')
				throw new Error('Elemenx.Render expects (callback)');

			if (!Runtime.SSR.Server || !Runtime.HasDOM) {
				callback(new Error('Elemenx.Render renders a page for a server: ElemenxSSR is not set'));

				return;
			}

			(function wait () {
				var names = Object.keys(rendered);
				var failed = null;
				var done = names.every(function (each) {
					failed = failed || rendered[each].Error;

					return rendered[each].Done;
				});

				/* Ten seconds or so for an Application to be ready: one that never is fails the render, not hangs it. */
				if (!done && tries > 1050) {
					callback(new Error('Elemenx.Render: an Application is not ready: ' + names.filter(function (each) {
						return !rendered[each].Done;
					}).join(', ')));

					return;
				}

				if (!done) {
					tries++;

					setTimeout(wait, tries < 50 ? 0 : 10);

					return;
				}

				if (failed) {
					callback(failed);

					return;
				}

				Runtime.SSR.Settled(function () {
					var state = {Version: 1, URL: global.location ? global.location.href : '', Components: Runtime.SSR.State()};
					var script = global.document.createElement('script');

					/* The scripts the framework loaded itself go: the page loads them again, by its own scripts. */
					Array.prototype.forEach.call(global.document.querySelectorAll('script[data-elemenx-loaded]'), function (each) {
						each.parentNode.removeChild(each);
					});

					names.forEach(function (each) {
						var mount = applications[each] ? applications[each].$Mount() : null;
						if (mount)
							mount.setAttribute('data-elemenx-ssr', Version);
					});

					script.setAttribute('type', 'application/json');
					script.setAttribute('data-elemenx-state', '');

					script.textContent = JSON.stringify(state).replace(/</g, '\\u003c');

					global.document.body.appendChild(script);

					callback(null, '<!DOCTYPE html>\n' + global.document.documentElement.outerHTML, state);
				});
			})();
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* Export */
	(function (global) {
		'use strict';

		var previous = global.Elemenx;

		Elemenx.Version = Version;

		/* Gives the name Elemenx back to what had it before this copy, and returns this copy. */
		Elemenx.NoConflict = function () {
			if (global.Elemenx === Elemenx)
				global.Elemenx = previous;

			return Elemenx;
		};

		/* An isolated build (one script for a widget) keeps this copy to itself: the window does not see it. */
		if (typeof ElemenxIsolated === 'object' && ElemenxIsolated) {
			ElemenxIsolated.Elemenx = Elemenx;

			return;
		}

		/* Another copy (another version, or another library) keeps the name: the page it serves goes on working. */
		if (previous) {
			if (global.console && typeof global.console.warn === 'function')
				global.console.warn('Elemenx ' + Version + ' is not the Elemenx of this page: ' + (previous.Version ? 'Elemenx ' + previous.Version : 'another Elemenx') + ' is. A widget beside another Elemenx is an isolated build (elemenx build --widget).');

			return;
		}

		global.Elemenx = Elemenx;
	})(typeof globalThis !== 'undefined' ? globalThis : self);

	/* ServiceWorker bootstrap */
	(function (global) {
		'use strict';

		if (Runtime.HasDOM) return;
		if (!global.clients || !global.location || typeof global.importScripts !== 'function') return;

		var url = new URL(global.location.href);
		if (url.searchParams.get('elemenx_service_worker') !== '1') return;

		var script = url.searchParams.get('elemenx_script');
		if (!script)
			throw new Error('Elemenx ServiceWorker application script URL is missing');

		var name = url.searchParams.get('elemenx_name');
		var channel = url.searchParams.get('elemenx_channel');

		global.ElemenxWorkerName = name;
		global.ElemenxWorkerChannel = channel;

		Runtime.AttachWorkerMessaging();

		global.importScripts(script);
	})(typeof globalThis !== 'undefined' ? globalThis : self);
})();