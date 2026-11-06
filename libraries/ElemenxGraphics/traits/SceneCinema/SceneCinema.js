/*
 * SceneCinema: what a film does with the picture of a scene, and its cutscenes. Over the canvas lies a layer of HTML of its
 * own (themed by the tokens of the Scene: --elemenx-scene-title-*): a fade to a color, the bars of a wide picture
 * (letterbox), titles and subtitles, typed out as they come if they are told to.
 *
 * A cutscene is data: {Name, Tracks, Restore (true: the camera that showed the world comes back at its end), Skip (true:
 * Escape ends it), Loop (false)}; Cutscenes of the scene (a property, kept by Save and Load) holds them by name.
 * PlayCutscene(cutscene or name, callback) plays it: callback(error, {Name, Stopped}) at its end; StopCutscene() ends it,
 * PauseCutscene(on) holds it, SeekCutscene(seconds) goes to a moment of it (what its layer shows is of that moment; no cue
 * of what was passed fires), Cutscene() tells {Name, Time, Length, Paused} or null. Its events: cutscene ({Name, State:
 * start, end or stop}) and cue ({Cutscene, Name, Data, At}).
 *
 * Its tracks, each {Type, ...}, their moments At in seconds from its start:
 * - camera: Keys [{At, Camera, Fly}]: the camera that shows the world from that moment, cut to or flown to in Fly seconds;
 * - move: ID (a camera or any object), Keys [{At, Ease (linear, smooth, in, out), and any number of it: X, Y, Z, Lift, Yaw,
 *   Pitch, Roll, Focal, Focus, Aperture...}]: its numbers from key to key, its place along a smooth curve through them
 *   (Path linear: straight); a dolly, a crane, a zoom (Focal), a pull of focus (Focus);
 * - orbit: ID (a camera), At, Length, Around (an ID or [x, y, z]), Radius (10), Height (2), From, To (degrees round it);
 * - fade: Keys [{At, Value (0 clear to 1 all of the color), Color ('#000000')}];
 * - letterbox: Keys [{At, Value (0 none to 1 the whole bars), Ratio (2.39: the picture left between them)}];
 * - title: Items [{At, Length, Text, Kind (title, chapter, caption, credits), Place (center, top, bottom, top-left,
 *   bottom-left), Typing (letters a second; 0: whole at once), In, Out (seconds of fading in and out, 0.5)}];
 * - subtitle: Items [{At, Length, Text, Speaker}];
 * - clip: Items [{At, ID, Clip}]: an object plays a clip (Play);
 * - cue: Items [{At, Name, Data}]: the scene emits cue as its moment passes.
 * The layer can be set without a cutscene too: Cinema({Fade, FadeColor, Letterbox, Ratio, Title, Subtitle}) (Title and
 * Subtitle as items without At), Cinema(null) clears it.
 * Record(options, callback) records what the scene shows as a video, the layer laid in it; a cutscene with Record gives its
 * video to its callback as Video (see recorder).
 */
