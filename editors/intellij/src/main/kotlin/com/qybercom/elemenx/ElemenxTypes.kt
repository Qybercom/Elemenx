package com.qybercom.elemenx

/**
 * The values of a definition of a Component, read from its source (not run): their kinds and, for an object, its keys
 * with their places. A value tells its type in JSDoc: string, number, boolean, Array<T> (the type of its first item),
 * a record {Name: T} of its keys, function(*, *) of its parameters, * for anything else. A JSDoc @type above a key
 * (`/** @type {{Name: string}[]} */ Items: []`) is the type of that key instead.
 */
object ElemenxTypes {
	private val identifier = Regex("^[A-Za-z_$][\\w$]*$")

	/** A key of an object: where its name is, the JSDoc type written above it, its value. */
	data class Field(val name: String, val offset: Int, val doc: String?, val value: Value)

	/** A value: its kind (string, number, boolean, null, array, object, function, other), its keys, first item, parameters. */
	data class Value(val kind: String, val start: Int, val end: Int, val fields: List<Field> = emptyList(), val item: Value? = null, val parameters: List<String> = emptyList()) {
		fun field(name: String): Field? = fields.firstOrNull { field -> field.name == name }
	}

	/** The type of a key: its own JSDoc, else the one of its value. */
	fun typeOf(field: Field): String = field.doc ?: typeOf(field.value, 0)

	fun typeOf(value: Value, depth: Int): String = when (value.kind) {
		"string" -> "string"
		"number" -> "number"
		"boolean" -> "boolean"
		"array" -> value.item?.let { item -> "Array<" + typeOf(item, depth + 1) + ">" } ?: "Array"
		"function" -> "function(" + value.parameters.joinToString(", ") { "*" } + ")"
		"object" -> {
			val named = value.fields.filter { field -> identifier.matches(field.name) }

			if (named.isEmpty() || depth > 4) "Object" else "{" + named.joinToString(", ") { field -> field.name + ": " + (field.doc ?: typeOf(field.value, depth + 1)) } + "}"
		}
		else -> "*"
	}

	/** The value that starts at (or after the spaces and comments from) position. */
	fun parse(source: String, position: Int): Value {
		val at = skip(source, position)

		if (at >= source.length) return Value("other", at, at)

		val char = source[at]

		return when {
			char == '\'' || char == '"' || char == '`' -> Value("string", at, stringEnd(source, at) + 1)
			char.isDigit() || (char == '-' && at + 1 < source.length && source[at + 1].isDigit()) -> Value("number", at, Regex("-?[\\d.eExXa-fA-F_]+").find(source, at)!!.range.last + 1)
			char == '[' -> array(source, at)
			char == '{' -> objectAt(source, at)
			word(source, at, "true") || word(source, at, "false") -> Value("boolean", at, at + (if (word(source, at, "true")) 4 else 5))
			word(source, at, "null") || word(source, at, "undefined") -> Value("null", at, at + (if (word(source, at, "null")) 4 else 9))
			word(source, at, "function") -> function(source, at)
			else -> Value("other", at, expressionEnd(source, at))
		}
	}

	/** An object literal from its {: its keys, each with the JSDoc type above it. */
	fun objectAt(source: String, open: Int): Value {
		val fields = mutableListOf<Field>()
		var at = open + 1

		while (at < source.length) {
			val from = at
			val doc = docBefore(source, at)

			at = skip(source, at)

			if (at >= source.length || source[at] == '}') break

			val quoted = source[at] == '\'' || source[at] == '"'
			val nameEnd = if (quoted) stringEnd(source, at) + 1 else (Regex("[\\w$]*").find(source, at)!!.range.last + 1)
			val name = if (quoted) source.substring(at + 1, nameEnd - 1) else source.substring(at, nameEnd)

			if (nameEnd == at) {
				at = expressionEnd(source, at)
			}
			else {
				var colon = skip(source, nameEnd)

				if (colon < source.length && source[colon] == ':') {
					val value = parse(source, colon + 1)

					fields.add(Field(name, at, doc, value))
					colon = value.end
				}

				at = expressionEnd(source, colon)
			}

			if (at < source.length && source[at] == ',') at++

			/* What is no key (a ] or a ) out of place): past it, never in place. */
			if (at <= from) at = from + 1
		}

		return Value("object", open, (at + 1).coerceAtMost(source.length), fields)
	}

	private fun array(source: String, open: Int): Value {
		val first = skip(source, open + 1)
		val item = if (first < source.length && source[first] != ']') parse(source, first) else null
		val end = closing(source, open)

		return Value("array", open, end, item = item)
	}

	private fun function(source: String, at: Int): Value {
		val open = source.indexOf('(', at)
		val close = if (open < 0) -1 else source.indexOf(')', open)
		val parameters = if (open < 0 || close < 0) emptyList() else source.substring(open + 1, close).split(',').map { each -> each.trim() }.filter { each -> each.isNotEmpty() }
		val body = if (close < 0) -1 else source.indexOf('{', close)

		return Value("function", at, if (body < 0) source.length else closing(source, body), parameters = parameters)
	}

	/** The JSDoc @type of the comment just above a position (only spaces between), or null. */
	private fun docBefore(source: String, position: Int): String? {
		val at = skipSpaces(source, position)

		if (!source.startsWith("/**", at)) return null

		val end = source.indexOf("*/", at)

		if (end < 0) return null

		return braced(source.substring(at, end), "@type")
	}

	/** The type in braces after a tag of JSDoc ({...}, its braces nested), or null. */
	fun braced(comment: String, tag: String): String? {
		val tagged = comment.indexOf(tag)
		val open = if (tagged < 0) -1 else comment.indexOf('{', tagged)

		if (open < 0) return null

		var depth = 0

		for (at in open until comment.length) {
			if (comment[at] == '{') depth++

			if (comment[at] == '}') {
				depth--

				if (depth == 0) return comment.substring(open + 1, at).trim()
			}
		}

		return null
	}

	/** The end of an expression: the , or the closing bracket at its own depth (not inside). */
	fun expressionEnd(source: String, position: Int): Int {
		var at = position
		var depth = 0

		while (at < source.length) {
			val char = source[at]

			when {
				char == '/' && source.startsWith("//", at) -> at = source.indexOf('\n', at).let { if (it < 0) source.length else it }
				char == '/' && source.startsWith("/*", at) -> at = source.indexOf("*/", at + 2).let { if (it < 0) source.length else it + 1 }
				char == '\'' || char == '"' || char == '`' -> at = stringEnd(source, at)
				char == '{' || char == '[' || char == '(' -> depth++
				char == '}' || char == ']' || char == ')' -> {
					if (depth == 0) return at

					depth--
				}
				(char == ',' || char == ';') && depth == 0 -> return at
			}

			at++
		}

		return source.length
	}

	/** Past the bracket that closes the one at open (the statements of a body between them: their ; and , are inside). */
	fun closing(source: String, open: Int): Int {
		var at = open + 1
		var depth = 1

		while (at < source.length) {
			val char = source[at]

			when {
				char == '/' && source.startsWith("//", at) -> at = source.indexOf('\n', at).let { if (it < 0) source.length else it }
				char == '/' && source.startsWith("/*", at) -> at = source.indexOf("*/", at + 2).let { if (it < 0) source.length else it + 1 }
				char == '\'' || char == '"' || char == '`' -> at = stringEnd(source, at)
				char == '{' || char == '[' || char == '(' -> depth++
				char == '}' || char == ']' || char == ')' -> {
					depth--

					if (depth == 0) return at + 1
				}
			}

			at++
		}

		return source.length
	}

	/** The position of the closing quote of the string that opens at start. */
	fun stringEnd(source: String, start: Int): Int {
		val quote = source[start]
		var at = start + 1

		while (at < source.length && source[at] != quote) {
			if (source[at] == '\\') at++

			at++
		}

		return at
	}

	/** Past spaces and comments. */
	private fun skip(source: String, position: Int): Int {
		var at = position

		while (at < source.length) {
			when {
				source[at].isWhitespace() -> at++
				source.startsWith("//", at) -> at = source.indexOf('\n', at).let { if (it < 0) source.length else it + 1 }
				source.startsWith("/*", at) -> at = source.indexOf("*/", at + 2).let { if (it < 0) source.length else it + 2 }
				else -> return at
			}
		}

		return at
	}

	private fun skipSpaces(source: String, position: Int): Int {
		var at = position

		while (at < source.length && source[at].isWhitespace()) at++

		return at
	}

	private fun word(source: String, at: Int, name: String): Boolean = source.startsWith(name, at) && (at + name.length >= source.length || !(source[at + name.length].isLetterOrDigit() || source[at + name.length] == '_' || source[at + name.length] == '$'))
}
