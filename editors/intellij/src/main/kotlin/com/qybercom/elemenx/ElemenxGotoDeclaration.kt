package com.qybercom.elemenx

import com.intellij.codeInsight.navigation.actions.GotoDeclarationHandler
import com.intellij.lang.injection.InjectedLanguageManager
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiManager
import com.intellij.psi.xml.XmlAttributeValue
import com.intellij.psi.xml.XmlText

/**
 * Ctrl+click on a name of an expression of a template, or on a key of one (CallState.Muted), goes to the member of its Component that declares it (the key of
 * its definition, or the line of its code that sets it): the JavaScript of the IDE would go to the parameter of the
 * function the expression is wrapped in (ElemenxScope), which is not in the file.
 */
class ElemenxGotoDeclaration : GotoDeclarationHandler {
	override fun getGotoDeclarationTargets(sourceElement: PsiElement?, offset: Int, editor: Editor?): Array<PsiElement>? {
		val element = sourceElement ?: return null
		val manager = InjectedLanguageManager.getInstance(element.project)
		val host = manager.getInjectionHost(element) ?: return null

		if ((host !is XmlText && host !is XmlAttributeValue) || !element.containingFile.text.startsWith("(/**")) return null

		/* The path of keys that ends at the name: CallState.Muted for Muted, Title for Title. */
		val before = element.containingFile.text.substring(0, element.textRange.endOffset)
		val path = Regex("([A-Za-z_$][\\w$]*(?:\\s*\\.\\s*[A-Za-z_$][\\w$]*)*)$").find(before)?.groupValues?.get(1)?.split('.')?.map { key -> key.trim() } ?: return null
		val owner = ElemenxScope.owner(host) ?: return null
		val offset = ElemenxScope.offsetOf(owner, path) ?: return null
		val file = PsiManager.getInstance(element.project).findFile(owner.file) ?: return null

		return file.findElementAt(offset)?.let { target -> arrayOf(target) }
	}
}
