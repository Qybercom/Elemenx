/*
 * An editor of the cutscenes of a Scene (SceneCinema) on a line of time (Timeline): each track a lane, its keys and its
 * items ranges on it (dragged in time, a title or a subtitle by its edges too), the playhead the moment shown in the Scene
 * (a press on the line goes there), the fields of the one selected beside it.
 *
 * Value is the cutscenes by name ({Name: {Tracks, Restore, Skip, Loop}}, as Cutscenes of the Scene); change emits them
 * after each edit. Scene is the Scene they play in (the component): Play shows the cutscene from the playhead, Record
 * plays it from its start as a video and gives the file (record {Name, Video}). Target is the object a move or a cut goes
 * to by default (the selection of an editor). Camera from view asks for a camera where the view of the Scene is (camera
 * {Props}); Key from view keys the move of the Target there, at the playhead.
 * Methods: Cutscene() (the one edited), Add(type), Remove(), Preview(seconds), Play(), Stop(), Record().
 */
Elemenx.Component('CutsceneEditor', {
	$TemplateURL: 'CutsceneEditor.html',
	$StyleURL: 'CutsceneEditor.css',
	$Meta: {
		Group: 'game',
		Icon: 'video',
		Description: 'An editor of the cutscenes of a Scene on a line of time: tracks, keys, titles, preview and recording.',
		Events: {
			change: 'The cutscenes changed: {Name: {Tracks...}}.',
			camera: 'Camera from view was pressed: {Props} of a camera where the view is.',
			record: 'A recording ended: {Name, Video (a Blob)}.'
		},
		Methods: ['Cutscene()', 'Add(type)', 'Remove()', 'Preview(seconds)', 'Play()', 'Stop()', 'Record()'],
		Props: {
			Value: 'The cutscenes by name: {Name: {Tracks, Restore, Skip, Loop}}.',
			Scene: 'The Scene (the component) they play in.',
			Target: 'The object a move or a cut goes to by default.',
			Label: 'What it shows, for screen readers.'
		}
	},
	Value: null,
	Scene: null,
	Target: '',
	Label: '',
	Current: '',
	Time: 0,
	Selected: '',
	Playing: false,
	Version: 0,

	/* The track types it adds, and the fields of what each holds. */
	Types: ['camera', 'move', 'orbit', 'fade', 'letterbox', 'title', 'subtitle', 'cue', 'clip'],
	FieldsOf: {
		camera: ['At', 'Camera', 'Fly'],
		move: ['At', 'X', 'Y', 'Z', 'Yaw', 'Pitch', 'Roll', 'Focal', 'Focus', 'Aperture', 'Ease'],
		orbit: ['ID', 'At', 'Length', 'Around', 'Radius', 'Height', 'From', 'To'],
		fade: ['At', 'Value', 'Color'],
		letterbox: ['At', 'Value', 'Ratio'],
		title: ['At', 'Length', 'Text', 'Kind', 'Place', 'Typing', 'In', 'Out'],
		subtitle: ['At', 'Length', 'Text', 'Speaker'],
		cue: ['At', 'Name', 'Data'],
		clip: ['At', 'ID', 'Clip']
	},

	$OnCreate: function () {
		var self = this;

		this.Own = function () {
			return self.State || (self.State = {Watch: null});
		};
	},

	$OnDestroy: function () {
		this.Watching(false);
	},

	Names: function () {
		return Object.keys(this.Value || {});
	},

	/* The name edited: the one picked, else the first. */
	Name: function () {
		var names = this.Names();

		return names.indexOf(this.Current) >= 0 ? this.Current : names[0] || '';
	},

	Cutscene: function () {
		var name = this.Name();

		return name ? (this.Value || {})[name] : null;
	},

	/* Its cutscenes with this one changed by a function of a copy of it, emitted. */
	Edit: function (change) {
		var all = JSON.parse(JSON.stringify(this.Value || {}));
		var name = this.Name();
		if (!name || !all[name]) return;

		change(all[name], all);

		this.Value = all;
		this.Version++;

		this.$Emit('change', all);

		if (this.Scene && this.Scene.Cutscene && this.Scene.Cutscene() && !this.Playing)
			this.Preview(this.Time);
	},

	/* What a track holds, each a range on its lane: keys and items, an orbit as one. */
	Pieces: function (track) {
		if (track.Type === 'orbit') return [track];

		return track.Keys || track.Items || [];
	},

	Lanes: function () {
		var cutscene = this.Cutscene();

		return (cutscene ? cutscene.Tracks || [] : []).map(function (track, index) {
			return {ID: 't' + index, Label: track.Type + (track.ID ? ' · ' + track.ID : '')};
		});
	},

	Ranges: function () {
		var self = this;
		var cutscene = this.Cutscene();
		var made = [];

		(cutscene ? cutscene.Tracks || [] : []).forEach(function (track, t) {
			self.Pieces(track).forEach(function (one, i) {
				var at = Number(one.At) || 0;
				var length = track.Type === 'orbit' || track.Type === 'title' || track.Type === 'subtitle' ? Number(one.Length) || 3 : 0.15;

				made.push({ID: t + ':' + i, From: at, To: at + length, Lane: 't' + t, Label: String(one.Text || one.Camera || one.Name || one.Clip || (one.Value !== undefined ? one.Value : '') || track.Type), Tone: self.Selected === t + ':' + i ? 'accent' : ''});
			});
		});

		return made;
	},

	/* The end of the line: the cutscene and a little more, ten seconds at least. */
	End: function () {
		var end = 10;

		this.Ranges().forEach(function (range) {
			end = Math.max(end, range.To + 2);
		});

		return end;
	},

	/* The one selected: {Track, Index, One, Fields} or null. */
	Piece: function () {
		var cutscene = this.Cutscene();
		var parts = String(this.Selected || '').split(':');
		var track = cutscene && cutscene.Tracks ? cutscene.Tracks[Number(parts[0])] : null;
		var one = track ? this.Pieces(track)[Number(parts[1])] : null;
		if (!one)
			return null;

		return {Track: track, TrackIndex: Number(parts[0]), Index: Number(parts[1]), One: one, Fields: (this.FieldsOf[track.Type] || ['At']).map(function (key) {
			return {Key: key, Value: one[key] === undefined || one[key] === null ? '' : typeof one[key] === 'object' ? JSON.stringify(one[key]) : String(one[key])};
		})};
	},

	Picked: function (event) {
		var name = event && event.target ? event.target.value : '';

		this.Current = name;
		this.Selected = '';
		this.Version++;
	},

	/* A new cutscene, named after the ones before it. */
	Created: function () {
		var all = JSON.parse(JSON.stringify(this.Value || {}));
		var index = 1;

		while (all['cutscene-' + index])
			index++;

		all['cutscene-' + index] = {Tracks: [], Restore: true, Skip: true};

		this.Value = all;
		this.Current = 'cutscene-' + index;
		this.Selected = '';
		this.Version++;

		this.$Emit('change', all);
	},

	Deleted: function () {
		var all = JSON.parse(JSON.stringify(this.Value || {}));

		delete all[this.Name()];

		this.Value = all;
		this.Current = '';
		this.Selected = '';
		this.Version++;

		this.$Emit('change', all);
	},

	/* The camera and the view of the Scene: where it stands, its yaw and pitch in degrees. */
	View: function () {
		var view = this.Scene && this.Scene.Viewpoint ? this.Scene.Viewpoint() : null;
		var way;

		if (!view || !view.Eye) return null;

		way = [view.Target[0] - view.Eye[0], view.Target[1] - view.Eye[1], view.Target[2] - view.Eye[2]];

		return {X: Math.round(view.Eye[0] * 100) / 100, Y: Math.round(view.Eye[2] * 100) / 100, Z: Math.round(view.Eye[1] * 100) / 100, Yaw: Math.round(Math.atan2(way[0], way[2]) * 1800 / Math.PI) / 10, Pitch: Math.round(Math.atan2(way[1], Math.hypot(way[0], way[2])) * 1800 / Math.PI) / 10};
	},

	/* A key or an item of a type at the playhead, in the track of that type (of the Target for a move), made if none is. */
	Add: function (type) {
		var self = this;
		var at = Math.round(this.Time * 20) / 20;
		var target = this.Target || '';
		var view = this.View();

		this.Edit(function (cutscene) {
			var tracks = cutscene.Tracks = cutscene.Tracks || [];
			var track = null;
			var made;
			var index;

			tracks.some(function (one) {
				if (one.Type === type && (type !== 'move' || one.ID === target)) {
					track = one;

					return true;
				}

				return false;
			});

			if (type === 'orbit') {
				tracks.push({Type: 'orbit', ID: target, At: at, Length: 6, Around: '', Radius: 10, Height: 2, From: 0, To: 180});

				self.Selected = (tracks.length - 1) + ':0';

				return;
			}

			if (!track) {
				track = {Type: type};

				if (type === 'move')
					track.ID = target;

				tracks.push(track);
			}

			made = {
				camera: {At: at, Camera: target, Fly: 0},
				move: Object.assign({At: at}, view || {}),
				fade: {At: at, Value: 1, Color: '#000000'},
				letterbox: {At: at, Value: 1, Ratio: 2.39},
				title: {At: at, Length: 3, Text: 'Title', Kind: 'title', Place: 'center', Typing: 0, In: 0.5, Out: 0.5},
				subtitle: {At: at, Length: 3, Text: '…', Speaker: ''},
				cue: {At: at, Name: 'cue', Data: null},
				clip: {At: at, ID: target, Clip: 'idle'}
			}[type];

			if (/^(camera|move|fade|letterbox)$/.test(type)) (track.Keys = track.Keys || []).push(made);
			else (track.Items = track.Items || []).push(made);

			index = self.Pieces(track).length - 1;
			self.Selected = tracks.indexOf(track) + ':' + index;
		});
	},

	Added: function (event) {
		var type = event && event.target ? event.target.value : '';
		if (type)
			this.Add(type);

		if (event && event.target)
			event.target.value = '';
	},

	/* The one selected taken away; its track too when nothing is left in it. */
	Remove: function () {
		var piece = this.Piece();
		var self = this;

		if (!piece) return;

		this.Edit(function (cutscene) {
			var track = cutscene.Tracks[piece.TrackIndex];
			var list = track.Type === 'orbit' ? null : track.Keys || track.Items;
			if (list)
				list.splice(piece.Index, 1);

			if (!list || !list.length)
				cutscene.Tracks.splice(piece.TrackIndex, 1);

			self.Selected = '';
		});
	},

	Chosen: function (event) {
		var detail = event && event.detail ? event.detail : event;

		this.Selected = detail && detail.ID ? String(detail.ID) : '';
		this.Version++;
	},

	/* A range dragged or resized: its moment, the length of what has one. */
	Moved: function (event) {
		var detail = event && event.detail ? event.detail : event;
		var parts = String(detail.ID || '').split(':');
		var self = this;

		this.Edit(function (cutscene) {
			var track = cutscene.Tracks[Number(parts[0])];
			var one = track ? self.Pieces(track)[Number(parts[1])] : null;
			if (!one) return;

			one.At = Math.max(0, Math.round(Number(detail.From) * 20) / 20);

			if ((track.Type === 'title' || track.Type === 'subtitle' || track.Type === 'orbit') && detail.To !== undefined)
				one.Length = Math.max(0.1, Math.round((Number(detail.To) - Number(detail.From)) * 20) / 20);
		});
	},

	/* A field of the one selected: a number where it reads as one, JSON where it is one, else text. */
	Fielded: function (event) {
		var key = event.target.getAttribute('data-field');
		var text = event.target.value;
		var piece = this.Piece();
		var value = text;
		var self = this;

		if (!piece || !key) return;

		if (text === '') {
			value = undefined;
		}
		else if (/^-?\d+(\.\d+)?$/.test(text.trim())) {
			value = Number(text);
		}
		else if (/^[[{]/.test(text.trim())) {
			try {
				value = JSON.parse(text);
			}
			catch (error) {
				value = text;
			}
		}

		this.Edit(function (cutscene) {
			var one = self.Pieces(cutscene.Tracks[piece.TrackIndex])[piece.Index];

			if (value === undefined) delete one[key];
			else one[key] = value;
		});
	},

	/* The move of the Target keyed where the view is, at the playhead. */
	Keyed: function () {
		this.Add('move');
	},

	CameraFromView: function () {
		var view = this.View();
		if (view)
			this.$Emit('camera', {Props: {X: view.X, Y: view.Y, Z: view.Z, Yaw: view.Yaw, Pitch: view.Pitch, Focal: 35}});
	},

	/* The Scene at a moment of the cutscene, held there. */
	Preview: function (seconds) {
		var scene = this.Scene;
		var cutscene = this.Cutscene();
		var state;

		if (!scene || !cutscene || !scene.PlayCutscene) return;

		state = scene.Cutscene();

		if (!state || state.Name !== this.Name())
			scene.PlayCutscene(Object.assign({Name: this.Name()}, cutscene, {Loop: false}));

		scene.PauseCutscene(true);
		scene.SeekCutscene(Math.max(0, Number(seconds) || 0));

		this.Time = Math.max(0, Number(seconds) || 0);
	},

	Sought: function (event) {
		var detail = event && event.detail ? event.detail : event;

		this.Watching(false);

		this.Playing = false;

		this.Preview(detail ? detail.At : 0);
	},

	/* The playhead follows the cutscene as it plays, ten times a second. */
	Watching: function (on) {
		var own = this.Own();
		var self = this;

		if (own.Watch) {
			clearInterval(own.Watch);
			own.Watch = null;
		}

		if (!on) return;

		own.Watch = setInterval(function () {
			var state = self.Scene && self.Scene.Cutscene ? self.Scene.Cutscene() : null;

			if (!state) {
				self.Playing = false;

				self.Watching(false);

				return;
			}

			self.Time = Math.round(state.Time * 100) / 100;
		}, 100);
	},

	Play: function () {
		if (!this.Scene || !this.Cutscene()) return;

		this.Preview(this.Time >= this.Length() ? 0 : this.Time);
		this.Scene.PauseCutscene(false);

		this.Playing = true;

		this.Watching(true);
	},

	Stop: function () {
		if (this.Scene && this.Scene.StopCutscene)
			this.Scene.StopCutscene();

		this.Playing = false;

		this.Watching(false);
	},

	Toggled: function () {
		if (this.Playing) this.Stop();
		else this.Play();
	},

	Length: function () {
		var end = 0;

		this.Ranges().forEach(function (range) {
			end = Math.max(end, range.To);
		});

		return end;
	},

	/* Plays it from its start as a video: record {Name, Video}, and the file to save. */
	Record: function () {
		var self = this;
		var name = this.Name();
		var cutscene = this.Cutscene();
		if (!this.Scene || !cutscene) return;

		this.Stop();

		this.Recording = true;

		this.Scene.PlayCutscene(Object.assign({Name: name}, cutscene, {Loop: false, Record: {Fps: 30}}), function (error, result) {
			var link;

			self.Recording = false;

			if (error || !result || !result.Video) return;

			self.$Emit('record', {Name: name, Video: result.Video});

			if (typeof URL !== 'undefined' && URL.createObjectURL) {
				link = document.createElement('a');
				link.href = URL.createObjectURL(result.Video);
				link.download = name + '.webm';

				link.click();

				setTimeout(function () {
					URL.revokeObjectURL(link.href);
				}, 10000);
			}
		});
	},

	Recording: false
});
