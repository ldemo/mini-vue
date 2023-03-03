import { reactive } from "../reactive"
import { h } from "../runtime-core"
import { createApp } from '../runtime-dom'

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
			h('div', null, this.user.name)
		])
	}
}).mount('#root')