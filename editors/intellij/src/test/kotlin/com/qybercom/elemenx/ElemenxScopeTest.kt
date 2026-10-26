package com.qybercom.elemenx

import com.intellij.lang.Language
import com.intellij.lang.injection.InjectedLanguageManager
import com.intellij.testFramework.fixtures.BasePlatformTestCase

/** The names of a template: the ones of its Component, its loops, $T and $index; the JavaScript of an expression sees them. */
class ElemenxScopeTest : BasePlatformTestCase() {
	private val code = "/* The board. */\nElemenx.Component('Board', {\n\t\$TemplateURL: 'Board.html',\n\tTitle: 'Board',\n\tItems: [],\n\tLabel: \"a, b\",\n\n\t\$OnCreate: function () {\n\t\tvar self = this;\n\n\t\tthis.Counted = function (count) {\n\t\t\treturn {Title: count, Other: [1, 2]};\n\t\t};\n\t},\n\n\tToggle: function () {\n\t\tthis.Title = 'x';\n\t}\n});\n"

	fun testTheMembersOfAComponentAreItsKeysAndItsFunctionsOfOnCreate() {
		assertEquals(listOf("Title", "Items", "Label", "Toggle", "Counted"), ElemenxScope.members(code))
		assertEquals(listOf("item"), ElemenxScope.loopVariables("item of Items"))
		assertEquals(listOf("item", "index"), ElemenxScope.loopVariables("(item, index) of Items"))
	}

	fun testATemplateSeesItsComponentItsLoopsAndTAndIndex() {
		myFixture.addFileToProject("app/Board.js", code)

		val template = myFixture.addFileToProject("app/Board.html", "<ul>\n\t<li *for=\"item of Items\">{{item.Name}} {{Title}}</li>\n</ul>\n")
		val text = template.findElementAt(template.text.indexOf("Title"))!!

		assertEquals(listOf("Title", "Items", "Label", "Toggle", "Counted", "item", "\$T", "\$index"), ElemenxScope.names(text))
	}

	/** A <template id> of a page: the Component of its $TemplateID, in the page, with the fields its code sets ($Batch). */
	fun testAnInlineTemplateSeesTheComponentOfItsTemplateId() {
		val page = myFixture.addFileToProject("simple/index.html", "<html>\n<body>\n<script>\n\tElemenx.Component('Other', {\n\t\t\$TemplateID: 'other',\n\t\tWrong: 1\n\t});\n\tElemenx.Component('SimpleApp', {\n\t\t\$TemplateID: 'simple-app',\n\n\t\t\$OnCreate: function () {\n\t\t\tthis.\$Batch(function (state) {\n\t\t\t\tstate.Title = 'Hello';\n\t\t\t\tstate.Count = 0;\n\t\t\t});\n\t\t\tthis.Theme = 'Light';\n\t\t}\n\t});\n</script>\n<template id=\"simple-app\">\n\t<h1>{{Title}}</h1>\n</template>\n</body>\n</html>\n")
		val text = page.findElementAt(page.text.indexOf("{{Title}}") + 2)!!

		assertEquals(listOf("Title", "Count", "Theme", "\$T", "\$index"), ElemenxScope.names(text))
	}

	/** With the JavaScript of the IDE: an expression is no statement of nothing (regression: every one was marked "Expression statement is not assignment or call"). */
	fun testAnExpressionIsNoStatementOfNothing() {
		if (Language.findLanguageByID("JavaScript") == null) return

		val inspection = try {
			Class.forName("com.sixrr.inspectjs.validity.BadExpressionStatementJSInspection").getDeclaredConstructor().newInstance() as com.intellij.codeInspection.LocalInspectionTool
		}
		catch (error: Exception) {
			return
		}

		myFixture.enableInspections(inspection)
		myFixture.addFileToProject("app/Board.js", code)

		val template = myFixture.addFileToProject("app/Board.html", "<header>\n\t<h1 [title]=\"Label\" (click)=\"Toggle\">{{Title}}</h1>\n</header>\n")

		myFixture.configureFromExistingVirtualFile(template.virtualFile)

		val found = myFixture.doHighlighting().map { info -> info.description ?: "" }.filter { description -> description.contains("Expression statement") }

		assertEquals(emptyList<String>(), found)
	}

	/** With the JavaScript of the IDE: Ctrl+click on {{Title}} goes to the key Title of the definition of the Component (regression: nowhere). */
	fun testANameGoesToTheMemberOfItsComponent() {
		if (Language.findLanguageByID("JavaScript") == null) return

		val definition = myFixture.addFileToProject("app/Board.js", code)
		val template = myFixture.addFileToProject("app/Board.html", "<header>\n\t<h1>{{Title}}</h1>\n</header>\n")

		myFixture.configureFromExistingVirtualFile(template.virtualFile)

		val injected = InjectedLanguageManager.getInstance(project).findInjectedElementAt(myFixture.file, template.text.indexOf("Title") + 1)!!
		val targets = ElemenxGotoDeclaration().getGotoDeclarationTargets(injected, 0, myFixture.editor)!!

		assertEquals(1, targets.size)
		assertEquals("Board.js", targets[0].containingFile.name)
		assertEquals(definition.text.indexOf("Title:"), targets[0].textRange.startOffset)
	}

	/** With the JavaScript of the IDE (WebStorm): {{Title}} is the field of the Component, a parameter of its scope, not a Title of elsewhere. */
	fun testTitleInATemplateIsTheOneOfItsComponent() {
		if (Language.findLanguageByID("JavaScript") == null) return

		myFixture.addFileToProject("app/Board.js", code)
		myFixture.addFileToProject("app/library.js", "var Title = function () {};\nvar Theme = 1;\n")

		val template = myFixture.addFileToProject("app/Board.html", "<header>\n\t<h1>{{Title}}</h1>\n</header>\n")

		myFixture.configureFromExistingVirtualFile(template.virtualFile)

		val injected = InjectedLanguageManager.getInstance(project).findInjectedElementAt(myFixture.file, template.text.indexOf("Title") + 1)!!
		val reference = generateSequence(injected) { element -> element.parent }.mapNotNull { element -> element.reference }.first()
		val target = reference.resolve()!!

		assertEquals("Title", target.text)
		assertTrue(target.javaClass.name, target.javaClass.name.contains("Parameter"))
		assertSame(injected.containingFile, target.containingFile)
	}
}
