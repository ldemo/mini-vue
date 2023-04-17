import { ConstantTypes, createCallExpression, createCompoundExpression, NodeTypes } from "../ast"
import { isText } from "../utils"
import { PatchFlags } from '../../share/patchFlags'
import { CREATE_TEXT } from "../runtimeHelpers"
import { getConstantType } from "./hoistStatic"

export const transformText = (node, context) => {
	if (node.type === NodeTypes.ELEMENT) {
		return () => {
			const children = node.children
			let currentContainer = undefined
			let hasText = false

			for(let i = 0; i < children.length; i++) {
				const child = children[i]
				if (isText(child)) {
					hasText = true
					for (let j = i + 1; j < children.length; j++) {
						const next = children[j]
						if (isText(next)) {
							if (!currentContainer) {
								currentContainer = children[i] = createCompoundExpression(
									[child],
									child.loc
								)
							}

							currentContainer.children.push(` + `, next)
							children.splice(j, 1)
							j--
						} else {
							currentContainer = undefined
							break
						}
					}
				}
			}

			if (
				!hasText ||
				(
					children.length === 1 &&
					(
						node.type === NodeTypes.ROOT ||
						node.type === NodeTypes.ELEMENT
					)
				)
			) {
				return 
			}
			
			// 处理场景 <div />hello {msg}

			for(let i = 0; i < children.length; i++) {
				const child = children[i]
				if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
					const callArgs = []

					if (child.type !== NodeTypes.TEXT || child.content !== ' ') {
						callArgs.push(child)
					}

					if (getConstantType(child, context) === ConstantTypes.NOT_CONSTANT) {
						callArgs.push(
							PatchFlags.TEXT
						)
					}

					children[i] = {
						type: NodeTypes.TEXT_CALL,
						content: child,
						loc: child.loc,
						codegenNode: createCallExpression(
							context.helper(CREATE_TEXT),
							callArgs
						)
					}
				}
			}
		}
	}
}