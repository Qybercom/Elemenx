import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('TimelineHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* A pointer event at a second of the timeline (and over a lane, by its index), on the scroller, from a target. */
function pointer (root, type, seconds, lane, target, options) {
	var scroller = root.querySelector('.elemenx-video-timeline-scroller');
	var rect = scroller.getBoundingClientRect();
	var lanes = root.querySelectorAll('.elemenx-video-timeline-lane');
	var row = lanes[lane === undefined ? 0 : lane].getBoundingClientRect();

	(target || scroller).dispatchEvent(new PointerEvent(type, Object.assign({bubbles: true, clientX: rect.left + seconds * 10 - scroller.scrollLeft, clientY: row.top + row.height / 2, pointerId: 1, pointerType: 'mouse', button: 0}, options || {})));
}

function key (root, name, options) {
	root.querySelector('.elemenx-video-timeline').dispatchEvent(new KeyboardEvent('keydown', Object.assign({key: name, bubbles: true, cancelable: true}, options || {})));
}

function tracks () {
	return [
		{ID: 'v1', Kind: 'video', Name: 'Video 1', Clips: [{ID: 'a', Name: 'Intro', Start: 0, Duration: 10, Length: 14}, {ID: 'b', Name: 'Interview', Start: 20, Duration: 10, In: 5, Length: 40}]},
		{ID: 'v2', Kind: 'video', Name: 'Video 2', Clips: []},
		{ID: 'a1', Kind: 'audio', Name: 'Music', Clips: [{ID: 'm', Name: 'Theme', Start: 0, Duration: 30, Peaks: [0.2, 0.8, 0.5]}]}
	];
}

/* VideoTimeline: the timeline of a video editor. */
describe('Contract: VideoTimeline of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['VideoTimeline']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function host (state) {
		return mount('<div style="width: 760px"><VideoTimeline [tracks]="Tracks" [time]="Time" Scale="10" FPS="25" [snap]="Snap" (change)="Changed" (seek)="Sought" (select)="Selected" (play)="Played" /></div>', Object.assign({
			Tracks: tracks(),
			Time: 0,
			Snap: false,
			Events: [],
			Changed: function (value) {
				this.Tracks = value;

				this.Events.push('change');
			},
			Sought: function (value) {
				this.Time = value.Time;

				this.Events.push('seek ' + value.Time);
			},
			Selected: function (ids) {
				this.Events.push('select ' + ids.join(','));
			},
			Played: function () {
				this.Events.push('play');
			}
		}, state || {}));
	}

	it('draws the tracks, their clips in place, a wave, the ruler in seconds and the timecode', async function () {
		var view = host({Time: 12.48});
		var root = view.$Element();
		var clips;

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-video-timeline-clip').length === 3;
		});

		clips = root.querySelectorAll('.elemenx-video-timeline-clip');

		expect(clips[0].style.left).toBe('0px');
		expect(clips[0].style.width).toBe('100px');
		expect(clips[1].style.left).toBe('200px');
		expect(root.querySelector('.elemenx-video-timeline-wave path').getAttribute('d')).toMatch(/^M0 /);

		/* 25 frames a second: 12.48 s is 12 seconds and 12 frames. */
		expect(root.querySelector('.elemenx-video-timeline-timecode').textContent).toBe('00:00:12:12');
		expect(root.querySelector('.elemenx-video-timeline-playhead').style.left).toBe('125px');
		expect(Array.prototype.map.call(root.querySelectorAll('.elemenx-video-timeline-tick.major'), function (tick) {
			return tick.textContent;
		}).slice(0, 3)).toEqual(['0:00', '0:10', '0:20']);
		expect(root.querySelectorAll('.elemenx-video-timeline-head').length).toBe(3);
	});

	it('seeks by a press and a drag on the ruler, steps by frames and seconds by the arrows, and asks to play by Space', async function () {
		var view = host();
		var root = view.$Element();
		var ruler;

		await waitFor(function () {
			return root.querySelector('.elemenx-video-timeline-ruler');
		});

		ruler = root.querySelector('.elemenx-video-timeline-ruler');

		pointer(root, 'pointerdown', 15, 0, ruler);
		pointer(root, 'pointermove', 17);
		pointer(root, 'pointerup', 17);

		expect(view.Time).toBe(17);

		key(root, 'ArrowRight');

		expect(view.Time).toBe(17.04);

		key(root, 'ArrowLeft', {shiftKey: true});

		expect(view.Time).toBe(16.04);

		key(root, ' ');
		key(root, 'Home');

		expect(view.Time).toBe(0);
		expect(view.Events).toContain('play');
	});

	it('selects and moves a clip, carries it to another track of its kind, and keeps it off a track of another kind', async function () {
		var view = host();
		var root = view.$Element();
		var clip;

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-video-timeline-clip').length === 3;
		});

		clip = root.querySelector('[data-clip="a"]');

		pointer(root, 'pointerdown', 5, 0, clip);
		pointer(root, 'pointermove', 9, 0);
		pointer(root, 'pointerup', 9, 0);

		expect(view.Events).toContain('select a');
		expect(view.Tracks[0].Clips[0].Start).toBe(4);

		/* Down to the second video track. */
		clip = root.querySelector('[data-clip="a"]');

		pointer(root, 'pointerdown', 6, 0, clip);
		pointer(root, 'pointermove', 6, 1);
		pointer(root, 'pointerup', 6, 1);

		expect(view.Tracks[0].Clips.map(function (each) {
			return each.ID;
		})).toEqual(['b']);
		expect(view.Tracks[1].Clips[0].ID).toBe('a');

		/* Not to the audio track. */
		clip = root.querySelector('[data-clip="a"]');

		pointer(root, 'pointerdown', 6, 1, clip);
		pointer(root, 'pointermove', 6, 2);
		pointer(root, 'pointerup', 6, 2);

		expect(view.Tracks[1].Clips[0].ID).toBe('a');
		expect(view.Tracks[2].Clips.length).toBe(1);
	});

	it('trims a clip by its edges, not past its source, and snaps an edge to the playhead', async function () {
		var view = host({Time: 33, Snap: true});
		var root = view.$Element();
		var edge;

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-video-timeline-clip').length === 3;
		});

		/* The start of the interview back by 8 s: its source starts 5 s before, so 5 s only. */
		edge = root.querySelector('[data-clip="b"] .elemenx-video-timeline-edge.start');

		pointer(root, 'pointerdown', 20, 0, edge);
		pointer(root, 'pointermove', 12, 0);
		pointer(root, 'pointerup', 12, 0);

		expect(view.Tracks[0].Clips[1]).toMatchObject({Start: 15, Duration: 15, In: 0});

		/* Its end out to 32.6 s: the playhead at 33 s is within 8 pixels, the edge goes to it. */
		edge = root.querySelector('[data-clip="b"] .elemenx-video-timeline-edge.end');

		pointer(root, 'pointerdown', 30, 0, edge);
		pointer(root, 'pointermove', 32.6, 0);

		expect(root.querySelector('.elemenx-video-timeline-guide').style.left).toBe('330px');

		pointer(root, 'pointerup', 32.6, 0);

		expect(view.Tracks[0].Clips[1]).toMatchObject({Start: 15, Duration: 18});

		/* The intro of 14 s of source cannot grow past them. */
		edge = root.querySelector('[data-clip="a"] .elemenx-video-timeline-edge.end');

		pointer(root, 'pointerdown', 10, 0, edge);
		pointer(root, 'pointermove', 19, 0);
		pointer(root, 'pointerup', 19, 0);

		expect(view.Tracks[0].Clips[0].Duration).toBe(14);
	});

	it('splits at the playhead, deletes the selection, and keeps a locked track as it is', async function () {
		var view = host({Time: 25});
		var root = view.$Element();
		var timeline;
		var head;

		await waitFor(function () {
			return root.querySelectorAll('.elemenx-video-timeline-clip').length === 3;
		});

		timeline = Elemenx.Instance(root.querySelector('.elemenx-video-timeline'));

		/* Nothing selected: every clip under the playhead is cut (the interview and the music). */
		key(root, 's');

		expect(view.Tracks[0].Clips.length).toBe(3);
		expect(view.Tracks[0].Clips[1]).toMatchObject({ID: 'b', Start: 20, Duration: 5});
		expect(view.Tracks[0].Clips[2]).toMatchObject({Start: 25, Duration: 5, In: 10});
		expect(view.Tracks[2].Clips.length).toBe(2);
		expect(timeline.Selected().length).toBe(2);

		key(root, 'Delete');

		expect(view.Tracks[0].Clips.map(function (clip) {
			return clip.ID;
		})).toEqual(['a', 'b']);
		expect(view.Tracks[2].Clips.length).toBe(1);

		/* Locked: a cut leaves it, and its clip does not move. */
		head = root.querySelectorAll('.elemenx-video-timeline-head')[0];

		head.querySelectorAll('.elemenx-video-timeline-toggle')[1].click();

		await tick();

		expect(view.Tracks[0].Locked).toBe(true);

		timeline.Select(['a']);

		view.Time = 5;

		await tick();

		timeline.Split();

		expect(view.Tracks[0].Clips.length).toBe(2);
		expect(root.querySelector('[data-clip="a"] .elemenx-video-timeline-edge')).toBe(null);
	});

	it('zooms by the keys and fits the timeline in view', async function () {
		var view = host();
		var root = view.$Element();
		var timeline;

		await waitFor(function () {
			return root.querySelector('.elemenx-video-timeline-content');
		});

		timeline = Elemenx.Instance(root.querySelector('.elemenx-video-timeline'));

		key(root, '+');

		expect(timeline.Pixels()).toBe(15);
		expect(root.querySelector('[data-clip="a"]').style.width).toBe('150px');

		timeline.Fit();

		await tick();

		expect(root.querySelector('.elemenx-video-timeline-content').getBoundingClientRect().width).toBeLessThanOrEqual(root.querySelector('.elemenx-video-timeline-scroller').clientWidth);
		expect(timeline.Timecode(3661.6)).toBe('01:01:01:15');
	});
});
