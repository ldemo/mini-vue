import { camelize, isArray } from "../share"

export function normalizePropsOption (comp) {
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