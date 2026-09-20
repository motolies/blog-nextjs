'use client';

import {
  Button,
  type ColumnDef,
  ContentDialog,
  defineColumns,
  FieldValue,
  FormGrid,
} from '@hvy/ui';
import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import { RunStatusBadge } from '@/components/quant/RunStatusBadge';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { PageResponse, SearchRequest } from '@/lib/gridSearch';
import { isNotFound } from '@/lib/quant/apiOutcome';
import { formatCostUsd, formatDurationMs, formatTokens } from '@/lib/quant/format';
import { toRunPage } from '@/lib/quant/runPage';
import { formatCompact } from '@/lib/statFormat';
import service from '@/service';
import type { ChatRow } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { JsonPre } from './JsonPre';

type ChatGridRow = Record<string, unknown>;
const asChat = (row: ChatGridRow) => row as unknown as ChatRow;

const CHAT_LIMIT = 50;

/** advisor 404 는 상위가 판정 — 빈 표. */
const fetchChats = async (request: SearchRequest): Promise<PageResponse<ChatGridRow>> => {
  try {
    const rows = await service.advisor.chats(CHAT_LIMIT);
    return toRunPage(rows as unknown as ChatGridRow[], request);
  } catch (error) {
    if (isNotFound(error)) return { list: [], totalCount: 0 };
    throw error;
  }
};

/**
 * Slack 챗봇 대화 — `GET /chats?limit=50` → `PersistedDataGrid`(key `quantAdvisorChats`). 비용 관찰이 목적이다.
 * question/answer 는 두 줄 클램프, `chatId`(primary) 를 누르면 원문 다이얼로그(`<pre>`, api-log 스타일).
 * 상세 다이얼로그의 open 은 지역 상태다 — 채팅은 딥링크 대상이 아니다(Slack 스레드가 이미 정본).
 */
