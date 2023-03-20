import { reactive } from "../src/reactive"
import { createBlock, createVNode, Fragment, h, openBlock } from "../src/runtime-core"
import { renderList } from "../src/runtime-core/helpers/renderList"
import { createApp } from '../src/runtime-dom'
import { PatchFlag } from "../src/share/patchFlag"

const Comp = {
	props: ['msg', 'count'],
	setup(props) {
		return () => h('div', { style: { padding: '10px' } }, `${props.msg.value} 点击次数 ${props.count}`)
	}
}

createApp({
	setup() {
		let user = reactive({
			count: 1
		})
		const list = reactive([1, 2])
		let msg = reactive({
			value: 'red'
		})
		setTimeout(() => {
			msg.value = 'green'
			list.push(3)
			list.shift()
		}, 1000);
		return () => (openBlock(), createBlock('div', { id: 1 }, [
			createVNode('div', { id: 2, style: { color: msg.value }}, [
				createVNode('div', { id: 3 }, [
					(openBlock(true), createBlock(Fragment, null, renderList(list, (i, index) => {
						return createVNode('span', { key: i, c: index }, i, PatchFlag.TEXT | PatchFlag.PROPS, ['c'])
					}), PatchFlag.KEYED_FRAGMENT))
				])
			], PatchFlag.STYLE)
		]))
	},
}).mount('#root')