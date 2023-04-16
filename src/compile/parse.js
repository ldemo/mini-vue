import { extend } from "../share"
import { ConstantsType, createRoot, ElementTypes, NodeTypes } from "./ast"
import { advancePositionWithMutation } from "./utils"

export const defaultParserOptions = {
	delimiters: ['{{', '}}'],
}

export const baseParse = (content, options) => {
	const context = createParserContext(content, options)
	const start = getCursor(context)

	return createRoot(
		parseChildren(context, []),
		getSelection(context, start)
	)
}

const getSelection = (context, start, end) => {
	end = end || getCursor(context)
	return {
		start,
		end,
		source: context.originSource.slice(start.offset, end.offset)
	}
}

const createParserContext = (content, options) => {
	return {
		options: {
			...defaultParserOptions,
			...options,
		},
		column: 1,
		line: 1,
		offset: 0,
		originSource: content,
		source: content,
	}
}

const getCursor = (context) => {
	const { column, line, offset } = context
	return {column, line, offset }
}

const parseChildren = (context, ancestors) => {
	const parent = last(ancestors)
	const nodes = []

	while(!isEnd(context, ancestors)) {
		const s = context.source
		let node = undefined

		if (startsWith(s, context.options.delimiters[0])) {
			node = parseInterpolation(context)
		} else if (s[0] === '<') {
			if (/[a-z]/i.test(s[1])) {
				node = parseElement(context, ancestors)
			}
		}

		if(!node) {
			node = parseText(context)
		}

		pushNode(nodes, node)
	}

	let removedWhiteSpace = false
	for(let i = 0; i < nodes.length; i++) {
		const node = nodes[i]
		if (node.type === NodeTypes.TEXT) {

			if (!/[^\t\r\n\f ]/.test(node.content)) {
				const prev = nodes[i - 1]
				const next = nodes[i + 1]

				if (
					!prev ||
					!next ||
					(
						prev.type === NodeTypes.ELEMENT &&
						next.type === NodeTypes.ELEMENT &&
						/[\r\n]/.test(node.content)
					)
				) {
					removedWhiteSpace = true
					nodes[i] = null
				} else {
					node.content = ' '
				}
			} else {
				node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
			}
		}
	}

	return removedWhiteSpace ? nodes.filter(Boolean) : nodes
}

const pushNode = (nodes, node) => {
	nodes.push(node)
}

const parseText = (context) => {
	const endTokens = ['<', context.options.delimiters[0]]

	let endIndex = context.source.length
	for(let i = 0; i < endTokens.length; i++) {
		const index = context.source.indexOf(endTokens[i], 1)
		if (index !== -1 && endIndex > index) {
			endIndex = index
		}
	}

	const start = getCursor(context)
	const content = parseTextData(context, endIndex)

	return {
		type: NodeTypes.TEXT,
		content,
		loc: getSelection(context, start)
	}
}

const parseElement = (context, ancestors) => {
	const parent = last(ancestors)
	const element = parseTag(context, TagType.Start, parent)

	if (element.isSelfClosing) return element

	ancestors.push(element)
	const children = parseChildren(context, ancestors)
	ancestors.pop()

	element.children = children

	if (startsWithEndTagOpen(context.source, element.tag)) {
		parseTag(context, TagType.End, parent)
	}

	element.loc = getSelection(context, element.loc.start)

	return element
}

const parseTag = (context, type, parent) => {
	const start = getCursor(context)
	const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
	const tag = match[1]

	advanceBy(context, match[0].length)
	advanceSpaces(context)

	let props = parseAttributes(context, type)

	let isSelfClosing = startsWith(context.source, '/>')
	advanceBy(context, isSelfClosing ? 2 : 1)

	if (type === TagType.End) return

	let tagType = ElementTypes.ELEMENT
	if (tag === 'slot') {
		tagType = ElementTypes.SLOT
	} else if (tag === 'template') {
		if (props.some(v => v.type === NodeTypes.DIRECTIVE && isSpecialTemplateDirective(v)))
		tagType = ElementTypes.TEMPLATE
	} else if (isComponent(tag, props, context)) {
		tagType = ElementTypes.COMPONENT
	}

	return {
		type: NodeTypes.ELEMENT,
		tag,
		tagType,
		props,
		isSelfClosing,
		children: [],
		loc: getSelection(context, start)
	}
	
}

const parseInterpolation = (context) => {
	const [open, close] = context.options.delimiters
	const closeIndex = context.source.indexOf(close, open.length)

	const start = getCursor(context)
	advanceBy(context, open.length)
	const innerStart = getCursor(context)
	const innerEnd = getCursor(context)
	const rawContentLength = closeIndex - open.length
	const rawContent = context.source.slice(0, rawContentLength)
	const preTrimContent = parseTextData(context, rawContentLength)
	const content = preTrimContent.trim()
	const startOffset = preTrimContent.indexOf(content)

	if (startOffset > 0) {
		advancePositionWithMutation(innerStart, rawContent, startOffset)
	}

	const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset)
	advancePositionWithMutation(innerEnd, rawContent, endOffset)
	advanceBy(context, close.length)

	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content,
			isStatic: false,
			constType: ConstantsType.NOT_CONSTANT,
			loc: getSelection(context, innerStart, innerEnd)
		},
		loc: getSelection(context, start)
	}
}

