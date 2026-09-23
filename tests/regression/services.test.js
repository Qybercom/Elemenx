import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

describe('Regression: Services / Application context', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('keeps service instances application-scoped', function () {
		var service=unique('Store'), ca=unique('AppAComp'), cb=unique('AppBComp'), aa=unique('AppA'), ab=unique('AppB');
		Elemenx.Service(service,{Value:0,Inc:function () {this.Value++;return this.Value;}});
		Elemenx.Component(ca,{Template:'<div>A</div>'});
		Elemenx.Component(cb,{Template:'<div>B</div>'});
		document.body.innerHTML='<div id="a"></div><div id="b"></div>';
		var a=Elemenx.Application(aa,{Component:ca,Mount:'#a'});
		var b=Elemenx.Application(ab,{Component:cb,Mount:'#b'});
		var sa=a.Service(service), sb=b.Service(service);
		expect(sa.Inc()).toBe(1);
		expect(sa.Inc()).toBe(2);
		expect(sb.Inc()).toBe(1);
		expect(sa.Application()).toBe(a);
		expect(sb.Application()).toBe(b);
		a.Destroy(); b.Destroy();
	});
});