import { createDep } from "./dep"

export let activeEffect = undefined
export let shouldTrack = true
const trackStack = []

const targetMap = window.targetMap = new WeakMap()

export const track = (target, key) => {
	if (shouldTrack && activeEffect) {
		let depsMap = targetMap.get(target)
		if (!depsMap) {
			targetMap.set(target, (depsMap = new Map()))
		}

		let dep = depsMap.get(key)

		if (!dep) {
			depsMap.set(key, (dep = createDep()))
		}

		if (!dep.has(activeEffect)) {
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

	deps.forEach(v => {
		if (v === activeEffect) return
		v.scheduler ? v.scheduler() : v.run()
	})
}

export class ReactiveEffect {
	deps = []
	_fn = null
	scheduler = null

	constructor(fn, scheduler) {
		this._fn = fn
		this.scheduler = scheduler
	}

	run() {
		activeEffect = this
		this._fn()
		activeEffect = null
	}
}

export const pauseTracking = () => {
  trackStack.push(shouldTrack)
  shouldTrack = false
}

export const resetTracking = () => {
	let last = trackStack.pop()
	shouldTrack = last !== undefined ? last : true
}
