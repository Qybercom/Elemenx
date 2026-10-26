package com.qybercom.elemenx

import com.intellij.lang.html.HTMLLanguage
import com.intellij.psi.PsiElement
import com.intellij.psi.xml.XmlAttribute
import com.intellij.psi.xml.XmlTag
import com.intellij.xml.XmlAttributeDescriptor
import com.intellij.xml.XmlElementDescriptor
import com.intellij.psi.impl.source.xml.XmlElementDescriptorProvider
import com.intellij.xml.XmlElementsGroup
import com.intellij.xml.XmlNSDescriptor
import com.intellij.xml.impl.schema.AnyXmlAttributeDescriptor

/**
 * The Components of a template are elements of their own, not the ones of HTML: HTML does not tell <Input> from
 * <input>, and the rules of an input (empty, no closing tag), an img (alt), a select (its options) fell on the
 * Components Input, Image, Select. A Component takes any attribute (its props, bindings, events, directives and
 * references: the language server knows which) and any content; the elements inside it keep the rules of HTML.
 */
class ElemenxElementDescriptorProvider : XmlElementDescriptorProvider {
	override fun getDescriptor(tag: XmlTag): XmlElementDescriptor? {
		if (!tag.language.isKindOf(HTMLLanguage.INSTANCE) || !ElemenxInspectionSuppressor.isComponent(tag)) return null

		return ElemenxComponentDescriptor(tag)
	}
}

class ElemenxComponentDescriptor(private val tag: XmlTag) : XmlElementDescriptor {
	override fun getQualifiedName(): String = tag.name

	override fun getDefaultName(): String = tag.name

	override fun getElementsDescriptors(context: XmlTag?): Array<XmlElementDescriptor> = XmlElementDescriptor.EMPTY_ARRAY

	/** The elements inside it: the descriptors of HTML (or of a Component), as anywhere in the template. */
	override fun getElementDescriptor(childTag: XmlTag, contextTag: XmlTag?): XmlElementDescriptor? = null

	override fun getAttributesDescriptors(context: XmlTag?): Array<XmlAttributeDescriptor> = XmlAttributeDescriptor.EMPTY

	override fun getAttributeDescriptor(attributeName: String, context: XmlTag?): XmlAttributeDescriptor = AnyXmlAttributeDescriptor(attributeName)

	override fun getAttributeDescriptor(attribute: XmlAttribute): XmlAttributeDescriptor = AnyXmlAttributeDescriptor(attribute.name)

	override fun getNSDescriptor(): XmlNSDescriptor? = null

	override fun getTopGroup(): XmlElementsGroup? = null

	override fun getContentType(): Int = XmlElementDescriptor.CONTENT_TYPE_ANY

	override fun getDefaultValue(): String? = null

	/** The tag itself: its name resolves (the language server goes to the definition of the Component). */
	override fun getDeclaration(): PsiElement = tag

	override fun getName(context: PsiElement?): String = tag.name

	override fun getName(): String = tag.name

	override fun init(element: PsiElement?) {}
}
