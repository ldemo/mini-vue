import { NodeTypes } from "./ast"
import { advancePostionWithMutation } from "./utils"

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
	const end = end || getCursor(context)
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
		}
	}

	pushNode(nodes, node)

	return nodes
}

const pushNode = (nodes, node) => {
	nodes.push(node)
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
		advancePostionWithMutation(innerStart, rawContent, startOffset)
	}

	const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset)
	advancePostionWithMutation(innerEnd, rawContent, endOffset)
	advanceBy(context, close.length)

	return {
		type: NodeTypes.INTERPOLATION,
		content: {
			type: NodeTypes.SIMPLE_EXPRESSION,
			content,
			loc: getSelection(context, innerStart, innerEnd)
		},
		loc: getSelection(context, start)
	}
}

const parseTextData = (context, length) => {
	const rawText = context.slice(0, length)
	advanceBy(context, length)

	return rawText
}

const advanceBy = (context, numberOfCharacter) => {
	const { source } = context
	
	advancePositionWithMutation(context, source, numberOfCharacter)
	context.source = source.slice(numberOfCharacter)
}



const isEnd = (context, ancestors) => {
	const s = context.source
	if (startsWith(s, '</')) {
		for (let i = ancestors.length - 1; i > 0; i--) {
			if (startsWithEndTagOpen(s, ancestors[i])) {
				return true
			}
		}
	}
	return !s
}

const last = xs => xs[xs.length - 1]

const startsWith = (source, searchString) => source.startsWith(searchString)
const startsWithEndTagOpen = (source, tag) => 
	startsWith(source, '</') &&
	source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase() &&
	/[\t\r\n\f />]/.test(source[2 + tag.length] || '>')