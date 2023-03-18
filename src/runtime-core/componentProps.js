import { toRaw } from "../reactive/reactive"
import { camelize, hasOwn, isArray } from "../share"
import { PatchFlag } from "../share/patchFlag"
import { setFullProps } from "./component"
import { isEmitListener } from "./componentEmits"

export function normalizePropsOptions (comp) {
	const raw = comp.props
	const normalized = {}

	if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i])
			normalized[normalizedKey] = {}
    }
  } else {
		for (const key in raw) {
			const normalizeKey = camelize(key)
			normalized[normalizeKey] = raw[key]
		}
	}

	return [normalized]
}

export const updateProps = (instance, nextProps, prevProps, optimized) => {
	const { props, attrs, vnode: { patchFlag } } = instance

	const [options] = instance.propsOptions

	const rawCurrentProps = toRaw(props)

	if (
		(optimized || patchFlag & PatchFlag.PROPS) &&
		!(patchFlag & PatchFlag.FULL_PROPS)
	) {
		const propsToUpdate = instance.vnode.dynamicProps
		for (let i = 0; i < propsToUpdate.length; i++) {
			const key = propsToUpdate[i]

			if (isEmitListener(instance.emitsOptions, key)) {
				continue
			}

			const value = nextProps[key]

			if (options) {
				if (hasOwn(attrs, key)) {
					if (value !== attrs[key]) {
						attrs[key] = value
					}
				} else {
					const camelizeKey = camelize(key)
					props[camelizeKey] = value
				}
			} else {
				if (hasOwn(attrs, key)) {
					if (value !== attrs[key]) {
						attrs[key] = value
					}
				}
			}

		}
	} else {
		// props
		setFullProps(instance, nextProps, props, attrs)
	
		for (const key in rawCurrentProps) {
			if (!nextProps || !hasOwn(nextProps, key)) {
				delete props[key]
			}
		}
	}

}