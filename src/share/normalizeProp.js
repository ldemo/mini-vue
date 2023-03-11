import { isArray, isObject, isString } from "."

export const normalizeClass = (value) => {
	let res = ''
	if (isString(value)) {
		res = value
	} else if (isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			const normalized = normalizeClass(value[i])
			normalized && (res += `${normalized} `)
		}
	} else if (isObject(value)) {
		for (const name in value) {
			if (value[name]) {
				res += normalized + ' '
			}
		}
	}

	return res.trim()
}

export const normalizeStyle = (value) => {
	if (isArray(value)) {
		const res = {}
		for (let i = 0; i < value.length; i++) {
			const item = value[i]
			const normalized = isString(item)
				? parseStringtyle(item)
				: normalizeStyle(item)

			if (normalized) {
				for (const key in normalized) {
					res[key] = normalized[key]
				}
			}
		}

		return res
	} else if (isString(value) || isObject(value)) {
		return value
	}
}

export const parseStringStyle = (cssText) => {
	let ret = {}

	cssText.split(';').forEach(item => {
		if (item) {
			const [k, v] = item.split(/:([^]+)/)
			v !== undefined && (ret[k.trim()] = v.trim())
		}
	})

	return ret
}