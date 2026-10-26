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
 * when it has it (WebStorm, IntelliJ IDEA Ultimate, PhpStorm): without it nothing is injected. An expression is the body
 * of a function whose parameters are the names of the template (ElemenxScope): its names resolve to the Component.
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

				val scope = scoped(ElemenxScope.typedNames(context))

				registrar.startInjecting(javascript).addPlace(scope + wrap.first, wrap.second + " });", context as PsiLanguageInjectionHost, range).doneInjecting()
			}

			is XmlText -> {
				if (javascript == null) return

				val ranges = ElemenxColors.interpolations(context.text).filter { range -> !range.isEmpty }
				val scope = if (ranges.isEmpty()) "" else scoped(ElemenxScope.typedNames(context))

				ranges.forEach { range ->
					registrar.startInjecting(javascript).addPlace(scope + "return (", "); });", context as PsiLanguageInjectionHost, range).doneInjecting()
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
		/**
		 * The head of the function an expression is the body of: its parameters are the names of the template, its JSDoc
		 * their types (ElemenxGotoDeclaration goes from a name, or a key of one, to its member).
		 */
		fun scoped(names: List<ElemenxScope.Name>): String {
			val types = names.filter { each -> each.type != null }.joinToString("") { each -> " * @param {" + each.type + "} " + each.name + "\n" }

			return "(/**\n" + types + " */ function (" + names.joinToString(", ") { each -> each.name } + ") { "
		}

		/** What a value is wrapped in to be JavaScript: an expression the function returns (no statement of nothing: the JavaScript of the IDE marks one), or the head of a loop (*for). */
		fun wrapping(name: String): Pair<String, String>? = when {
			name == "*for" -> "for (var " to ") {}"
			ElemenxInspectionSuppressor.isBinding(name) -> "return (" to ");"
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
