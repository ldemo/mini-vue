import { isString } from "../../share"

export const patchStyle = (el, prev, next) => {
	const style = el.style
	const isCssString = isString(style)

	if (next && !isCssString) {
		if(prev && !isString(prev)) {
			for (const key in prev) {
				next[key] === null && setStyle(style, key, '')
			}
		}
		for (const key in next) {
			setStyle(style, key, next[key])
		}
	} else {
		if (isCssString) {
			style.cssText = next
		} else if (prev) {
			el.removeAttribute('style')
		}
	}
}

const setStyle = (style, key, val) => {
	// 简单处理
	style[key] = val
}