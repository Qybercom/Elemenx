package com.qybercom.elemenx

import com.intellij.codeInsight.navigation.actions.GotoDeclarationHandler
import com.intellij.lang.injection.InjectedLanguageManager
import com.intellij.navigation.DirectNavigationProvider
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiManager
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.xml.XmlAttributeValue
import com.intellij.psi.xml.XmlTag
import com.intellij.psi.xml.XmlText

/**
 * Ctrl+click on a name of an expression of a template, or on a key of one (CallState.Muted), goes to the member of its
 * Component that declares it (the key of its definition, or the line of its code that sets it), and on a variable of a
 * loop to its *for: the JavaScript of the IDE would go to the parameter of the function the expression is wrapped in
 * (ElemenxScope), which is not in the file.
 */
class ElemenxGotoDeclaration : GotoDeclarationHandler {
	override fun getGotoDeclarationTargets(sourceElement: PsiElement?, offset: Int, editor: Editor?): Array<PsiElement>? {
		val source = sourceElement ?: return null
		val manager = InjectedLanguageManager.getInstance(source.project)
		/*
		 * The element of the injected JavaScript, or the one of the page where it is injected: Ctrl+click gives the one
		 * of the editor of the page (regression: the handler took only the injected one, and no name went anywhere).
		 */
		val element = if (manager.isInjectedFragment(source.containingFile)) source else manager.findInjectedElementAt(source.containingFile, offset) ?: return null
		val host = manager.getInjectionHost(element) ?: return null

		if ((host !is XmlText && host !is XmlAttributeValue) || !element.containingFile.text.startsWith("(/**")) return null

		/* The path of keys that ends at the name: CallState.Muted for Muted, Title for Title. */
		val before = element.containingFile.text.substring(0, element.textRange.endOffset)
		val path = Regex("([A-Za-z_$][\\w$]*(?:\\s*\\.\\s*[A-Za-z_$][\\w$]*)*)$").find(before)?.groupValues?.get(1)?.split('.')?.map { key -> key.trim() } ?: return null

		/* A variable of a loop goes to the *for that declares it: the item of a row comes before the fields of its Component. */
		loop(host, path.first())?.let { target -> return arrayOf(target) }

		val owner = ElemenxScope.owner(host) ?: return null
		val at = ElemenxScope.offsetOf(owner, path) ?: return null
		val file = PsiManager.getInstance(element.project).findFile(owner.file) ?: return null

		return file.findElementAt(at)?.let { target -> arrayOf(target) }
	}

	/** The name in the *for of a tag around the host that declares a variable of that name, or null. */
	private fun loop(host: PsiElement, name: String): PsiElement? {
		var tag = PsiTreeUtil.getParentOfType(host, XmlTag::class.java, false)

		while (tag != null) {
			val value = tag.getAttribute("*for")?.valueElement

			if (value != null && name in ElemenxScope.loopVariables(value.value)) {
				val at = Regex("(?<![\\w$])" + Regex.escape(name) + "(?![\\w$])").find(value.text)?.range?.first ?: return null
				val offset = value.textRange.startOffset + at

				return InjectedLanguageManager.getInstance(host.project).findInjectedElementAt(value.containingFile, offset) ?: value.containingFile.findElementAt(offset)
			}

			tag = tag.parentTag
		}

		return null
	}
}

/**
 * Ctrl+click and Go to Declaration (GotoDeclarationOrUsageHandler2) ask this first, in the injected JavaScript, before
 * its references: a name of an expression goes to its member, not to the parameter of the function its expression is
 * wrapped in (regression: they went to that parameter, which is not in the file, so a click went nowhere; the
 * GotoDeclarationHandler alone is not asked on that path).
 */
class ElemenxDirectNavigation : DirectNavigationProvider {
	override fun getNavigationElement(element: PsiElement): PsiElement? = ElemenxGotoDeclaration().getGotoDeclarationTargets(element, element.textRange.startOffset, null)?.firstOrNull()
}
