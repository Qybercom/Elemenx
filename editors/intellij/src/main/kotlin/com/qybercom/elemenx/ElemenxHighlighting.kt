package com.qybercom.elemenx

import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.Annotator
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.lang.html.HTMLLanguage
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighter
import com.intellij.openapi.fileTypes.SyntaxHighlighterFactory
import com.intellij.openapi.options.colors.AttributesDescriptor
import com.intellij.openapi.options.colors.ColorDescriptor
import com.intellij.openapi.options.colors.ColorSettingsPage
import com.intellij.openapi.util.TextRange
import com.intellij.psi.PsiElement
import com.intellij.psi.xml.XmlAttribute
import com.intellij.psi.xml.XmlTag
import com.intellij.psi.xml.XmlText
import com.intellij.xml.util.XmlTagUtil
import javax.swing.Icon

/** The colors of a template of Elemenx, of the ones of the theme by default; Settings → Editor → Color Scheme → Elemenx changes them. */
object ElemenxColors {
	val COMPONENT: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_COMPONENT", DefaultLanguageHighlighterColors.CLASS_NAME)
	val BINDING: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_BINDING", DefaultLanguageHighlighterColors.INSTANCE_FIELD)
	val EVENT: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_EVENT", DefaultLanguageHighlighterColors.FUNCTION_DECLARATION)
	val DIRECTIVE: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_DIRECTIVE", DefaultLanguageHighlighterColors.KEYWORD)
	val INTERPOLATION: TextAttributesKey = TextAttributesKey.createTextAttributesKey("ELEMENX_INTERPOLATION", DefaultLanguageHighlighterColors.BRACES)

	/** The color of an attribute: a binding [prop], an event (event), a directive *directive, or none. */
	fun ofAttribute(name: String): TextAttributesKey? = when {
		name.startsWith("[") -> BINDING
		name.startsWith("(") -> EVENT
		name.startsWith("*") -> DIRECTIVE
		else -> null
	}

	/** The places of the {{ }} of a text: the ranges of the expressions inside them, from the start of the text. */
	fun interpolations(text: CharSequence): List<TextRange> {
		val ranges = mutableListOf<TextRange>()
		var at = 0

		while (true) {
			val open = text.indexOf("{{", at)

			if (open < 0) break

			val close = text.indexOf("}}", open + 2)

			if (close < 0) break

			ranges.add(TextRange(open + 2, close))
			at = close + 2
		}

		return ranges
	}
}

/** The Components, bindings, events, directives and {{ }} of a template, in their colors. */
class ElemenxAnnotator : Annotator {
	override fun annotate(element: PsiElement, holder: AnnotationHolder) {
		when (element) {
			is XmlTag -> {
				if (!ElemenxInspectionSuppressor.isComponent(element)) return

				listOfNotNull(XmlTagUtil.getStartTagNameElement(element), XmlTagUtil.getEndTagNameElement(element)).forEach { name ->
					holder.newSilentAnnotation(HighlightSeverity.INFORMATION).range(name).textAttributes(ElemenxColors.COMPONENT).create()
				}
			}

			is XmlAttribute -> {
				val key = ElemenxColors.ofAttribute(element.name) ?: return

				holder.newSilentAnnotation(HighlightSeverity.INFORMATION).range(element.nameElement).textAttributes(key).create()
			}

			is XmlText -> {
				val start = element.textRange.startOffset

				ElemenxColors.interpolations(element.text).forEach { range ->
					holder.newSilentAnnotation(HighlightSeverity.INFORMATION).range(TextRange(start + range.startOffset - 2, start + range.startOffset)).textAttributes(ElemenxColors.INTERPOLATION).create()
					holder.newSilentAnnotation(HighlightSeverity.INFORMATION).range(TextRange(start + range.endOffset, start + range.endOffset + 2)).textAttributes(ElemenxColors.INTERPOLATION).create()
				}
			}
		}
	}
}

/** Settings → Editor → Color Scheme → Elemenx. */
class ElemenxColorSettingsPage : ColorSettingsPage {
	private val descriptors = arrayOf(
		AttributesDescriptor("Component", ElemenxColors.COMPONENT),
		AttributesDescriptor("Binding [prop]", ElemenxColors.BINDING),
		AttributesDescriptor("Event (event)", ElemenxColors.EVENT),
		AttributesDescriptor("Directive *directive", ElemenxColors.DIRECTIVE),
		AttributesDescriptor("Interpolation {{ }}", ElemenxColors.INTERPOLATION)
	)

	override fun getDisplayName(): String = "Elemenx"

	override fun getIcon(): Icon? = null

	override fun getHighlighter(): SyntaxHighlighter = SyntaxHighlighterFactory.getSyntaxHighlighter(HTMLLanguage.INSTANCE, null, null)

	override fun getDemoText(): String = """
		<div class="stage">
			<<component>CallStage</component> <binding>[layout]</binding>="Layout" Side="true" <event>(corner)</event>="Moved">
				<<component>CallTile</component> slot="main" <directive>*if</directive>="Shown" Name="Ada" />
				<span <directive>*for</directive>="item of Items"><interpolation>{{</interpolation> item.Name <interpolation>}}</interpolation></span>
			</<component>CallStage</component>>
		</div>
	""".trimIndent()

	override fun getAdditionalHighlightingTagToDescriptorMap(): Map<String, TextAttributesKey> = mapOf(
		"component" to ElemenxColors.COMPONENT,
		"binding" to ElemenxColors.BINDING,
		"event" to ElemenxColors.EVENT,
		"directive" to ElemenxColors.DIRECTIVE,
		"interpolation" to ElemenxColors.INTERPOLATION
	)

	override fun getAttributeDescriptors(): Array<AttributesDescriptor> = descriptors

	override fun getColorDescriptors(): Array<ColorDescriptor> = ColorDescriptor.EMPTY_ARRAY
}
