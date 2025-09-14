import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FolderIcon from '@mui/icons-material/Folder'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import CategoryIcon from '@mui/icons-material/Category'
import { useDispatch, useSelector } from "react-redux"
import { useEffect, useState } from "react"
import { getCategoryTreeAction } from "../store/actions/categoryActions"
import { Box, Chip, Typography, styled } from '@mui/material'

// Styled components for better UI
const StyledTreeView = styled(TreeView)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    '& .MuiTreeItem-root': {
        marginBottom: '4px',
    },
    '& .MuiTreeItem-content': {
        borderRadius: '6px',
        padding: '8px 12px',
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
            transform: 'translateX(4px)',
        },
        '&.Mui-selected': {
            backgroundColor: theme.palette.primary.light,
            '&:hover': {
                backgroundColor: theme.palette.primary.light,
            },
        },
    },
    '& .MuiTreeItem-label': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        fontSize: '14px',
        fontWeight: 500,
    },
    '& .MuiTreeItem-group': {
        marginLeft: '20px',
        borderLeft: `2px solid ${theme.palette.divider}`,
        paddingLeft: '12px',
    },
}))

const CategoryLabel = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    '& .category-info': {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    '& .category-icon': {
        fontSize: '18px',
        color: theme.palette.primary.main,
    },
    '& .category-name': {
        fontSize: '14px',
        fontWeight: 500,
        color: theme.palette.text.primary,
    },
}))

const PostCountChip = styled(Chip)(({ theme }) => ({
    height: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    '& .MuiChip-label': {
        paddingLeft: '6px',
        paddingRight: '6px',
    },
}))

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


    const renderTree = (nodes, isExpanded = false) => {
        const hasChildren = Array.isArray(nodes.children) && nodes.children.length > 0;
        const CategoryIconComponent = hasChildren
            ? (isExpanded ? FolderOpenIcon : FolderIcon)
            : CategoryIcon;

        return (
            <TreeItem
                key={nodes.id}
                nodeId={nodes.id ? nodes.id : "defaultNodeId"}
                label={
                    <CategoryLabel>
                        <Box className="category-info">
                            <CategoryIconComponent className="category-icon" />
                            <Typography className="category-name">
                                {nodes.name}
                            </Typography>
                        </Box>
                        {nodes.postCount > 0 && (
                            <PostCountChip
                                label={nodes.postCount}
                                size="small"
                                variant="filled"
                            />
                        )}
                    </CategoryLabel>
                }
                category={nodes}
                onClick={() => {
                    onChangeCategory(nodes)
                }}
            >
                {hasChildren
                    ? nodes.children.map((node) => renderTree(node, expanded.includes(node.id)))
                    : null}
            </TreeItem>
        )
    }

    return (
        <StyledTreeView
            aria-label="category tree"
            defaultCollapseIcon={<ExpandMoreIcon/>}
            defaultExpanded={['ROOT']}
            expanded={expanded}
            onNodeToggle={(event, nodeIds) => {
                setExpanded(nodeIds);
            }}
            defaultExpandIcon={<ChevronRightIcon/>}
            multiSelect={false}
            sx={{
                flexGrow: 1,
                minWidth: 400,
                maxHeight: '70vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '4px',
                    '&:hover': {
                        background: '#a8a8a8',
                    },
                },
            }}
        >
            {categoryState && renderTree(categoryState)}
        </StyledTreeView>
    )
}