import { extend, isArray, isOn, toHandlerKey } from "../share"

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

export function isEmitListener(
  options,
  key
) {
  if (!options || !isOn(key)) {
    return false
  }

  key = key.slice(2)
  return (
    hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
    hasOwn(options, key)
  )
}
