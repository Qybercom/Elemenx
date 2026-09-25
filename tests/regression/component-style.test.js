import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';

describe('Regression: Component Style / StyleURL', function () {
	beforeAll(async function () { await loadElemenx(); });
	beforeEach(function () { resetDOM(); });

	it('Style installs component CSS once for all instances', function () {
		var name=unique('InlineStyle');
		var css='.inline-style-test { display: block; }';
		var factory=Elemenx.Component(name,{Template:'<div class="inline-style-test"></div>',Style:css});
		var first=factory();
		var second=factory();
		document.getElementById('mount').appendChild(first.Element());
		document.getElementById('mount').appendChild(second.Element());
		var styles=document.querySelectorAll('style[data-elemenx-style="component:'+name+'"]');
		expect(styles.length).toBe(1);
		expect(styles[0].textContent).toBe(css);
		first.Destroy(); second.Destroy();
	});

	it('StyleURL loads CSS and resolves relative to the component definition URL', async function () {
		var name=unique('RemoteStyle');
		var factory=Elemenx.Component(name,{
			Template:'<div id="remote-style-component"></div>',
			StyleURL:'Component.css',
			ElemenxDefinitionURL:'/tests/public/component-style/Component.js'
		});
		var component=factory();
		document.getElementById('mount').appendChild(component.Element());
		expect(await waitFor(function () {return document.getElementById('remote-style-component');},1000)).not.toBe(false);
		var style=document.querySelector('style[data-elemenx-style="component:'+name+'"]');
		expect(style).not.toBeNull();
		expect(style.textContent).toContain('.remote-style-test');
		expect(factory.Definition.StyleURL).toBe('/tests/public/component-style/Component.css');
		component.Destroy();
	});
});