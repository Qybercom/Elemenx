package com.qybercom.elemenx

import com.intellij.codeInspection.InspectionSuppressor
import com.intellij.codeInspection.SuppressQuickFix
import com.intellij.psi.PsiElement
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.xml.XmlAttribute
import com.intellij.psi.xml.XmlTag
import com.intellij.xml.util.XmlTagUtil

/**
 * The inspections of HTML of the IDE know no Component of Elemenx: they would mark `<CallStage>` an unknown tag and
 * `[layout]`, `(click)` or `*if` unknown attributes. They are kept quiet there; the language server of Elemenx marks
 * the Components, props, events and directives that are truly unknown.
 */
class ElemenxInspectionSuppressor : InspectionSuppressor {
	override fun isSuppressedFor(element: PsiElement, toolId: String): Boolean {
		if (toolId !in quieted && !isRuleOfHtml(toolId)) return false

		val attribute = PsiTreeUtil.getParentOfType(element, XmlAttribute::class.java, false)

		if (toolId in quieted && attribute != null && isBinding(attribute.name)) return true

		val tag = (attribute?.parent) ?: PsiTreeUtil.getParentOfType(element, XmlTag::class.java, false) ?: return false

		return isComponent(tag)
	}

	override fun getSuppressActions(element: PsiElement?, toolId: String): Array<SuppressQuickFix> = SuppressQuickFix.EMPTY_ARRAY

	companion object {
		/** The inspections of unknown tags and attributes, of HTML and of XML, and of an empty tag (<CallTile />: a Component closes itself). */
		val quieted = setOf("HtmlUnknownTag", "HtmlUnknownAttribute", "HtmlUnknownBooleanAttribute", "XmlUnboundNsPrefix", "CheckTagEmptyBody", "HtmlExtraClosingTag", "CheckEmptyScriptTag")

		/**
		 * A rule of an element of HTML, which a Component of its name does not follow: an Input needs no label (regression:
		 * HtmlFormInputWithoutLabel marked every <Input>), an Image no alt, a Table no headers.
		 */
		fun isRuleOfHtml(toolId: String): Boolean = toolId.startsWith("Html") || toolId in setOf("RequiredAttributes", "CheckImageSize", "CheckValidXmlInScriptTagBody", "XmlDeprecatedElement")

		/** A binding of a template: [prop], (event), *directive, or a reference #name (this.$Ref). */
		fun isBinding(name: String): Boolean = name.startsWith("[") || name.startsWith("(") || name.startsWith("*") || name.startsWith("#")

		/** A Component: its name as it is written starts with a capital (HTML keeps the case of the source, not of the DOM). */
		fun isComponent(tag: XmlTag): Boolean {
			val name = XmlTagUtil.getStartTagNameElement(tag)?.text ?: tag.name

			return name.isNotEmpty() && name[0].isUpperCase()
		}
	}
}
