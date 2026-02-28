import CategoryTreeView from "../../components/CategoryTreeView"
import {Plus, Save, Trash2} from 'lucide-react'
import {useState} from "react"
import {getTsid} from 'tsid-ts'
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import DeleteConfirm from "../../components/confirm/DeleteConfirm"
import {toast} from 'sonner'
import service from "../../service"
import {useDispatch} from "react-redux"
import {getCategoryFlatAction, getCategoryTreeAction} from "../../store/actions/categoryActions"
import {Button} from "../../components/ui/button"
import {Input} from "../../components/ui/input"
import {Label} from "../../components/ui/label"
import AdminPageFrame from "../../components/layout/admin/AdminPageFrame"
import {isSameEntityId} from "../../lib/combobox"


const initCategory = {
    id: 'NEW',
    name: '',
    parentId: 'ROOT'
}

export default function CategoriesPage() {
    const dispatch = useDispatch()

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [question, setQuestion] = useState('')
    const [category, setCategory] = useState(initCategory)
    const [isEditing, setIsEditing] = useState(false)

    const addNewCategory = () => {
        const newCategory = {...initCategory, ...{parentId: category.id}}
        setCategory(newCategory)
        setIsEditing(true)
    }

    const onChangeCategory = (category) => {
        setIsEditing(false)
        setCategory(category)
    }

    const onChangeParentCategory = (parentCategory) => {
        if (isSameEntityId(parentCategory?.id, category.id)) {
            toast.error("동일 카테고리는 부모 카테고리에 설정할 수 없습니다.")
            return
        }
        if (parentCategory !== null)
            setCategory({...category, parentId: parentCategory.id})
    }

    const onSaveCategory = async () => {
        try {
            if (category.id === 'NEW') {
                await service.category.save({category})
                toast.success("카테고리가 저장되었습니다.")
            } else {
                await service.category.update({category})
                toast.success("카테고리가 수정되었습니다.")
            }
            setIsEditing(false)
            refresh()
        } catch (error) {
            if (category.id === 'NEW') {
                toast.error("카테고리 저장에 실패하였습니다.")
            } else {
                toast.error("카테고리 수정에 실패하였습니다.")
            }
        }
    }

    const refresh = () => {
        dispatch(getCategoryFlatAction())
        dispatch(getCategoryTreeAction())
    }

    const onDeleteCategory = () => {
        if (category.name.trim() === '') return
        if (!isEditing) {
            setQuestion(`${category.name} 카테고리를 삭제하시겠습니까?`)
            setShowDeleteConfirm(true)
        } else {
            setCategory(initCategory)
            setIsEditing(false)
        }
    }

    const deleteCategory = async () => {
        setShowDeleteConfirm(false)
        await service.category.delete({id: category.id}).then(() => {
            toast.success("카테고리가 삭제되었습니다.")
            setCategory(initCategory)
            refresh()
        }).catch(() => {
            toast.error("카테고리 삭제에 실패하였습니다.")
        })
    }

    return (
        <AdminPageFrame>
            <div className="admin-split-layout admin-fill" data-size="wide">
                <div className="admin-panel admin-panel-pad admin-fill overflow-hidden">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Tree View</p>
                            <h2 className="mt-1 text-lg font-semibold text-[color:var(--admin-text)]">카테고리 구조</h2>
                        </div>
                        <span className="admin-pill">
                            선택 후 우측 패널에서 수정
                        </span>
                    </div>

                    <div className="admin-fill min-h-[28rem]">
                        <CategoryTreeView onChangeCategory={onChangeCategory}/>
                    </div>
                </div>

                <div className="admin-panel admin-panel-pad space-y-4 lg:sticky lg:top-0">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Inspector</p>
                        <h2 className="mt-1 text-lg font-semibold text-[color:var(--admin-text)]">카테고리 상세</h2>
                    </div>

                    <h3 className="text-sm text-[color:var(--admin-text-muted)]">
                        #status{isEditing ? '(new)' : '(modify)'}
                    </h3>

                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={addNewCategory} aria-label="추가">
                            <Plus className="h-5 w-5"/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onSaveCategory} aria-label="저장">
                            <Save className="h-5 w-5"/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onDeleteCategory} aria-label="삭제">
                            <Trash2 className="h-5 w-5"/>
                        </Button>
                    </div>

                    <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                            <Label>Id (자동 생성)</Label>
                            <Input
                                disabled
                                value={category.id}
                                onChange={(e) => setCategory({...category, id: e.target.value})}
                            />
                        </div>
                        <CategoryAutoComplete onChangeCategory={onChangeParentCategory} setCategoryId={category.parentId} label={'Parent Category'}/>
                        <div className="space-y-1">
                            <Label>Name *</Label>
                            <Input
                                required
                                value={category.name}
                                onChange={(e) => setCategory({...category, name: e.target.value.trim()})}
                                placeholder="카테고리 이름"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirm open={showDeleteConfirm} question={question} onConfirm={deleteCategory} onCancel={() => setShowDeleteConfirm(false)}/>
        </AdminPageFrame>
    )
}
