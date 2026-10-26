package com.qybercom.elemenx

import com.intellij.codeInsight.daemon.impl.HighlightInfo
import com.intellij.codeInspection.htmlInspections.HtmlExtraClosingTagInspection
import com.intellij.codeInspection.htmlInspections.HtmlUnknownAttributeInspection
import com.intellij.codeInspection.htmlInspections.HtmlUnknownTagInspection
import com.intellij.codeInspection.htmlInspections.RequiredAttributesInspection
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.psi.xml.XmlTag
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.xml.util.CheckEmptyTagInspection

/**
 * A Component named as a tag of HTML (Input, Select, Option, Image, Form): its own element, not the one of HTML, whose
 * rules (an input that is empty, an img that needs alt, the attributes of select) are not the ones of the Component.
 */
class ElemenxComponentDescriptorTest : BasePlatformTestCase() {
	private fun problems(text: String): List<String> {
		myFixture.enableInspections(HtmlUnknownTagInspection(), HtmlUnknownAttributeInspection(), CheckEmptyTagInspection(), HtmlExtraClosingTagInspection(), RequiredAttributesInspection())
		myFixture.configureByText("Template.html", text)

		return myFixture.doHighlighting().filter { info: HighlightInfo -> info.severity.myVal >= HighlightSeverity.WEAK_WARNING.myVal }.map { info -> info.text + ": " + info.description }
	}

	fun testComponentsNamedAsTagsOfHtmlTakeNoneOfTheirRules() {
		val found = problems("<Form Title=\"Sign in\">\n\t<Input Label=\"Name\" #Field [value]=\"Name\"></Input>\n\t<Select Label=\"Plan\" [options]=\"Plans\"><span>x</span></Select>\n\t<Image Src=\"a.png\" Fit=\"cover\" />\n\t<Option Label=\"One\" />\n</Form>\n")

		assertEquals(emptyList<String>(), found)
	}

	fun testTheTagsOfHtmlKeepTheirRules() {
		val found = problems("<form>\n\t<input type=\"text\"></input>\n</form>\n")

		assertTrue(found.toString(), found.any { it.startsWith("</input>") })
	}

	fun testAComponentHasADescriptorOfItsOwn() {
		myFixture.configureByText("Template.html", "<Input Label=\"Name\" />\n<input type=\"text\" />\n")

		val tags = PsiTreeUtil.findChildrenOfType(myFixture.file, XmlTag::class.java).toList()

		assertTrue(tags[0].descriptor is ElemenxComponentDescriptor)
		assertFalse(tags[1].descriptor is ElemenxComponentDescriptor)
	}
}
