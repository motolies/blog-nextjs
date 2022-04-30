import {CATEGORY_FLAT_REQUEST, CATEGORY_TREE_REQUEST} from '../types/categoryTypes'

export const getCategoryFlatAction = () => ({
    type: CATEGORY_FLAT_REQUEST
})
export const getCategoryTreeAction = () => ({
    type: CATEGORY_TREE_REQUEST
})