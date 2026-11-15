/*
 * ViewTouch: the fingers on the view of an editor (SceneEditor, ModelEditor, PlanetEditor). One finger edits as the left
 * button of a mouse does; two fingers move the camera (pan, pinch, rotate, tilt, as Gestures tells them) and never
 * edit; a mouse and a pen go to the editor as they come.
 * - Make(options) gives {Down(event), Move(event), Up(event), Reset()} for the pointer events of the view. Options:
 *   Edit {Down, Move, Up} (the handlers of the editor), Camera(gesture) (a gesture of the fingers that move the camera),
 *   Abort() (an edit a second finger came late to: the editor lets it go), OneFinger() (true: one finger moves the
 *   camera too, the edits wait for a mouse), Wait (ms a finger waits for a second one before it edits: 120), Slop (px it
 *   may move meanwhile: 8). A finger that waited reaches the editor as an event of its own (the coordinates, the target
 *   and the currentTarget of the first; button 0).
 * - Orbit(scene, gesture, options) moves the camera of a Scene round what it looks at, by a gesture: one finger (or a
 *   rotate, a tilt) turns it round, two carry it aside, a pinch brings it nearer. Options: Near (the nearest distance:
 *   0.3), Far (100000).
 */
Elemenx.Service('ViewTouch', {
	$Meta: {
		Description: 'The fingers on the view of an editor: one finger edits, two move the camera (pan, pinch, rotate, tilt); a toggle gives one finger to the camera.',
		Methods: ['Make(options)', 'Orbit(scene, gesture, options)']
	},

	Wait: 120,
	Slop: 8,

	Make: function (options) {
		var o = options || {};
		var edit = o.Edit || {};
		var wait = o.Wait === undefined ? this.Wait : Number(o.Wait);
		var slop = o.Slop === undefined ? this.Slop : Number(o.Slop);
		var recognizer = this.$Service('Gestures').Recognizer();
		var fingers = {};
		var mode = null;
		var pending = null;
		var timer = 0;
		var editing = null;

		function call (name, event) {
			if (typeof edit[name] === 'function')
				edit[name](event);
		}

		function count () {
			return Object.keys(fingers).length;
		}

		/* A finger as the editor reads it: what a press of the left button is. */
		function copy (event, target, current) {
			return {type: event.type, pointerId: event.pointerId, pointerType: event.pointerType, clientX: event.clientX, clientY: event.clientY, button: 0, buttons: 1, altKey: false, shiftKey: false, ctrlKey: false, metaKey: false, target: target || event.target, currentTarget: current || event.currentTarget, preventDefault: function () {}, stopPropagation: function () {}};
		}

		function camera (gestures) {
			if (typeof o.Camera !== 'function') return;

			gestures.forEach(function (gesture) {
				o.Camera(gesture);
			});
		}

		/* The finger that waited edits now. */
		function start () {
			window.clearTimeout(timer);

			if (mode !== 'pending' || !pending) return;

			mode = 'edit';
			editing = pending.pointerId;

			call('Down', pending);
		}

		function touched (event) {
			return event.pointerType === 'touch';
		}

		function Down (event) {
			var current = event.currentTarget;

			if (!touched(event)) {
				call('Down', event);

				return;
			}

			if (event.preventDefault)
				event.preventDefault();

			if (current && current.setPointerCapture && event.pointerId !== undefined) {
				try {
					current.setPointerCapture(event.pointerId);
				}
				catch (error) {
					/* A synthetic event has no pointer to take. */
				}
			}

			fingers[event.pointerId] = true;

			recognizer.Push('down', event.pointerId, event.clientX, event.clientY, Date.now());

			if (count() === 1) {
				if (typeof o.OneFinger === 'function' && o.OneFinger()) {
					mode = 'camera';

					return;
				}

				mode = 'pending';
				pending = copy(event, event.target, current);
				timer = window.setTimeout(start, wait);

				return;
			}

			/* A second finger: the camera, whatever the first began. */
			window.clearTimeout(timer);

			if (mode === 'edit' && typeof o.Abort === 'function')
				o.Abort();

			pending = null;
			editing = null;
			mode = 'camera';
		}

		function Move (event) {
			var gestures;

			if (!touched(event)) {
				call('Move', event);

				return;
			}

			if (!fingers[event.pointerId]) return;

			gestures = recognizer.Push('move', event.pointerId, event.clientX, event.clientY, Date.now());

			if (mode === 'pending' && pending && Math.abs(event.clientX - pending.clientX) + Math.abs(event.clientY - pending.clientY) > slop)
				start();

			if (mode === 'edit' && event.pointerId === editing) call('Move', copy(event, pending && pending.target, pending && pending.currentTarget));
			else if (mode === 'camera') camera(gestures);
		}

		function Up (event) {
			var gestures;
			var cancelled = event.type === 'pointercancel';

			if (!touched(event)) {
				call('Up', event);

				return;
			}

			if (!fingers[event.pointerId]) return;

			gestures = recognizer.Push(cancelled ? 'cancel' : 'up', event.pointerId, event.clientX, event.clientY, Date.now());

			delete fingers[event.pointerId];

			if (mode === 'pending' && !cancelled)
				start();

			if (mode === 'edit' && event.pointerId === editing) {
				if (cancelled && typeof o.Abort === 'function') o.Abort();
				else call('Up', copy(event, pending && pending.target, pending && pending.currentTarget));

				editing = null;
			}
			else if (mode === 'camera') {
				camera(gestures);
			}

			if (!count()) {
				window.clearTimeout(timer);

				mode = null;
				pending = null;
				editing = null;
			}
		}

		function Reset () {
			window.clearTimeout(timer);

			recognizer.Reset();

			fingers = {};
			mode = null;
			pending = null;
			editing = null;
		}

		return {Down: Down, Move: Move, Up: Up, Reset: Reset};
	},

	Orbit: function (scene, gesture, options) {
		var o = options || {};
		var view = scene.Viewpoint();
		var near = o.Near === undefined ? 0.3 : Number(o.Near);
		var far = o.Far === undefined ? 100000 : Number(o.Far);
		var yaw = view.Yaw;
		var pitch = view.Pitch;
		var distance = view.Distance;
		var target = view.Target.slice();
		var step;

		if (gesture.Type === 'pan' && gesture.Pointers === 1) {
			yaw -= gesture.MoveX * 0.006;
			pitch += gesture.MoveY * 0.006;
		}
		else if (gesture.Type === 'pan') {
			step = distance * 0.0015;
			target = [target[0] - Math.cos(yaw) * gesture.MoveX * step, target[1] + gesture.MoveY * step, target[2] + Math.sin(yaw) * gesture.MoveX * step];
		}
		else if (gesture.Type === 'pinch' && gesture.Step) {
			distance = Math.max(near, Math.min(far, distance / gesture.Step));
		}
		else if (gesture.Type === 'rotate') {
			yaw -= gesture.Step || 0;
		}
		else if (gesture.Type === 'tilt') {
			pitch += (gesture.MoveY || 0) * 0.006;
		}
		else {
			return false;
		}

		scene.SetViewpoint({Target: target, Yaw: yaw, Pitch: Math.max(-1.5, Math.min(1.5, pitch)), Distance: distance});

		return true;
	}
});
