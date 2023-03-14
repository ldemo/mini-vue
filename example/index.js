import { reactive } from "../src/reactive"
import { h } from "../src/runtime-core"
import { createApp } from '../src/runtime-dom'

const Comp = {
	props: ['user'],
	setup(props) {
		console.log(props.user.name)
	},

	render() {
		return h('div', { style: { padding: '10px' } }, this.user.name)
	}
}

createApp({
	setup() {
		let user = reactive({
			name: 'hello world'
		})
		const changeName = () => {
			user.name = 'name changed'
		}
		return {
			user,
			changeName
		}
	},
	render() {
		return h(
			'div',
			{ padding: '20px' },
			h(
				Comp,
				{
					user: this.user,
					id: '3',
					onClick: this.changeName
				}
			)
		)
			
	}
}).mount('#root')