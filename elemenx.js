(function () {
	var Runtime = {};
	
	Runtime.ScriptURL = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : null;
	Runtime.HasDOM = typeof document !== 'undefined';
	
	(function (global) {
		'use strict';
		
		global.Elemenx = global.Elemenx || {};
		
		function RuntimeID () {
			if (Runtime.ID) return Runtime.ID;
			
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
			
			Runtime.ID = 'runtime-' + result;
			
			return Runtime.ID;
		}
		
		global.Elemenx.RuntimeID = RuntimeID;
		
		global.Elemenx.Title = function (value) {
			if (!Runtime.HasDOM) return arguments.length ? global.Elemenx : '';
			if (!arguments.length) return global.document.title;
			
			global.document.title = value == null ? '' : String(value);
			
			return global.Elemenx;
		};
		
		RuntimeID();
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		
		function Outlet (element) {
			var current = null;
			
			function Render (component) {
				if (current === component) return component;
				
				if (current && current.Destroy) {
					current.Destroy();
				}
				else {
					while (element.firstChild)
						element.removeChild(element.firstChild);
				}
				
				current = component || null;
				
				if (current)
					element.appendChild(current.Element ? current.Element() : current);
				
				return current;
			}
			
			function Clear () {
				Render(null);
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
				Current: Current,
				Destroy: Destroy
			};
		}
		
		Runtime.Outlet = Outlet;
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		
		function valueByPath (object, path) {
			var parts = String(path).split('.');
			var value = object;
			
			var i = 0;
			while (i < parts.length) {
				if (value == null)
					return undefined;
				
				value = value[parts[i]];
				
				i++;
			}
			
			return value;
		}
		
		function Collection (element, factory, options) {
			options = options || {};
			
			var keyOption = options.Key || options.key || 'id';
			var items = {};
			var order = [];
			
			function keyOf (data, index) {
				if (typeof keyOption === 'function')
					return String(keyOption(data, index));
				
				return String(valueByPath(data, keyOption));
			}
			
			function create (key, data) {
				var component = factory(data, key);
				
				items[key] = {
					key: key,
					data: data,
					component: component
				};
				
				return items[key];
			}
			
			function updateEntry (entry, data) {
				entry.data = data;
				
				if (entry.component && entry.component.Update) {
					entry.component.Update(data);
				}
				
				return entry;
			}
			
			function Set (data) {
				data = data || [];
				
				var wanted = {};
				var nextOrder = [];
				var i = 0;
				var key, entry, node;
				var active = null;
				var selectionStart = null;
				var selectionEnd = null;
				var selectionDirection = null;
				
				if (global.document && element.contains(global.document.activeElement)) {
					active = global.document.activeElement;
					
					if (typeof active.selectionStart === 'number') {
						selectionStart = active.selectionStart;
						selectionEnd = active.selectionEnd;
						selectionDirection = active.selectionDirection;
					}
				}
				
				while (i < data.length) {
					key = keyOf(data[i], i);
					
					if (key === 'undefined' || key === 'null')
						throw new Error('Collection item has no key at index ' + i);
					
					if (wanted[key])
						throw new Error('Duplicate collection key: ' + key);
					
					wanted[key] = true;
					nextOrder.push(key);
					
					entry = items[key];
					
					if (entry) {
						updateEntry(entry, data[i]);
					}
					else {
						entry = create(key, data[i]);
					}
					
					node = entry.component.Element ? entry.component.Element() : entry.component;
					
					/*
					 * Preserve DOM position for retained keyed items.
					 *
					 * Moving an existing focused subtree with appendChild()
					 * keeps component identity but the browser can still drop
					 * focus/selection. Only move a node when ordering actually
					 * differs.
					 */
					
					if (element.children[i] !== node) {
						if (element.children[i]) {
							element.insertBefore(node, element.children[i]);
						}
						else {
							element.appendChild(node);
						}
					}
					
					i++;
				}
				
				i = order.length - 1;
				
				while (i >= 0) {
					key = order[i];
					
					if (!wanted[key] && items[key]) {
						if (items[key].component && items[key].component.Destroy) {
							items[key].component.Destroy();
						}
						
						delete items[key];
					}
					
					i--;
				}
				
				order = nextOrder;
				
				/*
				 * Moving an ancestor of the active element can make browsers blur it
				 * even though the keyed DOM node itself is retained. Restore focus and
				 * text selection after the complete reorder, never between moves.
				 */
				
				if (active && element.contains(active) && global.document.activeElement !== active) {
					active.focus();
					
					if (selectionStart !== null && typeof active.setSelectionRange === 'function')
						active.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
				}
				
				return api;
			}
			
			function Update (key, data) {
				key = String(key);
				
				var entry = items[key];
				if (!entry) return false;
				
				updateEntry(entry, data);
				
				return true;
			}
			
			function Patch (key, patch) {
				key = String(key);
				
				var entry = items[key];
				if (!entry) return false;
				
				var next = {}, name;
				
				for (name in entry.data) {
					if (Object.prototype.hasOwnProperty.call(entry.data, name)) {
						next[name] = entry.data[name];
					}
				}
				
				patch = patch || {};
				
				for (name in patch) {
					if (Object.prototype.hasOwnProperty.call(patch, name)) {
						next[name] = patch[name];
					}
				}
				
				updateEntry(entry, next);
				
				return true;
			}
			
			function Remove (key) {
				key = String(key);
				
				var entry = items[key];
				if (!entry) return false;
				
				var nextOrder = [];
				var i = 0;
				
				if (entry.component && entry.component.Destroy) {
					entry.component.Destroy();
				}
				
				delete items[key];
				
				while (i < order.length) {
					if (order[i] !== key)
						nextOrder.push(order[i]);
					
					i++;
				}
				
				order = nextOrder;
				
				return true;
			}
			
			function Get (key) {
				key = String(key);
				
				return items[key] ? items[key].component : null;
			}
			
			function Data (key) {
				key = String(key);
				
				return items[key] ? items[key].data : null;
			}
			
			function Keys () {
				return order.slice(0);
			}
			
			function Clear () {
				var i = order.length - 1;
				var key;
				
				while (i >= 0) {
					key = order[i];
					
					if (items[key] && items[key].component && items[key].component.Destroy) {
						items[key].component.Destroy();
					}
					
					i--;
				}
				
				items = {};
				order = [];
				
				while (element.firstChild) {
					element.removeChild(element.firstChild);
				}
				
				return api;
			}
			
			function Destroy () {
				Clear();
			}
			
			var api = {
				Element: function () {
					return element;
				},
				Set: Set,
				Update: Update,
				Patch: Patch,
				Remove: Remove,
				Get: Get,
				Data: Data,
				Keys: Keys,
				Clear: Clear,
				Destroy: Destroy
			};
			
			return api;
		}
		
		Runtime.Collection = Collection;
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
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
			var map, dep;
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
				if (batchDepth < 0) batchDepth = 0;
				
				flush();
			}
		}
		
		function raw (value) {
			return rawCache.get(value) || value;
		}
		
		function wrap (value) {
			if (!reactiveTarget(value)) return value;
			
			var proxy = proxyCache.get(value);
			if (proxy) return proxy;
			
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
					var had = Object.prototype.hasOwnProperty.call(target, key);
					var previous = target[key];
					var oldLength = Array.isArray(target) ? target.length : 0;
					var result = Reflect.set(target, key, next, receiver);
					var arrayIndex = Array.isArray(target) && key !== 'length' && String(+key) === String(key);
					
					if (!Object.is(previous, next)) {
						trigger(target, key);
						
						if (arrayIndex && target.length !== oldLength) {
							trigger(target, 'length');
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
				
				deleteProperty: function (target, key) {
					var had = Object.prototype.hasOwnProperty.call(target, key);
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
					
					cleanup(consumer);
					
					var previousActive = activeConsumer;
					
					consumerStack.push(previousActive);
					
					activeConsumer = consumer;
					
					try {
						return callback();
					}
					finally {
						activeConsumer = consumerStack.pop();
					}
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
		Runtime.Raw = raw;
		
		Runtime.TrackIteration = function (value) {
			var target = raw(value);
			
			if (target && typeof target === 'object') {
				track(target, ITERATE);
			}
			
			return value;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	/* Discovery */
	(function (global) {
		'use strict';
		
		var maps = new WeakMap();
		var builds = new WeakMap();
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
		
		function buildDirectory (base, map, visited, callback) {
			var directory = trimSlash(base);
			var url = directory + '/index.js';
			
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
				var failed = false;
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
				
				function complete (entryError) {
					if (failed) return;
					
					if (entryError) {
						failed = true;
						
						callback(entryError);
						
						return;
					}
					
					remaining--;
					if (!remaining)
						callback(null);
				}
				
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
						
						buildDirectory(target, map, visited, complete);
					})(entries[i]);
					
					i++;
				}
			});
		}
		
		function build (application, root, callback) {
			var map = maps.get(application);
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
			root = new URL(String(root), global.location.href).href;
			
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
			
			buildDirectory(root, map, {}, function (error) {
				callbacks = builds.get(application) || [];
				
				builds.delete(application);
				
				if (!error)
					maps.set(application, map);
				
				i = 0;
				while (i < callbacks.length) {
					callbacks[i](error, error ? null : map);
					
					i++;
				}
			});
		}
		
		function scriptURL (url, force) {
			if (!force) return url;
			
			revision++;
			
			return url + (url.indexOf('?') === -1 ? '?' : '&') + 'elemenx-reload=' + revision;
		}
		
		function load (application, type, name, force, callback) {
			var map = maps.get(application);
			var url = map && map[name];
			var key;
			var target;
			var script;
			var callbacks;
			var i;
			
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
		
		function loadServices (application, callback) {
			var map = maps.get(application);
			var names = [];
			var name;
			var remaining;
			var failed = false;
			var i = 0;
			
			if (!map) {
				callback(new Error('Elemenx Discovery is not ready'));
				
				return;
			}
			
			for (name in map) {
				if (Object.prototype.hasOwnProperty.call(map, name) && /(?:^|\/)services(?:\/|$)/i.test(map[name]))
					names.push(name);
			}
			
			remaining = names.length;
			if (!remaining) {
				callback(null);
				
				return;
			}
			
			function complete (error) {
				if (failed) return;
				
				if (error) {
					failed = true;
					callback(error);
					
					return;
				}
				
				remaining--;
				if (!remaining) callback(null);
			}
			
			while (i < names.length) {
				load(application, 'Service', names[i], false, complete);
				i++;
			}
		}
		
		Runtime.Discovery = {
			Build: build,
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
				if (!map) return null;
				if (map[name]) return name;
				
				var key;
				for (key in map) {
					if (Object.prototype.hasOwnProperty.call(map, key) && key.toLowerCase() === String(name).toLowerCase()) {
						return key;
					}
				}
				
				return null;
			},
			
			ResolvedURL: function (application, name) {
				var map = maps.get(application);
				
				return map ? map[name] || null : null;
			}
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		var serviceRegistry = {};
		var serviceHandles = {};
		var applicationServiceHandles = new WeakMap();
		var guardRegistry = {};
		
		function ServiceAccessor (name) {
			var application = this && this.Application ? this.Application() : null;
			
			return serviceHandle(name, application);
		}
		
		function createService (name, definition, generation, application) {
			var instance = {};
			var key;
			
			definition = definition || {};
			
			for (key in definition) {
				if (Object.prototype.hasOwnProperty.call(definition, key) && key !== 'ElemenxOnCreate' && key !== 'ElemenxOnDestroy') {
					instance[key] = definition[key];
				}
			}
			
			instance.Generation = function () {
				return generation || 0;
			};
			instance.Application = function () {
				return application || null;
			};
			instance.Service = function (serviceName) {
				return serviceHandle(serviceName, application);
			};
			instance.Network = Runtime.NetworkFor ? Runtime.NetworkFor(instance) : Elemenx.Network;
			instance.Storage = Runtime.StorageFor ? Runtime.StorageFor(instance) : Elemenx.Storage;
			instance.WebWorker = Runtime.WebWorkerFor ? Runtime.WebWorkerFor(instance) : null;
			instance.ServiceWorker = Runtime.ServiceWorkerFor ? Runtime.ServiceWorkerFor(instance) : null;
			
			if (Runtime.SetMessagingEntity)
				Runtime.SetMessagingEntity(instance, name, 0);
			
			instance.Messaging = Runtime.MessagingFor ? Runtime.MessagingFor(instance) : Elemenx.Messaging;
			instance.Destroy = function () {
				if (Runtime.DestroyNetworkOwner)
					Runtime.DestroyNetworkOwner(instance);
				
				if (Runtime.DestroyMessagingOwner)
					Runtime.DestroyMessagingOwner(instance);
				
				if (Runtime.DestroyWebWorkerOwner)
					Runtime.DestroyWebWorkerOwner(instance);
				
				if (typeof definition.ElemenxOnDestroy === 'function') {
					definition.ElemenxOnDestroy.call(instance);
				}
			};
			
			if (typeof definition.ElemenxOnCreate === 'function') {
				definition.ElemenxOnCreate.call(instance);
			}
			
			return instance;
		}
		
		function serviceTarget (name, application) {
			var entry = serviceRegistry[name];
			if (!entry) return null;
			
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
			if (handle) return handle;
			
			var queued = [];
			var loading = false;
			
			handle = new Proxy({}, {
				get: function (object, property) {
					var target;
					
					if (property === 'ElemenxServiceHandle') return true;
					if (property === 'ElemenxDeferred') return !serviceRegistry[name];
					if (property === 'Destroy') {
						return function () {
							var entry = serviceRegistry[name];
							if (!entry) return;
							
							var target = serviceTarget(name, application);
							
							queued = [];
							
							if (target && target.Destroy) target.Destroy();
							
							if (application && entry.ApplicationInstances) {
								entry.ApplicationInstances.delete(application);
							}
							else {
								entry.Instance = null;
							}
						};
					}
					
					target = serviceTarget(name, application);
					
					if (target) {
						if (typeof target[property] === 'function')
							return target[property].bind(target);
						
						return target[property];
					}
					
					if (Runtime.Discovery && application && Runtime.Discovery.Ready(application)) {
						if (!loading) {
							loading = true;
							Runtime.Discovery.Load(application, 'Service', name, false, function (error) {
								if (error) {
									queued = [];
									if (global.console && console.error) console.error(error);
									
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
		Runtime.RegisterServiceDefinition = function (name, definition) {
			var previous = serviceRegistry[name];
			
			if (previous && previous.Instance && previous.Instance.Destroy) previous.Instance.Destroy();
			
			if (previous && previous.ApplicationInstanceList) {
				var i = 0;
				
				while (i < previous.ApplicationInstanceList.length) {
					if (previous.ApplicationInstanceList[i].Destroy) previous.ApplicationInstanceList[i].Destroy();
					
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
		
		Runtime.RefreshDeferredService = function (name) {
			return serviceHandles[name] || null;
		};
		
		Runtime.ResolveGuard = function (guard) {
			if (typeof guard === 'function') return guard;
			if (typeof guard === 'string') return Elemenx.Guard(guard);
			
			return null;
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	Runtime.ComponentRouters = new WeakMap();
	Runtime.ComponentRouterFacades = new WeakMap();
	Runtime.ActiveRouter = null;
	
	Runtime.RouterFor = function (component) {
		var facade = Runtime.ComponentRouterFacades.get(component);
		if (facade) return facade;
		
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
		
		Runtime.ComponentRouterFacades.set(component, facade);
		
		return facade;
	};
	
	Runtime.AttachRouter = function (component, router) {
		if (!component) return;
		
		Runtime.ComponentRouters.set(component, router);
		
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
		var facade = Runtime.ComponentRouterFacades.get(component);
		
		if (router) {
			router.OffOwner(component);
			
			Runtime.ComponentRouters.delete(component);
		}
		
		if (facade) {
			facade.Pending.length = 0;
			
			Runtime.ComponentRouterFacades.delete(component);
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
	

	Runtime.Directive = {
		Names: {
			If: 'data-if',
			For: 'data-for',
			Key: 'data-key',
			Pending: 'data-pending',
			Error: 'data-error',
			Model: 'data-model'
		},
		Prefixes: {
			On: 'data-on-',
			Bind: 'data-bind-'
		},
		Name: function (name) {
			return this.Names[name] || null;
		},
		Prefix: function (name) {
			return this.Prefixes[name] || null;
		},
		Is: function (attribute, name) {
			return attribute === this.Name(name);
		},
		Match: function (attribute, name) {
			var prefix = this.Prefix(name);
			if (!prefix) return false;
			
			return attribute.indexOf(prefix) === 0;
		},
		Argument: function (attribute, name) {
			var prefix = this.Prefix(name);
			if (!prefix || attribute.indexOf(prefix) !== 0) return null;
			
			return attribute.substring(prefix.length);
		},
		Reserved: function (attribute) {
			var name;
			
			for (name in this.Names) {
				if (Object.prototype.hasOwnProperty.call(this.Names, name) && attribute === this.Names[name]) return true;
			}
			
			for (name in this.Prefixes) {
				if (Object.prototype.hasOwnProperty.call(this.Prefixes, name) && attribute.indexOf(this.Prefixes[name]) === 0) return true;
			}
			
			return false;
		}
	};

	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		
		Elemenx.Directive = Runtime.Directive;
		
		var componentRegistry = {};
		var componentGenerations = {};
		var componentOutlets = new WeakMap();
		var templateResources = {};
		var templatePending = {};
		var templateRevision = 0;
		var styleResources = {};
		var stylePending = {};
		var styleSequence = 0;
		
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
			var key;
			var style;
			
			if (!global.document || css === undefined || css === null) return;
			
			if (!definition.ElemenxStyleKey) {
				styleSequence++;
				definition.ElemenxStyleKey = name ? 'component:' + name : 'anonymous:' + styleSequence;
			}
			
			key = definition.ElemenxStyleKey;
			style = global.document.querySelector('style[data-elemenx-style="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]');
			
			if (!style) {
				style = global.document.createElement('style');
				style.setAttribute('data-elemenx-style', key);
				(global.document.head || global.document.documentElement).appendChild(style);
			}
			
			if (style.textContent !== String(css))
				style.textContent = String(css);
		}

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
		

		function deferredComponent (resolver, data, slotProjection, options) {
			var placeholder = document.createElement('span');
			var current = null;
			var destroyed = false;
			var updates = [];
			var listeners = [];
			var lifecycle = options && options.AsyncLifecycle;
			var reloadParent = null;
			var reloadNext = null;
			var api = {};
			
			placeholder.style.display = 'contents';
			
			function renderStatus (source) {
				if (!source) return;
				
				var template;
				var fragment;
				
				while (placeholder.firstChild) placeholder.removeChild(placeholder.firstChild);
				
				if (typeof source === 'string' && source.charAt(0) === '#') {
					template = document.querySelector(source);
					
					if (template && template.tagName === 'TEMPLATE') {
						fragment = template.content.cloneNode(true);
						
						placeholder.appendChild(fragment);
						
						return;
					}
				}
				
				placeholder.innerHTML = String(source);
			}
			
			function lifecycleCall (name, error) {
				var owner = lifecycle && lifecycle.Owner;
				var method = owner && owner[name];
				
				if (typeof method !== 'function') return;
				
				method.call(owner, {
					Name: lifecycle.Name || null,
					Element: current && current.Element ? current.Element() : placeholder,
					Error: error || null
				});
			}
			
			if (lifecycle) {
				renderStatus(lifecycle.Pending);
				lifecycleCall('ElemenxOnComponentPending', null);
			}
			
			api.Generation = function () {
				return current && current.Generation ? current.Generation() : 0;
			};
			
			api.Application = function () {
				if (current && current.Application) return current.Application();
				if (api._parent && api._parent.Application) return api._parent.Application();
				
				return options && options.Application ? options.Application : null;
			};
			
			api.Element = function () {
				return current ? current.Element() : placeholder;
			};
			
			api._Component = function () {
				return current;
			};
			
			api.Parent = function (value) {
				if (arguments.length) {
					if (current) current.Parent(value);
					else api._parent = value;
					
					return api;
				}
				
				return current ? current.Parent() : api._parent;
			};
			
			api.Ref = function (name) {
				if (!current || !current.Ref) return null;
				
				return current.Ref(name);
			};
			
			api.Update = function (value) {
				if (current) current.Update(value);
				else updates.push(value);
				
				return api;
			};
			
			api.On = function (name, callback) {
				if (current) current.On(name, callback);
				else listeners.push({Name: name, Callback: callback});
				
				return api;
			};
			
			api.Destroy = function () {
				destroyed = true;
				updates = [];
				listeners = [];
				
				if (current)
					current.Destroy();
				
				current = null;
				
				if (placeholder.parentNode)
					placeholder.parentNode.removeChild(placeholder);
			};
			
			api._Pending = function () {
				if (destroyed) return false;
				
				var oldElement = current ? current.Element() : placeholder;
				
				reloadParent = oldElement && oldElement.parentNode;
				reloadNext = oldElement && oldElement.nextSibling;
				
				if (current)
					current.Destroy();
				
				current = null;
				
				if (lifecycle)
					renderStatus(lifecycle.Pending);
				
				if (reloadParent && !placeholder.parentNode) {
					if (reloadNext && reloadNext.parentNode === reloadParent) reloadParent.insertBefore(placeholder, reloadNext);
					else reloadParent.appendChild(placeholder);
				}
				
				if (lifecycle)
					lifecycleCall('ElemenxOnComponentPending', null);
				
				return true;
			};
			
			api._Error = function (error) {
				if (destroyed) return false;
				
				if (lifecycle) {
					renderStatus(lifecycle.Error);
					lifecycleCall('ElemenxOnComponentError', error);
				}
				
				return true;
			};
			
			api._Reload = function (factory) {
				if (destroyed || !factory) return false;
				
				var oldElement = current ? current.Element() : placeholder;
				var parentNode = reloadParent || (oldElement && oldElement.parentNode);
				var nextSibling = reloadNext || (oldElement && oldElement.nextSibling);
				
				if (current) current.Destroy();
				current = factory(data, slotProjection, options);
				
				if (api._parent && current.Parent) current.Parent(api._parent);
				
				var i = 0;
				while (i < listeners.length) {
					current.On(listeners[i].Name, listeners[i].Callback);
					
					i++;
				}
				
				i = 0;
				while (i < updates.length) {
					current.Update(updates[i]);
					i++;
				}
				
				var element = current.Element();
				
				if (placeholder.parentNode) placeholder.parentNode.replaceChild(element, placeholder);
				else if (parentNode && !element.parentNode) {
					if (nextSibling && nextSibling.parentNode === parentNode) parentNode.insertBefore(element, nextSibling);
					else parentNode.appendChild(element);
				}
				
				reloadParent = null;
				reloadNext = null;
				
				if (lifecycle)
					lifecycleCall('ElemenxOnComponentReady', null);
				
				return true;
			};
			
			resolver(function (error, factory) {
				if (destroyed) return;
				
				if (error || !factory) {
					error = error || new Error('Elemenx deferred component failed');
					
					if (lifecycle) {
						renderStatus(lifecycle.Error);
						lifecycleCall('ElemenxOnComponentError', error);
					}
					
					if (global.console && console.error) console.error(error);
					
					return;
				}
				
				current = factory(data, slotProjection, options);
				
				if (api._parent && current.Parent) current.Parent(api._parent);
				
				var i = 0;
				while (i < listeners.length) {
					current.On(listeners[i].Name, listeners[i].Callback);
					
					i++;
				}
				
				i = 0;
				while (i < updates.length) {
					current.Update(updates[i]);
					i++;
				}
				
				var element = current.Element();
				
				if (placeholder.parentNode)
					placeholder.parentNode.replaceChild(element, placeholder);
				
				if (lifecycle && (!current._Component || current._Component()))
					lifecycleCall('ElemenxOnComponentReady', null);
				
				updates = [];
				listeners = [];
			});
			
			return api;
		}
		
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
		
		Runtime.CompileExpression = function (source) {
			source = expressionNames(source);
			
			if (!source) {
				return function () {
					return undefined;
				};
			}
			
			if (!expressionCache[source])
				expressionCache[source] = new Function('$scope', 'with ($scope || {}) { return (' + source + '); }');
			
			return expressionCache[source];
		};
		
		Runtime.EvaluateExpression = function (source, scope) {
			return Runtime.CompileExpression(source)(scope || {});
		};
		
		function own (object, key) {
			return Object.prototype.hasOwnProperty.call(object, key);
		}
		
		function resolveTemplate (template) {
			var source;
			var node;
			
			if (typeof template === 'function') {
				source = template();
			}
			else {
				source = template || '';
			}
			
			if (typeof source === 'string' && source.charAt(0) === '#') {
				node = document.getElementById(source.substring(1));
				
				if (node && node.tagName === 'TEMPLATE') {
					return node.innerHTML;
				}
				
				throw new Error('Elemenx template not found: ' + source);
			}
			
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
				/(\s(?:data-(?:if|for|key)|data-bind-[A-Za-z0-9_.:-]+)\s*=\s*)(["'])([\s\S]*?)\2/gi,
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
		
		function createFragment (html) {
			var template = document.createElement('template');
			var protectedExpressions = protectExpressionAttributes(html);
			template.innerHTML = normalizeSelfClosingComponents(protectedExpressions.Source);
			restoreExpressionAttributes(template.content, protectedExpressions.Expressions);
			
			if (template.content.childNodes.length === 1)
				return template.content.removeChild(template.content.firstChild);
			
			var root = document.createElement('div');
			
			while (template.content.firstChild) {
				root.appendChild(template.content.firstChild);
			}
			
			return root;
		}
		
		function collectRefs (root, refs) {
			if (root.nodeType === 1 && root.hasAttribute('data-ref')) {
				refs[root.getAttribute('data-ref')] = root;
			}
			
			if (!root.querySelectorAll) return;
			
			var nodes = root.querySelectorAll('[data-ref]'),
				name,
				i = 0;
			
			while (i < nodes.length) {
				name = nodes[i].getAttribute('data-ref');
				
				if (name)
					refs[name] = nodes[i];
				
				i++;
			}
		}
		
		function addBinding (bindings, source, binding) {
			binding.expression = source;
			binding.evaluate = Runtime.CompileExpression(source);
			bindings.push(binding);
		}
		
		function collectTextBindings (root, bindings) {
			var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
			var nodes = [];
			var node, match, regex, last, fragment, text, key, bindingNode;
			
			while ((node = walker.nextNode())) {
				nodes.push(node);
			}
			
			var i = 0;
			while (i < nodes.length) {
				node = nodes[i];
				text = node.nodeValue;
				
				if (text.indexOf('{{') !== -1) {
					regex = /\{\{\s*([\s\S]+?)\s*\}\}/g;
					last = 0;
					fragment = document.createDocumentFragment();
					
					while ((match = regex.exec(text))) {
						if (match.index > last)
							fragment.appendChild(document.createTextNode(text.substring(last, match.index)));
						
						key = match[1];
						bindingNode = document.createTextNode('');
						
						fragment.appendChild(bindingNode);
						
						addBinding(bindings, key, {type: 'text', node: bindingNode});
						
						last = regex.lastIndex;
					}
					
					if (last !== 0) {
						if (last < text.length)
							fragment.appendChild(document.createTextNode(text.substring(last)));
						
						node.parentNode.replaceChild(fragment, node);
					}
				}
				
				i++;
			}
		}
		
		function collectElementBindings (root, bindings, models) {
			var nodes = [], all, i = 0, j, attrs, attr, key, type;
			
			if (root.nodeType === 1) nodes.push(root);
			if (root.querySelectorAll) {
				all = root.querySelectorAll('*');
				
				while (i < all.length) {
					nodes.push(all[i]);
					
					i++;
				}
			}
			
			i = 0;
			while (i < nodes.length) {
				attrs = nodes[i].attributes;
				j = 0;
				
				while (j < attrs.length) {
					attr = attrs[j];
					
					if (Runtime.Directive.Match(attr.name, 'Bind')) {
						type = Runtime.Directive.Argument(attr.name, 'Bind');
						key = attr.value;
						
						if (type === 'class') {
							addBinding(bindings, key, {type: 'class', node: nodes[i]});
						}
						else if (type === 'value') {
							addBinding(bindings, key, {type: 'value', node: nodes[i]});
						}
						else if (type === 'disabled') {
							addBinding(bindings, key, {type: 'disabled', node: nodes[i]});
						}
						else if (type === 'checked') {
							addBinding(bindings, key, {type: 'checked', node: nodes[i]});
						}
						else {
							addBinding(bindings, key, {type: 'attribute', name: type, node: nodes[i]});
						}
					}
					else if (Runtime.Directive.Is(attr.name, 'Show')) {
						addBinding(bindings, attr.value, {
							type: 'show',
							node: nodes[i],
							display: nodes[i].style.display
						});
					}
					else if (Runtime.Directive.Is(attr.name, 'Hide')) {
						addBinding(bindings, attr.value, {
							type: 'hide',
							node: nodes[i],
							display: nodes[i].style.display
						});
					}
					else if (Runtime.Directive.Is(attr.name, 'Model')) {
						key = attr.value;
						models.push({
							key: key,
							node: nodes[i],
							type: nodes[i].type === 'checkbox' || nodes[i].type === 'radio' ? 'checked' : 'value'
						});
					}
					
					j++;
				}
				
				i++;
			}
		}
		
		function applyBinding (binding, value) {
			var truthy = !!value;
			
			if (binding.type === 'text') {
				binding.node.nodeValue = value == null ? '' : String(value);
			}
			else if (binding.type === 'class') {
				binding.node.className = value == null ? '' : String(value);
			}
			else if (binding.type === 'value') {
				binding.node.value = value == null ? '' : String(value);
			}
			else if (binding.type === 'disabled') {
				binding.node.disabled = truthy;
			}
			else if (binding.type === 'checked') {
				binding.node.checked = truthy;
			}
			else if (binding.type === 'show') {
				binding.node.style.display = truthy ? binding.display : 'none';
			}
			else if (binding.type === 'hide') {
				binding.node.style.display = truthy ? 'none' : binding.display;
			}
			else if (binding.type === 'attribute') {
				if (value == null || value === false) {
					binding.node.removeAttribute(binding.name);
				}
				else {
					binding.node.setAttribute(binding.name, value === true ? '' : String(value));
				}
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
		
		function collectOutlets (root, outlets) {
			var nodes, i = 0, name;
			
			if (root.nodeType === 1 && root.hasAttribute('data-outlet')) {
				name = root.getAttribute('data-outlet');
				
				if (name)
					outlets[name] = Runtime.Outlet(root);
			}
			
			if (!root.querySelectorAll) return;
			
			nodes = root.querySelectorAll('[data-outlet]');
			
			while (i < nodes.length) {
				name = nodes[i].getAttribute('data-outlet');
				
				if (name)
					outlets[name] = Runtime.Outlet(nodes[i]);
				
				i++;
			}
		}
		
		function projectSlots (root, projection) {
			var slots = [];
			var found;
			var groups = projection && projection.Groups ? projection.Groups() : {};
			var used = {};
			var roots = [];
			var i;
			var j;
			var slot;
			var name;
			var nodes;
			var parent;
			var k;
			
			if (!root) return;
			
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
						
						k++;
					}
					
					parent.removeChild(slot);
				}
				
				i++;
			}
		}
		
		function CreateComponentFactory (name, definition, generationOverride) {
			var templateID;
			var messagingInstanceSequence = 0;
			var previousFactory = name ? componentRegistry[name] : null;
			var generation = generationOverride !== undefined ? generationOverride : (name ? (componentGenerations[name] || 0) : 0);
			
			definition = definition || {};
			
			if (name && (definition.TemplateURL || definition.StyleURL) && global.document && global.document.currentScript && !definition.ElemenxDefinitionURL) {
				definition.ElemenxDefinitionURL = global.document.currentScript.src.split('?')[0].split('#')[0];
			}
			
			function resolveDefinitionResourceURL (url) {
				if (!url || !definition.ElemenxDefinitionURL || /^(?:[a-z]+:)?\/\//i.test(url) || url.charAt(0) === '/') return url;
				
				return definition.ElemenxDefinitionURL.substring(0, definition.ElemenxDefinitionURL.lastIndexOf('/') + 1) + url.replace(/^\.\//, '');
			}
			
			definition.TemplateURL = resolveDefinitionResourceURL(definition.TemplateURL);
			definition.StyleURL = resolveDefinitionResourceURL(definition.StyleURL);
			
			if (generationOverride === undefined && name && previousFactory && !previousFactory.ElemenxLazy) generation++;
			if (name) componentGenerations[name] = generation;
			
			if ((definition.TemplateURL && definition.Template === undefined) || (definition.StyleURL && definition.Style === undefined)) {
				var remoteFactory = function (data, slotProjection, options) {
					var component = deferredComponent(function (ready) {
						function finish (html, css) {
							var localDefinition = {};
							var localFactory;
							var key;
							
							for (key in definition) {
								if (own(definition, key) && key !== 'TemplateURL' && key !== 'StyleURL' && key !== 'ElemenxDefinitionURL' && key !== 'ElemenxStyleKey') {
									localDefinition[key] = definition[key];
								}
							}
							
							if (html !== undefined) localDefinition.Template = html;
							if (css !== undefined) {
								definition.Style = css;
								installComponentStyle(name, definition, css);
							}
							
							localFactory = CreateComponentFactory(null, localDefinition, generation);
							ready(null, localFactory);
						}
						
						function loadStyle (html) {
							if (!definition.StyleURL || definition.Style !== undefined) {
								finish(html, definition.Style);
								return;
							}
							
							loadStyleURL(definition.StyleURL, function (error, css) {
								if (error) {
									ready(error);
									return;
								}
								
								finish(html, css);
							});
						}
						
						if (definition.TemplateURL && definition.Template === undefined) {
							loadTemplateURL(definition.TemplateURL, false, function (error, html) {
								if (error) {
									ready(error);
									return;
								}
								
								loadStyle(html);
							});
						}
						else {
							loadStyle(definition.Template);
						}
					}, data, slotProjection, options);
					
					if (name && !Runtime.ComponentReloading)
						trackComponentInstance(name, component);
					
					return component;
				};
				
				remoteFactory.ComponentName = name;
				remoteFactory.Definition = definition;
				
				if (name)
					componentRegistry[name] = remoteFactory;
				
				return remoteFactory;
			}
			
			if (definition.Style !== undefined)
				installComponentStyle(name, definition, definition.Style);

			if (name && definition.Template === undefined) {
				templateID = definition.TemplateID || name;
				definition.Template = '#' + templateID;
			}
			
			function factory (data, slotProjection, options) {
				var directState = options && options.DirectState === true;
				var root = createFragment(resolveTemplate(definition.Template));
				
				/*
				 * A component root carrying a structural directive needs a stable
				 * owner node. Structural() compiles children of Component.Element(),
				 * so without this host a root data-if would be skipped completely.
				 * Keep the host transparent to layout while allowing the real root to
				 * participate in the same destroy/recreate path as nested data-if.
				 */
				if (root.nodeType === 1 && root.hasAttribute(Runtime.Directive.Name('If'))) {
					var structuralRoot = document.createElement('span');
					
					structuralRoot.style.display = 'contents';
					structuralRoot.setAttribute('data-ui-structural-root', '');
					structuralRoot.appendChild(root);
					
					root = structuralRoot;
				}
				
				/*
				 * Preserve the untouched component DOM before projection/binding/
				 * structural processing. Structural receives this explicitly; it is
				 * never reached through an outer lexical scope.
				 */
				var pristineRoot = root.cloneNode(true);
				
				var refs = {};
				var outlets = {};
				var collections = {};
				var bindings = [];
				var models = [];
				var values = directState
					? (data && data.__raw__ ? data : Runtime.Reactive(data || {}))
					: Runtime.Reactive({});
				var effects = [];
				var children = [];
				var listeners = [];
				var destroyed = false;
				var structural = null;
				var parentComponent = null;
				var componentEvents = {};
				var api;
				
				projectSlots(root, slotProjection);
				
				/*
				 * Binding collection mutates the live DOM (notably {{...}} text).
				 * Keep a pristine structural blueprint before that happens.
				 */
				var structuralBlueprint = root.cloneNode(true);
				
				collectRefs(root, refs);
				collectOutlets(root, outlets);
				collectTextBindings(root, bindings);
				collectElementBindings(root, bindings, models);
				
				function syncModel (model) {
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
				
				function syncModels () {
					var i = 0;
					
					while (i < models.length) {
						syncModel(models[i]);
						
						i++;
					}
				}
				
				function Batch (callback) {
					if (typeof callback !== 'function') return api;
					
					Runtime.BatchReactive(function () {
						callback.call(api, values);
					});
					
					return api;
				}
				
				function Values () {
					return values;
				}
				
				function Ref (name) {
					var ref = refs[name] || null;
					var node;
					
					if (ref && ref.isConnected && root.contains(ref)) return ref;
					
					/*
					 * Structural directives may destroy/recreate DOM that contained
					 * data-ref nodes after the initial collectRefs() pass. Never expose
					 * a detached stale node; resolve the current live ref lazily.
					 */
					if (root.nodeType === 1 && root.getAttribute('data-ref') === name) {
						node = root;
					}
					else if (root.querySelector) {
						node = root.querySelector('[data-ref="' + String(name)
							.replace(/\\/g, '\\\\')
							.replace(/"/g, '\\"') + '"]');
					}
					
					if (node) {
						refs[name] = node;
						
						return node;
					}
					
					if (ref)
						delete refs[name];
					
					return null;
				}
				
				function Outlet (name) {
					return outlets[name] || null;
				}
				
				function List (name, factory, options) {
					var target;
					
					if (arguments.length === 1) {
						return collections[name] || null;
					}
					
					if (collections[name]) {
						collections[name].Destroy();
					}
					
					target = Ref(name);
					
					if (!target && outlets[name]) {
						target = outlets[name].Element();
					}
					
					if (!target) {
						throw new Error('Collection target not found: ' + name);
					}
					
					collections[name] = Runtime.Collection(target, factory, options || {});
					
					return collections[name];
				}
				
				function Append (ref, child) {
					var target = typeof ref === 'string' ? Ref(ref) : ref;
					var element;
					
					if (!target || !child) return api;
					
					element = child.Element ? child.Element() : child;
					target.appendChild(element);
					
					if (child.Destroy)
						children.push(child);
					
					return api;
				}
				
				function listen (node, name, callback) {
					node.addEventListener(name, callback);
					
					listeners.push({node: node, name: name, callback: callback});
				}
				
				function bindEvents () {
					var nodes = [], all, i = 0, j, attrs, attr, eventName, methodName, method;
					
					if (root.nodeType === 1) nodes.push(root);
					if (root.querySelectorAll) {
						all = root.querySelectorAll('*');
						
						while (i < all.length) {
							nodes.push(all[i]);
							
							i++;
						}
					}
					
					i = 0;
					while (i < nodes.length) {
						attrs = nodes[i].attributes;
						j = 0;
						
						while (j < attrs.length) {
							attr = attrs[j];
							
							if (Runtime.Directive.Match(attr.name, 'On')) {
								eventName = Runtime.Directive.Argument(attr.name, 'On');
								methodName = attr.value;
								method = definition[methodName];
								
								if (typeof method === 'function') {
									(function (node, eventName, method) {
										listen(node, eventName, function (e) {
											method.call(api, e, node);
										});
									})(nodes[i], eventName, method);
								}
							}
							
							j++;
						}
						
						i++;
					}
				}
				
				function bindModels () {
					var i = 0, model, eventName;
					
					while (i < models.length) {
						model = models[i];
						eventName = model.node.type === 'checkbox' || model.node.type === 'radio' ? 'change' : 'input';
						
						(function (model) {
							effects.push(Runtime.Effect(function () {
								syncModel(model);
								
								return values[model.key];
							}, true));
							
							listen(model.node, eventName, function () {
								var value;
								
								if (model.node.type === 'checkbox' || model.node.type === 'radio') {
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
				
				function activateEffects () {
					var i = 0;
					
					while (i < effects.length) {
						effects[i].Run();
						
						i++;
					}
				}
				
				function Update (next) {
					var key;
					
					next = next || {};
					
					Runtime.BatchReactive(function () {
						for (key in next) {
							if (own(next, key))
								values[key] = next[key];
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
				
				function Emit (name, data) {
					var list = componentEvents[name];
					var copy;
					var i = 0;
					
					if (!list || !list.length) return api;
					
					copy = list.slice(0);
					
					while (i < copy.length) {
						copy[i].call(api, data, api);
						
						i++;
					}
					
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
					if (destroyed) return;
					
					destroyed = true;
					
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
					
					if (Runtime.DestroyNetworkOwner)
						Runtime.DestroyNetworkOwner(api);
					
					if (Runtime.DestroyMessagingOwner)
						Runtime.DestroyMessagingOwner(api);
					
					if (Runtime.DestroyWebWorkerOwner)
						Runtime.DestroyWebWorkerOwner(api);
					
					if (definition.ElemenxOnDestroy)
						definition.ElemenxOnDestroy.call(api);
					
					i = listeners.length - 1;
					
					while (i >= 0) {
						listeners[i].node.removeEventListener(listeners[i].name, listeners[i].callback);
						
						i--;
					}
					listeners.length = 0;
					
					var collectionName;
					
					for (collectionName in collections)
						if (own(collections, collectionName))
							collections[collectionName].Destroy();
					
					for (var outletName in outlets)
						if (own(outlets, outletName))
							outlets[outletName].Destroy();
					
					i = children.length - 1;
					
					while (i >= 0) {
						children[i].Destroy();
						
						i--;
					}
					
					children.length = 0;
					
					if (root.parentNode)
						root.parentNode.removeChild(root);
				}
				
				api = {
					Generation: function () {
						return generation;
					},
					Application: function () {
						var parent = Parent();
						if (parent && parent.Application)
							return parent.Application();
						
						return options && options.Application ? options.Application : null;
					},
					Element: function () {
						return root;
					},
					Ref: Ref,
					On: On,
					Emit: Emit,
					Parent: Parent,
					Router: Router,
					Service: Runtime.Service,
					Title: Elemenx.Title,
					State: values,
					Batch: Batch,
					Update: Update,
					Destroy: Destroy
				};
				
				api.Network = Runtime.NetworkFor ? Runtime.NetworkFor(api) : Elemenx.Network;
				api.Storage = Runtime.StorageFor ? Runtime.StorageFor(api) : Elemenx.Storage;
				api.WebWorker = Runtime.WebWorkerFor ? Runtime.WebWorkerFor(api) : null;
				api.ServiceWorker = Runtime.ServiceWorkerFor ? Runtime.ServiceWorkerFor(api) : null;
				
				if (Runtime.SetMessagingEntity)
					Runtime.SetMessagingEntity(api, name || 'Component', messagingInstanceSequence++);
				
				api.Messaging = Runtime.MessagingFor ? Runtime.MessagingFor(api) : Elemenx.Messaging;
				
				componentOutlets.set(api, outlets);
				
				if (Runtime.ActiveRouter)
					Runtime.AttachRouter(api, Runtime.ActiveRouter);
				
				/*
				 * Public component methods live on the instance as well as being
				 * callable from data-on-* handlers. This makes internal calls such
				 * as this.Refresh() valid and keeps the definition object useful as
				 * the component's method table.
				 */
				var methodName;
				
				for (methodName in definition) {
					if (
						own(definition, methodName) &&
						typeof definition[methodName] === 'function' &&
						methodName !== 'Template' &&
						methodName !== 'ElemenxOnCreate' &&
						methodName !== 'ElemenxOnDestroy' &&
						methodName !== 'Components'
					) {
						api[methodName] = definition[methodName];
					}
				}
				
				/*
				 * Models must bind before semantic DOM events.
				 *
				 * For controls where both data-model and data-on-change listen to
				 * the same native event (checkbox/radio), State must be updated
				 * before the component method reads it.
				 */
				activateBindings(bindings, values, effects);
				bindModels();
				bindEvents();
				
				if (Runtime.Structural)
					structural = Runtime.Structural(api, definition, pristineRoot);
				
				/*
				 * Do not eagerly evaluate template expressions against an empty
				 * bootstrap object. Application-style components commonly populate
				 * their state in ElemenxOnCreate(); with real JavaScript expressions an
				 * absent identifier is a ReferenceError, unlike the old path lookup.
				 *
				 * Components that actually receive props still get their initial
				 * Update before ElemenxOnCreate, preserving the existing child lifecycle.
				 */
				
				if (!directState && data && Object.keys(data).length) {
					Update(data);
				}
				
				if (definition.Title !== undefined)
					api.Title(definition.Title);
				
				if (definition.ElemenxOnCreate)
					definition.ElemenxOnCreate.call(api, data || {});
				
				/*
				 * Bootstrap is intentionally delayed until after ElemenxOnCreate().
				 * This preserves the established semantics: components may populate their
				 * initial state in ElemenxOnCreate without expressions seeing an empty scope.
				 */
				activateEffects();
				
				/*
				 * Structural() was compiled before ElemenxOnCreate(), but its lazy records
				 * must see the populated initial state. One bootstrap pass creates
				 * component conditions / collections / ordinary data-if. Reactive
				 * data-if records then update from their own dependencies.
				 */
				
				if (structural)
					structural.Update(values);
				
				/*
				 * Native controls have stateful DOM properties (checked/value).
				 * Do one final bootstrap synchronization after Create() and the
				 * structural pass so initial State is authoritative as well as
				 * subsequent Proxy updates.
				 */
				syncModels();
				
				/*
				 * Router context becomes part of the component only after Create has
				 * completed, but before ComponentReady. This keeps ElemenxOnCreate about
				 * the component itself while Ready may safely consume route state.
				 */
				if (options && options.RoutePacket) {
					api.Path = options.RoutePacket.Path;
					api.Params = options.RoutePacket.Params;
					api.Query = options.RoutePacket.Query;
					api.Hash = options.RoutePacket.Hash;
				}
				
				if (options && options.GuardFailure)
					api.GuardFailure = options.GuardFailure;
				
				/*
				 * The component is now fully initialized. Declarative Title is applied
				 * before lifecycle hooks, so Ready may replace it with a dynamic value.
				 */
				if (definition.ElemenxOnComponentReady)
					definition.ElemenxOnComponentReady.call(api);
				
				return api;
			}
			
			factory.ComponentName = name;
			factory.Definition = definition;
			
			if (name)
				componentRegistry[name] = factory;
			
			return factory;
		}
		
		Runtime.ResolveComponent = function (name) {
			var key;
			var discoveryName = String(name);
			
			if (discoveryName.indexOf('-') !== -1) {
				discoveryName = discoveryName.toLowerCase().replace(/(^|-)([a-z0-9])/g, function (all, separator, character) {
					return character.toUpperCase();
				});
			}
			
			if (componentRegistry[name])
				return componentRegistry[name];
			
			for (key in componentRegistry) {
				if (own(componentRegistry, key) && key.toLowerCase() === String(name).toLowerCase()) {
					return componentRegistry[key];
				}
			}
			
			if (Runtime.Discovery) {
				var lazyFactory = function (data, slotProjection, options) {
					return deferredComponent(function (ready) {
						var application = null;
						
						if (options && options.Application)
							application = options.Application;
						
						Runtime.Discovery.Load(application, 'Component', discoveryName, false, function (error) {
							var factory = componentRegistry[discoveryName] || Runtime.ResolveComponentRegistered(discoveryName);
							if (factory === lazyFactory) factory = null;
							
							ready(error, factory);
						});
					}, data, slotProjection, options);
				};
				
				lazyFactory.ComponentName = discoveryName;
				lazyFactory.ElemenxLazy = true;
				
				componentRegistry[name] = lazyFactory;
				
				return lazyFactory;
			}
			
			return null;
		};
		
		Runtime.ResolveComponentRegistered = function (name) {
			if (componentRegistry[name] && !componentRegistry[name].ElemenxLazy) return componentRegistry[name];
			
			var key;
			
			for (key in componentRegistry) {
				if (own(componentRegistry, key) && !componentRegistry[key].ElemenxLazy && key.toLowerCase() === String(name).toLowerCase()) {
					return componentRegistry[key];
				}
			}
			
			return null;
		};
		
		Runtime.ReloadComponentTemplate = function (name, callback) {
			var factory = Runtime.ResolveComponentRegistered(name);
			var definition = factory && factory.Definition;
			
			if (!definition || !definition.TemplateURL) {
				if (callback)
					callback(null);
				
				return;
			}
			
			loadTemplateURL(definition.TemplateURL, true, function (error) {
				if (callback)
					callback(error);
			});
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
		
		Runtime.ReloadComponentInstances = function (name) {
			var list = liveComponentInstances[name];
			if (!list) return 0;
			
			var factory = Runtime.ResolveComponentRegistered(name);
			if (!factory) return 0;
			var snapshot = list.slice();
			
			Runtime.ComponentReloading = true;
			
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
				Runtime.ComponentReloading = false;
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
		
		Elemenx.Component = function (name, definition) {
			if (arguments.length === 1)
				return Runtime.ResolveComponent(name);
			
			if (arguments.length === 2 && typeof name === 'string')
				return CreateComponentFactory(name, definition || {});
			
			throw new Error('Elemenx.Component expects (name) or (name, definition)');
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		
		function Router (config) {
			var root = config.Root;
			var rootOutletName = config.Outlet || 'Content';
			var waitingOutletName = config.WaitingOutlet || 'Waiting';
			var routes = config.Routes || [];
			var active = [];
			var started = false;
			var clickHandler;
			var popHandler;
			var navigationID = 0;
			var events = {};
			
			function application () {
				return root && root.Application ? root.Application() : null;
			}
			
			function emit (name, data) {
				var list = events[name];
				if (!list || !list.length) return;
				
				var copy = list.slice(0);
				
				var i = 0;
				while (i < copy.length) {
					copy[i].Callback.call(copy[i].Owner || api, data, api);
					
					i++;
				}
			}
			
			function on (name, callback, owner) {
				if (!name || typeof callback !== 'function') return api;
				
				if (!events[name]) events[name] = [];
				
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
					if (!Object.prototype.hasOwnProperty.call(events, name)) continue;
					
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
			
			function ownerFacade (owner) {
				return {
					On: function (name, callback) {
						on(name, callback, owner);
						
						return this;
					},
					Go: function (url) {
						return api.Go(url);
					},
					Replace: function (url) {
						return api.Replace(url);
					},
					Back: function () {
						return api.Back();
					},
					Forward: function () {
						return api.Forward();
					},
					Current: function () {
						return api.Current();
					}
				};
			}
			
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
				
				if (!value) return parts;
				
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
					
					for (value in params) {
						if (Object.prototype.hasOwnProperty.call(params, value)) {
							nextParams[value] = params[value];
						}
					}
					
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
			
			function match (path) {
				return matchLevel(routes, splitPath(path), 0, {}, []);
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
			
			function componentFactory (route) {
				if (typeof route.Component === 'function') return route.Component;
				
				// Router preloads named route components before commit. Never fall back to
				// ResolveComponent() here: that would create a second lazy/deferred wrapper
				// and turn a preload/registration problem into a late render failure.
				return Runtime.ResolveComponentRegistered(route.Component);
			}
			
			function loadRouteComponents (chain, common, callback) {
				var index = common;

				function next (error) {
					if (error || index >= chain.length) {
						callback(error || null);

						return;
					}

					var route = chain[index++];
					if (typeof route.Component === 'function' || Runtime.ResolveComponentRegistered(route.Component)) {
						next(null);

						return;
					}

					var currentApplication = application();
					if (!Runtime.Discovery || !currentApplication || !Runtime.Discovery.Ready(currentApplication)) {
						callback(new Error('Elemenx route component not found: ' + route.Component));

						return;
					}

					Runtime.Discovery.Load(currentApplication, 'Component', route.Component, false, function (error) {
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

			function clearWaiting () {
				if (!waitingComponent) return;

				if (waitingElement && waitingElement.parentNode)
					waitingElement.parentNode.removeChild(waitingElement);

				if (waitingComponent.Destroy)
					waitingComponent.Destroy();

				waitingComponent = null;
				waitingElement = null;
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
					var factory = typeof reference === 'function' ? reference : Runtime.ResolveComponentRegistered(reference);
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
						return factory(prepared.Packet, null, {Application: application()});
					});

					Runtime.AttachRouter(waitingComponent, api);
					waitingComponent.Parent(root);
					waitingElement = waitingComponent.Element ? waitingComponent.Element() : waitingComponent;
					outlet.Element().appendChild(waitingElement);
					emit('NavigationWaiting', prepared.Packet);

					callback(null);
				}

				if (typeof reference === 'function' || Runtime.ResolveComponentRegistered(reference)) {
					render();

					return;
				}

				var currentApplication = application();
				if (!Runtime.Discovery || !currentApplication || !Runtime.Discovery.Ready(currentApplication)) {
					callback(new Error('Elemenx route waiting component not found: ' + reference));

					return;
				}

				Runtime.Discovery.Load(currentApplication, 'Component', reference, false, function (error) {
					if (error) {
						callback(error);

						return;
					}

					render();
				});
			}

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
			
			function leaveArguments (context) {
				return {
					From: context.From,
					To: context.To,
					Route: context.Route,
					Wait: waiter,
					Fail: fail
				};
			}
			
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
				
				if (operation && typeof operation.then === 'function') {
					operation.then(finish, function () {
						finish(false);
					});
					
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
					context.FailureRoute = route;
					
					var list = guardsFor(route);
					var guardIndex = 0;
					
					routeIndex++;
					
					function nextGuard (guardResult) {
						var guard;
						
						if (guardResult !== true && guardResult !== undefined) {
							done(guardResult);
							
							return;
						}
						
						if (guardIndex >= list.length) {
							nextRoute(true);
							
							return;
						}
						
						var guardReference = list[guardIndex];
						guard = Runtime.ResolveGuard(guardReference);
						
						if (!guard && typeof guardReference === 'string') {
							var currentApplication = application();
							
							if (Runtime.Discovery && currentApplication && Runtime.Discovery.Ready(currentApplication)) {
								Runtime.Discovery.Load(currentApplication, 'Guard', guardReference, false, function (error) {
									if (error) throw error;
									
									nextGuard(true);
								});
								
								return;
							}
						}
						
						guardIndex++;
						
						if (!guard)
							throw new Error('Elemenx route guard not found');
						
						(function (guardReference) {
							context.Route = route;
							context.Guard = guardReference;
							emit('GuardStart', context);
							
							settleGuard(
								guard.call(context),
								function (result) {
									if (result === false || (result && result.ElemenxGuardFailure === true)) {
										if (result === false) {
											result = fail();
										}
										
										result.Guard = guardReference;
									}
									
									nextGuard(result);
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
					
					var hook = component.ElemenxOnRouteLeave;
					if (typeof hook !== 'function') {
						next(true);
						
						return;
					}
					
					context.Route = active[index + 1].Route;
					context.Guard = 'ElemenxOnRouteLeave';
					
					emit('GuardStart', context);
					
					settleGuard(
						hook.call(component, leaveArguments(context)),
						function (result) {
							if (result === false || (result && result.ElemenxGuardFailure === true)) {
								if (result === false) {
									result = fail();
								}
								
								result.Guard = 'ElemenxOnRouteLeave';
							}
							
							next(result);
						},
						context
					);
				}
				
				next(true);
			}
			
			function destroyFrom (index) {
				var i = active.length - 1;
				
				while (i >= index) {
					if (active[i].Component)
						active[i].Component.Destroy();
					
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
				var component;
				var i = 0;
				
				while (common > 0 && i < common) {
					active[i].Component.Update(packet);
					
					i++;
				}
				
				destroyFrom(common);
				
				if (common > 0)
					parent = active[common - 1].Component;
				
				i = common;
				
				while (i < found.Chain.length) {
					route = found.Chain[i];
					outlet = Runtime.ResolveOutlet(parent, route.Outlet || (i === 0 ? rootOutletName : 'Content'));
					
					if (!outlet)
						throw new Error('Elemenx router outlet not found: ' + (route.Outlet || (i === 0 ? rootOutletName : 'Content')));
					
					factory = componentFactory(route);
					
					if (!factory)
						throw new Error('Elemenx route component not found: ' + route.Component);
					
					component = Runtime.WithRouter(api, function () {
						return factory(packet, null, {Application: application(), RoutePacket: packet, GuardFailure: route.GuardFailure || null});
					});
					
					Runtime.AttachRouter(component, api);
					component.Parent(parent);
					outlet.Render(component);
					
					active.push({
						Route: route,
						Component: component
					});
					
					parent = component;
					
					i++;
				}
				
				return true;
			}
			
			function currentURL () {
				return new URL(global.location.href);
			}

			function routeComponentsReady (from) {
				var i = from;

				while (i < active.length) {
					if (active[i].Component && active[i].Component._Component && !active[i].Component._Component())
						return false;

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
			
			function commonPrefix (chain) {
				var common = 0;
				
				while (common < active.length && common < chain.length && active[common].Route === chain[common]) {
					common++;
				}
				
				return common;
			}
			
			function prepare (url) {
				var found = match(url.pathname);
				if (!found) return null;
				
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
			
			function guardFailureComponent (route, failure) {
				var policy = route && route.GuardFailed;
				
				if (!policy) return null;
				if (typeof policy === 'string' || typeof policy === 'function') return policy;
				if (typeof policy !== 'object') return null;
				
				if (failure.Guard !== undefined && policy[failure.Guard] !== undefined)
					return policy[failure.Guard];
				
				return policy.Default !== undefined ? policy.Default : null;
			}
			
			function renderGuardFailure (prepared, failure, reference, mode, id, context) {
				var chain = prepared.Found.Chain;
				var failureIndex = chain.indexOf(failure.Route);
				var failureRoute;
				var failureChain;
				var failurePrepared;
				
				if (failureIndex === -1) return false;
				
				failureRoute = {
					Component: reference,
					Outlet: failure.Route.Outlet,
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
					if (error) throw error;
					
					if (mode === 'push') global.history.pushState(null, '', prepared.URL.href);
					else if (mode === 'replace') global.history.replaceState(null, '', prepared.URL.href);
					
					emit('NavigationCommit', context);
					commit(failurePrepared);
					emit('NavigationEnd', context);
				});
				
				return true;
			}
			
			function handleGuardFailure (result, context) {
				var failure = result;
				
				if (failure === false) {
					failure = fail();
				}
				
				failure.From = context.From;
				failure.To = context.To;
				failure.Route = context.Route;
				failure.Guard = failure.Guard || context.Guard;
				
				emit('GuardFailed', failure);
				
				return failure;
			}
			
			function execute (prepared, mode) {
				var id = ++navigationID;
				var previousURL = currentURL();
				var context = {
					Service: function (name) {
						return Runtime.ServiceForApplication(application(), name);
					},
					Wait: waiter,
					Fail: fail,
					From: navigationPacket(previousURL),
					To: prepared.Packet,
					Route: null,
					Guard: null
				};

				emit('NavigationStart', context);

				runLeaveGuards(prepared.Common, context, function (leaveResult) {
					if (id !== navigationID) return;

					if (leaveResult !== true && leaveResult !== undefined) {
						if (typeof leaveResult === 'string') {
							emit('NavigationCancel', context);
							navigate(leaveResult, 'replace');
						}
						else {
							handleGuardFailure(leaveResult, context);
							emit('NavigationCancel', context);
						}

						return;
					}

					showWaiting(prepared, function (waitingError) {
						if (id !== navigationID) return;
						if (waitingError) throw waitingError;

						runEnterGuards(
							prepared.Found.Chain,
							prepared.Common,
							context,
							function (enterResult) {
								if (id !== navigationID) return;

								if (enterResult !== true && enterResult !== undefined) {
									clearWaiting();

									if (typeof enterResult === 'string') {
										emit('NavigationCancel', context);
										navigate(enterResult, 'replace');
									}
									else {
										var failure = handleGuardFailure(enterResult, context);
										var failureComponent = guardFailureComponent(failure.Route, failure);
										
										if (!failureComponent || !renderGuardFailure(prepared, failure, failureComponent, mode, id, context))
											emit('NavigationCancel', context);
									}

									return;
								}

								// Guard success is the navigation commit point. Discovery URLs are
								// absolute from Application bootstrap, so changing location here cannot
								// retarget a deferred component request. This keeps browser history ahead
								// of every target-page load and render operation.
								if (mode === 'push') global.history.pushState(null, '', prepared.URL.href);
								else if (mode === 'replace') global.history.replaceState(null, '', prepared.URL.href);

								emit('NavigationCommit', context);

								if (id !== navigationID) return;

									loadRouteComponents(prepared.Found.Chain, prepared.Common, function (componentError) {
									if (id !== navigationID) return;
									if (componentError) {
										if (mode === 'push' || mode === 'replace')
											global.history.replaceState(null, '', previousURL.href);

										clearWaiting();

										throw componentError;
									}

									commit(prepared);

									finishWaitingAfterCommit(prepared, id, function () {
											emit('NavigationEnd', context);
										});
									});
							}
						);
					});
				});
			}

			function notFound (url, mode) {
				var reference = config.NotFound;
				if (!reference) return false;

				var id = ++navigationID;
				var packet = statePacket(url, {});

				function render () {
					if (id !== navigationID) return;

					var factory = Runtime.ResolveComponentRegistered(reference);
					if (!factory)
						throw new Error('Elemenx NotFound component not found: ' + reference);

					var outlet = Runtime.ResolveOutlet(root, rootOutletName);
					if (!outlet)
						throw new Error('Elemenx router outlet not found: ' + rootOutletName);

					destroyFrom(0);

					var component = Runtime.WithRouter(api, function () {
						return factory(packet, null, {Application: application(), RoutePacket: packet});
					});

					Runtime.AttachRouter(component, api);
					component.Parent(root);
					outlet.Render(component);

					active.push({
						Route: null,
						Component: component
					});
				}

				if (mode === 'push')
					global.history.pushState(null, '', url.href);
				else if (mode === 'replace')
					global.history.replaceState(null, '', url.href);

				if (Runtime.ResolveComponentRegistered(reference)) {
					render();

					return true;
				}

				var currentApplication = application();
				if (!Runtime.Discovery || !currentApplication || !Runtime.Discovery.Ready(currentApplication))
					throw new Error('Elemenx NotFound component not found: ' + reference);

				Runtime.Discovery.Load(currentApplication, 'Component', reference, false, function (error) {
					if (id !== navigationID) return;
					if (error) throw error;

					render();
				});

				return true;
			}

			function navigate (url, mode) {
				var target = new URL(url, global.location.href);
				if (target.origin !== global.location.origin) {
					global.location.href = target.href;
					
					return api;
				}
				
				var prepared = prepare(target);
				if (!prepared) {
					if (!notFound(target, mode))
						global.location.href = target.href;
					
					return api;
				}
				
				execute(prepared, mode);
				
				return api;
			}
			
			function findAnchor (node) {
				while (node && node !== document) {
					if (node.tagName === 'A') return node;
					
					node = node.parentNode;
				}
				
				return null;
			}
			
			function Start () {
				if (started) return api;
				
				if (!root)
					throw new Error('Elemenx.Router requires Root component');
				
				clickHandler = function (event) {
					if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
					
					var anchor = findAnchor(event.target);
					if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
					
					var target = new URL(anchor.href, global.location.href);
					if (target.origin !== global.location.origin) return;
					if (!match(target.pathname) && !config.NotFound) return;
					
					event.preventDefault();
					
					navigate(target.href, 'push');
				};
				
				popHandler = function () {
					var url = currentURL();
					var prepared = prepare(url);
					
					if (prepared) {
						commit(prepared);
					}
					else {
						notFound(url, 'pop');
					}
				};
				
				document.addEventListener('click', clickHandler);
				global.addEventListener('popstate', popHandler);
				
				started = true;
				
				var url = currentURL();
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
				
				destroyFrom(0);
				
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
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		
		function Structural (component, definition, blueprintRoot) {
			var records = [];
			var projectionBlueprintRoot = null;
			var ownerToken = {};
			
			function own (object, name) {
				return Object.prototype.hasOwnProperty.call(object, name);
			}
			
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
			
			function factoryFor (tag) {
				var factory = Runtime.ResolveComponentRegistered(tag);
				
				if (factory) return factory;
				if (String(tag).indexOf('-') !== -1)
					return Runtime.ResolveComponent(tag);
				
				/*
				 * HTML normalizes <RemoteChild> to REMOTECHILD. Promote an otherwise
				 * normal-looking tag only when the current application's built
				 * Discovery map explicitly contains that component entity.
				 */
				var application = component.Application();
				
				if (Runtime.Discovery && application && Runtime.Discovery.Ready(application) && Runtime.Discovery.ResolvedName) {
					var discoveryName = Runtime.Discovery.ResolvedName(application, tag);
					if (discoveryName)
						return Runtime.ResolveComponent(discoveryName);
				}
				
				return null;
			}
			
			function propValue (text, data) {
				var match = /^{{\s*([\s\S]+?)\s*}}$/.exec(text);
				if (match) return expression(data, match[1]);
				
				if (text === '') return true;
				if (text === 'true') return true;
				if (text === 'false') return false;
				if (text === 'null') return null;
				
				return text;
			}
			
			function props (node, data) {
				var result = {};
				var attrs = node.attributes;
				var i = 0;
				var name;
				
				while (i < attrs.length) {
					name = attrs[i].name;
					
					if (!Runtime.Directive.Reserved(name)) {
						name = name.replace(/-([a-z])/g, function (match, letter) {
							return letter.toUpperCase();
						});
						
						result[name] = propValue(attrs[i].value, data);
					}
					
					i++;
				}
				
				return result;
			}
			
			function slotProjection (node) {
				var host = document.createElement('span');
				var groups = {};
				var blueprints = {};
				var child;
				var name;
				var group;
				
				host.style.display = 'contents';
				
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
						group = document.createElement('span');
						group.style.display = 'contents';
						group.setAttribute('data-ui-slot-group', name);
						group.__ElemenxProjectionOwner = ownerToken;
						
						groups[name] = group;
						blueprints[name] = document.createElement('span');
						blueprints[name].style.display = 'contents';
						blueprints[name].setAttribute('data-ui-slot-group', name);
						host.appendChild(group);
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
							if (Object.prototype.hasOwnProperty.call(groups, groupName)) {
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
			
			function events (node) {
				var result = {};
				var attrs = node.attributes;
				var i = 0;
				var name;
				
				while (i < attrs.length) {
					name = attrs[i].name;
					
					if (Runtime.Directive.Match(name, 'On'))
						result[Runtime.Directive.Argument(name, 'On')] = attrs[i].value;
					
					i++;
				}
				
				return result;
			}
			
			function asyncOptions (blueprint, name, extra) {
				var result = extra || {};
				
				result.Application = component.Application();
				
				result.AsyncLifecycle = {
					Owner: component,
					Name: name,
					Pending: blueprint.getAttribute(Runtime.Directive.Name('Pending')),
					Error: blueprint.getAttribute(Runtime.Directive.Name('Error'))
				};
				
				return result;
			}
			
			function connect (child, eventMap) {
				var eventName;
				var methodName;
				
				child.Parent(component);
				
				for (eventName in eventMap) {
					if (own(eventMap, eventName)) {
						methodName = eventMap[eventName];
						
						(function (name, method) {
							child.On(name, function (data, source) {
								if (typeof component[method] === 'function') {
									component[method](data, source);
								}
							});
						})(eventName, methodName);
					}
				}
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
				
				/*
				 * Projection is an ownership boundary, not a traversal dead-end.
				 * The declaring Structural instance owns this group and may compile
				 * through it. A receiving component sees the same DOM after slot
				 * placement, but must not compile the projected subtree a second time.
				 */
				if (node.hasAttribute('data-ui-slot-group') && node.__ElemenxProjectionOwner !== ownerToken) return;
				
				if (node.hasAttribute(Runtime.Directive.Name('For'))) {
					compileFor(node);
					
					return;
				}
				
				var factory = factoryFor(node.tagName);
				
				if (factory) {
					compileComponent(node, factory);
					
					return;
				}
				
				if (node.hasAttribute(Runtime.Directive.Name('If'))) {
					compileIf(node);
					
					return;
				}
				
				scan(node);
			}
			
			function pristineNodeFor (node) {
				if (!blueprintRoot) return null;
				
				var path = [];
				var current = node;
				var parent;
				var i;
				
				while (current && current !== component.Element()) {
					parent = current.parentNode;
					if (!parent) return null;
					
					path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
					
					current = parent;
				}
				
				if (current !== component.Element()) return null;
				
				current = blueprintRoot;
				i = 0;
				
				while (i < path.length && current) {
					current = current.childNodes[path[i]];
					
					i++;
				}
				
				return current || null;
			}
			
			function compileComponent (node, factory) {
				var parent = node.parentNode;
				var end = document.createComment('ui:' + node.tagName + ':end');
				var condition = node.getAttribute(Runtime.Directive.Name('If'));
				var eventMap = events(node);
				var pristineNode = pristineNodeFor(node);
				var pristineProjection = pristineNode ? slotProjection(pristineNode.cloneNode(true)) : null;
				var projected = slotProjection(node);
				var blueprint = node.cloneNode(true);
				
				if (projected && pristineProjection && pristineProjection.Blueprints)
					projected.PrimeBlueprints(pristineProjection.Blueprints());
				
				parent.insertBefore(end, node.nextSibling);
				parent.removeChild(node);
				records.push(componentRecord(end,factory,blueprint,condition,eventMap,projected));
			}
			
			function componentRecord (end, factory, blueprint, condition, eventMap, projected) {
				var child = null;
				var previousProps = null;
				
				/*
				 * Compile projected structure at declaration time. Delaying this until
				 * the child becomes visible lets parent text bindings mutate the live
				 * DOM first; a later data-if clone would then snapshot rendered text
				 * instead of the original {{expression}} template.
				 */
				if (projected)
					compileProjection(projected);
				
				var effect = Runtime.Effect(function () {
					var data = component.State;
					var visible = condition ? expression(data, condition) : true;
					var childProps;
					
					if (!visible) {
						if (child) {
							child.Destroy();
							child = null;
							previousProps = null;
						}
						
						return false;
					}
					
					childProps = props(blueprint, data);
					
					if (child) {
						/*
						 * Props are an input boundary. A retained child may mutate its own
						 * state (for example through data-model); do not overwrite that
						 * local state merely because the parent effect ran again with the
						 * same prop value. Only values that actually changed at the parent
						 * boundary are propagated.
						 */
						var changedProps = {};
						var changed = false;
						var propName;
						
						for (propName in childProps) {
							if (
								own(childProps, propName) &&
								(!previousProps || previousProps[propName] !== childProps[propName])
							) {
								changedProps[propName] = childProps[propName];
								changed = true;
							}
						}
						
						if (changed)
							child.Update(changedProps);
					}
					else {
						child = factory(childProps, projected, asyncOptions(blueprint, factory.ComponentName || blueprint.tagName));
						
						connect(child, eventMap);
						
						end.parentNode.insertBefore(child.Element(), end);
					}
					
					previousProps = childProps;
					
					return true;
				}, true);
				
				return {
					Update: function () {
						effect.Run();
					},
					
					Destroy: function () {
						effect.Destroy();
						
						if (child)
							child.Destroy();
						
						child = null;
						previousProps = null;
					}
				};
			}
			
			function collectionRecord (
				end,
				factory,
				blueprint,
				field,
				key,
				condition,
				eventMap,
				projected
			) {
				var host = document.createElement('span');
				
				if (projected)
					compileProjection(projected);
				
				var collection;
				var effect;
				
				host.style.display = 'contents';
				end.parentNode.insertBefore(host, end);
				
				collection = Runtime.Collection(
					host,
					
					function (item) {
						var slot = document.createElement('span');
						var child = null;
						
						slot.style.display = 'contents';
						
						function apply (current) {
							var visible = condition ? expression(current, condition) : true;
							var childProps = props(blueprint, current);
							var hasProps = Object.keys(childProps).length > 0;
							
							if (!visible) {
								if (child) {
									child.Destroy();
									child = null;
								}
								
								return;
							}
							
							/*
							 * No explicit props means the keyed item itself is the
							 * child state source. Because it came from a reactive
							 * array, nested objects remain Proxy-backed.
							 */
							
							if (!hasProps) {
								childProps = current;
								
								if (child) {
									/*
									 * A retained keyed component keeps its DirectState
									 * object/DOM identity, but the collection may replace
									 * the item object for the same key. Merge the new item
									 * values into that existing state just like explicit
									 * component props are refreshed below.
									 */
									child.Update(childProps);
								}
								else {
									child = factory(
										childProps,
										projected,
										asyncOptions(
											blueprint,
											factory.ComponentName || blueprint.tagName,
											{DirectState: true}
										)
									);
									
									connect(child, eventMap);
									
									slot.appendChild(child.Element());
								}
							}
							else {
								if (child) {
									child.Update(childProps);
								}
								else {
									child = factory(
										childProps,
										projected,
										asyncOptions(
											blueprint,
											factory.ComponentName || blueprint.tagName
										)
									);
									
									connect(child, eventMap);
									
									slot.appendChild(child.Element());
								}
							}
						}
						
						apply(item);
						
						return {
							Element: function () {
								return slot;
							},
							
							Update: apply,
							
							Destroy: function () {
								if (child)
									child.Destroy();
								
								child = null;
								
								if (slot.parentNode)
									slot.parentNode.removeChild(slot);
							}
						};
					},
					
					{
						Key: key
					}
				);
				
				effect = Runtime.Effect(function () {
					var data = component.State;
					var list = expression(data, field) || [];
					
					/*
					 * A collection depends on the STRUCTURE of the resulting list,
					 * not merely on the property that returned that list.
					 */
					Runtime.TrackIteration(list);
					
					var i = 0;
					var count = list.length;
					
					while (i < count) {
						if (list[i])
							list[i][key];
						
						i++;
					}
					
					collection.Set(list);
					
					return count;
				}, true);
				
				return {
					Update: function () {
						effect.Run();
					},
					
					Destroy: function () {
						effect.Destroy();
						collection.Destroy();
						
						if (host.parentNode)
							host.parentNode.removeChild(host);
					}
				};
			}
			
			function blueprintFor (node) {
				var path = [];
				var current = node;
				var targetRoot = blueprintRoot;
				var group;
				var name;
				var parent;
				var i;
				
				if (projectionBlueprintRoot) {
					current = node;
					
					while (current && !(current.nodeType === 1 && current.hasAttribute('data-ui-slot-group'))) {
						parent = current.parentNode;
						if (!parent) return node;
						
						path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
						
						current = parent;
					}
					
					if (!current) return node;
					
					group = current;
					name = group.getAttribute('data-ui-slot-group') || '';
					targetRoot = projectionBlueprintRoot[name];
					
					if (!targetRoot) return node;
				}
				else {
					if (!targetRoot) return node;
					current = node;
					
					while (current && current !== component.Element()) {
						parent = current.parentNode;
						if (!parent) return node;
						
						path.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
						
						current = parent;
					}
				}
				
				current = targetRoot;
				i = 0;
				
				while (i < path.length && current) {
					current = current.childNodes[path[i]];
					
					i++;
				}
				
				return current || node;
			}
			
			function compileFor (node) {
				var parent=node.parentNode;
				var source=node.getAttribute(Runtime.Directive.Name('For')) || '';
				var keySource=node.getAttribute(Runtime.Directive.Name('Key'));
				var classic=source.split(';');
				var ofMatch=/^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s+of\s+([\s\S]+)$/.exec(source);
				var inMatch=/^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s+in\s+([\s\S]+)$/.exec(source);
				var mode=classic.length === 3 ? 'classic' : (ofMatch ? 'of' : (inMatch ? 'in' : null));
				var initMatch=mode === 'classic' ? /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([\s\S]+)$/.exec(classic[0]) : null;
				var template=blueprintFor(node).cloneNode(true);
				var end=document.createComment('ui:for:' + source + ':end');
				var children=[];
				var keyed={};
				var limit=10000;

				if (!mode) throw new Error('Elemenx data-for expects classic for, for..of or for..in syntax: ' + source);
				if (mode === 'classic' && !initMatch) throw new Error('Elemenx data-for initializer must assign a local variable: ' + source);
				template.removeAttribute(Runtime.Directive.Name('For'));
				template.removeAttribute(Runtime.Directive.Name('Key'));
				parent.insertBefore(end,node.nextSibling);
				parent.removeChild(node);

				function iterationDefinition () {
					/*
					 * A structural iteration whose template root is itself an Elemenx
					 * component needs one transparent DOM owner above that tag.
					 *
					 * Runtime.CreateComponent compiles descendants of its template root;
					 * it does not reinterpret that root as another component. Native
					 * elements can therefore remain the iteration root, while a custom
					 * component tag must be placed one level below it.
					 */
					var componentRoot=factoryFor(template.tagName);
					var templateSource=componentRoot
						? '<span style="display:contents">' + template.outerHTML + '</span>'
						: template.outerHTML;
					var result={Template:templateSource};
					var methodName;
					for (methodName in definition) {
						if (own(definition,methodName) && typeof definition[methodName] === 'function' && methodName !== 'Template' && methodName !== 'ElemenxOnCreate' && methodName !== 'ElemenxOnDestroy') {
							(function (name) {
								result[name]=function () { return definition[name].apply(component,arguments); };
							})(methodName);
						}
					}
					return result;
				}

				function baseScope () {
					var result={};
					var name;
					
					for (name in component.State)
						if (own(component.State,name))
							result[name]=component.State[name];
					
					/*
					 * Classic data-for conditions are evaluated before an iteration
					 * component exists, but they may call methods of the owning
					 * component:
					 *
					 *     i = 0; item = QueueItem(i); i++
					 *
					 * Expose the same definition methods to the loop scope that the
					 * generated iteration component receives below.
					 */
					for (name in definition) {
						if (
							own(definition,name) &&
							typeof definition[name] === 'function' &&
							name !== 'Template' &&
							name !== 'ElemenxOnCreate' &&
							name !== 'ElemenxOnDestroy'
						) {
							(function (methodName) {
								result[methodName]=function () {
									return definition[methodName].apply(component,arguments);
								};
							})(name);
						}
					}
					
					return result;
				}

				function copyScope (sourceScope) {
					var result={};
					var name;
					for (name in sourceScope) if (own(sourceScope,name)) result[name]=sourceScope[name];
					return result;
				}

				function scopes () {
					var result=[];
					var loopScope=baseScope();
					var list,iterator,step,name,scope;
					var i=0;

					if (mode === 'classic') {
						/*
						 * `with (scope)` can only keep an assignment local when the
						 * assigned name already exists on that scope. A classic loop may
						 * intentionally introduce another loop-local from its condition:
						 *
						 *     i = 0; item = QueueItem(i); i++
						 *
						 * Predeclare that simple assignment target before evaluation so it
						 * cannot leak to globalThis and the captured iteration scope gets
						 * the value produced by the condition.
						 */
						var conditionAssignment=/^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*=(?!=)/.exec(classic[1]);
						loopScope[initMatch[1]]=expression(loopScope,initMatch[2]);
						if (conditionAssignment && !own(loopScope,conditionAssignment[1]))
							loopScope[conditionAssignment[1]]=undefined;
						while (i < limit && expression(loopScope,classic[1])) {
							scope=copyScope(loopScope);
							scope.$index=i;
							result.push(scope);
							expression(loopScope,classic[2]);
							i++;
						}
					}
					else if (mode === 'of') {
						list=expression(loopScope,ofMatch[2]);
						if (list == null) list=[];
						Runtime.TrackIteration(list);
						if (typeof Symbol !== 'undefined' && list[Symbol.iterator]) {
							iterator=list[Symbol.iterator]();
							step=iterator.next();
							while (!step.done && i < limit) {
								scope=copyScope(loopScope);
								scope[ofMatch[1]]=step.value;
								scope.$index=i;
								result.push(scope);
								i++;
								step=iterator.next();
							}
						}
						else {
							while (i < list.length && i < limit) {
								scope=copyScope(loopScope);
								scope[ofMatch[1]]=list[i];
								scope.$index=i;
								result.push(scope);
								i++;
							}
						}
					}
					else {
						list=expression(loopScope,inMatch[2]);
						if (list == null) list={};
						Runtime.TrackIteration(list);
						for (name in list) {
							if (!own(list,name)) continue;
							if (i >= limit) break;
							scope=copyScope(loopScope);
							scope[inMatch[1]]=name;
							scope.$index=i;
							result.push(scope);
							i++;
						}
					}

					if (i >= limit) throw new Error('Elemenx structural loop exceeded iteration limit (' + limit + '): ' + source);
					return result;
				}

				function destroyAll () {
					var i=children.length - 1;
					while (i >= 0) { children[i].Child.Destroy(); i--; }
					children=[];
					keyed={};
				}

				var forEffect=Runtime.Effect(function () {
					var nextScopes=scopes();
					var nextChildren=[];
					var nextKeyed={};
					var used={};
					var i=0,scope,identity,token,record,child;

					if (!keySource) destroyAll();
					while (i < nextScopes.length) {
						scope=nextScopes[i];
						record=null;
						token=null;
						if (keySource) {
							identity=expression(scope,keySource);
							if (identity === null || identity === undefined) throw new Error('Elemenx data-key resolved to null/undefined: ' + keySource);
							token=typeof identity + ':' + String(identity);
							if (used[token]) throw new Error('Elemenx duplicate data-key in data-for: ' + String(identity));
							used[token]=true;
							record=keyed[token] || null;
						}
						if (record) record.Child.Update(scope);
						else {
							child=Runtime.CreateComponent(iterationDefinition())(scope,null,{DirectState:true,Application:component.Application()});
							child.Parent(component);
							record={Child:child,Key:token};
						}
						end.parentNode.insertBefore(record.Child.Element(),end);
						nextChildren.push(record);
						if (keySource) nextKeyed[token]=record;
						i++;
					}
					if (keySource) {
						i=children.length - 1;
						while (i >= 0) {
							record=children[i];
							if (!nextKeyed[record.Key]) record.Child.Destroy();
							i--;
						}
					}
					children=nextChildren;
					keyed=nextKeyed;
					return children.length;
				},true);

				records.push({
					Update:function () { forEffect.Run(); },
					Destroy:function () { forEffect.Destroy(); destroyAll(); }
				});
			}

			function compileIf (node) {
				var parent = node.parentNode;
				var field = node.getAttribute(Runtime.Directive.Name('If'));
				var template = blueprintFor(node).cloneNode(true);
				var end = document.createComment('ui:if:' + field + ':end');
				var child = null;
				
				template.removeAttribute(Runtime.Directive.Name('If'));
				parent.insertBefore(end, node.nextSibling);
				parent.removeChild(node);
				
				var conditionEffect = Runtime.Effect(function () {
					var data = component.State;
					
					if (!expression(data, field)) {
						if (child)
							child.Destroy();
						
						child = null;
						
						return false;
					}
					
					if (!child) {
						var conditionalDefinition = {Template: template.outerHTML};
						var methodName;
						
						/*
						 * A data-if subtree is structural ownership of THIS component,
						 * not a new semantic component. Runtime.CreateComponent is used
						 * only as the subtree binding engine, so event methods inside the
						 * recreated subtree must continue to resolve against the owner.
						 *
						 * Without these delegates a root/nested data-if clones the markup
						 * into an anonymous component whose definition contains Template
						 * only. data-on-* listeners are then present in the DOM but have no
						 * callable method, which is exactly what the deep event regression
						 * exposed. Lifecycle hooks are deliberately not copied: toggling a
						 * structural subtree must not create/destroy the owner component.
						 */
						for (methodName in definition) {
							if (
								own(definition, methodName) &&
								typeof definition[methodName] === 'function' &&
								methodName !== 'Template' &&
								methodName !== 'ElemenxOnCreate' &&
								methodName !== 'ElemenxOnDestroy'
							) {
								(function (name) {
									conditionalDefinition[name] = function () {
										return definition[name].apply(component, arguments);
									};
								})(methodName);
							}
						}
						
						child = Runtime.CreateComponent(conditionalDefinition)(data, null, {
							DirectState: true,
							Application: component.Application()
						});
						child.Parent(component);
						end.parentNode.insertBefore(child.Element(), end);
					}
					
					return true;
				}, true);
				
				records.push({
					Update: function () {
						/*
						 * First run is driven by Structural.Update after ElemenxOnCreate().
						 * After that the Effect is dependency-driven by Proxy.
						 */
						conditionEffect.Run();
					},
					
					Destroy: function () {
						conditionEffect.Destroy();
						
						if (child)
							child.Destroy();
						
						child = null;
					}
				});
			}
			
			scan(component.Element());
			
			return {
				Update: function (data) {
					var i = 0;
					var count = records.length;
					
					while (i < count) {
						records[i].Update(data || {});
						
						i++;
					}
					
					/*
					 * A first update may compile projected structural records.
					 * Run only the newly-added records once with the same data.
					 */
					
					while (i < records.length) {
						records[i].Update(data || {});
						
						i++;
					}
				},
				
				Destroy: function () {
					var i = records.length - 1;
					
					while (i >= 0) {
						records[i].Destroy();
						
						i--;
					}
					
					records = [];
				}
			};
		}
		
		Runtime.Structural = Structural;
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		var Elemenx = global.Elemenx;
		var NetworkProtocols = {};
		
		function NetworkEvents (target) {
			var events = {};
			
			function dispatch (name, event, context) {
				var list = events[name];
				if (!list) return;
				
				var copy = list.slice();
				var i = 0;
				
				while (i < copy.length) {
					copy[i].call(target, event, context || target);
					
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
					if (!list) return target;
					
					if (typeof callback !== 'function') {
						delete events[name];
						
						return target;
					}
					
					var i = list.length - 1;
					while (i >= 0) {
						if (list[i] === callback) list.splice(i, 1);
						
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
		
		function NetworkProtocol (name, definition) {
			if (arguments.length === 1)
				return NetworkProtocols[name] || null;
			
			NetworkProtocols[name] = definition || {};
			
			return NetworkProtocols[name];
		}
		
		function ResolveNetworkProtocol (protocol) {
			if (!protocol)
				return null;
			
			if (typeof protocol === 'string')
				return NetworkProtocol(protocol);
			
			return protocol;
		}
		
		function NetworkXHR (configuration) {
			var config = configuration || {};
			var method = config.Method || 'GET';
			var url = config.URL || '';
			var data = Object.prototype.hasOwnProperty.call(config, 'Data') ? config.Data : null;
			var headers = {};
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var xhr = null;
			var executing = false;
			var execution = 0;
			var events;
			var api;
			
			function addHeader (key, value) {
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
			
			function transport (type, data) {
				return events.Emit('Transport', type, data);
			}
			
			function protocolEvent (type, data, transportEvent) {
				return events.Emit('Protocol', type, data, transportEvent);
			}
			
			function decode (input, transportEvent) {
				if (!protocol || typeof protocol.Decode !== 'function') return;
				
				var decoded = protocol.Decode.call(api, input, api);
				if (!decoded || !decoded.Type) return;
				
				protocolEvent(decoded.Type, decoded.Data, transportEvent);
			}
			
			function encode (input) {
				if (!protocol || typeof protocol.Encode !== 'function') return input;
				
				return protocol.Encode.call(api, input, api);
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
			
			function applyHeaders (nativeXHR) {
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
					
					var currentExecution = ++execution;
					var currentXHR = new global.XMLHttpRequest();
					xhr = currentXHR;
					
					function active () {
						return !terminal && currentExecution === execution && xhr === currentXHR;
					}
					
					function finish (type, value) {
						if (!active()) return;
						
						terminal = true;
						executing = false;
						
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
					
					applyHeaders(currentXHR);
					
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
			
			events = NetworkEvents(api);
			return api;
		}
		
		function NetworkStream (configuration) {
			var config = configuration || {};
			var method = config.Method || 'GET';
			var url = config.URL || '';
			var data = Object.prototype.hasOwnProperty.call(config, 'Data') ? config.Data : null;
			var headers = {};
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var controller = null;
			var reader = null;
			var active = false;
			var paused = false;
			var reading = false;
			var resumeRead = null;
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
			
			function addHeader (key, value) {
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
			
			function transport (type, value) {
				return events.Emit('Transport', type, value);
			}
			
			function protocolEvent (type, value, transportEvent) {
				return events.Emit('Protocol', type, value, transportEvent);
			}
			
			function protocolData (input, transportEvent) {
				if (!protocol) return;
				
				var decoded;
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
				
				if (typeof protocol.Decode !== 'function') return;
				
				decoded = protocol.Decode.call(api, input, api);
				if (!decoded || !decoded.Type) return;
				
				protocolEvent(decoded.Type, decoded.Data, transportEvent);
			}
			
			function encode (input) {
				if (!protocol || typeof protocol.Encode !== 'function') return input;
				
				return protocol.Encode.call(api, input, api);
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
					if (active) return api;
					
					method = value;
					
					return api;
				},
				
				URL: function (value) {
					if (active) return api;
					
					url = value;
					
					return api;
				},
				
				Data: function (value) {
					if (active) return api;
					
					data = value;
					
					return api;
				},
				
				Header: function (key, value) {
					if (active) return api;
					
					addHeader(key, value);
					
					return api;
				},
				
				Protocol: function (value) {
					if (active) return api;
					
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
					
					if (active) return api;
					
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
									
									if (!paused) Read();
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
					
					if (resumeRead) resumeRead();
					
					return api;
				},
				
				Close: function () {
					if (!active) return api;
					
					var currentReader = reader;
					var currentController = controller;
					
					sendQueue = [];
					
					if (drainTimer !== null) {
						global.clearTimeout(drainTimer);
						drainTimer = null;
					}
					
					transport('BeforeClose', {
						URL: url
					});
					
					active = false;
					paused = false;
					reading = false;
					resumeRead = null;
					generation++;
					sendQueue = [];
					queuedBytes = 0;
					saturated = false;
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
			
			events = NetworkEvents(api);
			
			return api;
		}
		
		function NetworkLongPolling (configuration) {
			var config = configuration || {};
			var method = config.Method || 'GET';
			var url = config.URL || '';
			var data = Object.prototype.hasOwnProperty.call(config, 'Data') ? config.Data : null;
			var headers = {};
			var protocol = ResolveNetworkProtocol(config.Protocol);
			var retry = config.Retry !== undefined ? config.Retry : 1000;
			var active = false;
			var request = null;
			var retryTimer = null;
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
			
			function addHeader (key, value) {
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
			
			function transport (type, value) {
				return events.Emit('Transport', type, value);
			}
			
			function protocolEvent (type, value, transportEvent) {
				return events.Emit('Protocol', type, value, transportEvent);
			}
			
			function decode (input, transportEvent) {
				var decoded;
				if (!protocol || typeof protocol.Decode !== 'function') return;
				
				decoded = protocol.Decode.call(api, input, api);
				if (!decoded || !decoded.Type) return;
				
				protocolEvent(decoded.Type, decoded.Data, transportEvent);
			}
			
			function encode (input) {
				if (!protocol || typeof protocol.Encode !== 'function') return input;
				
				return protocol.Encode.call(api, input, api);
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
				
				var names;
				var i;
				var j;
				var values;
				
				var current = new global.XMLHttpRequest();
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
				
				names = Object.keys(headers);
				i = 0;
				
				while (i < names.length) {
					values = headers[names[i]];
					j = 0;
					
					while (j < values.length) {
						current.setRequestHeader(names[i], values[j]);
						
						j++;
					}
					
					i++;
				}
				
				current.send(body);
			}
			
			if (config.Headers) {
				Object.keys(config.Headers).forEach(function (key) {
					addHeader(key, config.Headers[key]);
				});
			}
			
			api = {
				Method: function (value) {
					if (active) return api;
					
					method = value;
					
					return api;
				},
				
				URL: function (value) {
					if (active) return api;
					
					url = value;
					
					return api;
				},
				
				Data: function (value) {
					if (active) return api;
					
					data = value;
					
					return api;
				},
				
				Header: function (key, value) {
					if (active) return api;
					
					addHeader(key, value);
					
					return api;
				},
				
				Protocol: function (value) {
					if (active) return api;
					
					protocol = ResolveNetworkProtocol(value);
					
					return api;
				},
				
				Retry: function (value) {
					if (active) return api;
					
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
					if (active) return api;
					
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
					sendQueue = [];
					queuedBytes = 0;
					saturated = false;
					
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
			
			events = NetworkEvents(api);
			
			return api;
		}
		
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
			
			function transport (type, data) {
				return events.Emit('Transport', type, data);
			}
			
			function protocolEvent (type, data, transportEvent) {
				return events.Emit('Protocol', type, data, transportEvent);
			}
			
			function decode (input, transportEvent) {
				if (!protocol || typeof protocol.Decode !== 'function') return;
				
				var decoded = protocol.Decode.call(api, input, api);
				if (!decoded || !decoded.Type) return;
				
				protocolEvent(decoded.Type, decoded.Data, transportEvent);
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
					
					var currentSource = new global.EventSource(url, {
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
			
			events = NetworkEvents(api);
			
			return api;
		}
		
		function NetworkTransferOutbound (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var source = Object.prototype.hasOwnProperty.call(config, 'Data') ? config.Data : null;
			var encoder = config.Encoder || null;
			var chunkSize = config.ChunkSize || (64 * 1024);
			var windowSize = config.WindowSize || 8;
			var retry = config.Retry || 1500;
			var maxRetries = Object.prototype.hasOwnProperty.call(config, 'MaxRetries') ? config.MaxRetries : 8;
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
			var wholeListeners = [];
			var transportListeners = [];
			var sendQueue = [];
			var draining = false;
			var events;
			var api;
			
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
			
			function makeID () {
				return Date.now().toString(36) + '-' + Math.floor(Math.random() * 0x100000000).toString(36);
			}
			
			function sourceSize () {
				if (!source) return 0;
				
				if (typeof source.size === 'number') return source.size;
				if (typeof source.byteLength === 'number') return source.byteLength;
				if (ArrayBuffer.isView(source)) return source.byteLength;
				if (typeof source === 'string') return source.length;
				
				return 0;
			}
			
			function sourceName () {
				return source && source.name ? source.name : null;
			}
			
			function sourceType () {
				return source && source.type ? source.type : 'application/octet-stream';
			}
			
			function sliceSource (start, end) {
				var view;
				
				if (source instanceof Blob) return source.slice(start, end);
				if (source instanceof ArrayBuffer) return source.slice(start, end);
				
				if (ArrayBuffer.isView(source)) {
					view = new Uint8Array(
						source.buffer,
						source.byteOffset + start,
						Math.min(end - start, source.byteLength - start)
					);
					
					return view.slice().buffer;
				}
				
				throw new Error('Unsupported chunked transfer source');
			}
			
			function toArrayBuffer (value) {
				if (value instanceof ArrayBuffer)
					return global.Promise.resolve(value);
				
				if (ArrayBuffer.isView(value))
					return global.Promise.resolve(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
				
				if (value instanceof Blob)
					return value.arrayBuffer();
				
				return global.Promise.reject(new Error('Unsupported transfer chunk'));
			}
			
			function transform (value, context) {
				if (typeof encoder !== 'function')
					return global.Promise.resolve(value);
				
				try {
					return global.Promise.resolve(encoder.call(api, value, context));
				}
				catch (error) {
					return global.Promise.reject(error);
				}
			}
			
			function flightCount () {
				return Object.keys(inFlight).length;
			}
			
			function clearFlight (flight) {
				if (!flight || !flight.Timer) return;
				
				global.clearTimeout(flight.Timer);
				
				flight.Timer = null;
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
			
			function wholeOn (name, callback) {
				if (!transport || typeof transport.On !== 'function') return;
				
				transport.On(name, callback);
				wholeListeners.push({Name: name, Callback: callback});
			}
			
			function clearWholeListeners () {
				if (!transport || typeof transport.Off !== 'function') {
					wholeListeners = [];
					
					return;
				}
				
				var i = 0;
				while (i < wholeListeners.length) {
					transport.Off(wholeListeners[i].Name, wholeListeners[i].Callback);
					
					i++;
				}
				
				wholeListeners = [];
			}
			
			function fail (type, value) {
				if (!active) return;
				
				var mode = transport && typeof transport.Send === 'function' ? 'Chunked' : 'Whole';
				
				active = false;
				generation++;
				
				clearFlights();
				clearWholeListeners();
				clearTransportListeners();
				
				sendQueue = [];
				
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
			
			function transportOn (name, callback) {
				if (!transport || typeof transport.On !== 'function') return;
				
				transport.On(name, callback);
				transportListeners.push({Name: name, Callback: callback});
			}
			
			function clearTransportListeners () {
				if (!transport || typeof transport.Off !== 'function') {
					transportListeners = [];
					
					return;
				}
				
				var i = 0;
				while (i < transportListeners.length) {
					transport.Off(transportListeners[i].Name, transportListeners[i].Callback);
					
					i++;
				}
				
				transportListeners = [];
			}
			
			function drainSendQueue () {
				if (!active || draining) return;
				
				var item;
				
				draining = true;
				
				while (sendQueue.length) {
					if (transport && typeof transport.Writable === 'function' && !transport.Writable()) break;
					
					item = sendQueue[0];
					if (transport.Send(item.Packet) === false) break;
					
					sendQueue.shift();
					
					if (typeof item.Accepted === 'function') item.Accepted();
				}
				
				draining = false;
			}
			
			function sendPacket (packet, accepted) {
				if (!transport || typeof transport.Send !== 'function')
					throw new Error('Chunked transfer transport must provide Send(data)');
				
				sendQueue.push({Packet: packet, Accepted: accepted || null});
				
				drainSendQueue();
			}
			
			function scheduleRetry (flight, currentGeneration) {
				clearFlight(flight);
				
				flight.Timer = global.setTimeout(function () {
					if (!active || currentGeneration !== generation || !inFlight[flight.Index]) return;
					
					if (flight.Retries >= maxRetries) {
						fail('Error', new Error('Transfer chunk acknowledgement timeout: ' + flight.Index));
						
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
			
			function pump (currentGeneration) {
				if (!active || currentGeneration !== generation) return;
				
				var start;
				var end;
				var index;
				var chunk;
				
				while (flightCount() < windowSize && offset < total) {
					start = offset;
					end = Math.min(start + chunkSize, total);
					index = nextIndex++;
					offset = end;
					chunk = sliceSource(start, end);
					inFlight[index] = {
						Index: index,
						Bytes: end - start,
						Packet: null,
						Retries: 0,
						Timer: null,
						Preparing: true
					};
					
					(function (chunkStart, chunkEnd, chunkIndex, chunkValue) {
						toArrayBuffer(chunkValue)
							.then(function (buffer) {
								return transform(buffer, {
									Mode: 'Chunked',
									ID: transferID,
									Index: chunkIndex,
									Offset: chunkStart,
									Size: buffer.byteLength,
									Transport: transport
								});
							})
							.then(function (payload) {
								var packet;
								var flight;
								
								if (!active || currentGeneration !== generation) return;
								
								packet = {
									Type: 'Transfer',
									Action: 'Chunk',
									ID: transferID,
									Index: chunkIndex,
									Offset: chunkStart,
									Bytes: chunkEnd - chunkStart,
									Data: payload
								};
								
								flight = {
									Index: chunkIndex,
									Bytes: chunkEnd - chunkStart,
									Packet: packet,
									Retries: 0,
									Timer: null
								};
								
								inFlight[chunkIndex] = flight;
								
								try {
									sendPacket(packet, function () {
										if (!active || currentGeneration !== generation || !inFlight[chunkIndex]) return;
										
										emit('Chunk', {
											ID: transferID,
											Index: chunkIndex,
											Offset: chunkStart,
											Bytes: chunkEnd - chunkStart
										});
										
										scheduleRetry(flight, currentGeneration);
										pump(currentGeneration);
										chunkProgress();
									});
								}
								catch (error) {
									delete inFlight[chunkIndex];
									fail('Error', error);
								}
								
							})
							.catch(function (error) {
								if (!active || currentGeneration !== generation) return;
								
								delete inFlight[chunkIndex];
								
								fail('Error', error);
							});
					})(start, end, index, chunk);
				}
				
				finishChunked();
			}
			
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
					
					active = false;
					
					clearFlights();
					clearTransportListeners();
					
					sendQueue = [];
					loaded = total;
					
					responseCompletedAt = Date.now();
					if (!sendCompletedAt)
						sendCompletedAt = responseCompletedAt;
					
					setPhase('Complete');
					
					emit('Complete', {
						ID: transferID,
						Loaded: loaded,
						Total: total,
						Elapsed: responseCompletedAt - startedAt,
						Metrics: {
							SendElapsed: sendCompletedAt - startedAt,
							WaitElapsed: Math.max(0, responseCompletedAt - sendCompletedAt),
							ResponseElapsed: 0,
							TotalElapsed: responseCompletedAt - startedAt
						},
						Mode: 'Chunked'
					});
				}
			}
			
			function executeWhole () {
				var payload;
				
				transform(source, {
					Mode: 'Whole',
					Transport: transport,
					Name: sourceName(),
					Type: sourceType(),
					Size: total
				})
					.then(function (value) {
						if (!active) return;
						
						payload = value;
						
						wholeOn('Transport.RequestProgress', function (event) {
							var nativeEvent;
							var elapsed;
							
							if (!active) return;
							
							nativeEvent = event.Data;
							loaded = nativeEvent && typeof nativeEvent.loaded === 'number' ? nativeEvent.loaded : loaded;
							
							if (nativeEvent && nativeEvent.lengthComputable && typeof nativeEvent.total === 'number') total = nativeEvent.total;
							
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
						});
						
						wholeOn('Transport.BeforeResponse', function (event) {
							if (!active) return;
							
							if (!sendCompletedAt)
								sendCompletedAt = Date.now();
							
							responseStartedAt = Date.now();
							
							setPhase('Receiving', event);
						});
						
						wholeOn('Transport.ResponseProgress', function (event) {
							if (!active) return;
							
							if (!responseStartedAt)
								responseStartedAt = Date.now();
							
							setPhase('Receiving', event);
						});
						
						wholeOn('Transport.AfterResponse', function (event) {
							if (!active) return;
							
							responseCompletedAt = Date.now();
						});
						
						wholeOn('Transport.Success', function (event) {
							if (!active) return;
							
							loaded = total;
							active = false;
							clearWholeListeners();
							
							if (!sendCompletedAt) sendCompletedAt = Date.now();
							if (!responseStartedAt) responseStartedAt = Date.now();
							if (!responseCompletedAt) responseCompletedAt = Date.now();
							setPhase('Complete');
							
							emit('Complete', {
								ID: transferID,
								Loaded: loaded,
								Total: total,
								Elapsed: responseCompletedAt - startedAt,
								Metrics: {
									SendElapsed: sendCompletedAt - startedAt,
									WaitElapsed: Math.max(0, responseStartedAt - sendCompletedAt),
									ResponseElapsed: Math.max(0, responseCompletedAt - responseStartedAt),
									TotalElapsed: responseCompletedAt - startedAt
								},
								Response: event.Data,
								Mode: 'Whole'
							});
						});
						
						wholeOn('Transport.Error', function (event) {
							fail('Error', event);
						});
						
						wholeOn('Transport.Timeout', function (event) {
							fail('Timeout', event);
						});
						
						wholeOn('Transport.Abort', function (event) {
							fail('Abort', event);
						});
						
						transport.Data(payload);
						transport.Execute();
					})
					.catch(function (error) {
						fail('Error', error);
					});
			}
			
			api = {
				Transport: function (value) {
					if (active) return api;
					
					transport = value;
					
					return api;
				},
				
				Data: function (value) {
					if (active) return api;
					
					source = value;
					
					return api;
				},
				
				Encoder: function (value) {
					if (active) return api;
					
					encoder = value;
					
					return api;
				},
				
				ChunkSize: function (value) {
					if (active) return api;
					
					chunkSize = Math.max(1, Number(value) || 1);
					
					return api;
				},
				
				WindowSize: function (value) {
					if (active) return api;
					
					windowSize = Math.max(1, Number(value) || 1);
					
					return api;
				},
				
				Retry: function (value) {
					if (active) return api;
					
					retry = Math.max(1, Number(value) || 1);
					
					return api;
				},
				
				MaxRetries: function (value) {
					if (active) return api;
					
					maxRetries = Math.max(0, Number(value) || 0);
					
					return api;
				},
				
				Phase: function () {
					return phase;
				},
				
				Active: function () {
					return active;
				},
				
				On: function (name, callback) {
					return events.On(name, callback);
				},
				
				Off: function (name, callback) {
					return events.Off(name, callback);
				},
				
				Execute: function () {
					var mode;
					
					if (active) return api;
					
					if (source === null || source === undefined) {
						emit('Error', {Error: new Error('Transfer source is not set')});
						
						return api;
					}
					
					mode = transport && typeof transport.Send === 'function' ? 'Chunked' : 'Whole';
					
					if (mode === 'Whole' && (!transport || typeof transport.Data !== 'function' || typeof transport.Execute !== 'function')) {
						emit('Error', {Error: new Error('Whole transfer transport must provide Data(data) and Execute()')});
						
						return api;
					}
					
					transferID = makeID();
					total = sourceSize();
					loaded = 0;
					startedAt = Date.now();
					sendCompletedAt = 0;
					responseStartedAt = 0;
					responseCompletedAt = 0;
					phase = 'Idle';
					active = true;
					
					emit('Start', {
						ID: transferID,
						Name: sourceName(),
						Type: sourceType(),
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
					
					transportOn('Transport.Drain', function () {
						drainSendQueue();
					});
					
					transportOn('Protocol.Transfer', function (event) {
						receivePacket(event.Data);
					});
					
					try {
						sendPacket(
							{
								Type: 'Transfer',
								Action: 'Start',
								ID: transferID,
								Name: sourceName(),
								Mime: sourceType(),
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
						catch (error) { }
					}
					else if (transport && typeof transport.Abort === 'function') {
						transport.Abort();
						
						return api;
					}
					
					fail('Abort', null);
					
					return api;
				},
				
				Destroy: function () {
					if (active) api.Abort();
					
					clearFlights();
					clearWholeListeners();
					clearTransportListeners();
					
					sendQueue = [];
					transport = null;
					source = null;
					
					return api;
				}
			};
			
			events = NetworkEvents(api);
			
			return api;
		}
		
		function NetworkTransfer (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var sourceSet = Object.prototype.hasOwnProperty.call(config, 'Data');
			var source = sourceSet ? config.Data : null;
			var encoder = config.Encoder || null;
			var chunkSize = config.ChunkSize || (64 * 1024);
			var windowSize = config.WindowSize || 8;
			var retry = config.Retry || 1500;
			var maxRetries = Object.prototype.hasOwnProperty.call(config, 'MaxRetries') ? config.MaxRetries : 8;
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
			var listeners = [];
			var events;
			var api;
			
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
			
			function onTransport (name, callback) {
				if (!transport || typeof transport.On !== 'function') return;
				
				transport.On(name, callback);
				listeners.push({Name: name, Callback: callback});
			}
			
			function clearListeners () {
				if (!transport || typeof transport.Off !== 'function') {
					listeners = [];
					
					return;
				}
				
				var i = 0;
				while (i < listeners.length) {
					transport.Off(listeners[i].Name, listeners[i].Callback);
					i++;
				}
				
				listeners = [];
			}
			
			function binary (value) {
				if (value instanceof ArrayBuffer) return value;
				
				if (ArrayBuffer.isView(value))
					return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
				
				return null;
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
				
				if (!expected) expected = loaded;
				
				setPhase('Complete');
				clearListeners();
				
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
				if (!active) return;
				
				active = false;
				paused = false;
				
				setPhase(type, value);
				clearListeners();
				
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
			
			function receivePacket (packet) {
				if (!active || !packet || packet.Type !== 'Transfer') return;
				
				if (packet.Action === 'Start') {
					transferID = packet.ID || transferID;
					expected = Number(packet.Size) || 0;
					name = packet.Name || null;
					mime = packet.Mime || mime;
					loaded = 0;
					
					setPhase('Receiving', packet);
					
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
						fail('Error', new Error('Protocol must decode inbound Transfer chunk Data to binary'));
						
						return;
					}
					
					loaded += value.byteLength;
					
					emit('Data', {
						ID: transferID,
						Data: value,
						Bytes: value.byteLength,
						Loaded: loaded,
						Total: expected,
						Mode: 'Inbound'
					});
					
					progress();
					
					return;
				}
				
				if (packet.Action === 'End' || packet.Action === 'Complete') {
					complete();
					
					return;
				}
				
				if (packet.Action === 'Abort')
					fail('Abort', packet);
			}
			
			function payloadBytes (value) {
				if (value === null || value === undefined) return 0;
				
				if (typeof value === 'string') {
					if (global.TextEncoder)
						return new global.TextEncoder().encode(value).byteLength;
					
					return value.length * 2;
				}
				
				if (value instanceof global.ArrayBuffer)return value.byteLength;
				if (global.ArrayBuffer && global.ArrayBuffer.isView && global.ArrayBuffer.isView(value)) return value.byteLength;
				if (global.Blob && value instanceof global.Blob) return value.size;
				
				return 0;
			}
			
			function executeInbound () {
				if (!transport || typeof transport.On !== 'function') {
					emit('Error', {Error: new Error('Inbound transfer transport must provide On()')});
					
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
				
				onTransport('Protocol.Transfer', function (event) {
					hasProtocol = true;
					
					receivePacket(event.Data);
				});
				
				onTransport('Transport.ResponseProgress', function (event) {
					var nativeEvent = event.Data;
					if (!active || !nativeEvent) return;
					
					loaded = typeof nativeEvent.loaded === 'number' ? nativeEvent.loaded : loaded;
					
					if (nativeEvent.lengthComputable && typeof nativeEvent.total === 'number') expected = nativeEvent.total;
					
					setPhase('Receiving', event);
					progress();
				});
				
				onTransport('Transport.Success', function (event) {
					if (!active) return;
					
					var response = event.Data ? event.Data.Response : null;
					var bytes = 0;
					
					if (response instanceof Blob) bytes = response.size;
					else if (response instanceof ArrayBuffer) bytes = response.byteLength;
					else if (ArrayBuffer.isView(response)) bytes = response.byteLength;
					else if (response !== null && response !== undefined) bytes = payloadBytes(response);
					
					loaded = bytes || loaded;
					if (!expected) expected = loaded;
					
					emit('Data', {
						ID: transferID,
						Data: response,
						Bytes: bytes,
						Loaded: loaded,
						Total: expected,
						Mode: 'Inbound'
					});
					
					complete(event.Data);
				});
				
				onTransport('Transport.Data', function (event) {
					if (!active || hasProtocol || !event.Data) return;
					
					var value = binary(event.Data.Data);
					if (!value) return;
					
					setPhase('Receiving', event);
					
					loaded += value.byteLength;
					
					emit('Data', {
						ID: transferID,
						Data: value,
						Bytes: value.byteLength,
						Loaded: loaded,
						Total: expected,
						Mode: 'Inbound'
					});
					
					progress();
				});
				
				onTransport('Transport.End', function () {
					if (!active || hasProtocol) return;
					
					complete();
				});
				
				onTransport('Transport.Error', function (event) {
					fail('Error', event);
				});
				
				onTransport('Transport.Timeout', function (event) {
					fail('Timeout', event);
				});
				
				onTransport('Transport.Abort', function (event) {
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
			
			function executeOutbound () {
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
			
			api = {
				Transport: function (value) {
					if (active) return api;
					
					transport = value;
					
					return api;
				},
				Data: function (value) {
					if (active) return api;
					
					sourceSet = true;
					source = value;
					
					return api;
				},
				Encoder: function (value) {
					if (active) return api;
					
					encoder = value;
					
					return api;
				},
				ChunkSize: function (value) {
					if (active) return api;
					
					chunkSize = Math.max(1, Number(value) || 1);
					
					return api;
				},
				WindowSize: function (value) {
					if (active) return api;
					
					windowSize = Math.max(1, Number(value) || 1);
					
					return api;
				},
				Retry: function (value) {
					if (active) return api;
					
					retry = Math.max(1, Number(value) || 1);
					
					return api;
				},
				MaxRetries: function (value) {
					if (active) return api;
					
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
					if (active) return api;
					
					if (sourceSet) executeOutbound();
					else executeInbound();
					
					return api;
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
					
					clearListeners();
					
					outbound = null;
					transport = null;
					source = null;
					
					return api;
				}
			};
			
			events = NetworkEvents(api);
			
			return api;
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
				if (value instanceof ArrayBuffer) return value;
				
				if (ArrayBuffer.isView(value))
					return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
				
				throw new Error('Protocol must decode transfer chunk Data to binary');
			}
			
			function receivePacket (packet) {
				if (!packet || packet.Type !== 'Transfer') return;
				
				var transfer;
				var chunk;
				var keys;
				var chunks;
				var i;
				
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
					
					if (!Object.prototype.hasOwnProperty.call(transfer.Chunks, packet.Index)) {
						transfer.Chunks[packet.Index] = chunk;
					}
					
					send({Type: 'Transfer', Action: 'Ack', ID: packet.ID, Index: packet.Index});
					emit('Chunk', {ID: packet.ID, Index: packet.Index, Bytes: chunk.byteLength});
					
					return;
				}
				
				if (packet.Action === 'End') {
					keys = Object.keys(transfer.Chunks).map(Number).sort(function (a, b) {
						return a - b;
					});
					
					if (keys.length !== packet.Chunks) {
						emit('Error', {ID: packet.ID, Error: new Error('Transfer ended with missing chunks')});
						
						return;
					}
					
					chunks = [];
					i = 0;
					
					while (i < keys.length) {
						chunks.push(transfer.Chunks[keys[i]]);
						
						i++;
					}
					
					send({Type: 'Transfer', Action: 'Complete', ID: packet.ID});
					
					delete transfers[packet.ID];
					
					emit('Complete', {
						ID: packet.ID,
						Name: transfer.Name,
						Mime: transfer.Mime,
						Size: transfer.Size,
						Blob: new Blob(chunks, {type: transfer.Mime || 'application/octet-stream'})
					});
					
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
			
			events = NetworkEvents(api);
			
			bindTransport();
			
			return api;
		}
		
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
			var saturated = false;
			var drainTimer = null;
			var events;
			var api;
			
			function transport (type, data) {
				return events.Emit('Transport', type, data);
			}
			
			function protocolEvent (type, data, transportEvent) {
				return events.Emit('Protocol', type, data, transportEvent);
			}
			
			function decode (input, transportEvent) {
				if (!protocol || typeof protocol.Decode !== 'function') return;
				
				var decoded = protocol.Decode.call(api, input, api);
				if (!decoded || !decoded.Type) return;
				
				protocolEvent(decoded.Type, decoded.Data, transportEvent);
			}
			
			function encode (input) {
				if (!protocol || typeof protocol.Encode !== 'function') return input;
				
				return protocol.Encode.call(api, input, api);
			}
			
			function encodedBytes (value) {
				if (typeof value === 'string') return new Blob([value]).size;
				if (value instanceof ArrayBuffer) return value.byteLength;
				if (global.ArrayBuffer && global.ArrayBuffer.isView && global.ArrayBuffer.isView(value)) return value.byteLength;
				if (value instanceof Blob) return value.size;
				
				return 0;
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
					if (connecting) return api;
					
					connecting = true;
					saturated = false;
					
					stopDrainWatch();
					
					if (protocols === null || protocols === undefined) socket = new global.WebSocket(url);
					else socket = new global.WebSocket(url, protocols);
					
					socket.binaryType = binaryType;
					
					transport('BeforeConnect', {URL: url, Protocols: protocols, Socket: socket});
					
					socket.addEventListener('open', function (event) {
						transport('Open', {
							Event: event,
							Protocol: socket.protocol,
							Extensions: socket.extensions,
							Socket: socket
						});
					});
					
					socket.addEventListener('message', function (event) {
						var packet = {Data: event.data, Origin: event.origin, Event: event, Socket: socket};
						var dataEvent = transport('Data', packet);
						
						decode(event.data, dataEvent);
					});
					
					socket.addEventListener('error', function (event) {
						transport('Error', {Event: event, Socket: socket});
					});
					
					socket.addEventListener('close', function (event) {
						var closedSocket = socket;
						
						connecting = false;
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
					var bytes = encodedBytes(encoded);
					
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
					if (value === undefined)
						return drainInterval;
					
					drainInterval = Math.max(1, Number(value) || 1);
					
					return api;
				},
				Close: function (code, reason) {
					if (!socket) return api;
					
					if (socket.readyState === global.WebSocket.CONNECTING || socket.readyState === global.WebSocket.OPEN) {
						transport('BeforeClose', {Code: code, Reason: reason, Socket: socket});
						
						socket.close(code, reason);
					}
					
					return api;
				},
				Socket: function () {
					return socket;
				}
			};
			
			events = NetworkEvents(api);
			
			return api;
		}
		
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
			
			function transport (type, data) {
				return events.Emit('Transport', type, data);
			}
			
			function protocolEvent (type, data, transportEvent) {
				return events.Emit('Protocol', type, data, transportEvent);
			}
			
			function decode (input, transportEvent) {
				if (!protocol || typeof protocol.Decode !== 'function') return;
				
				var decoded = protocol.Decode.call(api, input, api);
				if (!decoded || !decoded.Type) return;
				
				protocolEvent(decoded.Type, decoded.Data, transportEvent);
			}
			
			function encode (input) {
				if (!protocol || typeof protocol.Encode !== 'function') return input;
				
				return protocol.Encode.call(api, input, api);
			}
			
			function current (currentGeneration, currentConnection) {
				return (active && currentGeneration === generation && connection === currentConnection);
			}
			
			function dataSize (data) {
				if (typeof data === 'string') {
					if (global.TextEncoder)
						return new global.TextEncoder().encode(data).byteLength;
					
					return data.length * 2;
				}
				
				if (data instanceof global.ArrayBuffer) return data.byteLength;
				if (global.ArrayBuffer && global.ArrayBuffer.isView && global.ArrayBuffer.isView(data)) return data.byteLength;
				if (global.Blob && data instanceof global.Blob) return data.size;
				
				return 0;
			}
			
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
			
			function attachChannel (value, currentGeneration, currentConnection) {
				var currentChannel = value;
				
				channel = currentChannel;
				currentChannel.bufferedAmountLowThreshold = bufferLowWaterMark;
				
				currentChannel.addEventListener('bufferedamountlow', function () {
					if (!current(currentGeneration, currentConnection) || channel !== currentChannel) return;
					
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
					if (!current(currentGeneration, currentConnection) || channel !== currentChannel) return;
					
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
					if (!current(currentGeneration, currentConnection) || channel !== currentChannel) return;
					
					var dataEvent = transport('Data', {
						Data: event.data,
						Event: event,
						Channel: currentChannel,
						Connection: currentConnection
					});
					
					decode(event.data, dataEvent);
				});
				
				currentChannel.addEventListener('error', function (event) {
					if (!current(currentGeneration, currentConnection) || channel !== currentChannel) return;
					
					transport('Error', {
						Event: event,
						Channel: currentChannel,
						Connection: currentConnection
					});
				});
				
				currentChannel.addEventListener('close', function (event) {
					if (currentGeneration !== generation || connection !== currentConnection) return;
					
					if (channel === currentChannel) channel = null;
					
					transport('ChannelClose', {
						Event: event,
						Label: currentChannel.label,
						ID: currentChannel.id,
						Channel: currentChannel,
						Connection: currentConnection
					});
				});
			}
			
			function createConnection () {
				if (active) return connection;
				active = true;
				
				var currentGeneration = ++generation;
				var currentConnection = new global.RTCPeerConnection(rtcConfig);
				
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
				
				currentConnection.addEventListener('connectionstatechange', function (event) {
					if (currentGeneration !== generation || connection !== currentConnection) return;
					
					transport('ConnectionState', {
						State: currentConnection.connectionState,
						Event: event,
						Connection: currentConnection
					});
				});
				
				currentConnection.addEventListener('iceconnectionstatechange', function (event) {
					if (currentGeneration !== generation || connection !== currentConnection) return;
					
					transport('ICEConnectionState', {
						State: currentConnection.iceConnectionState,
						Event: event,
						Connection: currentConnection
					});
				});
				
				currentConnection.addEventListener('signalingstatechange', function (event) {
					if (currentGeneration !== generation || connection !== currentConnection) return;
					
					transport('SignalingState', {
						State: currentConnection.signalingState,
						Event: event,
						Connection: currentConnection
					});
				});
				
				currentConnection.addEventListener('datachannel', function (event) {
					if (!current(currentGeneration, currentConnection)) return;
					
					attachChannel(event.channel, currentGeneration, currentConnection);
				});
				
				return currentConnection;
			}
			
			api = {
				Configuration: function (value) {
					if (active) return api;
					
					rtcConfig = value || {};
					
					return api;
				},
				
				ChannelName: function (value) {
					if (active) return api;
					
					channelName = value;
					
					return api;
				},
				
				Channel: function (value) {
					if (active) return api;
					
					channelConfig = value || {};
					
					return api;
				},
				
				Protocol: function (value) {
					if (active) return api;
					
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
					if (active) return api;
					
					var currentConnection = createConnection();
					
					if (initiator !== false) {
						attachChannel(
							currentConnection.createDataChannel(channelName, channelConfig),
							generation,
							currentConnection
						);
					}
					
					return api;
				},
				
				CreateOffer: function () {
					var currentConnection = createConnection();
					var currentGeneration = generation;
					
					if (!channel) {
						attachChannel(
							currentConnection.createDataChannel(channelName, channelConfig),
							currentGeneration,
							currentConnection
						);
					}
					
					return currentConnection.createOffer().then(function (description) {
						if (!current(currentGeneration, currentConnection)) return null;
						
						return currentConnection.setLocalDescription(description).then(function () {
							if (!current(currentGeneration, currentConnection)) return null;
							
							transport('LocalDescription', {
								Description: currentConnection.localDescription,
								Connection: currentConnection
							});
							
							return currentConnection.localDescription;
						});
					});
				},
				
				AcceptOffer: function (description) {
					var currentConnection = createConnection();
					var currentGeneration = generation;
					
					return currentConnection.setRemoteDescription(description).then(function () {
						if (!current(currentGeneration, currentConnection)) return null;
						
						transport('RemoteDescription', {
							Description: currentConnection.remoteDescription,
							Connection: currentConnection
						});
						
						return currentConnection.createAnswer();
					}).then(function (answer) {
						if (!answer || !current(currentGeneration, currentConnection)) return null;
						
						return currentConnection.setLocalDescription(answer).then(function () {
							if (!current(currentGeneration, currentConnection)) return null;
							
							transport('LocalDescription', {
								Description: currentConnection.localDescription,
								Connection: currentConnection
							});
							
							return currentConnection.localDescription;
						});
					});
				},
				
				AcceptAnswer: function (description) {
					var currentConnection = connection;
					var currentGeneration = generation;
					
					if (!currentConnection || !active)
						return global.Promise.reject(new Error('WebRTC connection is not active'));
					
					return currentConnection.setRemoteDescription(description).then(function () {
						if (!current(currentGeneration, currentConnection)) return null;
						
						transport('RemoteDescription', {
							Description: currentConnection.remoteDescription,
							Connection: currentConnection
						});
						
						return currentConnection.remoteDescription;
					});
				},
				
				AddICECandidate: function (candidate) {
					if (!connection || !active || !candidate) {
						return global.Promise.resolve();
					}
					
					return connection.addIceCandidate(candidate);
				},
				
				Send: function (data) {
					if (!channel || channel.readyState !== 'open') {
						return false;
					}
					
					var encoded = encode(data);
					var bytes = dataSize(encoded);
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
					if (value === undefined) return queueHighWaterMark;
					if (active) return api;
					
					queueHighWaterMark = Math.max(0, Number(value) || 0);
					
					return api;
				},
				
				QueueLowWaterMark: function (value) {
					if (value === undefined) return queueLowWaterMark;
					if (active) return api;
					
					queueLowWaterMark = Math.max(0, Number(value) || 0);
					
					return api;
				},
				
				BufferHighWaterMark: function (value) {
					if (value === undefined) return bufferHighWaterMark;
					if (active) return api;
					
					bufferHighWaterMark = Math.max(0, Number(value) || 0);
					
					return api;
				},
				
				BufferLowWaterMark: function (value) {
					if (value === undefined) return bufferLowWaterMark;
					if (active) return api;
					
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
			
			events = NetworkEvents(api);
			
			return api;
		}
		
		function NetworkMetrics (configuration) {
			var config = configuration || {};
			var transport = config.Transport || null;
			var events;
			var running = false;
			var measuring = false;
			var started = 0;
			var stopped = 0;
			var measureStarted = 0;
			var measureStopped = 0;
			var measureTXStart = 0;
			var measureRXStart = 0;
			var txMeasureStarted = 0;
			var txMeasureElapsed = 0;
			var txMeasureActive = false;
			var rxMeasureStarted = 0;
			var rxMeasureElapsed = 0;
			var rxMeasureActive = false;
			var tx = 0;
			var rx = 0;
			var txSpeedMin = 0;
			var txSpeedMax = 0;
			var rxSpeedMin = 0;
			var rxSpeedMax = 0;
			var requestLoaded = 0;
			var responseLoaded = 0;
			var bindings = [];
			var samples = [];
			var sampleWindow = typeof config.Window === 'number' && config.Window > 0 ? config.Window : 250;
			var sampleInterval = typeof config.Interval === 'number' && config.Interval > 0 ? config.Interval : 50;
			var timer = null;
			var encoder = global.TextEncoder ? new global.TextEncoder() : null;
			
			function now () {
				return global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
			}
			
			function bytes (value) {
				if (value === null || value === undefined) return 0;
				if (typeof value === 'string') return encoder ? encoder.encode(value).byteLength : new Blob([value]).size;
				if (value instanceof ArrayBuffer) return value.byteLength;
				if (global.ArrayBuffer && global.ArrayBuffer.isView && global.ArrayBuffer.isView(value)) return value.byteLength;
				if (value instanceof Blob) return value.size;
				
				return 0;
			}
			
			function elapsed () {
				if (!started) return 0;
				
				var end = running ? now() : stopped;
				
				return Math.max(0, end - started);
			}
			
			function prune (time) {
				var threshold = time - sampleWindow;
				
				while (samples.length && samples[0].Time < threshold) samples.shift();
			}
			
			function clearRates (direction) {
				if (!direction) {
					samples = [];
					
					emit();
					
					return;
				}
				
				var i = 0;
				
				while (i < samples.length) {
					if (direction === 'TX') samples[i].TX = 0;
					if (direction === 'RX') samples[i].RX = 0;
					
					i++;
				}
				
				emit();
			}
			
			function addSample (txDelta, rxDelta) {
				if (!txDelta && !rxDelta) return;
				
				var time = now();
				
				samples.push({Time: time, TX: txDelta || 0, RX: rxDelta || 0});
				
				prune(time);
			}
			
			function beginDirection (direction, time) {
				if (!measuring) return;
				
				if (direction === 'TX' && !txMeasureActive) {
					txMeasureStarted = time;
					txMeasureActive = true;
				}
				
				if (direction === 'RX' && !rxMeasureActive) {
					rxMeasureStarted = time;
					rxMeasureActive = true;
				}
			}
			
			function endDirection (direction, time) {
				if (direction === 'TX' && txMeasureActive) {
					txMeasureElapsed += Math.max(sampleInterval, time - txMeasureStarted);
					txMeasureStarted = 0;
					txMeasureActive = false;
				}
				
				if (direction === 'RX' && rxMeasureActive) {
					rxMeasureElapsed += Math.max(sampleInterval, time - rxMeasureStarted);
					rxMeasureStarted = 0;
					rxMeasureActive = false;
				}
			}
			
			function directionElapsed (direction, time) {
				if (direction === 'TX')
					return txMeasureElapsed + (txMeasureActive ? Math.max(0, time - txMeasureStarted) : 0);
				
				if (direction === 'RX')
					return rxMeasureElapsed + (rxMeasureActive ? Math.max(0, time - rxMeasureStarted) : 0);
				
				return 0;
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
				var speed = live.TX;
				
				if (speed > 0) {
					if (txSpeedMin === 0 || speed < txSpeedMin) txSpeedMin = speed;
					if (speed > txSpeedMax) txSpeedMax = speed;
				}
				
				speed = live.RX;
				
				if (speed > 0) {
					if (rxSpeedMin === 0 || speed < rxSpeedMin) rxSpeedMin = speed;
					if (speed > rxSpeedMax) rxSpeedMax = speed;
				}
			}
			
			function snapshot () {
				var time = now();
				var totalElapsed = elapsed();
				var live = rates(time);
				var measureEnd = measuring ? time : measureStopped;
				var measureElapsed = measureStarted ? Math.max(0, measureEnd - measureStarted) : 0;
				var measureTX = measureStarted ? Math.max(0, tx - measureTXStart) : 0;
				var measureRX = measureStarted ? Math.max(0, rx - measureRXStart) : 0;
				var txElapsed = measureStarted ? directionElapsed('TX', time) : 0;
				var rxElapsed = measureStarted ? directionElapsed('RX', time) : 0;
				
				if (measureStarted && !measuring) live = {TX: 0, RX: 0};
				
				return {
					TX: {
						Bytes: tx,
						Speed: live.TX,
						SpeedAvg: txElapsed > 0 ? measureTX * 1000 / txElapsed : 0,
						SpeedMin: txSpeedMin,
						SpeedMax: txSpeedMax,
						MeasureElapsed: txElapsed,
						Active: txMeasureActive
					},
					RX: {
						Bytes: rx,
						Speed: live.RX,
						SpeedAvg: rxElapsed > 0 ? measureRX * 1000 / rxElapsed : 0,
						SpeedMin: rxSpeedMin,
						SpeedMax: rxSpeedMax,
						MeasureElapsed: rxElapsed,
						Active: rxMeasureActive
					},
					Total: tx + rx,
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
					
					recordExtrema(now());
					
					events.Emit('Metrics', 'Update', snapshot());
				}, sampleInterval);
			}
			
			function stopTimer () {
				if (timer === null) return;
				
				global.clearInterval(timer);
				timer = null;
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
					requestLoaded = 0;
					responseLoaded = 0;
				});
				bind('Transport.RequestProgress', function (event) {
					if (!running) return;
					
					var loaded = event.Data && typeof event.Data.loaded === 'number' ? event.Data.loaded : 0;
					var delta = Math.max(0, loaded - requestLoaded);
					
					requestLoaded = loaded;
					
					if (delta > 0)
						beginDirection('TX', now());
					
					tx += delta;
					
					addSample(delta, 0);
					recordExtrema(now());
					emit();
				});
				bind('Transport.ResponseProgress', function (event) {
					if (!running) return;
					
					var loaded = event.Data && typeof event.Data.loaded === 'number' ? event.Data.loaded : 0;
					var delta = Math.max(0, loaded - responseLoaded);
					
					responseLoaded = loaded;
					
					if (delta > 0)
						beginDirection('RX', now());
					
					rx += delta;
					
					addSample(0, delta);
					recordExtrema(now());
					emit();
				});
				bind('Transport.AfterRequest', function () {
					if (!running) return;
					
					endDirection('TX', now());
					clearRates('TX');
				});
				bind('Transport.AfterResponse', function () {
					if (!running) return;
					
					endDirection('RX', now());
					clearRates('RX');
				});
				bind('Transport.AfterSend', function (event) {
					if (!running) return;
					
					var delta = bytes(event && event.Data && Object.prototype.hasOwnProperty.call(event.Data, 'Data') ? event.Data.Data : event ? event.Data : null);
					if (delta > 0) beginDirection('TX', now());
					
					tx += delta;
					
					addSample(delta, 0);
					recordExtrema(now());
					emit();
				});
				bind('Transport.Data', function (event) {
					if (!running) return;
					
					var delta = bytes(event && event.Data && Object.prototype.hasOwnProperty.call(event.Data, 'Data') ? event.Data.Data : event ? event.Data : null);
					if (delta > 0) beginDirection('RX', now());
					
					rx += delta;
					
					addSample(0, delta);
					recordExtrema(now());
					emit();
				});
			}
			
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
					started = now();
					stopped = 0;
					samples = [];
					
					startTimer();
					
					events.Emit('Metrics', 'Start', snapshot());
					
					return api;
				},
				Stop: function () {
					if (!running) return api;
					
					if (measuring) api.End();
					
					stopped = now();
					running = false;
					
					stopTimer();
					
					events.Emit('Metrics', 'Stop', snapshot());
					
					return api;
				},
				Begin: function () {
					if (!running || measuring) return api;
					
					measuring = true;
					measureStarted = now();
					measureStopped = 0;
					measureTXStart = tx;
					measureRXStart = rx;
					txMeasureStarted = 0;
					txMeasureElapsed = 0;
					txMeasureActive = false;
					rxMeasureStarted = 0;
					rxMeasureElapsed = 0;
					rxMeasureActive = false;
					txSpeedMin = 0;
					txSpeedMax = 0;
					rxSpeedMin = 0;
					rxSpeedMax = 0;
					samples = [];
					events.Emit('Metrics', 'Begin', snapshot());
					
					return api;
				},
				End: function () {
					if (!running || !measuring) return api;
					
					measureStopped = now();
					
					endDirection('TX', measureStopped);
					endDirection('RX', measureStopped);
					
					measuring = false;
					samples = [];
					
					events.Emit('Metrics', 'End', snapshot());
					
					return api;
				},
				Active: function () {
					return measuring;
				},
				Reset: function () {
					tx = 0;
					rx = 0;
					requestLoaded = 0;
					responseLoaded = 0;
					measuring = false;
					measureStarted = 0;
					measureStopped = 0;
					measureTXStart = 0;
					measureRXStart = 0;
					txMeasureStarted = 0;
					txMeasureElapsed = 0;
					txMeasureActive = false;
					rxMeasureStarted = 0;
					rxMeasureElapsed = 0;
					rxMeasureActive = false;
					txSpeedMin = 0;
					txSpeedMax = 0;
					rxSpeedMin = 0;
					rxSpeedMax = 0;
					samples = [];
					started = running ? now() : 0;
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
			
			events = NetworkEvents(api);
			
			attach();
			
			return api;
		}
		
		var NetworkFactories = {
			XHR: NetworkXHR,
			WebSocket: NetworkWebSocket,
			SSE: NetworkSSE,
			LongPolling: NetworkLongPolling,
			Stream: NetworkStream,
			WebRTC: NetworkWebRTC,
			Transfer: NetworkTransfer,
			TransferReceiver: NetworkTransferReceiver,
			Metrics: NetworkMetrics
		};
		var NetworkOwners = new WeakMap();
		var NetworkContexts = {};
		
		function destroyNetworkResource (resource) {
			if (!resource) return;
			
			if (typeof resource.Destroy === 'function') {
				resource.Destroy();
				
				return;
			}
			
			if (typeof resource.Abort === 'function') resource.Abort();
			if (typeof resource.Close === 'function') resource.Close();
		}
		
		function registerNetworkResource (owner, resource) {
			if (!owner || !resource) return resource;
			
			var resources = NetworkOwners.get(owner);
			
			if (!resources) {
				resources = [];
				
				NetworkOwners.set(owner, resources);
			}
			
			resources.push(resource);
			
			return resource;
		}
		
		function destroyNetworkOwner (owner) {
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
			if (!value) return null;
			
			if (typeof value === 'string')
				return NetworkContext(value);
			
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
			if (!context) return false;
			
			name = context.__ElemenxNetworkContextName || null;
			if (name && resolving[name]) return false;
			
			if (typeof context.Configure === 'function') {
				result = context.Configure(resource, type);
				
				if (result === false) return false;
			}
			
			if (name) resolving[name] = true;
			
			dependencies = context.Contexts || [];
			
			if (!Array.isArray(dependencies)) dependencies = [dependencies];
			
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
					if (!Object.prototype.hasOwnProperty.call(listeners, key)) continue;
					
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
		
		function createNetworkFacade (owner, inheritedContext) {
			function create (type, configuration, localContext) {
				var resource = NetworkFactories[type](configuration);
				
				attachNetworkContext(resource, type);
				
				if (inheritedContext) resource.Context(inheritedContext);
				if (localContext && localContext !== inheritedContext) resource.Context(localContext);
				
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
				if (!context) return plain;
				
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
		
		var Elemenx = global.Elemenx;
		
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
			
			if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, 'Value')) return null;
			
			return parsed.Value;
		}
		
		function normalizeNamespace (value) {
			value = String(value || '');
			value = value.replace(/^\.+|\.+$/g, '');
			
			return value;
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
					if (name && name.indexOf(prefix) === 0) names.push(name);
					
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
					if (!name) return createWebStorage(storage, prefix);
					
					return createWebStorage(storage, prefix + name + '.');
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
			
			if (options.Path) output += '; Path=' + options.Path;
			if (options.Domain) output += '; Domain=' + options.Domain;
			if (options.MaxAge !== undefined && options.MaxAge !== null) output += '; Max-Age=' + options.MaxAge;
			if (options.Expires) output += '; Expires=' + (options.Expires instanceof Date ? options.Expires.toUTCString() : options.Expires);
			if (options.SameSite) output += '; SameSite=' + options.SameSite;
			if (options.Secure) output += '; Secure';
			
			return output;
		}
		
		function createCookieStorage (prefix) {
			prefix = prefix || '';
			
			function key (name) {
				return prefix + String(name);
			}
			
			function all () {
				var result = {};
				var parts = document.cookie ? document.cookie.split(';') : [];
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
					
					return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : null;
				},
				
				Set: function (name, value, options) {
					document.cookie = cookieString(key(name), value, options);
					
					return this;
				},
				
				Has: function (name) {
					var values = all();
					
					return Object.prototype.hasOwnProperty.call(values, key(name));
				},
				
				Remove: function (name, options) {
					options = options || {};
					
					var removeOptions = {};
					var optionName;
					
					for (optionName in options) {
						if (Object.prototype.hasOwnProperty.call(options, optionName)) {
							removeOptions[optionName] = options[optionName];
						}
					}
					
					removeOptions.MaxAge = 0;
					removeOptions.Expires = new Date(0);
					
					document.cookie = cookieString(key(name), '', removeOptions);
					
					return this;
				},
				
				Clear: function (options) {
					var values = all();
					var name;
					
					for (name in values) {
						if (!Object.prototype.hasOwnProperty.call(values, name)) continue;
						if (prefix && name.indexOf(prefix) !== 0) continue;
						
						this.Remove(prefix ? name.substring(prefix.length) : name, options);
					}
					
					return this;
				},
				
				Namespace: function (name) {
					name = normalizeNamespace(name);
					if (!name) return createCookieStorage(prefix);
					
					return createCookieStorage(prefix + name + '.');
				}
			};
		}
		
		function createStorageOperation (executor) {
			var listeners = {};
			var executed = false;
			var finished = false;
			
			function emit (name, data) {
				var copy = (listeners[name] || []).slice();
				var event = {
					Type: name,
					Data: data
				};
				var i = 0;
				
				while (i < copy.length) {
					copy[i](event);
					i++;
				}
			}
			
			var operation = {
				On: function (name, callback) {
					if (!listeners[name]) listeners[name] = [];
					
					listeners[name].push(callback);
					
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
		
		function createIndexedDB (name, definition) {
			definition = definition || {};
			
			var version = definition.Version || 1;
			var stores = definition.Stores || {};
			var database = null;
			var opening = false;
			var waiting = [];
			
			function failWaiting (error) {
				var copy = waiting.slice();
				
				waiting = [];
				opening = false;
				
				var i = 0;
				while (i < copy.length) {
					copy[i].Error(error);
					
					i++;
				}
			}
			
			function readyWaiting () {
				var copy = waiting.slice();
				
				waiting = [];
				opening = false;
				
				var i = 0;
				while (i < copy.length) {
					copy[i].Success(database);
					
					i++;
				}
			}
			
			function createIndexes (store, indexes) {
				indexes = indexes || {};
				
				var indexName;
				
				for (indexName in indexes) {
					if (!Object.prototype.hasOwnProperty.call(indexes, indexName)) continue;
					if (store.indexNames.contains(indexName)) continue;
					
					var options = indexes[indexName] || {};
					var nativeOptions = {};
					var keyPath = options.KeyPath !== undefined ? options.KeyPath : indexName;
					
					if (options.Unique) nativeOptions.unique = true;
					if (options.MultiEntry) nativeOptions.multiEntry = true;
					
					store.createIndex(indexName, keyPath, nativeOptions);
				}
			}
			
			function applySchema (db, transaction) {
				var storeName;
				
				for (storeName in stores) {
					if (!Object.prototype.hasOwnProperty.call(stores, storeName)) continue;
					
					var options = stores[storeName] || {};
					var store;
					
					if (!db.objectStoreNames.contains(storeName)) {
						var nativeOptions = {};
						
						if (options.KeyPath !== undefined && options.KeyPath !== null) nativeOptions.keyPath = options.KeyPath;
						if (options.AutoIncrement) nativeOptions.autoIncrement = true;
						
						store = db.createObjectStore(storeName, nativeOptions);
					}
					else {
						store = transaction.objectStore(storeName);
					}
					
					createIndexes(store, options.Indexes);
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
					
					applySchema(db, transaction);
					
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
						if (database === connection) database = null;
					};
					
					readyWaiting();
				};
				
				request.onerror = function () {
					failWaiting(request.error || new Error('IndexedDB open failed'));
				};
				
				request.onblocked = function () {
					failWaiting(new Error('IndexedDB open blocked'));
				};
			}
			
			function invalidateDatabase (db) {
				if (database !== db) return;
				
				try {
					db.close();
				}
				catch (closeError) { }
				
				database = null;
			}
			
			function recoverableConnectionError (error) {
				if (!error) return false;
				
				return error.name === 'InvalidStateError';
			}
			
			function storeOperation (storeName, mode, action) {
				return createStorageOperation(function (success, error) {
					var attempt = 0;
					
					function execute () {
						open(function (db) {
							var transaction;
							var store;
							var request;
							
							if (!db.objectStoreNames.contains(storeName)) {
								error(new Error('IndexedDB store not found: ' + storeName));
								
								return;
							}
							
							try {
								transaction = db.transaction([storeName], mode);
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
							
							store = transaction.objectStore(storeName);
							
							try {
								request = action(store);
							}
							catch (operationError) {
								error(operationError);
								
								return;
							}
							
							request.onsuccess = function () {
								success(request.result);
							};
							
							request.onerror = function () {
								error(request.error || transaction.error || new Error('IndexedDB operation failed'));
							};
						}, error);
					}
					
					execute();
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
			
			function createTransactionRequest (request) {
				var listeners = {};
				var settled = false;
				var succeeded = false;
				var result;
				
				function emit (name, data) {
					var copy = (listeners[name] || []).slice();
					var event = {
						Type: name,
						Data: data
					};
					var i = 0;
					
					while (i < copy.length) {
						copy[i](event);
						
						i++;
					}
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
						if (!listeners[name]) listeners[name] = [];
						
						listeners[name].push(callback);
						
						if (settled && name === 'Success' && succeeded) callback({Type: name, Data: result});
						if (settled && name === 'Error' && !succeeded) callback({Type: name, Data: request.error});
						
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
			
			function transactionOperation (storeNames, mode, callback) {
				return createStorageOperation(function (success, error) {
					var attempt = 0;
					
					function execute () {
						open(function (db) {
							var transaction;
							var failed = false;
							var api;
							
							try {
								transaction = db.transaction(storeNames, mode || 'readonly');
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
							
							api = {
								Store: function (storeName) {
									return createTransactionStore(transaction, String(storeName));
								},
								
								Abort: function () {
									transaction.abort();
								}
							};
							
							transaction.oncomplete = function () {
								if (!failed) success(true);
							};
							
							transaction.onerror = function () {
								if (failed) return;
								
								failed = true;
								
								error(transaction.error || new Error('IndexedDB transaction failed'));
							};
							
							transaction.onabort = function () {
								if (failed) return;
								
								failed = true;
								
								error(transaction.error || new Error('IndexedDB transaction aborted'));
							};
							
							try {
								callback(api);
							}
							catch (callbackError) {
								failed = true;
								
								transaction.abort();
								
								error(callbackError);
							}
						}, error);
					}
					
					execute();
				});
			}
			
			return {
				Store: function (storeName) {
					return createStore(String(storeName));
				},
				
				Transaction: function (storeNames, mode, callback) {
					if (typeof mode === 'function') {
						callback = mode;
						mode = 'readonly';
					}
					
					if (!(storeNames instanceof Array)) storeNames = [storeNames];
					
					return transactionOperation(storeNames, mode, callback);
				},
				
				Close: function () {
					if (database) database.close();
					
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
							error(request.error || new Error('IndexedDB delete failed'));
						};
						
						request.onblocked = function () {
							error(new Error('IndexedDB delete blocked'));
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
				return Object.prototype.hasOwnProperty.call(contextRegistry, name) ? contextRegistry[name] : null;
			
			throw new Error('Elemenx.Storage.Context expects (name) or (name, definition)');
		}
		
		function copyObject (source) {
			var output = {};
			var key;
			
			source = source || {};
			
			for (key in source) {
				if (Object.prototype.hasOwnProperty.call(source, key)) {
					output[key] = source[key];
				}
			}
			
			return output;
		}
		
		function mergeIndexedDBDefinition (target, source) {
			if (!source) return target;
			
			if (source.Name !== undefined) target.Name = source.Name;
			if (source.Version !== undefined) target.Version = source.Version;
			if (source.Upgrade !== undefined) target.Upgrade = source.Upgrade;
			
			target.Stores = target.Stores || {};
			
			var storeName;
			var indexName;
			
			for (storeName in source.Stores) {
				if (!Object.prototype.hasOwnProperty.call(source.Stores, storeName)) continue;
				
				var sourceStore = source.Stores[storeName] || {};
				var targetStore = target.Stores[storeName] || {};
				var mergedStore = copyObject(targetStore);
				
				if (sourceStore.KeyPath !== undefined) mergedStore.KeyPath = sourceStore.KeyPath;
				if (sourceStore.AutoIncrement !== undefined) mergedStore.AutoIncrement = sourceStore.AutoIncrement;
				mergedStore.Indexes = copyObject(targetStore.Indexes);
				
				for (indexName in sourceStore.Indexes) {
					if (!Object.prototype.hasOwnProperty.call(sourceStore.Indexes, indexName)) continue;
					
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
					throw new Error('Unknown Elemenx Storage Context: ' + context);
			}
			else {
				definition = context;
			}
			
			if (stack.indexOf(definition) !== -1)
				throw new Error('Circular Elemenx Storage Context dependency');
			
			stack.push(definition);
			
			dependencies = definition.Contexts || [];
			
			while (i < dependencies.length) {
				resolveContext(dependencies[i], result, stack);
				
				i++;
			}
			
			stack.pop();
			
			if (definition.Namespace) result.Namespaces.push(normalizeNamespace(definition.Namespace));
			if (definition.IndexedDB) mergeIndexedDBDefinition(result.IndexedDB, definition.IndexedDB);
		}
		
		function createStorageFacade (context) {
			var resolved = {
				Namespaces: [],
				IndexedDB: {Stores: {}}
			};
			var cookie = createCookieStorage('');
			var session = createWebStorage(global.sessionStorage, '');
			var local = createWebStorage(global.localStorage, '');
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
						throw new Error('Storage Context does not define IndexedDB.Name');
					
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
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		var contexts = {};
		var owners = new WeakMap();
		var entities = new WeakMap();
		var globalSequence = 0;
		
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
						if (bridgeCopy[i] !== origin && bridgeCopy[i].Transferable !== false) remoteCount++;
						
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
				if (endpoint.start) endpoint.start();
				
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
			
			while (i < dependencies.length) {
				resolveContexts(dependencies[i], output, stack);
				
				i++;
			}
			
			output.push(definition);
			
			if (typeof input === 'string') delete stack[input];
		}
		
		function MessagingSocket (context, owner) {
			var id = null;
			var subscriptions = {};
			var automatic = {};
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
					
					if (ownCallbacks.indexOf(channel) === -1) ownCallbacks.push(channel);
					
					return api;
				}
				
				ensure();
				channel = String(channel);
				
				if (!subscriptions[channel]) subscriptions[channel] = [];
				
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
				
				if (!list) return api;
				
				if (!callback) {
					delete subscriptions[channel];
					
					return api;
				}
				
				i = list.indexOf(callback);
				
				if (i !== -1) list.splice(i, 1);
				if (!list.length) delete subscriptions[channel];
				
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
					if (Object.prototype.hasOwnProperty.call(automatic, channel)) {
						add(channel);
					}
				}
				
				for (channel in subscriptions) {
					if (Object.prototype.hasOwnProperty.call(subscriptions, channel)) {
						add(channel);
					}
				}
				
				return result;
			}
			
			function Deliver (source, channel, data) {
				var callbacks = [];
				var explicit = subscriptions[channel];
				var event;
				var i = 0;
				var own = channel === OwnChannel();
				var member = own || channel === entityChannel || channel === entityInstanceChannel || automatic[channel] || explicit;
				
				if (destroyed || !member) return;
				
				if (own) callbacks = callbacks.concat(ownCallbacks);
				if (explicit) callbacks = callbacks.concat(explicit);
				
				if (!callbacks.length) return;
				
				event = {
					Channel: channel,
					Source: source,
					Data: data
				};
				
				while (i < callbacks.length) {
					callbacks[i](event);
					
					i++;
				}
			}
			
			function Destroy () {
				if (destroyed) return;
				destroyed = true;
				
				subscriptions = {};
				automatic = {};
				ownCallbacks = [];
				messagingFabric.Remove(api);
				
				if (owner) {
					var list = owners.get(owner);
					
					if (list) {
						var i = list.indexOf(api);
						if (i !== -1) list.splice(i, 1);
					}
				}
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
					if (definition.ID !== undefined) ID(definition.ID);
					
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
				Deliver: Deliver
			};
			
			messagingFabric.Add(api);
			
			if (owner) {
				if (!owners.has(owner))
					owners.set(owner, []);
				
				owners.get(owner).push(api);
			}
			
			if (context)
				applyContext(context);
			
			return api;
		}
		
		function Messaging (context) {
			return MessagingSocket(context, null);
		}
		
		Messaging.Context = Context;
		Elemenx.Messaging = Messaging;
		
		Runtime.SetMessagingEntity = function (owner, name, index) {
			entities.set(owner, {
				Name: String(name || 'Entity'),
				Index: index || 0
			});
		};
		
		Runtime.MessagingFor = function (owner) {
			return function (context) {
				return MessagingSocket(context, owner);
			};
		};
		
		Runtime.AttachMessagingBridge = function (endpoint, options) {
			return messagingFabric.Bridge(endpoint, options);
		};
		
		if (Runtime.HasDOM && typeof global.BroadcastChannel === 'function') {
			Runtime.MessagingBroadcastChannel = new global.BroadcastChannel('Elemenx:Messaging');
			Runtime.MessagingBroadcastBridge = Runtime.AttachMessagingBridge(Runtime.MessagingBroadcastChannel, {
				Transferable: false
			});
		}
		
		Runtime.DestroyMessagingOwner = function (owner) {
			var list = owners.get(owner);
			if (!list) return;
			
			while (list.length)
				list[0].Destroy();
			
			owners.delete(owner);
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		var definitions = {};
		var owners = new WeakMap();
		var handles = [];
		var manualStops = new WeakMap();
		
		function absoluteURL (url) {
			if (!Runtime.HasDOM) return String(url);
			
			return new URL(String(url), global.location.href).href;
		}
		
		function normalizeDefinition (name, definition) {
			var result = {};
			var key;
			
			definition = definition || {};
			
			for (key in definition) {
				if (Object.prototype.hasOwnProperty.call(definition, key)) {
					result[key] = definition[key];
				}
			}
			
			if (result.StartMode === undefined) result.StartMode = 'auto';
			if (result.StartMode !== 'auto' && result.StartMode !== 'manual' && result.StartMode !== 'lazy') {
				throw new Error('Elemenx WebWorker StartMode must be auto, manual or lazy: ' + name);
			}
			
			if (result.Channel === undefined) result.Channel = name;
			
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
			var manualStopped = false;
			var listeners = {};
			var api;
			
			function Emit (event, data) {
				var list = listeners[event];
				if (!list) return;
				
				var copy = list.slice();
				var i = 0;
				
				while (i < copy.length) {
					copy[i]({
						Type: event,
						Worker: api,
						State: state,
						Data: data
					});
					
					i++;
				}
			}
			
			function On (event, callback) {
				if (typeof callback !== 'function')
					throw new Error('Elemenx WebWorker.On callback must be a function');
				
				if (!listeners[event])
					listeners[event] = [];
				
				listeners[event].push(callback);
				
				return api;
			}
			
			function Off (event, callback) {
				var list = listeners[event];
				if (!list) return api;
				
				var index = list.indexOf(callback);
				if (index !== -1)
					list.splice(index, 1);
				
				return api;
			}
			
			function State () {
				return state;
			}
			
			function Native () {
				return worker;
			}
			
			function cleanupNative () {
				if (bridge) bridge.Destroy();
				if (worker) worker.terminate();
				if (blobURL) URL.revokeObjectURL(blobURL);
				
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
				
				manualStopped = false;
				manualStops.set(api, false);
				state = 'Starting';
				
				Emit('Starting');
				
				var frameworkURL = definition.Framework || Runtime.ScriptURL;
				if (!frameworkURL)
					throw new Error('Elemenx runtime script URL is unknown');
				
				frameworkURL = absoluteURL(frameworkURL);
				var scriptURL = absoluteURL(definition.Script);
				var source = 'importScripts(' + JSON.stringify(frameworkURL) + ');\n'
					+ 'self.ElemenxWorkerName = ' + JSON.stringify(name) + ';\n'
					+ 'self.ElemenxWorkerChannel = ' + JSON.stringify(String(definition.Channel)) + ';\n'
					+ 'importScripts(' + JSON.stringify(scriptURL) + ');\n'
					+ 'postMessage({ ElemenxWorker: true, Type: \'Ready\' });\n';
				
				var blob = new Blob([source], {type: 'application/javascript'});
				blobURL = URL.createObjectURL(blob);
				
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
					
					worker.addEventListener('error', function (event) {
						if (destroyed) return;
						
						state = 'Error';
						
						Emit('Error', event);
					});
					
					worker.addEventListener('messageerror', function (event) {
						if (destroyed) return;
						
						state = 'Error';
						
						Emit('Error', event);
					});
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
					manualStopped = true;
					
					manualStops.set(api, true);
					
					return api;
				}
				
				manualStopped = true;
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
				
				listeners = {};
				
				var index = handles.indexOf(api);
				if (index !== -1) handles.splice(index, 1);
				
				if (owner) {
					var list = owners.get(owner);
					
					if (list) {
						index = list.indexOf(api);
						if (index !== -1) list.splice(index, 1);
					}
				}
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
			
			if (owner) {
				if (!owners.has(owner))
					owners.set(owner, []);
				
				owners.get(owner).push(api);
			}
			
			if (definition.StartMode === 'auto') Start();
			
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
				var handlers = [];
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
						var wrapper;
						
						if (event !== 'message') return;
						
						wrapper = function (messageEvent) {
							var packet = messageEvent.data;
							
							if (
								packet &&
								packet.ElemenxMessaging === true &&
								(packet.ElemenxMessagingProtocol === undefined || packet.ElemenxMessagingProtocol === 1) &&
								messageEvent.source
							) {
								routes[String(packet.Source)] = messageEvent.source.id;
							}
							
							callback(messageEvent);
						};
						
						handlers.push({Callback: callback, Wrapper: wrapper});
						
						global.addEventListener('message', wrapper);
					},
					removeEventListener: function (event, callback) {
						var i = handlers.length - 1;
						
						if (event !== 'message') return;
						
						while (i >= 0) {
							if (handlers[i].Callback === callback) {
								global.removeEventListener('message', handlers[i].Wrapper);
								
								handlers.splice(i, 1);
							}
							
							i--;
						}
					}
				};
				
				return Runtime.AttachMessagingBridge(endpoint);
			}
			
			return Runtime.AttachMessagingBridge(global);
		}
		
		function DestroyOwner (owner) {
			var list = owners.get(owner);
			if (!list) return;
			
			while (list.length)
				list[0].Destroy();
			
			owners.delete(owner);
		}
		
		function PrepareMessagingSend (channel) {
			var copy = handles.slice();
			var handle;
			var i = 0;
			
			while (i < copy.length) {
				handle = copy[i];
				
				if (
					handle.StartMode() === 'lazy' &&
					handle.State() === 'Stopped' &&
					handle.Channel() === String(channel) &&
					manualStops.get(handle) !== true
				) {
					handle.Start();
				}
				
				i++;
			}
		}
		
		Elemenx.WebWorker = Web;
		
		Runtime.WebWorkerFor = function (owner) {
			return function (name, definition) {
				if (arguments.length === 2) {
					definition = register(name, definition);
					
					return createHandle(name, definition, owner);
				}
				
				if (Runtime.ApplicationWebWorkers) {
					var shared = Runtime.ApplicationWebWorkers[name];
					if (shared) return shared;
				}
				
				definition = definitions[name];
				if (!definition)
					throw new Error('Elemenx WebWorker not found: ' + name);
				
				return createHandle(name, definition, owner);
			};
		};
		
		Runtime.PrepareMessagingSend = PrepareMessagingSend;
		Runtime.DestroyWebWorkerOwner = DestroyOwner;
		
		Runtime.AttachWorkerMessaging = Attach;
		
		if (!Runtime.HasDOM && !global.clients) Attach();
		
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		var definitions = {};
		var handles = [];
		
		function absoluteURL (url) {
			return new URL(String(url), global.location.href).href;
		}
		
		function normalizeDefinition (name, definition) {
			var result = {};
			var key;
			
			definition = definition || {};
			
			for (key in definition) {
				if (Object.prototype.hasOwnProperty.call(definition, key)) {
					result[key] = definition[key];
				}
			}
			
			if (!result.Script)
				throw new Error('Elemenx ServiceWorker Script is required: ' + name);
			
			if (result.Scope === undefined) result.Scope = './';
			if (result.Channel === undefined) result.Channel = name;
			
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
					var wrapper;
					
					if (event !== 'message') return;
					
					wrapper = function (messageEvent) {
						if (messageEvent.source !== serviceWorker) return;
						
						callback(messageEvent);
					};
					
					handlers.push({Callback: callback, Wrapper: wrapper});
					
					global.navigator.serviceWorker.addEventListener('message', wrapper);
				},
				removeEventListener: function (event, callback) {
					var i = handlers.length - 1;
					
					if (event !== 'message') return;
					
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
		
		function createHandle (name, definition) {
			var registration = null;
			var active = null;
			var bridge = null;
			var state = 'Unregistered';
			var destroyed = false;
			var listeners = {};
			var api;
			
			function Emit (event, data) {
				var list = listeners[event];
				if (!list) return;
				
				var copy = list.slice();
				var i = 0;
				
				while (i < copy.length) {
					copy[i]({Type: event, Worker: api, State: state, Data: data});
					
					i++;
				}
			}
			
			function setState (value, data) {
				if (state === value) return;
				
				state = value;
				
				Emit(value, data);
			}
			
			function On (event, callback) {
				if (typeof callback !== 'function')
					throw new Error('Elemenx ServiceWorker.On callback must be a function');
				
				if (!listeners[event])
					listeners[event] = [];
				
				listeners[event].push(callback);
				
				return api;
			}
			
			function Off (event, callback) {
				var list = listeners[event];
				if (!list) return api;
				
				var index = list.indexOf(callback);
				if (index !== -1) list.splice(index, 1);
				
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
					if (registration && registration.active) attachActive(registration.active);
				});
			}
			
			function Register () {
				var frameworkURL;
				var scriptURL;
				var serviceURL;
				var separator;
				
				if (destroyed)
					throw new Error('Elemenx ServiceWorker handle is destroyed: ' + name);
				
				if (!Runtime.HasDOM || !global.navigator.serviceWorker)
					throw new Error('Elemenx ServiceWorker is not available in this runtime');
				
				if (state !== 'Unregistered' && state !== 'Error') return api;
				
				frameworkURL = absoluteURL(definition.Framework || Runtime.ScriptURL);
				scriptURL = absoluteURL(definition.Script);
				serviceURL = frameworkURL;
				separator = serviceURL.indexOf('?') === -1 ? '?' : '&';
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
			
			function registrationForScope () {
				return global.navigator.serviceWorker.getRegistration(absoluteURL(definition.Scope));
			}
			
			function Unregister () {
				if (destroyed) return api;
				
				var current = registration;
				
				setState('Unregistering');
				
				if (!current) {
					registrationForScope()
						.then(function (value) {
							if (destroyed) return;
							
							if (!value) {
								setState('Unregistered', {Result: false, Registered: false});
								
								return;
							}
							
							registration = value;
							
							Unregister();
						})
						.catch(function (error) {
							if (destroyed) return;
							
							setState('Error', error);
						});
					
					return api;
				}
				
				current
					.unregister()
					.then(function (result) {
						if (destroyed) return;
						
						registrationForScope()
							.then(function (value) {
								if (destroyed) return;
								
								registration = value || null;
								
								if (value) {
									observeRegistration(value);
									
									setState('Active', {Result: result, Registered: true});
									
									return;
								}
								
								setState('Unregistered', {Result: result, Registered: false});
							})
							.catch(function (error) {
								if (destroyed) return;
								
								setState('Error', error);
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
				
				registrationForScope()
					.then(function (value) {
						callback(!!value);
					})
					.catch(function () {
						callback(false);
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
				if (bridge) bridge.Destroy();
				
				bridge = null;
				active = null;
				destroyed = true;
				listeners = {};
				
				var index = handles.indexOf(api);
				if (index !== -1)
					handles.splice(index, 1);
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
		
		Elemenx.ServiceWorker = Service;
		
		Runtime.ServiceWorkerFor = function () {
			return Service;
		};
		
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
	/* Application */
	(function (global) {
		'use strict';
		
		var Elemenx = global.Elemenx;
		var applications = {};
		
		Runtime.ApplicationWebWorkers = Runtime.ApplicationWebWorkers || {};
		
		function mountElement (value) {
			if (!Runtime.HasDOM) return null;
			if (!value) return global.document.body;
			if (typeof value === 'string') return global.document.querySelector(value);
			
			return value;
		}
		
		function createApplication (name, definition) {
			var destroyed = false;
			var root = null;
			var router = null;
			var webWorkers = {};
			var serviceWorkers = {};
			var api = {};
			
			definition = definition || {};
			
			api.Title = Elemenx.Title;
			
			if (definition.Title !== undefined)
				api.Title(definition.Title);
			
			api.Name = function () {
				return name;
			};
			
			api.Root = function () {
				return definition.Root || null;
			};
			
			api.Application = function () {
				return api;
			};
			
			api.Network = function (context, value) {
				if (arguments.length === 2) {
					Elemenx.Network.Context(context, value);
					
					return api;
				}
				
				return Runtime.NetworkFor ? Runtime.NetworkFor(api)(context) : Elemenx.Network;
			};
			
			api.Storage = function (context, value) {
				if (arguments.length === 2) {
					Elemenx.Storage.Context(context, value);
					
					return api;
				}
				
				return Elemenx.Storage(context);
			};
			
			api.Messaging = function (context, value) {
				if (arguments.length === 2) {
					Elemenx.Messaging.Context(context, value);
					
					return api;
				}
				
				return Runtime.MessagingFor ? Runtime.MessagingFor(api)(context) : Elemenx.Messaging(context);
			};
			
			api.WebWorker = function (workerName, value) {
				if (arguments.length === 1)
					return webWorkers[workerName] || null;
				
				var handle = Runtime.WebWorkerFor(api)(workerName, value);
				
				webWorkers[workerName] = handle;
				Runtime.ApplicationWebWorkers[workerName] = handle;
				
				return handle;
			};
			
			api.ServiceWorker = function (workerName, value) {
				var handle;
				
				if (arguments.length === 1) {
					if (serviceWorkers[workerName])
						return serviceWorkers[workerName];
					
					handle = Elemenx.ServiceWorker(workerName);
					serviceWorkers[workerName] = handle;
					
					return handle;
				}
				
				handle = Elemenx.ServiceWorker(workerName, value);
				serviceWorkers[workerName] = handle;
				
				return handle;
			};
			
			api.Service = function (serviceName, value) {
				if (arguments.length === 2) {
					Runtime.RegisterServiceDefinition(serviceName, value);
					
					return api;
				}
				
				return Runtime.ServiceForApplication(api, serviceName);
			};
			
			api.Reload = function (type, entityName, callback) {
				if (!Runtime.Discovery)
					throw new Error('Elemenx Discovery is not available');
				
				if (type !== 'Component' && type !== 'Service')
					throw new Error('Elemenx Reload expects Component or Service');
				
				if (type === 'Component' && Runtime.BeginComponentReload) {
					Runtime.BeginComponentReload(entityName);
				}
				
				return Runtime.Discovery.Reload(api, type, entityName, function (error) {
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
			};
			
			api.Component = function () {
				return root;
			};
			
			api.Router = function () {
				return router;
			};
			
			api.Destroy = function () {
				if (destroyed) return;
				destroyed = true;
				
				if (router && router.Destroy) router.Destroy();
				router = null;
				
				if (root && root.Destroy) root.Destroy();
				root = null;
				
				var workerName;
				for (workerName in webWorkers) {
					if (!Object.prototype.hasOwnProperty.call(webWorkers, workerName)) continue;
					if (Runtime.ApplicationWebWorkers[workerName] === webWorkers[workerName]) {
						delete Runtime.ApplicationWebWorkers[workerName];
					}
				}
				
				if (Runtime.DestroyNetworkOwner) Runtime.DestroyNetworkOwner(api);
				if (Runtime.DestroyMessagingOwner) Runtime.DestroyMessagingOwner(api);
				if (Runtime.DestroyWebWorkerOwner) Runtime.DestroyWebWorkerOwner(api);
				
				for (workerName in serviceWorkers) {
					if (!Object.prototype.hasOwnProperty.call(serviceWorkers, workerName)) continue;
					if (serviceWorkers[workerName] && serviceWorkers[workerName].Destroy) {
						serviceWorkers[workerName].Destroy();
					}
				}
			};
			
			if (typeof definition.Bootstrap === 'function') {
				definition.Bootstrap.call(api);
			}
			
			function applicationStatus (source) {
				var mount = mountElement(definition.Mount);
				if (!mount) return;
				
				var template;
				var fragment;
				
				while (mount.firstChild)
					mount.removeChild(mount.firstChild);
				
				if (!source) return;
				
				if (typeof source === 'string' && source.charAt(0) === '#') {
					template = document.querySelector(source);
					
					if (template && template.tagName === 'TEMPLATE') {
						fragment = template.content.cloneNode(true);
						
						mount.appendChild(fragment);
						
						return;
					}
				}
				
				mount.innerHTML = String(source);
			}
			
			function startRouter () {
				if (destroyed || router || !definition.Router || !root) return;
				
				var routerDefinition = {};
				var key;
				
				for (key in definition.Router) {
					if (!Object.prototype.hasOwnProperty.call(definition.Router, key)) continue;
					if (key === 'Root') continue;
					
					routerDefinition[key] = definition.Router[key];
				}
				
				routerDefinition.Root = root;
				router = Elemenx.Router(routerDefinition);
				router.Start();
			}
			
			function applicationLifecycle (method, error) {
				if (method === 'ElemenxOnComponentReady') startRouter();
				if (typeof api[method] !== 'function') return;
				
				api[method].call(api, {
					Name: definition.Component || null,
					Element: mountElement(definition.Mount),
					Error: error || null
				});
			}
			
			function createRoot () {
				if (destroyed || !definition.Component || root) return;
				
				var factory = Elemenx.Component(definition.Component);
				var mount = mountElement(definition.Mount);
				
				if (!factory)
					throw new Error('Elemenx Application component not found: ' + definition.Component);
				
				if (!mount)
					throw new Error('Elemenx Application mount not found: ' + definition.Mount);
				
				var options = {
					Application: api,
					AsyncLifecycle: {
						Owner: api,
						Name: definition.Component,
						Pending: definition.Pending || null,
						Error: definition.Error || null
					}
				};
				
				root = factory(definition.State || {}, null, options);
				
				mount.appendChild(root.Element());
				
				if (!root._Component || root._Component())
					startRouter();
			}
			
			function startRoot () {
				if (destroyed || !definition.Component || root) return;
				
				if (!definition.Root || !Runtime.Discovery) {
					createRoot();
					
					return;
				}
				
				applicationStatus(definition.Pending || null);
				applicationLifecycle('ElemenxOnComponentPending', null);
				
				var discoveryRoot = definition.Root;
				
				if (definition.ElemenxDefinitionURL && !(/^(?:[a-z]+:)?\/\//i.test(discoveryRoot)) && discoveryRoot.charAt(0) !== '/') {
					discoveryRoot = definition.ElemenxDefinitionURL.substring(0, definition.ElemenxDefinitionURL.lastIndexOf('/') + 1) + discoveryRoot.replace(/^\.\//, '');
				}
				
				Runtime.Discovery.Build(api, discoveryRoot, function (error) {
					if (destroyed) return;
					
					if (error) {
						applicationStatus(definition.Error || null);
						applicationLifecycle('ElemenxOnComponentError', error);
						
						return;
					}
					
					Runtime.Discovery.LoadServices(api, function (serviceError) {
						if (destroyed) return;
						
						if (serviceError) {
							applicationStatus(definition.Error || null);
							applicationLifecycle('ElemenxOnComponentError', serviceError);
							
							return;
						}
						
						createRoot();
					});
				});
			}
			
			api.ElemenxOnComponentPending = definition.ElemenxOnComponentPending || null;
			api.ElemenxOnComponentReady = function (args) {
				startRouter();
				
				if (typeof definition.ElemenxOnComponentReady === 'function')
					definition.ElemenxOnComponentReady.call(api, args);
			};
			api.ElemenxOnComponentError = definition.ElemenxOnComponentError || null;
			
			if (Runtime.HasDOM && global.document.readyState === 'loading') {
				global.document.addEventListener('DOMContentLoaded', startRoot, {once: true});
			}
			else {
				startRoot();
			}
			
			return api;
		}
		
		Elemenx.Application = function (name, definition) {
			if (arguments.length === 1) return applications[name] || null;
			
			if (arguments.length !== 2 || typeof name !== 'string')
				throw new Error('Elemenx.Application expects (name) or (name, definition)');
			
			if (applications[name])
				throw new Error('Elemenx Application already exists: ' + name);
			
			if (definition && global.document && global.document.currentScript && !definition.ElemenxDefinitionURL)
				definition.ElemenxDefinitionURL = global.document.currentScript.src.split('?')[0].split('#')[0];
			
			applications[name] = createApplication(name, definition);
			
			return applications[name];
		};
	})(typeof globalThis !== 'undefined' ? globalThis : self);
	
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