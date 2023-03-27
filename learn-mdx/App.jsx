import "@code-hike/mdx/styles"
import sideBarImg from '/sidebar.png'
import CreateAppAndVNode from './steps/createAppAndVNode/index'
import Patch from './steps/patch'
import { useState } from "react"

function App() {
	const blogList = [
		'',
		'createApp-初始化渲染',
		'patch-复杂渲染处理'
	]
	const [active, setActive] = useState(1)

	const scrollToTop = () => {
		const scrollTop = document.scrollingElement.scrollTop
		if (scrollTop > 0) {
			window.requestAnimationFrame(scrollToTop)
			window.scrollTo(0, scrollTop - scrollTop / 5)
		}
	}

	const changePage = (num) => {
		setActive(num)
		scrollToTop()
	}
  return (
		<div className="min-h-screen antialiased text-slate-400 bg-slate-900">
			{/* <div>
				<div className="absolute top-6 left-8 right-8 flex items-center justify-between text-xl text-slate-200">
					<div className="flex items-center">
						<img src={sideBarImg} className="w-[25px] opacity-70 cursor-pointer hover:opacity-100"/>
					</div>
					<div className="flex items-center ml-6 pl-6">
						<a
							href="https://github.com/code-hike/not-tailwind"
							className="ml-6 block text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
						>
							<span className="sr-only">GitHub</span>
							<svg
								viewBox="0 0 16 16"
								className="w-5 h-5"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
							</svg>
						</a>
					</div>
				</div>
			</div> */}
			<div className="max-w-[1200px] mx-auto">
				{ active === 1 && <CreateAppAndVNode />}
				{ active === 2 && <Patch />}
				<div className="flex justify-between mt-20 text-cyan-50 text-xl">
					{
						blogList[active - 1]
							? <div className="cursor-pointer hover:text-green-300" onClick={() => changePage(active - 1)}>
									{`上一篇：${blogList[active - 1]}`}
								</div>
							: <div />
					}
					{
						blogList[active + 1] &&
							<div className="cursor-pointer hover:text-green-300" onClick={() => changePage(active + 1)}>
								{`下一篇：${blogList[active + 1]}`}
							</div>
					}
				</div>
				<div className="h-[30vh] flex justify-end items-end pb-20 text-cyan-50 text-2xl">
					By 一路有晴天
				</div>
			</div>
		</div>
  )
}

export default App