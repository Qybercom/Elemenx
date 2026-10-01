import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
});