const parseTextData = (context, length) => {
	const rawText = context.source.slice(0, length)
	advanceBy(context, length)

	return rawText
}

const parseAttributes = (context, type) => {
	const props = []
	const attributeNames = new Set()

	while(
		context.source.length > 0 &&
		!startsWith(context.source, '>') &&
		!startsWith(context.source, '/>')
	) {

		const attr = parseAttribute(context, attributeNames)

		if (type === TagType.Start) {
			props.push(attr)
		}

		advanceSpaces(context)
	}

	return props
}

const parseAttribute = (context, nameSet) => {
	const start = getCursor(context)
	const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
	const name = match[0]

	nameSet.add(name)

	advanceBy(context, name.length)

	let value = undefined

	if (/^[\t\r\n\f ]*=/.test(context.source)) {
		advanceSpaces(context)
		advanceBy(context, 1)
		advanceSpaces(context)
		value = parseAttributeValue(context)
	}

	const loc = getSelection(context, start)

	if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
		const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name)

		let isPropShorthand = startsWith(name, '.')
		let dirName =
			match[1] || 
			(isPropShorthand || startsWith(name, ':')
				? 'bind'
				: startsWith(name, '@')
					? 'on'
					: 'slot')

		let arg
		if (match[2]) {
			const isSlot = dirName === 'slot'
			const startOffset = name.lastIndexOf(match[2])
			const loc = getSelection(
				context,
				getNewPosition(context, start, startOffset),
				getNewPosition(
					context,
					start,
					startOffset + match[2].length + ((isSlot && match[3]) || '').length
				)
			)

			let content = match[2]
			let isStatic = true
			
			if (isSlot) {
				content += match[3] || ''
			}

			arg = {
				type: NodeTypes.SIMPLE_EXPRESSION,
				content,
				isStatic,
				constType: isStatic
					? ConstantsType.CAN_STRINGIFY
					: ConstantsType.NOT_CONSTANT,
				loc
			}
		}

		const modifiers = match[3] ? match[3].slice(1).split('.') : []
    if (isPropShorthand) modifiers.push('prop')

		return {
			type: NodeTypes.DIRECTIVE,
			name: dirName,
			arg,
			exp: value && {
				type: NodeTypes.SIMPLE_EXPRESSION,
				content: value.content,
				isStatic: false,
				constType: ConstantsType.NOT_CONSTANT,
				loc: value.loc
			},
			modifiers,
			loc
		}
	}

	return {
		type: NodeTypes.ATTRIBUTE,
		name,
		value: value && {
			type: NodeTypes.TEXT,
			content: value.content,
			loc: value.loc
		},
		loc
	}
}

const parseAttributeValue = (context) => {
	const start = getCursor(context)
	let content

	const quote = context.source[0]
	const isQuoted = quote === `"` || quote === `'`

	if (isQuoted) {
		advanceBy(context, 1)

		const endIndex = context.source.indexOf(quote)
		content = parseTextData(context, endIndex)
		advanceBy(context, 1)
	} else {
		const match = /^[^\t\r\n\f >]+/.exec(context.source)
		if (!match) {
			return undefined
		}
		content = parseTextData(context, match[0].length)
	}

	return {
		content,
		isQuoted,
		loc: getSelection(context, start)
	}

}

const advanceSpaces = (context) => {
	const match = /^[\t\r\n\f ]+/.exec(context.source)

	if (match) {
		advanceBy(context, match[0].length)
	}
}

const advanceBy = (context, numberOfCharacters) => {
	const { source } = context
	
	advancePositionWithMutation(context, source, numberOfCharacters)
	context.source = source.slice(numberOfCharacters)
}

const getNewPosition = (context, start, numberOfCharacters) => {
	return advancePositionWithClone(
		start,
		context.originSource.slice(start.offset, numberOfCharacters),
		numberOfCharacters
	)
}

const advancePositionWithClone = (pos, source, numberOfCharacters) => {
	return advancePositionWithMutation(
		extend({}, pos),
		source,
		numberOfCharacters
	)
}

const isComponent = (tag, props, context) => {
	if (
		tag === 'component' ||
		/^[A-Z]/.test(tag)
	) {
		return true
	}
}

const isEnd = (context, ancestors) => {
	const s = context.source
	if (startsWith(s, '</')) {
		for (let i = ancestors.length - 1; i >= 0; i--) {
			if (startsWithEndTagOpen(s, ancestors[i].tag)) {
				return true
			}
		}
	}
	return !s
}

const TagType = {
	Start: 0,
	End: 1
}

const isSpecialTemplateDirective = val => `if,else,else-if,for,slot`.split(',').includes(val)
  
const last = xs => xs[xs.length - 1]

const startsWith = (source, searchString) => source.startsWith(searchString)
const startsWithEndTagOpen = (source, tag) => 
	startsWith(source, '</') &&
	source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
	/[\t\r\n\f />]/.test(source[2 + tag.length] || '>')