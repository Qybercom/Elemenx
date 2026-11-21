package com.qybercom.elemenx

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.Annotator
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.util.TextRange
import com.intellij.psi.PsiElement
import com.intellij.psi.util.CachedValueProvider
import com.intellij.psi.util.CachedValuesManager
import com.intellij.psi.util.PsiModificationTracker
import org.jetbrains.plugins.textmate.api.TextMateBundleProvider
import java.util.regex.Pattern

/**
 * GLSL in the IDEs of JetBrains, of the one grammar of the extension of VS Code (editors/vscode/syntaxes/glsl.json, copied
 * into the plugin): its files (.glsl, .vert, .frag) through the TextMate bundles of the IDE, and the strings of shaders in
 * JavaScript, a line an item of an array as the Libraries write them, in the colors of its scopes (Settings → Editor →
 * Color Scheme → Elemenx).
 */
object ElemenxGlsl {
	val TEXT: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_TEXT", DefaultLanguageHighlighterColors.IDENTIFIER)
	val KEYWORD: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_KEYWORD", DefaultLanguageHighlighterColors.KEYWORD)
	val TYPE: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_TYPE", DefaultLanguageHighlighterColors.CLASS_REFERENCE)
	val FUNCTION: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_FUNCTION", DefaultLanguageHighlighterColors.FUNCTION_CALL)
	val BUILTIN: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_BUILTIN", DefaultLanguageHighlighterColors.PREDEFINED_SYMBOL)
	val NUMBER: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_NUMBER", DefaultLanguageHighlighterColors.NUMBER)
	val COMMENT: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_COMMENT", DefaultLanguageHighlighterColors.LINE_COMMENT)
	val PREPROCESSOR: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_PREPROCESSOR", DefaultLanguageHighlighterColors.METADATA)
	val OPERATOR: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_GLSL_OPERATOR", DefaultLanguageHighlighterColors.OPERATION_SIGN)

	/** The grammar in the plugin: where the bundle of TextMate takes it and the strings are colored of. */
	const val GRAMMAR = "/elemenx/textmate/glsl/syntaxes/glsl.json"

	/** A rule of the grammar: what it matches and the color of its scope. */
	class Rule(val pattern: Pattern, val key: TextAttributesKey?)

	/** The rules of the grammar, in its order: a match, or a begin and an end (a comment of a block) as one pattern. */
	val rules: List<Rule> by lazy {
		val text = ElemenxGlsl::class.java.getResourceAsStream(GRAMMAR)?.use { input -> input.bufferedReader().readText() } ?: return@lazy emptyList()

		JsonParser.parseString(text).asJsonObject.getAsJsonArray("patterns").map { each -> each.asJsonObject }.mapNotNull { rule: JsonObject ->
			val name = rule.get("name")?.asString ?: ""
			val source = when {
				rule.has("match") -> rule.get("match").asString
				rule.has("begin") && rule.has("end") -> rule.get("begin").asString + "[\\s\\S]*?(?:" + rule.get("end").asString + "|$)"
				else -> null
			} ?: return@mapNotNull null

			Rule(Pattern.compile(source, Pattern.MULTILINE), keyOf(name))
		}
	}

	/** The color of a scope of the grammar, by its start; none: the text of GLSL. */
	fun keyOf(scope: String): TextAttributesKey? = when {
		scope.startsWith("comment") -> COMMENT
		scope.startsWith("meta.preprocessor") -> PREPROCESSOR
		scope.startsWith("constant.numeric") -> NUMBER
		scope.startsWith("keyword.operator") -> OPERATOR
		scope.startsWith("keyword") || scope.startsWith("storage.modifier") || scope.startsWith("constant.language") -> KEYWORD
		scope.startsWith("storage.type") -> TYPE
		scope.startsWith("support.function") -> FUNCTION
		scope.startsWith("variable.language") -> BUILTIN
		else -> null
	}

	/**
	 * The text of a string of JavaScript as GLSL reads it: each escape (\t, \n, \', \\...) two spaces, so that its words
	 * part as they would and the places stay those of the source.
	 */
	fun unescaped(text: CharSequence): String {
		val out = StringBuilder(text)
		var i = 0

		while (i < out.length - 1) {
			if (out[i] == '\\') {
				out.setCharAt(i, ' ')
				out.setCharAt(i + 1, ' ')
				i += 2
			}
			else {
				i++
			}
		}

		return out.toString()
	}

