import {TreeItem, TreeView} from '@mui/lab'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {getCategoryTreeAction} from "../store/actions/categoryActions"


export default function CategoryTreeView() {
    const dispatch = useDispatch()
    const categoryState = useSelector((state) => state.category.categoryTree)
    const [selectCategory, setSelectCategory] = useState({})

    useEffect(() => {
        dispatch(getCategoryTreeAction())
    }, [])

    useEffect(() => {
        setSelectCategory(categoryState)
    }, [categoryState])


    const renderTree = (nodes) => (
        <TreeItem
            key={nodes.id}
            nodeId={nodes.id ? nodes.id : "defaultNodeId"}
            label={nodes.name}>

            {Array.isArray(nodes.children)
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </TreeItem>
    )

    // TODO: defaultExpanded 옵션이 잘 동작하지 않는 것 같다?
    return (
        <TreeView
            aria-label="rich object"
            defaultCollapseIcon={<ExpandMoreIcon/>}
            defaultExpanded={['ROOT']}
            defaultExpandIcon={<ChevronRightIcon/>}
            multiSelect={true}
            sx={{flexGrow: 1, minWidth: 400}}
        >
            {renderTree(selectCategory)}
        </TreeView>
    )
}