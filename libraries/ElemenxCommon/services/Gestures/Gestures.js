/*
 * Gestures: what fingers do on an element, recognized at once for every gesture, as a page or a game reads it.
 * - Recognizer(options): the recognition alone, of no page (it runs in Node and in a worker): Push(kind, id, x, y, time)
 *   takes a finger going down, moving, up or cancelled (kind down, move, up, cancel; id of the finger; x and y px; time
 *   ms) and gives what it makes of it, a list of gestures; Tick(time) gives what the time alone makes (a press held long
 *   enough); Reset() forgets all fingers. A gesture is {Type, Phase (start, move or end; a tap, a double tap, a press and
 *   a swipe have none), X, Y (where it is: the middle of the fingers), Pointers} and, by its Type:
 *   tap; doubletap (the second tap of two near in place and time, after its tap); press (a finger held still Hold ms)
 *   and pressup (it lifted, no tap then); pan (one finger, or two moving together: DX, DY since it began, MoveX, MoveY
 *   since the last, Pressed after a press); swipe (a pan that ended quick: Direction left, right, up or down, VX, VY
 *   px/ms); pinch (two fingers apart or together: Scale since it began, Step since the last); rotate (two fingers
 *   turning: Angle radians since it began, clockwise on the screen +, Step); tilt (two fingers moving up or down
 *   together, as a map is tilted: DY px since it began, MoveY). Two fingers pinch, rotate and pan at once; a tilt is
 *   alone (the first of it and of a turn past its threshold takes them). A second finger down ends a pan of one.
 *   Options: Slop px a finger moves and is still (10), Hold ms of a press (500), Double ms and px between two taps of a
 *   double tap (300, 30), Fling px/ms of a swipe (0.5), Scale (0.06: the log of the scale of a pinch), Angle (0.12 rad of
 *   a rotate), Shift px of a pan of two and a tilt (12).
 * - Listen(element, callback(gesture, event), options): the fingers on an element (a pen too; a mouse with Mouse true,
 *   as one finger) to their gestures, as they come; options as the Recognizer's and Mouse (false), Touch ('none': the
 *   touch-action of the element while it listens, so the browser scrolls and zooms none of it; false leaves it).
 *   Returns its stop. A finger is the element's till it lifts (pointer capture).
 * - The events of templates (Elemenx.EventSource): (tap), (doubletap), (press), (pressup), (pan), (swipe), (pinch),
 *   (rotate), (tilt) on any element; the gesture in event.detail. The attribute data-gestures-mouse on the element takes a
 *   mouse too, as one finger (a page to try them on a computer).
 */