Elemenx.Trait('SceneCinema', {
	CinemaStart: function () {
		var self = this;
		var scene = this.Scene();
		var engine = this.Engine();
		var state = {Playing: null, Shown: '', Layer: null, Own: null, Recordings: []};

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		function eased (t, kind) {
			if (kind === 'linear') return t;
			if (kind === 'in') return t * t;

			if (kind === 'out')
				return 1 - (1 - t) * (1 - t);

			return t * t * (3 - 2 * t);
		}

		/* The layer over the canvas: made once, its parts kept. */
		function layer () {
			var root = self.$Element();
			var made;

			if (state.Layer && state.Layer.Root.isConnected) return state.Layer;

			made = root.querySelector('.elemenx-scene-cinema');

			if (!made)
				return null;

			made.innerHTML = '<div class="elemenx-scene-cinema-fade"></div><div class="elemenx-scene-cinema-bar top"></div><div class="elemenx-scene-cinema-bar bottom"></div><div class="elemenx-scene-cinema-titles"></div><div class="elemenx-scene-cinema-subtitles" role="status" aria-live="polite"></div>';

			state.Layer = {Root: made, Fade: made.children[0], Top: made.children[1], Bottom: made.children[2], Titles: made.children[3], Subtitles: made.children[4]};

			return state.Layer;
		}

		/* What a list of keys gives at a moment: the numbers of the keys round it, eased; a value of the last before. */
		function keyed (keys, at, path) {
			var sorted = keys.slice().sort(function (a, b) {
				return number(a.At, 0) - number(b.At, 0);
			});
			var made = {};
			var i = 0;
			var from;
			var to;
			var t;

			if (!sorted.length) return made;

			while (i < sorted.length - 1 && number(sorted[i + 1].At, 0) <= at)
				i++;

			/* Before the first key: the first; past the last: the last; between two: how far from one to the next. */
			from = sorted[i];
			to = at <= number(from.At, 0) || i === sorted.length - 1 ? from : sorted[i + 1];
			t = to === from ? 0 : Math.min(1, (at - number(from.At, 0)) / Math.max(1e-6, number(to.At, 0) - number(from.At, 0)));

			var e = eased(t, to.Ease || from.Ease || 'smooth');

			Object.keys(from).concat(Object.keys(to)).forEach(function (key) {
				var a = from[key];
				var b = to[key] === undefined ? a : to[key];

				if (key === 'At' || key === 'Ease' || made[key] !== undefined) return;

				if (typeof a === 'number' && typeof b === 'number') made[key] = a + (b - a) * e;
				else made[key] = t < 1 ? a : b;
			});

			/* The place along a curve through the keys (Catmull-Rom), not in straight lines from one to the next. */
			if (path !== 'linear' && to !== from) {
				['X', 'Y', 'Z'].forEach(function (axis) {
					var p0 = sorted[Math.max(0, i - 1)][axis];
					var p1 = from[axis];
					var p2 = to[axis];
					var p3 = sorted[Math.min(sorted.length - 1, i + 2)][axis];

					if (typeof p1 !== 'number' || typeof p2 !== 'number') return;

					p0 = typeof p0 === 'number' ? p0 : p1;
					p3 = typeof p3 === 'number' ? p3 : p2;

					made[axis] = 0.5 * (2 * p1 + (-p0 + p2) * e + (2 * p0 - 5 * p1 + 4 * p2 - p3) * e * e + (-p0 + 3 * p1 - 3 * p2 + p3) * e * e * e);
				});
			}

			return made;
		}

		/* The last key at or before a moment ({} before the first). */
		function last (keys, at) {
			var made = null;

			keys.forEach(function (key) {
				if (number(key.At, 0) <= at && (!made || number(key.At, 0) >= number(made.At, 0)))
					made = key;
			});

			return made;
		}

		function lengthOf (cutscene) {
			var most = number(cutscene.Length, 0);

			(cutscene.Tracks || []).forEach(function (track) {
				(track.Keys || []).concat(track.Items || []).forEach(function (one) {
					most = Math.max(most, number(one.At, 0) + number(one.Length, 0) + number(one.Fly, 0));
				});

				if (track.Type === 'orbit')
					most = Math.max(most, number(track.At, 0) + number(track.Length, 0));
			});

			return most;
		}

		/* The numbers of an object set as a move sets them: a camera's at once (it has no body to make again), another's by Change. */
		function setOn (id, values) {
			var object = scene.Objects[id];
			var changes = {};

			if (!object) return;

			Object.keys(values).forEach(function (key) {
				if (object.Kind === 'camera') {
					if (/^(X|Y|Z)$/.test(key)) object.Values[key] = values[key];
					else if (object.Traits && object.Traits.Camera) object.Traits.Camera[key] = values[key];
				}
				else {
					changes[key] = values[key];
				}
			});

			if (Object.keys(changes).length)
				self.Change(id, changes);
		}

		/* What the tracks set at a moment: the cameras, what moves, and the layer. */
		function apply (playing, at) {
			var view = {Fade: 0, FadeColor: '#000000', Letterbox: 0, Ratio: 2.39, Titles: [], Subtitle: null};

			(playing.Cutscene.Tracks || []).forEach(function (track) {
				var key;

				if (track.Type === 'camera') {
					key = last(track.Keys || [], at);

					if (key && key.Camera && self.Camera !== key.Camera) {
						if (engine.UseCamera)
							engine.UseCamera(key.Camera, {Fly: key.Fly});

						self.Camera = key.Camera;
					}
				}
				else if (track.Type === 'move' && track.ID) {
					setOn(track.ID, keyed(track.Keys || [], at, track.Path));
				}
				else if (track.Type === 'orbit' && track.ID) {
					var start = number(track.At, 0);
					var span = Math.max(1e-6, number(track.Length, 1));
					var part = Math.max(0, Math.min(1, (at - start) / span));
					var round = typeof track.Around === 'string' ? scene.Objects[track.Around] : null;
					var middle = round && round.World ? round.World : Array.isArray(track.Around) ? [number(track.Around[0], 0), number(track.Around[1], 0), number(track.Around[2], 0)] : [0, 0, 0];
					var turn = (number(track.From, 0) + (number(track.To, 360) - number(track.From, 0)) * eased(part, track.Ease || 'linear')) * Math.PI / 180;
					var radius = number(track.Radius, 10);
					var place = [middle[0] + Math.sin(turn) * radius, middle[1] + number(track.Height, 2), middle[2] + Math.cos(turn) * radius];
					var look = [middle[0] - place[0], middle[1] + (round ? (round.Size || 1) * 0.6 : 0) - place[1], middle[2] - place[2]];

					if (at >= start)
						setOn(track.ID, {X: place[0], Y: place[2], Z: place[1], Yaw: Math.atan2(look[0], look[2]) * 180 / Math.PI, Pitch: Math.atan2(look[1], Math.hypot(look[0], look[2])) * 180 / Math.PI});
				}
				else if (track.Type === 'fade') {
					key = keyed(track.Keys || [], at);
					view.Fade = number(key.Value, 0);
					view.FadeColor = key.Color || view.FadeColor;
				}
				else if (track.Type === 'letterbox') {
					key = keyed(track.Keys || [], at);
					view.Letterbox = number(key.Value, 0);
					view.Ratio = number(key.Ratio, 2.39);
				}
				else if (track.Type === 'title' || track.Type === 'subtitle') {
					(track.Items || []).forEach(function (item) {
						if (at >= number(item.At, 0) && at < number(item.At, 0) + number(item.Length, 3)) {
							var shown = Object.assign({}, item, {Since: at - number(item.At, 0)});

							if (track.Type === 'title') view.Titles.push(shown);
							else view.Subtitle = shown;
						}
					});
				}
			});

			return view;
		}

		/* The cues and the clips whose moments passed from one time to the next, in their order. */
		function passed (playing, from, to) {
			var due = [];

			(playing.Cutscene.Tracks || []).forEach(function (track) {
				if (track.Type !== 'cue' && track.Type !== 'clip') return;

				(track.Items || []).forEach(function (item) {
					var at = number(item.At, 0);
					if (at >= from && at < to || from === 0 && at === 0 && to === 0)
						due.push({Track: track.Type, Item: item, At: at});
				});
			});

			due.sort(function (a, b) {
				return a.At - b.At;
			}).forEach(function (one) {
				if (one.Track === 'cue') self.$Emit('cue', {Cutscene: playing.Name, Name: one.Item.Name, Data: one.Item.Data === undefined ? null : one.Item.Data, At: one.At});
				else if (one.Item.ID && one.Item.Clip) self.Play(one.Item.ID, one.Item.Clip);
			});
		}

		/* A title as it shows at a moment of it: typed so far, faded in and out. */
		function titleOf (item, typed) {
			var text = String(item.Text || '');
			var since = item.Since;
			var typing = number(item.Typing, 0);
			var fadeIn = number(item.In, 0.5);
			var fadeOut = number(item.Out, 0.5);
			var length = number(item.Length, 3);
			var opacity = Math.min(fadeIn > 0 ? since / fadeIn : 1, fadeOut > 0 ? (length - since) / fadeOut : 1);

			return {Text: typing > 0 ? text.slice(0, Math.floor(since * typing)) : text, Whole: text, Opacity: Math.max(0, Math.min(1, opacity)), Typed: typed};
		}

		function escaped (value) {
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		/* The layer as a view of it says: written again only when what it shows changed. */
		function show (view) {
			var parts = layer();
			var titles;
			var subtitle;
			var key;
			var bar;

			if (!parts) return;

			titles = view.Titles.map(function (item) {
				var made = titleOf(item);

				return '<div class="elemenx-scene-cinema-title" data-kind="' + escaped(item.Kind || 'title') + '" data-place="' + escaped(item.Place || 'center') + '" style="opacity: ' + made.Opacity.toFixed(3) + '"><span class="elemenx-scene-cinema-title-text">' + escaped(made.Text).replace(/\n/g, '<br>') + '</span></div>';
			}).join('');

			subtitle = view.Subtitle ? '<div class="elemenx-scene-cinema-subtitle">' + (view.Subtitle.Speaker ? '<span class="elemenx-scene-cinema-speaker">' + escaped(view.Subtitle.Speaker) + '</span>' : '') + '<span class="elemenx-scene-cinema-line">' + escaped(titleOf(view.Subtitle).Text) + '</span></div>' : '';

			bar = Math.max(0, Math.min(1, view.Letterbox)) * Math.max(0, (1 - (scene.Width / Math.max(1, scene.Height)) / Math.max(0.5, view.Ratio)) / 2) * 100;
			key = view.Fade.toFixed(3) + view.FadeColor + bar.toFixed(2) + titles + subtitle;

			if (key === state.Shown) return;

			state.Shown = key;
			parts.Fade.style.opacity = String(Math.max(0, Math.min(1, view.Fade)));
			parts.Fade.style.background = view.FadeColor;
			parts.Top.style.height = bar.toFixed(3) + '%';
			parts.Bottom.style.height = bar.toFixed(3) + '%';

			/* The titles stay in the picture between the bars; a subtitle sits on the bar under it, as in a film. */
			parts.Titles.style.top = bar.toFixed(3) + '%';
			parts.Titles.style.bottom = bar.toFixed(3) + '%';

			if (parts.Titles.innerHTML !== titles)
				parts.Titles.innerHTML = titles;

			if (parts.Subtitles.innerHTML !== subtitle)
				parts.Subtitles.innerHTML = subtitle;

			parts.Root.classList.toggle('shown', view.Fade > 0 || bar > 0 || !!titles || !!subtitle);
		}

		/*
		 * SceneCinema: recording. Each frame drawn is laid with what lies over it (the layer of the cinema; the HUD with Hud)
		 * on a canvas of its own, which a MediaRecorder takes as a video: the titles of HTML are in it too. What lies over it is
		 * made a picture (Rasterize) only when it changed.
		 */
		function recorder (options, callback) {
			var settings = options || {};
			var canvas = self.$Element().querySelector('canvas');
			var made = document.createElement('canvas');
			var context = made.getContext('2d');
			var types = [settings.Type, 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
			var type = '';
			var chunks = [];
			var media;
			var stream;
			var handle;
			var over = {Key: null, Picture: null, Busy: false};
			var hud = {Key: null, Picture: null, Busy: false};
			var done = false;
			var every = 1000 / Math.max(1, number(settings.Fps, 30));
			var given = -Infinity;
			var i;

			if (typeof MediaRecorder === 'undefined' || !made.captureStream) {
				callback(new Error('Elemenx Scene: this browser cannot record a video'), null);

				return null;
			}

			for (i = 0; i < types.length; i++) {
				if (types[i] && MediaRecorder.isTypeSupported(types[i])) {
					type = types[i];

					break;
				}
			}

			made.width = canvas.width;
			made.height = canvas.height;

			/* Its frames given one by one, as they are drawn (no more than Fps a second): a stream that took them by itself now and then had none. */
			context.drawImage(canvas, 0, 0, made.width, made.height);

			stream = made.captureStream(0);
			media = new MediaRecorder(stream, Object.assign({mimeType: type}, settings.Bitrate ? {videoBitsPerSecond: number(settings.Bitrate, 8000000)} : {}));

			media.ondataavailable = function (event) {
				if (event.data && event.data.size)
					chunks.push(event.data);
			};

			media.onstop = function () {
				callback(null, new Blob(chunks, {type: type || 'video/webm'}));
			};

			media.start(250);

			if (stream.getVideoTracks()[0] && stream.getVideoTracks()[0].requestFrame)
				stream.getVideoTracks()[0].requestFrame();

			/* A layer of HTML as a picture, made again when what it shows changed; the last one stays until the next came. */
			function layered (element, kept, key) {
				if (!element || kept.Busy || kept.Key === key || !engine.Rasterize) return;

				kept.Busy = true;

				engine.Rasterize(element, Math.max(1, element.offsetWidth), Math.max(1, element.offsetHeight), function (error, picture) {
					kept.Busy = false;
					kept.Key = key;
					kept.Picture = error ? null : picture;
				});
			}

			handle = {
				Canvas: made,
				Frames: 0,
				Frame: function () {
					var root = self.$Element();
					var cinema = root.querySelector('.elemenx-scene-cinema');
					var shown = cinema && cinema.classList.contains('shown');
					var heads = settings.Hud ? root.querySelector('.elemenx-scene-hud') : null;

					if (made.width !== canvas.width || made.height !== canvas.height) {
						made.width = canvas.width;
						made.height = canvas.height;
					}

					context.drawImage(canvas, 0, 0, made.width, made.height);

					handle.Frames++;

					if (heads && heads.innerHTML) {
						layered(heads, hud, heads.innerHTML + heads.offsetWidth);

						if (hud.Picture)
							context.drawImage(hud.Picture, 0, 0, made.width, made.height);
					}

					if (settings.Overlay !== false && shown) {
						layered(cinema, over, state.Shown + cinema.offsetWidth);

						if (over.Picture && over.Key === state.Shown + cinema.offsetWidth)
							context.drawImage(over.Picture, 0, 0, made.width, made.height);
					}

					var moment = typeof performance !== 'undefined' ? performance.now() : Date.now();
					var track = stream.getVideoTracks()[0];

					if (track && track.requestFrame && moment - given >= every * 0.9) {
						given = moment;

						track.requestFrame();
					}
				},
				Stop: function () {
					if (done) return;

					done = true;
					state.Recordings = state.Recordings.filter(function (one) {
						return one !== handle;
					});

					if (media.state === 'inactive') return;

					/*
					 * An encoder that is slow (a busy machine) may not have given a piece yet: it is asked for one, and the
					 * recording ends once one came (or after three seconds), so a short video is never empty.
					 */
					if (chunks.length) {
						media.stop();

						return;
					}

					var waited = Date.now();
					var ask = function () {
						if (media.state === 'inactive') return;

						if (chunks.length || Date.now() - waited > 3000) {
							media.stop();

							return;
						}

						if (stream.getVideoTracks()[0] && stream.getVideoTracks()[0].requestFrame)
							stream.getVideoTracks()[0].requestFrame();

						media.requestData();

						window.setTimeout(ask, 100);
					};

					ask();
				},
				Recording: function () {
					return !done;
				}
			};

			state.Recordings.push(handle);

			return handle;
		}

		engine.RecordStart = recorder;

		/* Each recording takes the frame just drawn. */
		engine.RecordFrame = function () {
			state.Recordings.forEach(function (one) {
				one.Frame();
			});
		};

		function finish (stopped) {
			var playing = state.Playing;
			if (!playing) return;

			state.Playing = null;

			/* A cutscene recorded gives its video with its end, when the recording has it whole. */
			if (playing.Recording) {
				var callback = playing.Callback;

				playing.Callback = null;
				playing.Recorded = function (error, video) {
					if (callback)
						callback(error, {Name: playing.Name, Stopped: !!stopped, Video: video});
				};

				playing.Recording.Stop();
			}

			if (playing.Cutscene.Restore !== false && playing.Camera !== undefined) {
				if (engine.UseCamera)
					engine.UseCamera(playing.Camera, {});

				self.Camera = playing.Camera;
			}

			show(state.Own || {Fade: 0, FadeColor: '#000000', Letterbox: 0, Ratio: 2.39, Titles: [], Subtitle: null});

			self.$Emit('cutscene', {Name: playing.Name, State: stopped ? 'stop' : 'end'});

			if (playing.Callback)
				playing.Callback(null, {Name: playing.Name, Stopped: !!stopped});
		}

		/* A step of the cutscene playing, before the camera is placed (what moves it is set first). */
		engine.CinemaStep = function (elapsed) {
			var playing = state.Playing;
			var from;

			if (!playing) return;

			from = playing.Time;

			if (!playing.Paused)
				playing.Time = Math.min(playing.Length, playing.Time + Math.max(0, elapsed));

			if (playing.Time > from || from === 0 && !playing.Started)
				passed(playing, from, playing.Time === playing.Length ? playing.Length + 1e-6 : playing.Time);

			playing.Started = true;

			show(apply(playing, playing.Time));

			if (playing.Time >= playing.Length && !playing.Paused) {
				if (playing.Cutscene.Loop) {
					playing.Time = 0;
					playing.Started = false;
				}
				else {
					finish(false);
				}
			}
		};

		engine.CinemaPlay = function (cutscene, callback) {
			var name = typeof cutscene === 'string' ? cutscene : cutscene && cutscene.Name || '';
			var given = typeof cutscene === 'string' ? (self.Cutscenes || {})[cutscene] : cutscene;

			if (!given || !Array.isArray(given.Tracks)) {
				if (callback)
					callback(new Error('Elemenx Scene: no cutscene ' + name), null);

				return;
			}

			if (state.Playing)
				finish(true);

			state.Playing = {Name: name, Cutscene: given, Time: 0, Length: lengthOf(given), Paused: false, Camera: self.Camera || '', Callback: callback || null, Started: false};

			/* Record: the cutscene as a video too ({Fps, Type, Bitrate, Hud, Overlay}, or true), given to the callback as Video. */
			if (given.Record) {
				var playing = state.Playing;

				playing.Recording = recorder(given.Record === true ? {} : given.Record, function (error, video) {
					if (playing.Recorded)
						playing.Recorded(error, video);
				});
			}

			self.$Emit('cutscene', {Name: name, State: 'start'});
		};

		engine.CinemaStop = function () {
			finish(true);
		};

		engine.CinemaPause = function (on) {
			if (state.Playing)
				state.Playing.Paused = on !== false;
		};

		engine.CinemaSeek = function (seconds) {
			var playing = state.Playing;
			if (!playing) return;

			playing.Time = Math.max(0, Math.min(playing.Length, number(seconds, 0)));
			playing.Started = true;

			show(apply(playing, playing.Time));
		};

		engine.CinemaState = function () {
			var playing = state.Playing;

			return playing ? {Name: playing.Name, Time: playing.Time, Length: playing.Length, Paused: playing.Paused} : null;
		};

		/* The layer set by hand: a fade, the bars, a title, a subtitle (none while a cutscene plays: it has the layer). */
		engine.CinemaLayer = function (given) {
			var own = given ? {Fade: number(given.Fade, 0), FadeColor: given.FadeColor || '#000000', Letterbox: number(given.Letterbox, 0), Ratio: number(given.Ratio, 2.39), Titles: given.Title ? [Object.assign({Since: number(given.Title.Since, 99), In: 0, Length: 1e9}, given.Title)] : [], Subtitle: given.Subtitle ? Object.assign({Since: 99, Length: 1e9}, given.Subtitle) : null} : null;

			state.Own = own;

			if (!state.Playing)
				show(own || {Fade: 0, FadeColor: '#000000', Letterbox: 0, Ratio: 2.39, Titles: [], Subtitle: null});
		};

		engine.CinemaSkip = function () {
			if (!state.Playing || state.Playing.Cutscene.Skip === false) return false;

			finish(true);

			return true;
		};
	},

	PlayCutscene: function (cutscene, callback) {
		this.Engine().CinemaPlay(cutscene, callback);
	},

	StopCutscene: function () {
		this.Engine().CinemaStop();
	},

	PauseCutscene: function (on) {
		this.Engine().CinemaPause(on);
	},

	SeekCutscene: function (seconds) {
		this.Engine().CinemaSeek(seconds);
	},

	Cutscene: function () {
		return this.Engine().CinemaState();
	},

	/*
	 * Records what the scene shows as a video ({Fps (30), Type (a type of MediaRecorder; webm by default), Bitrate, Overlay
	 * (true: the layer of the cinema in it), Hud (false: the HUD too)}): {Stop(), Recording(), Canvas}; callback(error, Blob)
	 * once it is stopped. Frames come as the scene draws them (Frames counts them).
	 */
	Record: function (options, callback) {
		return this.Engine().RecordStart(options || {}, callback || function () {});
	},

	Cinema: function (given) {
		this.Engine().CinemaLayer(given || null);
	},

	/* Escape ends a cutscene that can be skipped. */
	CinemaKey: function (event) {
		var engine = this.Engine();

		return !!(event && event.key === 'Escape' && engine && engine.CinemaSkip && engine.CinemaSkip());
	}
});
