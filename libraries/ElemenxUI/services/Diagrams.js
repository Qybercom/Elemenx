/*
 * Diagrams written as text, in a subset of the language of Mermaid, drawn in SVG by a layout of their own (no library):
 * the colors of the theme in a page, its own in a file.
 * - Types(): flowchart, sequence, state, er, gantt, class, mindmap.
 * - Parse(text): the model of a diagram, {Type, ...}; a line it cannot read throws an Error naming its line (Line).
 * - SVG(text, options): the drawing, its size its own (options.Id names its parts; FontSize 14).
 * The languages, by the first line:
 * - flowchart TD|TB|BT|LR|RL (or graph): nodes id[text], id(text), id([text]), id[[text]], id[(text)], id((text)),
 *   id(((text))), id{text}, id{{text}}, id>text], id[/text/], id[\text\], id[/text\], id[\text/]; links -->, ---,
 *   -.->, -.-, ==>, ===, --o, --x, <-->, ~~~ (more dashes: a longer link), with a text (-->|text| or -- text -->),
 *   chained (A --> B --> C) and of several (A & B --> C); subgraph id [title] ... end; classDef name fill:..;
 *   class a,b name; id:::name; style id fill:...
 * - sequenceDiagram: participant A as Alice, actor B; A->>B: text (->> -->> -> --> -x --x -) --)), + and - after the
 *   arrow activate and deactivate, activate A, deactivate A; Note left of|right of|over A[,B]: text; loop, alt / else,
 *   opt, par / and, critical, break, rect ... end; autonumber.
 * - stateDiagram-v2 (or stateDiagram): [*] --> A, A --> B : text, state "Text" as A, A : text, state A { ... }
 *   (a state of states), state X <<choice>>, <<fork>>, <<join>>, direction LR.
 * - erDiagram: A ||--o{ B : label (|o || }o }| and o| || o{ |{; -- identifying, .. not), A { type name PK "comment" }.
 * - gantt: title, dateFormat YYYY-MM-DD, section Name, Task : [crit,] [done|active,] [id,] start (a date or after
 *   id), end (a date) or duration (3d, 2w, 12h); milestone.
 * - classDiagram: class A { +name String \n +run(speed) void }, A : +member, <<interface>> A; A <|-- B, *--, o--,
 *   -->, --, ..>, ..|>, .., with "1" and "*" at the ends and a : label.
 * - mindmap: a tree by its indentation, its first line the root; id[text], id(text), id((text)), id))text((,
 *   id)text(, id{{text}} or a text alone.
 */
