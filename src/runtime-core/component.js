import { hasOwn, ShapeFlag } from "../share"

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
	
	instance.proxy = new Proxy(instance.ctx, {
		get({ _: instance }, key) {
			const { setupState } = instance
			if (hasOwn(setupState, key)) {
				return setupState[key]
			}
		}
	})

	if (setup) {
		const setupContext = {}
		const setupResult = setup(instance.props, setupContext)
		handleSetupResult(instance, setupResult)
	} else {
		finishSetupComponent(instance)
	}
}

function handleSetupResult(instance, setupResult) {
	instance.setupState = setupResult
	finishSetupComponent(instance)
}

// deal with render
function finishSetupComponent(instance) {
	if (!instance.render) {
		instance.render = instance.type.render
	}
}

function initProps() {}
function initSlots() {}