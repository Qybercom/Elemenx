package com.qybercom.elemenx

import com.intellij.openapi.util.TextRange
import com.intellij.testFramework.fixtures.BasePlatformTestCase

/** The colors of a template: its Components, bindings, events, directives and {{ }}; the rest as HTML colors it. */
class ElemenxHighlightingTest : BasePlatformTestCase() {
	fun testTheTemplateTakesTheColorsOfElemenx() {
		val keys = mapOf(ElemenxColors.COMPONENT to "component", ElemenxColors.BINDING to "binding", ElemenxColors.EVENT to "event", ElemenxColors.DIRECTIVE to "directive", ElemenxColors.INTERPOLATION to "interpolation")

		myFixture.configureByText("Template.html", "<div class=\"stage\">\n\t<CallStage [layout]=\"Layout\" Side=\"true\" (corner)=\"Moved\">\n\t\t<CallTile slot=\"main\" *if=\"Shown\" />\n\t\t<span *for=\"item of Items\">{{ item.Name }}</span>\n\t</CallStage>\n</div>\n")

		val found = myFixture.doHighlighting().filter { info -> keys.containsKey(info.forcedTextAttributesKey) }.sortedBy { info -> info.startOffset }.map { info -> keys[info.forcedTextAttributesKey] + " " + info.text }

		assertEquals(listOf("component CallStage", "binding [layout]", "event (corner)", "component CallTile", "directive *if", "directive *for", "interpolation {{", "interpolation }}", "component CallStage"), found)
	}

	fun testTheExpressionsAndTheirWrapping() {
		assertEquals(listOf(TextRange(2, 13), TextRange(22, 23)), ElemenxColors.interpolations("{{ item.Name }} and {{x}} and {{ unclosed"))
		assertEquals("for (var " to ") {}", ElemenxInjector.wrapping("*for"))
		assertEquals("(" to ");", ElemenxInjector.wrapping("[layout]"))
		assertEquals("(" to ");", ElemenxInjector.wrapping("(click)"))
		assertNull(ElemenxInjector.wrapping("class"))
		assertNull(ElemenxColors.ofAttribute("slot"))
	}
}
