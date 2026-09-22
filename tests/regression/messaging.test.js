import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Messaging', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('delivers subscribed channel messages and Off detaches the callback', function () {
		var channel=unique('channel'), received=[], callback=function(event){received.push(event.Data);};
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
		receiver.ID(id).On(function(event){received.push(event.Data);});
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
		receiver.On(channel,function(event){received.push(event.Data);});
		sender.Send(channel,7);
		expect(received).toEqual([7]);
		sender.Destroy();
		receiver.Destroy();
	});

	it('Destroy makes a socket inert and rejects further sends', function () {
		var socket=Elemenx.Messaging();
		socket.Destroy();
		expect(function(){socket.Send('x',1);}).toThrow();
	});
});