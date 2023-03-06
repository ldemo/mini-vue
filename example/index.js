import { reactive } from "../src/reactive"
import { h } from "../src/runtime-core"
import { createApp } from '../src/runtime-dom'

createApp({
	setup() {
		let user = reactive({
			name: 'hello world'
		})
		return {
			user
		}
	},
	render() {
		return h('div', null, [
			h('div', {
				class: 'red',
				style: {
					fontSize: '24px'
				},
				onClick: () => this.user.name = 'data changed'
			}, this.user.name)
		])
	}
}).mount('#root')