import { ConstantsType, NodeTypes } from "../ast";

export const getConstantType = (node, context) => {
	switch(node.type) {
		case NodeTypes.TEXT:
			return ConstantsType.CAN_STRINGIFY
		case NodeTypes.INTERPOLATION:
			return getConstantType(node.content, context)
		case NodeTypes.SIMPLE_EXPRESSION:
			return node.constType
		default:
			return ConstantsType.NOT_CONSTANT
	}
}