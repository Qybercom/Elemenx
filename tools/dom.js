'use strict';

/*
 * A document in Node, enough for Elemenx to render a page on a server: nodes (elements, text, comments, fragments), their
 * attributes, classes, styles and events, CSS selectors (tag, #id, .class, [attribute] with = ~= ^= $= *= |=, :not(),
 * :first-child, :last-child, :scope and the combinators ' ', >, + and ~), an HTML parser (void and raw text elements, the
 * content of <template>, the end tags HTML implies, entities) and its serializer (innerHTML, outerHTML). What lays out
 * a page (sizes, boxes, observers of them) answers as a page that is not shown.
 * - Document(html): a document of a page; Parse(html, parent) puts the nodes of HTML into a node; Serialize(node) gives
 *   the HTML of its children.
 * - Window(options): the window of a page: {document, location (options.URL), history, navigator, localStorage,
 *   sessionStorage, the timers, XMLHttpRequest (options.Fetch(url, callback (error, text)) reads the files a page asks
 *   for), the observers and the rest a page reads}. A <script src> or a <link> put into the document is fetched and
 *   run (options.Run(text, url, script)), then its load event comes; the scripts of the page itself are run by Run.
 */

var Void = {area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1};
var Raw = {script: 1, style: 1, xmp: 1, iframe: 1, noembed: 1, noframes: 1};
var Escaped = {textarea: 1, title: 1};
var SVG = 'http://www.w3.org/2000/svg';
var HTML = 'http://www.w3.org/1999/xhtml';
var Entities = {amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', copy: '©', reg: '®', trade: '™', hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', divide: '÷', middot: '·', bull: '•', rarr: '→', larr: '←', uarr: '↑', darr: '↓', euro: '€', pound: '£', yen: '¥', cent: '¢', deg: '°', plusmn: '±', minus: '−', para: '¶', sect: '§', shy: '­', zwj: '‍', zwnj: '‌', thinsp: ' ', ensp: ' ', emsp: ' '};

/* The end tags HTML implies: an element of a name closes the open one of these first. */
var Closes = {
	li: {li: 1},
	dt: {dt: 1, dd: 1},
	dd: {dt: 1, dd: 1},
	option: {option: 1},
	optgroup: {optgroup: 1, option: 1},
	tr: {tr: 1, td: 1, th: 1},
	td: {td: 1, th: 1},
	th: {td: 1, th: 1},
	thead: {tbody: 1, tfoot: 1},
	tbody: {thead: 1, tbody: 1, tfoot: 1},
	tfoot: {thead: 1, tbody: 1}
};
var Paragraph = {address: 1, article: 1, aside: 1, blockquote: 1, details: 1, div: 1, dl: 1, fieldset: 1, figcaption: 1, figure: 1, footer: 1, form: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, header: 1, hr: 1, main: 1, menu: 1, nav: 1, ol: 1, p: 1, pre: 1, section: 1, table: 1, ul: 1};

function decode (text) {
	return text.indexOf('&') === -1 ? text : text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);?/gi, function (all, name) {
		if (name.charAt(0) === '#') {
			var code = name.charAt(1).toLowerCase() === 'x' ? parseInt(name.substring(2), 16) : parseInt(name.substring(1), 10);

			return isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : all;
		}

		return Object.prototype.hasOwnProperty.call(Entities, name) ? Entities[name] : all;
	});
}

function escapeText (text) {
	return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
}

function escapeAttribute (text) {
	return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/ /g, '&nbsp;');
}

/* Events */

function Event (type, init) {
	init = init || {};

	this.type = String(type);
	this.bubbles = !!init.bubbles;
	this.cancelable = !!init.cancelable;
	this.composed = !!init.composed;
	this.detail = init.detail === undefined ? null : init.detail;
	this.defaultPrevented = false;
	this.target = null;
	this.currentTarget = null;
	this.timeStamp = Date.now();
	this.Stopped = false;
}

Event.prototype.preventDefault = function () {
	if (this.cancelable)
		this.defaultPrevented = true;
};

Event.prototype.stopPropagation = function () {
	this.Stopped = true;
};

Event.prototype.stopImmediatePropagation = function () {
	this.Stopped = true;
	this.Immediate = true;
};

Event.prototype.composedPath = function () {
	var path = [];
	var node = this.target;

	while (node) {
		path.push(node);

		node = node.parentNode;
	}

	return path;
};

/* Nodes */

function Node () {}

Node.ELEMENT_NODE = 1;
Node.ATTRIBUTE_NODE = 2;
Node.TEXT_NODE = 3;
Node.CDATA_SECTION_NODE = 4;
Node.COMMENT_NODE = 8;
Node.DOCUMENT_NODE = 9;
Node.DOCUMENT_TYPE_NODE = 10;
Node.DOCUMENT_FRAGMENT_NODE = 11;
Node.DOCUMENT_POSITION_DISCONNECTED = 1;
Node.DOCUMENT_POSITION_PRECEDING = 2;
Node.DOCUMENT_POSITION_FOLLOWING = 4;
Node.DOCUMENT_POSITION_CONTAINS = 8;
Node.DOCUMENT_POSITION_CONTAINED_BY = 16;

['ELEMENT_NODE', 'TEXT_NODE', 'COMMENT_NODE', 'DOCUMENT_NODE', 'DOCUMENT_FRAGMENT_NODE'].forEach(function (name) {
	Node.prototype[name] = Node[name];
});

function setup (node, document, type, name) {
	node.nodeType = type;
	node.nodeName = name;
	node.ownerDocument = document;
	node.parentNode = null;
	node.childNodes = [];
	node.Listeners = null;
}

function sibling (node, step) {
	var list = node.parentNode ? node.parentNode.childNodes : null;
	var at = list ? list.indexOf(node) : -1;

	return at === -1 ? null : list[at + step] || null;
}

function elements (list) {
	return list.filter(function (node) {
		return node.nodeType === 1;
	});
}

Object.defineProperties(Node.prototype, {
	firstChild: {get: function () {
		return this.childNodes[0] || null;
	}},
	lastChild: {get: function () {
		return this.childNodes[this.childNodes.length - 1] || null;
	}},
	nextSibling: {get: function () {
		return sibling(this, 1);
	}},
	previousSibling: {get: function () {
		return sibling(this, -1);
	}},
	parentElement: {get: function () {
		return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
	}},
	isConnected: {get: function () {
		var node = this;

		while (node.parentNode)
			node = node.parentNode.Host || node.parentNode;

		return node.nodeType === 9;
	}},
	textContent: {
		get: function () {
			if (this.nodeType === 3 || this.nodeType === 8) return this.data;
			if (this.nodeType === 9) return null;

			return this.childNodes.map(function (child) {
				return child.nodeType === 8 ? '' : child.textContent;
			}).join('');
		},
		set: function (value) {
			if (this.nodeType === 3 || this.nodeType === 8) {
				this.data = value === null || value === undefined ? '' : String(value);

				return;
			}

			while (this.childNodes.length)
				this.removeChild(this.childNodes[0]);

			if (value !== null && value !== undefined && String(value) !== '')
				this.appendChild(this.ownerDocument.createTextNode(String(value)));
		}
	},
	nodeValue: {
		get: function () {
			return this.nodeType === 3 || this.nodeType === 8 ? this.data : null;
		},
		set: function (value) {
			if (this.nodeType === 3 || this.nodeType === 8)
				this.data = String(value);
		}
	},
	children: {get: function () {
		return elements(this.childNodes);
	}},
	firstElementChild: {get: function () {
		return elements(this.childNodes)[0] || null;
	}},
	lastElementChild: {get: function () {
		var list = elements(this.childNodes);

		return list[list.length - 1] || null;
	}},
	childElementCount: {get: function () {
		return elements(this.childNodes).length;
	}},
	nextElementSibling: {get: function () {
		var node = this.nextSibling;

		while (node && node.nodeType !== 1)
			node = node.nextSibling;

		return node;
	}},
	previousElementSibling: {get: function () {
		var node = this.previousSibling;

		while (node && node.nodeType !== 1)
			node = node.previousSibling;

		return node;
	}}
});

Node.prototype.hasChildNodes = function () {
	return this.childNodes.length > 0;
};

Node.prototype.contains = function (other) {
	var node = other;

	while (node) {
		if (node === this) return true;

		node = node.parentNode;
	}

	return false;
};

Node.prototype.getRootNode = function () {
	var node = this;

	while (node.parentNode)
		node = node.parentNode;

	return node;
};

