/*
 * SceneBehaviour: a Component that adds to what the Scene it is declared in does (a game, a tour, a tool of an editor),
 * none of which the scene knows: <Scene> ... <GameStrategy Team="blue" /> </Scene>. Inside a Scene it attaches itself
 * as it is ready, its element in the scene (Scene.AddBehaviour), and detaches as it goes; its methods
 * SceneStart(scene), SceneStep(elapsed, now), ScenePointer(kind, event), SceneGesture(gesture) (a gesture of fingers,
 * Gestures: a finger gives no ScenePointer), SceneKey(event), SceneKeyUp(event) and SceneStop() are the hooks, those it
 * has: true from ScenePointer, SceneGesture, SceneKey or SceneKeyUp takes the press from the scene. SceneCard(object, rows) adds what the game tells of an object to its card (rows: [{Key, Label, Value}]);
 * SceneTarget(object) says whether a weapon of the scene may aim at it and its blast hurt it (true or false; undefined: as
 * the scene would). ParentScene() is the Scene, null outside one.
 */
Elemenx.Trait('SceneBehaviour', {
	$OnReady: function () {
		var self = this;
		var tries = 0;

		function hook (name) {
			return function () {
				return typeof self[name] === 'function' ? self[name].apply(self, arguments) : undefined;
			};
		}

		/* The element of a component declared in a scene goes into it as the scene renders: a few turns may pass. */
		function attach () {
			var element = self.$Element();
			var host = element && element.parentNode && element.parentNode.closest ? element.parentNode.closest('.elemenx-scene') : null;
			var scene = host ? Elemenx.Instance(host) : null;

			self.BehaviourTimer = 0;

			if (self.BehaviourGone) return;

			if (!scene || typeof scene.AddBehaviour !== 'function') {
				if (++tries < 20)
					self.BehaviourTimer = window.setTimeout(attach, 10);

				return;
			}

			self.BehaviourScene = scene;
			self.BehaviourDetach = scene.AddBehaviour({Start: hook('SceneStart'), Step: hook('SceneStep'), Pointer: hook('ScenePointer'), Gesture: hook('SceneGesture'), Key: hook('SceneKey'), KeyUp: hook('SceneKeyUp'), Stop: hook('SceneStop'), Card: hook('SceneCard'), Target: hook('SceneTarget')});
		}

		attach();
	},

	$OnDestroy: function () {
		this.BehaviourGone = true;

		window.clearTimeout(this.BehaviourTimer);

		if (this.BehaviourDetach)
			this.BehaviourDetach();

		this.BehaviourDetach = null;
		this.BehaviourScene = null;
	},

	ParentScene: function () {
		return this.BehaviourScene || null;
	}
});
