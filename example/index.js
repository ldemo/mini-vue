import { reactive } from "../src/reactive"
import { h } from "../src/runtime-core"
import { createApp } from '../src/runtime-dom'

const Comp = {
	props: ['count'],
	emits: ['subCount'],
	setup(props, { emit }) {
		setTimeout(() => {
			console.log('comp sub count')
			emit('subCount')
		}, 2000)
	},

	render() {
		console.log('comp render')
		return h('div', { style: { padding: '10px' } }, `点击次数 ${this.count}`)
	}
}

createApp({
	setup() {
		let user = reactive({
			count: 0
		})
		const addCount = () => {
			user.count++
		}
		const subCount = () => {
			console.log('sub count')
			user.count--
		}
		return {
			user,
			addCount,
			subCount
		}
	},
	render() {
		return h(
			'div',
			{ padding: '20px', id: '1' },
			h(
				Comp,
				{
					count: this.user.count,
					onClick: () => this.user.count++,
					onSubCount: this.subCount
				}
			)
		)
			
	}
}).mount('#root')