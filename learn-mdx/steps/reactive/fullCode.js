let activeEffect = undefined
const targetMap = new WeakMap()

const track = (target, key) => {
	if (activeEffect) {
		let depsMap = targetMap.get(target)
		if (!depsMap) {
			targetMap.set(target, (depsMap = new Map()))
		}

		let dep = depsMap.get(key)

		if (!dep) {
			depsMap.set(key, (dep = new Set()))
		}

		if (!dep.has(activeEffect)) {
			dep.add(activeEffect)
		}
	}
}

const trigger = (target, key) => {
	const depsMap = targetMap.get(target)
	if (!depsMap) return

	const deps = depsMap.get(key)
	if (!deps) return

	deps.forEach(v => v.run())
}

class ReactiveEffect {
	_fn = null

	constructor(fn) {
		this._fn = fn
	}

	run() {
		activeEffect = this
		this._fn()
		activeEffect = null
	}
}

const proxyMap = new WeakMap()
const reactive = (target) => {
	if (proxyMap.get(target)) {
		return proxyMap.get(target)
	}

	let proxy = new Proxy(target, {
		get(target, key, receiver) {
			const res = Reflect.get(target, key, receiver)
			track(target, key)
			return res
		},

		set(target, key, val, receiver) {
			const res = Reflect.set(target, key, val, receiver)
			trigger(target, key)
			return res
		}
	})

	proxyMap.set(target, proxy)
	return proxy
}