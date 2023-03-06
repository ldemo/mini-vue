export const patchStyle = (el, prev, next) => {
	const style = el.style
	if (!next) return

	for(const key in (prev || {})) {
		next[key] === null && setStyle(style, key, '')
	}
	
	for(const key in next) {
		setStyle(style, key, next[key])
	}
}

const setStyle = (style, key, val) => {
	// 简单处理
	style[key] = val
}