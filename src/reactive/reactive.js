import { track, trigger } from "./effect"

const proxyMap = new WeakMap()

export const reactive = (target) => {
	if (proxyMap.get(target)) {
		return proxyMap.get(target)
	}

	return proxyMap[target] = new Proxy(target, {
		get(target, key, receiver) {
			console.log('get', key)
			const res = Reflect.get(target, key, receiver)
			track(target, key)
			return res
		},

		set(target, key, val) {
			console.log('set', val)
			const res = Reflect.set(target, key, val)
			trigger(target, key)
			return res
		}
	})
}
