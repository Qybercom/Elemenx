import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../../../..');
const Universe = require(path.join(root, 'tools/universe.js'));
const out = path.join(root, 'tests/tmp/universe-bake');
const home = {Seed: 'cosmos', Galaxies: [{ID: 'milky-way', Name: 'Milky Way', Seed: 'milky', Kind: 'barred', Coordinates: [123.4, -5, 60]}], Home: 'milky-way'};

function read (name) {
	return JSON.parse(fs.readFileSync(path.join(out, name), 'utf8'));
}

describe('Contract: a universe in Node: elemenx universe bake writes a region of it, serve makes any part as it is asked for, the same', () => {
	const servers = [];

	afterAll(() => {
		servers.forEach((server) => server.close());

		fs.rmSync(out, {recursive: true, force: true});
	});

	it('bakes the cubes round its home, the passport and the sky of its galaxies, as UniverseData makes them', () => {
		const Elemenx = Universe.Load();
		const universes = Elemenx.Service('UniverseData');
		const data = universes.Make(home);
		const made = Universe.Bake(home, out, {Radius: 10});
		const index = read('index.json');

		expect(made.Cubes).toBe(index.Cubes.length);
		expect(index.Cubes).toContain('12.-1.6');
		expect(index.Galaxies).toEqual(['milky-way']);
		expect(read('universe.json').Seed).toBe('cosmos');
		expect(read('cubes/12.-1.6.json')).toEqual(JSON.parse(JSON.stringify(universes.Cube(data, 12, -1, 6))));
		expect(read('galaxies/milky-way.json').Seed).toBe('milky');
		expect(read('galaxies/milky-way/sky.json')).toEqual(JSON.parse(JSON.stringify(universes.Sky(data, 'milky-way'))));
	});

	it('serves the same layout made as it is asked for, the stars of a sector of a galaxy too, anywhere', async () => {
		const server = await new Promise((resolve, reject) => {
			Universe.Serve(home, {Port: 0}, (error, made) => (error ? reject(error) : resolve(made)));
		});
		const base = 'http://127.0.0.1:' + server.address().port + '/';

		servers.push(server);

		const cube = await fetch(base + 'cubes/12.-1.6.json');

		expect(cube.status).toBe(200);
		expect(cube.headers.get('access-control-allow-origin')).toBe('*');
		expect(await cube.json()).toEqual(read('cubes/12.-1.6.json'));

		/* Far out (not baked): made all the same. */
		expect((await (await fetch(base + 'cubes/400000.-250000.99999.json')).json()).Galaxies.length).toBeGreaterThan(40);

		const sector = await (await fetch(base + 'galaxies/milky-way/sectors/270.0.0.json?limit=3')).json();

		expect(sector.Key).toBe('270.0.0');
		expect(sector.Stars.length).toBe(3);
		expect((await fetch(base + 'galaxies/nowhere.json')).status).toBe(404);
		expect((await fetch(base + 'other')).status).toBe(404);

		/* A client reads it as a universe of a folder: its passport there, a cube fetched as it is made here. */
		const Elemenx = Universe.Load();
		const universes = Elemenx.Service('UniverseData');
		const opened = await new Promise((resolve, reject) => {
			universes.Open(base, (error, data) => (error ? reject(error) : resolve(data)));
		});

		expect(opened.Base).toBe(base);
		expect(opened.Manifest.Home).toBe('milky-way');

		const fetched = await new Promise((resolve) => {
			universes.Fetch(opened, 12, -1, 6, (error, made) => resolve(made));
		});

		expect(fetched).toEqual(read('cubes/12.-1.6.json'));
	});

	it('is a command of the CLI', () => {
		const folder = path.join(out, 'cli');
		const text = execFileSync(process.execPath, [path.join(root, 'elemenx-cli.js'), 'universe', 'bake', 'cli-seed', folder, '--radius', '5', '--around', '0,0,0'], {encoding: 'utf8'});

		expect(text).toMatch(/Elemenx universe: \d+ cubes, 1 galaxies/);
		expect(JSON.parse(fs.readFileSync(path.join(folder, 'universe.json'), 'utf8')).Seed).toBe('cli-seed');
		expect(execFileSync(process.execPath, [path.join(root, 'elemenx-cli.js'), 'help', 'universe'], {encoding: 'utf8'})).toContain('elemenx universe serve');
	});
});
