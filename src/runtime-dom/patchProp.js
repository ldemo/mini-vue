import { isOn } from "../share"
import { patchAttr } from "./modules/attrs"
import { patchClass } from "./modules/class"
import { patchEvent } from "./modules/events"
import { patchStyle } from "./modules/style"

export const patchProp = (
	el,
	key,
	prevVal,
	nextVal
) => {
	if (key === 'class') {
		patchClass(el, nextVal)
	} else if (key === 'style') {
		patchStyle(el, prevVal, nextVal)
	} else if (isOn(key)) {
		patchEvent(el, key, prevVal, nextVal)
  } else {
		patchAttr(el, key, nextVal)
	}
}