/*
 * SceneScreens: the screens of a scene, each an object of kind screen (the trait Screen): a pane of Width by Height metres
 * (Yaw, Pitch in degrees, Lift over the ground or Z, as a mirror stands) that shows a picture, Bright (1) as bright as it
 * glows. What it shows is the first of its sources given:
 * - Camera: the ID of a camera of the scene (SceneCamera): what it sees, drawn as the mirrors are, the nearest screens of
 *   cameras first (none at low, one at medium, two at high, four at ultra), each made again every Every frames (2), its
 *   picture Pixels [width, height] (by its pane, 512 wide);
 * - Image: the URL of a picture;
 * - Video: the URL of a video, played muted, round and round;
 * - Canvas: a canvas of the page (a selector, or the name of a data-screen of the slot screens) as it is drawn, every Every
 *   seconds (0: each frame);
 * - Element: an element of the page (a selector, or a data-screen of the slot screens, laid out out of sight) as a picture,
 *   drawn again when it changes, every Every seconds at most (0.15), Pixels [width, height] (its own size). With Interactive
 *   (true) the pointer works on it as on the element: a press, a move, a release and a click go to what lies under the pointer
 *   in it, the wheel scrolls it, a field pressed takes the keys. What :hover would show of it does not show.
 * ScreenAt(clientX, clientY) tells the screen under a point of the page: {ID, U, V (0 to 1, from its left and its top)} or null.
 */
