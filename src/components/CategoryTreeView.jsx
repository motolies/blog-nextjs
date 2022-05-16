import {TreeView} from '@mui/lab'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {getCategoryTreeAction} from "../store/actions/categoryActions"
import TreeItem from "@mui/lab/TreeItem"


export default function CategoryTreeView({onChangeCategory}) {
    const dispatch = useDispatch()
    const [expanded, setExpanded] = useState([])
    const categoryState = useSelector((state) => state.category.categoryTree)

    useEffect(() => {
        dispatch(getCategoryTreeAction())
    }, [])

    useEffect(() => {
        // expand : 모든 ID를 가져와야 한다
        setExpanded(allCategoryIds(categoryState))
    }, [categoryState])

    const allCategoryIds = (rootObject) => {
        let ids = []
        ids.push(rootObject.id)
        if (rootObject.children) {
            rootObject.children.forEach(child => {
                ids = ids.concat(allCategoryIds(child))
            })
        }
        return ids
    }


    const renderTree = (nodes) => (
        <TreeItem
            key={nodes.id}
            nodeId={nodes.id ? nodes.id : "defaultNodeId"}
            label={nodes.name + ` (${nodes.contentCount})`}
            category={nodes}
            onClick={() => {
                onChangeCategory(nodes)
            }}
        >

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
            expanded={expanded}
            defaultExpandIcon={<ChevronRightIcon/>}
            multiSelect={true}
            sx={{flexGrow: 1, minWidth: 400}}
        >
            {renderTree(categoryState)}
        </TreeView>
    )
}