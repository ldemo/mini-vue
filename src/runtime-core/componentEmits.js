import { extend, isArray, toHandlerKey } from "../share"

export const normalizeEmitsOptions = (comp) => {

	const raw = comp.emits
	let normalized = {}

	if (isArray(raw)) {
		raw.forEach(key => normalized[key] = null)
	} else {
		extend(normalized, raw)
	}

	return normalized
}

export function emit (instance, event, ...rawArgs) {

	if (instance.isUnmounted) return
	const props = instance.vnode.props || {}

	let handler = props[toHandlerKey(event)]
	rawArgs ? handler(rawArgs) : handler()

}