Elemenx.Trait('SceneScreens', {
	ScreensStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var renderer = engine.Renderer;
		var math = this.$Service('Math');
		var vectors = math.Vectors;
		var state = {Images: {}, Videos: {}, Canvases: {}, Cameras: {}, Tick: 0, Press: null, Over: null};

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function settingsOf (object) {
			return Object.assign({}, object.Traits && object.Traits.Screen || {}, pick(object.Values));
		}

		/* What an object gives of its own over the defaults of its trait (the keys of a screen). */
		function pick (values) {
			var made = {};

			['Width', 'Height', 'Yaw', 'Pitch', 'Lift', 'Camera', 'Image', 'Video', 'Canvas', 'Element', 'Pixels', 'Every', 'Bright', 'Interactive'].forEach(function (key) {
				if (values && values[key] !== undefined)
					made[key] = values[key];
			});

			return made;
		}

		function screens () {
			return (scene.Active || []).filter(function (object) {
				return object.Traits && object.Traits.Screen;
			});
		}

		/* The size of a picture of a screen: Pixels, or its pane 512 wide. */
		function pixelsOf (settings) {
			var given = settings.Pixels;
			if (Array.isArray(given) && given.length === 2)
				return [Math.max(8, Math.round(given[0])), Math.max(8, Math.round(given[1]))];

			return [512, Math.max(8, Math.round(512 * number(settings.Height, 0.9) / Math.max(0.01, number(settings.Width, 1.6))))];
		}

		function image (url) {
			var kept = state.Images[url];
			var picture;

			if (kept)
				return kept.Texture ? {Texture: kept.Texture} : null;

			kept = state.Images[url] = {Texture: null};

			if (typeof Image === 'undefined') return null;

			picture = new Image();
			picture.crossOrigin = 'anonymous';

			picture.onload = function () {
				kept.Texture = renderer.Texture(picture, {Mipmaps: true});
			};

			picture.src = url;

			return null;
		}

		function video (url) {
			var kept = state.Videos[url];
			var element;

			if (!kept) {
				if (typeof document === 'undefined') return null;

				element = document.createElement('video');
				element.crossOrigin = 'anonymous';
				element.muted = true;
				element.loop = true;
				element.playsInline = true;
				element.src = url;

				kept = state.Videos[url] = {Video: element, Texture: null, Time: -1};

				var played = element.play();
				if (played && played.catch)
					played.catch(function () {});
			}

			element = kept.Video;

			if (element.readyState < 2)
				return kept.Texture ? {Texture: kept.Texture} : null;

			if (!kept.Texture) kept.Texture = renderer.Texture(element, {});
			else if (element.currentTime !== kept.Time) kept.Texture.Update(element);

			kept.Time = element.currentTime;

			return {Texture: kept.Texture};
		}

		function canvasPicture (key, source, every) {
			var element = engine.ScreenElement(source);
			var kept = state.Canvases[key] = state.Canvases[key] || {Texture: null, At: -Infinity};
			var moment = typeof performance !== 'undefined' ? performance.now() : Date.now();

			if (!element || !element.width || !element.height)
				return kept.Texture ? {Texture: kept.Texture} : null;

			if (!kept.Texture) {
				kept.Texture = renderer.Texture(element, {});
				kept.At = moment;
			}
			else if (moment - kept.At >= every * 1000) {
				kept.Texture.Update(element);

				kept.At = moment;
			}

			return {Texture: kept.Texture};
		}

		/* What a screen shows now: {Texture, Flip (rows from the bottom: a picture the scene drew)} or null. */
		engine.ScreenPicture = function (object) {
			var settings = settingsOf(object);
			var made;

			if (settings.Camera) {
				made = state.Cameras[object.ID];

				return made && made.Drawn ? {Texture: made.Textures[0], Flip: true} : null;
			}

			if (settings.Image)
				return image(String(settings.Image));

			if (settings.Video)
				return video(String(settings.Video));

			if (settings.Canvas)
				return canvasPicture(object.ID, settings.Canvas, number(settings.Every, 0));

			if (settings.Element) {
				made = engine.ElementPicture('object:' + object.ID, settings.Element, elementPixels(settings), number(settings.Every, 0.15));

				return made ? {Texture: made} : null;
			}

			return null;
		};

		/* The picture of an element: Pixels, or the size the element is laid out at. */
		function elementPixels (settings) {
			var element;

			if (Array.isArray(settings.Pixels) && settings.Pixels.length === 2) return pixelsOf(settings);

			element = engine.ScreenElement(settings.Element);

			return element && element.offsetWidth && element.offsetHeight ? [element.offsetWidth, element.offsetHeight] : pixelsOf(settings);
		}

		/*
		 * What the cameras of the screens see: the nearest screens of cameras in view (none at low, one at medium, two at high,
		 * four at ultra), each drawn by world(viewProjection, eye, small) from where its camera stands, every Every frames, in a
		 * frame of its own.
		 */
		engine.ScreensWorld = function (projection, view, world) {
			var level = self.Graphics().Level;
			var most = {low: 0, medium: 1, high: 2, ultra: 4}[level] || 0;
			var matrix = math.Multiply(projection, view);
			var tick = state.Tick = state.Tick + 1;
			var used = {};

			screens().filter(function (object) {
				return settingsOf(object).Camera && engine.CameraPose;
			}).map(function (object) {
				var pane = engine.PaneOf(object, settingsOf(object));
				var at = vectors.Subtract(pane.Center, scene.Eye);
				var seen = math.Apply(matrix, at);

				return {Object: object, Pane: pane, Far: vectors.Length(at), Seen: vectors.Dot(at, pane.Normal) < 0 && (vectors.Length(at) < Math.max(pane.Width, pane.Height) * 2 || Math.abs(seen[0]) < 1.3 && Math.abs(seen[1]) < 1.3 && seen[2] < 1)};
			}).filter(function (one) {
				return one.Seen;
			}).sort(function (a, b) {
				return a.Far - b.Far;
			}).slice(0, most).forEach(function (one, index) {
				var settings = settingsOf(one.Object);
				var size = pixelsOf(settings);
				var target = state.Cameras[one.Object.ID];
				var pose = engine.CameraPose(settings.Camera, size[0] / size[1]);
				var every = Math.max(1, Math.round(number(settings.Every, 2)));
				var eye;

				used[one.Object.ID] = true;

				if (!pose) return;

				if (target && (target.Width !== size[0] || target.Height !== size[1])) {
					target.Destroy();
					target = null;
				}

				if (!target) {
					target = state.Cameras[one.Object.ID] = renderer.Target(size[0], size[1], {Depth: true, Float: true, Mipmaps: true});
					target.Drawn = false;
				}

				if (target.Drawn && (tick + index) % every !== 0) return;

				eye = vectors.Subtract(pose.Position, scene.Eye);

				target.Begin();

				renderer.Clear([0, 0, 0, 1]);

				world(math.Multiply(math.Perspective(pose.Fov, size[0] / size[1], 0.1, number(scene.Camera.Far, 5000)), math.LookAt(eye, vectors.Subtract(pose.Target, scene.Eye), pose.Up)), eye, size[0] * size[1] < 400000);

				target.End();

				target.Drawn = true;
			});

			/* A screen out of view keeps its picture a while; one gone gives its target back. */
			Object.keys(state.Cameras).forEach(function (id) {
				if (!scene.Objects[id]) {
					state.Cameras[id].Destroy();
					delete state.Cameras[id];
				}
			});
		};

		/* The screen of an element under a point of the canvas: the nearest pane the ray goes through, {Object, U, V, Far}. */
		engine.ScreenHit = function (x, y, all) {
			var ray = scene.Camera.Ray(x, y, scene.Width, scene.Height);
			var best = null;

			screens().forEach(function (object) {
				var settings = settingsOf(object);
				var pane;
				var facing;
				var t;
				var point;
				var local;
				var u;
				var v;

				if (!all && (!settings.Element || settings.Interactive === false || settings.Interactive === 'false')) return;

				pane = engine.PaneOf(object, settings);
				facing = vectors.Dot(ray.Direction, pane.Normal);

				if (facing >= -1e-6) return;

				t = vectors.Dot(vectors.Subtract(pane.Center, ray.Origin), pane.Normal) / facing;

				if (t <= 0 || best && t >= best.Far) return;

				point = vectors.Add(ray.Origin, vectors.Scale(ray.Direction, t));
				local = vectors.Subtract(point, pane.Center);
				u = vectors.Dot(local, pane.Right) / pane.Width + 0.5;
				v = 0.5 - vectors.Dot(local, pane.Up) / pane.Height;

				if (u < 0 || u > 1 || v < 0 || v > 1) return;

				best = {Object: object, U: u, V: v, Far: t};
			});

			return best;
		};

		/* The deepest element of root under a point of the page that a pointer would reach (none hidden, none it passes through). */
		function under (root, x, y) {
			var found = root;
			var walk = root;
			var style;
			var i;
			var child;
			var box;
			var next;

			while (walk) {
				next = null;

				for (i = walk.children.length - 1; i >= 0; i--) {
					child = walk.children[i];
					box = child.getBoundingClientRect();
					style = typeof getComputedStyle !== 'undefined' ? getComputedStyle(child) : null;

					if (style && (style.visibility === 'hidden' || style.display === 'none')) continue;

					if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
						next = child;

						break;
					}
				}

				if (!next) break;

				if (!style || style.pointerEvents !== 'none')
					found = next;

				walk = next;
			}

			return found;
		}

		/* The nearest of an element and those it is in that scrolls on that axis. */
		function scroller (element, root, down) {
			var walk = element;

			while (walk) {
				if (down ? walk.scrollHeight > walk.clientHeight + 1 : walk.scrollWidth > walk.clientWidth + 1) {
					var style = getComputedStyle(walk);
					if (/(auto|scroll)/.test(down ? style.overflowY : style.overflowX)) return walk;
				}

				if (walk === root) break;

				walk = walk.parentElement;
			}

			return null;
		}

		function fire (target, type, x, y, event, Kind) {
			var Made = Kind || (typeof PointerEvent !== 'undefined' && /^pointer/.test(type) ? PointerEvent : MouseEvent);

			target.dispatchEvent(new Made(type, {bubbles: !/^(pointerenter|pointerleave|mouseenter|mouseleave)$/.test(type), cancelable: true, composed: true, clientX: x, clientY: y, button: event.button || 0, buttons: event.buttons || 0, pointerId: event.pointerId || 1, pointerType: event.pointerType || 'mouse', isPrimary: true, shiftKey: !!event.shiftKey, ctrlKey: !!event.ctrlKey, altKey: !!event.altKey, metaKey: !!event.metaKey, deltaX: event.deltaX || 0, deltaY: event.deltaY || 0, deltaMode: event.deltaMode || 0}));
		}

		/*
		 * A pointer on the canvas over the screen of an element (or one pressed on it, until it is let go): what it does goes to
		 * the element under it in that element, at the place of the page that point of the screen is at. True when it went there.
		 */
		engine.ScreenPointer = function (type, event) {
			var local = engine.Local(event);
			var hit = state.Press && type !== 'down' ? state.Press.Hit : engine.ScreenHit(local.X, local.Y);
			var element;
			var box;
			var x;
			var y;
			var target;
			var focused;
			var key;

			if (state.Press && type !== 'down' && hit) {
				var again = engine.ScreenHit(local.X, local.Y);
				if (again && again.Object === hit.Object)
					hit = again;
			}

			if (!hit) {
				if (state.Over) {
					fire(state.Over, 'pointerout', 0, 0, event);
					fire(state.Over, 'mouseout', 0, 0, event);
					state.Over = null;
				}

				return false;
			}

			element = engine.ScreenElement(settingsOf(hit.Object).Element);

			if (!element)
				return false;

			key = 'object:' + hit.Object.ID;
			box = element.getBoundingClientRect();
			x = box.left + hit.U * box.width;
			y = box.top + hit.V * box.height;
			target = under(element, x, y);

			if (event.preventDefault)
				event.preventDefault();

			if (type === 'move' && target !== state.Over) {
				if (state.Over) {
					fire(state.Over, 'pointerout', x, y, event);
					fire(state.Over, 'mouseout', x, y, event);
				}

				fire(target, 'pointerover', x, y, event);
				fire(target, 'mouseover', x, y, event);

				state.Over = target;
			}

			if (type === 'down') {
				state.Press = {Hit: hit, Target: target};

				fire(target, 'pointerdown', x, y, event);
				fire(target, 'mousedown', x, y, event);

				/* A field pressed takes the keys; the page does not scroll to it out of sight. */
				focused = target.closest ? target.closest('input, textarea, select, button, [tabindex], [contenteditable="true"], a[href]') : null;

				if (focused && focused.focus) focused.focus({preventScroll: true});
				else if (document.activeElement && element.contains(document.activeElement)) document.activeElement.blur();
			}
			else if (type === 'move') {
				fire(target, 'pointermove', x, y, event);
				fire(target, 'mousemove', x, y, event);
			}
			else if (type === 'up') {
				fire(target, 'pointerup', x, y, event);
				fire(target, 'mouseup', x, y, event);

				if (state.Press && state.Press.Target === target)
					fire(target, 'click', x, y, event, MouseEvent);

				state.Press = null;
			}
			else if (type === 'wheel') {
				var scrolling;

				fire(target, 'wheel', x, y, event, typeof WheelEvent !== 'undefined' ? WheelEvent : MouseEvent);

				scrolling = scroller(target, element, Math.abs(event.deltaY || 0) >= Math.abs(event.deltaX || 0));

				if (scrolling) {
					scrolling.scrollTop += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY || 0;
					scrolling.scrollLeft += event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX || 0;
				}
			}

			engine.ElementChanged(key);

			return true;
		};
	},

	/* What the pointer does over the screen of an element goes to it (SceneScreens); true when it went there. */
	ScreenPointer: function (type, event) {
		var engine = this.Engine();

		return !!(engine && engine.ScreenPointer && engine.ScreenPointer(type, event));
	},

	/* A key pressed while a field of a screen holds the keys is the field's: the scene leaves it. */
	ScreenTyped: function (event) {
		var target = event && event.target;
		var host = this.$Element();

		return !!(target && target !== host && target.nodeType === 1 && (target.closest('.elemenx-scene-screens') || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable));
	},

	/* The screen under a point of the page: {ID, U, V} or null. */
	ScreenAt: function (clientX, clientY) {
		var engine = this.Engine();
		var box;
		var hit;

		if (!engine || !engine.ScreenHit) return null;

		box = this.$Element().querySelector('canvas').getBoundingClientRect();
		hit = engine.ScreenHit(clientX - box.left, clientY - box.top, true);

		return hit ? {ID: hit.Object.ID, U: hit.U, V: hit.V} : null;
	}
});
