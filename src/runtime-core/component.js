import { reactive } from "../reactive"
import { camelize, hasOwn, ShapeFlag } from "../share"
import { PublicInstanceProxyHandler } from "./componentPublicInstance"

export const setupComponent = (instance) => {
	const { props, children } = instance.vnode
	const isStateful = instance.vnode.shapeFlag & ShapeFlag.STATEFUL_COMPONENT

	initProps(instance, props)
	initSlots(instance, children)

	return isStateful ? setupStatefulComponent(instance): undefined
}

function setupStatefulComponent(instance) {
	const component = instance.type
	const { setup } = component
	
	instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandler)

	if (setup) {
		const setupContext = {}
		const setupResult = setup(instance.props, setupContext)
		handleSetupResult(instance, setupResult)
	} else {
		finishSetupComponent(instance)
	}
}

function handleSetupResult(instance, setupResult = {}) {
	instance.setupState = setupResult
	finishSetupComponent(instance)
}

// deal with render
function finishSetupComponent(instance) {
	if (!instance.render) {
		instance.render = instance.type.render
	}
}

function initProps(instance, rawProps = {}) {

	const props = {}
	const attrs = {}
	setFullProps(instance, rawProps, props, attrs)

	instance.attrs = attrs
	instance.props = reactive(props)
}

function initSlots() {}

const setFullProps = (instance, rawProps, props, attrs) => {
	const [options] = instance.propsOptions

	let hasAttrsChanged = false

	if (rawProps) {
		for(const key in rawProps) {
			const value = rawProps[key]

			let camelKey
			if (options && hasOwn(options, (camelKey = camelize(key)))) {
				props[camelKey] = value
			} else {
				if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value
          hasAttrsChanged = true
        }
			}
		}
	}

	return hasAttrsChanged
}