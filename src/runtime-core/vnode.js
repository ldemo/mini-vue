import { isArray, isNumber, isObject, isOn, isString, ShapeFlag } from "../share"
import { normalizeClass, normalizeStyle } from "../share/normalizeProp"

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function createVNode(
	type,
	props,
	children = null
) {

	const shapeFlag = isString(type)
		? ShapeFlag.ELEMENT
		: isObject(type)
			? ShapeFlag.STATEFUL_COMPONENT
			: 0

	const vnode = {
		__v_isVNode: true,
		key: props && props.key || null,
		type,
		shapeFlag,
		props,
		children
	}

	normalizeChildren(vnode, children)

	return vnode
}

export const isVNode = (vnode) => !!vnode.__v_isVNode

export function createTextVNode(text) {
	return createVNode(Text, null, text)
}

export function normalizeChildren(vnode, children) {
	let type = 0 

	if (isArray(children)) {
		type = ShapeFlag.ARRAY_CHILDREN
	} else if (isString(children) || isNumber(children)) {
		type = ShapeFlag.TEXT_CHILDREN
	}

	vnode.children = children
	vnode.shapeFlag |= type
}

export function normalizeVNode(child) {
	if (isObject(child)) {
		return child
	} else if (isArray(child)) {
		createVNode(Fragment, null, child.slice())
	} else {
		return createVNode(Text, null, String(child))
	}
}

export const isSameVNodeType = (n1, n2) => n1.type === n2.type && n1.key === n2.key

export const cloneVNode = (vnode, extraProps) => {
	const { props } = vnode
	const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props

	return {
		...vnode,
		props: mergedProps
	}
}

export const mergeProps = (...args) => {
	let ret = {}
	for (let i = 0; i < args.length; i++) {
		const toMerge = args[i]
		for (const key in toMerge) {
			if (key === 'class' && toMerge[key] !== ret[key]) {
				ret.class = normalizeClass([ret.class, toMerge.class])
			} else if (key === 'style') {
				ret.style = normalizeStyle([ret[key], toMerge[key]])
			} else if (isOn(key)) {
				const exsit = ret[key]
				const incoming = toMerge[key]

				if (incoming && exsit !== incoming && !(isArray(exsit) && exsit.includes(incoming))) {
					ret[key] = exsit
						? [].concat(exsit, incoming)
						: incoming
				}
			} else if (key !== ''){
				ret[key] = toMerge[key]
			}
		}
	}
	return ret
}