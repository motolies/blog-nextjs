import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FlaskConical, Trash2 } from 'lucide-react'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

const SAMPLE_DATA = [
  { id: 1, name: '김철수', email: 'kim@example.com', role: '관리자', status: 'active', score: 95 },
  { id: 2, name: '이영희', email: 'lee@example.com', role: '편집자', status: 'active', score: 88 },
  { id: 3, name: '박민수', email: 'park@example.com', role: '뷰어', status: 'inactive', score: 72 },
  { id: 4, name: '정수진', email: 'jung@example.com', role: '편집자', status: 'active', score: 91 },
  { id: 5, name: '최동훈', email: 'choi@example.com', role: '관리자', status: 'active', score: 85 },
  { id: 6, name: '한지민', email: 'han@example.com', role: '뷰어', status: 'inactive', score: 67 },
  { id: 7, name: '오세영', email: 'oh@example.com', role: '편집자', status: 'active', score: 79 },
  { id: 8, name: '윤서연', email: 'yoon@example.com', role: '뷰어', status: 'active', score: 93 },
  { id: 9, name: '강민호', email: 'kang@example.com', role: '관리자', status: 'inactive', score: 81 },
  { id: 10, name: '서지현', email: 'seo@example.com', role: '편집자', status: 'active', score: 76 },
  { id: 11, name: '임태우', email: 'lim@example.com', role: '뷰어', status: 'active', score: 88 },
  { id: 12, name: '황보라', email: 'hwang@example.com', role: '편집자', status: 'inactive', score: 64 },
]

let nextId = SAMPLE_DATA.length + 1

