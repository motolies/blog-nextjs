'use client';

import {
  Badge,
  Button,
  ContentDialog,
  DataGrid,
  defineColumns,
  Field,
  FieldValue,
  FormGrid,
  Input,
  PickerDialog,
  showToast,
  useConfirm,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_ORDERS, DEMO_STATUS_META, type DemoOrder } from '../../../mock-orders';

/**
 * 시나리오 3 — 다이얼로그 결합: PickerDialog 안의 DataGrid → 부모 폼 반영.
 *
 * 검증 포인트: **다이얼로그 안의 그리드**(Radix 포커스 트랩 + 가상 스크롤 조합 — 실전에서
 * 자주 깨지는 지점) · 선택 값의 부모 전달 · ContentDialog 의 읽기 전용 상세 ·
 * danger confirm → toast 연쇄.
 *
 * 삭제 버튼이 다이얼로그 **밖**에 있는 이유: 모달 위에 모달을 겹치지 않는다(v3 §ds-02).
 * 다이얼로그 안에서 confirm 을 띄우면 겹침 경고가 난다 — 그 규칙 자체가 검증 대상이다.
 */

const numberFormat = new Intl.NumberFormat('ko-KR');

const PICK_ROWS = DEMO_ORDERS.slice(0, 15);

const PICK_COLUMNS = defineColumns<DemoOrder>([
  { id: 'orderId', headerWord: '주문번호', width: 140, primary: true, pinned: true },
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
]);

export function DialogPickerScenario() {
  const askConfirm = useConfirm();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [picked, setPicked] = useState<DemoOrder | null>(null);

  const remove = async () => {
    if (!picked) return;
    const ok = await askConfirm({
      message: `${picked.orderId} 선택을 해제하시겠습니까?`,
      confirmLabel: '해제',
      cancelLabel: '취소',
      destructive: true,
    });
    if (!ok) return;
    setPicked(null);
    showToast('선택을 해제했습니다');
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end gap-3">
        <Field
          label="선택된 주문"
          htmlFor="dpk-picked"
          help="시스템이 채우는 칸 — 직접 입력할 수 없다"
          className="w-64"
        >
          <Input id="dpk-picked" lock="readonly" value={picked?.orderId ?? ''} />
        </Field>

        <Button variant="outline-primary" onClick={() => setPickerOpen(true)}>
          찾아보기
        </Button>
        <Button
          disabled={!picked}
          title="주문을 먼저 선택하세요"
          onClick={() => setDetailOpen(true)}
        >
          상세 보기
        </Button>
        <Button
          variant="outline-red"
          disabled={!picked}
          title="주문을 먼저 선택하세요"
          onClick={remove}
        >
          선택 해제
        </Button>
      </div>

      <PickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="주문 선택"
        footer={
          <Button variant="outline-strong" onClick={() => setPickerOpen(false)}>
            닫기
          </Button>
        }
      >
        <div className="rounded-dl-container border border-dl-border-soft bg-dl-surface p-3 shadow-dl-card">
          <p className="mb-2 text-dl-xs text-dl-fg-muted">
            주문번호(파란 링크)를 클릭하면 선택되고 모달이 닫힌다.
          </p>
          <DataGrid
            columns={PICK_COLUMNS}
            rows={PICK_ROWS}
            getRowId={(row) => row.orderId}
            translateHeader={(code) => code}
            onRowPrimaryAction={(row) => {
              setPicked(row);
              setPickerOpen(false);
              showToast(`${row.orderId} 선택됨`);
            }}
            maxHeight={300}
          />
        </div>
      </PickerDialog>

      <ContentDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="주문 상세"
        description={picked?.orderId}
        size="md"
        footer={
          <Button variant="outline-strong" onClick={() => setDetailOpen(false)}>
            닫기
          </Button>
        }
      >
        {picked ? (
          <FormGrid>
            <FieldValue label="주문번호">{picked.orderId}</FieldValue>
            <FieldValue label="수신자">{picked.receiver}</FieldValue>
            <FieldValue label="상태">
              <Badge tone={DEMO_STATUS_META[picked.status].tone}>
                {DEMO_STATUS_META[picked.status].label}
              </Badge>
            </FieldValue>
            <FieldValue label="금액">{numberFormat.format(picked.amount)} 원</FieldValue>
          </FormGrid>
        ) : null}
      </ContentDialog>
    </div>
  );
}
