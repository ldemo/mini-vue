import { createDep } from "./dep"

export let activeEffect = undefined

const targetMap = new WeakMap()

export const track = (target, key) => {
	if (activeEffect) {
		let depsMap = targetMap.get(target)
		if (!depsMap) {
			targetMap.set(target, (depsMap = new Map()))
		}

		let dep = depsMap.get(key)

		if (!dep) {
			depsMap.set(key, (dep = createDep()))
		}
		if (activeEffect && !dep.has(activeEffect)) {
			dep.add(activeEffect)
			activeEffect.deps.push(dep)
		}

	}
}

export const trigger = (target, key) => {
	const depsMap = targetMap.get(target)
	if (!depsMap) return

	const deps = depsMap.get(key)
	if (!deps) return

	deps.forEach(v => v.run())
}

export class ReactiveEffect {
	deps = []
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