import { toRaw } from "../reactive/reactive"
import { camelize, hasOwn, isArray } from "../share"
import { setFullProps } from "./component"

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

export const updateProps = (instance, nextProps, prevProps) => {
	const { props, attrs } = instance

	const rawCurrentProps = toRaw(props)

	// props
	setFullProps(instance, nextProps, props, attrs)

	for (const key in rawCurrentProps) {
		if (!nextProps || !hasOwn(nextProps, key)) {
			delete props[key]
		}
	}
}