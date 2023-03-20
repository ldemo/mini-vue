import { isArray } from "../../share"

export const renderList = (source, renderItem) => {
	let ret = []
	if (isArray(source)) {
		for(let i = 0; i < source.length; i++) {
			ret[i] = renderItem(source[i], i)
		}
	}
	return ret
}