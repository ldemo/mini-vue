export const PatchFlag = {
	TEXT: 1,
	CLASS: 1 << 1,
	STYLE: 1 << 2,
	PROPS: 1 << 3,
	FULL_PROPS: 1<< 4,
	HYDRATE_EVENT: 1 << 5,
	STABLE_FRAGMENT: 1 << 6,
	KEYED_FRAGMENT: 1 << 7,
	UNKEYED_FRAGMENT: 1 << 8,
	NEED_PATCH: 1 << 9,
	HOSITED: -1,
	BAIL: -2
}