Node.prototype.compareDocumentPosition = function (other) {
	if (other === this) return 0;

	if (this.contains(other))
		return Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING;

	if (other.contains(this))
		return Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING;

	if (this.getRootNode() !== other.getRootNode()) return Node.DOCUMENT_POSITION_DISCONNECTED;

	var order = [];

	(function walk (node) {
		order.push(node);

		node.childNodes.forEach(walk);
	})(this.getRootNode());

	return order.indexOf(other) > order.indexOf(this) ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING;
};

/* The nodes a node takes: a fragment gives its children, any other node itself (out of where it was). */
function taken (node) {
	var list;

	if (node.nodeType === 11) {
		list = node.childNodes.slice();

		list.forEach(function (child) {
			child.parentNode = null;
		});

		node.childNodes.length = 0;

		return list;
	}

	if (node.parentNode)
		node.parentNode.removeChild(node);

	return [node];
}

function connected (parent, nodes) {
	var window = parent.ownerDocument && parent.ownerDocument.defaultView;
	if (!window || !window.Connected || !parent.isConnected) return;

	nodes.forEach(function (node) {
		window.Connected(node);
	});
}

Node.prototype.insertBefore = function (node, reference) {
	var list = taken(node);
	var at = reference ? this.childNodes.indexOf(reference) : -1;
	var self = this;

	if (reference && at === -1)
		throw new Error('The node before which the new node is to be inserted is not a child of this node.');

	list.forEach(function (child) {
		child.parentNode = self;
	});

	if (at === -1) Array.prototype.push.apply(this.childNodes, list);
	else Array.prototype.splice.apply(this.childNodes, [at, 0].concat(list));

	connected(this, list);

	return node;
};

Node.prototype.appendChild = function (node) {
	return this.insertBefore(node, null);
};

Node.prototype.removeChild = function (node) {
	var at = this.childNodes.indexOf(node);
	if (at === -1)
		throw new Error('The node to be removed is not a child of this node.');

	this.childNodes.splice(at, 1);

	node.parentNode = null;

	return node;
};

Node.prototype.replaceChild = function (node, old) {
	this.insertBefore(node, old);

	return this.removeChild(old);
};

Node.prototype.remove = function () {
	if (this.parentNode)
		this.parentNode.removeChild(this);
};

function nodes (document, list) {
	return Array.prototype.map.call(list, function (item) {
		return typeof item === 'string' ? document.createTextNode(item) : item;
	});
}

Node.prototype.append = function () {
	var self = this;

	nodes(this.ownerDocument || this, arguments).forEach(function (node) {
		self.appendChild(node);
	});
};

Node.prototype.prepend = function () {
	var self = this;
	var first = this.firstChild;

	nodes(this.ownerDocument || this, arguments).forEach(function (node) {
		self.insertBefore(node, first);
	});
};

Node.prototype.before = function () {
	var parent = this.parentNode;
	var self = this;

	if (!parent) return;

	nodes(this.ownerDocument, arguments).forEach(function (node) {
		parent.insertBefore(node, self);
	});
};

Node.prototype.after = function () {
	var parent = this.parentNode;
	var next = this.nextSibling;

	if (!parent) return;

	nodes(this.ownerDocument, arguments).forEach(function (node) {
		parent.insertBefore(node, next);
	});
};

Node.prototype.replaceWith = function () {
	var parent = this.parentNode;
	var self = this;

	if (!parent) return;

	nodes(this.ownerDocument, arguments).forEach(function (node) {
		parent.insertBefore(node, self);
	});

	parent.removeChild(this);
};

Node.prototype.replaceChildren = function () {
	while (this.childNodes.length)
		this.removeChild(this.childNodes[0]);

	this.append.apply(this, arguments);
};

Node.prototype.cloneNode = function (deep) {
	var document = this.ownerDocument;
	var copy;

	if (this.nodeType === 3)
		return document.createTextNode(this.data);

	if (this.nodeType === 8)
		return document.createComment(this.data);

	if (this.nodeType === 11) {
		copy = document.createDocumentFragment();
	}
	else {
		copy = document.createElementNS(this.namespaceURI, this.tagName);
		copy.Attributes = this.Attributes.map(function (attribute) {
			return new Attribute(attribute.name, attribute.value);
		});

		if (this.Content)
			copy.Content = this.Content.cloneNode(true);
	}

	if (deep) {
		this.childNodes.forEach(function (child) {
			copy.appendChild(child.cloneNode(true));
		});
	}

	return copy;
};

Node.prototype.normalize = function () {};

Node.prototype.addEventListener = function (type, listener, options) {
	if (!listener) return;

	this.Listeners = this.Listeners || [];

	if (this.Listeners.some(function (one) {
		return one.Type === type && one.Listener === listener;
	})) return;

	this.Listeners.push({Type: type, Listener: listener, Capture: options === true || !!(options && options.capture), Once: !!(options && options.once)});
};

Node.prototype.removeEventListener = function (type, listener) {
	this.Listeners = (this.Listeners || []).filter(function (one) {
		return !(one.Type === type && one.Listener === listener);
	});
};

Node.prototype.dispatchEvent = function (event) {
	var path = [];
	var node = this;

	event.target = this;

	while (node) {
		path.push(node);

		node = node.parentNode || (node.nodeType === 9 ? node.defaultView : null);
	}

	path.some(function (each, index) {
		var list = (each.Listeners || []).filter(function (one) {
			return one.Type === event.type;
		});

		if (index && !event.bubbles) return true;

		event.currentTarget = each;

		list.some(function (one) {
			var call = typeof one.Listener === 'function' ? one.Listener : one.Listener.handleEvent;

			if (one.Once)
				each.removeEventListener(one.Type, one.Listener);

			try {
				call.call(typeof one.Listener === 'function' ? each : one.Listener, event);
			}
			catch (error) {
				if (each.ownerDocument && each.ownerDocument.defaultView && each.ownerDocument.defaultView.Report) each.ownerDocument.defaultView.Report(error);
				else throw error;
			}

			return event.Immediate;
		});

		return event.Stopped;
	});

	return !event.defaultPrevented;
};

/* Text, comments, fragments */

function Text (document, data) {
	setup(this, document, 3, '#text');

	this.data = String(data);
}

Text.prototype = Object.create(Node.prototype);
Text.prototype.constructor = Text;

Object.defineProperty(Text.prototype, 'wholeText', {get: function () {
	return this.data;
}});

Object.defineProperty(Text.prototype, 'length', {get: function () {
	return this.data.length;
}});

Text.prototype.splitText = function (offset) {
	var rest = this.ownerDocument.createTextNode(this.data.substring(offset));

	this.data = this.data.substring(0, offset);

	if (this.parentNode)
		this.parentNode.insertBefore(rest, this.nextSibling);

	return rest;
};

function Comment (document, data) {
	setup(this, document, 8, '#comment');

	this.data = String(data);
}

Comment.prototype = Object.create(Node.prototype);
Comment.prototype.constructor = Comment;

function DocumentFragment (document) {
	setup(this, document, 11, '#document-fragment');
}

DocumentFragment.prototype = Object.create(Node.prototype);
DocumentFragment.prototype.constructor = DocumentFragment;

/* Elements */

function ClassList (element) {
	this.Element = element;
}

ClassList.prototype.List = function () {
	return String(this.Element.getAttribute('class') || '').split(/\s+/).filter(Boolean);
};

ClassList.prototype.Set = function (list) {
	this.Element.setAttribute('class', list.join(' '));
};

ClassList.prototype.contains = function (name) {
	return this.List().indexOf(String(name)) !== -1;
};

ClassList.prototype.add = function () {
	var list = this.List();

	Array.prototype.forEach.call(arguments, function (name) {
		if (list.indexOf(String(name)) === -1)
			list.push(String(name));
	});

	this.Set(list);
};

ClassList.prototype.remove = function () {
	var names = Array.prototype.map.call(arguments, String);

	this.Set(this.List().filter(function (name) {
		return names.indexOf(name) === -1;
	}));
};

ClassList.prototype.toggle = function (name, force) {
	var on = force === undefined ? !this.contains(name) : !!force;

	if (on) this.add(name);
	else this.remove(name);

	return on;
};

ClassList.prototype.replace = function (from, to) {
	if (!this.contains(from)) return false;

	this.Set(this.List().map(function (name) {
		return name === from ? to : name;
	}));

	return true;
};

ClassList.prototype.item = function (index) {
	return this.List()[index] || null;
};

Object.defineProperty(ClassList.prototype, 'length', {get: function () {
	return this.List().length;
}});

Object.defineProperty(ClassList.prototype, 'value', {get: function () {
	return this.List().join(' ');
}});

ClassList.prototype.toString = function () {
	return this.List().join(' ');
};