export function ChatsGrid() {
  const [detail, setDetail] = useState<ChatRow | null>(null);

  const onOpen = useCallback((row: ChatGridRow) => setDetail(asChat(row)), []);

  const columns = useMemo(
    () =>
      defineColumns<ChatGridRow>([
        {
          id: 'chatId',
          headerWord: '채팅',
          width: 80,
          primary: true,
          hideable: false,
          pinned: true,
        },
        {
          id: 'createdAt',
          headerWord: '시각',
          width: 130,
          format: (value) => formatUtcToLocal(String(value ?? ''), 'MM-dd HH:mm:ss'),
        },
        { id: 'slackUserId', headerWord: '사용자', width: 120 },
        {
          id: 'question',
          headerWord: '질문',
          width: 240,
          align: 'left',
          format: (value) => (
            <span
              className="line-clamp-2 wrap-anywhere whitespace-normal"
              title={String(value ?? '')}
            >
              {value ? String(value) : '—'}
            </span>
          ),
        },
        {
          id: 'answer',
          headerWord: '답변',
          width: 320,
          grow: 1,
          align: 'left',
          format: (value) => (
            <span
              className="line-clamp-2 wrap-anywhere whitespace-normal"
              title={String(value ?? '')}
            >
              {value ? String(value) : '—'}
            </span>
          ),
        },
        {
          id: 'status',
          headerWord: '상태',
          width: 90,
          format: (value) => <RunStatusBadge status={String(value)} />,
        },
        { id: 'model', headerWord: '모델', width: 140, align: 'left' },
        {
          id: 'toolCalls',
          headerWord: '도구',
          width: 70,
          align: 'right',
          format: (value) => formatCompact(Number(value ?? 0)),
        },
        {
          id: 'promptTokens',
          headerWord: '입력 토큰',
          width: 100,
          align: 'right',
          format: (value) => formatTokens(value as number),
        },
        {
          id: 'completionTokens',
          headerWord: '출력 토큰',
          width: 100,
          align: 'right',
          format: (value) => formatTokens(value as number),
        },
        {
          id: 'reasoningTokens',
          headerWord: '추론 토큰',
          width: 100,
          align: 'right',
          hidden: true,
          format: (value) => formatTokens(value as number),
        },
        {
          id: 'cachedTokens',
          headerWord: '캐시 토큰',
          width: 100,
          align: 'right',
          hidden: true,
          format: (value) => formatTokens(value as number),
        },
        {
          id: 'costUsd',
          headerWord: '비용',
          width: 110,
          align: 'right',
          format: (value) => formatCostUsd(value as number | string | null),
        },
        {
          id: 'durationMs',
          headerWord: '소요',
          width: 90,
          align: 'right',
          format: (value) => formatDurationMs(value as number | null),
        },
        {
          id: 'errorMessage',
          headerWord: '오류',
          width: 200,
          align: 'left',
          hidden: true,
          format: (value) =>
            value ? (
              <span className="line-clamp-2 wrap-anywhere whitespace-normal" title={String(value)}>
                {String(value)}
              </span>
            ) : (
              '—'
            ),
        },
      ] satisfies ColumnDef<ChatGridRow>[]),
    [],
  );

  const settings = useGridSettings(columns, 'quantAdvisorChats');
  const grid = useServerGrid<ChatGridRow>({ fetchData: fetchChats, paging: settings.paging });

  return (
    <>
      <section className="admin-panel admin-table-shell admin-table-shell--bleed">
        <h2 className="mb-2 text-dl-sm font-semibold text-dl-fg">Slack 챗봇 대화</h2>
        <PersistedDataGrid<ChatGridRow>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.chatId)}
          isFetching={grid.loading}
          empty={GRID_EMPTY}
          sortOf={grid.sortOf}
          onToggleSort={grid.toggleSort}
          onRowPrimaryAction={onOpen}
          attachedToolbar
          maxHeight="auto"
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
              variant="outline-gray"
              size="xs"
              icon={RefreshCw}
              busy={grid.loading}
              onClick={grid.refresh}
            >
              새로 고침
            </Button>
          }
          onColumnSettings={settings.openSettings}
        />
      </section>

      <ContentDialog
        open={detail !== null}
        onOpenChange={(next) => {
          if (!next) setDetail(null);
        }}
        title={detail ? `채팅 #${detail.chatId}` : '채팅'}
        description={
          detail
            ? `${detail.slackUserId ?? '—'} · ${detail.model ?? '—'} · ${formatUtcToLocal(detail.createdAt, 'yyyy-MM-dd HH:mm:ss')}`
            : undefined
        }
        size="lg"
        footer={
          <Button variant="outline-gray" onClick={() => setDetail(null)}>
            닫기
          </Button>
        }
      >
        {detail ? (
          <div className="flex flex-col gap-3 p-1">
            <FormGrid>
              <FieldValue size="sm" label="상태">
                <RunStatusBadge status={detail.status} size="sm" />
              </FieldValue>
              <FieldValue size="sm" label="도구 호출">
                {detail.toolCalls}
                {detail.toolCallNames && detail.toolCallNames.length > 0 ? (
                  <span className="ml-1 font-dl-mono text-dl-fg-muted text-dl-xs wrap-anywhere">
                    {detail.toolCallNames.join(', ')}
                  </span>
                ) : null}
              </FieldValue>
              <FieldValue size="sm" label="토큰 입력 / 출력">
                {formatTokens(detail.promptTokens)} / {formatTokens(detail.completionTokens)}
              </FieldValue>
              <FieldValue size="sm" label="토큰 추론 / 캐시">
                {formatTokens(detail.reasoningTokens)} / {formatTokens(detail.cachedTokens)}
              </FieldValue>
              <FieldValue size="sm" label="비용 · 소요">
                {formatCostUsd(detail.costUsd)} · {formatDurationMs(detail.durationMs)}
              </FieldValue>
              <FieldValue size="sm" label="데이터 기준">
                {detail.dataAsOf ?? '—'}
              </FieldValue>
            </FormGrid>
            <h3 className="text-dl-xs font-semibold text-dl-fg-muted">질문</h3>
            <JsonPre value={detail.question} maxHeightClass="max-h-[25vh]" />
            <h3 className="text-dl-xs font-semibold text-dl-fg-muted">답변</h3>
            <JsonPre value={detail.answer} maxHeightClass="max-h-[45vh]" />
            {detail.errorMessage ? (
              <>
                <h3 className="text-dl-xs font-semibold text-dl-danger-ink">오류</h3>
                <JsonPre value={detail.errorMessage} maxHeightClass="max-h-[25vh]" />
              </>
            ) : null}
          </div>
        ) : null}
      </ContentDialog>
    </>
  );
}
