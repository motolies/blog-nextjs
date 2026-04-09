export interface Category {
  id: string
  name: string
  parentId: string | null
}

export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[]
}