function dashed (name) {
	return name.replace(/[A-Z]/g, function (letter) {
		return '-' + letter.toLowerCase();
	}).replace(/^ms-/, '-ms-');
}

/* The style of an element: its declarations kept in its style attribute, each a property and cssText. */
function style (element) {
	function read () {
		var result = [];

		String(element.getAttribute('style') || '').split(';').forEach(function (part) {
			var at = part.indexOf(':');
			if (at > 0)
				result.push([part.substring(0, at).trim().toLowerCase(), part.substring(at + 1).trim()]);
		});

		return result;
	}

	function write (list) {
		if (!list.length) element.removeAttribute('style');
		else element.setAttribute('style', list.map(function (pair) {
			return pair[0] + ': ' + pair[1] + ';';
		}).join(' '));
	}

	function set (name, value) {
		var list = read().filter(function (pair) {
			return pair[0] !== name;
		});

		if (value !== null && value !== undefined && String(value) !== '')
			list.push([name, String(value)]);

		write(list);
	}

	function get (name) {
		var found = read().filter(function (pair) {
			return pair[0] === name;
		})[0];

		return found ? found[1].replace(/\s*!important$/, '') : '';
	}

	var methods = {
		setProperty: function (name, value, priority) {
			set(String(name).toLowerCase(), value === null || value === undefined || value === '' ? value : String(value) + (priority ? ' !important' : ''));
		},
		removeProperty: function (name) {
			var before = get(String(name).toLowerCase());

			set(String(name).toLowerCase(), '');

			return before;
		},
		getPropertyValue: function (name) {
			return get(String(name).toLowerCase());
		},
		getPropertyPriority: function () {
			return '';
		},
		item: function (index) {
			return (read()[index] || [''])[0];
		}
	};

	return new Proxy(methods, {
		get: function (target, key) {
			if (typeof key !== 'string') return undefined;
			if (Object.prototype.hasOwnProperty.call(target, key)) return target[key];

			if (key === 'cssText')
				return element.getAttribute('style') || '';

			if (key === 'length')
				return read().length;

			if (key === 'cssFloat') return get('float');

			return get(key.indexOf('-') === -1 ? dashed(key) : key);
		},
		set: function (target, key, value) {
			if (key === 'cssText') {
				if (value) element.setAttribute('style', String(value));
				else element.removeAttribute('style');
			}
			else {
				set(String(key).indexOf('-') === -1 ? dashed(String(key)) : String(key), value);
			}

			return true;
		},
		has: function (target, key) {
			return typeof key === 'string';
		}
	});
}

/* An attribute: its name and its value, the same object the element keeps. */
function Attribute (name, value) {
	this.name = name;
	this.value = value;
}

Object.defineProperties(Attribute.prototype, {
	localName: {get: function () {
		return this.name;
	}},
	nodeName: {get: function () {
		return this.name;
	}},
	nodeValue: {
		get: function () {
			return this.value;
		},
		set: function (value) {
			this.value = String(value);
		}
	},
	specified: {get: function () {
		return true;
	}}
});

function Element (document, name, namespace) {
	var html = namespace === HTML;

	setup(this, document, 1, html ? String(name).toUpperCase() : String(name));

	this.tagName = this.nodeName;
	this.localName = html ? String(name).toLowerCase() : String(name);
	this.namespaceURI = namespace;
	this.Attributes = [];
	this.Content = this.localName === 'template' && html ? new DocumentFragment(document) : null;
	this.Shadow = null;
	this.Style = null;
	this.Classes = null;
}

Element.prototype = Object.create(Node.prototype);
Element.prototype.constructor = Element;

Element.prototype.Name = function (name) {
	return this.namespaceURI === HTML ? String(name).toLowerCase() : String(name);
};

Element.prototype.Find = function (name) {
	var wanted = this.Name(name);

	return this.Attributes.filter(function (attribute) {
		return attribute.name === wanted;
	})[0] || null;
};

Element.prototype.getAttribute = function (name) {
	var found = this.Find(name);

	return found ? found.value : null;
};

