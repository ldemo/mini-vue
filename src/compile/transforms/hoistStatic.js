import { ConstantTypes, NodeTypes } from "../ast";

export const getConstantType = (node, context) => {
	switch(node.type) {
		case NodeTypes.ELEMENT:
			if (node.tagType !== ElementTypes.ELEMENT) {
        return ConstantTypes.NOT_CONSTANT
      }
		case NodeTypes.TEXT:
			return ConstantTypes.CAN_STRINGIFY
		case NodeTypes.INTERPOLATION:
			return getConstantType(node.content, context)
		case NodeTypes.SIMPLE_EXPRESSION:
			return node.constType
		case NodeTypes.COMPOUND_EXPRESSION:
			let returnType = ConstantTypes.CAN_STRINGIFY
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i]
				if (isString(child)) {
					continue
				}
				const childType = getConstantType(child, context)
				if (childType === ConstantTypes.NOT_CONSTANT) {
					return ConstantTypes.NOT_CONSTANT
				} else if (childType < returnType) {
					returnType = childType
				}
			}
			return returnType
		default:
			return ConstantTypes.NOT_CONSTANT
	}
}