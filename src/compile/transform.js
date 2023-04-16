import { isString } from "../share"
import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"

export const transform = (root, options) => {
	const context = createTransformContext(root, options)
	traverseNode(root, context)
}

export const traverseNode = (node, context) => {
	context.currentNode = node
	const { nodeTransforms } = context
	const exitFns = []
	for (let i = 0; i < nodeTransforms.length; i++) {
		const onExit = nodeTransforms[i](node, context)

		if (onExit) {
			exitFns.push(onExit)
		}
	}

	switch(node.type) {
		case NodeTypes.INTERPOLATION:
			context.helper(TO_DISPLAY_STRING)
			break
		case NodeTypes.ROOT:
		case NodeTypes.ELEMENT:
			traverseChildren(node, context)
			break
	}

	context.currentNode = node
	let i = exitFns.length
	while(i--) {
		exitFns[i]()
	}
}

export const traverseChildren = (parent, context) => {
	let i = 0
	const nodeRemove = () => i--

	for(; i < parent.children.length; i++) {
		const child = parent.children[i]
		if (isString(child)) continue
		context.parent = parent
		context.childIndex = i
		context.onNodeRemoved = nodeRemove
		traverseNode(child, context)
	}
}

export const createTransformContext = (
	root,
	{
		nodeTransforms
	}
) => {
	const context = {

		nodeTransforms,

		root,
		helpers: new Map(),
		components: new Set(),
		directives: new Set(),
		hoists: [],
		parent: null,
		currentNode: root,
		childIndex: 0,

		helper(name) {
			const count = context.helpers.get(name) || 0
			context.helpers.set(name, count + 1)
			return name
		},

		helperString(name) {
			return `_${context.helper(name)}`
		},

	}

	return context
}