Element.prototype.setAttribute = function (name, value) {
	var found = this.Find(name);
	var text = String(value);

	if (!/^[^\s"'>\/=\x00-\x1f]+$/.test(String(name)))
		throw new Error('Failed to execute \'setAttribute\': \'' + name + '\' is not a valid attribute name.');

	if (found) found.value = text;
	else this.Attributes.push(new Attribute(this.Name(name), text));
};

Element.prototype.setAttributeNS = function (namespace, name, value) {
	this.setAttribute(name, value);
};

Element.prototype.getAttributeNS = function (namespace, name) {
	return this.getAttribute(name);
};

Element.prototype.removeAttribute = function (name) {
	var wanted = this.Name(name);

	this.Attributes = this.Attributes.filter(function (attribute) {
		return attribute.name !== wanted;
	});
};

Element.prototype.removeAttributeNS = function (namespace, name) {
	this.removeAttribute(name);
};

Element.prototype.hasAttribute = function (name) {
	return !!this.Find(name);
};

Element.prototype.hasAttributes = function () {
	return this.Attributes.length > 0;
};

Element.prototype.getAttributeNames = function () {
	return this.Attributes.map(function (attribute) {
		return attribute.name;
	});
};

Element.prototype.toggleAttribute = function (name, force) {
	var on = force === undefined ? !this.hasAttribute(name) : !!force;

	if (on) this.setAttribute(name, '');
	else this.removeAttribute(name);

	return on;
};

Element.prototype.matches = function (selector) {
	return matches(this, parse(selector), this);
};

Element.prototype.webkitMatchesSelector = Element.prototype.matches;

Element.prototype.closest = function (selector) {
	var groups = parse(selector);
	var node = this;

	while (node && node.nodeType === 1) {
		if (matches(node, groups, null)) return node;

		node = node.parentNode;
	}

	return null;
};

Element.prototype.attachShadow = function () {
	this.Shadow = new DocumentFragment(this.ownerDocument);
	this.Shadow.Host = this;
	this.Shadow.host = this;
	this.Shadow.mode = 'open';

	return this.Shadow;
};

Element.prototype.getBoundingClientRect = function () {
	return {x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: function () {
		return {};
	}};
};

Element.prototype.getClientRects = function () {
	return [];
};

['focus', 'blur', 'scrollIntoView', 'scrollTo', 'scrollBy', 'scroll', 'setPointerCapture', 'releasePointerCapture', 'requestFullscreen', 'select', 'setSelectionRange', 'showModal', 'show', 'close', 'pause', 'load', 'requestPointerLock'].forEach(function (name) {
	Element.prototype[name] = function () {};
});

Element.prototype.hasPointerCapture = function () {
	return false;
};

Element.prototype.play = function () {
	return {then: function () {}, catch: function () {}};
};

Element.prototype.animate = function () {
	return {cancel: function () {}, finish: function () {}, play: function () {}, pause: function () {}, addEventListener: function () {}, finished: {then: function () {}}};
};

Element.prototype.getAnimations = function () {
	return [];
};

Element.prototype.click = function () {
	this.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
};

Element.prototype.getContext = function () {
	return null;
};

Element.prototype.toDataURL = function () {
	return 'data:,';
};

Element.prototype.insertAdjacentHTML = function (where, html) {
	var holder = this.ownerDocument.createElement('template');

	parseInto(holder.content, String(html), holder.content);

	this.insertAdjacentElement(where, holder.content);
};

Element.prototype.insertAdjacentElement = function (where, node) {
	var place = String(where).toLowerCase();

	if (place === 'beforebegin' && this.parentNode) this.parentNode.insertBefore(node, this);
	else if (place === 'afterbegin') this.insertBefore(node, this.firstChild);
	else if (place === 'beforeend') this.appendChild(node);
	else if (place === 'afterend' && this.parentNode) this.parentNode.insertBefore(node, this.nextSibling);

	return node;
};

Element.prototype.insertAdjacentText = function (where, text) {
	this.insertAdjacentElement(where, this.ownerDocument.createTextNode(text));
};

Element.prototype.getElementsByTagName = function (name) {
	return all(this, name === '*' ? '*' : String(name).toLowerCase(), this);
};

Element.prototype.getElementsByClassName = function (names) {
	return all(this, '.' + String(names).trim().split(/\s+/).join('.'), this);
};

Element.prototype.querySelector = function (selector) {
	return all(this, selector, this)[0] || null;
};

Element.prototype.querySelectorAll = function (selector) {
	return all(this, selector, this);
};

/* A property that is an attribute of the same name: strings, numbers, true or false. */
function reflect (name, attribute, kind) {
	Object.defineProperty(Element.prototype, name, {
		configurable: true,
		get: function () {
			var value = this.getAttribute(attribute);

			if (kind === 'bool')
				return value !== null;

			if (kind === 'number')
				return value === null ? (attribute === 'tabindex' ? -1 : 0) : Number(value);

			return value === null ? '' : value;
		},
		set: function (value) {
			if (kind === 'bool') this.toggleAttribute(attribute, !!value);
			else this.setAttribute(attribute, value === null || value === undefined ? '' : String(value));
		}
	});
}

/* href and src are absolute, of the page, as a browser gives them. */
['href', 'src', 'action'].forEach(function (name) {
	Object.defineProperty(Element.prototype, name, {
		configurable: true,
		get: function () {
			var value = this.getAttribute(name);
			var window = this.ownerDocument && this.ownerDocument.defaultView;

			if (value === null) return '';

			try {
				return window ? new URL(value, window.location.href).href : value;
			}
			catch (error) {
				return value;
			}
		},
		set: function (value) {
			this.setAttribute(name, value);
		}
	});
});

[['id', 'id'], ['title', 'title'], ['lang', 'lang'], ['dir', 'dir'], ['name', 'name'], ['placeholder', 'placeholder'], ['alt', 'alt'], ['rel', 'rel'], ['target', 'target'], ['role', 'role'], ['htmlFor', 'for'], ['accept', 'accept'], ['autocomplete', 'autocomplete'], ['min', 'min'], ['max', 'max'], ['step', 'step'], ['pattern', 'pattern'], ['method', 'method'], ['srcset', 'srcset'], ['sizes', 'sizes'], ['download', 'download'], ['label', 'label'], ['slot', 'slot'], ['inputMode', 'inputmode'], ['enterKeyHint', 'enterkeyhint'], ['contentEditable', 'contenteditable'], ['draggable', 'draggable'], ['spellcheck', 'spellcheck']].forEach(function (pair) {
	reflect(pair[0], pair[1], 'text');
});

[['hidden', 'hidden'], ['disabled', 'disabled'], ['required', 'required'], ['readOnly', 'readonly'], ['multiple', 'multiple'], ['autofocus', 'autofocus'], ['open', 'open'], ['defer', 'defer'], ['async', 'async'], ['noValidate', 'novalidate'], ['controls', 'controls'], ['loop', 'loop'], ['muted', 'muted'], ['autoplay', 'autoplay'], ['playsInline', 'playsinline'], ['inert', 'inert'], ['defaultChecked', 'checked'], ['defaultSelected', 'selected']].forEach(function (pair) {
	reflect(pair[0], pair[1], 'bool');
});

[['tabIndex', 'tabindex'], ['rows', 'rows'], ['cols', 'cols'], ['maxLength', 'maxlength'], ['minLength', 'minlength'], ['colSpan', 'colspan'], ['rowSpan', 'rowspan'], ['width', 'width'], ['height', 'height'], ['span', 'span'], ['size', 'size']].forEach(function (pair) {
	reflect(pair[0], pair[1], 'number');
});

Object.defineProperties(Element.prototype, {
	className: {
		get: function () {
			return this.getAttribute('class') || '';
		},
		set: function (value) {
			this.setAttribute('class', value);
		}
	},
	classList: {get: function () {
		this.Classes = this.Classes || new ClassList(this);

		return this.Classes;
	}},
	style: {get: function () {
		this.Style = this.Style || style(this);

		return this.Style;
	}},
	dataset: {get: function () {
		var element = this;

		function attribute (key) {
			return 'data-' + dashed(String(key));
		}

		return new Proxy({}, {
			get: function (target, key) {
				var value = typeof key === 'string' ? element.getAttribute(attribute(key)) : null;

				return value === null ? undefined : value;
			},
			set: function (target, key, value) {
				element.setAttribute(attribute(key), value);

				return true;
			},
			deleteProperty: function (target, key) {
				element.removeAttribute(attribute(key));

				return true;
			},
			has: function (target, key) {
				return element.hasAttribute(attribute(key));
			},
			ownKeys: function () {
				return element.getAttributeNames().filter(function (name) {
					return name.indexOf('data-') === 0;
				}).map(function (name) {
					return name.substring(5).replace(/-([a-z])/g, function (all, letter) {
						return letter.toUpperCase();
					});
				});
			},
			getOwnPropertyDescriptor: function (target, key) {
				return element.hasAttribute(attribute(key)) ? {enumerable: true, configurable: true, value: element.getAttribute(attribute(key))} : undefined;
			}
		});
	}},
	/* The attributes themselves, as a browser gives them: a value written to one is the value of the attribute. */
	attributes: {get: function () {
		var list = this.Attributes.slice();

		list.item = function (index) {
			return list[index] || null;
		};

		list.getNamedItem = function (name) {
			return list.filter(function (attribute) {
				return attribute.name === String(name).toLowerCase();
			})[0] || null;
		};

		return list;
	}},
	content: {get: function () {
		return this.Content;
	}},
	shadowRoot: {get: function () {
		return this.Shadow;
	}},
	innerHTML: {
		get: function () {
			return serialize(this.Content || this);
		},
		set: function (value) {
			var target = this.Content || this;

			while (target.childNodes.length)
				target.removeChild(target.childNodes[0]);

			parseInto(target, String(value === null || value === undefined ? '' : value), this);
		}
	},
	outerHTML: {get: function () {
		return serializeNode(this);
	}},
	innerText: {
		get: function () {
			return this.textContent;
		},
		set: function (value) {
			this.textContent = value;
		}
	},
	outerText: {get: function () {
		return this.textContent;
	}},
	value: {
		get: function () {
			if (this.Value !== undefined) return this.Value;
			if (this.localName === 'textarea') return this.textContent;

			if (this.localName === 'select') {
				var chosen = this.querySelectorAll('option').filter(function (option) {
					return option.selected;
				})[0] || this.querySelector('option');

				return chosen ? chosen.value : '';
			}

			if (this.localName === 'option')
				return this.hasAttribute('value') ? this.getAttribute('value') : this.textContent;

			return this.getAttribute('value') === null ? (this.localName === 'input' && /^(checkbox|radio)$/.test(this.type) ? 'on' : '') : this.getAttribute('value');
		},
		set: function (value) {
			var text = value === null || value === undefined ? '' : String(value);

			if (this.localName === 'select') {
				this.querySelectorAll('option').forEach(function (option) {
					option.selected = option.value === text;
				});

				return;
			}

			/* What a page shows of a field is its value: the attribute, for the markup of the server to keep it. */
			this.Value = text;

			if (this.localName === 'textarea') this.textContent = text;
			else this.setAttribute('value', text);
		}
	},
	defaultValue: {
		get: function () {
			return this.getAttribute('value') || '';
		},
		set: function (value) {
			this.setAttribute('value', value);
		}
	},
	checked: {
		get: function () {
			return this.Checked === undefined ? this.hasAttribute('checked') : this.Checked;
		},
		set: function (value) {
			this.Checked = !!value;

			this.toggleAttribute('checked', !!value);
		}
	},
	selected: {
		get: function () {
			return this.Selected === undefined ? this.hasAttribute('selected') : this.Selected;
		},
		set: function (value) {
			this.Selected = !!value;

			this.toggleAttribute('selected', !!value);
		}
	},
	indeterminate: {
		get: function () {
			return !!this.Indeterminate;
		},
		set: function (value) {
			this.Indeterminate = !!value;
		}
	},
	type: {
		get: function () {
			var value = this.getAttribute('type');

			if (this.localName === 'input')
				return value ? value.toLowerCase() : 'text';

			if (this.localName === 'button')
				return value ? value.toLowerCase() : 'submit';

			return value || '';
		},
		set: function (value) {
			this.setAttribute('type', value);
		}
	},
	options: {get: function () {
		return this.querySelectorAll('option');
	}},
	selectedIndex: {
		get: function () {
			var list = this.querySelectorAll('option');
			var value = this.value;
			var i;

			for (i = 0; i < list.length; i++) {
				if (list[i].value === value) return i;
			}

			return -1;
		},
		set: function (index) {
			this.querySelectorAll('option').forEach(function (option, at) {
				option.selected = at === index;
			});
		}
	},
	form: {get: function () {
		return this.closest('form');
	}},
	files: {get: function () {
		return [];
	}},
	sheet: {get: function () {
		return {cssRules: [], insertRule: function () {
			return 0;
		}, deleteRule: function () {}};
	}},
	isContentEditable: {get: function () {
		return this.getAttribute('contenteditable') === 'true' || this.getAttribute('contenteditable') === '';
	}},
	offsetParent: {get: function () {
		return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
	}},
	validity: {get: function () {
		return {valid: true, valueMissing: false, typeMismatch: false, patternMismatch: false, tooLong: false, tooShort: false, rangeUnderflow: false, rangeOverflow: false, stepMismatch: false, badInput: false, customError: false};
	}},
	validationMessage: {get: function () {
		return '';
	}}
});

['offsetWidth', 'offsetHeight', 'offsetLeft', 'offsetTop', 'clientWidth', 'clientHeight', 'clientLeft', 'clientTop', 'scrollWidth', 'scrollHeight', 'naturalWidth', 'naturalHeight', 'videoWidth', 'videoHeight', 'duration', 'currentTime', 'selectionStart', 'selectionEnd'].forEach(function (name) {
	Object.defineProperty(Element.prototype, name, {configurable: true, get: function () {
		return this['Own' + name] || 0;
	}, set: function (value) {
		this['Own' + name] = value;
	}});
});

['scrollTop', 'scrollLeft'].forEach(function (name) {
	Object.defineProperty(Element.prototype, name, {configurable: true, get: function () {
		return this['Own' + name] || 0;
	}, set: function (value) {
		this['Own' + name] = Number(value) || 0;
	}});
});

Element.prototype.checkValidity = function () {
	return true;
};

Element.prototype.reportValidity = function () {
	return true;
};

Element.prototype.setCustomValidity = function () {};

Element.prototype.reset = function () {};

Element.prototype.submit = function () {};

Element.prototype.requestSubmit = function () {};

/* Selectors */

/* The groups of a selector list: each a list of compound parts from the left, with the combinator before each. */
function parse (selector) {
	var text = String(selector).trim();
	var groups = [];
	var parts = [];
	var part = null;
	var combinator = '';
	var i = 0;

	function fresh () {
		part = {Tag: '*', Id: null, Classes: [], Attributes: [], Pseudo: [], Combinator: combinator};
		combinator = '';

		parts.push(part);
	}

	function word () {
		var start = i;

		while (i < text.length && /[\w -￿-]/.test(text.charAt(i)))
			i++;

		if (text.charAt(i) === '\\') {
			i += 2;

			return text.substring(start, i) + word();
		}

		return text.substring(start, i).replace(/\\(.)/g, '$1');
	}

	function inner () {
		var depth = 1;
		var start = i;

		while (i < text.length && depth) {
			if (text.charAt(i) === '(')
				depth++;

			if (text.charAt(i) === ')')
				depth--;

			i++;
		}

		return text.substring(start, i - 1);
	}

	while (i < text.length) {
		var c = text.charAt(i);

		if (c === ',') {
			groups.push(parts);

			parts = [];
			part = null;
			combinator = '';
			i++;

			continue;
		}

		if (/\s/.test(c)) {
			while (i < text.length && /\s/.test(text.charAt(i)))
				i++;

			if (part && !/[,>+~]/.test(text.charAt(i)))
				combinator = ' ';

			part = combinator ? null : part;

			continue;
		}

		if (c === '>' || c === '+' || c === '~') {
			combinator = c;
			part = null;
			i++;

			continue;
		}

		if (!part)
			fresh();

		if (c === '*') {
			i++;
		}
		else if (c === '#') {
			i++;
			part.Id = word();
		}
		else if (c === '.') {
			i++;

			part.Classes.push(word());
		}
		else if (c === '[') {
			var end = i + 1;
			var quote = '';

			while (end < text.length && (quote || text.charAt(end) !== ']')) {
				if (quote && text.charAt(end) === quote) quote = '';
				else if (!quote && (text.charAt(end) === '"' || text.charAt(end) === '\'')) quote = text.charAt(end);

				end++;
			}

			var body = text.substring(i + 1, end);
			var match = /^\s*([^\s~|^$*!=]+)\s*(?:([~|^$*]?=)\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^\s\]]+)))?\s*(i)?\s*$/.exec(body);
			if (match)
				part.Attributes.push({Name: match[1].toLowerCase(), Operator: match[2] || '', Value: match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : match[5], Insensitive: !!match[6]});

			i = end + 1;
		}
		else if (c === ':') {
			i++;

			if (text.charAt(i) === ':')
				i++;

			var name = word().toLowerCase();
			var argument = null;

			if (text.charAt(i) === '(') {
				i++;
				argument = inner();
			}

			part.Pseudo.push({Name: name, Argument: argument === null ? null : name === 'not' || name === 'is' || name === 'where' || name === 'has' ? parse(argument) : argument});
		}
		else {
			part.Tag = word().toLowerCase();
		}
	}

	groups.push(parts);

	return groups.filter(function (group) {
		return group.length;
	});
}

