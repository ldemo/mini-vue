import "@code-hike/mdx/styles"
import First from './steps/first/index'

function App() {
  return (
		<div className="min-h-screen pt-px antialiased text-slate-400 bg-slate-900">
			<div className="max-w-[1200px] mx-auto">
				<div className="h-screen flex justify-center items-center text-cyan-50 text-9xl">
					hello Vue
				</div>
				<First />
				<div className="h-[40vh] flex justify-end items-end pb-20 text-cyan-50 text-2xl">
					By 一路有晴天
				</div>
			</div>
		</div>
  )
}

export default App