/*
 * SceneMarks: elements of the page over places of the scene, laid out each frame, the names of the objects (Labels) among
 * them. Mark(key, options) puts one (again: changes it; options null: Unmark), Unmark(key) takes it away, MarksOnScreen()
 * tells where each is: [{Key, X, Y, Shown, Why (off, behind, hidden, far, crowded, clustered, filtered), Edge, Moved,
 * Cluster, Count, Opacity}]. options:
 * - Element: the element put there (any component's: a card, a bar, a chart); it stays where it is in the page, moved by a
 *   transform from the top left corner of the scene (the slot hud of a Scene is such a place, SceneMark puts it so);
 * - where: Object (an ID; its middle, Up of its sizes over it, a socket of its model by Part, as Socket gives it), Point
 *   ([x, y, z] of the world) or At (a function giving such a point, or null: not shown); Offset [x, y, z] added, Shift
 *   [x, y] pixels; or Screen (a function giving [x, y] on the scene itself, null: not shown; a view of its own, as the
 *   map of a galaxy is, Distance0 how far it is); Align bottom (its foot on the point, by default), top (its head),
 *   center, left or right (its middle of that side);
 * - Line: true draws a line from the point to it always, auto (by default) when it was moved off its point to make room;
 * - Occlude (true for an Object): not shown behind a body (a sphere of Radius of another object) or the ground (Visible);
 * - Edge: shown at the edge of the view when the point is off it or behind, with an arrow toward it (data-edge on it);
 * - Declutter (true): moved up or down, as little as it can, off the marks laid out before it (Priority, larger first, then
 *   the nearer); with no room it is not shown, or joins its Cluster;
 * - Cluster: a name: marks of it whose points are within ClusterRadius (36) pixels of each other show as the first, a
 *   badge +N beside it (pressed: the scene emits markcluster {Cluster, Keys}, the view goes to them);
 * - Near and Far: metres: fully seen nearer than Near, gone at Far (faded between); Shown(mark): false hides it (a game's
 *   own rule); Priority (0).
 * The point of each frame is of the camera of that frame; the bodies that hide one are asked 5 times a second.
 */
