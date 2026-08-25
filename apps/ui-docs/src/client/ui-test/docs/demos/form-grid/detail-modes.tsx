'use client';

import {
  Badge,
  Button,
  Card,
  CardHeader,
  DatePicker,
  Field,
  type FieldMode,
  FieldValue,
  FormGrid,
  FormMode,
  Input,
  Select,
  Textarea,
} from '@hvy/ui';
import { useState } from 'react';

/**
 * 상세 폼 조회↔수정 — `FormMode` 하나로 카드·격자 전체가 전환된다.
 *
 * 한 격자 안에 세 종류의 칸이 공존한다:
 *   · `FieldValue` — 애초에 **고칠 대상이 아닌** 값(게시글 ID·등록일시). 모드와 무관하게 항상 표시다
 *   · `Field` — 조회↔수정을 오가는 칸. `FormMode` 를 따라간다
 *   · `Field mode="edit"` — 명시 prop 이 컨텍스트를 이긴다. 조회 화면에서도 열려 있는 칸(관리 메모)
 *
 * 볼 것:
 * · 모드를 토글해도 `FieldValue` 칸과 행이 계속 맞는다 — `FieldValue` 와 view 모드가
 *   같은 값 칸 규격(VALUE_MIN_H ↔ FIELD_SIZE_CLASS 파리티)을 쓰기 때문이다
 * · 표시값 ≠ 편집값인 게시글 상태는 `Field` 의 `view` prop 이 Badge 로 덮는다
 * · disabled 모드에서는 컨트롤이 남은 채 잠기고 필수 별표가 사라진다
 * · view 는 입력 DOM 을 없애 폼 값이 안 나온다 — 그래서 이 폼은 **제어형**이다.
 *   비제어(FormData) + disabled 전환의 실례는 폼 저장·검증 시나리오 참조
 */

const SERVICE_OPTIONS = [
  { value: 'DEV', label: '개발' },
  { value: 'ESSAY', label: '에세이' },
  { value: 'REVIEW', label: '리뷰' },
];

const MODES: readonly FieldMode[] = ['edit', 'view', 'disabled'];

export function FormGridDetailModesDemo() {
  const [mode, setMode] = useState<FieldMode>('view');
  const [status, setStatus] = useState('발행');
  const [category, setCategory] = useState('AIR');
  const [writtenAt, setOrderDate] = useState('2026-07-15');
  const [author, setAuthor] = useState('김민준');
  const [phone, setPhone] = useState('010-1234-5678');
  const [address, setAddress] = useState('서울특별시 강남구 테헤란로 123, 4층');
  const [memo, setMemo] = useState('부재 시 경비실에 맡겨 주세요.');
  const [adminNote, setAdminNote] = useState('상담원만 고치는 칸 — 조회 중에도 편집');

  return (
    <div className="flex w-full max-w-4xl flex-col gap-dl-gutter">
      {/* 모드 토글은 FormMode 밖이다 — 조작 UI 까지 잠그면 조회에서 빠져나올 수 없다. */}
      <div className="flex items-center gap-1.5">
        {MODES.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={mode === entry ? 'primary' : 'outline-strong'}
            onClick={() => setMode(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>

      <FormMode value={mode}>
        {/* 앱 셸 재현 — 섹션 분리 예제와 같은 구조(카드 둘 · 격자 둘 · 폭은 바깥이 쥔다). */}
        <div className="flex flex-col gap-dl-gutter rounded-dl-container bg-dl-canvas p-dl-gutter">
          <Card>
            <CardHeader title="게시글 정보" />
            <FormGrid>
              {/* 영구 조회 — 모드를 바꿔도 편집으로 열리지 않는다. FieldValue 가 그 뜻이다. */}
              <FieldValue label="게시글 ID">POST-100024</FieldValue>
              <FieldValue label="등록일시">2026-07-15 09:12:03</FieldValue>
              {/* 표시값 ≠ 편집값 — 컨트롤은 Badge 를 만들 수 없으니 호출부의 view 가 덮는다. */}
              <Field
                label="게시글 상태"
                htmlFor="dm-status"
                view={<Badge tone="primary">{status}</Badge>}
              >
                <Input
                  id="dm-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                />
              </Field>
              <Field label="카테고리" htmlFor="dm-service" required>
                <Select
                  id="dm-service"
                  placeholder="선택"
                  options={SERVICE_OPTIONS}
                  value={category}
                  onValueChange={setCategory}
                />
              </Field>
              <Field label="작성일" htmlFor="dm-writtenAt" required>
                <DatePicker id="dm-writtenAt" value={writtenAt} onValueChange={setOrderDate} />
              </Field>
              {/* 필드별 예외 — 명시 mode 가 FormMode 를 이긴다. */}
              <Field label="관리 메모" htmlFor="dm-adminNote" mode="edit">
                <Input
                  id="dm-adminNote"
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                />
              </Field>
            </FormGrid>
          </Card>

          <Card>
            <CardHeader title="작성자 정보" />
            <FormGrid>
              <Field label="작성자" htmlFor="dm-author" required>
                <Input
                  id="dm-author"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                />
              </Field>
              <Field label="연락처" htmlFor="dm-phone" required>
                <Input
                  id="dm-phone"
                  inputMode="numeric"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>
              <Field label="요약" htmlFor="dm-address" className="col-span-full">
                <Input
                  id="dm-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </Field>
              <Field label="본문" htmlFor="dm-memo" className="col-span-full">
                <Textarea
                  id="dm-memo"
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                />
              </Field>
            </FormGrid>
          </Card>
        </div>
      </FormMode>
    </div>
  );
}
