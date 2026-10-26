import fs from 'fs';
import os from 'os';
import path from 'path';

/*
 * A copy of the project of the dist tests (tests/dist/single-project, without its node_modules) in a temporary folder of
 * its own: {Root, Project}. The builds of a test go next to it (out: '../<name>'), its fakes into its node_modules, so
 * two runs at the same time (two npm test, or a test and a build) do not write over each other. folder names the copy
 * (single-project by default: a build takes the name of the Application from it). The test removes Root.
 */
export function Sandbox (name, folder) {
	var source = path.resolve(process.cwd(), 'tests', 'dist', 'single-project');
	var root = fs.mkdtempSync(path.join(os.tmpdir(), 'elemenx-' + name + '-'));
	var project = path.join(root, folder || 'single-project');

	fs.cpSync(source, project, {recursive: true, filter: function (file) {
		return !/(^|[\\/])node_modules([\\/]|$)/.test(path.relative(source, file));
	}});

	return {Root: root, Project: project};
}
