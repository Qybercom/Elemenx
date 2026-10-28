package com.qybercom.elemenx

import com.intellij.openapi.vfs.VirtualFile

/**
 * The phrases of $T('key') and $T itself, for Ctrl+click (ElemenxGotoDeclaration): a key goes to its phrase in the
 * JSON of the folders of locales nearest to the template (its Library, its Application, then the Libraries of the
 * project and of node_modules/@qybercom/elemenx), English first; $T to its definition in elemenx.js. The language
 * server does the same (editors/core/elemenx-language.js), for the other editors.
 */
object ElemenxPhrases {
	private val call = Regex("\\\$T\\(\\s*(['\"])([^'\"\\n]*)\\1")
	private val definition = Regex("\\n\\t+\\\$T: function")

	/** The key of the $T('key') whose text covers offset, or null. */
	fun keyAt(text: String, offset: Int): String? = call.findAll(text).firstOrNull { match ->
		val key = match.groups[2]!!.range

		offset >= key.first && offset <= key.last + 1
	}?.groupValues?.get(2)

	/**
	 * Where a key (ui.call.leave) is in the text of a JSON of a locale: the offset of the name of its last part, nested
	 * ({"ui": {"call": {"leave": ...}}}) or written whole ({"ui.call.leave": ...}); -1 when it is not there.
	 */
	fun offsetOf(source: String, key: String): Int {
		val trail = ArrayList<String>()
		var pending: String? = null
		var i = 0

		while (i < source.length) {
			val c = source[i]

			if (c == '"') {
				var end = i + 1

				while (end < source.length && source[end] != '"') end += if (source[end] == '\\') 2 else 1

				val name = source.substring(i + 1, minOf(end, source.length))

				/* A name is a key when a colon follows it. */
				if (Regex("^\\s*:").containsMatchIn(source.substring(minOf(end + 1, source.length), minOf(end + 40, source.length)))) {
					if ((trail.filter { each -> each.isNotEmpty() } + name).joinToString(".") == key) return i + 1

					pending = name
				}

				i = end + 1

				continue
			}

			when (c) {
				'{' -> {
					trail.add(pending ?: "")
					pending = null
				}
				'}' -> if (trail.isNotEmpty()) trail.removeAt(trail.size - 1)
				',', '[' -> pending = null
			}

			i++
		}

		return -1
	}

	/** The folders of locales a template sees, the nearest first. */
	private fun folders(from: VirtualFile): List<VirtualFile> {
		val found = ArrayList<VirtualFile>()
		var folder = from.parent

		while (folder != null) {
			folder.findChild("locales")?.let { each -> found.add(each) }
			listOf(folder.findChild("libraries"), folder.findFileByRelativePath("node_modules/@qybercom/elemenx/libraries")).forEach { libraries ->
				libraries?.children?.forEach { library -> library.findChild("locales")?.let { each -> found.add(each) } }
			}

			folder = folder.parent
		}

		return found.distinct()
	}

	/** The phrase of a key: its file and the offset of its name, in the nearest locales that have it (English first), or null. */
	fun phrase(from: VirtualFile, key: String): Pair<VirtualFile, Int>? {
		folders(from).forEach { folder ->
			val files = folder.children.filter { each -> each.extension == "json" }.sortedBy { each -> if (each.name == "en.json") "" else each.name }

			files.forEach { file ->
				val at = offsetOf(ElemenxScope.text(file), key)

				if (at != -1) return file to at
			}
		}

		return null
	}

	/** Where $T is defined: the elemenx.js of the project or of node_modules/@qybercom/elemenx, nearest first, or null. */
	fun framework(from: VirtualFile): Pair<VirtualFile, Int>? {
		var folder = from.parent

		while (folder != null) {
			listOfNotNull(folder.findChild("elemenx.js"), folder.findFileByRelativePath("node_modules/@qybercom/elemenx/elemenx.js")).forEach { file ->
				val match = definition.find(ElemenxScope.text(file))

				if (match != null) return file to match.range.first + match.value.indexOf('$')
			}

			folder = folder.parent
		}

		return null
	}
}
