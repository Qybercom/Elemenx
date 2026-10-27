package com.qybercom.elemenx

import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.vfs.VfsUtilCore
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.psi.PsiElement
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.xml.XmlTag
import java.util.concurrent.ConcurrentHashMap

/**
 * The names an expression of a template sees, with their types: the fields and functions of its Component, the
 * variables of the loops (*for) around it, $T and $index. The JavaScript of an expression is the body of a function of
 * them, its JSDoc the types (ElemenxTypes): the IDE resolves Title to the field of the Component, not to a Title of some
 * library of the project, and completes CallState. with the keys of CallState.
 *
 * The Component of a template: in a <template id="x">, the definition with $TemplateID: 'x' (in the page, or in a
 * file of code beside it); else the one of the file of code of its name beside it (Board.js for Board.html). Its
 * fields and functions: the keys of its definition (but the $ ones), and what its code sets: this.X = ...,
 * self.X = ..., state.X = ... (of $Batch), component.X = ....
 */
object ElemenxScope {
	private val identifier = Regex("^[A-Za-z_$][\\w$]*$")
	private val start = Regex("Elemenx\\.Component\\(\\s*(['\"])[A-Za-z][\\w-]*\\1\\s*,\\s*\\{")
	/*
	 * The definitions of a file, read once for each change of it (regression: a template of a thousand bindings read its
	 * Component of three thousand lines again for each of them, and the IDE hung on it).
	 */
	private val read = ConcurrentHashMap<String, Pair<Long, List<Definition>>>()

	private val set = Regex("\\b(?:this|self|state|component)\\.([A-Z][\\w$]*)\\s*=(?!=)")

	/** A field or a function of a Component: where its file of code declares it, its type in JSDoc, its value. */
	data class Member(val name: String, val offset: Int, val type: String? = null, val value: ElemenxTypes.Value? = null)

	/** A definition of a Component in a file: where it is, the template it names ($TemplateID), its members. */
	data class Definition(val start: Int, val end: Int, val templateId: String?, val members: List<Member>)

	/** The Component of a template: its file of code and its members. */
	data class Owner(val file: VirtualFile, val members: List<Member>)

	/** A name of a template and its type (null: none known). */
	data class Name(val name: String, val type: String?)

	fun names(host: PsiElement): List<String> = typedNames(host).map { each -> each.name }

	fun typedNames(host: PsiElement): List<Name> {
		val names = linkedMapOf<String, String?>()
		val owner = owner(host)

		owner?.members?.forEach { member -> names[member.name] = member.type }

		var tag = PsiTreeUtil.getParentOfType(host, XmlTag::class.java, false)

		while (tag != null) {
			tag.getAttributeValue("*for")?.let { loop ->
				val items = loop.substringAfter(" of ", "").trim()
				val list = owner?.members?.firstOrNull { member -> member.name == items }
				val item = list?.type?.let { type -> Regex("^Array<(.*)>$").find(type)?.groupValues?.get(1) }

				loopVariables(loop).forEachIndexed { index, name ->
					if (!names.containsKey(name)) names[name] = if (index == 0) item else "number"
				}
			}

			tag = tag.parentTag
		}

		names["\$T"] = "function(string, Object=): string"
		names["\$index"] = "number"

		return names.filter { entry -> identifier.matches(entry.key) }.map { entry -> Name(entry.key, entry.value) }
	}

	fun owner(host: PsiElement): Owner? {
		val file = host.containingFile?.originalFile?.virtualFile ?: return null
		val folder = file.parent ?: return null
		val template = templateId(host)

		if (template != null) {
			val candidates = listOf(file) + folder.children.filter { each -> each.extension == "js" }

			candidates.forEach { candidate ->
				val found = definitionsOf(candidate).firstOrNull { definition -> definition.templateId == template }

				if (found != null) return Owner(candidate, found.members)
			}
		}

		val code = folder.findChild(file.nameWithoutExtension + ".js") ?: return null
		val found = definitionsOf(code).firstOrNull() ?: return null

		return Owner(code, found.members)
	}

	/** The definitions of a file: the ones read before while it has not changed (its document, or the file of the disk). */
	fun definitionsOf(file: VirtualFile): List<Definition> {
		val stamp = FileDocumentManager.getInstance().getCachedDocument(file)?.modificationStamp ?: file.modificationStamp
		val known = read[file.path]

		if (known != null && known.first == stamp) return known.second

		val found = definitions(text(file))

		read[file.path] = stamp to found

		return found
	}

	/** The id of the <template> a host is in, or null. */
	fun templateId(host: PsiElement): String? {
		var tag = PsiTreeUtil.getParentOfType(host, XmlTag::class.java, false)

		while (tag != null) {
			if (tag.name.equals("template", true)) return tag.getAttributeValue("id")

			tag = tag.parentTag
		}

		return null
	}

	/** The definitions of Components of a source: each with its members, the keys of its object and what its code sets. */
	fun definitions(source: String): List<Definition> = start.findAll(source).map { match ->
		val definition = ElemenxTypes.objectAt(source, match.range.last)
		val members = definition.fields.filter { field -> !field.name.startsWith("$") }.map { field ->
			Member(field.name, field.offset, ElemenxTypes.typeOf(field), field.value)
		}.toMutableList()
		val body = source.substring(match.range.first, definition.end)
		val templateId = text(source, definition.field("\$TemplateID"))

		set.findAll(body).forEach { found ->
			val name = found.groupValues[1]
			val value = ElemenxTypes.parse(source, match.range.first + found.range.last + 1)

			if (members.none { member -> member.name == name }) members.add(Member(name, match.range.first + found.groups[1]!!.range.first, ElemenxTypes.typeOf(value, 0), value))
		}

		Definition(match.range.first, definition.end, templateId, members)
	}.toList()

	/** The text of the string a field holds, without its quotes, or null. */
	private fun text(source: String, field: ElemenxTypes.Field?): String? = field?.value?.let { value -> source.substring(value.start, value.end).trim('\'', '"', '`') }

	/** The names of the members of the first definition of a source. */
	fun members(source: String): List<String> = definitions(source).firstOrNull()?.members?.map { member -> member.name } ?: emptyList()

	/** Where a path of keys (CallState, Muted) is declared in the definition of a Component: an offset in its file, or null. */
	fun offsetOf(owner: Owner, path: List<String>): Int? {
		val member = owner.members.firstOrNull { each -> each.name == path.firstOrNull() } ?: return null
		var offset = member.offset
		var value = member.value

		path.drop(1).forEach { key ->
			val field = value?.field(key) ?: return null

			offset = field.offset
			value = field.value
		}

		return offset
	}

	/** The variables a loop declares: item of Items, (item, index) of Items. */
	fun loopVariables(loop: String): List<String> {
		val head = loop.substringBefore(" of ").trim().removePrefix("(").removeSuffix(")")

		return head.split(',').map { part -> part.trim() }.filter { part -> part.isNotEmpty() }
	}

	/** The text of a file: the one of its document when it is open (not saved yet), else the one of the disk. */
	fun text(file: VirtualFile): String = try {
		FileDocumentManager.getInstance().getCachedDocument(file)?.text ?: VfsUtilCore.loadText(file)
	}
	catch (error: Exception) {
		""
	}
}
