package com.qybercom.elemenx

import com.intellij.lang.Language
import com.intellij.lang.html.HTMLLanguage
import com.intellij.lang.injection.MultiHostInjector
import com.intellij.lang.injection.MultiHostRegistrar
import com.intellij.psi.ElementManipulators
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiLanguageInjectionHost
import com.intellij.psi.xml.XmlAttribute
import com.intellij.psi.xml.XmlAttributeValue
import com.intellij.psi.xml.XmlText

/**
 * JavaScript in a template: the expressions of {{ }}, the values of the bindings, events and directives (*for="item of
 * Items" as the head of a loop of for); and HTML in the $Template of a definition. JavaScript is the one of the IDE
 * when it has it (WebStorm, IntelliJ IDEA Ultimate, PhpStorm): without it nothing is injected.
 */
class ElemenxInjector : MultiHostInjector {
	override fun getLanguagesToInject(registrar: MultiHostRegistrar, context: PsiElement) {
		val javascript = Language.findLanguageByID("JavaScript")

		when (context) {
			is XmlAttributeValue -> {
				val attribute = context.parent as? XmlAttribute ?: return
				val wrap = wrapping(attribute.name) ?: return
				val range = ElementManipulators.getValueTextRange(context)

				if (javascript == null || range.isEmpty) return

				registrar.startInjecting(javascript).addPlace(wrap.first, wrap.second, context as PsiLanguageInjectionHost, range).doneInjecting()
			}

			is XmlText -> {
				if (javascript == null) return

				ElemenxColors.interpolations(context.text).filter { range -> !range.isEmpty }.forEach { range ->
					registrar.startInjecting(javascript).addPlace("(", ");", context as PsiLanguageInjectionHost, range).doneInjecting()
				}
			}

			is PsiLanguageInjectionHost -> {
				if (!isTemplateString(context)) return

				registrar.startInjecting(HTMLLanguage.INSTANCE).addPlace(null, null, context, ElementManipulators.getValueTextRange(context)).doneInjecting()
			}
		}
	}

	override fun elementsToInjectIn(): List<Class<out PsiElement>> = listOf(XmlAttributeValue::class.java, XmlText::class.java, PsiLanguageInjectionHost::class.java)

	companion object {
		/** What a value is wrapped in to be JavaScript: an expression, or the head of a loop (*for). */
		fun wrapping(name: String): Pair<String, String>? = when {
			name == "*for" -> "for (var " to ") {}"
			ElemenxInspectionSuppressor.isBinding(name) -> "(" to ");"
			else -> null
		}

		/** A string of JavaScript that is the $Template of a definition: `$Template: '<div>...</div>'`. */
		fun isTemplateString(host: PsiElement): Boolean {
			val language = host.language.id

			if (!language.contains("JavaScript", true) && !language.contains("ECMAScript", true) && !language.contains("TypeScript", true)) return false

			return host.parent?.text?.trimStart()?.startsWith("\$Template") == true
		}
	}
}
