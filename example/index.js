import { reactive } from "../src/reactive"
import { h } from "../src/runtime-core"
import { createApp } from '../src/runtime-dom'

const Comp = {
	props: ['count', 'msg'],
	emits: ['subCount'],
	setup(props, { emit }) {
		setTimeout(() => {
			console.log('comp sub count')
			emit('subCount')
		}, 2000)
	},

	render() {
		console.log('comp render')
		return h('div', { style: { padding: '10px' } }, `${this.msg.value} 点击次数 ${this.count}`)
	}
}

createApp({
	setup() {
		let user = reactive({
			count: 1
		})
		let msg = reactive({
			value: 'hello'
		})
		const handleCompClick = () => {
			msg.value = 'hello' + ++user.count
		}
		const subCount = () => {
			console.log('sub count')
			user.count--
		}
		return {
			user,
			msg,
			handleCompClick,
			subCount
		}
	},
	render() {
		return h(
			'div',
			{ padding: '20px', id: '1' },
			[
				h(
					Comp,
					{
						count: this.user.count,
						msg: this.msg,
						onClick: this.handleCompClick,
						onSubCount: this.subCount
					}
				)
			]
		)
			
	}
}).mount('#root')