Elemenx.Service('Gestures', {
	$Meta: {
		Description: 'What fingers do on an element: tap, double tap, press, pan, swipe, and of two fingers pinch, rotate and tilt; the events of templates (tap), (pinch)...',
		Methods: ['Recognizer(options)', 'Listen(element, callback, options)']
	},

	Defaults: {Slop: 10, Hold: 500, Double: 300, DoubleSlop: 30, Fling: 0.5, Scale: 0.06, Angle: 0.12, Shift: 12},

	Recognizer: function (options) {
		var given = options || {};
		var o = {};
		var fingers = {};
		var order = [];
		var one = null;
		var two = null;
		var last = null;

		Object.keys(this.Defaults).forEach(function (key) {
			o[key] = given[key] === undefined ? this.Defaults[key] : Number(given[key]);
		}, this);

		function count () {
			return order.length;
		}

		function pair () {
			var a = fingers[order[0]];
			var b = fingers[order[1]];

			return {X: (a.X + b.X) / 2, Y: (a.Y + b.Y) / 2, Apart: Math.max(1, Math.hypot(b.X - a.X, b.Y - a.Y)), Angle: Math.atan2(b.Y - a.Y, b.X - a.X), AX: a.X, AY: a.Y, BX: b.X, BY: b.Y};
		}

		function wrap (angle) {
			while (angle > Math.PI)
				angle -= Math.PI * 2;

			while (angle < -Math.PI)
				angle += Math.PI * 2;

			return angle;
		}

		/* The two fingers began: their measures then, and none of their gestures yet. */
		function beginTwo (time) {
			var p = pair();

			two = {From: p, Last: p, Pinch: false, Rotate: false, Pan: false, Tilt: false, Time: time};
		}

		/* What two fingers make of a move: each gesture past its threshold begins, and goes on with them. */
		function moveTwo (out) {
			var p = pair();
			var from = two.From;
			var scale = p.Apart / from.Apart;
			var angle = wrap(p.Angle - from.Angle);
			var dx = p.X - from.X;
			var dy = p.Y - from.Y;
			var together = (p.AY - from.AY) * (p.BY - from.BY) > 0;
			var shared = {X: p.X, Y: p.Y, Pointers: 2};
			/*
			 * Begun only once both fingers moved (half the slop), or one of them did so much that it is plain (twice the
			 * threshold): one finger that leads the other turns the line of them (a tilt is not a turn), and the other one
			 * still lagging tells nothing yet.
			 */
			var both = Math.min(Math.hypot(p.AX - from.AX, p.AY - from.AY), Math.hypot(p.BX - from.BX, p.BY - from.BY)) > o.Slop * 0.5;
			var plain = Math.abs(Math.log(scale)) > o.Scale * 2 || Math.abs(angle) > o.Angle * 2;
			if (!both && !plain && !two.Tilt && !two.Pinch && !two.Rotate && !two.Pan) return;

			/* A tilt: both up or both down, as far as the pan of them, while they neither part nor turn. */
			if (!two.Tilt && !two.Pinch && !two.Rotate && !two.Pan && together && Math.abs(dy) > o.Shift && Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(Math.log(scale)) < o.Scale && Math.abs(angle) < o.Angle) {
				two.Tilt = true;

				out.push(Object.assign({Type: 'tilt', Phase: 'start', DY: dy, MoveY: dy}, shared));
			}
			else if (two.Tilt) {
				out.push(Object.assign({Type: 'tilt', Phase: 'move', DY: dy, MoveY: p.Y - two.Last.Y}, shared));
			}

			if (!two.Tilt) {
				if (!two.Pinch && Math.abs(Math.log(scale)) > o.Scale) {
					two.Pinch = true;

					out.push(Object.assign({Type: 'pinch', Phase: 'start', Scale: scale, Step: scale}, shared));
				}
				else if (two.Pinch) {
					out.push(Object.assign({Type: 'pinch', Phase: 'move', Scale: scale, Step: p.Apart / two.Last.Apart}, shared));
				}

				if (!two.Rotate && Math.abs(angle) > o.Angle) {
					two.Rotate = true;

					out.push(Object.assign({Type: 'rotate', Phase: 'start', Angle: angle, Step: angle}, shared));
				}
				else if (two.Rotate) {
					out.push(Object.assign({Type: 'rotate', Phase: 'move', Angle: angle, Step: wrap(p.Angle - two.Last.Angle)}, shared));
				}

				if (!two.Pan && Math.hypot(dx, dy) > o.Shift) {
					two.Pan = true;

					out.push(Object.assign({Type: 'pan', Phase: 'start', DX: dx, DY: dy, MoveX: dx, MoveY: dy, Pressed: false}, shared));
				}
				else if (two.Pan) {
					out.push(Object.assign({Type: 'pan', Phase: 'move', DX: dx, DY: dy, MoveX: p.X - two.Last.X, MoveY: p.Y - two.Last.Y, Pressed: false}, shared));
				}
			}

			two.Last = p;
		}

		/* Two fingers no more: what of theirs was going ends. */
		function endTwo (out) {
			var p = two.Last;
			var shared = {X: p.X, Y: p.Y, Pointers: 2};

			['Pinch', 'Rotate', 'Pan', 'Tilt'].forEach(function (name) {
				if (two[name])
					out.push(Object.assign({Type: name.toLowerCase(), Phase: 'end', Scale: p.Apart / two.From.Apart, Angle: wrap(p.Angle - two.From.Angle), DX: p.X - two.From.X, DY: p.Y - two.From.Y, MoveX: 0, MoveY: 0, Step: name === 'Pinch' ? 1 : 0}, shared));
			});

			two = null;
		}

		/* One finger no more panning (a second came, or it lifted): its pan ends, quick enough a swipe. */
		function endOne (out, time, lifted) {
			var finger = one ? fingers[one.ID] : null;
			var dx;
			var dy;
			var span;
			var vx;
			var vy;

			if (!one || !finger) {
				one = null;

				return;
			}

			if (one.Pan) {
				dx = finger.X - one.X;
				dy = finger.Y - one.Y;

				out.push({Type: 'pan', Phase: 'end', X: finger.X, Y: finger.Y, Pointers: 1, DX: dx, DY: dy, MoveX: 0, MoveY: 0, Pressed: one.Pressed});

				span = Math.max(1, time - one.Samples[0][2]);
				vx = (finger.X - one.Samples[0][0]) / span;
				vy = (finger.Y - one.Samples[0][1]) / span;

				if (lifted && Math.hypot(vx, vy) > o.Fling)
					out.push({Type: 'swipe', X: finger.X, Y: finger.Y, Pointers: 1, Direction: Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up'), VX: vx, VY: vy});
			}

			one = null;
		}

		return {
			Push: function (kind, id, x, y, time) {
				var out = [];
				var finger;
				var at;

				time = Number(time) || 0;

				if (kind === 'down') {
					fingers[id] = {X: x, Y: y};

					order.push(id);

					if (count() === 1) {
						one = {ID: id, X: x, Y: y, Time: time, Pan: false, Pressed: false, Last: [x, y], Samples: [[x, y, time]]};
					}
					else if (count() === 2) {
						endOne(out, time, false);

						beginTwo(time);
					}

					return out;
				}

				finger = fingers[id];

				if (!finger) return out;

				if (kind === 'move') {
					finger.X = x;
					finger.Y = y;

					if (two && count() >= 2) {
						moveTwo(out);

						return out;
					}

					if (one && one.ID === id) {
						if (!one.Pan && Math.hypot(x - one.X, y - one.Y) > o.Slop) {
							one.Pan = true;

							out.push({Type: 'pan', Phase: 'start', X: x, Y: y, Pointers: 1, DX: x - one.X, DY: y - one.Y, MoveX: x - one.X, MoveY: y - one.Y, Pressed: one.Pressed});
						}
						else if (one.Pan) {
							out.push({Type: 'pan', Phase: 'move', X: x, Y: y, Pointers: 1, DX: x - one.X, DY: y - one.Y, MoveX: x - one.Last[0], MoveY: y - one.Last[1], Pressed: one.Pressed});
						}

						one.Last = [x, y];

						/* Where it was the last tenth of a second: a swipe is quick at its end. */
						one.Samples.push([x, y, time]);

						while (one.Samples.length > 2 && time - one.Samples[1][2] > 100)
							one.Samples.shift();
					}

					return out;
				}

				/* Up or cancelled. */
				finger.X = x;
				finger.Y = y;

				if (two) {
					endTwo(out);
				}
				else if (one && one.ID === id) {
					if (kind === 'up' && !one.Pan && !one.Pressed) {
						at = [x, y];

						out.push({Type: 'tap', X: x, Y: y, Pointers: 1});

						if (last && time - last.Time <= o.Double && Math.hypot(x - last.X, y - last.Y) <= o.DoubleSlop) {
							out.push({Type: 'doubletap', X: x, Y: y, Pointers: 1});

							last = null;
						}
						else {
							last = {X: at[0], Y: at[1], Time: time};
						}
					}
					else if (one.Pressed && !one.Pan) {
						out.push({Type: 'pressup', X: x, Y: y, Pointers: 1});
					}

					endOne(out, time, kind === 'up');
				}

				delete fingers[id];
				order.splice(order.indexOf(id), 1);

				/* One of two left: the other one pans on its own no more (it would jump); it starts again when it is down anew. */
				return out;
			},

			Tick: function (time) {
				var out = [];
				var finger = one ? fingers[one.ID] : null;

				if (finger && !one.Pan && !one.Pressed && !two && time - one.Time >= o.Hold) {
					one.Pressed = true;

					out.push({Type: 'press', X: finger.X, Y: finger.Y, Pointers: 1});
				}

				return out;
			},

			Reset: function () {
				fingers = {};
				order = [];
				one = null;
				two = null;
				last = null;
			},

			Fingers: function () {
				return order.length;
			}
		};
	},

	Listen: function (element, callback, options) {
		var given = options || {};
		var recognizer = this.Recognizer(given);
		var touch = given.Touch === undefined ? 'none' : given.Touch;
		var kept = element.style.touchAction;
		var timer = 0;

		function give (list, event) {
			list.forEach(function (gesture) {
				callback(gesture, event);
			});
		}

		/* A press comes of the time alone: looked for while a finger is down. */
		function watch () {
			window.clearTimeout(timer);

			if (!recognizer.Fingers()) return;

			timer = window.setTimeout(function () {
				give(recognizer.Tick(Date.now()), null);

				watch();
			}, 50);
		}

		function taken (event) {
			return event.pointerType !== 'mouse' || given.Mouse === true;
		}

		function point (event) {
			return [event.clientX, event.clientY];
		}

		function down (event) {
			var at = point(event);

			if (!taken(event)) return;

			if (element.setPointerCapture) {
				try {
					element.setPointerCapture(event.pointerId);
				}
				catch (ignore) {
					/* A pointer the element may not hold (it went away): its moves come as they do. */
				}
			}

			give(recognizer.Push('down', event.pointerId, at[0], at[1], Date.now()), event);

			watch();
		}

		function move (event) {
			var at = point(event);

			if (!taken(event)) return;

			give(recognizer.Push('move', event.pointerId, at[0], at[1], Date.now()), event);
		}

		function up (event) {
			var at = point(event);

			if (!taken(event)) return;

			give(recognizer.Push(event.type === 'pointercancel' ? 'cancel' : 'up', event.pointerId, at[0], at[1], Date.now()), event);

			watch();
		}

		if (touch !== false)
			element.style.touchAction = touch;

		element.addEventListener('pointerdown', down);
		element.addEventListener('pointermove', move);
		element.addEventListener('pointerup', up);
		element.addEventListener('pointercancel', up);

		return function () {
			window.clearTimeout(timer);

			element.removeEventListener('pointerdown', down);
			element.removeEventListener('pointermove', move);
			element.removeEventListener('pointerup', up);
			element.removeEventListener('pointercancel', up);

			if (touch !== false)
				element.style.touchAction = kept;

			recognizer.Reset();
		};
	}
});

/* The events of templates: (tap), (pinch)... on an element start its recognition there, each gesture an event of its Type. */
Elemenx.EventSource(['tap', 'doubletap', 'press', 'pressup', 'pan', 'swipe', 'pinch', 'rotate', 'tilt'], {
	Attach: function (element) {
		return Elemenx.Service('Gestures').Listen(element, function (gesture) {
			element.dispatchEvent(new CustomEvent(gesture.Type, {detail: gesture}));
		}, {Mouse: element.hasAttribute('data-gestures-mouse')});
	}
});
