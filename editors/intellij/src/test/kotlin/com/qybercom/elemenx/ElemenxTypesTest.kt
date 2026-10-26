package com.qybercom.elemenx

import com.intellij.lang.Language
import com.intellij.lang.injection.InjectedLanguageManager
import com.intellij.testFramework.fixtures.BasePlatformTestCase

/** The types of the names of a template, read from the definition of its Component: of its values, or of a JSDoc of its own. */
class ElemenxTypesTest : BasePlatformTestCase() {
	private val code = "Elemenx.Component('Call', {\n" +
		"\t\$TemplateURL: 'Call.html',\n" +
		"\tTitle: 'Call',\n" +
		"\tCount: 3,\n" +
		"\tItems: [],\n" +
		"\tCallState: {Muted: false, Camera: true, Peer: {Name: 'Ada'}},\n" +
		"\tSelected: null,\n" +
		"\t/** @type {{Name: string, Online: boolean}[]} */\n" +
		"\tPeople: [],\n" +
		"\tRows: [{ID: 1, Label: 'One'}],\n\n" +
		"\tShows: function (section, open) {\n" +
		"\t\treturn true;\n" +
		"\t}\n" +
		"});\n"

	private fun types(): Map<String, String?> = ElemenxScope.definitions(code)[0].members.associate { member -> member.name to member.type }

	fun testTheTypesComeFromTheValuesOfTheDefinition() {
		val found = types()

		assertEquals("string", found["Title"])
		assertEquals("number", found["Count"])
		assertEquals("Array", found["Items"])
		assertEquals("{Muted: boolean, Camera: boolean, Peer: {Name: string}}", found["CallState"])
		assertEquals("*", found["Selected"])
		assertEquals("Array<{ID: number, Label: string}>", found["Rows"])
		assertEquals("function(*, *)", found["Shows"])
	}

	fun testAJsDocOfItsOwnIsTheTypeOfAKey() {
		assertEquals("{Name: string, Online: boolean}[]", types()["People"])
	}

	fun testAKeyOfAKeyHasItsPlace() {
		val owner = ElemenxScope.Owner(myFixture.addFileToProject("app/Call.js", code).virtualFile, ElemenxScope.definitions(code)[0].members)

		assertEquals(code.indexOf("Muted"), ElemenxScope.offsetOf(owner, listOf("CallState", "Muted")))
		assertEquals(code.indexOf("Name: 'Ada'"), ElemenxScope.offsetOf(owner, listOf("CallState", "Peer", "Name")))
		assertNull(ElemenxScope.offsetOf(owner, listOf("CallState", "Nothing")))
	}

	/** With the JavaScript of the IDE: CallState. completes its keys, and the item of a loop has the type of the items. */
	fun testTheKeysOfANameAreCompleted() {
		if (Language.findLanguageByID("JavaScript") == null) return

		myFixture.addFileToProject("app/Call.js", code)

		val template = myFixture.addFileToProject("app/Call.html", "<div [muted]=\"CallState.\"></div>\n<p *for=\"row of Rows\">{{row.}}</p>\n")

		myFixture.configureFromExistingVirtualFile(template.virtualFile)
		myFixture.editor.caretModel.moveToOffset(template.text.indexOf("CallState.") + "CallState.".length)

		val keys = myFixture.completeBasic()?.map { item -> item.lookupString } ?: emptyList()

		assertTrue(keys.toString(), keys.containsAll(listOf("Muted", "Camera", "Peer")))

		myFixture.editor.caretModel.moveToOffset(template.text.indexOf("row.") + "row.".length)

		val fields = myFixture.completeBasic()?.map { item -> item.lookupString } ?: emptyList()

		assertTrue(fields.toString(), fields.containsAll(listOf("ID", "Label")))
	}

	/** With the JavaScript of the IDE: Ctrl+click on CallState.Muted goes to the key Muted of the definition. */
	fun testAKeyGoesToItsPlaceInTheDefinition() {
		if (Language.findLanguageByID("JavaScript") == null) return

		myFixture.addFileToProject("app/Call.js", code)

		val template = myFixture.addFileToProject("app/Call.html", "<div [muted]=\"CallState.Muted\"></div>\n")

		myFixture.configureFromExistingVirtualFile(template.virtualFile)

		val injected = InjectedLanguageManager.getInstance(project).findInjectedElementAt(myFixture.file, template.text.indexOf("Muted") + 1)!!
		val targets = ElemenxGotoDeclaration().getGotoDeclarationTargets(injected, 0, myFixture.editor)!!

		assertEquals(code.indexOf("Muted"), targets[0].textRange.startOffset)
	}
}
