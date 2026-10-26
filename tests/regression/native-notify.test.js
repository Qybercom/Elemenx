import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick } from '../setup.js';
import hostSource from '../../libraries/ElemenxUI/components/NotificationHost/NotificationHost.js?raw';
import hostTemplate from '../../libraries/ElemenxUI/components/NotificationHost/NotificationHost.html?raw';
import inviteSource from '../../libraries/ElemenxUI/components/CallInvite/CallInvite.js?raw';
import inviteTemplate from '../../libraries/ElemenxUI/components/CallInvite/CallInvite.html?raw';
import buttonSource from '../../libraries/ElemenxUI/components/Button/Button.js?raw';
import buttonTemplate from '../../libraries/ElemenxUI/components/Button/Button.html?raw';

var calls;

/* A program that records the calls of the bridge. */
function program () {
	calls = [];

	window.ElemenxNative = {
		Platform: 'electron',
		Features: ['window', 'notifications'],
		Call: function (name, args, callback) {
			calls.push([name, structuredClone(args)]);

			callback(null, name === 'notify' ? {ID: args.ID} : null);
		},
		On: function () {
			return function () {};
		}
	};
}

describe('Contract: Native.Notify, the notifications of the system or of ElemenxUI', function () {
	var native;
	var heard;
	var listener = function (event) {
		heard.push(event);
	};

	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/directives/Mount.js');
		await import('../../libraries/ElemenxUI/services/Native.js');

		new Function(hostSource.replace("$StyleURL: 'NotificationHost.css',\n", '').replace("$TemplateURL: 'NotificationHost.html'", function () {
			return '$Template: ' + JSON.stringify(hostTemplate);
		}))();

		new Function(inviteSource.replace("$StyleURL: 'CallInvite.css',\n", '').replace("$TemplateURL: 'CallInvite.html'", function () {
			return '$Template: ' + JSON.stringify(inviteTemplate);
		}))();

		/* The Buttons of the actions and of the invitation. */
		new Function(buttonSource.replace("$StyleURL: 'Button.css',\n", '').replace("$TemplateURL: 'Button.html'", function () {
			return '$Template: ' + JSON.stringify(buttonTemplate);
		}))();

		native = Elemenx.Service('Native');
	});

	beforeEach(function () {
		resetDOM();

		heard = [];

		native.On('notification', listener);
	});

	afterEach(function () {
		native.Off('notification', listener);

		native.Cards.slice().forEach(function (card) {
			native.Uncard(card.ID, null);
		});

		if (native.CardHost && !native.CardHost.Window) {
			native.CardHost.Instance.$Destroy();
			native.CardHost.Instance.$Element().remove();
		}

		native.CardHost = null;

		delete window.ElemenxNative;
	});

	it('draws a card of ElemenxUI in the corner of the page, its buttons and its close told, gone after its time', async function () {
		var result = null;
		var card;

		native.Notify({ID: 'mail', Title: 'New mail', Text: 'Ada wrote', Icon: 'mail', Variant: 'success', Actions: [{ID: 'open', Label: 'Open'}, {ID: 'later', Label: 'Later'}], Look: 'elemenx', Timeout: 0}, function (error, value) {
			result = [error, value];
		});

		await tick(20);

		expect(result).toEqual([null, {ID: 'mail'}]);

		card = document.querySelector('.elemenx-notification-host.page .elemenx-notification');

		expect(card.classList.contains('success')).toBe(true);
		expect(card.querySelector('.elemenx-notification-title').textContent).toBe('New mail');
		expect(card.querySelector('.elemenx-notification-text').textContent).toBe('Ada wrote');
		expect(Array.prototype.map.call(card.querySelectorAll('.elemenx-notification-actions button'), function (button) {
			return button.textContent.trim();
		})).toEqual(['Open', 'Later']);

		/* A button: the action event, and the card goes. */
		card.querySelectorAll('.elemenx-notification-actions button')[1].click();

		await tick(20);

		expect(heard).toEqual([{ID: 'mail', Kind: 'action', Action: 'later'}]);
		expect(document.querySelectorAll('.elemenx-notification').length).toBe(0);

		/* Closed by its button; another gone after its Timeout. */
		native.Notify({ID: 'one', Title: 'One', Look: 'elemenx', Timeout: 0});
		native.Notify({ID: 'two', Title: 'Two', Look: 'elemenx', Timeout: 30});

		await tick(10);

		expect(document.querySelectorAll('.elemenx-notification').length).toBe(2);

		document.querySelector('.elemenx-notification[data-id="one"] .elemenx-notification-close').click();

		await tick(60);

		expect(heard.slice(1)).toEqual([{ID: 'one', Kind: 'close', Action: null}, {ID: 'two', Kind: 'timeout', Action: null}]);
		expect(document.querySelectorAll('.elemenx-notification').length).toBe(0);
	});

	it('gives the system the notifications of Look system: the Notification of the browser on the web, the bridge in a program', async function () {
		var original = window.Notification;
		var made = [];
		var result;

		window.Notification = function (title, options) {
			this.Title = title;
			this.Options = options;

			made.push(this);
		};
		window.Notification.requestPermission = function () {
			return Promise.resolve('granted');
		};

		try {
			result = await new Promise(function (resolve) {
				native.Notify({ID: 'web', Title: 'Hello', Text: 'From the page', Silent: true}, function (error, value) {
					resolve([error, value]);
				});
			});

			expect(result).toEqual([null, {ID: 'web'}]);
			expect([made[0].Title, made[0].Options.body, made[0].Options.silent]).toEqual(['Hello', 'From the page', true]);

			made[0].onclick();

			expect(heard).toEqual([{ID: 'web', Kind: 'click', Action: null}]);
		}
		finally {
			window.Notification = original;
		}

		program();

		native.Notify({ID: 'native', Title: 'Hello', Urgency: 'low', Actions: [{ID: 'go', Label: 'Go'}]});

		expect(calls[0]).toEqual(['notify', {ID: 'native', Title: 'Hello', Text: '', Icon: '', Silent: false, Urgency: 'low', Actions: [{ID: 'go', Label: 'Go'}]}]);
		expect(native.Has('notifications')).toBe(true);
	});

	it('draws the cards of a program in a window of its own by the corner of the screen, as large as they are', async function () {
		var frame = document.createElement('iframe');
		var open = window.open;
		var asked = null;

		program();

		document.body.appendChild(frame);

		window.open = function (url, name) {
			asked = name;

			return frame.contentWindow;
		};

		/* A window not shown yet runs no frames (nor ResizeObserver): the cards are measured all the same. */
		var frames = window.requestAnimationFrame;

		window.requestAnimationFrame = function () {};
		frame.contentWindow.requestAnimationFrame = function () {};
		frame.contentWindow.ResizeObserver = undefined;

		try {
			native.Notify({ID: 'done', Title: 'Build done', Look: 'elemenx', Timeout: 0});

			await tick(60);

			expect(asked).toBe('elemenx-notifications');
			expect(frame.contentDocument.body.classList.contains('transparent')).toBe(true);
			expect(frame.contentDocument.querySelector('.elemenx-notification-title').textContent).toBe('Build done');

			expect(calls.filter(function (call) {
				return call[0] === 'notifications';
			}).pop()[1]).toMatchObject({Show: true, Width: expect.any(Number), Height: expect.any(Number)});

			/* The last card gone: the window hides. */
			native.Uncard('done', 'close');

			expect(calls[calls.length - 1]).toEqual(['notifications', {Show: false}]);
		}
		finally {
			window.requestAnimationFrame = frames;
			window.open = open;

			frame.remove();
		}
	});

	it('stacks its cards as toasts: one of an ID updated in place, a limit past which they are counted, the newest next to the corner', async function () {
		var labels = function () {
			return Array.prototype.map.call(document.querySelectorAll('.elemenx-notification-title'), function (node) {
				return node.textContent;
			});
		};

		native.Notifications({Limit: 2, Corner: 'top-left'});

		native.Notify({ID: 'one', Title: 'One', Look: 'elemenx', Timeout: 0});
		native.Notify({ID: 'upload', Title: 'Upload', Progress: 0.2, Look: 'elemenx', Timeout: 0});
		native.Notify({ID: 'three', Title: 'Three', Look: 'elemenx', Timeout: 0});

		await tick(20);

		/* Two shown, the newest last (next to the corner); one counted. */
		expect(labels()).toEqual(['Upload', 'Three']);
		expect(document.querySelector('.elemenx-notification-more').textContent).toBe(Elemenx.Locale.Text('ui.notifications.more', {count: 1}));
		expect(document.querySelector('.elemenx-notification-host').classList.contains('top-left')).toBe(true);

		/* The same ID: in its place, its progress new. */
		native.Notify({ID: 'upload', Title: 'Upload', Progress: 0.8, Look: 'elemenx', Timeout: 0});

		await tick(20);

		expect(labels()).toEqual(['Upload', 'Three']);
		expect(document.querySelector('.elemenx-notification-progress > span').style.width).toBe('80%');

		/* Taken away by the Application: the one counted shows again. */
		expect(native.CloseNotification('three')).toBe(true);
		expect(native.CloseNotification('three')).toBe(false);

		await tick(20);

		expect(labels()).toEqual(['One', 'Upload']);
		expect(document.querySelectorAll('.elemenx-notification-more').length).toBe(0);

		native.Notifications({Limit: 4, Corner: 'bottom-right'});
	});

	it('holds the time of a card while the pointer is over it, and shows the time it has left', async function () {
		var card;

		native.Notify({ID: 'held', Title: 'Held', Look: 'elemenx', Timeout: 80});

		await tick(20);

		card = document.querySelector('.elemenx-notification');

		expect(card.classList.contains('timed')).toBe(true);
		expect(card.querySelector('.elemenx-notification-timer')).not.toBe(null);

		card.dispatchEvent(new MouseEvent('mouseenter'));

		await tick(150);

		expect(document.querySelectorAll('.elemenx-notification').length).toBe(1);
		expect(card.classList.contains('held')).toBe(true);

		card.dispatchEvent(new MouseEvent('mouseleave'));

		await tick(150);

		expect(document.querySelectorAll('.elemenx-notification').length).toBe(0);
		expect(heard).toEqual([{ID: 'held', Kind: 'timeout', Action: null}]);
	});

	it('draws a card of a Component of its own, as an invitation to a call: over the limit, its sound until it goes, its choice told', async function () {
		var original = window.Audio;
		var sounds = [];

		window.Audio = function (url) {
			var sound = {URL: url, Playing: false, play: function () {
				sound.Playing = true;

				return Promise.resolve();
			}, pause: function () {
				sound.Playing = false;
			}};

			sounds.push(sound);

			return sound;
		};

		try {
			native.Notifications({Limit: 1});

			native.Notify({ID: 'mail', Title: 'Mail', Look: 'elemenx', Timeout: 0});
			native.Notify({ID: 'call', Look: 'elemenx', Component: 'CallInvite', Props: {Name: 'Ada Lovelace', Video: true}, Bare: true, Priority: 'high', Timeout: 0, Sound: '/ring.mp3', Loop: true});

			await tick(30);

			/* The invitation shows past the limit, next to the corner; the mail is counted. */
			expect(document.querySelectorAll('.elemenx-notification').length).toBe(1);
			expect(document.querySelector('.elemenx-notification').classList.contains('bare')).toBe(true);
			expect(document.querySelector('.elemenx-call-invite-name').textContent).toBe('Ada Lovelace');
			expect(document.querySelectorAll('.elemenx-call-invite-button button').length).toBe(3);
			expect([sounds[0].URL, sounds[0].loop, sounds[0].Playing]).toEqual(['/ring.mp3', true, true]);

			/* Accepted with the camera: the action told, the card and its sound gone, the mail back. */
			document.querySelectorAll('.elemenx-call-invite-button button')[2].click();

			await tick(30);

			expect(heard).toEqual([{ID: 'call', Kind: 'action', Action: 'accept-video'}]);
			expect(sounds[0].Playing).toBe(false);
			expect(document.querySelector('.elemenx-notification-title').textContent).toBe('Mail');
		}
		finally {
			window.Audio = original;

			native.Notifications({Limit: 4});
		}
	});

	it('needs a title or a text', function () {
		var error = null;

		native.Notify({}, function (value) {
			error = value;
		});

		expect(error.message).toBe('Elemenx Native Notify needs a Title or a Text');
	});
});
