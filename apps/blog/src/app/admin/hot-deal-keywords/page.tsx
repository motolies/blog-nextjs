'use client';

import {
  Badge,
  Button,
  ContentDialog,
  defineColumns,
  Icon,
  IconButton,
  Input,
  Label,
  Switch,
  showToast,
  useConfirm,
} from '@hvy/ui';
import { Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useClientGrid } from '@/hooks/useClientGrid';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';
import type { HotDealKeyword } from '@/types/hotDeal';

// 백엔드 HotDealKeyword.normalize()와 동일한 규칙. 미리보기와 선제 중복 검사에 사용한다.
const normalizeKeyword = (raw: string) => raw.replace(/[\s 　]+/g, '').toLowerCase();

const MIN_KEYWORD_LENGTH = 2;

// axiosClient 응답 인터셉터는 성공 경로만 언래핑하므로 실패 응답은 ApiResponse 원본이 온다.
const extractErrorMessage = (err: unknown, fallback: string) => {
  const message = (err as any)?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

export default function HotDealKeywordsPage() {
  const askConfirm = useConfirm();
  const [keywords, setKeywords] = useState<HotDealKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);

  // 생성/수정 다이얼로그
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<HotDealKeyword | null>(null);
  const [keywordText, setKeywordText] = useState('');
  const [keywordEnabled, setKeywordEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadKeywords = useCallback(async () => {
    try {
      const data = await service.hotDeal.getKeywords();
      setKeywords(data ?? []);
    } catch (error) {
      showApiErrorToast('키워드 목록을 불러오지 못했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const filteredKeywords = useMemo(() => {
    const query = normalizeKeyword(searchQuery);
    return keywords.filter((item) => {
      if (enabledOnly && !item.enabled) {
        return false;
      }
      if (!query) {
        return true;
      }
      return normalizeKeyword(item.keyword).includes(query);
    });
  }, [keywords, searchQuery, enabledOnly]);

  const normalizedPreview = useMemo(() => normalizeKeyword(keywordText), [keywordText]);

  const handleCreate = () => {
    setDialogMode('create');
    setEditTarget(null);
    setKeywordText('');
    setKeywordEnabled(true);
    setOpenDialog(true);
  };

  const handleEdit = (keyword: HotDealKeyword) => {
    setDialogMode('edit');
    setEditTarget(keyword);
    setKeywordText(keyword.keyword);
    setKeywordEnabled(keyword.enabled);
    setOpenDialog(true);
  };

  /**
   * 저장 전 클라이언트에서 형식과 중복을 먼저 검사한다.
   * 백엔드 검증도 그대로 살아있지만, 400 응답이 슬랙 에러 채널로도 전송되므로
   * 흔한 입력 실수는 API 호출 전에 걸러낸다.
   */
  const handleSave = async () => {
    const trimmed = keywordText.trim();
    const normalized = normalizeKeyword(trimmed);

    if (!normalized) {
      showToast('키워드는 공백만으로 구성될 수 없습니다.', 'error');
      return;
    }
    if (normalized.length < MIN_KEYWORD_LENGTH) {
      showToast('키워드는 공백 제거 기준 2자 이상이어야 합니다.', 'error');
      return;
    }
    const duplicated = keywords.some(
      (item) => item.id !== editTarget?.id && normalizeKeyword(item.keyword) === normalized,
    );
    if (duplicated) {
      showToast('이미 등록된 키워드입니다.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = { keyword: trimmed, enabled: keywordEnabled };
      if (dialogMode === 'create') {
        await service.hotDeal.createKeyword(payload);
        showToast('키워드가 등록되었습니다.');
      } else {
        await service.hotDeal.updateKeyword(editTarget!.id, payload);
        showToast('키워드가 수정되었습니다.');
      }
      setOpenDialog(false);
      await loadKeywords();
    } catch (err) {
      showApiErrorToast(extractErrorMessage(err, '키워드 저장에 실패했습니다.'), err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (keyword: HotDealKeyword) => {
    const ok = await askConfirm({
      message: `${keyword.keyword} 키워드를 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.hotDeal.deleteKeyword(keyword.id);
      showToast('키워드가 삭제되었습니다.');
      await loadKeywords();
    } catch (err) {
      showApiErrorToast(extractErrorMessage(err, '키워드 삭제에 실패했습니다.'), err);
    }
  };

  // 목록에서 바로 활성 상태를 토글한다 (다이얼로그를 열지 않아도 알림을 즉시 끌 수 있게)
  const handleToggleEnabled = async (keyword: HotDealKeyword) => {
    try {
      await service.hotDeal.updateKeyword(keyword.id, {
        keyword: keyword.keyword,
        enabled: !keyword.enabled,
      });
      showToast(keyword.enabled ? '키워드를 비활성화했습니다.' : '키워드를 활성화했습니다.');
      await loadKeywords();
    } catch (err) {
      showApiErrorToast(extractErrorMessage(err, '상태 변경에 실패했습니다.'), err);
    }
  };

  const enabledCount = useMemo(() => keywords.filter((k) => k.enabled).length, [keywords]);

  const columns = useMemo(
    () =>
      defineColumns<Record<string, unknown>>([
        { id: 'keyword', headerWord: '키워드', width: 300 },
        {
          id: 'normalizedKeyword',
          headerWord: '매칭 문자열',
          grow: 1,
          align: 'left',
          format: (value) => (
            <span className="font-mono text-dl-xs text-[color:var(--admin-text-muted)]">
              {String(value)}
            </span>
          ),
        },
        {
          id: 'enabled',
          headerWord: '활성',
          width: 100,
          format: (value, row) => (
            <button
              type="button"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleEnabled(row as unknown as HotDealKeyword);
              }}
              aria-label={`${row.keyword} ${value ? '비활성화' : '활성화'}`}
            >
              <Badge tone={value ? 'success' : 'neutral'}>{value ? '활성' : '비활성'}</Badge>
            </button>
          ),
        },
        {
          id: 'actions',
          headerWord: ' ',
          width: 100,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => {
            const keyword = row as unknown as HotDealKeyword;
            return (
              <div className="flex gap-1">
                <IconButton
                  icon={Pencil}
                  label={`${keyword.keyword} 수정`}
                  size="xs"
                  iconSize="sm"
                  className="cursor-pointer"
                  onClick={() => handleEdit(keyword)}
                />
                <IconButton
                  icon={Trash2}
                  label={`${keyword.keyword} 삭제`}
                  tone="danger"
                  size="xs"
                  iconSize="sm"
                  className="cursor-pointer"
                  onClick={() => handleDelete(keyword)}
                />
              </div>
            );
          },
        },
      ]),
    [],
  );

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'hotDealKeywords');
  const grid = useClientGrid<Record<string, unknown>>(
    filteredKeywords as unknown as Record<string, unknown>[],
    { paging: settings.paging },
  );

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      {/* 검색 바 */}
      <div className="admin-panel admin-panel-pad">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon
              icon={Search}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dl-fg-muted"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="키워드로 검색..."
              className="pl-9 pr-8"
              aria-label="키워드 검색"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 hover:bg-dl-option-hover"
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
              >
                <Icon icon={X} className="text-dl-fg-muted" />
              </button>
            )}
          </div>

          {/* Switch 는 <button role="switch"> 라 <label> 이 감쌀 수 없다(labelable 요소가 아니다).
              옆 문구는 설명이고, 접근성 이름은 Switch 의 label prop 이 갖는다. */}
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-dl-sm text-[color:var(--admin-text-muted)]">
            <Switch
              checked={enabledOnly}
              onCheckedChange={setEnabledOnly}
              label={`활성 키워드만 보기 (${enabledCount}개)`}
            />
            활성만 ({enabledCount})
          </span>
        </div>
      </div>

      {/* 안내 */}
      <div className="admin-panel admin-panel-pad">
        <p className="text-dl-sm text-[color:var(--admin-text-muted)]">
          등록한 키워드가 핫딜 제목에 포함되면 <strong>추천·조회·댓글 임계값을 무시</strong>하고
          Slack에 <strong>@channel 멘션</strong>으로 알림이 전송됩니다. 대소문자와 공백은 무시하고
          부분일치로 판단합니다.
        </p>
      </div>

      {/* 키워드 테이블 */}
      <div className="admin-panel admin-table-shell admin-table-shell--bleed">
        <PersistedDataGrid<Record<string, unknown>>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.id)}
          empty={GRID_EMPTY}
          sortOf={grid.sortOf}
          onToggleSort={grid.toggleSort}
          attachedToolbar
          maxHeight="fill"
        />
        <GridPagingBar
          pageIndex={grid.pageIndex}
          pageCount={grid.pageCount}
          onPageChange={grid.setPageIndex}
          total={grid.totalCount}
          pageSize={grid.pageSize}
          onPageSizeChange={grid.setPageSize}
          actions={
            <Button
              variant="primary"
              size="xs"
              className="cursor-pointer"
              onClick={handleCreate}
              icon={Plus}
            >
              새 키워드
            </Button>
          }
          onColumnSettings={settings.openSettings}
        />
      </div>

      {/* 생성/수정 다이얼로그 */}
      <ContentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={dialogMode === 'create' ? '키워드 추가' : '키워드 수정'}
        size="md"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setOpenDialog(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} busy={saving} icon={Save}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-dl-container border border-dl-warning bg-dl-warning-bg p-3 text-dl-sm">
            이 키워드에 매칭되면 <strong>임계값을 무시</strong>하고 <strong>@channel 멘션</strong>
            으로 알림이 갑니다. 짧거나 흔한 단어는 알림이 과도하게 발생할 수 있습니다.
          </div>
          <div className="space-y-1">
            <Label htmlFor="keyword-text">키워드 *</Label>
            <Input
              id="keyword-text"
              value={keywordText}
              onChange={(e) => setKeywordText(e.target.value)}
              placeholder="예: 닌텐도"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            {normalizedPreview && (
              <p className="text-dl-xs text-[color:var(--admin-text-muted)]">
                매칭 문자열: <code className="font-mono">{normalizedPreview}</code>
                {normalizedPreview.length < MIN_KEYWORD_LENGTH && (
                  <span className="text-dl-danger"> (2자 이상 필요)</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="keyword-enabled">활성 상태</Label>
            <Switch
              id="keyword-enabled"
              checked={keywordEnabled}
              onCheckedChange={setKeywordEnabled}
              label="키워드 활성 상태"
            />
          </div>
        </div>
      </ContentDialog>
    </AdminPageFrame>
  );
}