function compound (element, part, scope) {
	if (part.Tag !== '*' && element.localName.toLowerCase() !== part.Tag) return false;
	if (part.Id !== null && element.getAttribute('id') !== part.Id) return false;

	if (part.Classes.length) {
		var classes = (element.getAttribute('class') || '').split(/\s+/);
		if (!part.Classes.every(function (name) {
			return classes.indexOf(name) !== -1;
		})) return false;
	}

	if (!part.Attributes.every(function (attribute) {
		var value = element.getAttribute(attribute.Name);
		var wanted = attribute.Value;

		if (value === null) return false;
		if (!attribute.Operator) return true;

		if (attribute.Insensitive) {
			value = value.toLowerCase();
			wanted = String(wanted).toLowerCase();
		}

		if (attribute.Operator === '=') return value === wanted;

		if (attribute.Operator === '~=')
			return value.split(/\s+/).indexOf(wanted) !== -1;

		if (attribute.Operator === '^=')
			return wanted !== '' && value.indexOf(wanted) === 0;

		if (attribute.Operator === '$=')
			return wanted !== '' && value.slice(-wanted.length) === wanted;

		if (attribute.Operator === '*=')
			return wanted !== '' && value.indexOf(wanted) !== -1;

		if (attribute.Operator === '|=')
			return value === wanted || value.indexOf(wanted + '-') === 0;

		return false;
	})) return false;

	return part.Pseudo.every(function (pseudo) {
		var parent = element.parentNode;
		var siblings = parent ? elements(parent.childNodes) : [element];

		if (pseudo.Name === 'not')
			return !matches(element, pseudo.Argument, scope);

		if (pseudo.Name === 'is' || pseudo.Name === 'where') return matches(element, pseudo.Argument, scope);

		if (pseudo.Name === 'has')
			return all(element, pseudo.Argument, element).length > 0;

		if (pseudo.Name === 'scope') return element === scope;
		if (pseudo.Name === 'first-child') return siblings[0] === element;

		if (pseudo.Name === 'last-child')
			return siblings[siblings.length - 1] === element;

		if (pseudo.Name === 'only-child') return siblings.length === 1;

		if (pseudo.Name === 'checked')
			return !!element.checked || !!element.selected;

		if (pseudo.Name === 'disabled')
			return element.hasAttribute('disabled');

		if (pseudo.Name === 'enabled')
			return !element.hasAttribute('disabled');

		if (pseudo.Name === 'empty')
			return !element.childNodes.length;

		if (pseudo.Name === 'root')
			return element.ownerDocument.documentElement === element;

		if (pseudo.Name === 'nth-child') {
			var at = siblings.indexOf(element) + 1;
			var rule = String(pseudo.Argument).replace(/\s+/g, '');
			if (rule === 'odd')
				return at % 2 === 1;

			if (rule === 'even')
				return at % 2 === 0;

			var step = /^(-?\d*)n([+-]\d+)?$/.exec(rule);
			if (!step)
				return at === Number(rule);

			var a = step[1] === '' ? 1 : step[1] === '-' ? -1 : Number(step[1]);
			var b = Number(step[2] || 0);

			return a ? (at - b) / a >= 0 && (at - b) % a === 0 : at === b;
		}

		/* What a page that is not shown cannot be: hovered, focused, active. */
		return false;
	});
}

/* Whether an element matches a selector: its last compound, then what each combinator asks of the ones before. */
function matches (element, groups, scope) {
	return groups.some(function (parts) {
		return chain(element, parts, parts.length - 1, scope);
	});
}

function chain (element, parts, index, scope) {
	var part = parts[index];
	var node;

	if (!compound(element, part, scope)) return false;

	if (!index)
		return true;

	if (part.Combinator === '>') {
		node = element.parentNode;

		return !!node && node.nodeType === 1 && chain(node, parts, index - 1, scope);
	}

	if (part.Combinator === '+') {
		node = element.previousElementSibling;

		return !!node && chain(node, parts, index - 1, scope);
	}

	if (part.Combinator === '~') {
		for (node = element.previousElementSibling; node; node = node.previousElementSibling) {
			if (chain(node, parts, index - 1, scope)) return true;
		}

		return false;
	}

	for (node = element.parentNode; node && node.nodeType === 1; node = node.parentNode) {
		if (chain(node, parts, index - 1, scope)) return true;
	}

	return false;
}

