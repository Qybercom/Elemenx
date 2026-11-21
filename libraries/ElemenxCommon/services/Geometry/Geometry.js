/*
 * Geometry: what a ground and a planet find of their lines, areas and points, of one source in the kernel language of
 * Elemenx.Compilers (Kernel), the same in the page, in a worker, in wasm and in a shader. A line or an area is a list of
 * numbers (float[]), x and z by twos; points of space x, y and z by threes.
 * - Line(points, x, z): the nearest point of a line: {Distance, T (along the whole of it, 0 to 1), Side (+1 left of its way,
 *   -1 right), Segment (the index of its piece)}.
 * - Area(points, x, z): {Inside (whether the point is in the area), Distance (to its edge)}.
 * - Level(points, levels, x, z): the level of a line where it is nearest a point, between those of its points (levels:
 *   one of each point), as a river and a road are laid.
 * - Grid(data, side, radius, x, z): a grid of side by side numbers over the square of a radius round 0 (a stamp): {Value
 *   (between its four nearest), Inside (whether the point is on it)}.
 * - Tunnel(points, x, y, z, radius, flat, width, height, corner): of points of space by threes, how far a point is from the
 *   wall of a tunnel round them (under 0 inside): a round bore of radius, its floor cut level by flat, or a box of a width
 *   and height (corners round by corner); {Distance, Axis (the height of its axis by the point)}.
 * - Passages(packed, x, y, z, blend, crust, ground): of a graph of passages packed as numbers ([ways, halls, each way: its
 *   count of points, Radius, Flat, Width, Height, Corner, Low, its points; each hall: x, y, z, Radius, Floor]), its ways and
 *   halls joined smoothly over blend, none cut within crust of the ground over the point: {Distance, Floor (of the nearest)}.
 * - Fall(distance, radius): 1 at the middle, 0 at the edge and past it, smoothly (half a wave of a cosine).
 * - Nearest(points, x, y, z): of points of space, {Index (of the nearest), Near (its distance), Next (that of the next
 *   nearest), Other (the index of that one)}: what the plates of a planet are found by.
 * - Painted(packed, x, y, z): of areas of directions on a sphere packed as numbers ([count, each area: its count of
 *   points, its Edge (radians), its points by threes]), how much a point (a direction) is of them, their sum: each 1 an
 *   Edge inside its outline, a half on it, 0 an Edge out of it (what a developer drew of the land and the sea of a planet).
 * - Strokes(packed, x, y, z): of lines of directions drawn on a sphere packed as numbers ([count, each: its count of points,
 *   Reach in radians, Amount, Power, its points by threes]), what they give a direction, their sum: each its Amount by (1 -
 *   its angle to the line over Reach) to Power, none past Reach (the ranges, rifts and rivers a developer drew on a planet).
 * - Bend(record, t, width, bend): how far aside of its way a river is at t of a segment of it packed as numbers ([A, B by
 *   threes, FlowA, FlowB, LevelA, LevelB, AlongA, AlongB, PhaseA, PhaseB, Seed, End (km of its river where it ends in
 *   another, -1 else), From (1: an arm of a delta), its count of joins, the km of each]), km: bends of bend times its width
 *   (width km by the root of its flow), none at its joins. River(packed, x, y, z, radius, width, bend): of segments packed
 *   so ([count, each]), the nearest river to a direction as it bends, {Far (km, Infinity with none), Flow, Level}.
 * - Edits(packed, softs, x, y, z, height): a height as brushes along paths of directions leave it, in their order ([count,
 *   each: its type, 0 raise, 1 lower, 2 flatten, 3 smooth, its count of points, Reach in radians, Amount, Height, its
 *   middle, Cap, the cosine of the cap it reaches, its points]): (1 - t^2)^2 of t the angle to its path over Reach; smooth
 *   toward softs[its index]. EditWeight(packed, at, x, y, z) that of one of them packed from at.
 * - Code(): the functions of the Kernel as js (made in the page; a worker makes them of the text it carries, Compiled);
 *   IR(): the module of the IR (for the blocks of geometry of Blueprints.Numeric): geo_line (vec4 of Distance, T, Side,
 *   Segment), geo_area (vec2 of Inside 1 or 0, Distance), geo_level, geo_grid (vec2 of Value, Inside), geo_tunnel (vec2 of Distance, Axis), geo_passages (vec2 of Distance, Floor), geo_fall, geo_nearest (vec4 of Index, Near, Next, Other), geo_painted, geo_strokes, geo_bend, geo_river (vec3 of Far, Flow, Level), geo_path, geo_edit_weight, geo_edits.
 * - Source(names) gives its members to a worker of the Workers Service.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Geometry', {
	$Meta: {
		Description: 'The nearest point of a line, whether a point is in an area, the level of a line, the nearest of points: of one source, the same in js, wasm and a shader.',
		Methods: ['Line(points, x, z)', 'Area(points, x, z)', 'Level(points, levels, x, z)', 'Grid(data, side, radius, x, z)', 'Tunnel(points, x, y, z, radius, flat, width, height, corner)', 'Passages(packed, x, y, z, blend, crust, ground)', 'Fall(distance, radius)', 'Nearest(points, x, y, z)', 'Painted(packed, x, y, z)', 'Strokes(packed, x, y, z)', 'Bend(record, t, width, bend)', 'River(packed, x, y, z, radius, width, bend)', 'EditWeight(packed, at, x, y, z)', 'Edits(packed, softs, x, y, z, height)', 'Code()', 'IR()', 'Source(names)']
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	Kernel: [
		'/* The length of a line of points x, z by twos. */',
		'float geo_length(float[] p) {',
		'	float total = 0.0;',
		'	int count = p.length / 2 - 1;',
		'	for (int s = 0; s < count; s++) {',
		'		float dx = p[s * 2 + 2] - p[s * 2], dz = p[s * 2 + 3] - p[s * 2 + 1];',
		'		total += sqrt(dx * dx + dz * dz);',
		'	}',
		'	return total;',
		'}',
		'/* The nearest point of a line: its distance, how far along all of it (0 to 1), its side (+1 left, -1 right), its piece. */',
		'vec4 geo_line(float[] p, float x, float z) {',
		'	float total = geo_length(p);',
		'	float best = inf, along = 0.0, side = 1.0, segment = 0.0, before = 0.0;',
		'	int count = p.length / 2 - 1;',
		'	if (count < 1) return vec4(p.length >= 2 ? sqrt((p[0] - x) * (p[0] - x) + (p[1] - z) * (p[1] - z)) : inf, 0.0, 1.0, 0.0);',
		'	for (int s = 0; s < count; s++) {',
		'		int i = s * 2;',
		'		float ax = p[i], az = p[i + 1], dx = p[i + 2] - ax, dz = p[i + 3] - az;',
		'		float span = dx * dx + dz * dz;',
		'		float given = span > 0.0 ? span : 1.0;',
		'		float t = min(1.0, max(0.0, ((x - ax) * dx + (z - az) * dz) / given));',
		'		float px = ax + dx * t - x, pz = az + dz * t - z;',
		'		float d = sqrt(px * px + pz * pz);',
		'		if (d < best) {',
		'			best = d;',
		'			along = (before + sqrt(given) * t) / (total > 0.0 ? total : 1.0);',
		'			side = dx * (z - az) - dz * (x - ax) > 0.0 ? -1.0 : 1.0;',
		'			segment = float(s);',
		'		}',
		'		before += sqrt(span);',
		'	}',
		'	return vec4(best, along, side, segment);',
		'}',
		'/* Whether a point is in an area (1 or 0), and how far it is from its edge. */',
		'vec2 geo_area(float[] p, float x, float z) {',
		'	int n = p.length / 2;',
		'	int j = n - 1;',
		'	bool within = false;',
		'	float nearest = inf;',
		'	for (int i = 0; i < n; i++) {',
		'		float xi = p[i * 2], zi = p[i * 2 + 1], xj = p[j * 2], zj = p[j * 2 + 1];',
		'		float dx = xj - xi, dz = zj - zi;',
		'		float span = dx * dx + dz * dz;',
		'		float t = min(1.0, max(0.0, ((x - xi) * dx + (z - zi) * dz) / (span > 0.0 ? span : 1.0)));',
		'		if ((zi > z) != (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) within = !within;',
		'		float ex = xi + dx * t - x, ez = zi + dz * t - z;',
		'		nearest = min(nearest, sqrt(ex * ex + ez * ez));',
		'		j = i;',
		'	}',
		'	return vec2(within ? 1.0 : 0.0, nearest);',
		'}',
		'/* The level of a line where it is nearest the point: between those of the two points of its piece. */',
		'float geo_level(float[] p, float[] levels, float x, float z) {',
		'	vec4 seen = geo_line(p, x, z);',
		'	int s = int(seen.w);',
		'	float total = geo_length(p);',
		'	float before = 0.0;',
		'	for (int k = 0; k < s; k++) {',
		'		float dx = p[k * 2 + 2] - p[k * 2], dz = p[k * 2 + 3] - p[k * 2 + 1];',
		'		before += sqrt(dx * dx + dz * dz);',
		'	}',
		'	if (levels.length < 2) return levels.length > 0 ? levels[0] : 0.0;',
		'	float ex = p[s * 2 + 2] - p[s * 2], ez = p[s * 2 + 3] - p[s * 2 + 1];',
		'	float span = sqrt(ex * ex + ez * ez);',
		'	float t = min(1.0, max(0.0, (seen.y * total - before) / (span > 0.0 ? span : 1.0)));',
		'	return levels[s] + (levels[s + 1] - levels[s]) * t;',
		'}',
		'/* A grid of side by side numbers over a square of a radius round 0 (a stamp): its value at a point between its four, and whether the point is on it. */',
		'vec2 geo_grid(float[] data, float side, float radius, float x, float z) {',
		'	float u = (x + radius) / (2.0 * radius) * (side - 1.0);',
		'	float v = (z + radius) / (2.0 * radius) * (side - 1.0);',
		'	if (!(u >= 0.0 && v >= 0.0 && u <= side - 1.0 && v <= side - 1.0)) return vec2(0.0, 0.0);',
		'	int n = int(side);',
		'	int c = min(n - 2, int(floor(u)));',
		'	int r = min(n - 2, int(floor(v)));',
		'	float a = data[r * n + c] + (data[r * n + c + 1] - data[r * n + c]) * (u - float(c));',
		'	float b = data[(r + 1) * n + c] + (data[(r + 1) * n + c + 1] - data[(r + 1) * n + c]) * (u - float(c));',
		'	return vec2(a + (b - a) * (v - float(r)), 1.0);',
		'}',
		'/* The distance of a point to a bore of a Width and Height round the axis of points from (x, y, z by threes), its corners round by Corner. */',
		'float geo_box_at(float[] p, int from, int n, float x, float y, float z, float width, float height, float corner) {',
		'\tfloat best = inf;',
		'\tfor (int i = 0; i < n - 1; i++) {',
		'\t\tint k = from + i * 3;',
		'\t\tfloat ax = p[k], ay = p[k + 1], az = p[k + 2];',
		'\t\tfloat dx = p[k + 3] - ax, dy = p[k + 4] - ay, dz = p[k + 5] - az;',
		'\t\tfloat flat = sqrt(dx * dx + dz * dz);',
		'\t\tfloat level = flat > 0.0 ? flat : 1.0;',
		'\t\tfloat t = min(1.0, max(0.0, ((x - ax) * dx + (z - az) * dz) / (level * level)));',
		'\t\tfloat across = abs(((x - ax - dx * t) * -dz + (z - az - dz * t) * dx) / level) - (width / 2.0 - corner);',
		'\t\tfloat up = abs(y - (ay + dy * t)) - (height / 2.0 - corner);',
		'\t\tfloat d = sqrt(max(across, 0.0) * max(across, 0.0) + max(up, 0.0) * max(up, 0.0)) + min(max(across, up), 0.0) - corner;',
		'\t\tif (d < best) best = d;',
		'\t}',
		'\treturn best;',
		'}',
		'/*',
		' * The distance of a point to a tunnel of points from (x, y, z by threes): a round bore of Radius, its floor cut level by Flat',
		' * (nothing under its axis by more than (1 - Flat * 0.6) of it), or a box of Width (geo_box_at); and the height of its axis by',
		' * the point.',
		' */',
		'vec2 geo_tunnel_at(float[] p, int from, int n, float x, float y, float z, float radius, float flat, float width, float height, float corner) {',
		'\tfloat best = inf, axis = y;',
		'\tfor (int i = 0; i < n - 1; i++) {',
		'\t\tint k = from + i * 3;',
		'\t\tfloat ax = p[k], ay = p[k + 1], az = p[k + 2];',
		'\t\tfloat dx = p[k + 3] - ax, dy = p[k + 4] - ay, dz = p[k + 5] - az;',
		'\t\tfloat span = dx * dx + dy * dy + dz * dz;',
		'\t\tfloat t = min(1.0, max(0.0, ((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / (span > 0.0 ? span : 1.0)));',
		'\t\tfloat px = ax + dx * t - x, py = ay + dy * t - y, pz = az + dz * t - z;',
		'\t\tfloat d = sqrt(px * px + py * py + pz * pz);',
		'\t\tif (d < best) {',
		'\t\t\tbest = d;',
		'\t\t\taxis = ay + dy * t;',
		'\t\t}',
		'\t}',
		'\tif (n == 1) {',
		'\t\tbest = sqrt((x - p[from]) * (x - p[from]) + (y - p[from + 1]) * (y - p[from + 1]) + (z - p[from + 2]) * (z - p[from + 2]));',
		'\t\taxis = p[from + 1];',
		'\t}',
		'\tif (width > 0.0) best = geo_box_at(p, from, n, x, y, z, width, height, corner);',
		'\telse best = max(best - radius, axis - radius * (1.0 - flat * 0.6) - y);',
		'\treturn vec2(best, axis);',
		'}',
		'vec2 geo_tunnel(float[] p, float x, float y, float z, float radius, float flat, float width, float height, float corner) {',
		'\treturn geo_tunnel_at(p, 0, p.length / 3, x, y, z, radius, flat, width, height, corner);',
		'}',
		'/* A smooth min of two distances over k: no edge where they meet. */',
		'float geo_join(float a, float b, float k) {',
		'\tfloat h = max(k - abs(a - b), 0.0) / k;',
		'\treturn min(a, b) - h * h * k / 4.0;',
		'}',
		'/*',
		' * The distance of a point to a graph of passages, packed as numbers: [ways, halls, then each way: its count of points, Radius,',
		' * Flat, Width, Height, Corner, Low (how far its floor is under its axis), its points x, y, z; then each hall: x, y, z,',
		' * Radius, Floor]. Its ways (tunnels, under Crust metres of ground g not cut) and halls joined smoothly over Blend, nothing',
		' * dug under the floors of what it joins; and the floor of the nearest of them.',
		' */',
		'vec2 geo_passages(float[] q, float x, float y, float z, float blend, float crust, float g) {',
		'\tint ways = int(q[0]);',
		'\tint halls = int(q[1]);',
		'\tint at = 2;',
		'\tfloat best = inf, nearest = inf, floor = y - 100.0, lowest = inf;',
		'\tfor (int w = 0; w < ways; w++) {',
		'\t\tint n = int(q[at]);',
		'\t\tvec2 made = geo_tunnel_at(q, at + 7, n, x, y, z, q[at + 1], q[at + 2], q[at + 3], q[at + 4], q[at + 5]);',
		'\t\tfloat low = q[at + 6];',
		'\t\tfloat d = crust >= 0.0 && made.x < 0.0 ? max(made.x, y - (g - crust)) : made.x;',
		'\t\tif (d < nearest) {',
		'\t\t\tnearest = d;',
		'\t\t\tfloor = made.y - low;',
		'\t\t}',
		'\t\tif (d < blend) lowest = min(lowest, made.y - low);',
		'\t\tbest = blend > 0.0 ? geo_join(best, d, blend) : min(best, d);',
		'\t\tat = at + 7 + n * 3;',
		'\t}',
		'\tfor (int h = 0; h < halls; h++) {',
		'\t\tfloat hx = q[at], hy = q[at + 1], hz = q[at + 2], radius = q[at + 3], level = q[at + 4];',
		'\t\tfloat d = max(sqrt((x - hx) * (x - hx) + (y - hy) * (y - hy) + (z - hz) * (z - hz)) - radius, level - y);',
		'\t\tif (d < nearest) {',
		'\t\t\tnearest = d;',
		'\t\t\tfloor = level;',
		'\t\t}',
		'\t\tif (d < blend) lowest = min(lowest, level);',
		'\t\tbest = blend > 0.0 ? geo_join(best, d, blend) : min(best, d);',
		'\t\tat = at + 5;',
		'\t}',
		'\tif (lowest < inf) best = max(best, lowest - y);',
		'\treturn vec2(best, floor);',
		'}',
		'/* 1 at the middle, 0 at the edge and past it, smoothly. */',
		'float geo_fall(float distance, float radius) {',
		'	float t = min(1.0, max(0.0, distance / max(1e-6, radius)));',
		'	return 0.5 + 0.5 * cos(t * 3.141592653589793);',
		'}',
		'/*',
		' * What lines of directions drawn give a point (Strokes): q [count, each its count of points, Reach (radians), Amount,',
		' * Power, its points by threes], each Amount by (1 - its angle to the line over Reach) to Power, none past Reach; their sum.',
		' */',
		'float geo_strokes(float[] q, float px, float py, float pz) {',
		'	float sum = 0.0;',
		'	int count = q.length > 0 ? int(q[0]) : 0;',
		'	int at = 1;',
		'	for (int s = 0; s < count; s++) {',
		'		int n = int(q[at]);',
		'		float reach = q[at + 1];',
		'		float near = geo_path(q, at + 4, n, 0.0, px, py, pz);',
		'		if (near < reach) sum += pow(1.0 - near / reach, q[at + 3]) * q[at + 2];',
		'		at = at + 4 + n * 3;',
		'	}',
		'	return sum;',
		'}',
		'/*',
		' * How much a brush packed from at in q changes a point, 0 to 1: [its type (0 raise, 1 lower, 2 flatten, 3 smooth), its',
		' * count of points, Reach (radians), Amount, Height, its middle by threes, Cap (the cosine of the cap of the globe it',
		' * reaches), its points by threes]; (1 - t^2)^2 of t the angle to its path over Reach, none past it.',
		' */',
		'float geo_edit_weight(float[] q, int at, float px, float py, float pz) {',
		'	int n = int(q[at + 1]);',
		'	if (px * q[at + 5] + py * q[at + 6] + pz * q[at + 7] < q[at + 8]) return 0.0;',
		'	float t = (n > 1 ? geo_path(q, at + 9, n, 0.0, px, py, pz) : geo_arc(px, py, pz, q[at + 9], q[at + 10], q[at + 11])) / q[at + 2];',
		'	if (t >= 1.0) return 0.0;',
		'	return (1.0 - t * t) * (1.0 - t * t);',
		'}',
		'/*',
		' * A height as brushes packed in q leave it ([count, each as geo_edit_weight reads it]), in their order: raise and lower by',
		' * Amount, flatten toward Height, smooth toward the height softs holds for it (its index), by Amount (0: all, 1 at most).',
		' */',
		'float geo_edits(float[] q, float[] softs, float px, float py, float pz, float height) {',
		'	float made = height;',
		'	int count = q.length > 0 ? int(q[0]) : 0;',
		'	int at = 1;',
		'	for (int s = 0; s < count; s++) {',
		'		float type = q[at];',
		'		float amount = q[at + 3];',
		'		float weight = geo_edit_weight(q, at, px, py, pz);',
		'		if (weight > 0.0) {',
		'			if (type == 0.0) made = made + amount * weight;',
		'			if (type == 1.0) made = made - amount * weight;',
		'			if (type == 2.0) made = made + (q[at + 4] - made) * weight;',
		'			if (type == 3.0) made = made + (softs[s] - made) * weight * max(0.0, min(1.0, amount != 0.0 ? amount : 1.0));',
		'		}',
		'		at = at + 9 + int(q[at + 1]) * 3;',
		'	}',
		'	return made;',
		'}',
		'/* 0 under from, 1 over to, smoothly between (as a smoothstep of js: of its share cut to 0..1 first). */',
		'float geo_smooth(float from, float to, float value) {',
		'	float s = max(0.0, min(1.0, (value - from) / (to - from)));',
		'	return s * s * (3.0 - 2.0 * s);',
		'}',
		'/*',
		' * How far aside of its way a river is at t of a segment packed from at in q (km, to the side of cross(A, B)): [A by threes, B,',
		' * FlowA, FlowB, LevelA, LevelB, AlongA, AlongB, PhaseA, PhaseB, Seed, End (km of its river when it ends in another, else',
		' * -1), From (1: an arm of a delta), its count of joins, the km of each]. Bends of bend times its width (width by the root',
		' * of the flow), twice its width aside, a third of that over 1200 m; none at its joins, at its end in another, where an',
		' * arm leaves its river.',
		' */',
		'float geo_bend(float[] q, int at, float t, float width, float bend) {',
		'	float flow = q[at + 6] + (q[at + 7] - q[at + 6]) * t;',
		'	float level = q[at + 8] + (q[at + 9] - q[at + 8]) * t;',
		'	float along = q[at + 10] + (q[at + 11] - q[at + 10]) * t;',
		'	float phase = q[at + 12] + (q[at + 13] - q[at + 12]) * t;',
		'	float seed = q[at + 14];',
		'	float wide = width * sqrt(max(1.0, flow));',
		'	float length = max(0.25, bend * wide);',
		'	float amount = 2.0 * wide * (0.3 + 0.7 * (1.0 - geo_smooth(300.0, 1200.0, level)));',
		'	int joins = int(q[at + 17]);',
		'	for (int j = 0; j < joins; j++) {',
		'		amount = amount * geo_smooth(0.0, length * 1.5, abs(along - q[at + 18 + j]));',
		'	}',
		'	if (q[at + 15] >= 0.0) amount = amount * geo_smooth(0.0, length * 1.5, q[at + 15] - along);',
		'	if (q[at + 16] > 0.5) amount = amount * geo_smooth(0.0, length * 1.5, along);',
		'	return amount * (0.7 * sin(phase + seed * 1.7) + 0.3 * sin(phase * 2.8 + seed * 3.1));',
		'}',
		'/*',
		' * The nearest river to a direction of the segments packed in q ([count, each as geo_bend reads it]): vec3 of its distance',
		' * (km, of its way as it bends; inf with none), its flow and the level of its bed there. radius: km of the sphere.',
		' */',
		'vec3 geo_river(float[] q, float px, float py, float pz, float radius, float width, float bend) {',
		'	float best = inf, flow = 0.0, level = 0.0;',
		'	int count = q.length > 0 ? int(q[0]) : 0;',
		'	int at = 1;',
		'	for (int s = 0; s < count; s++) {',
		'		float ax = q[at], ay = q[at + 1], az = q[at + 2];',
		'		float dx = q[at + 3] - ax, dy = q[at + 4] - ay, dz = q[at + 5] - az;',
		'		float span = max(1e-18, dx * dx + dy * dy + dz * dz);',
		'		float t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / span));',
		'		float ox = ax + dx * t, oy = ay + dy * t, oz = az + dz * t;',
		'		float ol = sqrt(ox * ox + oy * oy + oz * oz);',
		'		float os = ol != 0.0 ? ol : 1.0;',
		'		float vx = px - ox / os, vy = py - oy / os, vz = pz - oz / os;',
		'		float cx = ay * q[at + 5] - az * q[at + 4], cy = az * q[at + 3] - ax * q[at + 5], cz = ax * q[at + 4] - ay * q[at + 3];',
		'		float cl = sqrt(cx * cx + cy * cy + cz * cz);',
		'		float cs = cl != 0.0 ? cl : 1.0;',
		'		float aside = (vx * (cx / cs) + vy * (cy / cs) + vz * (cz / cs)) * radius;',
		'		float ahead = sqrt(max(0.0, (vx * vx + vy * vy + vz * vz) * radius * radius - aside * aside));',
		'		float off = aside - geo_bend(q, at, t, width, bend);',
		'		float far = sqrt(ahead * ahead + off * off);',
		'		if (far < best) {',
		'			best = far;',
		'			flow = q[at + 6] + (q[at + 7] - q[at + 6]) * t;',
		'			level = q[at + 8] + (q[at + 9] - q[at + 8]) * t;',
		'		}',
		'		at = at + 18 + int(q[at + 17]);',
		'	}',
		'	return vec3(best, flow, level);',
		'}',
		'/* The angle between two directions (of one length), radians. */',
		'float geo_arc(float ax, float ay, float az, float bx, float by, float bz) {',
		'\treturn acos(max(-1.0, min(1.0, ax * bx + ay * by + az * bz)));',
		'}',
		'/*',
		' * The angle from a point to a path of n directions by threes from at in q (great circles between them), radians: closed',
		' * (1) its last joined to its first; open, of one direction the angle to it.',
		' */',
		'float geo_path(float[] q, int at, int n, float closed, float px, float py, float pz) {',
		'	float best = inf;',
		'	int pieces = closed > 0.5 ? n : n - 1;',
		'	if (n == 1 && closed < 0.5) return geo_arc(px, py, pz, q[at], q[at + 1], q[at + 2]);',
		'	for (int k = 0; k < pieces; k++) {',
		'\t\tint i = at + k * 3;',
		'\t\tint j = at + ((k + 1) % n) * 3;',
		'\t\tfloat ax = q[i], ay = q[i + 1], az = q[i + 2], bx = q[j], by = q[j + 1], bz = q[j + 2];',
		'\t\tfloat cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;',
		'\t\tfloat cl = sqrt(cx * cx + cy * cy + cz * cz);',
		'\t\tfloat cs = cl != 0.0 ? cl : 1.0;',
		'\t\tfloat ux = cx / cs, uy = cy / cs, uz = cz / cs;',
		'\t\tfloat off = px * ux + py * uy + pz * uz;',
		'\t\tfloat rx = px - ux * off, ry = py - uy * off, rz = pz - uz * off;',
		'\t\tfloat rl = sqrt(rx * rx + ry * ry + rz * rz);',
		'\t\tfloat rs = rl != 0.0 ? rl : 1.0;',
		'\t\tfloat sx = rx / rs, sy = ry / rs, sz = rz / rs;',
		'\t\tfloat span = geo_arc(ax, ay, az, bx, by, bz);',
		'\t\tfloat d = abs(geo_arc(ax, ay, az, sx, sy, sz) + geo_arc(sx, sy, sz, bx, by, bz) - span) < 1e-6 ? asin(min(1.0, abs(off))) : min(geo_arc(px, py, pz, ax, ay, az), geo_arc(px, py, pz, bx, by, bz));',
		'\t\tbest = min(best, d);',
		'\t}',
		'\treturn best;',
		'}',
		'/* The angle from a point to a closed outline of n directions by threes from at in q, radians. */',
		'float geo_outline(float[] q, int at, int n, float px, float py, float pz) {',
		'	return geo_path(q, at, n, 1.0, px, py, pz);',
		'}',
		'/* 1 when a point is inside a closed outline of n directions by threes from at in q (it goes round the point), else 0. */',
		'float geo_inside(float[] q, int at, int n, float px, float py, float pz) {',
		'\tfloat el = sqrt(pz * pz + px * px);',
		'\tfloat es = el != 0.0 ? el : 1.0;',
		'\tfloat polar = abs(py) > 0.9999 ? 1.0 : 0.0;',
		'\tfloat ex = polar > 0.5 ? 0.0 : pz / es, ey = 0.0, ez = polar > 0.5 ? -1.0 : -px / es;',
		'\tfloat mx = py * ez - pz * ey, my = pz * ex - px * ez, mz = px * ey - py * ex;',
		'\tfloat ml = sqrt(mx * mx + my * my + mz * mz);',
		'\tfloat ms = ml != 0.0 ? ml : 1.0;',
		'\tfloat nx = mx / ms, ny = my / ms, nz = mz / ms;',
		'\tfloat turned = 0.0, last = 0.0;',
		'\tfor (int k = 0; k <= n; k++) {',
		'\t\tint i = at + (k % n) * 3;',
		'\t\tfloat a = atan2(q[i] * ex + q[i + 1] * ey + q[i + 2] * ez, q[i] * nx + q[i + 1] * ny + q[i + 2] * nz);',
		'\t\tif (k > 0) {',
		'\t\t\tfloat turn = a - last;',
		'\t\t\tif (turn > 3.141592653589793) turn = turn - 6.283185307179586;',
		'\t\t\tif (turn < -3.141592653589793) turn = turn + 6.283185307179586;',
		'\t\t\tturned = turned + turn;',
		'\t\t}',
		'\t\tlast = a;',
		'\t}',
		'\treturn abs(turned) > 3.141592653589793 ? 1.0 : 0.0;',
		'}',
		'/*',
		' * How much of areas of directions a point is (Painted): q [count, each area its n, its edge (radians), its n directions by',
		' * threes], each 1 well inside it, a half on its outline, 0 an edge out of it; their sum.',
		' */',
		'float geo_painted(float[] q, float px, float py, float pz) {',
		'\tfloat sum = 0.0;',
		'\tint count = q.length > 0 ? int(q[0]) : 0;',
		'\tint at = 1;',
		'\tfor (int s = 0; s < count; s++) {',
		'\t\tint n = int(q[at]);',
		'\t\tfloat edge = q[at + 1];',
		'\t\tfloat far = geo_outline(q, at + 2, n, px, py, pz);',
		'\t\tfloat made = geo_inside(q, at + 2, n, px, py, pz) > 0.5 ? (far >= edge ? 1.0 : 0.5 + far / edge * 0.5) : max(0.0, 1.0 - far / edge) * 0.5;',
		'\t\tsum += made;',
		'\t\tat = at + 2 + n * 3;',
		'\t}',
		'\treturn sum;',
		'}',
		'/* Of points of space by threes: the index of the nearest, its distance, that of the next nearest and its index. */',
		'vec4 geo_nearest(float[] p, float x, float y, float z) {',
		'	float near = inf, next = inf, index = -1.0, other = -1.0;',
		'	int n = p.length / 3;',
		'	for (int i = 0; i < n; i++) {',
		'		float dx = p[i * 3] - x, dy = p[i * 3 + 1] - y, dz = p[i * 3 + 2] - z;',
		'		float d = sqrt(dx * dx + dy * dy + dz * dz);',
		'		if (d < near) {',
		'			next = near;',
		'			other = index;',
		'			near = d;',
		'			index = float(i);',
		'		}',
		'		else if (d < next) {',
		'			next = d;',
		'			other = float(i);',
		'		}',
		'	}',
		'	return vec4(index, near, next, other);',
		'}'
	].join('\n'),

	/* What a worker carries of this Service besides its methods: the js of its Kernel, made in the page (a worker has no compiler). */
	Carried: ['Compiled'],

	$OnCreate: function () {
		this.Code();
	},

	/* The functions of the Kernel as js: made of the text the page made once (Compiled), the same text in a worker. */
	Code: function () {
		var self = this;

		if (this.Made)
			return this.Made;

		if (!this.Compiled && typeof Elemenx !== 'undefined' && Elemenx.Compilers) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'js', Value: this.Kernel, Entry: 'geometry'}, function (error, result) {
				if (error)
					throw error;

				self.Compiled = result.Value;
			});
		}

		this.Made = new Function(this.Compiled)();

		return this.Made;
	},

	/* The Kernel in the IR of Elemenx.Compilers, made once: its functions for a module of another (the blocks of geometry of Blueprints.Numeric). */
	IR: function () {
		var self = this;

		if (!this.IRMade) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'ir', Value: this.Kernel}, function (error, result) {
				if (error)
					throw error;

				self.IRMade = result.Value;
			});
		}

		return this.IRMade;
	},

	Line: function (points, x, z) {
		var made = this.Code().geo_line(points, x, z);

		return {Distance: made[0], T: made[1], Side: made[2], Segment: made[3]};
	},

	Area: function (points, x, z) {
		var made = this.Code().geo_area(points, x, z);

		return {Inside: made[0] > 0.5, Distance: made[1]};
	},

	Level: function (points, levels, x, z) {
		return this.Code().geo_level(points, levels, x, z);
	},

	Grid: function (data, side, radius, x, z) {
		var made = this.Code().geo_grid(data, side, radius, x, z);

		return {Value: made[0], Inside: made[1] > 0.5};
	},

	Tunnel: function (points, x, y, z, radius, flat, width, height, corner) {
		var made = this.Code().geo_tunnel(points, x, y, z, radius, flat, width, height, corner);

		return {Distance: made[0], Axis: made[1]};
	},

	Passages: function (packed, x, y, z, blend, crust, ground) {
		var made = this.Code().geo_passages(packed, x, y, z, blend, crust, ground);

		return {Distance: made[0], Floor: made[1]};
	},

	Fall: function (distance, radius) {
		return this.Code().geo_fall(distance, radius);
	},

	/* What lines of directions drawn give a point, their sum (geo_strokes): packed [count, each its n, Reach, Amount, Power, its points]. */
	Strokes: function (packed, x, y, z) {
		return this.Code().geo_strokes(packed, x, y, z);
	},

	/* How much a brush packed from at changes a point, 0 to 1 (geo_edit_weight). */
	EditWeight: function (packed, at, x, y, z) {
		return this.Code().geo_edit_weight(packed, at, x, y, z);
	},

	/* A height as brushes packed leave it (geo_edits), softs the heights of the smooth ones by their index. */
	Edits: function (packed, softs, x, y, z, height) {
		return this.Code().geo_edits(packed, softs, x, y, z, height);
	},

	/* How far aside of its way a river is at t of a segment packed (geo_bend: Bend of RiverOf), km. */
	Bend: function (record, t, width, bend) {
		return this.Code().geo_bend(record, 0, t, width, bend);
	},

	/* The nearest river to a direction of segments packed (geo_river): {Far (km, Infinity with none), Flow, Level}. */
	River: function (packed, x, y, z, radius, width, bend) {
		var made = this.Code().geo_river(packed, x, y, z, radius, width, bend);

		return {Far: made[0], Flow: made[1], Level: made[2]};
	},

	/* How much of areas of directions on a sphere a point is, their sum (geo_painted): packed [count, each its n, edge, n directions by threes]. */
	Painted: function (packed, x, y, z) {
		return this.Code().geo_painted(packed, x, y, z);
	},

	Nearest: function (points, x, y, z) {
		var made = this.Code().geo_nearest(points, x, y, z);

		return {Index: made[0], Near: made[1], Next: made[2], Other: made[3]};
	}
});