export default function DataTableTestPage() {
  const [data, setData] = useState(SAMPLE_DATA)
  const [modifiedIds, setModifiedIds] = useState(new Set())

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 70,
      mobileLabel: 'ID',
    },
    {
      accessorKey: 'name',
      header: '이름',
      size: 120,
      grow: true,
      mobilePrimary: true,
      mobileLabel: '이름',
      editable: true,
    },
    {
      accessorKey: 'email',
      header: '이메일',
      size: 200,
      grow: true,
      mobileLabel: '이메일',
      editable: true,
    },
    {
      accessorKey: 'role',
      header: '역할',
      size: 100,
      mobileLabel: '역할',
      cell: ({ value }) => (
        <Badge variant={value === '관리자' ? 'default' : value === '편집자' ? 'secondary' : 'outline'}>
          {value}
        </Badge>
      ),
      editable: {
        type: 'select',
        options: [
          { value: '관리자', label: '관리자' },
          { value: '편집자', label: '편집자' },
          { value: '뷰어', label: '뷰어' },
        ],
      },
    },
    {
      accessorKey: 'status',
      header: '상태',
      size: 100,
      mobileLabel: '상태',
      cell: ({ value }) => (
        <span className={value === 'active' ? 'text-emerald-600' : 'text-slate-400'}>
          {value === 'active' ? '활성' : '비활성'}
        </span>
      ),
      editable: {
        type: 'select',
        options: [
          { value: 'active', label: '활성' },
          { value: 'inactive', label: '비활성' },
        ],
      },
    },
    {
      accessorKey: 'score',
      header: '점수',
      size: 80,
      headerAlign: 'right',
      cellAlign: 'right',
      mobileLabel: '점수',
      sortable: true,
      editable: { type: 'number', min: 0, max: 100 },
    },
  ], [])

  const handleAddRow = useCallback(() => {
    const newRow = {
      id: nextId++,
      name: `사용자${nextId}`,
      email: `user${nextId}@example.com`,
      role: '뷰어',
      status: 'active',
      score: Math.floor(Math.random() * 40) + 60,
    }
    setData((prev) => [newRow, ...prev])
    setModifiedIds((prev) => new Set(prev).add(newRow.id))
    toast.success(`새 행 추가됨 (ID: ${newRow.id})`)
  }, [])

  const handleSaveAll = useCallback((allData) => {
    toast.success(`${allData.length}건 저장 완료 (수정: ${modifiedIds.size}건)`)
    setModifiedIds(new Set())
  }, [modifiedIds.size])

  const handleSelectionChange = useCallback((selectedRows) => {
    // selection 변경 시 로그 출력 (디버깅용)
    console.log('선택된 행:', selectedRows)
  }, [])

  const handleCellEdit = useCallback(({ rowId, columnId, value }) => {
    setData((prev) => prev.map((row) =>
      String(row.id) === rowId ? { ...row, [columnId]: value } : row,
    ))
    setModifiedIds((prev) => new Set(prev).add(Number(rowId)))
  }, [])

  const handleDeleteSelected = useCallback((selectedRows, clearSelection) => {
    const selectedIds = new Set(selectedRows.map((r) => r.id))
    setData((prev) => prev.filter((row) => !selectedIds.has(row.id)))
    clearSelection()
    toast.success(`${selectedRows.length}건 삭제됨`)
  }, [])

  const getRowId = useCallback((row) => String(row.id), [])

  const isRowModified = useCallback(
    (row) => modifiedIds.has(row.id),
    [modifiedIds],
  )

  const getRowClassName = useCallback(
    ({ row }) => modifiedIds.has(row.id) ? 'bg-amber-50/60' : '',
    [modifiedIds],
  )

  return (
    <section className="admin-page-frame">
      <div className="admin-page-header">
        <div className="admin-page-copy">
          <h1 className="admin-page-title">
            <FlaskConical className="admin-page-title-icon" />
            ShadcnDataTable 테스트
          </h1>
        </div>
      </div>

      <div className="admin-workspace">
        <div className="admin-panel admin-panel-pad mb-4">
          <h2 className="text-sm font-semibold text-[color:var(--admin-text-secondary)] mb-2">기능 테스트 항목</h2>
          <ul className="text-xs text-[color:var(--admin-text-muted)] space-y-1">
            <li>1. <strong>칼럼 이동</strong> — 헤더를 드래그하여 칼럼 순서 변경 (5px 이상 이동)</li>
            <li>2. <strong>칼럼 정렬</strong> — 헤더 클릭으로 오름차순/내림차순 토글</li>
            <li>3. <strong>칼럼 리사이즈</strong> — 헤더 우측 경계선 드래그로 너비 조절</li>
            <li>4. <strong>행 선택</strong> — 체크박스로 개별/전체 선택, 선택 시 툴바에 N개 선택됨 표시</li>
            <li>5. <strong>선택 삭제</strong> — 선택된 행을 삭제하는 버튼 동작</li>
            <li>6. <strong>행 추가</strong> — 툴바 "추가" 버튼으로 새 행 생성 (노란 배경 표시)</li>
            <li>7. <strong>전체 저장</strong> — 툴바 "저장" 버튼 클릭 시 토스트 메시지 확인</li>
            <li>8. <strong>인라인 편집</strong> — 셀 더블클릭으로 편집 (이름/이메일=텍스트, 역할/상태=셀렉트, 점수=숫자)</li>
          </ul>
        </div>

        <div className="admin-panel admin-table-shell">
          <ShadcnDataTable
            columns={columns}
            paginationMode="client"
            clientSideData={data}
            defaultPageSize={10}
            density="comfortable"
            // 1. 칼럼 이동 (기본 활성)
            enableColumnReorder
            // 2. 행 선택
            enableRowSelection
            onRowSelectionChange={handleSelectionChange}
            renderSelectionToolbar={({ selectedRows, clearSelection }) => (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => handleDeleteSelected(selectedRows, clearSelection)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                선택 삭제 ({selectedRows.length})
              </Button>
            )}
            // 3. 툴바 (추가/저장)
            enableToolbar
            onAddRow={handleAddRow}
            onSaveAll={handleSaveAll}
            // 4. 인라인 편집
            onCellEdit={handleCellEdit}
            // 5. 유틸리티
            getRowId={getRowId}
            isRowModified={isRowModified}
            getRowClassName={getRowClassName}
          />
        </div>
      </div>
    </section>
  )
}
