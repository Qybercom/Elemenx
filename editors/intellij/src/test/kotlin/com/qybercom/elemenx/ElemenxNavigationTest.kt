package com.qybercom.elemenx

import com.intellij.codeInsight.daemon.impl.HighlightInfo
import com.intellij.codeInsight.navigation.actions.GotoDeclarationAction
import com.intellij.codeInspection.LocalInspectionEP
import com.intellij.codeInspection.LocalInspectionTool
import com.intellij.lang.Language
import com.intellij.lang.injection.InjectedLanguageManager
import com.intellij.injected.editor.EditorWindow
import com.intellij.lang.annotation.HighlightSeverity
import com.intellij.psi.PsiFile
import com.intellij.testFramework.fixtures.BasePlatformTestCase

/**
 * A template in the editor of the IDE, as Ctrl+click and the inspections of its profile see it: the names of its
 * expressions go to their members, and the rules of HTML stay off its Components (regression, WebStorm 2026.2: no name
 * went anywhere, <Input> wanted a label, a *for declared its variable twice).
 */
class ElemenxNavigationTest : BasePlatformTestCase() {
	private val code = "Elemenx.Component('Board', {\n\t\$TemplateURL: 'Board.html',\n\tTitle: 'Board',\n\tPage: 'export',\n\tNewName: '',\n\n\t\$OnCreate: function () {\n\t\tthis.Kinds = function (language) {\n\t\t\treturn [];\n\t\t};\n\t},\n\n\tPaged: function (value) {\n\t\tthis.Page = value;\n\t},\n\n\tNewNamed: function (value) {\n\t\tthis.NewName = value;\n\t}\n});\n"
	private val template = "<RibbonBackstage slot=\"backstage\" [title]=\"Title\" [page]=\"Page\" (page)=\"Paged\">\n\t<Field [label]=\"Title\">\n\t\t<Input [value]=\"NewName\" [placeholder]=\"Title\" (input)=\"NewNamed\" />\n\t</Field>\n\t<button type=\"button\" *for=\"kind of Kinds(Title)\" #Theme>{{kind.Icon}} {{Title}}</button>\n</RibbonBackstage>\n"

	/** Where Ctrl+click at an offset of the editor of the page goes: the file and the offset in it of each target. */
	private fun targets(file: PsiFile, offset: Int): List<String> {
		myFixture.configureFromExistingVirtualFile(file.virtualFile)

		/* The editor of the page, not the one of a fragment of JavaScript the fixture may hold after a Ctrl+click. */
		val editor = (myFixture.editor as? EditorWindow)?.delegate ?: myFixture.editor
		val injection = InjectedLanguageManager.getInstance(project)

		editor.caretModel.moveToOffset(offset)

		return GotoDeclarationAction.findAllTargetElements(project, editor, offset).map { target ->
			val host = injection.getTopLevelFile(target)

			host.name + ":" + injection.injectedToHost(target, target.textRange.startOffset)
		}
	}

	fun testANameOfAnAttributeOrATextGoesToItsMember() {
		if (Language.findLanguageByID("JavaScript") == null) return

		myFixture.addFileToProject("app/Board.js", code)

		val file = myFixture.addFileToProject("app/Board.html", template)

		assertEquals(listOf("Board.js:" + code.indexOf("Page:")), targets(file, template.indexOf("\"Page\"") + 2))
		assertEquals(listOf("Board.js:" + code.indexOf("Paged:")), targets(file, template.indexOf("\"Paged\"") + 2))
		assertEquals(listOf("Board.js:" + code.indexOf("NewName:")), targets(file, template.indexOf("\"NewName\"") + 2))
		assertEquals(listOf("Board.js:" + code.indexOf("NewNamed:")), targets(file, template.indexOf("\"NewNamed\"") + 2))
		assertEquals(listOf("Board.js:" + code.indexOf("Kinds =")), targets(file, template.indexOf("Kinds(") + 1))
		assertEquals(listOf("Board.js:" + code.indexOf("Title:")), targets(file, template.indexOf("{{Title}}") + 3))
	}

	fun testAVariableOfALoopGoesToItsFor() {
		if (Language.findLanguageByID("JavaScript") == null) return

		myFixture.addFileToProject("app/Board.js", code)

		val file = myFixture.addFileToProject("app/Board.html", template)

		assertEquals(listOf("Board.html:" + template.indexOf("kind of")), targets(file, template.indexOf("kind.Icon") + 1))
	}

	fun testATemplateOfThePageIsTheOneOfTheComponentThatNamesIt() {
		if (Language.findLanguageByID("JavaScript") == null) return

		val text = "<html lang=\"en\">\n<body>\n<script>\n\tElemenx.Component('SimpleApp', {\n\t\t\$TemplateID: 'simple-app',\n\t\tTheme: 'light'\n\t});\n</script>\n<template id=\"simple-app\">\n\t<button #Theme>{{Theme}} theme</button>\n</template>\n</body>\n</html>\n"
		val page = myFixture.addFileToProject("simple/index.html", text)

		assertEquals(listOf("index.html:" + text.indexOf("Theme:")), targets(page, text.indexOf("{{Theme}}") + 3))
	}

	fun testTheInspectionsOfTheProfileFindNothingInATemplate() {
		val tools = LocalInspectionEP.LOCAL_INSPECTION.extensionList.filter { each -> each.enabledByDefault }.mapNotNull { each ->
			try {
				each.instantiateTool() as? LocalInspectionTool
			}
			catch (error: Throwable) {
				null
			}
		}

		myFixture.enableInspections(*tools.toTypedArray())
		myFixture.addFileToProject("app/Board.js", code)

		val file = myFixture.addFileToProject("app/Board.html", template)

		myFixture.configureFromExistingVirtualFile(file.virtualFile)

		val found = myFixture.doHighlighting().filter { info: HighlightInfo -> info.severity.myVal >= HighlightSeverity.WEAK_WARNING.myVal }.map { info -> info.inspectionToolId + " " + info.text + ": " + info.description }

		assertEquals(emptyList<String>(), found)
	}
}
