import { reactive } from "../src/reactive"
import { h } from "../src/runtime-core"
import { createApp } from '../src/runtime-dom'

createApp({
	setup() {
		let user = reactive({
			name: 'hello world'
		})
		let shouldUpdate = reactive({
			value: false
		})
		return {
			user,
			shouldUpdate
		}
	},
	render() {
		return !this.shouldUpdate.value
			? h('div', {
					onClick: () => this.shouldUpdate.value = true
				}, [1, 2, 3, 4].map(v => h('div', { key: v }, v)))
			: h('div', {
					onClick: () => this.shouldUpdate.value = false
				}, [1, 2, 5, 6, 3].map(v => h('div', { key: v }, v)))
	}
}).mount('#root')