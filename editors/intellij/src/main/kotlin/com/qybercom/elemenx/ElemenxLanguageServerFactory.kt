package com.qybercom.elemenx

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.extensions.PluginId
import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.openapi.application.PathManager
import com.intellij.openapi.project.Project
import com.redhat.devtools.lsp4ij.LanguageServerFactory
import com.redhat.devtools.lsp4ij.server.OSProcessStreamConnectionProvider
import com.redhat.devtools.lsp4ij.server.StreamConnectionProvider
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

/** The language server of Elemenx for LSP4IJ: Node runs the server the plugin carries. */
class ElemenxLanguageServerFactory : LanguageServerFactory {
	override fun createConnectionProvider(project: Project): StreamConnectionProvider = ElemenxLanguageServer(project)
}

/**
 * The process of the server: `node elemenx-language-server.js --stdio` (ELEMENX_NODE names another Node). It runs in the
 * folder of its files, not of the project: the roots come over LSP, and the folder of a project it held could not be
 * deleted or renamed while it runs.
 */
class ElemenxLanguageServer(@Suppress("UNUSED_PARAMETER") project: Project) : OSProcessStreamConnectionProvider() {
	init {
		val server = ElemenxServerFiles.server()
		val command = GeneralCommandLine(System.getenv("ELEMENX_NODE") ?: "node", server.toString(), "--stdio")

		command.setWorkDirectory(server.parent.toFile())

		commandLine = command
	}
}

/**
 * The files of the server, copied out of the plugin once for its version: Node cannot read them inside its jar. They are
 * the ones files.txt lists (the server, its core, and the sources of Elemenx and ElemenxUI the definitions go to).
 */
object ElemenxServerFiles {
	private val essential = listOf("server/elemenx-language-server.js", "core/elemenx-language.js", "core/meta.json")

	private fun files(): List<String> {
		val listed = ElemenxServerFiles::class.java.getResourceAsStream("/elemenx/files.txt")?.use { input ->
			input.bufferedReader().readLines().map { line -> line.trim() }.filter { line -> line.isNotEmpty() }
		}

		return listed ?: essential
	}

	@Synchronized
	fun server(): Path {
		/* The version of the plugin (regression: the jar names none, every start copied all the files again as dev). */
		val version = PluginManagerCore.getPlugin(PluginId.getId("com.qybercom.elemenx"))?.version ?: "dev"
		val folder = Path.of(PathManager.getSystemPath(), "elemenx-language-server", version)

		files().forEach { name ->
			val target = folder.resolve(name)

			if (version == "dev" || !Files.exists(target)) {
				Files.createDirectories(target.parent)

				ElemenxServerFiles::class.java.getResourceAsStream("/elemenx/$name")?.use { input ->
					Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING)
				}
			}
		}

		return folder.resolve("server/elemenx-language-server.js")
	}
}
