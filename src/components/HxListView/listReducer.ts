const  listReducer = (state: any,action: {[type: string]: any}) => {
	switch (action.type) {
		case 'setState':
			return {
				...state,
				...action.payload,
			};
		case 'setList':
			return {
				...state,
				list: action.payload,
			};
		case 'setFilter':
			return {
				...state,
				filter: {
					...state.filter,
					...action.payload,
				},
			};
		case 'setLoading':
			return {
				...state,
				isLoading: action.payload,
			};
		case 'setPullLoading':
			return {
				...state,
				pullIsLoading: action.payload,
			};
		case 'setMoreLoading':
			return {
				...state,
				isMoreLoading: action.payload,
			};
		case 'setHasMore':
			return {
				...state,
				hasMore: action.payload,
			};
		default:
			return state;
	}
}

export default listReducer;