/* The elements under a node a selector matches, in the order of the document. */
function all (root, selector, scope) {
	var groups = typeof selector === 'string' ? parse(selector) : selector;
	var found = [];

	(function walk (node) {
		node.childNodes.forEach(function (child) {
			if (child.nodeType !== 1) return;

			if (matches(child, groups, scope))
				found.push(child);

			walk(child);
		});
	})(root);

	found.item = function (index) {
		return found[index] || null;
	};

	return found;
}

/* The parser */

/* The nodes of HTML put into a node: an element of HTML or of SVG (its names as they are written), its end tags as HTML implies them. */
function parseInto (target, html, context) {
	var document = target.ownerDocument || target;
	var stack = [target];
	var i = 0;
	var length = html.length;

	function current () {
		return stack[stack.length - 1];
	}

	/* Where the children of an element go: a <template> keeps them in its content. */
	function into (node) {
		return node.Content || node;
	}

	function text (value) {
		var parent = into(current());
		var last = parent.lastChild;

		if (!value) return;

		if (last && last.nodeType === 3) last.data += value;
		else parent.appendChild(document.createTextNode(value));
	}

	function foreign () {
		var j;

		for (j = stack.length - 1; j >= 0; j--) {
			if (stack[j].nodeType === 1 && stack[j].namespaceURI === SVG) return stack[j].localName !== 'foreignObject';
			if (stack[j].nodeType === 1 && stack[j].localName === 'foreignObject') return false;
		}

		return !!(context && context.namespaceURI === SVG);
	}

	function close (name) {
		var j;

		for (j = stack.length - 1; j > 0; j--) {
			if (stack[j].localName.toLowerCase() === name) {
				stack.length = j;

				return true;
			}
		}

		return false;
	}

	while (i < length) {
		var open = html.indexOf('<', i);

		if (open === -1) {
			text(decode(html.substring(i)));

			break;
		}

		if (open > i)
			text(decode(html.substring(i, open)));

		i = open;

		if (html.substr(i, 4) === '<!--') {
			var end = html.indexOf('-->', i + 4);

			into(current()).appendChild(document.createComment(html.substring(i + 4, end === -1 ? length : end)));

			i = end === -1 ? length : end + 3;

			continue;
		}

		if (html.charAt(i + 1) === '!' || html.charAt(i + 1) === '?') {
			var closing = html.indexOf('>', i);

			i = closing === -1 ? length : closing + 1;

			continue;
		}

		if (html.charAt(i + 1) === '/') {
			var tagEnd = html.indexOf('>', i);
			var endName = html.substring(i + 2, tagEnd === -1 ? length : tagEnd).trim().split(/\s/)[0].toLowerCase();

			i = tagEnd === -1 ? length : tagEnd + 1;

			/* </p> with no <p> open makes an empty one, as HTML does; any other stray end tag is let go. */
			if (!close(endName) && endName === 'p')
				into(current()).appendChild(document.createElement('p'));

			continue;
		}

		if (!/[a-zA-Z]/.test(html.charAt(i + 1))) {
			text('<');

			i++;

			continue;
		}

		/* A start tag: its name, then its attributes up to > (/> closes it in SVG). */
		var j = i + 1;

		while (j < length && !/[\s\/>]/.test(html.charAt(j)))
			j++;

		var written = html.substring(i + 1, j);
		var inSVG = foreign() || written.toLowerCase() === 'svg';
		var name = inSVG ? written : written.toLowerCase();
		var lower = written.toLowerCase();
		var attributes = [];
		var selfClosing = false;

		while (j < length) {
			while (j < length && /\s/.test(html.charAt(j)))
				j++;

			if (html.charAt(j) === '>') {
				j++;

				break;
			}

			if (html.charAt(j) === '/' && html.charAt(j + 1) === '>') {
				selfClosing = true;
				j += 2;

				break;
			}

			if (html.charAt(j) === '/') {
				j++;

				continue;
			}

			var start = j;

			while (j < length && !/[\s\/>=]/.test(html.charAt(j)))
				j++;

			if (j === start)
				j++;

			var attribute = html.substring(start, j);
			var value = '';

			while (j < length && /\s/.test(html.charAt(j)))
				j++;

			if (html.charAt(j) === '=') {
				j++;

				while (j < length && /\s/.test(html.charAt(j)))
					j++;

				var quote = html.charAt(j);

				if (quote === '"' || quote === '\'') {
					var valueEnd = html.indexOf(quote, j + 1);

					value = html.substring(j + 1, valueEnd === -1 ? length : valueEnd);
					j = valueEnd === -1 ? length : valueEnd + 1;
				}
				else {
					var unquoted = j;

					while (j < length && !/[\s>]/.test(html.charAt(j)))
						j++;

					value = html.substring(unquoted, j);
				}
			}

			attribute = inSVG ? attribute : attribute.toLowerCase();

			if (!attributes.some(function (one) {
				return one.name === attribute;
			}))
				attributes.push(new Attribute(attribute, decode(value)));
		}

		i = j;

		if (!inSVG) {
			if (Closes[lower] && Closes[lower][current().localName])
				stack.pop();

			if (Paragraph[lower] && current().localName === 'p')
				stack.pop();
		}

		var element = inSVG ? document.createElementNS(SVG, name) : document.createElement(name);

		element.Attributes = attributes;

		into(current()).appendChild(element);

		if (inSVG ? selfClosing : Void[lower]) continue;

		/* Raw text (script, style) is its text up to its end tag; a textarea or a title the same, its entities read. */
		if (!inSVG && (Raw[lower] || Escaped[lower])) {
			var endTag = html.toLowerCase().indexOf('</' + lower, i);
			var content = html.substring(i, endTag === -1 ? length : endTag);
			if (content)
				element.appendChild(document.createTextNode(Raw[lower] ? content : decode(content)));

			var after = endTag === -1 ? -1 : html.indexOf('>', endTag);

			i = after === -1 ? length : after + 1;

			continue;
		}

		stack.push(element);
	}

	return target;
}

/* Serializing */

function serializeNode (node) {
	var name;

	if (node.nodeType === 3) {
		var parent = node.parentNode;

		return parent && parent.nodeType === 1 && parent.namespaceURI === HTML && Raw[parent.localName] ? node.data : escapeText(node.data);
	}

	if (node.nodeType === 8)
		return '<!--' + node.data + '-->';

	if (node.nodeType === 11 || node.nodeType === 9) return serialize(node);

	name = node.namespaceURI === HTML ? node.localName : node.tagName;

	return '<' + name + node.Attributes.map(function (attribute) {
		return ' ' + attribute.name + '="' + escapeAttribute(attribute.value) + '"';
	}).join('') + '>' + (node.namespaceURI === HTML && Void[node.localName] ? '' : serialize(node.Content || node) + '</' + name + '>');
}

function serialize (node) {
	return node.childNodes.map(serializeNode).join('');
}

/* The document */

function Document () {
	setup(this, this, 9, '#document');

	this.ownerDocument = null;
	this.defaultView = null;
	this.readyState = 'complete';
	this.currentScript = null;
	this.cookie = '';
	this.visibilityState = 'visible';
	this.hidden = false;
	this.referrer = '';
	this.characterSet = 'UTF-8';
	this.compatMode = 'CSS1Compat';
	this.fonts = {ready: {then: function (callback) {
		callback();
	}}, addEventListener: function () {}, check: function () {
		return true;
	}, load: function () {
		return {then: function () {}};
	}};
}

Document.prototype = Object.create(Node.prototype);
Document.prototype.constructor = Document;

Document.prototype.createElement = function (name) {
	return new Element(this, String(name), HTML);
};

Document.prototype.createElementNS = function (namespace, name) {
	return new Element(this, String(name), namespace || HTML);
};

Document.prototype.createTextNode = function (data) {
	return new Text(this, data);
};

Document.prototype.createComment = function (data) {
	return new Comment(this, data);
};

Document.prototype.createDocumentFragment = function () {
	return new DocumentFragment(this);
};

Document.prototype.createEvent = function () {
	var event = new Event('');

	event.initEvent = function (type, bubbles, cancelable) {
		event.type = type;
		event.bubbles = !!bubbles;
		event.cancelable = !!cancelable;
	};

	event.initCustomEvent = function (type, bubbles, cancelable, detail) {
		event.initEvent(type, bubbles, cancelable);

		event.detail = detail;
	};

	return event;
};

