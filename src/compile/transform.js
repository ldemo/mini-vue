import { isString } from "../share"
import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"
import { makeBlock } from "./utils"

export const transform = (root, options) => {
	const context = createTransformContext(root, options)
	traverseNode(root, context)

	createRootCodegen(root, context)

	root.helpers = new Set([...context.helpers.keys()])
	root.components = [...context.components]
	
}

const createRootCodegen = (root, context) => {
	const { helper } = context
  const { children } = root
	const child = children[0]
    // if the single child is an element, turn it into a block.
    if (children.length === 1 && child.type === NodeTypes.ELEMENT && child.codegenNode) {
      // single element root is never hoisted so codegenNode will never be
      // SimpleExpressionNode
      const codegenNode = child.codegenNode
      if (codegenNode.type === NodeTypes.VNODE_CALL) {
        makeBlock(codegenNode, context)
      }
      root.codegenNode = codegenNode
    }
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
		nodeTransforms,
		directiveTransforms
	}
) => {
	const context = {

		nodeTransforms,
		directiveTransforms,

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

		removeHelper(name) {
			const count = context.helpers.get(name)
      if (count) {
        const currentCount = count - 1
        if (!currentCount) {
          context.helpers.delete(name)
        } else {
          context.helpers.set(name, currentCount)
        }
      }
		},

		helperString(name) {
			return `_${context.helper(name)}`
		},

	}

	return context
}