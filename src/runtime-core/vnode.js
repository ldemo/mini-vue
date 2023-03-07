import { isArray, isObject, isString, ShapeFlag } from "../share"

export const Text = Symbol('Text')

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
		key: props && props.key || null,
		type,
		shapeFlag,
		props,
		children
	}

	normalizeChildren(vnode, children)

	return vnode
}

export function createTextVNode(text) {
	return createVNode(Text, null, text)
}

export function normalizeChildren(vnode, children) {
	let type = 0 

	if (isArray(children)) {
		type = ShapeFlag.ARRAY_CHILDREN
	} else if (isString(children)) {
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

export const isSameTypeNode = (n1, n2) => n1.type === n2.type && n1.key === n2.key