Elemenx.Trait('SceneMarks', {
	MarksStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var element = this.$Element();
		var vectors = this.$Service('Math').Vectors;
		var svg = 'http://www.w3.org/2000/svg';
		var state = {Marks: {}, Order: [], Shown: [], Badges: {}, Asked: 0};
		var layer = element.ownerDocument.createElement('div');
		var lines = element.ownerDocument.createElementNS(svg, 'svg');
		var path = element.ownerDocument.createElementNS(svg, 'path');
		var heads = element.ownerDocument.createElementNS(svg, 'path');

		layer.className = 'elemenx-scene-marks';

		layer.setAttribute('aria-hidden', 'true');

		lines.setAttribute('class', 'elemenx-scene-marks-lines');

		path.setAttribute('class', 'elemenx-scene-marks-line');

		heads.setAttribute('class', 'elemenx-scene-marks-arrow');

		lines.appendChild(path);
		lines.appendChild(heads);

		layer.appendChild(lines);

		element.insertBefore(layer, element.querySelector('.elemenx-scene-hud'));

		/* Badges of clusters are buttons: a press goes on to the scene. */
		layer.addEventListener('click', function (event) {
			var badge = event.target && event.target.closest ? event.target.closest('.elemenx-scene-mark-cluster') : null;
			var cluster = badge ? state.Badges[badge.getAttribute('data-cluster')] : null;
			if (!cluster) return;

			self.$Emit('markcluster', {Cluster: cluster.Name, Keys: cluster.Keys.slice()});

			if (cluster.Point)
				engine.MarksLook(cluster.Point);
		});

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function pair (value, fallback) {
			if (typeof value === 'string')
				value = value.split(/[\s,]+/).map(Number);

			return Array.isArray(value) ? value.map(function (one) {
				return Number(one) || 0;
			}) : fallback;
		}

		/* Where a mark stands in the world now: [x, y, z], or null. */
		function pointOf (mark) {
			var object = mark.Object ? scene.Objects[mark.Object] : null;
			var point = null;
			var socket = mark.Part && object && engine.SocketOf ? engine.SocketOf(object, mark.Part) : null;

			if (typeof mark.At === 'function') point = mark.At();
			else if (mark.Point) point = pair(mark.Point, null);
			else if (socket && socket.At) point = socket.At.slice();
			else if (object && object.World) point = [object.World[0], object.World[1] + (object.Size || 0) * number(mark.Up, 1.15), object.World[2]];

			if (!point || point.length < 3 || isNaN(point[0])) return null;

			return mark.Offset ? vectors.Add(point, pair(mark.Offset, [0, 0, 0])) : point;
		}

		/* The point on the screen: X, Y, and whether it is before the eye; the way to it (x, y on the screen) when behind. */
		function screenOf (point, matrix) {
			var m = matrix;
			var x = point[0];
			var y = point[1];
			var z = point[2];
			var w = m[3] * x + m[7] * y + m[11] * z + m[15];
			var cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / (Math.abs(w) < 1e-9 ? 1e-9 : w);
			var cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / (Math.abs(w) < 1e-9 ? 1e-9 : w);

			/* Behind the eye: the way to it is the other way. */
			if (w <= 0) {
				cx = -cx;
				cy = -cy;
			}

			return {X: (cx + 1) / 2 * scene.Width, Y: (1 - cy) / 2 * scene.Height, Front: w > 0, Way: [cx, -cy]};
		}

		/* Whether a body (a sphere of another object) or the ground stands between the eye and the point. */
		function covered (mark, point) {
			var eye = scene.Camera.Position;
			var far = vectors.Distance(eye, point);
			var ray = {Origin: eye, Direction: vectors.Normalize(vectors.Subtract(point, eye))};
			var math = self.$Service('Math');

			var body = scene.Roots.some(function (other) {
				var t;

				/* A body: of a Radius (a planet, a moon) or a star. */
				if (other.ID === mark.Object || !other.World || !other.Size || !other.Radius && !(other.Traits && other.Traits.Star) || other.Hidden) return false;

				t = math.Hit(ray, other.World, other.Size);

				return t >= 0 && t < far - (other.Size || 0) * 0.05;
			});
			if (body)
				return true;

			return !!scene.Ground && typeof self.Visible === 'function' && !self.Visible(eye, point);
		}

		function sizeOf (mark, now) {
			if (!mark.Size || now - mark.Measured > 500) {
				mark.Size = [mark.Element.offsetWidth || mark.Size && mark.Size[0] || 0, mark.Element.offsetHeight || mark.Size && mark.Size[1] || 0];
				/* Hidden, it has no size yet: measured again the next frame. */
				mark.Measured = mark.Size[0] ? now : 0;
			}

			return mark.Size;
		}

		/* The box of a mark at a place, by its Align: [left, top, right, bottom]. */
		function boxOf (mark, x, y) {
			var size = mark.Size;
			var side = mark.Align === 'left' || mark.Align === 'right';
			var top = mark.Align === 'top' ? y : mark.Align === 'center' || side ? y - size[1] / 2 : y - size[1];
			var left = mark.Align === 'left' ? x : mark.Align === 'right' ? x - size[0] : x - size[0] / 2;

			return [left, top, left + size[0], top + size[1]];
		}

		function overlaps (a, b) {
			return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
		}

		function show (target, shown) {
			if (target.hidden === !shown) return;

			target.hidden = !shown;
		}

		function badgeOf (name) {
			var badge = state.Badges[name];

			if (!badge) {
				badge = state.Badges[name] = {Name: name, Element: element.ownerDocument.createElement('button'), Keys: [], Point: null};
				badge.Element.type = 'button';
				badge.Element.className = 'elemenx-scene-mark-cluster';

				badge.Element.setAttribute('data-cluster', name);

				layer.appendChild(badge.Element);
			}

			return badge;
		}

		/* Priority: a number, or a function giving it each frame (the name of what is chosen first). */
		function priorityOf (mark) {
			return number(typeof mark.Priority === 'function' ? mark.Priority() : mark.Priority, 0);
		}

		/* The arrow of a mark at the edge: a triangle in the lines, its tip toward the point, where its line leaves the view. */
		function arrowPath (mark) {
			var at = mark.ArrowAt;
			var way = [Math.cos(mark.Turn), Math.sin(mark.Turn)];
			var side = [-way[1], way[0]];
			/* Longer than wide, so its tip is seen (regression: as long as wide, it seemed to point aside). */
			var tip = [at[0] + way[0] * 10, at[1] + way[1] * 10];

			return 'M' + Math.round(tip[0]) + ' ' + Math.round(tip[1]) + 'L' + Math.round(at[0] - way[0] * 6 + side[0] * 5) + ' ' + Math.round(at[1] - way[1] * 6 + side[1] * 5) + 'L' + Math.round(at[0] - way[0] * 6 - side[0] * 5) + ' ' + Math.round(at[1] - way[1] * 6 - side[1] * 5) + 'Z';
		}

		engine.MarkSet = function (key, options) {
			var mark = state.Marks[key];

			if (!options) {
				engine.MarkDrop(key);

				return;
			}

			if (!options.Element || !options.Element.style)
				throw new Error('Elemenx Scene: Mark expects (key, {Element, Object or Point or At})');

			if (mark && mark.Element !== options.Element)
				engine.MarkDrop(key);

			mark = state.Marks[key] = Object.assign(state.Marks[key] || {Key: key, Measured: 0, Size: null, Hidden: undefined}, options);

			mark.Element.setAttribute('data-elemenx-mark', key);

			if (state.Order.indexOf(key) === -1)
				state.Order.push(key);
		};

		engine.MarkDrop = function (key) {
			var mark = state.Marks[key];
			if (!mark) return;

			mark.Element.removeAttribute('data-elemenx-mark');
			mark.Element.removeAttribute('data-edge');

			mark.Element.style.transform = '';
			mark.Element.style.opacity = '';

			delete state.Marks[key];

			state.Order.splice(state.Order.indexOf(key), 1);
		};

		/* The view goes to a point (a cluster pressed): it is looked at from as far as it is now. */
		engine.MarksLook = function (point) {
			var view = self.Viewpoint();

			self.SetViewpoint({Target: point, Yaw: view.Yaw, Pitch: view.Pitch, Distance: view.Distance});
		};

		engine.MarksOnScreen = function () {
			return state.Shown.map(function (one) {
				return Object.assign({}, one);
			});
		};

		/* Each frame: each mark where its point is, as the view sees it now. */
		engine.MarksMove = function () {
			var now = Date.now();
			var matrix = scene.Camera.Matrix(scene.Width / Math.max(1, scene.Height));
			var ask = now - state.Asked > 200;
			var placed = [];
			var clusters = {};
			var segments = [];
			var arrows = [];
			var shown = [];
			var margin = 14;
			var keys;

			if (ask)
				state.Asked = now;

			keys = state.Order.slice().map(function (key) {
				var mark = state.Marks[key];
				var given = typeof mark.Screen === 'function' && !layer.hidden ? mark.Screen() : null;
				var point = layer.hidden || typeof mark.Screen === 'function' ? null : pointOf(mark);
				var spot = point ? screenOf(point, matrix) : given ? {X: given[0], Y: given[1], Front: true, Way: [0, 0]} : null;

				/* Its point this frame (not Point: what it was given). Regression: kept in Point, a mark of an object stayed where it was the first frame. */
				mark.World = point;
				mark.Spot = spot;
				mark.Distance = point ? vectors.Distance(scene.Camera.Position, point) : number(mark.Distance0, 0);

				return mark;
			}).sort(function (a, b) {
				return priorityOf(b) - priorityOf(a) || a.Distance - b.Distance;
			});

			Object.keys(state.Badges).forEach(function (name) {
				state.Badges[name].Keys = [];
				state.Badges[name].Lead = null;
			});

			keys.forEach(function (mark) {
				var spot = mark.Spot;
				var why = '';
				var edge = false;
				var x;
				var y;
				var box;
				var moved = 0;
				var opacity = 1;
				var far = number(mark.Far, 0);
				var near = Math.min(number(mark.Near, far * 0.8), far);
				var tries;
				var i;
				var lead;
				var cluster;
				var size;
				var inside;

				if (!spot) why = 'off';
				else if (typeof mark.Shown === 'function' && !mark.Shown(mark)) why = 'filtered';

				/* Faded by how far it is: whole nearer than Near, gone at Far. */
				if (!why && far > 0) {
					opacity = mark.Distance >= far ? 0 : mark.Distance <= near ? 1 : 1 - (mark.Distance - near) / Math.max(1e-6, far - near);

					if (opacity <= 0.01)
						why = 'far';
				}

				if (!why && (mark.Occlude === true || mark.Occlude === undefined && mark.Object)) {
					if (ask || mark.Hidden === undefined)
						mark.Hidden = covered(mark, mark.World);

					if (mark.Hidden)
						why = 'hidden';
				}

				size = why ? mark.Size || [0, 0] : sizeOf(mark, now);
				inside = !!spot && spot.Front && spot.X >= -size[0] && spot.X <= scene.Width + size[0] && spot.Y >= -size[1] && spot.Y <= scene.Height + size[1];

				if (!why && !inside) {
					if (mark.Edge) edge = true;
					else why = spot.Front ? 'off' : 'behind';
				}

				if (!why) {
					var shift = pair(mark.Shift, [0, 0]);

					x = spot.X + shift[0];
					y = spot.Y + shift[1];

					/*
					 * At the edge: the arrow where the line from the middle toward the point leaves the view (margin in), the mark
					 * beside it on that line, toward the middle.
					 */
					if (edge) {
						var cx = scene.Width / 2;
						var cy = scene.Height / 2;
						var way = spot.Front ? [spot.X - cx, spot.Y - cy] : [spot.Way[0] * cx, spot.Way[1] * cy];
						var length = Math.max(1e-6, Math.hypot(way[0], way[1]));
						var unit = [way[0] / length, way[1] / length];
						var reach = Math.min((cx - margin) / Math.max(1e-6, Math.abs(unit[0])), (cy - margin) / Math.max(1e-6, Math.abs(unit[1])));
						var back = Math.abs(unit[0]) * size[0] / 2 + Math.abs(unit[1]) * size[1] / 2 + 12;

						mark.ArrowAt = [cx + unit[0] * reach, cy + unit[1] * reach];
						mark.Turn = Math.atan2(unit[1], unit[0]);
						x = cx + unit[0] * (reach - back);
						y = cy + unit[1] * (reach - back);
						box = [x - size[0] / 2, y - size[1] / 2, x + size[0] / 2, y + size[1] / 2];
					}
					else {
						box = boxOf(mark, x, y);
					}

					/*
					 * Room for it: up, down, to a side, by its size, a few steps out; a place inside the view first (regression:
					 * a card moved up off the top of the view while there was room beside it).
					 */
					if (mark.Declutter !== false && !edge) {
						var found = null;
						var outside = null;

						tries = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -2], [0, 2], [-2, 0], [2, 0], [0, -3], [0, 3]];

						for (i = 0; i < tries.length && !found; i++) {
							var dx = tries[i][0] * (size[0] / 2 + 6);
							var dy = tries[i][1] * (size[1] + 2);
							var tried = boxOf(mark, x + dx, y + dy);
							var free = !placed.some(function (other) {
								return overlaps(tried, other);
							});
							var within = tried[0] >= 0 && tried[1] >= 0 && tried[2] <= scene.Width && tried[3] <= scene.Height;

							if (free && within) found = {Box: tried, Moved: Math.hypot(dx, dy)};
							else if (free && !outside) outside = {Box: tried, Moved: Math.hypot(dx, dy)};
						}

						found = found || outside;

						if (found) {
							box = found.Box;
							moved = found.Moved;
						}
						else {
							why = mark.Cluster ? 'clustered' : 'crowded';
						}
					}

					/* A mark of a cluster near one of it shown already: it joins that one. */
					if (!why && mark.Cluster) {
						lead = clusters[mark.Cluster] ? clusters[mark.Cluster].filter(function (one) {
							return Math.abs(one.X - spot.X) < number(mark.ClusterRadius, 36) && Math.abs(one.Y - spot.Y) < number(mark.ClusterRadius, 36);
						})[0] : null;

						if (lead) {
							why = 'clustered';

							lead.Keys.push(mark.Key);
						}
					}
					else if (why === 'clustered') {
						/* No room: it joins the nearest of its cluster shown. */
						lead = (clusters[mark.Cluster] || []).slice().sort(function (a, b) {
							return Math.hypot(a.X - spot.X, a.Y - spot.Y) - Math.hypot(b.X - spot.X, b.Y - spot.Y);
						})[0];

						if (lead)
							lead.Keys.push(mark.Key);
					}
				}

				if (why) {
					show(mark.Element, false);

					shown.push({Key: mark.Key, X: spot ? spot.X : 0, Y: spot ? spot.Y : 0, Shown: false, Why: why, Edge: false, Moved: 0, Cluster: mark.Cluster || '', Count: 0, Opacity: 0});

					return;
				}

				placed.push(box);

				if (mark.Cluster) {
					cluster = {X: spot.X, Y: spot.Y, Key: mark.Key, Keys: [mark.Key], Box: box, Point: mark.World};

					(clusters[mark.Cluster] = clusters[mark.Cluster] || []).push(cluster);
				}

				show(mark.Element, true);

				mark.Element.style.transform = 'translate(' + Math.round(box[0]) + 'px, ' + Math.round(box[1]) + 'px)';

				if (mark.Element.style.opacity !== String(opacity))
					mark.Element.style.opacity = opacity < 1 ? String(Math.round(opacity * 100) / 100) : '';

				if (edge !== (mark.Element.getAttribute('data-edge') === 'true'))
					mark.Element.setAttribute('data-edge', String(edge));

				/* The arrow toward the point, at the edge. */
				if (edge)
					arrows.push(arrowPath(mark));

				/* The line from its point to it: always, or when it had to move. */
				if (!edge && (mark.Line === true || mark.Line !== false && Math.abs(moved) > 0.5))
					segments.push('M' + Math.round(spot.X) + ' ' + Math.round(spot.Y) + 'L' + Math.round(mark.Align === 'left' ? box[0] : mark.Align === 'right' ? box[2] : (box[0] + box[2]) / 2) + ' ' + Math.round(mark.Align === 'top' ? box[1] : mark.Align === 'bottom' || !mark.Align ? box[3] : (box[1] + box[3]) / 2));

				shown.push({Key: mark.Key, X: Math.round((box[0] + box[2]) / 2), Y: Math.round(box[1]), Shown: true, Why: '', Edge: edge, Moved: Math.round(moved), Cluster: mark.Cluster || '', Count: 0, Opacity: opacity});
			});

			/* The badges: +N beside the first of each cluster that took others. */
			Object.keys(clusters).forEach(function (name) {
				clusters[name].forEach(function (one, index) {
					var id = name + ':' + index;
					var badge;
					var record;

					if (one.Keys.length < 2) return;

					badge = badgeOf(id);
					badge.Keys = one.Keys.slice();
					badge.Point = one.Point;
					badge.Name = name;
					badge.Element.textContent = '+' + (one.Keys.length - 1);
					badge.Element.style.transform = 'translate(' + Math.round(one.Box[2] + 2) + 'px, ' + Math.round(one.Box[1]) + 'px)';

					badge.Element.setAttribute('aria-label', name + ': ' + one.Keys.length);

					show(badge.Element, true);

					record = shown.filter(function (each) {
						return each.Key === one.Key;
					})[0];

					if (record)
						record.Count = one.Keys.length;
				});
			});

			Object.keys(state.Badges).forEach(function (id) {
				if (!state.Badges[id].Keys.length)
					show(state.Badges[id].Element, false);
			});

			path.setAttribute('d', segments.join(''));
			heads.setAttribute('d', arrows.join(''));

			state.Shown = shown;
		};

		engine.MarksStop = function () {
			state.Order.slice().forEach(engine.MarkDrop);

			if (layer.parentNode)
				layer.parentNode.removeChild(layer);
		};

		/* Shown with the names (Labels): none on the map of a galaxy or a universe, as they are not. */
		engine.MarksHidden = function (hidden) {
			if (layer.hidden !== !!hidden)
				layer.hidden = !!hidden;
		};
	},

	/* A mark over a place of the scene (see the header): key, options ({Element, Object or Point or At, ...}; null: away). */
	Mark: function (key, options) {
		var engine = this.Engine();

		if (!key || typeof key !== 'string')
			throw new Error('Elemenx Scene: Mark expects (key, {Element, Object or Point or At})');

		if (!engine.MarkSet) return key;

		engine.MarkSet(key, options || null);

		return key;
	},

	Unmark: function (key) {
		if (this.Engine().MarkDrop)
			this.Engine().MarkDrop(key);
	},

	MarksOnScreen: function () {
		return this.Engine().MarksOnScreen ? this.Engine().MarksOnScreen() : [];
	}
});
