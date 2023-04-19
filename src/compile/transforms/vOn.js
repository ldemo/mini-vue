import { camelize, toHandlerKey } from "../../share"
import { createCompoundExpression, createObjectProperty, createSimpleExpression, ElementTypes, NodeTypes } from "../ast"

export const transformOn = (dir, node, context) => {
	const { loc, arg } = dir
	let eventName

	if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
		if (arg.isStatic) {
			let rawName = arg.content
			const eventString =
        node.tagType !== ElementTypes.ELEMENT
					? toHandlerKey(camelize(rawName))
					: `on:${rawName}`
			eventName = createSimpleExpression(eventString, true, arg.loc)
		}
	}

	let exp = dir.exp
	if (exp) {

	}

	let ret = {
    props: [
      createObjectProperty(
        eventName,
        exp
      )
    ]
  }

	ret.props.forEach(p => (p.key.isHandlerKey = true))
	return ret
}