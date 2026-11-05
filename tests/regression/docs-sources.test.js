import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var root = path.resolve(import.meta.dirname, '../..');

/* The definition of DocsPage, read as Elemenx would take it; the files its Read asks for go to asked. */
function docsPage (asked) {
	var definition = null;
	var context = {
		Elemenx: {
			Component: function (name, value) {
				definition = value;
			},
			Library: function (name) {
				return {$Root: '/libraries/' + name + '/'};
			},
			Resource: {
				Load: function (url) {
					asked.push(url);
				}
			}
		}
	};

	vm.runInNewContext(fs.readFileSync(path.join(root, 'examples/Docs/application/components/DocsPage/DocsPage.js'), 'utf8'), context);

	return definition;
}

describe('The sources on a page of the Docs', function () {
	/* Regression: a Service or a Directive went to its own folder (services/Math/Math.js), and its page asked for services/Math.js. */
	it('asks for the files of every component, service, directive and trait where its Library has them', function () {
		var index = JSON.parse(fs.readFileSync(path.join(root, 'examples/Docs/pages/index.json'), 'utf8'));
		var missing = [];
		var count = 0;

		index.Sections.filter(function (section) {
			return ['components', 'services', 'directives', 'traits'].indexOf(section.ID) !== -1;
		}).forEach(function (section) {
			section.Pages.forEach(function (page) {
				var asked = [];
				var definition = docsPage(asked);

				definition.Read.call({Index: index.Sections, Loaded: 'page'}, section.ID + '/' + page.ID, 'page');

				asked.forEach(function (url) {
					/* A component may have no template or stylesheet (a behaviour of a scene): its script is always there. */
					if (!/\.js$/.test(url)) return;

					count++;

					if (!fs.existsSync(path.join(root, url)))
						missing.push(url);
				});
			});
		});

		expect(count).toBeGreaterThan(320);
		expect(missing).toEqual([]);
	});
});
