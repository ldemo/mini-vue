const queue = []
let flushIndex = 0
let isFlushing = false
let isFlushPending = false
const resolvedPromise = Promise.resolve()

export const queueJob = (job) => {
	if (
		!queue.length ||
		!queue.includes(job)
	) {
		if (job.id == null) {
			queue.push(job)
		} else {
			queue.splice(findInsertionIndex(job.id), 0, job)
		}
		queueFlush()
	}

}

const queueFlush = () => {
	if (!isFlushPending && !isFlushing) {
		isFlushPending = true
		resolvedPromise.then(flushJob)
	}
}

const flushJob = () => {
	isFlushPending = false
	isFlushing = true

	// Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child so its render effect will have smaller
  //    priority number)
  // 2. If a component is unmounted during a parent component's update,
  //    its update can be skipped.
	queue.sort(comparator)

	try {
		for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
			const job = queue[flushIndex]

			if (job) {
				job()
			}
		}
	} finally {
		flushIndex = 0
		queue.length = 0
		
		isFlushing = false
	}

}

export function invalidateJob(job) {
  const i = queue.indexOf(job)
  if (i > flushIndex) {
    queue.splice(i, 1)
  }
}

const comparator = (a, b) => {
  const diff = getId(a) - getId(b)
  if (diff === 0) {
    if (a.pre && !b.pre) return -1
    if (b.pre && !a.pre) return 1
  }
  return diff
}

const findInsertionIndex = (id) => {
	let start = flushIndex + 1
	let end = queue.length

	while(start < end) {
		const middle = (start + end) >>> 1
		const middleJobId = getId(queue[middle])
		middleJobId < id ? (start = middle + 1) : (end = middle)
	}

	return start
}

const getId = (job) => job.id == null ? Infinity : job.id