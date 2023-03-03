import { isArray, isObject, isString, ShapeFlag } from "../share"

export function createVNode(
	type,
	props,
	children
) {

	const shapeFlag = isString(type)
		? ShapeFlag.ELEMENT
		: isObject(type)
			? ShapeFlag.STATEFUL_COMPONENT
			: 0

	const vnode = {
		type,
		shapeFlag,
		props,
		children
	}

	normalizeChildren(vnode, children)

	return vnode
}

export function createTextVNode(text) {
	return createVNode(Symbol('Text'), null, text)
}

export function normalizeChildren(vnode, children) {
	let type = 0 

	if (isArray(children)) {
		type = ShapeFlag.ARRAY_CHILDREN
	}else if (isString(children)) {
		type = ShapeFlag.TEXT_CHILDREN
	}

	vnode.shapeFlag |= type
}

export function normalizeVNode(child) {
	if (isObject(child)) {
		return child
	} else {
		return createVNode(Text, null, String(child))
	}
}