Elemenx.Service('Diagrams', {
	$Meta: {
		Description: 'Diagrams written as text (a subset of Mermaid): flowcharts, sequences, states, ER, Gantt, classes and mind maps, drawn in SVG.',
		Methods: ['Types()', 'Parse(text)', 'SVG(text, options)']
	},
	Font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
	Palette: ['#3f6c9e', '#c2477f', '#2f8f83', '#d99a1e', '#7a4fb0', '#d25f3a', '#5f7d2e', '#0f8fae'],

	Types: function () {
		return ['flowchart', 'sequence', 'state', 'er', 'gantt', 'class', 'mindmap'];
	},

	/* The width of a text in a font of size pixels (a canvas measures it; without one, an estimate). */
	Measure: function (text, size, weight) {
		var context;

		if (this.Canvas === undefined)
			this.Canvas = typeof document !== 'undefined' && document.createElement ? document.createElement('canvas') : null;

		context = this.Canvas && this.Canvas.getContext ? this.Canvas.getContext('2d') : null;

		if (!context)
			return String(text).length * size * 0.56;

		context.font = (weight || 400) + ' ' + size + 'px ' + this.Font;

		return context.measureText(String(text)).width;
	},

	/* The lines of a text written as a label: <br> and \n make lines. */
	LabelLines: function (text) {
		return String(text == null ? '' : text).replace(/<br\s*\/?>/gi, '\n').replace(/\\n/g, '\n').split('\n');
	},

	/* The size of a label: {Width, Height, Lines}. */
	LabelSize: function (text, size, weight) {
		var self = this;
		var lines = this.LabelLines(text);

		return {
			Width: Math.max.apply(null, lines.map(function (line) {
				return self.Measure(line, size, weight);
			}).concat([0])),
			Height: lines.length * size * 1.3,
			Lines: lines
		};
	},

	Escape: function (value) {
		return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},

	/* A label as SVG text centered at x, y: its lines one under the other. */
	Text: function (text, x, y, size, options) {
		var self = this;
		var settings = options || {};
		var lines = this.LabelLines(text);
		var top = y - (lines.length - 1) * size * 1.3 / 2;

		return '<text class="' + (settings.Class || 't') + '" x="' + this.Round(x) + '" y="' + this.Round(top) + '" text-anchor="' + (settings.Anchor || 'middle') + '" dominant-baseline="central"' + (settings.Weight ? ' font-weight="' + settings.Weight + '"' : '') + (settings.Size && settings.Size !== size ? '' : '') + ' font-size="' + size + '"' + (settings.Style ? ' style="' + this.Escape(settings.Style) + '"' : '') + '>' + lines.map(function (line, index) {
			return index ? '<tspan x="' + self.Round(x) + '" dy="' + self.Round(size * 1.3) + '">' + self.Escape(line) + '</tspan>' : self.Escape(line);
		}).join('') + '</text>';
	},

	Round: function (value) {
		return Math.round(value * 10) / 10;
	},

	/* The lines of a diagram without its comments (%%) and blank lines: [{Text, Number}]. */
	Lines: function (text) {
		var lines = [];

		String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n').forEach(function (line, index) {
			var value = line.replace(/%%.*$/, '');
			if (value.trim())
				lines.push({Text: value, Number: index + 1});
		});

		return lines;
	},

	/* An Error of a line of a diagram. */
	Fail: function (line, message) {
		var error = new Error('Elemenx Diagrams: line ' + (line ? line.Number : 1) + ': ' + message);

		error.Line = line ? line.Number : 1;

		return error;
	},

	/* The style of a classDef or a style line, kept to plain declarations: fill:#f9f,stroke:#333. */
	Style: function (text) {
		return String(text || '').split(/[,;]/).map(function (part) {
			var match = /^\s*([a-z-]+)\s*:\s*([#\w\s.%()-]+?)\s*$/i.exec(part);

			return match ? match[1].toLowerCase() + ':' + match[2] : '';
		}).filter(Boolean).join(';');
	},

	Parse: function (text) {
		var lines = this.Lines(text);
		var head = lines.length ? lines[0].Text.trim() : '';
		var kind;

		if (/^(flowchart|graph)\b/i.test(head)) kind = 'Flowchart';
		else if (/^sequenceDiagram\b/.test(head)) kind = 'Sequence';
		else if (/^stateDiagram(-v2)?\b/.test(head)) kind = 'State';
		else if (/^erDiagram\b/.test(head)) kind = 'Er';
		else if (/^gantt\b/.test(head)) kind = 'Gantt';
		else if (/^classDiagram(-v2)?\b/.test(head)) kind = 'Class';
		else if (/^mindmap\b/.test(head)) kind = 'Mindmap';
		else throw this.Fail(lines[0], 'a diagram starts with its type: flowchart, sequenceDiagram, stateDiagram-v2, erDiagram, gantt, classDiagram or mindmap');

		return this['Parse' + kind](lines);
	},

	/*
	 * The drawing of a diagram: an SVG of its size, with the styles of its parts (the tokens of the theme in a page, its
	 * own colors in a file), scoped by Id.
	 */
	SVG: function (text, options) {
		var settings = options || {};
		var model = this.Parse(text);
		var id = settings.Id || 'elemenx-diagram-' + Math.random().toString(36).slice(2, 9);
		var size = Number(settings.FontSize) || 14;
		var drawing = this['Draw' + model.Type.charAt(0).toUpperCase() + model.Type.substring(1)](model, {Id: id, Size: size});
		var scope = '#' + id + ' ';
		var css = [
			scope + '.n{fill:var(--elemenx-surface,#ffffff);stroke:var(--elemenx-accent,#3f6c9e);stroke-width:1.5}',
			scope + '.s{fill:var(--elemenx-surface-raised,#f3f5f8);stroke:var(--elemenx-border-strong,#b8c0cc);stroke-width:1}',
			scope + '.c{fill:rgba(var(--elemenx-accent-rgb,63,108,158),0.06);stroke:var(--elemenx-border-strong,#b8c0cc);stroke-width:1;stroke-dasharray:4 3}',
			scope + '.e{fill:none;stroke:var(--elemenx-text-muted,#6b7280);stroke-width:1.5}',
			scope + '.e.dotted{stroke-dasharray:3 4}',
			scope + '.e.thick{stroke-width:3}',
			scope + '.a{fill:var(--elemenx-text-muted,#6b7280);stroke:none}',
			scope + '.o{fill:var(--elemenx-surface,#ffffff);stroke:var(--elemenx-text-muted,#6b7280);stroke-width:1.5}',
			scope + '.t{fill:var(--elemenx-text,#1f2328);font-family:' + this.Font.replace(/"/g, '\'') + '}',
			scope + '.m{fill:var(--elemenx-text-muted,#6b7280);font-family:' + this.Font.replace(/"/g, '\'') + '}',
			scope + '.l{fill:var(--elemenx-background,#ffffff);stroke:none}',
			scope + '.f{fill:var(--elemenx-text,#1f2328);stroke:none}',
			scope + '.x{fill:var(--elemenx-accent,#3f6c9e);stroke:none}',
			scope + '.w{fill:var(--elemenx-accent-text,#ffffff);font-family:' + this.Font.replace(/"/g, '\'') + '}',
			scope + '.d{fill:var(--elemenx-danger,#c0392b);stroke:none}',
			scope + '.g{stroke:var(--elemenx-border,#d6dbe1);stroke-width:1}'
		].join('');

		return '<svg xmlns="http://www.w3.org/2000/svg" id="' + id + '" class="elemenx-diagram-' + model.Type + '" viewBox="0 0 ' + this.Round(drawing.Width) + ' ' + this.Round(drawing.Height) + '" width="' + this.Round(drawing.Width) + '" height="' + this.Round(drawing.Height) + '" font-size="' + size + '"><style>' + css + '</style>' + (drawing.Defs ? '<defs>' + drawing.Defs + '</defs>' : '') + drawing.Body + '</svg>';
	},

	/* The arrowheads and the ends of links, by their names, for a diagram of id. */
	Markers: function (id, names) {
		var all = {
			arrow: '<marker id="' + id + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="a" d="M0 0L10 5L0 10z"/></marker>',
			open: '<marker id="' + id + '-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="e" d="M0 0L10 5L0 10" fill="none"/></marker>',
			circle: '<marker id="' + id + '-circle" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><circle class="o" cx="5" cy="5" r="4"/></marker>',
			cross: '<marker id="' + id + '-cross" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="e" d="M1 1L9 9M9 1L1 9"/></marker>',
			triangle: '<marker id="' + id + '-triangle" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="o" d="M1 1L13 7L1 13z"/></marker>',
			diamond: '<marker id="' + id + '-diamond" viewBox="0 0 18 10" refX="17" refY="5" markerWidth="18" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="f" d="M1 5L9 1L17 5L9 9z"/></marker>',
			hollow: '<marker id="' + id + '-hollow" viewBox="0 0 18 10" refX="17" refY="5" markerWidth="18" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="o" d="M1 5L9 1L17 5L9 9z"/></marker>',
			one: '<marker id="' + id + '-one" viewBox="0 0 20 20" refX="19" refY="10" markerWidth="20" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="e" d="M13 3V17M8 3V17"/></marker>',
			zeroOne: '<marker id="' + id + '-zeroOne" viewBox="0 0 24 20" refX="23" refY="10" markerWidth="24" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="e" d="M17 3V17"/><circle class="o" cx="8" cy="10" r="4"/></marker>',
			many: '<marker id="' + id + '-many" viewBox="0 0 20 20" refX="19" refY="10" markerWidth="20" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="e" d="M7 10L19 3M7 10L19 17M7 10H19M5 3V17"/></marker>',
			zeroMany: '<marker id="' + id + '-zeroMany" viewBox="0 0 26 20" refX="25" refY="10" markerWidth="26" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="e" d="M13 10L25 3M13 10L25 17M13 10H25"/><circle class="o" cx="7" cy="10" r="4"/></marker>'
		};

		return names.map(function (name) {
			return all[name] || '';
		}).join('');
	},

	/*
	 * A layered layout of a graph (as the ones of Sugiyama): nodes {id: {Width, Height}}, edges [{From, To, Length}],
	 * Direction TB, BT, LR or RL. The cycles are broken, the nodes put in layers by the longest path, a long edge
	 * goes through dummy nodes, the layers are ordered by the barycenters of their neighbors, and each node goes over
	 * the middle of its neighbors as far as the spacing lets it. Returns {Nodes: {id: {X, Y}} (centers), Edges:
	 * [[{X, Y}]] (the points of each edge, its ends at the centers), Width, Height}.
	 */
	Layered: function (nodes, edges, options) {
		var settings = options || {};
		var direction = settings.Direction || 'TB';
		var horizontal = direction === 'LR' || direction === 'RL';
		var rankGap = settings.RankGap || 56;
		var nodeGap = settings.NodeGap || 36;
		var ids = Object.keys(nodes);
		var out = {};
		var visited = {};
		var stack = {};
		var layer = {};
		var indegree = {};
		var queue = [];
		var layers = [];
		var all = {};
		var chains = [];
		var position = {};
		var order;
		var i;
		var sweep;
		var parts = this.Components(nodes, edges, settings.Groups);
		if (parts.length > 1)
			return this.Pack(parts, nodes, edges, settings);

		ids.forEach(function (id) {
			out[id] = [];
			all[id] = {Width: nodes[id].Width, Height: nodes[id].Height, Dummy: false};
		});

		var links = edges.filter(function (edge) {
			return nodes[edge.From] && nodes[edge.To] && edge.From !== edge.To;
		}).map(function (edge) {
			return {From: edge.From, To: edge.To, Length: Math.max(1, edge.Length || 1), Reversed: false, Edge: edge};
		});

		links.forEach(function (link) {
			out[link.From].push(link);
		});

		/* The edges that close a cycle go the other way while the layers are made. */
		function visit (id) {
			visited[id] = true;
			stack[id] = true;

			out[id].forEach(function (link) {
				if (stack[link.To]) link.Reversed = true;
				else if (!visited[link.To]) visit(link.To);
			});

			stack[id] = false;
		}

		ids.forEach(function (id) {
			if (!visited[id])
				visit(id);
		});

		function source (link) {
			return link.Reversed ? link.To : link.From;
		}

		function target (link) {
			return link.Reversed ? link.From : link.To;
		}

		/* The layers: the longest path from a source, by the order of a topological walk. */
		ids.forEach(function (id) {
			indegree[id] = 0;
			layer[id] = 0;
		});

		links.forEach(function (link) {
			indegree[target(link)]++;
		});

		ids.forEach(function (id) {
			if (!indegree[id])
				queue.push(id);
		});

		while (queue.length) {
			var current = queue.shift();

			links.forEach(function (link) {
				if (source(link) !== current) return;

				layer[target(link)] = Math.max(layer[target(link)], layer[current] + link.Length);

				if (!--indegree[target(link)])
					queue.push(target(link));
			});
		}

		/* A long edge: a chain of dummy nodes through the layers between its ends. */
		links.forEach(function (link, index) {
			var from = source(link);
			var to = target(link);
			var chain = [from];
			var k;

			for (k = layer[from] + 1; k < layer[to]; k++) {
				var dummy = '\u0000' + index + '.' + k;

				all[dummy] = {Width: 2, Height: 2, Dummy: true};
				layer[dummy] = k;

				chain.push(dummy);
			}

			chain.push(to);

			chains.push({Link: link, Chain: link.Reversed ? chain.slice().reverse() : chain});
		});

		Object.keys(all).forEach(function (id) {
			(layers[layer[id]] = layers[layer[id]] || []).push(id);
		});

		for (i = 0; i < layers.length; i++) layers[i] = layers[i] || [];

		/* The neighbors of each node in the layers above and under it. */
		var up = {};
		var down = {};

		Object.keys(all).forEach(function (id) {
			up[id] = [];
			down[id] = [];
		});

		chains.forEach(function (entry) {
			var chain = entry.Link.Reversed ? entry.Chain.slice().reverse() : entry.Chain;
			var k;

			for (k = 0; k + 1 < chain.length; k++) {
				down[chain[k]].push(chain[k + 1]);
				up[chain[k + 1]].push(chain[k]);
			}
		});

		function place () {
			order = {};

			layers.forEach(function (list) {
				list.forEach(function (id, index) {
					order[id] = index;
				});
			});
		}

		/* The order in each layer, by the mean place of the neighbors on the side swept from. */
		place();

		for (sweep = 0; sweep < 12; sweep++) {
			var downward = sweep % 2 === 0;
			var range = downward ? layers.map(function (list, index) {
				return index;
			}) : layers.map(function (list, index) {
				return layers.length - 1 - index;
			});

			range.forEach(function (index) {
				var list = layers[index];
				var weight = {};

				list.forEach(function (id) {
					var near = downward ? up[id] : down[id];

					weight[id] = near.length ? near.reduce(function (sum, other) {
						return sum + order[other];
					}, 0) / near.length : order[id];
				});

				/* The members of a group together (the subgraphs of a flowchart): the group at the mean of its members. */
				var block = {};
				var key = function (id) {
					return settings.Groups && settings.Groups[id] ? block[settings.Groups[id]] : weight[id];
				};

				if (settings.Groups) {
					list.forEach(function (id) {
						var group = settings.Groups[id];
						if (!group) return;

						block[group] = block[group] || {Sum: 0, Count: 0};
						block[group].Sum += weight[id];
						block[group].Count++;
					});

					Object.keys(block).forEach(function (group) {
						block[group] = block[group].Sum / block[group].Count;
					});
				}

				list.sort(function (a, b) {
					var ga = settings.Groups && settings.Groups[a] || '';
					var gb = settings.Groups && settings.Groups[b] || '';

					return key(a) - key(b) || (ga < gb ? -1 : ga > gb ? 1 : 0) || weight[a] - weight[b] || order[a] - order[b];
				});

				list.forEach(function (id, at) {
					order[id] = at;
				});
			});
		}

		/*
		 * The groups in one order in every layer: by the mean place of their members, so a group is one column and two
		 * groups do not cross from a layer to the next.
		 */
		var groupRank = {};

		if (settings.Groups) {
			var mean = {};

			layers.forEach(function (list) {
				list.forEach(function (id, index) {
					var group = settings.Groups[id];
					if (!group) return;

					mean[group] = mean[group] || {Sum: 0, Count: 0};
					mean[group].Sum += index / Math.max(1, list.length - 1);
					mean[group].Count++;
				});
			});

			Object.keys(mean).sort(function (a, b) {
				return mean[a].Sum / mean[a].Count - mean[b].Sum / mean[b].Count;
			}).forEach(function (group, index) {
				groupRank[group] = index;
			});

			layers.forEach(function (list) {
				var grouped = list.filter(function (id) {
					return settings.Groups[id];
				}).sort(function (a, b) {
					return groupRank[settings.Groups[a]] - groupRank[settings.Groups[b]] || order[a] - order[b];
				});
				var at = 0;

				/* The grouped nodes take the places of grouped nodes, in the order of their groups; the others stay. */
				list.forEach(function (id, index) {
					if (settings.Groups[id])
						list[index] = grouped[at++];
				});

				list.forEach(function (id, index) {
					order[id] = index;
				});
			});
		}

		/* The sizes across a layer (the order) and along the ranks. */
		function across (id) {
			return horizontal ? all[id].Height : all[id].Width;
		}

		function along (id) {
			return horizontal ? all[id].Width : all[id].Height;
		}

		layers.forEach(function (list) {
			var at = 0;

			list.forEach(function (id) {
				position[id] = at + across(id) / 2;
				at += across(id) + (all[id].Dummy ? nodeGap / 3 : nodeGap);
			});
		});

		/* Each node toward the middle of its neighbors, its layer kept in order and apart. */
		for (sweep = 0; sweep < 16; sweep++) {
			(sweep % 2 === 0 ? layers : layers.slice().reverse()).forEach(function (list) {
				var wanted = list.map(function (id) {
					var near = up[id].concat(down[id]);

					return near.length ? near.reduce(function (sum, other) {
						return sum + position[other];
					}, 0) / near.length : position[id];
				});
				var k;
				var shift;

				for (k = 0; k < list.length; k++) {
					var low = k ? position[list[k - 1]] + (across(list[k - 1]) + across(list[k])) / 2 + (all[list[k]].Dummy || all[list[k - 1]].Dummy ? nodeGap / 3 : nodeGap) : -Infinity;

					position[list[k]] = Math.max(wanted[k], low);
				}

				/* The layer slides back as far as its nodes ran past where they wanted to be, on the mean. */
				shift = list.reduce(function (sum, id, index) {
					return sum + position[id] - wanted[index];
				}, 0) / Math.max(1, list.length);

				for (k = list.length - 1; k >= 0; k--) {
					var high = k < list.length - 1 ? position[list[k + 1]] - (across(list[k + 1]) + across(list[k])) / 2 - (all[list[k]].Dummy || all[list[k + 1]].Dummy ? nodeGap / 3 : nodeGap) : Infinity;

					position[list[k]] = Math.min(position[list[k]] - shift, high);
				}
			});
		}

		/*
		 * The columns of the groups apart: a group whose nodes reach under the one before it in some layer moves, with
		 * what is after it in each layer, as far as it must (the frames of the subgraphs do not overlap).
		 */
		Object.keys(groupRank).sort(function (a, b) {
			return groupRank[a] - groupRank[b];
		}).forEach(function (group, index, list) {
			var before = list.slice(0, index);
			var right = -Infinity;
			var left = Infinity;
			var shift;

			if (!before.length) return;

			Object.keys(all).forEach(function (id) {
				if (before.indexOf(settings.Groups[id]) !== -1)
					right = Math.max(right, position[id] + across(id) / 2);

				if (settings.Groups[id] === group)
					left = Math.min(left, position[id] - across(id) / 2);
			});

			shift = right + nodeGap - left;

			if (shift <= 0 || left === Infinity) return;

			layers.forEach(function (row) {
				var first = -1;

				row.forEach(function (id, at) {
					if (first === -1 && settings.Groups[id] === group)
						first = at;
				});

				if (first === -1) {
					/* A layer without the group: what is right of the groups before it moves. */
					row.forEach(function (id) {
						if (position[id] - across(id) / 2 >= left - nodeGap && before.indexOf(settings.Groups[id]) === -1)
							position[id] += shift;
					});

					return;
				}

				row.forEach(function (id, at) {
					if (at >= first)
						position[id] += shift;
				});
			});
		});

		/* The ranks: each layer as deep as its deepest node. */
		var rank = [];
		var depth = 0;
		var low = Infinity;
		var high = -Infinity;
		var result = {Nodes: {}, Edges: []};

		layers.forEach(function (list, index) {
			var thick = Math.max.apply(null, list.map(along).concat([0]));

			rank[index] = depth + thick / 2;
			depth += thick + rankGap;
		});

		Object.keys(all).forEach(function (id) {
			low = Math.min(low, position[id] - across(id) / 2);
			high = Math.max(high, position[id] + across(id) / 2);
		});

		if (low === Infinity) {
			low = 0;
			high = 0;
		}

		function point (id) {
			var a = position[id] - low;
			var r = rank[layer[id]];

			if (direction === 'BT')
				r = depth - rankGap - r;

			if (direction === 'RL')
				r = depth - rankGap - r;

			return horizontal ? {X: r, Y: a} : {X: a, Y: r};
		}

		ids.forEach(function (id) {
			result.Nodes[id] = point(id);
		});

		result.Edges = edges.map(function (edge) {
			var entry = chains.filter(function (each) {
				return each.Link.Edge === edge;
			})[0];

			if (edge.From === edge.To && nodes[edge.From]) return [point(edge.From), point(edge.From)];

			return entry ? entry.Chain.map(point) : [];
		});

		result.Width = horizontal ? Math.max(0, depth - rankGap) : high - low;
		result.Height = horizontal ? high - low : Math.max(0, depth - rankGap);

		return result;
	},

	/* The parts of a graph not linked to one another (the members of a group are one part): [[id]], in their order. */
	Components: function (nodes, edges, groups) {
		var parent = {};
		var byGroup = {};
		var parts = {};
		var list = [];

		function root (id) {
			while (parent[id] !== id) {
				parent[id] = parent[parent[id]];
				id = parent[id];
			}

			return id;
		}

		function join (a, b) {
			parent[root(a)] = root(b);
		}

		Object.keys(nodes).forEach(function (id) {
			parent[id] = id;
		});

		edges.forEach(function (edge) {
			if (nodes[edge.From] && nodes[edge.To])
				join(edge.From, edge.To);
		});

		Object.keys(groups || {}).forEach(function (id) {
			if (!nodes[id]) return;

			if (byGroup[groups[id]]) join(id, byGroup[groups[id]]);
			else byGroup[groups[id]] = id;
		});

		Object.keys(nodes).forEach(function (id) {
			var key = root(id);

			if (!parts[key]) {
				parts[key] = [];

				list.push(parts[key]);
			}

			parts[key].push(id);
		});

		return list;
	},

	/* The layouts of the parts of a graph side by side across the ranks, their first ranks in line. */
	Pack: function (parts, nodes, edges, settings) {
		var self = this;
		var horizontal = settings.Direction === 'LR' || settings.Direction === 'RL';
		var flipped = settings.Direction === 'BT' || settings.Direction === 'RL';
		var gap = (settings.NodeGap || 36) * 1.5;
		var result = {Nodes: {}, Edges: edges.map(function () {
			return [];
		}), Width: 0, Height: 0};
		var drawn;
		var deepest = 0;
		var at = 0;

		drawn = parts.map(function (ids) {
			var own = {};
			var indexes = [];
			var list = [];
			var layout;

			ids.forEach(function (id) {
				own[id] = nodes[id];
			});

			edges.forEach(function (edge, index) {
				if (own[edge.From]) {
					indexes.push(index);
					list.push(edge);
				}
			});

			layout = self.Layered(own, list, settings);
			deepest = Math.max(deepest, horizontal ? layout.Width : layout.Height);

			return {Layout: layout, Indexes: indexes};
		});

		drawn.forEach(function (part) {
			var layout = part.Layout;
			var depth = horizontal ? layout.Width : layout.Height;
			var along = flipped ? deepest - depth : 0;

			function move (p) {
				return horizontal ? {X: p.X + along, Y: p.Y + at} : {X: p.X + at, Y: p.Y + along};
			}

			Object.keys(layout.Nodes).forEach(function (id) {
				result.Nodes[id] = move(layout.Nodes[id]);
			});

			part.Indexes.forEach(function (index, k) {
				result.Edges[index] = layout.Edges[k].map(move);
			});

			at += (horizontal ? layout.Height : layout.Width) + gap;
		});

		at = Math.max(0, at - gap);
		result.Width = horizontal ? deepest : at;
		result.Height = horizontal ? at : deepest;

		return result;
	},

	/* Where the line from the center of a box (x, y, w, h) toward a point leaves it, by its shape. */
	Clip: function (box, toward) {
		var dx = toward.X - box.X;
		var dy = toward.Y - box.Y;
		var w = box.Width / 2;
		var h = box.Height / 2;
		var t;

		if (!dx && !dy)
			return {X: box.X, Y: box.Y};

		if (box.Shape === 'circle' || box.Shape === 'double') {
			t = Math.min(w, h) / Math.sqrt(dx * dx + dy * dy);
		}
		else if (box.Shape === 'diamond') {
			t = 1 / (Math.abs(dx) / w + Math.abs(dy) / h);
		}
		else {
			t = Math.min(dx ? w / Math.abs(dx) : Infinity, dy ? h / Math.abs(dy) : Infinity);
		}

		return {X: box.X + dx * t, Y: box.Y + dy * t};
	},

	/* The path of an edge through its points, its ends on the boxes: curves that leave and reach along the ranks. */
	EdgePath: function (points, from, to, horizontal) {
		var list = points.slice();
		var path;
		var k;

		if (list.length < 2)
			return {Path: '', Middle: list[0] || {X: 0, Y: 0}};

		list[0] = this.Clip(from, list[1]);
		list[list.length - 1] = this.Clip(to, list[list.length - 2]);

		path = 'M' + this.Round(list[0].X) + ' ' + this.Round(list[0].Y);

		for (k = 1; k < list.length; k++) {
			var a = list[k - 1];
			var b = list[k];

			if (horizontal) path += 'C' + this.Round((a.X + b.X) / 2) + ' ' + this.Round(a.Y) + ' ' + this.Round((a.X + b.X) / 2) + ' ' + this.Round(b.Y) + ' ' + this.Round(b.X) + ' ' + this.Round(b.Y);
			else path += 'C' + this.Round(a.X) + ' ' + this.Round((a.Y + b.Y) / 2) + ' ' + this.Round(b.X) + ' ' + this.Round((a.Y + b.Y) / 2) + ' ' + this.Round(b.X) + ' ' + this.Round(b.Y);
		}

		k = Math.floor((list.length - 1) / 2);

		return {Path: path, Middle: list.length % 2 ? list[k] : {X: (list[k].X + list[k + 1].X) / 2, Y: (list[k].Y + list[k + 1].Y) / 2}, Points: list};
	},

	/* A link of a box (X, Y its center) to itself: a loop by its right side, or over it when the ranks go across. */
	Loop: function (box, horizontal) {
		var r = this.Round;
		var x = box.X + box.Width / 2;
		var y = box.Y - box.Height / 2;

		if (horizontal)
			return {Path: 'M' + r(box.X - 8) + ' ' + r(y) + 'C' + r(box.X - 30) + ' ' + r(y - 36) + ' ' + r(box.X + 30) + ' ' + r(y - 36) + ' ' + r(box.X + 8) + ' ' + r(y), Middle: {X: box.X, Y: y - 30}};

		return {Path: 'M' + r(x) + ' ' + r(box.Y - 6) + 'C' + r(x + 36) + ' ' + r(box.Y - 30) + ' ' + r(x + 36) + ' ' + r(box.Y + 30) + ' ' + r(x) + ' ' + r(box.Y + 6), Middle: {X: x + 30, Y: box.Y}};
	},

	/*
	 * How far each edge goes aside so that two between the same nodes (one each way, or the same twice) do not lie on
	 * one another: [offset across the ranks], by the index of the edge.
	 */
	Apart: function (edges) {
		var count = {};
		var seen = {};

		function key (edge) {
			return edge.From < edge.To ? edge.From + '\u0000' + edge.To : edge.To + '\u0000' + edge.From;
		}

		edges.forEach(function (edge) {
			if (edge.From !== edge.To)
				count[key(edge)] = (count[key(edge)] || 0) + 1;
		});

		return edges.map(function (edge) {
			var k = key(edge);
			var index;

			if (edge.From === edge.To || count[k] < 2) return 0;

			index = seen[k] = (seen[k] || 0) + 1;

			return (index - (count[k] + 1) / 2) * 18;
		});
	},

	/*
	 * The label of an edge on a background at its middle; one moved aside (offset) goes past its line on its side, so
	 * that the labels of two edges between the same nodes do not meet.
	 */
	EdgeLabel: function (text, middle, size, offset, horizontal) {
		var label = this.LabelSize(text, size * 0.9);
		var side = offset > 0 ? 1 : -1;
		var at = middle;

		if (offset)
			at = horizontal ? {X: middle.X, Y: middle.Y + side * (label.Height / 2 + 4)} : {X: middle.X + side * (label.Width / 2 + 6), Y: middle.Y};

		return '<rect class="l" x="' + this.Round(at.X - label.Width / 2 - 4) + '" y="' + this.Round(at.Y - label.Height / 2 - 2) + '" width="' + this.Round(label.Width + 8) + '" height="' + this.Round(label.Height + 4) + '" rx="3"/>' + this.Text(text, at.X, at.Y, size * 0.9, {Class: 'm'});
	},

	/* The points and the ends of an edge moved aside by offset, across the ranks. */
	Aside: function (points, from, to, offset, horizontal) {
		function move (p) {
			return horizontal ? Object.assign({}, p, {Y: p.Y + offset}) : Object.assign({}, p, {X: p.X + offset});
		}

		if (!offset)
			return {Points: points, From: from, To: to};

		return {Points: points.map(move), From: move(from), To: move(to)};
	},

	/* The SVG of a node of a shape, at its center x, y, its size w by h. */
	Shape: function (shape, x, y, w, h, style) {
		var left = this.Round(x - w / 2);
		var top = this.Round(y - h / 2);
		var r = this.Round;
		var attributes = ' class="n"' + (style ? ' style="' + this.Escape(style) + '"' : '');
		var skew = h / 3;

		switch (shape) {
			case 'round': return '<rect' + attributes + ' x="' + left + '" y="' + top + '" width="' + r(w) + '" height="' + r(h) + '" rx="8"/>';
			case 'stadium': return '<rect' + attributes + ' x="' + left + '" y="' + top + '" width="' + r(w) + '" height="' + r(h) + '" rx="' + r(h / 2) + '"/>';
			case 'circle': return '<circle' + attributes + ' cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(Math.max(w, h) / 2) + '"/>';
			case 'double': return '<circle' + attributes + ' cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(Math.max(w, h) / 2) + '"/><circle' + attributes + ' cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(Math.max(w, h) / 2 - 4) + '"/>';
			case 'diamond': return '<path' + attributes + ' d="M' + r(x) + ' ' + top + 'L' + r(x + w / 2) + ' ' + r(y) + 'L' + r(x) + ' ' + r(y + h / 2) + 'L' + left + ' ' + r(y) + 'z"/>';
			case 'hexagon': return '<path' + attributes + ' d="M' + r(left + h / 3) + ' ' + top + 'H' + r(x + w / 2 - h / 3) + 'L' + r(x + w / 2) + ' ' + r(y) + 'L' + r(x + w / 2 - h / 3) + ' ' + r(y + h / 2) + 'H' + r(left + h / 3) + 'L' + left + ' ' + r(y) + 'z"/>';
			case 'subroutine': return '<rect' + attributes + ' x="' + left + '" y="' + top + '" width="' + r(w) + '" height="' + r(h) + '"/><path class="e" d="M' + r(left + 8) + ' ' + top + 'V' + r(y + h / 2) + 'M' + r(x + w / 2 - 8) + ' ' + top + 'V' + r(y + h / 2) + '"/>';
			case 'cylinder': return '<path' + attributes + ' d="M' + left + ' ' + r(top + 6) + 'A' + r(w / 2) + ' 6 0 0 1 ' + r(x + w / 2) + ' ' + r(top + 6) + 'V' + r(y + h / 2 - 6) + 'A' + r(w / 2) + ' 6 0 0 1 ' + left + ' ' + r(y + h / 2 - 6) + 'z"/><path class="e" d="M' + left + ' ' + r(top + 6) + 'A' + r(w / 2) + ' 6 0 0 0 ' + r(x + w / 2) + ' ' + r(top + 6) + '"/>';
			case 'flag': return '<path' + attributes + ' d="M' + left + ' ' + top + 'H' + r(x + w / 2) + 'V' + r(y + h / 2) + 'H' + left + 'L' + r(left + skew) + ' ' + r(y) + 'z"/>';
			case 'lean-right': return '<path' + attributes + ' d="M' + r(left + skew) + ' ' + top + 'H' + r(x + w / 2) + 'L' + r(x + w / 2 - skew) + ' ' + r(y + h / 2) + 'H' + left + 'z"/>';
			case 'lean-left': return '<path' + attributes + ' d="M' + left + ' ' + top + 'H' + r(x + w / 2 - skew) + 'L' + r(x + w / 2) + ' ' + r(y + h / 2) + 'H' + r(left + skew) + 'z"/>';
			case 'trapezoid': return '<path' + attributes + ' d="M' + r(left + skew) + ' ' + top + 'H' + r(x + w / 2 - skew) + 'L' + r(x + w / 2) + ' ' + r(y + h / 2) + 'H' + left + 'z"/>';
			case 'trapezoid-alt': return '<path' + attributes + ' d="M' + left + ' ' + top + 'H' + r(x + w / 2) + 'L' + r(x + w / 2 - skew) + ' ' + r(y + h / 2) + 'H' + r(left + skew) + 'z"/>';
			default: return '<rect' + attributes + ' x="' + left + '" y="' + top + '" width="' + r(w) + '" height="' + r(h) + '" rx="2"/>';
		}
	},

	/* The shapes of the nodes of a flowchart, by their brackets: [open, close, shape], the longest first. */
	FlowShapes: [['(((', ')))', 'double'], ['((', '))', 'circle'], ['([', '])', 'stadium'], ['[[', ']]', 'subroutine'], ['[(', ')]', 'cylinder'], ['{{', '}}', 'hexagon'], ['[/', '\\]', 'trapezoid'], ['[\\', '/]', 'trapezoid-alt'], ['[/', '/]', 'lean-right'], ['[\\', '\\]', 'lean-left'], ['>', ']', 'flag'], ['(', ')', 'round'], ['[', ']', 'rect'], ['{', '}', 'diamond']],

	/* The links of a flowchart: [pattern, line, head, tail], the longest first. */
	FlowLinks: [[/^<-{2,}>/, 'solid', 'arrow', 'arrow'], [/^<={2,}>/, 'thick', 'arrow', 'arrow'], [/^<-\.+->/, 'dotted', 'arrow', 'arrow'], [/^x-{2,}x/, 'solid', 'cross', 'cross'], [/^o-{2,}o/, 'solid', 'circle', 'circle'], [/^-{2,}>/, 'solid', 'arrow', 'none'], [/^={2,}>/, 'thick', 'arrow', 'none'], [/^-\.+->/, 'dotted', 'arrow', 'none'], [/^-{2,}o/, 'solid', 'circle', 'none'], [/^-{2,}x/, 'solid', 'cross', 'none'], [/^={2,}o/, 'thick', 'circle', 'none'], [/^={2,}x/, 'thick', 'cross', 'none'], [/^-{3,}/, 'solid', 'none', 'none'], [/^={3,}/, 'thick', 'none', 'none'], [/^-\.+-/, 'dotted', 'none', 'none'], [/^~{3,}/, 'invisible', 'none', 'none']],

	ParseFlowchart: function (lines) {
		var self = this;
		var head = /^(?:flowchart|graph)\s*(TD|TB|BT|LR|RL)?/i.exec(lines[0].Text.trim());
		var model = {Type: 'flowchart', Direction: (head[1] || 'TB').toUpperCase().replace('TD', 'TB'), Nodes: {}, Order: [], Edges: [], Groups: [], Classes: {}};
		var groups = [];

		function node (id, text, shape, line) {
			var entry = model.Nodes[id];
			var inside = groups.length ? groups[groups.length - 1] : null;

			if (!entry) {
				entry = model.Nodes[id] = {ID: id, Text: id, Shape: 'rect', Classes: [], Style: '', Group: null, Line: line.Number, Shaped: false};

				model.Order.push(id);
			}

			/* A node is in the last subgraph it is written in (as Mermaid has it): one written before goes into it. */
			if (inside && entry.Group !== inside.ID) {
				model.Groups.forEach(function (group) {
					group.Members = group.Members.filter(function (member) {
						return member !== id;
					});
				});

				inside.Members.push(id);

				entry.Group = inside.ID;
			}

			if (text !== undefined) {
				entry.Text = text;
				entry.Shape = shape;
				entry.Shaped = true;
			}

			return entry;
		}

		/* A node at the start of a text: {ID, Text, Shape, Rest} or null. */
		function readNode (text, line) {
			/* A dash inside a name only before a letter or a digit: c1-->a2 is c1, a link and a2. */
			var match = /^\s*([A-Za-z0-9_\u00c0-\ufffd](?:[\w\u00c0-\ufffd.]|-(?=[A-Za-z0-9_\u00c0-\ufffd]))*)/.exec(text);
			var rest;
			var found = null;
			var classes = [];

			if (!match)
				return null;

			rest = text.substring(match[0].length);

			self.FlowShapes.some(function (shape) {
				var end;
				var label;

				if (rest.indexOf(shape[0]) !== 0) return false;

				label = rest.substring(shape[0].length);

				if (label.charAt(0) === '"') {
					end = label.indexOf('"', 1);

					if (end === -1 || label.substring(end + 1).indexOf(shape[1]) !== 0) return false;

					found = {Text: label.substring(1, end), Shape: shape[2], Rest: label.substring(end + 1 + shape[1].length)};

					return true;
				}

				end = label.indexOf(shape[1]);

				if (end === -1) return false;

				found = {Text: label.substring(0, end).trim(), Shape: shape[2], Rest: label.substring(end + shape[1].length)};

				return true;
			});

			if (found)
				rest = found.Rest;

			while (/^:::([\w-]+)/.test(rest)) {
				classes.push(/^:::([\w-]+)/.exec(rest)[1]);

				rest = rest.replace(/^:::[\w-]+/, '');
			}

			if (found === null && /^[[({>]/.test(rest))
				throw self.Fail(line, 'a node is not closed: ' + text.trim());

			return {ID: match[1], Text: found ? found.Text : undefined, Shape: found ? found.Shape : 'rect', Classes: classes, Rest: rest};
		}

		/* The nodes of a side of a link: A, or A & B. */
		function readNodes (text, line) {
			var list = [];
			var rest = text;
			var one;

			do {
				one = readNode(rest, line);

				if (!one)
					throw self.Fail(line, 'a node is expected at: ' + rest.trim());

				list.push(one);

				rest = one.Rest;

				if (!/^\s*&/.test(rest)) break;

				rest = rest.replace(/^\s*&/, '');
			} while (true);

			return {Nodes: list, Rest: rest};
		}

		function statement (text, line) {
			var match;
			var side;
			var rest;
			var before;

			if (/^\s*$/.test(text)) return;

			if ((match = /^\s*subgraph\s+([^\s[]+)\s*(?:\[(.*)\])?\s*$/.exec(text)) || (match = /^\s*subgraph\s+(.+?)\s*$/.exec(text))) {
				var group = {ID: /^[\w-]+$/.test(match[1]) ? match[1] : 'group' + model.Groups.length, Title: match[2] !== undefined ? match[2].replace(/^"|"$/g, '') : match[1].replace(/^"|"$/g, ''), Members: [], Parent: groups.length ? groups[groups.length - 1].ID : null};

				model.Groups.push(group);
				groups.push(group);

				return;
			}

			if (/^\s*end\s*$/.test(text)) {
				if (!groups.length)
					throw self.Fail(line, 'end without a subgraph');

				groups.pop();

				return;
			}

			if (/^\s*direction\s+/.test(text) || /^\s*(linkStyle|click)\b/.test(text)) return;

			if ((match = /^\s*classDef\s+([\w,-]+)\s+(.+)$/.exec(text))) {
				match[1].split(',').forEach(function (name) {
					model.Classes[name] = self.Style(match[2]);
				});

				return;
			}

			if ((match = /^\s*class\s+([\w,\s-]+?)\s+([\w-]+)\s*$/.exec(text))) {
				match[1].split(',').forEach(function (id) {
					node(id.trim(), undefined, undefined, line).Classes.push(match[2]);
				});

				return;
			}

			if ((match = /^\s*style\s+([\w-]+)\s+(.+)$/.exec(text))) {
				node(match[1], undefined, undefined, line).Style = self.Style(match[2]);

				return;
			}

			/* The text forms of links, as their | | forms: A -- text --> B is A -->|text| B. */
			rest = text.replace(/(\s|^)--\s+([^|>-][^|]*?)\s+(-{2,}>|-{3,}|-{2,}[ox])/g, '$1$3|$2|').replace(/(\s|^)==\s+([^|>=][^|]*?)\s+(={2,}>|={3,})/g, '$1$3|$2|').replace(/(\s|^)-\.\s+([^|]*?)\s+\.(-+>|-)/g, '$1-.$3|$2|');

			side = readNodes(rest, line);

			side.Nodes.forEach(function (one) {
				var entry = node(one.ID, one.Text, one.Shape, line);

				one.Classes.forEach(function (name) {
					entry.Classes.push(name);
				});
			});

			rest = side.Rest;
			before = side.Nodes;

			while (rest.trim()) {
				var link = null;
				var label = '';
				var trimmed = rest.replace(/^\s+/, '');
				var next;

				self.FlowLinks.some(function (entry) {
					var found = entry[0].exec(trimmed);
					if (!found)
						return false;

					link = {Line: entry[1], Head: entry[2], Tail: entry[3], Length: Math.max(1, found[0].replace(/[<>ox]/g, '').length - (entry[1] === 'dotted' ? 2 : 2))};
					trimmed = trimmed.substring(found[0].length);

					return true;
				});

				if (!link)
					throw self.Fail(line, 'a link is expected at: ' + trimmed);

				if ((match = /^\s*\|([^|]*)\|/.exec(trimmed))) {
					label = match[1].trim().replace(/^"|"$/g, '');
					trimmed = trimmed.substring(match[0].length);
				}

				next = readNodes(trimmed, line);

				next.Nodes.forEach(function (one) {
					var entry = node(one.ID, one.Text, one.Shape, line);

					one.Classes.forEach(function (name) {
						entry.Classes.push(name);
					});
				});

				before.forEach(function (from) {
					next.Nodes.forEach(function (to) {
						model.Edges.push({From: from.ID, To: to.ID, Line: link.Line, Head: link.Head, Tail: link.Tail, Text: label, Length: link.Length});
					});
				});

				before = next.Nodes;
				rest = next.Rest;
			}
		}

		lines.slice(1).forEach(function (line) {
			/* Statements apart by ; outside quotes. */
			line.Text.split(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/).forEach(function (part) {
				statement(part, line);
			});
		});

		if (groups.length)
			throw this.Fail(lines[lines.length - 1], 'a subgraph has no end');

		/* A link to the name of a subgraph goes to its box: the node its name made goes. */
		model.Groups.forEach(function (group) {
			var entry = model.Nodes[group.ID];
			if (!entry || entry.Shaped) return;

			delete model.Nodes[group.ID];

			model.Order = model.Order.filter(function (id) {
				return id !== group.ID;
			});

			model.Groups.forEach(function (other) {
				other.Members = other.Members.filter(function (member) {
					return member !== group.ID;
				});
			});

			model.Edges.forEach(function (edge) {
				if (edge.From === group.ID)
					edge.FromGroup = true;

				if (edge.To === group.ID)
					edge.ToGroup = true;
			});
		});

		return model;
	},

	/* The arrows of a sequence: [pattern, line, head]. */
	SequenceArrows: [['-->>', 'dotted', 'arrow'], ['->>', 'solid', 'arrow'], ['--x', 'dotted', 'cross'], ['-x', 'solid', 'cross'], ['--)', 'dotted', 'async'], ['-)', 'solid', 'async'], ['-->', 'dotted', 'none'], ['->', 'solid', 'none']],

	ParseSequence: function (lines) {
		var self = this;
		var model = {Type: 'sequence', Participants: [], Events: [], Numbered: false};
		var known = {};
		var blocks = [];

		function participant (name, label, kind) {
			var key = String(name).trim();

			if (!known[key]) {
				known[key] = {ID: key, Label: label || key, Kind: kind || 'participant'};

				model.Participants.push(known[key]);
			}
			else if (label) {
				known[key].Label = label;
			}

			if (kind)
				known[key].Kind = kind;

			return known[key];
		}

		lines.slice(1).forEach(function (line) {
			var text = line.Text.trim();
			var match;
			var arrow = null;

			if ((match = /^(participant|actor)\s+(.+?)(?:\s+as\s+(.+))?$/i.exec(text))) {
				participant(match[2], match[3], match[1].toLowerCase());

				return;
			}

			if (/^autonumber\b/i.test(text)) {
				model.Numbered = true;

				return;
			}

			if ((match = /^(activate|deactivate)\s+(.+)$/i.exec(text))) {
				model.Events.push({Kind: match[1].toLowerCase(), Participant: participant(match[2]).ID});

				return;
			}

			if ((match = /^note\s+(left of|right of|over)\s+([^:]+?)\s*:\s*(.*)$/i.exec(text))) {
				model.Events.push({Kind: 'note', Place: match[1].toLowerCase(), Participants: match[2].split(',').map(function (name) {
					return participant(name).ID;
				}), Text: match[3]});

				return;
			}

			if ((match = /^(loop|alt|opt|par|critical|break|rect)\b\s*(.*)$/i.exec(text))) {
				var block = {Kind: 'block', Type: match[1].toLowerCase(), Text: match[2], Parts: []};

				blocks.push(block);
				model.Events.push({Kind: 'open', Block: block});

				return;
			}

			if ((match = /^(else|and)\b\s*(.*)$/i.exec(text))) {
				if (!blocks.length)
					throw self.Fail(line, match[1] + ' outside a block');

				model.Events.push({Kind: 'part', Block: blocks[blocks.length - 1], Text: match[2]});

				return;
			}

			if (/^end$/i.test(text)) {
				if (!blocks.length)
					throw self.Fail(line, 'end without a block');

				model.Events.push({Kind: 'close', Block: blocks.pop()});

				return;
			}

			self.SequenceArrows.some(function (entry) {
				var at = text.indexOf(entry[0]);
				var rest;
				var colon;
				var to;

				if (at <= 0)
					return false;

				rest = text.substring(at + entry[0].length);
				colon = rest.indexOf(':');
				to = (colon === -1 ? rest : rest.substring(0, colon)).trim();

				arrow = {Kind: 'message', From: participant(text.substring(0, at)).ID, Line: entry[1], Head: entry[2], Activate: to.charAt(0) === '+', Deactivate: to.charAt(0) === '-', Text: colon === -1 ? '' : rest.substring(colon + 1).trim()};
				arrow.To = participant(to.replace(/^[+-]/, '')).ID;

				return true;
			});

			if (!arrow)
				throw self.Fail(line, 'a message is expected (A->>B: text): ' + text);

			model.Events.push(arrow);
		});

		if (blocks.length)
			throw this.Fail(lines[lines.length - 1], 'a block has no end');

		return model;
	},

	DrawSequence: function (model, options) {
		var self = this;
		var size = options.Size;
		var gap = 36;
		var x = {};
		var widths = {};
		var head = size * 2.6;
		var top = 20;
		var y;
		var body = '';
		var lifelines = '';
		var frames = '';
		var notes = '';
		var active = {};
		var bars = '';
		var number = 0;
		var open = [];
		var markers = {arrow: true};
		var right;
		var index = {};

		/* The columns: each participant as wide as its name, apart as far as the texts of the messages between them. */
		model.Participants.forEach(function (one, at) {
			widths[one.ID] = Math.max(96, self.Measure(one.Label, size, 600) + 28);
			index[one.ID] = at;
		});

		var spans = model.Participants.map(function () {
			return 0;
		});

		model.Events.forEach(function (event) {
			var a;
			var b;
			var need;

			if (event.Kind === 'message') {
				a = Math.min(index[event.From], index[event.To]);
				b = Math.max(index[event.From], index[event.To]);
				need = self.Measure(event.Text, size * 0.95) + 40 + (model.Numbered ? 24 : 0);

				if (a === b) {
					spans[a] = Math.max(spans[a], need / 2 + 40);
				}
				else {
					need = need / (b - a);

					for (var k = a; k < b; k++) spans[k] = Math.max(spans[k], need);
				}
			}

			if (event.Kind === 'note' && event.Participants.length === 1) {
				a = index[event.Participants[0]];
				need = self.Measure(event.Text, size * 0.9) + 40;

				if (event.Place === 'right of')
					spans[a] = Math.max(spans[a], need + 20);

				if (event.Place === 'left of' && a > 0)
					spans[a - 1] = Math.max(spans[a - 1], need + 20);
			}
		});

		right = 20;

		model.Participants.forEach(function (one, at) {
			x[one.ID] = right + widths[one.ID] / 2;
			right = x[one.ID] + widths[one.ID] / 2 + Math.max(gap, spans[at] - (widths[one.ID] + (model.Participants[at + 1] ? widths[model.Participants[at + 1].ID] : 0)) / 2);
		});

		y = top + head + 24;

		function participantBox (one, at) {
			var w = widths[one.ID];

			if (one.Kind === 'actor') {
				return '<g class="actor"><circle class="n" cx="' + self.Round(x[one.ID]) + '" cy="' + self.Round(at + 4) + '" r="4"/><path class="e" d="M' + self.Round(x[one.ID]) + ' ' + self.Round(at + 8) + 'v6m-7 -3h14m-7 3l-5 6m5 -6l5 6"/>' + self.Text(one.Label, x[one.ID], at + 20 + size * 0.65, size, {Weight: 600}) + '</g>';
			}

			return '<rect class="n" x="' + self.Round(x[one.ID] - w / 2) + '" y="' + self.Round(at) + '" width="' + self.Round(w) + '" height="' + self.Round(head) + '" rx="4"/>' + self.Text(one.Label, x[one.ID], at + head / 2, size, {Weight: 600});
		}

		model.Events.forEach(function (event) {
			var from;
			var to;
			var label;
			var text;
			var lines;
			var height;

			if (event.Kind === 'activate') {
				(active[event.Participant] = active[event.Participant] || []).push(y - 6);

				return;
			}

			if (event.Kind === 'deactivate') {
				if (active[event.Participant] && active[event.Participant].length) {
					var start = active[event.Participant].pop();
					var depth = active[event.Participant].length;

					bars += '<rect class="s" x="' + self.Round(x[event.Participant] - 5 + depth * 5) + '" y="' + self.Round(start) + '" width="10" height="' + self.Round(Math.max(8, y - 10 - start)) + '"/>';
				}

				return;
			}

			if (event.Kind === 'open') {
				open.push({Block: event.Block, Top: y, Parts: []});

				y += size * 1.8 + 8;

				return;
			}

			if (event.Kind === 'part') {
				open[open.length - 1].Parts.push({Y: y, Text: event.Text});

				y += size * 1.6 + 6;

				return;
			}

			if (event.Kind === 'close') {
				var frame = open.pop();
				var members = [];
				var leftmost;
				var rightmost;
				var label2 = frame.Block.Type + (frame.Block.Text ? '' : '');
				var tab = self.Measure(frame.Block.Type, size * 0.85, 700) + 18;

				leftmost = 10 + open.length * 8;
				rightmost = right - 10 - open.length * 8;

				members.push(leftmost);

				frames += '<g class="frame"><rect class="' + (frame.Block.Type === 'rect' ? 'c' : 's') + '" x="' + self.Round(leftmost) + '" y="' + self.Round(frame.Top) + '" width="' + self.Round(rightmost - leftmost) + '" height="' + self.Round(y - frame.Top + 4) + '" fill-opacity="0.35"/>' + (frame.Block.Type === 'rect' ? '' : '<path class="x" d="M' + self.Round(leftmost) + ' ' + self.Round(frame.Top) + 'h' + self.Round(tab) + 'v' + self.Round(size * 1.2) + 'l-6 6h' + self.Round(-tab + 6) + 'z"/>' + self.Text(label2, leftmost + tab / 2 - 2, frame.Top + size * 0.75, size * 0.85, {Class: 'w', Weight: 700}) + (frame.Block.Text ? self.Text('[' + frame.Block.Text + ']', leftmost + tab + 10, frame.Top + size * 0.8, size * 0.9, {Anchor: 'start', Class: 'm', Weight: 600}) : '')) + frame.Parts.map(function (part) {
					return '<path class="e dotted" d="M' + self.Round(leftmost) + ' ' + self.Round(part.Y) + 'H' + self.Round(rightmost) + '"/>' + (part.Text ? self.Text('[' + part.Text + ']', leftmost + 10, part.Y + size * 0.8, size * 0.9, {Anchor: 'start', Class: 'm', Weight: 600}) : '');
				}).join('') + '</g>';

				y += 16;

				return;
			}

			if (event.Kind === 'note') {
				text = self.LabelSize(event.Text, size * 0.9);
				height = text.Height + 14;

				var left;
				var width = text.Width + 24;

				if (event.Place === 'over') {
					var xs = event.Participants.map(function (id) {
						return x[id];
					});

					left = Math.min.apply(null, xs) - 30;
					width = Math.max(width, Math.max.apply(null, xs) - Math.min.apply(null, xs) + 60);
					left = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2 - width / 2;
				}
				else if (event.Place === 'right of') {
					left = x[event.Participants[0]] + 14;
				}
				else {
					left = x[event.Participants[0]] - 14 - width;
				}

				notes += '<rect class="n" x="' + self.Round(left) + '" y="' + self.Round(y) + '" width="' + self.Round(width) + '" height="' + self.Round(height) + '" rx="2" style="fill:rgba(255,213,79,0.22);stroke:rgba(217,154,30,0.9)"/>' + self.Text(event.Text, left + width / 2, y + height / 2, size * 0.9);

				y += height + 14;

				return;
			}

			/* A message: an arrow from its lifeline to the other, its text over it; one to itself turns back. */
			from = x[event.From];
			to = x[event.To];
			label = (model.Numbered ? ++number + '. ' : '') + event.Text;
			lines = self.LabelLines(label).length;

			if (event.Head === 'cross')
				markers.cross = true;

			if (event.Head === 'async')
				markers.open = true;

			var markerEnd = event.Head === 'none' ? '' : ' marker-end="url(#' + options.Id + '-' + (event.Head === 'arrow' ? 'arrow' : event.Head === 'cross' ? 'cross' : 'open') + ')"';

			y += lines * size * 1.25;

			if (event.From === event.To) {
				body += self.Text(label, from + 12, y - lines * size * 0.65 - 4, size * 0.95, {Anchor: 'start'}) + '<path class="e' + (event.Line === 'dotted' ? ' dotted' : '') + '" d="M' + self.Round(from) + ' ' + self.Round(y) + 'h36v22h-34"' + markerEnd + '/>';
				y += 22;
			}
			else {
				body += self.Text(label, (from + to) / 2, y - lines * size * 0.65 - 4, size * 0.95) + '<path class="e' + (event.Line === 'dotted' ? ' dotted' : '') + '" d="M' + self.Round(from + (to > from ? 1 : -1)) + ' ' + self.Round(y) + 'H' + self.Round(to + (to > from ? -2 : 2)) + '"' + markerEnd + '/>';
			}

			if (event.Activate)
				(active[event.To] = active[event.To] || []).push(y);

			if (event.Deactivate && active[event.From] && active[event.From].length) {
				var begin = active[event.From].pop();

				bars += '<rect class="s" x="' + self.Round(x[event.From] - 5 + active[event.From].length * 5) + '" y="' + self.Round(begin) + '" width="10" height="' + self.Round(Math.max(8, y - begin)) + '"/>';
			}

			y += 18;
		});

		/* What is still active ends at the bottom. */
		Object.keys(active).forEach(function (id) {
			active[id].forEach(function (start, depth) {
				bars += '<rect class="s" x="' + self.Round(x[id] - 5 + depth * 5) + '" y="' + self.Round(start) + '" width="10" height="' + self.Round(Math.max(8, y - start)) + '"/>';
			});
		});

		y += 10;

		model.Participants.forEach(function (one) {
			lifelines += '<path class="e dotted" d="M' + self.Round(x[one.ID]) + ' ' + self.Round(top + head) + 'V' + self.Round(y) + '"/>' + participantBox(one, top) + participantBox(one, y);
		});

		return {Width: right + 10, Height: y + head + 20, Defs: this.Markers(options.Id, Object.keys(markers)), Body: frames + lifelines + bars + body + notes};
	},

	ParseState: function (lines) {
		var self = this;
		var sequence = 0;

		function scope (id) {
			return {ID: id, States: {}, Order: [], Transitions: [], Direction: 'TB'};
		}

		var root = scope('root');
		var stack = [root];
		var notes = 0;

		function state (current, id, line) {
			var key = String(id).trim();

			if (!current.States[key]) {
				current.States[key] = {ID: key, Label: key, Kind: 'state', Descriptions: [], Scope: null, Line: line.Number};

				current.Order.push(key);
			}

			return current.States[key];
		}

		/* [*] of a scope: its start on the left of an arrow, its end on the right. */
		function end (current, name, left, line) {
			var key = '\u0000' + (left ? 'start' : 'end') + ':' + current.ID;

			if (name.trim() !== '[*]')
				return state(current, name, line).ID;

			if (!current.States[key]) {
				current.States[key] = {ID: key, Label: '', Kind: left ? 'start' : 'end', Descriptions: [], Scope: null};

				current.Order.push(key);
			}

			return key;
		}

		lines.slice(1).forEach(function (line) {
			var text = line.Text.trim();
			var current = stack[stack.length - 1];
			var match;

			if ((match = /^direction\s+(TB|TD|BT|LR|RL)$/i.exec(text))) {
				current.Direction = match[1].toUpperCase().replace('TD', 'TB');

				return;
			}

			if (text === '}') {
				if (stack.length === 1)
					throw self.Fail(line, '} without a state of states');

				stack.pop();

				return;
			}

			if (text === '--') return;

			/* state "Text" as A, state A as "Text", state A <<choice>>, state A { */
			if ((match = /^state\s+(?:"([^"]*)"\s+as\s+)?([\w\u00c0-\ufffd.-]+)(?:\s+as\s+"([^"]*)")?\s*(?:<<(choice|fork|join)>>)?\s*(\{)?$/.exec(text))) {
				var entry = state(current, match[2], line);

				if (match[1] || match[3])
					entry.Label = match[1] || match[3];

				if (match[4])
					entry.Kind = match[4];

				if (match[5]) {
					entry.Kind = 'composite';
					entry.Scope = scope(entry.ID + '#' + ++sequence);

					stack.push(entry.Scope);
				}

				return;
			}

			if ((match = /^note\s+(left of|right of)\s+([^:]+?)\s*:\s*(.*)$/i.exec(text))) {
				var note = '\u0000note' + ++notes;

				current.States[note] = {ID: note, Label: match[3], Kind: 'note', Descriptions: [], Scope: null};

				current.Order.push(note);
				current.Transitions.push({From: match[1].toLowerCase() === 'left of' ? note : state(current, match[2], line).ID, To: match[1].toLowerCase() === 'left of' ? state(current, match[2], line).ID : note, Text: '', Note: true});

				return;
			}

			if ((match = /^(.+?)\s*-->\s*([^:]+?)\s*(?::\s*(.*))?$/.exec(text))) {
				current.Transitions.push({From: end(current, match[1], true, line), To: end(current, match[2], false, line), Text: match[3] || ''});

				return;
			}

			if ((match = /^([\w\u00c0-\ufffd.-]+)\s*:\s*(.*)$/.exec(text))) {
				state(current, match[1], line).Descriptions.push(match[2]);

				return;
			}

			if ((match = /^([\w\u00c0-\ufffd.-]+)$/.exec(text))) {
				state(current, match[1], line);

				return;
			}

			throw self.Fail(line, 'a state or a transition is expected (A --> B): ' + text);
		});

		if (stack.length > 1)
			throw this.Fail(lines[lines.length - 1], 'a state of states has no }');

		return {Type: 'state', Root: root};
	},

	DrawState: function (model, options) {
		var drawn = this.StateScope(model.Root, options, true);

		return {Width: drawn.Width + 48, Height: drawn.Height + 48, Defs: this.Markers(options.Id, ['arrow']), Body: '<g transform="translate(24 24)">' + drawn.Body + '</g>'};
	},

	/* A scope of states drawn from 0, 0: {Width, Height, Body}; a state of states holds the drawing of its own scope. */
	StateScope: function (current, options) {
		var self = this;
		var size = options.Size;
		var horizontal = current.Direction === 'LR' || current.Direction === 'RL';
		var boxes = {};
		var inner = {};
		var layout;
		var body = '';
		var edges = '';

		current.Order.forEach(function (id) {
			var entry = current.States[id];
			var label;
			var lines;

			if (entry.Kind === 'start') {
				boxes[id] = {Width: 18, Height: 18, Shape: 'circle'};
			}
			else if (entry.Kind === 'end') {
				boxes[id] = {Width: 22, Height: 22, Shape: 'circle'};
			}
			else if (entry.Kind === 'choice') {
				boxes[id] = {Width: 30, Height: 30, Shape: 'diamond'};
			}
			else if (entry.Kind === 'fork' || entry.Kind === 'join') {
				boxes[id] = horizontal ? {Width: 10, Height: 70, Shape: 'rect'} : {Width: 70, Height: 10, Shape: 'rect'};
			}
			else if (entry.Kind === 'composite') {
				inner[id] = self.StateScope(entry.Scope, options);
				boxes[id] = {Width: Math.max(inner[id].Width + 32, self.Measure(entry.Label, size, 600) + 32), Height: inner[id].Height + size * 1.8 + 24, Shape: 'rect'};
			}
			else {
				label = self.LabelSize(entry.Label, size, entry.Kind === 'note' ? 400 : 600);
				lines = entry.Descriptions.map(function (description) {
					return self.Measure(description, size * 0.9);
				});

				boxes[id] = {Width: Math.max(label.Width, Math.max.apply(null, lines.concat([0]))) + 32, Height: label.Height + 20 + (entry.Descriptions.length ? entry.Descriptions.length * size * 1.2 + 10 : 0), Shape: 'rect'};
			}
		});

		layout = this.Layered(boxes, current.Transitions, {Direction: current.Direction, RankGap: 50, NodeGap: 40});

		var apart = this.Apart(current.Transitions);

		current.Transitions.forEach(function (transition, index) {
			var points = layout.Edges[index];
			var path;
			var moved;

			if (!points || points.length < 2) return;

			if (transition.From === transition.To) {
				path = self.Loop(Object.assign({}, boxes[transition.From], layout.Nodes[transition.From]), horizontal);
			}
			else {
				moved = self.Aside(points, Object.assign({}, boxes[transition.From], layout.Nodes[transition.From]), Object.assign({}, boxes[transition.To], layout.Nodes[transition.To]), apart[index], horizontal);
				path = self.EdgePath(moved.Points, moved.From, moved.To, horizontal);
			}

			edges += '<path class="e' + (transition.Note ? ' dotted' : '') + '" d="' + path.Path + '"' + (transition.Note ? '' : ' marker-end="url(#' + options.Id + '-arrow)"') + '/>';

			if (transition.Text) {
				edges += self.EdgeLabel(transition.Text, path.Middle, size, apart[index], horizontal);
			}
		});

		current.Order.forEach(function (id) {
			var entry = current.States[id];
			var at = layout.Nodes[id];
			var box = boxes[id];
			var left = at.X - box.Width / 2;
			var top = at.Y - box.Height / 2;

			if (entry.Kind === 'start') {
				body += '<circle class="f" cx="' + self.Round(at.X) + '" cy="' + self.Round(at.Y) + '" r="8"/>';
			}
			else if (entry.Kind === 'end') {
				body += '<circle class="o" cx="' + self.Round(at.X) + '" cy="' + self.Round(at.Y) + '" r="10"/><circle class="f" cx="' + self.Round(at.X) + '" cy="' + self.Round(at.Y) + '" r="6"/>';
			}
			else if (entry.Kind === 'choice') {
				body += self.Shape('diamond', at.X, at.Y, box.Width, box.Height);
			}
			else if (entry.Kind === 'fork' || entry.Kind === 'join') {
				body += '<rect class="f" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="2"/>';
			}
			else if (entry.Kind === 'note') {
				body += '<rect class="n" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="2" style="fill:rgba(255,213,79,0.22);stroke:rgba(217,154,30,0.9)"/>' + self.Text(entry.Label, at.X, at.Y, size * 0.9);
			}
			else if (entry.Kind === 'composite') {
				body += '<g class="state" data-id="' + self.Escape(id) + '"><rect class="c" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="10"/>' + self.Text(entry.Label, left + 14, top + size * 0.9 + 6, size, {Anchor: 'start', Weight: 600}) + '<path class="g" d="M' + self.Round(left) + ' ' + self.Round(top + size * 1.8 + 6) + 'h' + self.Round(box.Width) + '"/><g transform="translate(' + self.Round(left + 16) + ' ' + self.Round(top + size * 1.8 + 14) + ')">' + inner[id].Body + '</g></g>';
			}
			else {
				var labelHeight = self.LabelSize(entry.Label, size, 600).Height + 20;

				body += '<g class="state" data-id="' + self.Escape(id) + '"><rect class="n" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="10"/>' + self.Text(entry.Label, at.X, top + labelHeight / 2, size, {Weight: 600});

				if (entry.Descriptions.length) {
					body += '<path class="g" d="M' + self.Round(left) + ' ' + self.Round(top + labelHeight) + 'h' + self.Round(box.Width) + '"/>';

					entry.Descriptions.forEach(function (description, index) {
						body += self.Text(description, left + 12, top + labelHeight + 8 + (index + 0.5) * size * 1.2, size * 0.9, {Anchor: 'start', Class: 'm'});
					});
				}

				body += '</g>';
			}
		});

		return {Width: Math.max(layout.Width, 20), Height: Math.max(layout.Height, 20), Body: edges + body};
	},

	/* The ends of a relation of an ER diagram, by their tokens on each side of its line. */
	ErEnds: {Left: {'|o': 'zeroOne', '||': 'one', '}o': 'zeroMany', '}|': 'many'}, Right: {'o|': 'zeroOne', '||': 'one', 'o{': 'zeroMany', '|{': 'many'}},

	ParseEr: function (lines) {
		var self = this;
		var model = {Type: 'er', Direction: 'TB', Entities: {}, Order: [], Relations: []};
		var open = null;

		function entity (name, line) {
			if (!model.Entities[name]) {
				model.Entities[name] = {ID: name, Label: name, Attributes: [], Line: line.Number};

				model.Order.push(name);
			}

			return model.Entities[name];
		}

		lines.slice(1).forEach(function (line) {
			var text = line.Text.trim();
			var match;

			if (open) {
				if (text === '}') {
					open = null;

					return;
				}

				/* type name [PK, FK, UK] ["comment"] */
				match = /^([\w\u00c0-\ufffd()[\],<>-]+)\s+([\w\u00c0-\ufffd*-]+)((?:\s+(?:PK|FK|UK)\s*,?)*)\s*(?:"([^"]*)")?$/.exec(text);

				if (!match)
					throw self.Fail(line, 'an attribute is a type and a name: string name PK "comment"');

				open.Attributes.push({Type: match[1], Name: match[2], Keys: match[3].replace(/,/g, ' ').trim().split(/\s+/).filter(function (key) {
					return key;
				}), Comment: match[4] || ''});

				return;
			}

			if ((match = /^direction\s+(TB|TD|BT|LR|RL)$/i.exec(text))) {
				model.Direction = match[1].toUpperCase().replace('TD', 'TB');

				return;
			}

			if ((match = /^([\w\u00c0-\ufffd-]+)(?:\s*\[\s*"?([^"\]]*)"?\s*\])?\s*\{\s*(\})?$/.exec(text))) {
				open = entity(match[1], line);

				if (match[2])
					open.Label = match[2];

				if (match[3])
					open = null;

				return;
			}

			if ((match = /^([\w\u00c0-\ufffd-]+)\s+(\|o|\|\||\}o|\}\|)(--|\.\.)(o\||\|\||o\{|\|\{)\s+([\w\u00c0-\ufffd-]+)\s*(?::\s*(.*))?$/.exec(text))) {
				entity(match[1], line);
				entity(match[5], line);

				model.Relations.push({From: match[1], To: match[5], Tail: self.ErEnds.Left[match[2]], Head: self.ErEnds.Right[match[4]], Identifying: match[3] === '--', Text: (match[6] || '').replace(/^"(.*)"$/, '$1')});

				return;
			}

			if ((match = /^([\w\u00c0-\ufffd-]+)(?:\s*\[\s*"?([^"\]]*)"?\s*\])?$/.exec(text))) {
				if (match[2]) entity(match[1], line).Label = match[2];
				else entity(match[1], line);

				return;
			}

			throw self.Fail(line, 'an entity or a relation is expected (A ||--o{ B : text): ' + text);
		});

		if (open)
			throw this.Fail(lines[lines.length - 1], 'the entity ' + open.ID + ' has no }');

		return model;
	},

	DrawEr: function (model, options) {
		var self = this;
		var size = options.Size;
		var small = size * 0.9;
		var horizontal = model.Direction === 'LR' || model.Direction === 'RL';
		var row = small * 1.7;
		var headHeight = size * 2.1;
		var boxes = {};
		var columns = {};
		var layout;
		var body = '';
		var edges = '';
		var labels = '';
		var markers = {};
		var pad = 24;
		var apart = this.Apart(model.Relations);

		model.Order.forEach(function (id) {
			var entry = model.Entities[id];
			var widths = [0, 0, 0, 0];

			entry.Attributes.forEach(function (attribute) {
				widths[0] = Math.max(widths[0], self.Measure(attribute.Type, small));
				widths[1] = Math.max(widths[1], self.Measure(attribute.Name, small, 600));
				widths[2] = Math.max(widths[2], self.Measure(attribute.Keys.join(', '), small * 0.85, 600));
				widths[3] = Math.max(widths[3], self.Measure(attribute.Comment, small));
			});

			columns[id] = widths;
			boxes[id] = {
				Width: Math.max(self.Measure(entry.Label, size, 700) + 32, widths.reduce(function (sum, width) {
					return sum + (width ? width + 16 : 0);
				}, 8), 110),
				Height: headHeight + entry.Attributes.length * row + (entry.Attributes.length ? 4 : 0),
				Shape: 'rect'
			};
		});

		layout = this.Layered(boxes, model.Relations, {Direction: model.Direction, RankGap: 70, NodeGap: 56});

		model.Relations.forEach(function (relation, index) {
			var points = (layout.Edges[index] || []).map(function (p) {
				return {X: p.X + pad, Y: p.Y + pad};
			});
			var from = Object.assign({}, boxes[relation.From], {X: layout.Nodes[relation.From].X + pad, Y: layout.Nodes[relation.From].Y + pad});
			var to = Object.assign({}, boxes[relation.To], {X: layout.Nodes[relation.To].X + pad, Y: layout.Nodes[relation.To].Y + pad});
			var path;
			var moved;

			if (relation.From === relation.To) {
				path = self.Loop(from, horizontal);
			}
			else {
				moved = self.Aside(points, from, to, apart[index], horizontal);
				path = self.EdgePath(moved.Points, moved.From, moved.To, horizontal);
			}

			markers[relation.Head] = true;
			markers[relation.Tail] = true;

			edges += '<path class="e' + (relation.Identifying ? '' : ' dotted') + '" d="' + path.Path + '" marker-start="url(#' + options.Id + '-' + relation.Tail + ')" marker-end="url(#' + options.Id + '-' + relation.Head + ')"/>';

			if (relation.Text)
				labels += self.EdgeLabel(relation.Text, path.Middle, size, apart[index], horizontal);
		});

		model.Order.forEach(function (id) {
			var entry = model.Entities[id];
			var at = layout.Nodes[id];
			var box = boxes[id];
			var left = at.X + pad - box.Width / 2;
			var top = at.Y + pad - box.Height / 2;
			var widths = columns[id];

			body += '<g class="entity" data-id="' + self.Escape(id) + '"><rect class="n" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="4"/><path class="x" d="M' + self.Round(left + 0.75) + ' ' + self.Round(top + headHeight) + 'V' + self.Round(top + 4) + 'a3.25 3.25 0 0 1 3.25 -3.25H' + self.Round(left + box.Width - 4) + 'a3.25 3.25 0 0 1 3.25 3.25V' + self.Round(top + headHeight) + 'z"/>' + self.Text(entry.Label, left + box.Width / 2, top + headHeight / 2, size, {Class: 'w', Weight: 700});

			entry.Attributes.forEach(function (attribute, index) {
				var y = top + headHeight + 2 + (index + 0.5) * row;
				var x = left + 12;

				if (index % 2)
					body += '<rect class="s" x="' + self.Round(left + 0.75) + '" y="' + self.Round(y - row / 2) + '" width="' + self.Round(box.Width - 1.5) + '" height="' + self.Round(row) + '" style="stroke:none"/>';

				body += self.Text(attribute.Type, x, y, small, {Anchor: 'start', Class: 'm'});
				x += widths[0] + 16;
				body += self.Text(attribute.Name, x, y, small, {Anchor: 'start', Weight: 600});
				x += widths[1] + 16;

				if (widths[2]) {
					body += self.Text(attribute.Keys.join(', '), x, y, small * 0.85, {Anchor: 'start', Class: 'm', Weight: 600});
					x += widths[2] + 16;
				}

				if (attribute.Comment)
					body += self.Text(attribute.Comment, x, y, small, {Anchor: 'start', Class: 'm'});
			});

			body += '</g>';
		});

		return {Width: layout.Width + pad * 2, Height: layout.Height + pad * 2, Defs: this.Markers(options.Id, Object.keys(markers)), Body: edges + body + labels};
	},

	/* A date of a Gantt chart by its format (YYYY, MM, DD, HH, mm, ss): its time in milliseconds, UTC; NaN when it is not one. */
	GanttDate: function (text, format) {
		var parts = {YYYY: 1970, MM: 1, DD: 1, HH: 0, mm: 0, ss: 0};
		var names = [];
		var pattern = '^' + String(format).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&').replace(/YYYY|MM|DD|HH|mm|ss/g, function (name) {
			names.push(name);

			return name === 'YYYY' ? '(\\d{4})' : '(\\d{1,2})';
		}) + '$';
		var match = new RegExp(pattern).exec(String(text).trim());
		if (!match)
			return NaN;

		names.forEach(function (name, index) {
			parts[name] = Number(match[index + 1]);
		});

		return Date.UTC(parts.YYYY, parts.MM - 1, parts.DD, parts.HH, parts.mm, parts.ss);
	},

	/* A duration of a Gantt chart (3d, 2w, 12h, 30m, 1.5d): milliseconds; NaN when it is not one. */
	GanttDuration: function (text) {
		var match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/.exec(String(text).trim());
		var units = {ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000};

		return match ? Number(match[1]) * units[match[2]] : NaN;
	},

	ParseGantt: function (lines) {
		var self = this;
		var model = {Type: 'gantt', Title: '', Format: 'YYYY-MM-DD', Sections: [], Tasks: [], Excludes: ''};
		var section = null;
		var byId = {};
		var last = null;
		var pending = [];

		lines.slice(1).forEach(function (line) {
			var text = line.Text.trim();
			var match;

			if ((match = /^title\s+(.*)$/.exec(text))) {
				model.Title = match[1];

				return;
			}

			if ((match = /^dateFormat\s+(.+?)\s*$/.exec(text))) {
				model.Format = match[1];

				return;
			}

			if (/^(axisFormat|tickInterval|todayMarker|excludes|weekday|includes)\b/.test(text)) return;

			if ((match = /^section\s+(.*)$/.exec(text))) {
				section = {Name: match[1], Index: model.Sections.length};

				model.Sections.push(section);

				return;
			}

			if ((match = /^([^:]+?)\s*:\s*(.*)$/.exec(text))) {
				var task = {Name: match[1], ID: '', Section: section ? section.Index : -1, Crit: false, Done: false, Active: false, Milestone: false, Start: NaN, End: NaN, After: [], Duration: NaN, Line: line.Number};
				var fields = match[2].split(',').map(function (field) {
					return field.trim();
				}).filter(function (field) {
					return field;
				});

				while (fields.length && /^(crit|done|active|milestone)$/.test(fields[0])) {
					task[{crit: 'Crit', done: 'Done', active: 'Active', milestone: 'Milestone'}[fields.shift()]] = true;
				}

				/* id, start, end; start, end; or end alone (after the task before) */
				if (fields.length === 3)
					task.ID = fields.shift();

				if (!fields.length)
					throw self.Fail(line, 'a task has a start and an end or a duration: Task : 2024-01-01, 3d');

				if (fields.length === 1) {
					task.Previous = true;
				}
				else {
					var start = fields.shift();

					if ((match = /^after\s+(.+)$/.exec(start))) {
						task.After = match[1].trim().split(/\s+/);
					}
					else {
						task.Start = self.GanttDate(start, model.Format);

						if (isNaN(task.Start))
							throw self.Fail(line, 'the start ' + start + ' is not a date of the format ' + model.Format + ', nor after an id');
					}
				}

				task.Duration = self.GanttDuration(fields[0]);

				if (isNaN(task.Duration)) {
					task.End = self.GanttDate(fields[0], model.Format);

					if (isNaN(task.End))
						throw self.Fail(line, 'the end ' + fields[0] + ' is not a date of the format ' + model.Format + ', nor a duration (3d, 2w, 12h)');
				}

				if (task.ID)
					byId[task.ID] = task;

				task.Before = last;
				last = task;

				model.Tasks.push(task);
				pending.push(task);

				return;
			}

			throw self.Fail(line, 'a title, a dateFormat, a section or a task (Name : start, end) is expected: ' + text);
		});

		/* The starts of the tasks after others, in the order they are written; one after an unknown id fails. */
		function resolve (task, trail) {
			if (!isNaN(task.From)) return task.From;

			if (trail.indexOf(task) >= 0)
				throw self.Fail({Number: task.Line}, 'the task ' + task.Name + ' comes after itself');

			if (task.After.length) {
				task.From = Math.max.apply(null, task.After.map(function (id) {
					if (!byId[id])
						throw self.Fail({Number: task.Line}, 'no task has the id ' + id);

					return finish(byId[id], trail.concat([task]));
				}));
			}
			else if (task.Previous) {
				if (!task.Before)
					throw self.Fail({Number: task.Line}, 'the first task needs a start');

				task.From = finish(task.Before, trail.concat([task]));
			}
			else {
				task.From = task.Start;
			}

			return task.From;
		}

		function finish (task, trail) {
			var start = resolve(task, trail);

			return isNaN(task.Duration) ? task.End : start + task.Duration;
		}

		model.Tasks.forEach(function (task) {
			task.From = NaN;
		});

		model.Tasks.forEach(function (task) {
			task.Start = resolve(task, []);
			task.End = finish(task, []);

			if (task.End < task.Start)
				throw self.Fail({Number: task.Line}, 'the task ' + task.Name + ' ends before it starts');
		});

		model.Tasks.forEach(function (task) {
			delete task.From;
			delete task.Before;
			delete task.Previous;
		});

		return model;
	},

	DrawGantt: function (model, options) {
		var self = this;
		var size = options.Size;
		var small = size * 0.85;
		var rowHeight = size * 2;
		var low = Infinity;
		var high = -Infinity;
		var names = 0;
		var title = model.Title ? size * 2.4 : 0;
		var axis = size * 2;
		var plot = 640;
		var gutter;
		var top;
		var day = 86400000;
		var steps = [60000, 300000, 900000, 1800000, 3600000, 2 * 3600000, 3 * 3600000, 6 * 3600000, 12 * 3600000, day, 2 * day, 7 * day, 14 * day, 30 * day, 91 * day, 182 * day, 365 * day];
		var step;
		var body = '';
		var bands = '';
		var grid = '';
		var y;
		var t;

		model.Tasks.forEach(function (task) {
			low = Math.min(low, task.Start);
			high = Math.max(high, task.End);
		});

		model.Sections.forEach(function (section) {
			names = Math.max(names, self.Measure(section.Name, small, 600));
		});

		if (low === Infinity) {
			low = 0;
			high = day;
		}

		if (high === low)
			high = low + day;

		gutter = names ? names + 28 : 8;
		top = title + axis;

		function x (time) {
			return gutter + (time - low) / (high - low) * plot;
		}

		/* A tick about each 90 pixels. */
		step = steps.filter(function (each) {
			return each / (high - low) * plot >= 70;
		})[0] || steps[steps.length - 1];

		function label (time) {
			var date = new Date(time);
			var pad = function (n) {
				return (n < 10 ? '0' : '') + n;
			};

			if (step < day)
				return pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes());

			if (step >= 365 * day)
				return String(date.getUTCFullYear());

			if (step >= 30 * day)
				return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1);

			return pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
		}

		/* The rows: each section a band of its tasks, in the order they are written. */
		var rows = [];
		var groups = [{Index: -1, Name: ''}].concat(model.Sections);

		groups.forEach(function (section) {
			var tasks = model.Tasks.filter(function (task) {
				return task.Section === section.Index;
			});
			if (!tasks.length) return;

			rows.push({Section: section, Tasks: tasks});
		});

		y = top;

		rows.forEach(function (group, index) {
			var height = group.Tasks.length * rowHeight;

			bands += '<rect class="' + (index % 2 ? 'l' : 's') + '" x="0" y="' + self.Round(y) + '" width="' + self.Round(gutter + plot + 16) + '" height="' + self.Round(height) + '" style="stroke:none"/>';

			if (group.Section.Name)
				bands += self.Text(group.Section.Name, 10, y + height / 2, small, {Anchor: 'start', Weight: 600});

			group.Tasks.forEach(function (task, row) {
				var middle = y + (row + 0.5) * rowHeight;
				var left = x(task.Start);
				var right = x(task.End);
				var color = self.Palette[Math.max(0, group.Section.Index) % self.Palette.length];
				var style = task.Crit ? 'fill:var(--elemenx-danger,#c0392b)' : task.Done ? 'fill:var(--elemenx-text-muted,#6b7280);opacity:0.55' : 'fill:' + color + (task.Active ? ';opacity:0.75' : '');
				var width = Math.max(right - left, 2);
				var inside = self.Measure(task.Name, small) + 12 < width;

				if (task.Milestone) {
					body += '<g class="task milestone"><path style="' + style + '" d="M' + self.Round(left) + ' ' + self.Round(middle - 8) + 'l8 8l-8 8l-8 -8z"/>' + self.Text(task.Name, left + 14, middle, small, {Anchor: 'start'}) + '</g>';

					return;
				}

				body += '<g class="task' + (task.Crit ? ' crit' : '') + (task.Done ? ' done' : '') + (task.Active ? ' active' : '') + '"><rect style="' + style + '" x="' + self.Round(left) + '" y="' + self.Round(middle - rowHeight * 0.32) + '" width="' + self.Round(width) + '" height="' + self.Round(rowHeight * 0.64) + '" rx="3"/>' + (task.Active ? '<rect x="' + self.Round(left) + '" y="' + self.Round(middle - rowHeight * 0.32) + '" width="' + self.Round(width) + '" height="' + self.Round(rowHeight * 0.64) + '" rx="3" fill="none" style="stroke:' + color + ';stroke-width:1.5"/>' : '') + (inside ? self.Text(task.Name, left + width / 2, middle, small, {Class: 'w'}) : self.Text(task.Name, right + 6, middle, small, {Anchor: 'start'})) + '</g>';
			});

			y += height;
		});

		for (t = Math.ceil(low / step) * step; t <= high; t += step) {
			grid += '<path class="g" d="M' + self.Round(x(t)) + ' ' + self.Round(top - 4) + 'V' + self.Round(y) + '"/>' + self.Text(label(t), x(t), title + axis / 2, small, {Class: 'm'});
		}

		return {
			Width: gutter + plot + 16 + Math.max(0, Math.max.apply(null, model.Tasks.map(function (task) {
				return x(task.End) + self.Measure(task.Name, small) + 12 - (gutter + plot + 16);
			}).concat([0]))),
			Height: y + 12,
			Body: (model.Title ? self.Text(model.Title, (gutter + plot) / 2, title / 2 + 2, size * 1.15, {Weight: 600}) : '') + bands + grid + body
		};
	},

	/* The ends of a relation of a class diagram: the marker of each token. */
	ClassEnds: {'<|': 'triangle', '|>': 'triangle', '*': 'diamond', 'o': 'hollow', '<': 'open', '>': 'open'},

	ParseClass: function (lines) {
		var self = this;
		var model = {Type: 'class', Direction: 'TB', Classes: {}, Order: [], Relations: [], Notes: []};
		var open = null;
		var name = '[\\w\\u00c0-\\ufffd]+(?:~[^~]+~)?';

		function type (id, line) {
			var key = id.replace(/~[^~]+~$/, '');

			if (!model.Classes[key]) {
				model.Classes[key] = {ID: key, Label: id.replace(/~([^~]+)~$/, '<$1>'), Stereotype: '', Attributes: [], Methods: [], Line: line.Number};

				model.Order.push(key);
			}
			else if (id !== key) {
				model.Classes[key].Label = id.replace(/~([^~]+)~$/, '<$1>');
			}

			return model.Classes[key];
		}

		/* A member: a method when it has (); $ at its end is static, * abstract. */
		function member (entry, text) {
			var value = text.trim();
			var kind = /\)/.test(value) ? 'Methods' : 'Attributes';
			var item = {Text: value.replace(/[$*]$/, '').replace(/~([^~]+)~/g, '<$1>'), Static: /\$$/.test(value), Abstract: /\*$/.test(value)};

			if (!value) return;

			if (/^<<.+>>$/.test(value)) {
				entry.Stereotype = value;

				return;
			}

			entry[kind].push(item);
		}

		lines.slice(1).forEach(function (line) {
			var text = line.Text.trim();
			var match;

			if (open) {
				if (text === '}') {
					open = null;

					return;
				}

				member(open, text);

				return;
			}

			if ((match = /^direction\s+(TB|TD|BT|LR|RL)$/i.exec(text))) {
				model.Direction = match[1].toUpperCase().replace('TD', 'TB');

				return;
			}

			if ((match = new RegExp('^class\\s+(' + name + ')(?:\\s*\\[\\s*"([^"]*)"\\s*\\])?\\s*(\\{)?\\s*(\\})?$').exec(text))) {
				var entry = type(match[1], line);

				if (match[2])
					entry.Label = match[2];

				if (match[3] && !match[4])
					open = entry;

				return;
			}

			if ((match = new RegExp('^<<(.+)>>\\s*(' + name + ')$').exec(text))) {
				type(match[2], line).Stereotype = '<<' + match[1] + '>>';

				return;
			}

			if ((match = /^note\s+(?:for\s+([\w\u00c0-\ufffd]+)\s+)?"([^"]*)"$/.exec(text))) {
				model.Notes.push({For: match[1] || '', Text: match[2]});

				return;
			}

			if ((match = new RegExp('^(' + name + ')\\s+(?:"([^"]*)"\\s+)?(<\\||\\*|o|<)?(--|\\.\\.)(\\|>|\\*|o|>)?\\s+(?:"([^"]*)"\\s+)?(' + name + ')\\s*(?::\\s*(.*))?$').exec(text))) {
				type(match[1], line);
				type(match[7], line);

				model.Relations.push({From: match[1].replace(/~[^~]+~$/, ''), To: match[7].replace(/~[^~]+~$/, ''), Tail: match[3] ? self.ClassEnds[match[3]] : '', Head: match[5] ? self.ClassEnds[match[5]] : '', Dashed: match[4] === '..', FromCount: match[2] || '', ToCount: match[6] || '', Text: match[8] || ''});

				return;
			}

			if ((match = new RegExp('^(' + name + ')\\s*:\\s*(.*)$').exec(text))) {
				member(type(match[1], line), match[2]);

				return;
			}

			if ((match = new RegExp('^(' + name + ')$').exec(text))) {
				type(match[1], line);

				return;
			}

			throw self.Fail(line, 'a class, a member or a relation is expected (A <|-- B): ' + text);
		});

		if (open)
			throw this.Fail(lines[lines.length - 1], 'the class ' + open.ID + ' has no }');

		model.Notes.forEach(function (note, index) {
			var id = '\u0000note' + index;

			model.Classes[id] = {ID: id, Label: note.Text, Note: true, Stereotype: '', Attributes: [], Methods: []};

			model.Order.push(id);

			if (note.For && model.Classes[note.For])
				model.Relations.push({From: id, To: note.For, Tail: '', Head: '', Dashed: true, Note: true, FromCount: '', ToCount: '', Text: ''});
		});

		return model;
	},

	DrawClass: function (model, options) {
		var self = this;
		var size = options.Size;
		var small = size * 0.9;
		var line = small * 1.45;
		var horizontal = model.Direction === 'LR' || model.Direction === 'RL';
		var boxes = {};
		var heads = {};
		var layout;
		var body = '';
		var edges = '';
		var labels = '';
		var markers = {};
		var pad = 28;
		var apart = this.Apart(model.Relations);

		model.Order.forEach(function (id) {
			var entry = model.Classes[id];
			var head = (entry.Stereotype ? small * 1.3 : 0) + size * 1.4 + 14;
			var members = entry.Attributes.concat(entry.Methods).map(function (item) {
				return self.Measure(item.Text, small);
			});
			var label;

			if (entry.Note) {
				label = self.LabelSize(entry.Label, small);
				boxes[id] = {Width: label.Width + 24, Height: label.Height + 18, Shape: 'rect'};

				return;
			}

			heads[id] = head;
			boxes[id] = {
				Width: Math.max(self.Measure(entry.Label, size, 700), entry.Stereotype ? self.Measure(entry.Stereotype, small * 0.9) : 0, Math.max.apply(null, members.concat([0]))) + 28,
				Height: head + Math.max(entry.Attributes.length, 0.4) * line + 10 + Math.max(entry.Methods.length, 0.4) * line + 10,
				Shape: 'rect'
			};
		});

		layout = this.Layered(boxes, model.Relations, {Direction: model.Direction, RankGap: 64, NodeGap: 48});

		/* A count of an end of a relation: by its end, along the line and aside of it. */
		function count (text, points, start) {
			var a = start ? points[0] : points[points.length - 1];
			var b = start ? points[1] : points[points.length - 2];
			var dx = b.X - a.X;
			var dy = b.Y - a.Y;
			var length = Math.sqrt(dx * dx + dy * dy) || 1;

			return self.Text(text, a.X + dx / length * 22 - dy / length * 12, a.Y + dy / length * 22 + dx / length * 12, small * 0.9, {Class: 'm'});
		}

		model.Relations.forEach(function (relation, index) {
			var points = (layout.Edges[index] || []).map(function (p) {
				return {X: p.X + pad, Y: p.Y + pad};
			});
			var from = Object.assign({}, boxes[relation.From], {X: layout.Nodes[relation.From].X + pad, Y: layout.Nodes[relation.From].Y + pad});
			var to = Object.assign({}, boxes[relation.To], {X: layout.Nodes[relation.To].X + pad, Y: layout.Nodes[relation.To].Y + pad});
			var path;
			var moved;

			if (relation.From === relation.To) {
				path = self.Loop(from, horizontal);
			}
			else {
				moved = self.Aside(points, from, to, apart[index], horizontal);
				path = self.EdgePath(moved.Points, moved.From, moved.To, horizontal);
			}

			if (relation.Head)
				markers[relation.Head] = true;

			if (relation.Tail)
				markers[relation.Tail] = true;

			edges += '<path class="e' + (relation.Dashed ? ' dotted' : '') + '" d="' + path.Path + '"' + (relation.Tail ? ' marker-start="url(#' + options.Id + '-' + relation.Tail + ')"' : '') + (relation.Head ? ' marker-end="url(#' + options.Id + '-' + relation.Head + ')"' : '') + '/>';

			if (relation.Text)
				labels += self.EdgeLabel(relation.Text, path.Middle, size, apart[index], horizontal);

			if (path.Points && relation.FromCount)
				labels += count(relation.FromCount, path.Points, true);

			if (path.Points && relation.ToCount)
				labels += count(relation.ToCount, path.Points, false);
		});

		model.Order.forEach(function (id) {
			var entry = model.Classes[id];
			var at = layout.Nodes[id];
			var box = boxes[id];
			var left = at.X + pad - box.Width / 2;
			var top = at.Y + pad - box.Height / 2;
			var y;

			if (entry.Note) {
				body += '<g class="note"><rect class="n" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="2" style="fill:rgba(255,213,79,0.22);stroke:rgba(217,154,30,0.9)"/>' + self.Text(entry.Label, at.X + pad, at.Y + pad, small) + '</g>';

				return;
			}

			body += '<g class="class" data-id="' + self.Escape(id) + '"><rect class="n" x="' + self.Round(left) + '" y="' + self.Round(top) + '" width="' + self.Round(box.Width) + '" height="' + self.Round(box.Height) + '" rx="4"/>';

			y = top + 8;

			if (entry.Stereotype) {
				body += self.Text(entry.Stereotype, at.X + pad, y + small * 0.6, small * 0.9, {Class: 'm'});
				y += small * 1.3;
			}

			body += self.Text(entry.Label, at.X + pad, y + size * 0.75, size, {Weight: 700, Style: entry.Stereotype === '<<abstract>>' ? 'font-style:italic' : ''});
			y = top + heads[id];
			body += '<path class="g" d="M' + self.Round(left) + ' ' + self.Round(y) + 'h' + self.Round(box.Width) + '"/>';
			y += 5;

			entry.Attributes.forEach(function (item, index) {
				body += self.Text(item.Text, left + 12, y + (index + 0.5) * line, small, {Anchor: 'start', Style: item.Static ? 'text-decoration:underline' : ''});
			});

			y += Math.max(entry.Attributes.length, 0.4) * line + 5;
			body += '<path class="g" d="M' + self.Round(left) + ' ' + self.Round(y) + 'h' + self.Round(box.Width) + '"/>';
			y += 5;

			entry.Methods.forEach(function (item, index) {
				body += self.Text(item.Text, left + 12, y + (index + 0.5) * line, small, {Anchor: 'start', Style: (item.Static ? 'text-decoration:underline;' : '') + (item.Abstract ? 'font-style:italic' : '')});
			});

			body += '</g>';
		});

		return {Width: layout.Width + pad * 2, Height: layout.Height + pad * 2, Defs: this.Markers(options.Id, Object.keys(markers)), Body: edges + body + labels};
	},

	/* The shapes of the nodes of a mind map, by their brackets: [open, close, shape], the longest first. */
	MindShapes: [['((', '))', 'circle'], ['))', '((', 'bang'], ['{{', '}}', 'hexagon'], ['[', ']', 'rect'], ['(', ')', 'round'], [')', '(', 'cloud']],

	ParseMindmap: function (lines) {
		var self = this;
		var stack = [];
		var root = null;

		lines.slice(1).forEach(function (line) {
			var indent = /^\s*/.exec(line.Text.replace(/\t/g, '    '))[0].length;
			var text = line.Text.trim();
			var node = {Text: text, Shape: 'default', Children: [], Line: line.Number};
			var found = null;

			/* ::icon(...) and :::class lines belong to the node before; they draw nothing here. */
			if (/^::icon\(/.test(text) || /^:::/.test(text)) return;

			text = text.replace(/\s*:::.*$/, '');

			self.MindShapes.forEach(function (shape) {
				var start;

				if (found) return;

				start = text.indexOf(shape[0]);

				if (start >= 0 && /^[\w\u00c0-\ufffd-]*$/.test(text.substring(0, start)) && text.slice(-shape[1].length) === shape[1] && text.length >= start + shape[0].length + shape[1].length) {
					found = {Text: text.substring(start + shape[0].length, text.length - shape[1].length), Shape: shape[2]};
				}
			});

			if (found) {
				node.Text = found.Text.replace(/^"(.*)"$/, '$1').replace(/^`(.*)`$/, '$1');
				node.Shape = found.Shape;
			}

			while (stack.length && stack[stack.length - 1].Indent >= indent) stack.pop();

			if (!stack.length) {
				if (root)
					throw self.Fail(line, 'a mind map has one root: indent this line under it');

				root = node;
			}
			else {
				stack[stack.length - 1].Node.Children.push(node);
			}

			stack.push({Indent: indent, Node: node});
		});

		if (!root)
			throw this.Fail(lines[0], 'a mind map needs its root under mindmap');

		return {Type: 'mindmap', Root: root};
	},

	DrawMindmap: function (model, options) {
		var self = this;
		var size = options.Size;
		var gap = 14;
		var columnGap = 46;
		var body = '';
		var links = '';
		var low = Infinity;
		var high = -Infinity;
		var left = Infinity;
		var right = -Infinity;

		function box (node, depth) {
			var label = self.LabelSize(node.Text, depth ? size * (depth === 1 ? 1 : 0.92) : size * 1.15, depth < 2 ? 600 : 400);
			var w = label.Width + (node.Shape === 'default' && depth > 1 ? 12 : 28);
			var h = label.Height + (node.Shape === 'default' && depth > 1 ? 10 : 18);

			if (node.Shape === 'circle')
				w = h = Math.max(w, h) + 6;

			if (node.Shape === 'bang' || node.Shape === 'cloud') {
				w += 18;
				h += 12;
			}

			if (node.Shape === 'hexagon')
				w += h * 0.6;

			node.Width = w;
			node.Height = h;
			node.Depth = depth;

			node.Children.forEach(function (child) {
				box(child, depth + 1);
			});

			node.Span = Math.max(h, node.Children.reduce(function (sum, child) {
				return sum + child.Span;
			}, 0) + Math.max(0, node.Children.length - 1) * gap);
		}

		box(model.Root, 0);

		/* The branches of the root on its two sides, as even in their heights as they can be. */
		var sides = [[], []];
		var heights = [0, 0];

		model.Root.Children.forEach(function (child, index) {
			child.Color = self.Palette[(index + 1) % self.Palette.length];
		});

		model.Root.Children.slice().sort(function (a, b) {
			return b.Span - a.Span;
		}).forEach(function (child) {
			var side = heights[0] <= heights[1] ? 0 : 1;

			sides[side].push(child);

			heights[side] += child.Span + gap;
		});

		[0, 1].forEach(function (side) {
			sides[side].sort(function (a, b) {
				return model.Root.Children.indexOf(a) - model.Root.Children.indexOf(b);
			});
		});

		/* A node at x (its near edge), its subtree centered on y; its children a column further out. */
		function place (node, x, y, direction) {
			var top = y - (node.Span) / 2;
			var inner = node.Children.reduce(function (sum, child) {
				return sum + child.Span;
			}, 0) + Math.max(0, node.Children.length - 1) * gap;
			var at = y - inner / 2;

			node.X = x + direction * node.Width / 2;
			node.Y = y;

			low = Math.min(low, top, y - node.Height / 2);
			high = Math.max(high, top + node.Span, y + node.Height / 2);
			left = Math.min(left, node.X - node.Width / 2);
			right = Math.max(right, node.X + node.Width / 2);

			node.Children.forEach(function (child) {
				child.Color = child.Color || node.Color;

				place(child, x + direction * (node.Width + columnGap), at + child.Span / 2, direction);

				at += child.Span + gap;
			});
		}

		model.Root.X = 0;
		model.Root.Y = 0;
		low = -model.Root.Height / 2;
		high = model.Root.Height / 2;
		left = -model.Root.Width / 2;
		right = model.Root.Width / 2;

		[1, -1].forEach(function (direction, side) {
			var list = sides[side];
			var total = list.reduce(function (sum, child) {
				return sum + child.Span;
			}, 0) + Math.max(0, list.length - 1) * gap;
			var at = -total / 2;

			list.forEach(function (child) {
				place(child, direction * (model.Root.Width / 2 + columnGap * 1.4), at + child.Span / 2, direction);

				at += child.Span + gap;
			});
		});

		var pad = 24;
		var dx = pad - left;
		var dy = pad - low;

		function draw (node, parent) {
			var x = node.X + dx;
			var y = node.Y + dy;
			var color = node.Color || 'var(--elemenx-accent,#3f6c9e)';
			var style = node.Depth === 0 ? 'fill:var(--elemenx-accent,#3f6c9e);stroke:none' : node.Depth === 1 ? 'fill:' + color + ';stroke:none' : 'fill:var(--elemenx-surface,#ffffff);stroke:' + color;
			var text = node.Depth < 2 ? 'w' : 't';
			var r = self.Round;

			if (parent) {
				var side = node.X > parent.X ? 1 : -1;
				var from = {X: parent.X + dx + side * parent.Width / 2 * (parent.Depth ? 1 : 0.8), Y: parent.Y + dy};
				var to = {X: x - side * node.Width / 2, Y: node.Depth > 1 && node.Shape === 'default' ? y + node.Height / 2 : y};

				if (parent.Depth > 1 && parent.Shape === 'default')
					from.Y = parent.Y + dy + parent.Height / 2;

				links += '<path d="M' + r(from.X) + ' ' + r(from.Y) + 'C' + r((from.X + to.X) / 2) + ' ' + r(from.Y) + ' ' + r((from.X + to.X) / 2) + ' ' + r(to.Y) + ' ' + r(to.X) + ' ' + r(to.Y) + '" fill="none" style="stroke:' + color + ';stroke-width:' + Math.max(1.5, 5 - node.Depth * 1.2) + ';stroke-linecap:round"/>';
			}

			body += '<g class="node" data-depth="' + node.Depth + '">';

			if (node.Shape === 'default' && node.Depth > 1) {
				body += '<path d="M' + r(x - node.Width / 2) + ' ' + r(y + node.Height / 2) + 'h' + r(node.Width) + '" style="stroke:' + color + ';stroke-width:2;stroke-linecap:round"/>';
				text = 't';
			}
			else if (node.Shape === 'circle') {
				body += '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(node.Width / 2) + '" style="' + style + ';stroke-width:1.5"/>';
			}
			else if (node.Shape === 'hexagon') {
				body += self.Shape('hexagon', x, y, node.Width, node.Height, style + ';stroke-width:1.5');
			}
			else if (node.Shape === 'cloud' || node.Shape === 'bang') {
				body += '<path d="' + self.Bumps(x, y, node.Width, node.Height, node.Shape === 'bang') + '" style="' + style + ';stroke-width:1.5"/>';
			}
			else {
				body += '<rect x="' + r(x - node.Width / 2) + '" y="' + r(y - node.Height / 2) + '" width="' + r(node.Width) + '" height="' + r(node.Height) + '" rx="' + (node.Shape === 'rect' ? 3 : r(Math.min(node.Height / 2, 14))) + '" style="' + style + ';stroke-width:1.5"/>';
			}

			body += self.Text(node.Text, x, y, node.Depth ? size * (node.Depth === 1 ? 1 : 0.92) : size * 1.15, {Class: text, Weight: node.Depth < 2 ? 600 : 0}) + '</g>';

			node.Children.forEach(function (child) {
				draw(child, node);
			});
		}

		draw(model.Root, null);

		return {Width: right - left + pad * 2, Height: high - low + pad * 2, Body: links + body};
	},

	/* The outline of a cloud (bumps out) or a bang (spikes) around a box. */
	Bumps: function (x, y, w, h, spikes) {
		var r = this.Round;
		var count = Math.max(6, Math.round((w + h) / 22));
		var path = '';
		var k;

		for (k = 0; k <= count; k++) {
			var angle = k / count * Math.PI * 2;
			var px = x + Math.cos(angle) * w / 2;
			var py = y + Math.sin(angle) * h / 2;
			var middle = (k - 0.5) / count * Math.PI * 2;
			var out = spikes ? 1.28 : 1.22;

			if (!k) path += 'M' + r(px) + ' ' + r(py);
			else if (spikes) path += 'L' + r(x + Math.cos(middle) * w / 2 * out) + ' ' + r(y + Math.sin(middle) * h / 2 * out) + 'L' + r(px) + ' ' + r(py);
			else path += 'Q' + r(x + Math.cos(middle) * w / 2 * out) + ' ' + r(y + Math.sin(middle) * h / 2 * out) + ' ' + r(px) + ' ' + r(py);
		}

		return path + 'z';
	},

	DrawFlowchart: function (model, options) {
		var self = this;
		var size = options.Size;
		var horizontal = model.Direction === 'LR' || model.Direction === 'RL';
		var boxes = {};
		var layout;
		var body = '';
		var groupsBody = '';
		var labels = '';
		var pad = 24;
		var markers = {};
		var width;
		var height;
		var offsetX;
		var offsetY;

		model.Order.forEach(function (id) {
			var entry = model.Nodes[id];
			var label = self.LabelSize(entry.Text, size);
			var w = label.Width + 28;
			var h = label.Height + 20;

			if (entry.Shape === 'circle' || entry.Shape === 'double') {
				w = Math.max(w, h) + 8;
				h = w;
			}
			else if (entry.Shape === 'diamond') {
				w = label.Width * 1.6 + 30;
				h = Math.max(label.Height * 1.8 + 24, w * 0.55);
			}
			else if (entry.Shape === 'hexagon' || /^(lean|trapezoid|flag)/.test(entry.Shape)) {
				w += h * 0.7;
			}

			boxes[id] = {Width: Math.max(w, 48), Height: Math.max(h, 38), Shape: entry.Shape};
		});

		/* A subgraph stands in a link by its first member (of an inner one too); its box is where the link ends. */
		function proxy (id) {
			var group = model.Groups.filter(function (each) {
				return each.ID === id;
			})[0];
			var inner;

			if (!group) return id;

			if (group.Members.length) return group.Members[0];

			inner = model.Groups.filter(function (each) {
				return each.Parent === id;
			})[0];

			return inner ? proxy(inner.ID) : null;
		}

		/* The outermost subgraph of each node: its members stay together. */
		function outermost (id) {
			var group = model.Nodes[id] && model.Nodes[id].Group;
			var parent;

			while (group) {
				parent = model.Groups.filter(function (each) {
					return each.ID === group;
				})[0];

				if (!parent || !parent.Parent) return group;

				group = parent.Parent;
			}

			return null;
		}

		var tops = {};

		model.Order.forEach(function (id) {
			if (outermost(id))
				tops[id] = outermost(id);
		});

		layout = this.Layered(boxes, model.Edges.map(function (edge) {
			return {From: edge.FromGroup ? proxy(edge.From) : edge.From, To: edge.ToGroup ? proxy(edge.To) : edge.To, Length: edge.Length};
		}), {Direction: model.Direction, RankGap: 60, NodeGap: 40, Groups: tops});

		/* The boxes of the subgraphs around their members, the inner ones inside; an empty one is left out. */
		var groupBoxes = {};

		model.Groups.slice().reverse().forEach(function (group) {
			var members = group.Members.concat(model.Groups.filter(function (other) {
				return other.Parent === group.ID && groupBoxes[other.ID];
			}).map(function (other) {
				return '\u0001' + other.ID;
			}));
			var box = {Left: Infinity, Top: Infinity, Right: -Infinity, Bottom: -Infinity};

			members.forEach(function (id) {
				var inner = id.charAt(0) === '\u0001' ? groupBoxes[id.substring(1)] : null;
				var at = inner ? null : layout.Nodes[id];

				if (inner) {
					box.Left = Math.min(box.Left, inner.Left);
					box.Top = Math.min(box.Top, inner.Top);
					box.Right = Math.max(box.Right, inner.Right);
					box.Bottom = Math.max(box.Bottom, inner.Bottom);
				}
				else if (at) {
					box.Left = Math.min(box.Left, at.X - boxes[id].Width / 2);
					box.Top = Math.min(box.Top, at.Y - boxes[id].Height / 2);
					box.Right = Math.max(box.Right, at.X + boxes[id].Width / 2);
					box.Bottom = Math.max(box.Bottom, at.Y + boxes[id].Height / 2);
				}
			});

			if (box.Left === Infinity) return;

			box.Left -= 14;
			box.Right += 14;
			box.Top -= size * 1.6 + 10;
			box.Bottom += 14;

			groupBoxes[group.ID] = box;
		});

		var extent = {Left: 0, Top: 0, Right: layout.Width, Bottom: layout.Height};

		Object.keys(groupBoxes).forEach(function (id) {
			extent.Left = Math.min(extent.Left, groupBoxes[id].Left);
			extent.Top = Math.min(extent.Top, groupBoxes[id].Top);
			extent.Right = Math.max(extent.Right, groupBoxes[id].Right);
			extent.Bottom = Math.max(extent.Bottom, groupBoxes[id].Bottom);
		});

		offsetX = pad - extent.Left;
		offsetY = pad - extent.Top;
		width = extent.Right - extent.Left + pad * 2;
		height = extent.Bottom - extent.Top + pad * 2;

		model.Groups.forEach(function (group) {
			var box = groupBoxes[group.ID];
			if (!box) return;

			groupsBody += '<rect class="c" x="' + self.Round(box.Left + offsetX) + '" y="' + self.Round(box.Top + offsetY) + '" width="' + self.Round(box.Right - box.Left) + '" height="' + self.Round(box.Bottom - box.Top) + '" rx="6"/>' + self.Text(group.Title, box.Left + offsetX + 10, box.Top + offsetY + size * 0.9 + 4, size * 0.9, {Anchor: 'start', Class: 'm', Weight: 600});
		});

		var apart = this.Apart(model.Edges);

		model.Edges.forEach(function (edge, index) {
			var moved;
			var points = layout.Edges[index].map(function (p) {
				return {X: p.X + offsetX, Y: p.Y + offsetY};
			});
			var end = function (id, group) {
				var box = group ? groupBoxes[id] : null;
				if (box)
					return {X: (box.Left + box.Right) / 2 + offsetX, Y: (box.Top + box.Bottom) / 2 + offsetY, Width: box.Right - box.Left, Height: box.Bottom - box.Top, Shape: 'rect'};

				return Object.assign({}, boxes[id], layout.Nodes[id] ? {X: layout.Nodes[id].X + offsetX, Y: layout.Nodes[id].Y + offsetY} : {});
			};
			var from = end(edge.From, edge.FromGroup);
			var to = end(edge.To, edge.ToGroup);
			var path;
			var head = edge.Head !== 'none' ? edge.Head : null;
			var tail = edge.Tail !== 'none' ? edge.Tail : null;

			if (edge.Line === 'invisible' || points.length < 2) return;

			if (edge.From === edge.To) {
				path = self.Loop(from, horizontal);
			}
			else {
				moved = self.Aside(points, from, to, apart[index], horizontal);
				path = self.EdgePath(moved.Points, moved.From, moved.To, horizontal);
			}

			if (head)
				markers[head === 'arrow' ? 'arrow' : head] = true;

			if (tail)
				markers[tail === 'arrow' ? 'arrow' : tail] = true;

			body += '<path class="e' + (edge.Line === 'dotted' ? ' dotted' : edge.Line === 'thick' ? ' thick' : '') + '" d="' + path.Path + '"' + (head ? ' marker-end="url(#' + options.Id + '-' + head + ')"' : '') + (tail ? ' marker-start="url(#' + options.Id + '-' + tail + ')"' : '') + '/>';

			if (edge.Text) {
				labels += self.EdgeLabel(edge.Text, path.Middle, size, apart[index], horizontal);
			}
		});

		model.Order.forEach(function (id) {
			var entry = model.Nodes[id];
			var at = layout.Nodes[id];
			var style = entry.Classes.map(function (name) {
				return model.Classes[name] || '';
			}).concat([entry.Style]).filter(Boolean).join(';');
			var color = /(?:^|;)color:([^;]+)/.exec(style);

			body += '<g class="node" data-id="' + self.Escape(id) + '">' + self.Shape(entry.Shape, at.X + offsetX, at.Y + offsetY, boxes[id].Width, boxes[id].Height, style.replace(/(?:^|;)color:[^;]+/, '')) + self.Text(entry.Text, at.X + offsetX, at.Y + offsetY, size, {Style: color ? 'fill:' + color[1] : ''}) + '</g>';
		});

		return {Width: width, Height: height, Defs: this.Markers(options.Id, Object.keys(markers)), Body: groupsBody + body + labels};
	}
});
