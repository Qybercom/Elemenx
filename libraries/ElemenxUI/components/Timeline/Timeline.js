/*
 * A line of time: its scale (ticks with their labels, chosen for the span in view: seconds to centuries, or numbers),
 * its marks (a moment with a label above or under it: the labels of marks close together stack in rows instead of
 * covering each other, a thin leader to their point), its ranges (from a moment to another, in lanes with their labels
 * at the start, as a Gantt chart has them; the ones that overlap in rows of their lane), its progress (filled up to a
 * moment, and a lighter Buffer) and a playhead, and the line of now.
 *
 * Start and End are the whole line; From and To the part in view (all of it by default). Scale: time (dates: YYYY-MM-DD,
 * YYYY-MM-DDTHH:mm, a Date, milliseconds) or number (seconds of a video, steps: Unit names them, Format writes them);
 * by default the one of Start. Orientation horizontal or vertical. Marks [{ID, At, Label, Text, Icon, Tone, Side,
 * Element, Render}], Ranges [{ID, From, To, Label, Tone, Color, Lane, Element, Render}], Lanes [{ID, Label}], Progress
 * (a moment, or {To, Buffer}), Playhead (a moment; Seekable shows it and lets it be moved), Now (the line of now). The
 * same declared inside it: TimelineMark, TimelineRange (any content inside them is their label), TimelineLane,
 * TimelineProgress.
 *
 * Interaction: Ctrl (or ⌘) with the wheel, a pinch or the buttons (Controls) zoom at the pointer, between MinSpan and
 * the whole line; Shift with the wheel, a sideways wheel, a drag of the empty line or the middle button move it; the
 * arrows move it too, + and - zoom, 0 shows it all; a press on the axis seeks (Seekable: the playhead follows the
 * pointer). Marks and ranges are buttons: a press or Enter selects them, the arrows go from one to the next, a tip shows
 * them whole. Overview shows a strip of the whole line beside it, its marks and ranges small, a frame on the part in
 * view: a drag of the frame moves the view, a drag of an edge of it zooms, a press elsewhere on the strip centers the
 * view there. Editable: a mark or a range is dragged in time, a range by its edges too, a new range drawn on an empty
 * lane; Alt with the arrows moves the one with the focus, by Snap (minute, hour, day, week, month, year, or a number:
 * milliseconds or units of the scale; by default the step of the ticks). Escape cancels a drag. The Timeline does not
 * change its data itself: its events ask the owner to.
 *
 * Events: select ({Kind: mark or range, ID, Item}), seek ({At}), view ({From, To}), move ({Kind, ID, Item, At} of a
 * mark, {Kind, ID, Item, From, To} of a range), resize ({ID, Item, From, To}), create ({Lane, From, To}). The moments
 * it tells are of the kind of Start: a date (YYYY-MM-DD when its snap is a day or more) or a number.
 */
