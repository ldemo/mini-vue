import { track, trigger } from "./effect"
const ReactiveFlags = {
	RAW: '__v_raw'
}
const proxyMap = new WeakMap()

export const reactive = (target) => {
	if (proxyMap.get(target)) {
		return proxyMap.get(target)
	}

	return proxyMap[target] = new Proxy(target, {
		get(target, key, receiver) {
			if (key === ReactiveFlags.RAW) {
      	return target
			}

			const res = Reflect.get(target, key, receiver)
			track(target, key)
			return res
		},

		set(target, key, val) {
			const res = Reflect.set(target, key, val)
			trigger(target, key)
			return res
		}
	})
}

export const toRaw = (observed) => observed && observed[ReactiveFlags.RAW] || observed