	/** The colored pieces of a text of GLSL: [range, color], each where a rule matches first, as TextMate takes them. */
	fun tokens(text: CharSequence): List<Pair<TextRange, TextAttributesKey>> {
		val source = unescaped(text)
		val matchers = rules.map { rule -> rule.pattern.matcher(source) }
		val found = mutableListOf<Pair<TextRange, TextAttributesKey>>()
		var at = 0

		while (at < source.length) {
			var best = -1
			var start = Int.MAX_VALUE
			var end = 0

			matchers.forEachIndexed { index, matcher ->
				if (matcher.find(at) && matcher.start() < start && matcher.end() > matcher.start()) {
					best = index
					start = matcher.start()
					end = matcher.end()
				}
			}

			if (best < 0) break

			rules[best].key?.let { key -> found.add(TextRange(start, end) to key) }

			at = end
		}

		return found
	}

	/** A line that starts as GLSL does (a declaration, #version, a statement of main; in and out of a type): of an array of them, a shader. */
	private val line = Pattern.compile("^\\s*(#version|#define|precision |uniform |(?:flat +)?(?:in|out|inout) +(?:highp +|mediump +|lowp +)?(?:[biu]?vec|mat|float|int|uint|bool|sampler)|layout|void |[biu]?vec[234] |float |int |uint |mat[234] |sampler|bool |gl_|if \\(|for \\(|return |discard|const |struct )")

	/** A line that is GLSL alone, of no array round it. */
	private val alone = Pattern.compile("^\\s*(#version|precision |uniform |void main|layout\\s*\\()")

	fun startsAsGlsl(content: CharSequence): Boolean = line.matcher(unescaped(content)).find()

	fun aloneAsGlsl(content: CharSequence): Boolean = alone.matcher(unescaped(content)).find()
}

/**
 * The strings of shaders of JavaScript in the colors of GLSL: a string of an array of which two lines at least start as
 * GLSL does (the arrays of lines the Libraries join), or one that is GLSL alone (#version, uniform...). Registered for
 * JavaScript when the IDE has it (WebStorm, IntelliJ IDEA Ultimate, PhpStorm).
 */
class ElemenxGlslAnnotator : Annotator {
	override fun annotate(element: PsiElement, holder: AnnotationHolder) {
		if (element.firstChild != null || element.node.elementType.toString() != "JS:STRING_LITERAL") return

		val text = element.text

		if (text.length < 2 || (text[0] != '\'' && text[0] != '"')) return

		val content = text.substring(1, text.length - 1)

		if (!ElemenxGlsl.aloneAsGlsl(content) && !inShader(element)) return

		val start = element.textRange.startOffset + 1

		holder.newSilentAnnotation(HighlightSeverity.INFORMATION).range(TextRange(start, start + content.length)).textAttributes(ElemenxGlsl.TEXT).create()

		ElemenxGlsl.tokens(content).forEach { (range, key) ->
			holder.newSilentAnnotation(HighlightSeverity.INFORMATION).range(range.shiftRight(start)).textAttributes(key).create()
		}
	}

	/** The literal of the string is an item of an array of lines two of which at least start as GLSL. */
	private fun inShader(leaf: PsiElement): Boolean {
		val array = leaf.parent?.parent ?: return false

		if (!array.node.elementType.toString().contains("ARRAY_LITERAL")) return false

		return CachedValuesManager.getCachedValue(array) {
			val lines = array.children.count { item ->
				val text = item.text

				text.length >= 2 && (text[0] == '\'' || text[0] == '"') && ElemenxGlsl.startsAsGlsl(text.substring(1, text.length - 1))
			}

			CachedValueProvider.Result.create(lines >= 2, PsiModificationTracker.MODIFICATION_COUNT)
		}
	}
}

/** The grammar of GLSL as a bundle of TextMate: the IDE colors the files of GLSL of it (no other plugin of GLSL taking them). */
class ElemenxTextMateBundles : TextMateBundleProvider {
	override fun getBundles(): List<TextMateBundleProvider.PluginBundle> = listOf(TextMateBundleProvider.PluginBundle("GLSL of Elemenx", ElemenxServerFiles.folder().resolve("textmate/glsl")))
}
