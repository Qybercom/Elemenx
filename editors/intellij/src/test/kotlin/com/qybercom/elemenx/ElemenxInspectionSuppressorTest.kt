package com.qybercom.elemenx

import com.intellij.codeInsight.daemon.impl.HighlightInfo
import com.intellij.codeInspection.htmlInspections.HtmlUnknownAttributeInspection
import com.intellij.codeInspection.htmlInspections.HtmlUnknownTagInspection
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.xml.util.CheckEmptyTagInspection

/** The inspections of HTML on a template of Elemenx: quiet on its Components and bindings, as before on the rest. */
class ElemenxInspectionSuppressorTest : BasePlatformTestCase() {
	private fun warnings(text: String): List<String> {
		myFixture.enableInspections(HtmlUnknownTagInspection(), HtmlUnknownAttributeInspection(), CheckEmptyTagInspection())
		myFixture.configureByText("Template.html", text)

		return myFixture.doHighlighting().filter { info: HighlightInfo -> info.severity.myVal >= HighlightSeverity.WEAK_WARNING.myVal }.map { info -> info.text }
	}

	fun testComponentsAndBindingsAreNotUnknown() {
		val found = warnings("<div class=\"stage\">\n\t<CallStage [layout]=\"Layout\" Side=\"true\" (corner)=\"Moved\">\n\t\t<CallTile slot=\"main\" *if=\"Shown\" Name=\"Ada\" />\n\t\t<span *for=\"item of Items\" [class.on]=\"item.On\" (click)=\"Picked\">{{item.Name}}</span>\n\t</CallStage>\n</div>\n")

		assertEquals(emptyList<String>(), found)
	}

	fun testOtherUnknownTagsAndAttributesAreStillMarked() {
		val found = warnings("<div>\n\t<frobnicate>x</frobnicate>\n\t<span wobble=\"1\">y</span>\n</div>\n")

		assertTrue(found.toString(), found.contains("frobnicate"))
		assertTrue(found.toString(), found.contains("wobble"))
	}

	fun testAComponentClosesItselfAPlainTagDoesNot() {
		val found = warnings("<div>\n\t<CallTile slot=\"main\" Name=\"Ada\" />\n\t<span />\n</div>\n")

		assertEquals(found.toString(), listOf("<span />"), found)
	}
}