Document.prototype.importNode = function (node, deep) {
	return node.cloneNode(deep);
};

Document.prototype.adoptNode = function (node) {
	return node;
};

Document.prototype.createRange = function () {
	return {setStart: function () {}, setEnd: function () {}, selectNodeContents: function () {}, collapse: function () {}, getBoundingClientRect: Element.prototype.getBoundingClientRect, getClientRects: function () {
		return [];
	}, createContextualFragment: function (html) {
		return parseInto(new DocumentFragment(this), String(html), null);
	}.bind(this)};
};

Document.prototype.getSelection = function () {
	return {rangeCount: 0, removeAllRanges: function () {}, addRange: function () {}, toString: function () {
		return '';
	}};
};

Document.prototype.execCommand = function () {
	return false;
};

Document.prototype.hasFocus = function () {
	return false;
};

/* A walker of the nodes under a root: SHOW_ELEMENT (1), SHOW_TEXT (4), SHOW_COMMENT (128), or all of them. */
Document.prototype.createTreeWalker = function (root, show, filter) {
	var list = [];
	var at = -1;
	var mask = show === undefined ? 0xFFFFFFFF : show;

	(function walk (node) {
		node.childNodes.forEach(function (child) {
			var bit = child.nodeType === 1 ? 1 : child.nodeType === 3 ? 4 : child.nodeType === 8 ? 128 : 0;
			var accepted = mask & bit;

			if (accepted && filter) {
				var answer = typeof filter === 'function' ? filter(child) : filter.acceptNode(child);

				accepted = answer === 1;
			}

			if (accepted)
				list.push(child);

			walk(child);
		});
	})(root);

	return {
		root: root,
		currentNode: root,
		nextNode: function () {
			at++;
			this.currentNode = list[at] || this.currentNode;

			return list[at] || null;
		}
	};
};

Document.prototype.getElementById = function (id) {
	return all(this, [[{Tag: '*', Id: String(id), Classes: [], Attributes: [], Pseudo: [], Combinator: ''}]], null)[0] || null;
};

Document.prototype.querySelector = Element.prototype.querySelector;
Document.prototype.querySelectorAll = Element.prototype.querySelectorAll;
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
DocumentFragment.prototype.querySelector = Element.prototype.querySelector;
DocumentFragment.prototype.querySelectorAll = Element.prototype.querySelectorAll;
DocumentFragment.prototype.getElementById = Document.prototype.getElementById;

Object.defineProperties(DocumentFragment.prototype, {
	innerHTML: {
		get: function () {
			return serialize(this);
		},
		set: function (value) {
			while (this.childNodes.length)
				this.removeChild(this.childNodes[0]);

			parseInto(this, String(value), this.Host || null);
		}
	}
});

Object.defineProperties(Document.prototype, {
	documentElement: {get: function () {
		return this.firstElementChild;
	}},
	head: {get: function () {
		return this.documentElement ? this.documentElement.querySelector('head') : null;
	}},
	body: {get: function () {
		return this.documentElement ? this.documentElement.querySelector('body') : null;
	}},
	title: {
		get: function () {
			var title = this.querySelector('title');

			return title ? title.textContent.trim() : '';
		},
		set: function (value) {
			var title = this.querySelector('title');

			if (!title && this.head) {
				title = this.createElement('title');

				this.head.appendChild(title);
			}

			if (title)
				title.textContent = value;
		}
	},
	activeElement: {get: function () {
		return this.body;
	}},
	styleSheets: {get: function () {
		return [];
	}},
	scrollingElement: {get: function () {
		return this.documentElement;
	}},
	location: {get: function () {
		return this.defaultView ? this.defaultView.location : null;
	}}
});

/* A document of a page: its <html>, <head> and <body> always there, as a browser makes them. */
function documentOf (html) {
	var document = new Document();
	var root;
	var head;
	var body;
	var source = String(html || '');
	var inner = /<html[^>]*>([\s\S]*)<\/html>/i.exec(source);
	var headMatch = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(source);
	var bodyMatch = /<body([^>]*)>([\s\S]*)<\/body>/i.exec(source);
	var htmlAttributes = /<html([^>]*)>/i.exec(source);

	root = document.createElement('html');
	head = document.createElement('head');
	body = document.createElement('body');

	document.appendChild(root);
	root.appendChild(head);
	root.appendChild(body);

	if (htmlAttributes)
		root.Attributes = attributesOf(htmlAttributes[1]);

	if (headMatch)
		parseInto(head, headMatch[1], head);

	if (bodyMatch) {
		body.Attributes = attributesOf(bodyMatch[1]);

		parseInto(body, bodyMatch[2], body);
	}
	else if (!headMatch) {
		parseInto(body, inner ? inner[1] : source, body);
	}

	return document;
}

function attributesOf (text) {
	var element = new Element(new Document(), 'div', HTML);

	parseInto(element, '<div ' + text + '>', element);

	return element.firstChild ? element.firstChild.Attributes : [];
}

/* The window */

function Storage () {
	var items = {};

	return {
		getItem: function (key) {
			return Object.prototype.hasOwnProperty.call(items, key) ? items[key] : null;
		},
		setItem: function (key, value) {
			items[key] = String(value);
		},
		removeItem: function (key) {
			delete items[key];
		},
		clear: function () {
			items = {};
		},
		key: function (index) {
			return Object.keys(items)[index] || null;
		},
		get length () {
			return Object.keys(items).length;
		}
	};
}

function Observer () {
	return function () {
		return {observe: function () {}, unobserve: function () {}, disconnect: function () {}, takeRecords: function () {
			return [];
		}};
	};
}

/*
 * A window of a page in Node. options: URL (where the page is), HTML (its markup), Fetch(url, callback (error, text))
 * (the files the page asks for, by their absolute URL), Run(text, url, script) (a script of the page or one it puts in:
 * run as the window), Report(error) (what throws in a listener).
 */
