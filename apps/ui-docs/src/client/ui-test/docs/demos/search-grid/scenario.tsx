'use client';

import {
  Badge,
  Button,
  DataGrid,
  defineColumns,
  ErrorState,
  Field,
  Input,
  Select,
  showToast,
  TotalCount,
  useGridSelection,
} from '@hvy/ui';
import { Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { DEMO_ORDERS, DEMO_STATUS_META, DEMO_STATUSES, type DemoOrder } from '../../../mock-orders';
import { BoolControl } from '../../../playground';

/**
 * 시나리오 1 — 검색 폼 + 그리드.
 *
 * 검증 포인트: 검색바→그리드 상태 동기화 · busy 중 재클릭 방지 · **결과가 교체되면 선택이
 * 비워지는가(resetKey)** · 로딩→결과/빈/에러 상태 전환 · "아직 검색 안 함"과 "결과 없음" 구분.
 *
 * 지연은 이벤트 핸들러 안의 setTimeout 이라 hydration 과 무관하다 — 실제 조회 왕복을 흉내낸다.
 */

const numberFormat = new Intl.NumberFormat('ko-KR');

const COLUMNS = defineColumns<DemoOrder>([
  {
    id: 'orderId',
    headerWord: '주문번호',
    width: 140,
    primary: true,
    pinned: true,
    hideable: false,
  },
  { id: 'receiver', headerWord: '수신자', width: 110 },
  {
    id: 'status',
    headerWord: '상태',
    width: 96,
    format: (_value, row) => (
      <Badge tone={DEMO_STATUS_META[row.status].tone}>{DEMO_STATUS_META[row.status].label}</Badge>
    ),
  },
  {
    id: 'amount',
    headerWord: '금액',
    width: 110,
    align: 'right',
    format: (value) => `${numberFormat.format(Number(value))} 원`,
  },
  { id: 'orderDate', headerWord: '주문일', width: 120, grow: 1 },
]);

type Phase = 'idle' | 'loading' | 'done' | 'error';

export function SearchGridScenario() {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [simulateError, setSimulateError] = useState(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [results, setResults] = useState<readonly DemoOrder[]>([]);
  /** 조회가 실행될 때마다 증가 — 결과가 같아 보여도 "새 목록"이므로 선택을 비운다. */
  const [searchSeq, setSearchSeq] = useState(0);

  const selection = useGridSelection({
    rows: results,
    getRowId: (row) => row.orderId,
    resetKey: String(searchSeq),
  });

  const runSearch = () => {
    setPhase('loading');
    window.setTimeout(() => {
      if (simulateError) {
        setPhase('error');
        return;
      }
      const trimmed = keyword.trim();
      const filtered = DEMO_ORDERS.filter(
        (order) =>
          (trimmed === '' || order.orderId.includes(trimmed) || order.receiver.includes(trimmed)) &&
          (statusFilter === '' || order.status === statusFilter),
      );
      setResults(filtered);
      setSearchSeq((seq) => seq + 1);
      setPhase('done');
    }, 800);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch();
  };

  const reset = () => {
    setKeyword('');
    setStatusFilter('');
    setResults([]);
    setSearchSeq((seq) => seq + 1);
    setPhase('idle');
  };

  return (
    <div className="flex w-full flex-col">
      <form
        onSubmit={submit}
        className="mb-3 flex flex-wrap items-end gap-3 rounded-dl-control bg-dl-canvas p-3"
      >
        <Field label="주문번호 · 수신자" htmlFor="sg-keyword" className="w-56">
          <Input
            id="sg-keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="ORD-100001 · 김민준"
          />
        </Field>

        <Field label="상태" htmlFor="sg-status" className="w-40">
          <Select
            id="sg-status"
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="전체"
            options={DEMO_STATUSES.map((status) => ({
              value: status,
              label: DEMO_STATUS_META[status].label,
            }))}
          />
        </Field>

        <Button type="submit" variant="primary" icon={Search} busy={phase === 'loading'}>
          조회
        </Button>
        <Button variant="outline-gray" onClick={reset}>
          초기화
        </Button>
        <BoolControl label="에러 모의" checked={simulateError} onChange={setSimulateError} />
      </form>

      {phase === 'error' ? (
        <div className="rounded-dl-container border border-dl-border bg-dl-surface">
          <ErrorState message="조회에 실패했습니다 (모의)" onRetry={runSearch} />
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3">
            <TotalCount
              total={results.length}
              prefix="총"
              suffix="건"
              format={numberFormat.format}
            />
            {selection.selectedCount > 0 ? (
              <span className="text-dl-sm text-dl-tonal-fg">
                선택 {numberFormat.format(selection.selectedCount)}건
              </span>
            ) : null}
            <Button
              disabled={selection.selectedCount === 0}
              title="목록에서 행을 고르면 눌러집니다"
              onClick={() => showToast(`${selection.selectedCount}건 선택됨`)}
            >
              선택 확인
            </Button>
          </div>

          <DataGrid
            columns={COLUMNS}
            rows={results}
            getRowId={(row) => row.orderId}
            isFetching={phase === 'loading'}
            translateHeader={(code) => code}
            onRowPrimaryAction={(row) => showToast(`${row.orderId} 상세 이동 (데모)`, 'info')}
            selection={{
              selectedIds: selection.selectedIds,
              onChange: selection.onChange,
              allState: selection.allState,
              toggleAll: selection.toggleAll,
              selectAllLabel: '전체 선택',
              selectRowLabel: '행 선택',
            }}
            // "아직 검색 안 함"과 "결과 없음"은 다른 상태다 — 문구로 구분한다(EmptyState 규칙).
            empty={{
              title: phase === 'idle' ? '조회 버튼을 눌러 검색하세요' : '조회 결과가 없습니다',
              hint: phase === 'idle' ? undefined : '검색 조건을 바꿔 다시 조회해 보세요',
            }}
            loadingLabel="불러오는 중"
            maxHeight={320}
          />
        </>
      )}
    </div>
  );
}
