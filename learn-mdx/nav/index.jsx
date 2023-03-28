import { useRef } from "react";
import { motion, useCycle } from "framer-motion";
import { useDimensions } from "./use-dimensions.js";

const sidebar = {
  open: (height = 1000) => ({
    clipPath: `circle(${height * 2 + 200}px at 60px 60px)`,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2
    }
  }),
  closed: {
    clipPath: "circle(24px at 60px 40px)",
    transition: {
      delay: 0.1,
      type: "spring",
      stiffness: 400,
      damping: 40
    }
  }
};

const Path = props => (
  <motion.path
    fill="transparent"
    strokeWidth="3"
    stroke="hsl(183, 100%, 96%)"
    strokeLinecap="round"
    {...props}
  />
)

export default (props) => {
  const [isOpen, toggleOpen] = useCycle(false, true)
  const containerRef = useRef(null)
  const { height } = useDimensions(containerRef)
	
  return (
    <motion.nav
			className="fixed top-0 left-0 bottom-0 w-64 z-10"
      initial={false}
      animate={isOpen ? "open" : "closed"}
      custom={height}
      ref={containerRef}
    >
      <motion.div
				className="fixed top-0 left-0 bottom-0 w-64 bg-slate-800 bg-opacity-80 shadow-[2px_0_8px_-6px_rgba(255,255,255,1)]"
				variants={sidebar}
			/>
      <motion.ul
				className="fixed top-24 p-6 z-10 list-none"
				variants={{
					open: {
						transition: { staggerChildren: 0.07, delayChildren: 0.05}
					},
					closed: {
						transition: { staggerChildren: 0.05, staggerDirection: -1 }
					}
				}}
			>
				{props.articles?.map((item, i) => (
					<motion.li
						key={i}
						onClick={() => {
							props.setActive(i)
							toggleOpen()
						}}
						className={`mb-5 flex justify-start items-center text-lg cursor-pointer ${item.path === props.active ? 'text-green-300' : 'text-cyan-50'}`}
						variants={{
							open: {
								y: 0,
								opacity: 1,
								transition: {
									y: { stiffness: 1000, velocity: -100 }
								}
							},
							closed: {
								y: 50,
								opacity: 0,
								transition: {
									y: { stiffness: 1000 }
								}
							}
						}}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.95 }}
					>
						<div>{item.name}</div>
					</motion.li>
				))}
			</motion.ul>
			<div
				className="fixed left-[49px] top-[30px] cursor-pointer w-10 h-10 rounded-full bg-transparent"
				onClick={toggleOpen}
			>
				<svg width="23" height="23" viewBox="0 0 23 23">
					<Path
						variants={{
							closed: { d: "M 2 2.5 L 20 2.5" },
							open: { d: "M 3 16.5 L 17 2.5" }
						}}
					/>
					<Path
						d="M 2 9.423 L 20 9.423"
						variants={{
							closed: { opacity: 1 },
							open: { opacity: 0 }
						}}
						transition={{ duration: 0.1 }}
					/>
					<Path
						variants={{
							closed: { d: "M 2 16.346 L 20 16.346" },
							open: { d: "M 3 2.5 L 17 16.346" }
						}}
					/>
				</svg>
			</div>
    </motion.nav>
  );
};
