import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Messaging', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('delivers subscribed channel messages and Off detaches the callback', function () {
		var channel=unique('channel'), received=[], callback=function (event) {received.push(event.Data);};
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging();
		receiver.On(channel,callback);
		sender.Send(channel,{value:1});
		expect(received).toEqual([{value:1}]);
		receiver.Off(channel,callback);
		sender.Send(channel,{value:2});
		expect(received).toEqual([{value:1}]);
		sender.Destroy();
		receiver.Destroy();
	});

	it('ID creates an own channel and one-argument On receives direct messages', function () {
		var id=unique('socket'), received=[];
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging();
		receiver.ID(id).On(function (event) {received.push(event.Data);});
		sender.Send(id,'direct');
		expect(received).toEqual(['direct']);
		expect(receiver.Channels().indexOf(id)).not.toBe(-1);
		sender.Destroy();
		receiver.Destroy();
	});

	it('Messaging Context automatically subscribes declared channels', function () {
		var context=unique('MessageContext'), channel=unique('auto'), received=[];
		Elemenx.Messaging.Context(context,{Channels:[channel]});
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging(context);
		receiver.On(channel,function (event) {received.push(event.Data);});
		sender.Send(channel,7);
		expect(received).toEqual([7]);
		sender.Destroy();
		receiver.Destroy();
	});

	it('Messaging Context accepts a single named dependency without splitting its name into characters', function () {
		var base=unique('MessageBase'), child=unique('MessageChild'), channel=unique('inherited'), received=[];
		Elemenx.Messaging.Context(base,{Channels:[channel]});
		Elemenx.Messaging.Context(child,{Contexts:base});
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging(child);
		receiver.On(channel,function (event) {received.push(event.Data);});
		sender.Send(channel,'inherited');
		expect(received).toEqual(['inherited']);
		sender.Destroy();
		receiver.Destroy();
	});

	it('Messaging Context accepts a single inline dependency object', function () {
		var child=unique('MessageInlineChild'), channel=unique('inline'), received=[];
		Elemenx.Messaging.Context(child,{Contexts:{Channels:[channel]}});
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging(child);
		receiver.On(channel,function (event) {received.push(event.Data);});
		sender.Send(channel,11);
		expect(received).toEqual([11]);
		sender.Destroy();
		receiver.Destroy();
	});

	it('Destroy makes a socket inert and rejects further sends', function () {
		var socket=Elemenx.Messaging();
		socket.Destroy();
		expect(function () {socket.Send('x',1);}).toThrow();
	});

	it('owner Destroy invalidates a saved Messaging accessor and prevents socket resurrection', function () {
		var name=unique('MessagingOwner');
		Elemenx.Component(name,{$Template:'<div></div>'});
		var component=Elemenx.Component(name)();
		var messaging=component.$Messaging;
		var socket=messaging();
		socket.Destroy();
		component.$Destroy();
		expect(function () { messaging(); }).toThrow();
	});

	it('Message exposes Is() for imperative subscribers', function () {
		var channel=unique('message-is'), matched=false, missed=false;
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging();
		receiver.On(channel,function (message) {
			matched=message.Is(channel);
			missed=message.Is('other');
		});
		sender.Send(channel,1);
		expect(matched).toBe(true);
		expect(missed).toBe(false);
		sender.Destroy();
		receiver.Destroy();
	});

	it('$Messaging string declares the custom ID and $OnMessage receives direct messages', function () {
		var name=unique('MessagingDeclarativeID'), id=unique('declarative-id'), received=[];
		Elemenx.Component(name,{
			$Template:'<div></div>',
			$Messaging:id,
			$OnMessage:function (message) {
				if (message.Is(id)) received.push(message.Data);
			}
		});
		var component=Elemenx.Component(name)(), sender=Elemenx.Messaging();
		sender.Send(id,'direct');
		expect(received).toEqual(['direct']);
		sender.Destroy();
		component.$Destroy();
	});

	it('$Messaging array declares Channels and $OnMessage receives them through Is()', function () {
		var name=unique('MessagingDeclarativeChannels'), foo=unique('foo'), bar=unique('bar'), received=[];
		Elemenx.Component(name,{
			$Template:'<div></div>',
			$Messaging:[foo,bar],
			$OnMessage:function (message) {
				if (message.Is(foo) || message.Is(bar)) received.push(message.Channel + ':' + message.Data);
			}
		});
		var component=Elemenx.Component(name)(), sender=Elemenx.Messaging();
		sender.Send(foo,1).Send(bar,2);
		expect(received).toEqual([foo + ':1',bar + ':2']);
		sender.Destroy();
		component.$Destroy();
	});

	it('$Messaging object composes Context Channels and allows a shared Context ID', function () {
		var context=unique('DeclarativeContext'), id=unique('shared-id'), base=unique('base'), local=unique('local');
		var first=[], second=[];
		Elemenx.Messaging.Context(context,{ID:id,Channels:[base]});
		function definition (target) {
			return {
				$Template:'<div></div>',
				$Messaging:{Context:context,Channels:[local]},
				$OnMessage:function (message) { target.push(message.Channel); }
			};
		}
		var firstName=unique('MessagingFirst'), secondName=unique('MessagingSecond');
		Elemenx.Component(firstName,definition(first));
		Elemenx.Component(secondName,definition(second));
		var firstComponent=Elemenx.Component(firstName)(), secondComponent=Elemenx.Component(secondName)(), sender=Elemenx.Messaging();
		sender.Send(id,'direct').Send(base,'base').Send(local,'local');
		expect(first).toEqual([id,base,local]);
		expect(second).toEqual([id,base,local]);
		sender.Destroy();
		firstComponent.$Destroy();
		secondComponent.$Destroy();
	});

	it('Message.Is runs Debouncer, Filter and Gate through the shared Pipe pipeline', function () {
		var debounced=unique('message-debouncer'), filtered=unique('message-filter'), gated=unique('message-gate');
		var accepted=[];
		var sender=Elemenx.Messaging(), receiver=Elemenx.Messaging();
		receiver.On(debounced,function (message) {
			message.Is(debounced,{Debouncer:3},function (output) { accepted.push('debouncer:' + output.Data); });
		});
		receiver.On(filtered,function (message) {
			message.Is(filtered,{Filter:5},function (output) { accepted.push('filter:' + output.Data); });
		});
		receiver.On(gated,function (message) {
			message.Is(gated,{Gate:300},function () { accepted.push('gate:passed'); });
		});
		sender.Send(debounced,'A').Send(debounced,'A').Send(debounced,'A');
		sender.Send(filtered,'A').Send(filtered,'B').Send(filtered,'A').Send(filtered,'A').Send(filtered,'B');
		expect(accepted).toEqual(['debouncer:A','filter:A']);
		vi.useFakeTimers();
		sender.Send(gated,true);
		vi.advanceTimersByTime(300);
		expect(accepted).toEqual(['debouncer:A','filter:A','gate:passed']);
		vi.useRealTimers();
		sender.Destroy();
		receiver.Destroy();
	});


	describe('Window bridge', function () {
		it('posts Messaging packets to a Window with the configured target origin', function () {
			var channel=unique('window-outbound'), calls=[];
			var target={postMessage:function () { calls.push(Array.prototype.slice.call(arguments)); }};
			var bridge=Elemenx.Messaging.Window(target,{Origin:'https://frame.example'});
			var sender=Elemenx.Messaging();
			sender.Send(channel,{Value:17});
			expect(calls.length).toBe(1);
			expect(calls[0][0].ElemenxMessaging).toBe(true);
			expect(calls[0][0].Channel).toBe(channel);
			expect(calls[0][0].Data).toEqual({Value:17});
			expect(calls[0][1]).toBe('https://frame.example');
			sender.Destroy();
			bridge.Destroy();
		});

		it('accepts an iframe directly instead of requiring contentWindow boilerplate', function () {
			var frame=document.createElement('iframe');
			document.body.appendChild(frame);
			var bridge=Elemenx.Messaging.Window(frame);
			expect(bridge.Target()).toBe(frame.contentWindow);
			expect(bridge.Origin()).toBe(window.location.origin);
			bridge.Destroy();
			frame.remove();
		});

		it('owner-aware $Messaging.Window resolves an iframe Ref by name', function () {
			var name=unique('WindowBridgeRefOwner');
			Elemenx.Component(name,{$Template:'<iframe #Frame></iframe>'});
			var component=Elemenx.Component(name)();
			document.body.appendChild(component.$Element());
			var frame=component.$Ref('Frame');
			var bridge=component.$Messaging.Window('Frame');
			expect(frame.contentWindow).not.toBe(null);
			expect(bridge.Target()).toBe(frame.contentWindow);
			expect(bridge.Origin()).toBe(window.location.origin);
			component.$Destroy();
		});

		it('accepts only messages from the attached Window and configured origin', function () {
			var channel=unique('window-inbound'), received=[];
			var frame=document.createElement('iframe'), other=document.createElement('iframe');
			document.body.appendChild(frame);
			document.body.appendChild(other);
			var target=frame.contentWindow;
			var bridge=Elemenx.Messaging.Window(target,{Origin:window.location.origin});
			var receiver=Elemenx.Messaging();
			receiver.On(channel,function (message) { received.push(message.Data); });
			function packet (id, data) {
				return {ElemenxMessaging:true,ElemenxMessagingProtocol:1,MessageID:id,Source:'frame',Channel:channel,Data:data};
			}
			window.dispatchEvent(new MessageEvent('message',{data:packet(unique('wrong-source'),'source'),origin:window.location.origin,source:other.contentWindow}));
			window.dispatchEvent(new MessageEvent('message',{data:packet(unique('wrong-origin'),'origin'),origin:'https://wrong.example',source:target}));
			window.dispatchEvent(new MessageEvent('message',{data:packet(unique('accepted'),'accepted'),origin:window.location.origin,source:target}));
			expect(received).toEqual(['accepted']);
			bridge.Destroy();
			window.dispatchEvent(new MessageEvent('message',{data:packet(unique('destroyed'),'destroyed'),origin:window.location.origin,source:target}));
			expect(received).toEqual(['accepted']);
			receiver.Destroy();
			frame.remove();
			other.remove();
		});

		it('owner-aware $Messaging.Window is destroyed with its Component', function () {
			var name=unique('WindowBridgeOwner'), target={postMessage:function () {}};
			Elemenx.Component(name,{$Template:'<div></div>'});
			var component=Elemenx.Component(name)();
			var messaging=component.$Messaging;
			var bridge=messaging.Window(target,{Origin:'*'});
			expect(bridge.Target()).toBe(target);
			expect(bridge.Origin()).toBe('*');
			component.$Destroy();
			expect(function () { messaging.Window(target,{Origin:'*'}); }).toThrow();
			bridge.Destroy();
		});
	});
});