Elemenx.Component('Timeline', {
	$TemplateURL: 'Timeline.html',
	$StyleURL: 'Timeline.css',
	$Meta: {
		Group: 'data',
		Icon: 'clock',
		Description: 'A line of time: its scale, marks with labels that stack when they are close, ranges in lanes, a progress and a playhead.',
		Container: true,
		Children: ['TimelineMark', 'TimelineRange', 'TimelineLane', 'TimelineProgress'],
		Events: {
			select: 'A mark or a range was pressed: {Kind (mark or range), ID, Item}.',
			seek: 'The line or the playhead was pressed or dragged: {At}.',
			view: 'The part in view changed: {From, To}.',
			move: 'A mark or a range was dragged: {Kind, ID, Item, At} for a mark, {Kind, ID, Item, From, To} for a range.',
			resize: 'An edge of a range was dragged: {ID, Item, From, To}.',
			create: 'A range was drawn on a lane: {Lane, From, To}.'
		},
		Props: {
			Start: 'The start of the line: a date (YYYY-MM-DD, YYYY-MM-DDTHH:mm) or a number.',
			End: 'The end of the line.',
			From: 'The start of the part in view (the start of the line by default).',
			To: 'The end of the part in view.',
			Scale: {Options: ['', 'time', 'number'], Description: 'time (dates) or number; by default the one of Start.'},
			Orientation: {Options: ['horizontal', 'vertical'], Description: 'horizontal or vertical.'},
			Marks: {Schema: {ID: 'text', At: 'text', Label: 'text', Icon: 'icon', Tone: 'text', Side: 'text'}, Description: 'The marks: [{ID, At, Label, Text, Icon, Tone, Side, Element, Render}].'},
			Ranges: {Schema: {ID: 'text', From: 'text', To: 'text', Label: 'text', Tone: 'text', Lane: 'text'}, Description: 'The ranges: [{ID, From, To, Label, Tone, Color, Lane, Element, Render}].'},
			Lanes: {Schema: {ID: 'text', Label: 'text'}, Description: 'The lanes of the ranges: [{ID, Label}].'},
			Progress: 'Filled up to a moment, or {To, Buffer}.',
			Playhead: 'The moment of the playhead.',
			Seekable: 'A press on the axis seeks, the playhead follows the pointer.',
			Now: 'Shows the line of now.',
			Editable: 'Marks and ranges are dragged in time, ranges by their edges, new ranges drawn on a lane.',
			Snap: 'The step of the moments of a drag: minute, hour, day, week, month, year, or a number.',
			MinSpan: 'The smallest span in view (milliseconds or units of the scale).',
			Unit: 'The unit of a number scale, after its numbers (s).',
			Format: 'A function (value, step) that writes the label of a tick.',
			Controls: 'Shows the buttons of the zoom.',
			Overview: 'Shows a strip of the whole line, a frame on the part in view that moves and zooms it.',
			Label: 'The name of the Timeline for screen readers.'
		},
		Sample: {Start: '2026-01-01', End: '2026-12-31', Marks: [{ID: 'release', At: '2026-06-01', Label: 'Release'}], Ranges: [{ID: 'beta', From: '2026-03-01', To: '2026-05-15', Label: 'Beta'}]}
	},
	Start: '',
	End: '',
	From: '',
	To: '',
	Scale: '',
	Orientation: 'horizontal',
	Marks: [],
	Ranges: [],
	Lanes: [],
	Progress: null,
	Playhead: null,
	Seekable: false,
	Now: false,
	Editable: false,
	Snap: '',
	MinSpan: 0,
	Unit: '',
	Format: null,
	Controls: true,
	Overview: false,
	Label: '',
	Selected: '',
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var units = {second: 1000, minute: 60000, hour: 3600000, day: 86400000, week: 604800000, month: 2629800000, year: 31557600000};
		var steps = [['second', 1], ['second', 5], ['second', 15], ['second', 30], ['minute', 1], ['minute', 5], ['minute', 15], ['minute', 30], ['hour', 1], ['hour', 3], ['hour', 6], ['hour', 12], ['day', 1], ['day', 2], ['week', 1], ['month', 1], ['month', 3], ['month', 6], ['year', 1], ['year', 2], ['year', 5], ['year', 10], ['year', 25], ['year', 50], ['year', 100]];
		var cache = {Arguments: null, Model: null};

		this.Units = units;

		/* The state of the line out of the reactive one: the drag, the pointers, the declarations, the custom labels. */
		this.Own = function () {
			return self.State || (self.State = {Pointers: {}, Declared: {Marks: [], Ranges: [], Lanes: [], Progress: null}, Contents: {}, Widths: {}, Size: {Main: 0, Cross: 0}, View: null});
		};

		/* The kind of the scale: the one asked, else number when Start is a number. */
		this.Kind = function () {
			if (self.Scale === 'number' || self.Scale === 'time') return self.Scale;

			return typeof self.Start === 'number' || /^-?\d+(\.\d+)?$/.test(String(self.Start)) ? 'number' : 'time';
		};

		/* A moment as a number: milliseconds on a time scale. */
		this.Value = function (value) {
			var text;
			var parts;

			if (value === null || value === undefined || value === '') return NaN;
			if (value instanceof Date) return value.getTime();
			if (typeof value === 'number') return value;

			text = String(value);

			if (self.Kind() === 'number' || /^-?\d+(\.\d+)?$/.test(text)) return Number(text);

			parts = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(text);

			if (!parts)
				return new Date(text).getTime();

			return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4] || 0), Number(parts[5] || 0), Number(parts[6] || 0)).getTime();
		};

		/* A moment told out: a date of the kind of Start (YYYY-MM-DD when its snap is a day or more), or a number. */
		this.Out = function (value) {
			var date;
			var pad = function (number) {
				return (number < 10 ? '0' : '') + number;
			};
			var day;

			if (self.Kind() === 'number')
				return Math.round(value * 1000) / 1000;

			if (self.Start instanceof Date) return new Date(value);
			if (typeof self.Start === 'number') return value;

			date = new Date(value);
			day = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());

			return self.SnapStep().Unit && ['day', 'week', 'month', 'year'].indexOf(self.SnapStep().Unit) !== -1 ? day : day + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
		};

		/* The step of the snap: {Unit, Count} of the calendar, or {Size} of milliseconds or units. */
		this.SnapStep = function () {
			var snap = self.Snap;
			var model = cache.Model;

			if (units[snap])
				return {Unit: snap, Count: 1};

			if (Number(snap) > 0)
				return {Size: Number(snap)};

			/* By default: the step of the ticks of the time in view (a day of day ticks, an hour of hour ticks...). */
			if (model && model.Step)
				return model.Step.Unit ? {Unit: model.Step.Unit === 'second' ? 'minute' : model.Step.Unit, Count: 1} : {Size: model.Step.Size / 5};

			return self.Kind() === 'number' ? {Size: 1} : {Unit: 'day', Count: 1};
		};

		this.Snapped = function (value) {
			var step = self.SnapStep();
			var date;

			if (step.Size)
				return Math.round(value / step.Size) * step.Size;

			date = new Date(value);

			if (step.Unit === 'year')
				return new Date(date.getFullYear() + (date.getMonth() >= 6 ? 1 : 0), 0, 1).getTime();

			if (step.Unit === 'month')
				return new Date(date.getFullYear(), date.getMonth() + (date.getDate() > 15 ? 1 : 0), 1).getTime();

			if (step.Unit === 'week' || step.Unit === 'day')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate() + (date.getHours() >= 12 ? 1 : 0)).getTime();

			return Math.round(value / units[step.Unit]) * units[step.Unit];
		};

		/* The span of the whole line, and of the part in view. */
		this.Whole = function () {
			var start = self.Value(self.Start);
			var end = self.Value(self.End);

			if (!isFinite(start))
				start = self.Kind() === 'number' ? 0 : new Date().setHours(0, 0, 0, 0);

			if (!isFinite(end) || end <= start)
				end = start + (self.Kind() === 'number' ? 100 : units.month);

			return {From: start, To: end};
		};

		this.Window = function () {
			var own = self.Own();
			var whole = self.Whole();
			var from;
			var to;

			/* A view zoomed into another line (its Start and End changed since) is let go. */
			if (own.View && (own.View.From < whole.From || own.View.To > whole.To))
				own.View = null;

			if (own.View)
				return own.View;

			from = self.Value(self.From);
			to = self.Value(self.To);

			return {From: isFinite(from) ? from : whole.From, To: isFinite(to) && to > (isFinite(from) ? from : whole.From) ? to : whole.To};
		};

		/* The ticks of the part in view: as many as fit MinTick pixels apart, labeled for their unit. */
		this.Ticks = function (from, to, length, vertical) {
			var span = to - from;
			var spacing = vertical ? 48 : 90;
			var wanted = span / Math.max(1, length / spacing);
			var language = Elemenx.Locale.Language() || undefined;
			var ticks = [];
			var step;
			var size;
			var power;
			var value;
			var cursor;
			var previous;
			var i;

			if (self.Kind() === 'number') {
				power = Math.pow(10, Math.floor(Math.log(wanted) / Math.LN10));
				size = [1, 2, 5, 10].map(function (factor) {
					return factor * power;
				}).filter(function (candidate) {
					return candidate >= wanted;
				})[0] || power * 10;

				for (value = Math.ceil(from / size) * size; value <= to && ticks.length < 500; value += size) {
					ticks.push({Value: value, Major: Math.abs(value / (size * 5) - Math.round(value / (size * 5))) < 1e-9, Label: typeof self.Format === 'function' ? self.Format(value, size) : Number(value.toFixed(10)).toLocaleString(language) + (self.Unit ? ' ' + self.Unit : '')});
				}

				return {Ticks: ticks, Step: {Size: size}};
			}

			step = steps.filter(function (candidate) {
				return units[candidate[0]] * candidate[1] >= wanted;
			})[0] || steps[steps.length - 1];

			cursor = self.Floor(from, step[0], step[1]);

			for (i = 0; cursor <= to && i < 500; i++) {
				if (cursor >= from)
					ticks.push(self.Tick(cursor, step[0], ticks.length ? previous : undefined, language));

				previous = cursor;
				cursor = self.Advance(cursor, step[0], step[1]);
			}

			return {Ticks: ticks, Step: {Unit: step[0], Count: step[1], Size: units[step[0]] * step[1]}};
		};

		/* The first tick of a unit at or before a moment. */
		this.Floor = function (value, unit, count) {
			var date = new Date(value);

			if (unit === 'year')
				return new Date(Math.floor(date.getFullYear() / count) * count, 0, 1).getTime();

			if (unit === 'month')
				return new Date(date.getFullYear(), Math.floor(date.getMonth() / count) * count, 1).getTime();

			if (unit === 'week')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7).getTime();

			if (unit === 'day')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDate() - 1) % count).getTime();

			if (unit === 'hour')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(date.getHours() / count) * count).getTime();

			return Math.floor(value / (units[unit] * count)) * units[unit] * count;
		};

		this.Advance = function (value, unit, count) {
			var date = new Date(value);

			if (unit === 'year')
				return new Date(date.getFullYear() + count, 0, 1).getTime();

			if (unit === 'month')
				return new Date(date.getFullYear(), date.getMonth() + count, 1).getTime();

			if (unit === 'week')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 * count).getTime();

			if (unit === 'day')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count).getTime();

			if (unit === 'hour')
				return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + count).getTime();

			return value + units[unit] * count;
		};

		/* A tick: major where the larger unit changes (a new day among hours, a month among days, a year among months). */
		this.Tick = function (value, unit, previous, language) {
			var date = new Date(value);
			var before = previous === undefined ? null : new Date(previous);
			var format = function (options) {
				return new Intl.DateTimeFormat(language, options).format(date);
			};
			var major;

			if (unit === 'year')
				return {Value: value, Major: date.getFullYear() % 10 === 0, Label: String(date.getFullYear())};

			if (unit === 'month') {
				major = !before || before.getFullYear() !== date.getFullYear();

				return {Value: value, Major: major, Label: major ? format({month: 'short', year: 'numeric'}) : format({month: 'short'})};
			}

			if (unit === 'day' || unit === 'week') {
				major = !before || before.getMonth() !== date.getMonth();

				return {Value: value, Major: major, Label: major ? format({day: 'numeric', month: 'short'}) : format({day: 'numeric'})};
			}

			major = !before || before.getDate() !== date.getDate();

			return {Value: value, Major: major, Label: major ? format({day: 'numeric', month: 'short'}) + ' ' + format({hour: '2-digit', minute: '2-digit'}) : format(unit === 'second' ? {hour: '2-digit', minute: '2-digit', second: '2-digit'} : {hour: '2-digit', minute: '2-digit'})};
		};

		/* A moment written for a tip or a name: a date and a time on a time scale, a number of the unit else. */
		this.Written = function (value) {
			var language = Elemenx.Locale.Language() || undefined;
			var date;

			if (self.Kind() === 'number')
				return (typeof self.Format === 'function' ? self.Format(value, 0) : Number(value.toFixed(3)).toLocaleString(language) + (self.Unit ? ' ' + self.Unit : ''));

			date = new Date(value);

			return new Intl.DateTimeFormat(language, date.getHours() || date.getMinutes() ? {dateStyle: 'medium', timeStyle: 'short'} : {dateStyle: 'medium'}).format(date);
		};

		/* Places along the line and across it, as styles: left and top of a horizontal line, top and left of a vertical one. */
		this.Place = function (main, cross, mainSize, crossSize) {
			var vertical = self.Orientation === 'vertical';
			var style = (vertical ? 'top:' : 'left:') + main + 'px;' + (vertical ? 'left:' : 'top:') + cross + 'px;';

			if (mainSize !== null && mainSize !== undefined)
				style += (vertical ? 'height:' : 'width:') + mainSize + 'px;';

			if (crossSize !== null && crossSize !== undefined)
				style += (vertical ? 'width:' : 'height:') + crossSize + 'px;';

			return style;
		};

		/* All its data: the one given and the one declared inside it. */
		this.Data = function () {
			var declared = self.Own().Declared;
			var progress = self.Progress !== null && self.Progress !== undefined && self.Progress !== '' ? self.Progress : declared.Progress;

			return {
				Marks: (self.Marks || []).concat(declared.Marks),
				Ranges: (self.Ranges || []).concat(declared.Ranges),
				Lanes: (self.Lanes || []).concat(declared.Lanes),
				Progress: progress && typeof progress === 'object' && !(progress instanceof Date) ? progress : {To: progress}
			};
		};

		/*
		 * The model of the drawing: the ticks, the marks with the rows of their labels, the ranges in their lanes, the
		 * progress, the playhead and now, the sizes of its parts. Made again only when what it is made of changes (a
		 * template calls it: Marks, Ranges, Lanes, Progress, Playhead and Version are its arguments).
		 */
		this.Model = function () {
			var args = Array.prototype.slice.call(arguments);
			var vertical = self.Orientation === 'vertical';
			var own = self.Own();
			var data;
			var view;
			var length;
			var header;
			var ticks;
			var position;
			var marks;
			var before;
			var after;
			var rowSize = 24;
			var labelColumn = 150;
			var axisSize = vertical ? 64 : 34;
			var laneSize = vertical ? 120 : 30;
			var lanes;
			var ranges;
			var cross;
			var progress;
			var model;

			if (cache.Arguments && cache.Arguments.length === args.length && cache.Arguments.every(function (value, index) {
				return value === args[index];
			})) return cache.Model;

			data = self.Data();
			view = self.Window();
			header = data.Lanes.some(function (lane) {
				return lane.Label;
			}) ? (vertical ? 36 : 150) : 0;
			length = Math.max(1, (vertical ? own.Size.Main - header : own.Size.Main - header) || 600);
			ticks = self.Ticks(view.From, view.To, length, vertical);
			position = function (value) {
				return (value - view.From) / (view.To - view.From) * length;
			};

			/* The marks, the preview of a drag in place of the one dragged; their labels in rows on each side. */
			marks = data.Marks.map(function (mark, index) {
				var id = String(mark.ID !== undefined && mark.ID !== null && mark.ID !== '' ? mark.ID : 'mark-' + index);
				var at = own.Drag && own.Drag.Kind === 'mark' && own.Drag.ID === id && own.Drag.At !== undefined ? own.Drag.At : self.Value(mark.At);

				return {ID: id, Item: mark, At: at, Pos: position(at), Side: mark.Side === 'before' ? 'before' : 'after', Label: mark.Label || '', Text: mark.Text || '', Icon: mark.Icon || '', Tone: mark.Tone || 'accent', Custom: own.Contents['mark:' + id] || (mark.Element || mark.Render ? mark : null)};
			}).filter(function (mark) {
				return isFinite(mark.At) && mark.Pos >= -1 && mark.Pos <= length + 1;
			}).sort(function (a, b) {
				return a.Pos - b.Pos;
			});

			before = [];
			after = [];

			marks.forEach(function (mark) {
				var rows = mark.Side === 'before' ? before : after;
				var extent = vertical ? 22 : (own.Widths['mark:' + mark.ID] || 16 + 7 * Math.max(4, mark.Label.length));
				var start = vertical ? mark.Pos - extent / 2 : Math.min(Math.max(0, mark.Pos - 8), Math.max(0, length - extent));
				var row = 0;

				while (rows[row] !== undefined && rows[row] > start - 6) {
					row++;
				}

				rows[row] = start + extent;
				mark.Row = row;
				mark.Start = start;
				mark.Extent = extent;
			});

			/* The lanes: the ones declared, then one of its own for the ranges of no lane; the ranges in the rows of their lane. */
			lanes = data.Lanes.map(function (lane) {
				return {ID: String(lane.ID), Label: lane.Label || '', Rows: []};
			});

			ranges = data.Ranges.map(function (range, index) {
				var id = String(range.ID !== undefined && range.ID !== null && range.ID !== '' ? range.ID : 'range-' + index);
				var drag = own.Drag && own.Drag.Kind === 'range' && own.Drag.ID === id && own.Drag.From !== undefined ? own.Drag : null;
				var from = drag ? drag.From : self.Value(range.From);
				var to = drag ? drag.To : self.Value(range.To);

				return {ID: id, Item: range, From: Math.min(from, to), To: Math.max(from, to), Lane: range.Lane === undefined || range.Lane === null ? '' : String(range.Lane), Label: range.Label || '', Tone: range.Tone || (range.Color ? '' : 'accent'), Color: range.Color || '', Custom: own.Contents['range:' + id] || (range.Element || range.Render ? range : null)};
			}).filter(function (range) {
				return isFinite(range.From) && isFinite(range.To);
			}).sort(function (a, b) {
				return a.From - b.From;
			});

			if (own.Drag && own.Drag.Kind === 'create')
				ranges.push({ID: '', Item: null, From: Math.min(own.Drag.From, own.Drag.To), To: Math.max(own.Drag.From, own.Drag.To), Lane: own.Drag.Lane, Label: '', Tone: 'accent', Color: '', Draft: true});

			ranges.forEach(function (range) {
				var lane = lanes.filter(function (entry) {
					return entry.ID === range.Lane;
				})[0];
				var row = 0;

				if (!lane) {
					lane = {ID: range.Lane, Label: '', Rows: [], Own: true};

					lanes.push(lane);
				}

				while (lane.Rows[row] !== undefined && lane.Rows[row] > range.From) {
					row++;
				}

				lane.Rows[row] = range.To;
				range.Row = row;
				range.LaneOf = lane;
			});

			/* Across the line: the labels before, the axis, the labels after, the lanes. */
			cross = (vertical ? before.length * labelColumn : before.length * rowSize) + (before.length ? 6 : 0);

			model = {Vertical: vertical, Length: length, Header: header, Ticks: ticks.Ticks, Step: ticks.Step, View: view, AxisAt: cross, AxisSize: axisSize};
			cross += axisSize;
			model.AfterAt = cross + 6;
			cross += (vertical ? after.length * labelColumn : after.length * rowSize) + 6;

			lanes.forEach(function (lane) {
				lane.At = cross;
				lane.Size = Math.max(1, lane.Rows.length) * laneSize;
				cross += lane.Size;
			});

			model.Cross = cross + 4;
			model.LaneSize = laneSize;
			model.Lanes = lanes.map(function (lane) {
				return {ID: lane.ID, Label: lane.Label, At: lane.At, Size: lane.Size, Style: self.Place(0, lane.At, null, lane.Size)};
			});

			model.Marks = marks.map(function (mark) {
				var rowAt = mark.Side === 'before' ? model.AxisAt - 6 - (mark.Row + 1) * (vertical ? labelColumn : rowSize) : model.AfterAt + mark.Row * (vertical ? labelColumn : rowSize);
				var leaderFrom = mark.Side === 'before' ? rowAt + (vertical ? labelColumn : rowSize) : model.AxisAt + axisSize / 2;
				var leaderTo = mark.Side === 'before' ? model.AxisAt + axisSize / 2 : rowAt;

				mark.PointStyle = self.Place(mark.Pos - 6, model.AxisAt + axisSize / 2 - 6, 12, 12);
				mark.LeaderStyle = self.Place(mark.Pos, leaderFrom, null, Math.max(0, leaderTo - leaderFrom));
				mark.LabelStyle = self.Place(mark.Start, rowAt, null, vertical ? null : rowSize) + (vertical ? 'width:' + (labelColumn - 8) + 'px;' : '');
				mark.Name = (mark.Label || mark.ID) + ', ' + self.Written(mark.At);
				mark.Selected = self.Selected === 'mark:' + mark.ID;

				return mark;
			});

			model.Ranges = ranges.map(function (range) {
				var a = Math.max(-2, position(range.From));
				var b = Math.min(length + 2, position(range.To));

				range.Hidden = b < 0 || a > length;
				range.CutStart = position(range.From) < 0;
				range.CutEnd = position(range.To) > length;
				range.Style = self.Place(a, range.LaneOf.At + range.Row * laneSize + 3, Math.max(4, b - a), laneSize - 6) + (range.Color ? 'background:' + range.Color + ';border-color:' + range.Color + ';' : '');
				range.Name = (range.Label || range.ID) + ', ' + self.Written(range.From) + ' – ' + self.Written(range.To);
				range.Selected = self.Selected === 'range:' + range.ID;
				range.Narrow = b - a < 28;

				return range;
			}).filter(function (range) {
				return !range.Hidden;
			});

			model.Ticks = model.Ticks.map(function (tick) {
				tick.Style = self.Place(position(tick.Value), model.AxisAt, null, axisSize);

				return tick;
			});

			/* The progress, its buffer, the playhead and now, on the axis. */
			progress = data.Progress || {};
			model.Progress = self.Bar(progress.To, view, position, length, model);
			model.Buffer = self.Bar(progress.Buffer, view, position, length, model);
			model.Playhead = self.Playhead !== null && self.Playhead !== undefined && self.Playhead !== '' || self.Seekable ? self.Head(own.Seeking !== undefined ? own.Seeking : self.Value(self.Playhead), position, length, model) : null;
			model.Now = self.Now && self.Kind() === 'time' ? self.Head(Date.now(), position, length, model, true) : null;
			model.AxisStyle = self.Place(0, model.AxisAt, null, axisSize);
			model.Box = (vertical ? 'width:' : 'height:') + model.Cross + 'px;';
			model.TrackStyle = vertical ? 'top:' + header + 'px;' : 'left:' + header + 'px;';
			model.Overview = self.Overview ? self.Strip(data, view, length, header, lanes, ranges) : null;

			cache.Arguments = args;
			cache.Model = model;

			return model;
		};

		/*
		 * The strip of the whole line: its marks as thin lines, its ranges as thin bars in the rows of their lanes, the frame of
		 * the part in view with its two edges; as long as the track, beside it.
		 */
		this.Strip = function (data, view, length, header, lanes, ranges) {
			var vertical = self.Orientation === 'vertical';
			var whole = self.Whole();
			var size = 32;
			var row = Math.max(2, Math.min(6, Math.floor((size - 8) / Math.max(1, lanes.length)) - 1));
			var at = function (value) {
				return Math.max(0, Math.min(length, (value - whole.From) / (whole.To - whole.From) * length));
			};
			var from = at(view.From);
			var to = at(view.To);

			return {
				Style: (vertical ? 'margin-top:' + header + 'px;height:' + length + 'px;width:' : 'margin-left:' + header + 'px;width:' + length + 'px;height:') + size + 'px;',
				Marks: data.Marks.map(function (mark, index) {
					var value = self.Value(mark.At);

					return {Key: String(mark.ID !== undefined && mark.ID !== null && mark.ID !== '' ? mark.ID : 'mark-' + index), Value: value, Tone: mark.Tone || 'accent'};
				}).filter(function (mark) {
					return isFinite(mark.Value);
				}).map(function (mark) {
					mark.Style = self.Place(at(mark.Value) - 1, 3, 2, size - 6);

					return mark;
				}),
				Ranges: ranges.filter(function (range) {
					return !range.Draft;
				}).map(function (range) {
					var a = at(range.From);

					return {Key: range.ID, Tone: range.Tone, Style: self.Place(a, 4 + lanes.indexOf(range.LaneOf) * (row + 1), Math.max(2, at(range.To) - a), row) + (range.Color ? 'background:' + range.Color + ';' : '')};
				}),
				Window: self.Place(from, 0, Math.max(6, to - from), size)
			};
		};

		this.Bar = function (value, view, position, length, model) {
			var to = self.Value(value);
			var end;

			if (!isFinite(to)) return null;

			end = Math.max(0, Math.min(length, position(to)));

			return {Style: self.Place(0, model.AxisAt + model.AxisSize - 6, end, 4)};
		};

		this.Head = function (value, position, length, model, line) {
			var at = position(value);
			if (!isFinite(value) || at < 0 || at > length)
				return line ? null : {Hidden: true, Style: 'display:none;', Value: value};

			return {Value: value, Name: self.Written(value), Style: line ? self.Place(at, 0, null, model.Cross) : self.Place(at - 7, model.AxisAt + model.AxisSize - 11, 14, 14)};
		};

		/* The model of now: what it is made of are its arguments (a template calls it). */
		this.Current = function () {
			return self.Model(self.Marks, self.Ranges, self.Lanes, self.Progress, self.Playhead, self.Version, self.Selected, self.Orientation, self.Start, self.End, self.From, self.To, self.Scale, self.Now, self.Seekable, self.Overview);
		};

		/* After a drawing: the widths of the labels, measured (a template calls it). */
		this.Drawn = function () {
			var own = self.Own();
			if (own.Labels)
				window.setTimeout(own.Labels, 0);

			return '';
		};

		/* The tip of a mark or a range. */
		this.Tip = function (item) {
			return {Title: item.Label || item.ID, Text: item.Text ? item.Text + '\n' + (item.From !== undefined ? self.Written(item.From) + ' – ' + self.Written(item.To) : self.Written(item.At)) : item.From !== undefined ? self.Written(item.From) + ' – ' + self.Written(item.To) : self.Written(item.At), Placement: self.Orientation === 'vertical' ? 'right' : 'top'};
		};
	},

	$OnReady: function () {
		var self = this;
		var element = this.$Element();
		var own = this.Own();
		var view = element.ownerDocument.defaultView || window;

		/* Its size: the line along the axis takes the room it has. */
		own.Measure = function () {
			var vertical = self.Orientation === 'vertical';
			var main = vertical ? element.clientHeight : element.clientWidth;

			if (main && main !== own.Size.Main) {
				own.Size.Main = main;
				self.Version++;
			}
		};

		/* The widths of the labels once drawn: their rows are made again with them. */
		own.Labels = function () {
			var changed = false;

			Array.prototype.forEach.call(element.querySelectorAll('.elemenx-timeline-label[data-key]'), function (label) {
				var key = label.getAttribute('data-key');
				var width = Math.ceil(label.scrollWidth) + 2;

				if (Math.abs((own.Widths[key] || 0) - width) > 1) {
					own.Widths[key] = width;
					changed = true;
				}
			});

			if (changed)
				self.Version++;
		};

		/* What is declared inside it: data, and the content of a mark or a range as its label. */
		own.Read = function () {
			var declared = {Marks: [], Ranges: [], Lanes: [], Progress: null};
			var before = JSON.stringify(own.Declared);
			var changed = false;

			Array.prototype.forEach.call(element.querySelectorAll('.elemenx-timeline-sources .elemenx-timeline-source'), function (node) {
				var type = node.getAttribute('data-type');
				var value;
				var content;

				try {
					value = JSON.parse(node.getAttribute('data-value') || '{}');
				}
				catch (error) {
					return;
				}

				if (type === 'mark') declared.Marks.push(value);
				else if (type === 'range') declared.Ranges.push(value);
				else if (type === 'lane') declared.Lanes.push(value);
				else if (type === 'progress') declared.Progress = {To: value.To, Buffer: value.Buffer};

				/* Its content (what the slot holds): taken out into the label, kept for it while it is not given again. */
				if ((type === 'mark' || type === 'range') && (node.textContent.trim() || node.querySelector('*:not(span[style*="contents"])'))) {
					content = element.ownerDocument.createElement('span');
					content.className = 'elemenx-timeline-content';

					while (node.firstChild) {
						content.appendChild(node.firstChild);
					}

					own.Contents[type + ':' + value.ID] = content;
					changed = true;
				}
			});

			if (!changed && JSON.stringify(declared) === before) return;

			own.Declared = declared;
			self.Version++;
		};

		own.Watcher = new MutationObserver(own.Read);

		own.Watcher.observe(element.querySelector('.elemenx-timeline-sources'), {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-value']});

		if (typeof view.ResizeObserver === 'function') {
			own.Sizes = new view.ResizeObserver(own.Measure);

			own.Sizes.observe(element);
		}

		own.Read();
		own.Measure();

		window.setTimeout(own.Labels, 0);
	},

	$OnDestroy: function () {
		var own = this.State;
		if (!own) return;

		if (own.Watcher)
			own.Watcher.disconnect();

		if (own.Sizes)
			own.Sizes.disconnect();
	},

	/* The part in view: within the whole line, no smaller than MinSpan; told by the view event. */
	SetView: function (from, to, quiet) {
		var whole = this.Whole();
		var span = Math.max(Number(this.MinSpan) || (this.Kind() === 'number' ? 1e-3 : 60000), Math.min(whole.To - whole.From, to - from));
		var start = Math.max(whole.From, Math.min(whole.To - span, from));
		var own = this.Own();

		own.View = {From: start, To: start + span};
		this.Version++;

		if (!quiet)
			this.$Emit('view', {From: this.Out(start), To: this.Out(start + span)});
	},

	Zoom: function (factor, at) {
		var view = this.Window();
		var center = at === undefined ? (view.From + view.To) / 2 : at;

		this.SetView(center - (center - view.From) * factor, center + (view.To - center) * factor);
	},

	Pan: function (amount) {
		var view = this.Window();

		this.SetView(view.From + amount, view.To + amount);
	},

	ZoomIn: function () {
		this.Zoom(1 / 1.5);
	},

	ZoomOut: function () {
		this.Zoom(1.5);
	},

	Fit: function () {
		var whole = this.Whole();

		this.SetView(whole.From, whole.To);
	},

	/* The moment under a point of the screen. */
	At: function (event) {
		var track = this.$Element().querySelector('.elemenx-timeline-track');
		var box = track.getBoundingClientRect();
		var view = this.Window();
		var vertical = this.Orientation === 'vertical';
		var length = vertical ? box.height : box.width;
		var offset = vertical ? event.clientY - box.top : event.clientX - box.left;

		return view.From + offset / Math.max(1, length) * (view.To - view.From);
	},

	/* The moment of the whole line under a point of the screen, on the strip of the overview. */
	Overall: function (event) {
		var box = this.$Element().querySelector('.elemenx-timeline-overview').getBoundingClientRect();
		var whole = this.Whole();
		var vertical = this.Orientation === 'vertical';
		var offset = vertical ? event.clientY - box.top : event.clientX - box.left;

		return whole.From + offset / Math.max(1, vertical ? box.height : box.width) * (whole.To - whole.From);
	},

	/* A press on the strip: on the frame it moves the view, on an edge of it zooms it; elsewhere the view is centered there first. */
	Glance: function (event) {
		var strip = event.target.closest('.elemenx-timeline-overview');
		var part = event.target.getAttribute('data-edge') || (event.target.closest('.elemenx-timeline-overview-window') ? 'window' : '');
		var at = this.Overall(event);
		var view = this.Window();

		if (event.button !== 0) return;

		event.preventDefault();

		if (!part) {
			this.SetView(at - (view.To - view.From) / 2, at + (view.To - view.From) / 2);

			part = 'window';
		}

		if (strip.setPointerCapture)
			strip.setPointerCapture(event.pointerId);

		this.Own().Drag = {Kind: 'overview', Part: part, Start: at, View: this.Window()};
	},

	/* The drag on the strip: the frame by the time the pointer went, or one edge of it (never past the other). */
	Glanced: function (event, drag) {
		var shift = this.Overall(event) - drag.Start;
		var least = Number(this.MinSpan) || (this.Kind() === 'number' ? 1e-3 : 60000);

		if (drag.Part === 'start') this.SetView(Math.min(drag.View.From + shift, drag.View.To - least), drag.View.To);
		else if (drag.Part === 'end') this.SetView(drag.View.From, Math.max(drag.View.To + shift, drag.View.From + least));
		else this.SetView(drag.View.From + shift, drag.View.To + shift);
	},

	Find: function (kind, id) {
		var model = this.Current();

		return (kind === 'mark' ? model.Marks : model.Ranges).filter(function (item) {
			return item.ID === id;
		})[0] || null;
	},

	Select: function (kind, id) {
		var item = this.Find(kind, id);

		this.Selected = kind + ':' + id;

		if (item)
			this.$Emit('select', {Kind: kind, ID: id, Item: item.Item});
	},

	Wheel: function (event) {
		var vertical = this.Orientation === 'vertical';
		var view = this.Window();
		var span = view.To - view.From;
		var amount = event.deltaMode === 1 ? 16 : 1;

		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();

			this.Zoom(Math.pow(1.0018, event.deltaY * amount), this.At(event));

			return;
		}

		if (event.shiftKey || (!vertical && Math.abs(event.deltaX) > Math.abs(event.deltaY))) {
			event.preventDefault();

			this.Pan(((event.shiftKey ? event.deltaY || event.deltaX : event.deltaX) * amount) / 600 * span);
		}
	},

	/* A press: on a mark, a range or an edge (a drag when Editable, else a selection); on the axis (seek); elsewhere (pan, or a new range on a lane). */
	Down: function (event) {
		var own = this.Own();
		var target = event.target;
		var item = target.closest('[data-kind]');
		var axis = target.closest('.elemenx-timeline-axis, .elemenx-timeline-playhead');
		var lane = target.closest('.elemenx-timeline-lane');
		var at = this.At(event);
		var ids;

		if (target.closest('.elemenx-timeline-controls')) return;

		if (target.closest('.elemenx-timeline-overview')) {
			this.Glance(event);

			return;
		}

		own.Pointers[event.pointerId] = {X: event.clientX, Y: event.clientY};
		ids = Object.keys(own.Pointers);

		if (ids.length === 2) {
			own.Drag = {Kind: 'pinch', Distance: this.Spread(), View: this.Window()};

			return;
		}

		if (event.button !== 0 && event.button !== 1) return;

		if (target.setPointerCapture)
			target.setPointerCapture(event.pointerId);

		if (event.button === 1) {
			own.Drag = {Kind: 'pan', Start: at, View: this.Window(), X: event.clientX, Y: event.clientY};
		}
		else if (item) {
			own.Drag = {Kind: item.getAttribute('data-kind'), ID: item.getAttribute('data-id'), Edge: target.getAttribute('data-edge') || '', Start: at, X: event.clientX, Y: event.clientY, Moved: false};
		}
		else if (axis && this.Seekable) {
			own.Drag = {Kind: 'seek'};

			this.Seek(at, false);
		}
		else if (lane && this.Editable) {
			own.Drag = {Kind: 'create', Lane: lane.getAttribute('data-lane'), From: this.Snapped(at), To: this.Snapped(at), X: event.clientX, Y: event.clientY, Moved: false};
		}
		else {
			own.Drag = {Kind: 'pan', Start: at, View: this.Window(), X: event.clientX, Y: event.clientY, Seek: !!axis};
		}
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var at;
		var item;
		var shift;
		var span;
		var factor;

		if (own.Pointers[event.pointerId])
			own.Pointers[event.pointerId] = {X: event.clientX, Y: event.clientY};

		if (!drag) return;

		if (drag.Kind === 'overview') {
			this.Glanced(event, drag);

			return;
		}

		if (drag.Kind === 'pinch') {
			factor = drag.Distance / Math.max(1, this.Spread());
			span = drag.View.To - drag.View.From;

			this.SetView((drag.View.From + drag.View.To) / 2 - span * factor / 2, (drag.View.From + drag.View.To) / 2 + span * factor / 2);

			return;
		}

		if (Math.abs(event.clientX - drag.X) + Math.abs(event.clientY - drag.Y) > 4)
			drag.Moved = true;

		at = this.At(event);

		if (drag.Kind === 'seek') {
			this.Seek(at, false);

			return;
		}

		if (drag.Kind === 'pan') {
			if (!drag.Moved) return;

			span = drag.View.To - drag.View.From;
			shift = (this.Orientation === 'vertical' ? drag.Y - event.clientY : drag.X - event.clientX) / Math.max(1, this.Current().Length) * span;

			this.SetView(drag.View.From + shift, drag.View.To + shift);

			return;
		}

		if (drag.Kind === 'create') {
			if (!drag.Moved) return;

			drag.To = this.Snapped(at);
			this.Version++;

			return;
		}

		if (!this.Editable || !drag.Moved) return;

		item = this.Find(drag.Kind, drag.ID);

		if (!item) return;

		/* The preview of the drag: the moment, the range or its edge moved by the time the pointer went. */
		shift = at - drag.Start;

		if (drag.Kind === 'mark') {
			drag.At = this.Snapped(this.Value(item.Item.At) + shift);
		}
		else {
			drag.From = this.Value(item.Item.From);
			drag.To = this.Value(item.Item.To);

			if (drag.Edge !== 'end')
				drag.From = this.Snapped(drag.From + shift);

			if (drag.Edge !== 'start')
				drag.To = this.Snapped(drag.To + shift);

			if (drag.Edge === 'start') drag.From = Math.min(drag.From, drag.To);
			else if (drag.Edge === 'end') drag.To = Math.max(drag.To, drag.From);
		}

		this.Version++;
	},

	Up: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var item;

		delete own.Pointers[event.pointerId];

		if (!drag) return;

		if (drag.Kind === 'pinch') {
			if (!Object.keys(own.Pointers).length)
				own.Drag = null;

			return;
		}

		own.Drag = null;

		if (drag.Kind === 'overview') return;

		if (drag.Kind === 'seek') {
			this.Seek(this.At(event), true);

			return;
		}

		if (drag.Kind === 'pan') {
			if (!drag.Moved && drag.Seek)
				this.$Emit('seek', {At: this.Out(this.At(event))});

			return;
		}

		if (drag.Kind === 'create') {
			this.Version++;

			if (drag.Moved && drag.From !== drag.To)
				this.$Emit('create', {Lane: drag.Lane, From: this.Out(Math.min(drag.From, drag.To)), To: this.Out(Math.max(drag.From, drag.To))});

			return;
		}

		item = this.Find(drag.Kind, drag.ID);

		if (!drag.Moved || !this.Editable) {
			this.Select(drag.Kind, drag.ID);

			return;
		}

		this.Version++;

		if (!item) return;

		if (drag.Kind === 'mark') this.$Emit('move', {Kind: 'mark', ID: drag.ID, Item: item.Item, At: this.Out(drag.At)});
		else if (drag.Edge) this.$Emit('resize', {ID: drag.ID, Item: item.Item, From: this.Out(drag.From), To: this.Out(drag.To)});
		else this.$Emit('move', {Kind: 'range', ID: drag.ID, Item: item.Item, From: this.Out(drag.From), To: this.Out(drag.To)});
	},

	Cancel: function (event) {
		var own = this.Own();

		delete own.Pointers[event.pointerId];

		own.Drag = null;
		this.Version++;
	},

	Spread: function () {
		var points = this.Own().Pointers;
		var ids = Object.keys(points);
		if (ids.length < 2) return 1;

		return Math.sqrt(Math.pow(points[ids[0]].X - points[ids[1]].X, 2) + Math.pow(points[ids[0]].Y - points[ids[1]].Y, 2));
	},

	/* The playhead under the pointer: drawn there while it moves, told once it is let go. */
	Seek: function (at, done) {
		var whole = this.Whole();
		var own = this.Own();
		var value = Math.max(whole.From, Math.min(whole.To, at));

		own.Seeking = done ? undefined : value;
		this.Version++;

		if (done)
			this.Playhead = this.Out(value);

		this.$Emit('seek', {At: this.Out(value)});
	},

	/* The keys: the arrows move the line (Alt with them a mark or a range with the focus, when Editable), + and - zoom, 0 shows it all. */
	Key: function (event) {
		var vertical = this.Orientation === 'vertical';
		var view = this.Window();
		var span = view.To - view.From;
		var back = vertical ? 'ArrowUp' : 'ArrowLeft';
		var forth = vertical ? 'ArrowDown' : 'ArrowRight';
		var focused = event.target.closest('[data-kind]');
		var direction = event.key === back ? -1 : event.key === forth ? 1 : 0;
		var items;
		var index;

		if (event.key === 'Escape' && this.Own().Drag) {
			this.Own().Drag = null;
			this.Version++;

			return;
		}

		if (focused && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();

			this.Select(focused.getAttribute('data-kind'), focused.getAttribute('data-id'));

			return;
		}

		if (focused && direction && event.altKey && this.Editable) {
			event.preventDefault();

			this.Nudge(focused.getAttribute('data-kind'), focused.getAttribute('data-id'), direction, event.shiftKey);

			return;
		}

		if (focused && direction) {
			event.preventDefault();

			items = Array.prototype.slice.call(this.$Element().querySelectorAll('.elemenx-timeline-track [data-kind]'));
			index = items.indexOf(focused) + direction;

			if (items[index])
				items[index].focus();

			return;
		}

		if (direction) {
			event.preventDefault();

			this.Pan(direction * span / 10);
		}
		else if (event.key === '+' || event.key === '=') {
			event.preventDefault();

			this.ZoomIn();
		}
		else if (event.key === '-') {
			event.preventDefault();

			this.ZoomOut();
		}
		else if (event.key === '0' || event.key === 'Home') {
			event.preventDefault();

			this.Fit();
		}
	},

	/* A mark or a range moved by a step of its snap (Shift: the end of a range alone). */
	Nudge: function (kind, id, direction, end) {
		var item = this.Find(kind, id);
		var step = this.SnapStep();
		var move = function (value, self) {
			if (step.Size)
				return value + direction * step.Size;

			return self.Advance(value, step.Unit, direction * step.Count);
		};
		var from;
		var to;

		if (!item) return;

		if (kind === 'mark') {
			this.$Emit('move', {Kind: 'mark', ID: id, Item: item.Item, At: this.Out(move(this.Value(item.Item.At), this))});

			return;
		}

		from = this.Value(item.Item.From);
		to = this.Value(item.Item.To);

		if (end) this.$Emit('resize', {ID: id, Item: item.Item, From: this.Out(from), To: this.Out(Math.max(from, move(to, this)))});
		else this.$Emit('move', {Kind: 'range', ID: id, Item: item.Item, From: this.Out(move(from, this)), To: this.Out(move(to, this))});
	}
});
