import { isArray, isNumber, isObject, isOn, isString, ShapeFlag } from "../share"
import { normalizeClass, normalizeStyle } from "../share/normalizeProp"

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function createVNode(
	type,
	props,
	children = null,
	patchFlag,
	dynamicProps,
	isBlockNode = false
) {

	const shapeFlag = isString(type)
		? ShapeFlag.ELEMENT
		: isObject(type)
			? ShapeFlag.STATEFUL_COMPONENT
			: 0

	return createBaseVNode(
		type,
		props,
		children,
		patchFlag,
		dynamicProps,
		shapeFlag,
		isBlockNode
	)
}

export const createBaseVNode = (
	type,
	props,
	children,
	patchFlag = 0,
	dynamicProps = null,
	shapeFlag,
	isBlockNode
) => {
	const vnode = {
		__v_isVNode: true,
		key: props && props.key || null,
		type,
		shapeFlag,
		props,
		children,

		patchFlag,
		dynamicProps
	}

	normalizeChildren(vnode, children)

	if (
		!isBlockNode &&
		currentBlock &&
		vnode.patchFlag > 0
	) {
		currentBlock.push(vnode)
	}

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

export const blockStack = []
export let currentBlock = null

export const openBlock = (disableTracking = false) => {
	blockStack.push(currentBlock = disableTracking ? null : [])
}

export const closeBlock = () => {
	blockStack.pop()
	currentBlock = blockStack[blockStack.length - 1] || null
}

export const setupBlock = (vnode) => {
	vnode.dynamicChildren = currentBlock || null

	closeBlock()
	if (currentBlock) {
		currentBlock.push(vnode)
	}

	return vnode
}

export const createBlock = (
	type,
	props,
	children,
	patchFlag,
	dynamicProps
) => {
	return setupBlock(
		createVNode(
			type,
			props,
			children,
			patchFlag,
			dynamicProps,
			true
		)
	)
}