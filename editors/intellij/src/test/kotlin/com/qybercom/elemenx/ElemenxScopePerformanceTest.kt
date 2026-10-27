package com.qybercom.elemenx

import com.intellij.testFramework.fixtures.BasePlatformTestCase
import java.io.File

/**
 * The definitions of real Components: the catalogue of three thousand lines and every Component of ElemenxUI, read in
 * time and once for each change (regression: WebStorm hung on the template of the catalogue, its Component read again
 * for each of its thousand bindings).
 */
class ElemenxScopePerformanceTest : BasePlatformTestCase() {
	private val repository = File(System.getProperty("user.dir")).resolve("../..").canonicalFile

	fun testTheCatalogueIsReadInTimeAndOnce() {
		val source = repository.resolve("examples/Advanced/application/components/UIKitPage/UIKitPage.js").readText()
		val file = myFixture.addFileToProject("ui/UIKitPage.js", source).virtualFile
		val started = System.nanoTime()
		val first = ElemenxScope.definitionsOf(file)
		val took = (System.nanoTime() - started) / 1_000_000

		assertTrue("took $took ms", took < 2000)
		assertTrue(first[0].members.map { member -> member.name }.containsAll(listOf("Shows", "Agenda", "CalendarView")))

		val again = System.nanoTime()

		repeat(1000) {
			assertSame(first, ElemenxScope.definitionsOf(file))
		}

		assertTrue("a thousand reads took " + (System.nanoTime() - again) / 1_000_000 + " ms", (System.nanoTime() - again) / 1_000_000 < 500)
	}

	fun testEveryComponentOfElemenxUiIsRead() {
		val components = repository.resolve("libraries/ElemenxUI/components").listFiles()!!.mapNotNull { folder -> folder.resolve(folder.name + ".js").takeIf { it.exists() } }
		val started = System.nanoTime()

		components.forEach { file ->
			val found = ElemenxScope.definitions(file.readText())

			assertTrue(file.name, found.isNotEmpty())
		}

		val took = (System.nanoTime() - started) / 1_000_000

		assertTrue("${components.size} Components took $took ms", took < 5000)
	}
}
