package com.qybercom.elemenx

import com.intellij.lang.Language
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import java.nio.file.Files

/**
 * GLSL in the IDEs of JetBrains: the grammar of VS Code read for its colors, the strings of shaders of JavaScript colored
 * of it, its files a bundle of TextMate. Regression: the plugin of IntelliJ had no GLSL at all, the one of VS Code did.
 */
class ElemenxGlslTest : BasePlatformTestCase() {
	private fun named(text: String): List<String> = ElemenxGlsl.tokens(text).map { (range, key) ->
		key.externalName.removePrefix("ELEMENX_GLSL_").lowercase() + " " + range.substring(text)
	}

	fun testItsColorsAreOfTheGrammarOfVsCode() {
		assertTrue(ElemenxGlsl.rules.size >= 10)
		assertEquals(listOf("keyword uniform", "type vec3"), named("uniform vec3 uSun;"))
		assertEquals(listOf("type float", "operator =", "function smoothstep", "number 0.2", "number 1.0", "builtin gl_FragCoord", "comment // the edge"), named("float t = smoothstep(0.2, 1.0, gl_FragCoord.x); // the edge"))
		assertEquals(listOf("preprocessor #version 300 es"), named("#version 300 es"))
	}

	/* An escape of the string of JavaScript (\t) is space: the word after it is a word ('\tfloat' read 'tfloat' before). */
	fun testTheEscapesOfTheStringPartItsWords() {
		assertEquals("  float a;", ElemenxGlsl.unescaped("\\tfloat a;"))
		assertEquals(listOf("keyword return", "number 1.0"), named("\\t\\treturn 1.0;"))
		assertTrue(ElemenxGlsl.startsAsGlsl("\\t\\tvec3 sky = uAir.rgb;"))
		assertFalse(ElemenxGlsl.startsAsGlsl("in a minute"))
		assertTrue(ElemenxGlsl.startsAsGlsl("flat in vec4 vColor;"))
		assertTrue(ElemenxGlsl.aloneAsGlsl("uniform float uTime;"))
		assertFalse(ElemenxGlsl.aloneAsGlsl("float x = 1.0;"))
	}

	/* The strings of an array of lines of GLSL in its colors; a string of words beside it in none (JavaScript of the IDE only). */
	fun testTheStringsOfAShaderInJavaScriptAreColored() {
		if (Language.findLanguageByID("JavaScript") == null) return

		myFixture.configureByText("Shader.js", "var shader = [\n\t'uniform vec3 uSun;',\n\t'void main() {',\n\t'\\tgl_FragColor = vec4(uSun, 1.0);',\n\t'}'\n].join('\\n');\nvar words = ['in a minute', 'out of time'];\n")

		val found = myFixture.doHighlighting().filter { info -> info.forcedTextAttributesKey?.externalName?.startsWith("ELEMENX_GLSL_") == true && info.forcedTextAttributesKey != ElemenxGlsl.TEXT && info.forcedTextAttributesKey != ElemenxGlsl.OPERATOR }.sortedBy { info -> info.startOffset }.map { info -> info.forcedTextAttributesKey!!.externalName.removePrefix("ELEMENX_GLSL_").lowercase() + " " + info.text }

		assertEquals(listOf("keyword uniform", "type vec3", "type void", "builtin gl_FragColor", "type vec4", "number 1.0"), found)
	}

	/* Its grammar copied out with the server: the bundle of TextMate of its files (package.json beside it). */
	fun testItsFilesAreABundleOfTextMate() {
		val folder = ElemenxServerFiles.folder().resolve("textmate/glsl")

		assertTrue(Files.isRegularFile(folder.resolve("package.json")))
		assertTrue(Files.readString(folder.resolve("syntaxes/glsl.json")).contains("\"scopeName\": \"source.glsl\""))
		assertEquals(folder, ElemenxTextMateBundles().getBundles()[0].path)
	}
}
