import { hasOwn } from "../share"

export const PublicInstanceProxyHandler = {
	get({ _: instance }, key) {
		const { setupState, propsOptions, props } = instance
		let [normalizedProps] = propsOptions
		if (hasOwn(setupState, key)) {
			return setupState[key]
		} else if (hasOwn(normalizedProps, key)) {
			return props[key]
		}
	}
}