function Window (options) {
	var settings = options || {};
	var location = new URL(settings.URL || 'http://localhost/');
	var document = documentOf(settings.HTML || '<!DOCTYPE html><html><head></head><body></body></html>');
	var window = {};
	var entries = [{URL: location.href, State: null}];
	var frames = 0;
	var started = process.hrtime();

	/* A moment later, as a timer of the page: what it throws is told as an error of the page, not of Node. */
	function later (callback, delay) {
		return setTimeout(function () {
			try {
				callback();
			}
			catch (error) {
				window.reportError(error);
			}
		}, delay || 0);
	}

	document.defaultView = window;

	function assign (url) {
		var next = new URL(String(url), location.href);

		location.href = next.href;
	}

	window.document = document;
	window.location = location;
	location.assign = assign;
	location.replace = assign;
	location.reload = function () {};
	window.history = {
		get length () {
			return entries.length;
		},
		get state () {
			return entries[entries.length - 1].State;
		},
		pushState: function (state, title, url) {
			if (url !== undefined && url !== null)
				assign(url);

			entries.push({URL: location.href, State: state});
		},
		replaceState: function (state, title, url) {
			if (url !== undefined && url !== null)
				assign(url);

			entries[entries.length - 1] = {URL: location.href, State: state};
		},
		back: function () {},
		forward: function () {},
		go: function () {},
		scrollRestoration: 'auto'
	};
	window.navigator = {userAgent: 'Elemenx SSR', language: settings.Language || 'en', languages: [settings.Language || 'en'], onLine: true, platform: 'node', cookieEnabled: false, maxTouchPoints: 0, hardwareConcurrency: 1, clipboard: null, serviceWorker: undefined, mediaDevices: undefined};
	window.localStorage = Storage();
	window.sessionStorage = Storage();
	window.innerWidth = settings.Width || 1280;
	window.innerHeight = settings.Height || 800;
	window.outerWidth = window.innerWidth;
	window.outerHeight = window.innerHeight;
	window.devicePixelRatio = 1;
	window.screen = {width: window.innerWidth, height: window.innerHeight, availWidth: window.innerWidth, availHeight: window.innerHeight, orientation: {type: 'landscape-primary', angle: 0, addEventListener: function () {}}};
	window.scrollX = 0;
	window.scrollY = 0;
	window.pageXOffset = 0;
	window.pageYOffset = 0;
	window.name = '';
	window.origin = location.origin;
	window.isSecureContext = location.protocol === 'https:';
	window.Node = Node;
	window.Element = Element;
	window.HTMLElement = Element;
	window.SVGElement = Element;
	window.Text = Text;
	window.Comment = Comment;
	window.DocumentFragment = DocumentFragment;
	window.Document = Document;
	window.HTMLTemplateElement = Element;
	window.HTMLInputElement = Element;
	window.HTMLCanvasElement = Element;
	window.Event = Event;
	window.CustomEvent = Event;
	window.KeyboardEvent = Event;
	window.MouseEvent = Event;
	window.PointerEvent = Event;
	window.FocusEvent = Event;
	window.InputEvent = Event;
	window.UIEvent = Event;
	window.NodeFilter = {SHOW_ALL: 0xFFFFFFFF, SHOW_ELEMENT: 1, SHOW_TEXT: 4, SHOW_COMMENT: 128, FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3};
	window.MutationObserver = Observer();
	window.IntersectionObserver = Observer();
	window.ResizeObserver = Observer();
	window.PerformanceObserver = Observer();
	window.setTimeout = function (callback, delay) {
		var rest = Array.prototype.slice.call(arguments, 2);

		return later(function () {
			callback.apply(window, rest);
		}, delay);
	};
	window.clearTimeout = clearTimeout;
	window.setInterval = function (callback, delay) {
		return setInterval(function () {
			try {
				callback();
			}
			catch (error) {
				window.reportError(error);
			}
		}, delay);
	};
	window.clearInterval = clearInterval;
	window.queueMicrotask = queueMicrotask;
	window.requestAnimationFrame = function (callback) {
		frames++;

		return later(function () {
			callback(Date.now());
		}, 16);
	};
	window.cancelAnimationFrame = clearTimeout;
	window.requestIdleCallback = function (callback) {
		return later(function () {
			callback({didTimeout: false, timeRemaining: function () {
				return 50;
			}});
		}, 1);
	};
	window.cancelIdleCallback = clearTimeout;
	window.console = console;
	window.URL = URL;
	window.URLSearchParams = URLSearchParams;
	window.TextEncoder = TextEncoder;
	window.TextDecoder = TextDecoder;
	window.Blob = typeof Blob === 'undefined' ? function () {} : Blob;
	window.AbortController = AbortController;
	window.atob = function (text) {
		return Buffer.from(String(text), 'base64').toString('binary');
	};
	window.btoa = function (text) {
		return Buffer.from(String(text), 'binary').toString('base64');
	};
	window.structuredClone = typeof structuredClone === 'function' ? structuredClone : function (value) {
		return JSON.parse(JSON.stringify(value));
	};
	window.performance = {now: function () {
		var time = process.hrtime(started);

		return time[0] * 1000 + time[1] / 1e6;
	}, mark: function () {}, measure: function () {}, getEntriesByName: function () {
		return [];
	}};
	window.fetch = typeof fetch === 'function' ? fetch : undefined;
	window.matchMedia = function (query) {
		return {matches: false, media: String(query), addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {}, onchange: null};
	};
	window.getComputedStyle = function (element) {
		return element && element.style ? element.style : style(document.createElement('div'));
	};
	window.CSS = {supports: function () {
		return false;
	}, escape: function (text) {
		return String(text).replace(/([^\w-])/g, '\\$1');
	}};
	window.Image = function () {
		return document.createElement('img');
	};
	window.Audio = function () {
		return document.createElement('audio');
	};
	window.reportError = function (error) {
		if (settings.Report) settings.Report(error);
		else throw error;
	};
	window.Report = window.reportError;
	window.getSelection = document.getSelection;
	window.scrollTo = function () {};
	window.scrollBy = function () {};
	window.scroll = function () {};
	window.focus = function () {};
	window.blur = function () {};
	window.alert = function () {};
	window.confirm = function () {
		return false;
	};
	window.prompt = function () {
		return null;
	};
	window.open = function () {
		return null;
	};
	window.postMessage = function () {};
	window.Listeners = null;
	window.addEventListener = Node.prototype.addEventListener;
	window.removeEventListener = Node.prototype.removeEventListener;
	window.dispatchEvent = function (event) {
		event.target = window;

		(window.Listeners || []).filter(function (one) {
			return one.Type === event.type;
		}).forEach(function (one) {
			(typeof one.Listener === 'function' ? one.Listener : one.Listener.handleEvent).call(window, event);
		});

		return !event.defaultPrevented;
	};
	window.Frames = function () {
		return frames;
	};

	/* A request of the page: the text of its file, a moment later, as the network gives it. */
	window.XMLHttpRequest = function () {
		var request = this;
		var listeners = {};

		request.readyState = 0;
		request.status = 0;
		request.statusText = '';
		request.responseText = '';
		request.response = '';
		request.responseType = '';
		request.responseURL = '';
		request.timeout = 0;
		request.withCredentials = false;
		request.upload = {addEventListener: function () {}};
		request.onload = null;
		request.onerror = null;
		request.onreadystatechange = null;
		request.onloadend = null;
		request.ontimeout = null;
		request.onabort = null;

		function fire (name) {
			var event = new Event(name);

			event.target = request;

			if (typeof request['on' + name] === 'function')
				request['on' + name](event);

			(listeners[name] || []).forEach(function (listener) {
				listener.call(request, event);
			});
		}

		request.open = function (method, url) {
			request.Method = String(method).toUpperCase();
			request.URL = new URL(String(url), location.href).href;
			request.readyState = 1;
		};

		request.setRequestHeader = function () {};
		request.overrideMimeType = function () {};

		request.getResponseHeader = function (name) {
			return String(name).toLowerCase() === 'content-type' && request.Type ? request.Type : null;
		};

		request.getAllResponseHeaders = function () {
			return request.Type ? 'content-type: ' + request.Type + '\r\n' : '';
		};

		request.addEventListener = function (name, listener) {
			(listeners[name] = listeners[name] || []).push(listener);
		};

		request.removeEventListener = function (name, listener) {
			listeners[name] = (listeners[name] || []).filter(function (one) {
				return one !== listener;
			});
		};

		request.abort = function () {
			request.Aborted = true;
		};

		request.send = function () {
			(settings.Fetch || function (url, callback) {
				callback(new Error('No file for ' + url));
			})(request.URL, function (error, text, type) {
				later(function () {
					if (request.Aborted) return;

					request.readyState = 4;
					request.responseURL = request.URL;
					request.Type = type || '';

					if (error) {
						request.status = 404;
						request.statusText = 'Not Found';
						request.responseText = 'Not Found';
						request.response = request.responseText;

						fire('readystatechange');
						fire('load');
						fire('loadend');

						return;
					}

					request.status = 200;
					request.statusText = 'OK';
					request.responseText = typeof text === 'string' ? text : Buffer.from(text).toString('utf8');
					request.response = request.responseType === 'json' ? JSON.parse(request.responseText) : request.responseType === 'arraybuffer' ? new Uint8Array(Buffer.from(text)).buffer : request.responseText;

					fire('readystatechange');
					fire('load');
					fire('loadend');
				}, 0);
			});
		};
	};

	window.XMLHttpRequest.DONE = 4;

	/* A script with a src or a stylesheet put into the document: fetched and run (a stylesheet only told it loaded). */
	window.Connected = function (node) {
		(function walk (each) {
			if (each.nodeType !== 1) return;

			if (each.localName === 'script' && each.getAttribute('src') && !each.Ran) {
				each.Ran = true;

				(settings.Fetch || function (url, callback) {
					callback(new Error('No file for ' + url));
				})(new URL(each.getAttribute('src'), location.href).href, function (error, text) {
					later(function () {
						if (error) {
							each.dispatchEvent(new Event('error'));

							if (typeof each.onerror === 'function')
								each.onerror(new Event('error'));

							return;
						}

						document.currentScript = each;

						try {
							settings.Run(String(text), new URL(each.getAttribute('src'), location.href).href, each);
						}
						finally {
							document.currentScript = null;
						}

						if (typeof each.onload === 'function')
							each.onload(new Event('load'));

						each.dispatchEvent(new Event('load'));
					}, 0);
				});
			}
			else if (each.localName === 'link' && !each.Ran) {
				each.Ran = true;

				later(function () {
					if (typeof each.onload === 'function')
						each.onload(new Event('load'));

					each.dispatchEvent(new Event('load'));
				}, 0);
			}

			each.childNodes.forEach(walk);
		})(node);
	};

	window.window = window;
	window.self = window;
	window.top = window;
	window.parent = window;
	window.frames = window;
	window.globalThis = window;

	return window;
}

module.exports = {
	Document: documentOf,
	Window: Window,
	Parse: function (html, parent) {
		return parseInto(parent, String(html), parent);
	},
	Serialize: serialize,
	Node: Node,
	Element: Element,
	Event: Event
};
