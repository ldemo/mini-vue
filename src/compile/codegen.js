import { isArray, isString } from "../share"
import { NodeTypes } from "./ast"
import { helperNameMap, OPEN_BLOCK, RESOLVE_COMPONENT, TO_DISPLAY_STRING } from "./runtimeHelpers"
import { getVNodeBlockHelper, getVNodeHelper } from "./utils"

export const generate = (ast, options) => {
	const context = createCodegenContext(ast, options)

	const {
		push,
		indent,
		deindent,
		newline
	} = context

	const helpers = Array.from(ast.helpers)
	const hasHelpers = helpers.length > 0
	const useWithBlock = true

	genModulePreamble(ast, context)

	const functionName = 'render'
	const args = ['_ctx', '_cache']
	const signature = args.join(', ')

	
	push(`function ${functionName}(${signature}) {`)
	indent()
	
	if (useWithBlock) {
    push(`with (_ctx) {`)
    indent()
    // function mode const declarations should be inside with block
    // also they should be renamed to avoid collision with user properties
    if (hasHelpers) {
      push(`const { ${helpers.map(s => `${helperNameMap[s]}: _${helperNameMap[s]}`).join(', ')} } = _Vue`)
      push(`\n`)
      newline()
    }
  }

	if (ast.components.length) {
		genAssets(ast.components, 'component', context)
	}

	if (ast.components.length) {
    push(`\n`)
    newline()
  }

	push(`return `)
	if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

	return {
    ast,
    code: context.code,
  }
}

const genNode = (node, context) => {
	if (isString(node)) {
		context.push(node)
		return
	}

	switch(node.type) {
		case NodeTypes.ELEMENT:
			genNode(node.codegenNode, context)
			break
		case NodeTypes.TEXT:
			genText(node, context)
			break
		case NodeTypes.SIMPLE_EXPRESSION:
			genExpression(node, context)
			break
		case NodeTypes.INTERPOLATION:
			genInterpolation(node, context)
			break
		case NodeTypes.TEXT_CALL:
			genNode(node.codegenNode, context)
			break
		case NodeTypes.COMPOUND_EXPRESSION:
			genCompoundExpression(node, context)
			break
		case NodeTypes.VNODE_CALL:
			genVNodeCall(node, context)
			break

		case NodeTypes.JS_CALL_EXPRESSION:
			genCallExpression(node, context)
			break
		case NodeTypes.JS_OBJECT_EXPRESSION:
			genObjectExpression(node, context)
			break
	}
}

const genText = (node, context) => {
	context.push(JSON.stringify(node.content))
}

const genExpression = (node, context) => {
	const { content, isStatic } = node
	context.push(isStatic ? JSON.stringify(content) : content)
}

const genInterpolation = (node, context) => {
	const { push, helper } = context
	push(`${helper(TO_DISPLAY_STRING)}(`)
	genNode(node.content, context)
	push(`)`)
}

const genCompoundExpression = (node, context) => {
	for (let i = 0; i < node.children.length; i++) {
		const child = children[i]
		if (isString(child)) {
			context.push(child)
		} else {
			genNode(child, contxt)
		}
	}
}

const genVNodeCall = (node, context) => {
	const { push, helper } = context
	const {
		tag,
		props,
		children,
		patchFlag,
		dynamicProps,
		isBlock,
		isComponent
	} = node

	if (isBlock) {
		push(`(${helper(OPEN_BLOCK)}(), `)
	}

 	const callHelper = isBlock
		?	getVNodeBlockHelper(isComponent)
		: getVNodeHelper(isComponent)

	push(helper(callHelper) + `(`)
	genNodeList(
		genNullableArgs([tag, props, children, patchFlag, dynamicProps]),
		context
	)
	push(`)`)
	if (isBlock) {
    push(`)`)
  }
}

const genNullableArgs = (args) => {
  let i = args.length
  while (i--) {
    if (args[i] != null) break
  }
  return args.slice(0, i + 1).map(arg => arg || `null`)
}

const genNodeListAsArray = (nodes, context) => {
	const multilines = nodes.length > 1
	context.push(`[`)
	multilines && context.indent()
	genNodeList(nodes, context, multilines)
	multilines && context.deindent()
	context.push(']')
}

const genNodeList = (
	nodes,
	context,
	multilines = false,
	comma = true
) => {
	const { push, newline } = context
	for(let i = 0; i < nodes.length; i++) {
		const node = nodes[i]
		if (isString(node)) {
			push(node)
		} else if (isArray(node)) {
			genNodeListAsArray(node, context)
		} else {
			genNode(node, context)
		}

		if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(',')
        newline()
      } else {
        comma && push(', ')
      }
    }
	}
}

const genCallExpression = (node, context) => {
	const { push, helper } = context
	const callee = isString(node.callee) ? node.callee : helper(node.callee)
	push(callee + `(`)
	genNodeList(node.arguments, context)
	push(`)`)
}

const genObjectExpression = (node, context) => {
	const { push, indent, deindent, newline } = context
	const { properties } = node
  if (!properties.length) {
    push(`{}`, node)
    return
  }
	const multilines = properties.length > 1
	push(multilines ? `{` : `{ `)
	multilines && indent()
	for (let i = 0; i < properties.length; i++) {
		let { key, value } = properties[i]
		genExpressionAsPropertyKey(key, context)
		push(`: `)
		genNode(value, context)
		if (i < properties.length - 1) {
      push(`,`)
      newline()
    }
	}
	multilines && deindent()
	push(multilines ? `}` : ` }`)
}

const genExpressionAsPropertyKey = (node, context) => {
	const { push } = context
	if (node.isStatic) {
		push(node.content, context)
	} else {
    push(`[${node.content}]`, node)
  }
}

const genAssets = (
	assets,
	type,
	{ helper, push, newline }
) => {
	const resolver = helper( type === 'component' ? RESOLVE_COMPONENT : '')

	for (let i = 0; i < assets.length; i++) {
		let id = assets[i]
		push(`const _component_${id} = ${resolver}(${JSON.stringify(id)})`)
		if (i < assets.length - 1) {
      newline()
    }
	}
}

const genModulePreamble = (ast, context) => {
	const {
    push,
    newline,
  } = context

	if (ast.helpers.size) {
		push(`const _Vue = Vue\n`)
  }
	newline()
}

const createCodegenContext = (
	ast,
	options
) => {
	const context = {
		source: ast.loc.source,
		code: ``,
		column: 1,
		line: 1,
		offset: 0,
		intendLevel: 0,
		helper(key) {
			return `_${helperNameMap[key]}`
		},
		push(code) {
			context.code += code
		},
		indent() {
			newline(++context.intendLevel)
		},
		deindent(withoutNewLine = false) {
			if (withoutNewLine) {
				--context.intendLevel
			} else {
				newline(--context.intendLevel)
			}
		},
		newline() {
			newline(context.intendLevel)
		}
	}

	const newline = (n) => {
		context.push('\n' + `  `.repeat(n))
	}

	return context
}