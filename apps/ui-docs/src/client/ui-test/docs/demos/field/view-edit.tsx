'use client';

import {
  Badge,
  Button,
  Checkbox,
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  Field,
  type FieldMode,
  FormGrid,
  FormMode,
  Input,
  MultiSelect,
  NativeSelect,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Textarea,
} from '@hvy/ui';
import { type FormEvent, useState } from 'react';

/**
 * 3모드(edit·view·disabled) — `FormMode` 하나로 폼 전체를 전환한다.
 *
 * 검증 포인트:
 * · 모드를 토글해도 행 높이·격자 열이 튀지 않는다(VALUE_MIN_H_CLASS ↔ FIELD_SIZE_CLASS 파리티)
 * · view: Select 는 code('KR')가 아니라 라벨('대한민국') · MultiSelect 는 쉼표 라벨 ·
 *   미선택 칸은 placeholder 가 아니라 **빈칸** · Checkbox/Switch 는 주입된 viewLabels ·
 *   password 는 값 길이와 무관한 고정 ******** · 표시값≠편집값 칸은 Field 의 view 가 덮는다(Badge) ·
 *   NativeSelect 는 view 미지원 — 콘솔 경고 후 편집 렌더를 유지한다(조회는 Select)
 * · disabled: 컨트롤이 남고 비활성 — 값이 FormData 에서 빠진다(네이티브 규약)
 * · 모드를 오가도 값이 남는다 — view 는 입력 DOM 을 없애므로 **이 폼은 제어형**이다.
 *   비제어가 허용되는 것은 disabled 전환뿐(폼 저장·검증 시나리오가 그 예다)
 * · 필드별 예외는 같은 prop — "관리 메모" 칸은 mode="edit" 로 조회 중에도 편집이 열려 있다
 * · [전송값 보기]로 모드별 FormData 차이를 실증한다: edit 전부 · disabled/view 제외
 *   (Switch 는 button 이라 어느 모드에서도 FormData 에 없다)
 */

const COUNTRY_OPTIONS = [
  { value: 'KR', label: '대한민국' },
  { value: 'JP', label: '일본' },
  { value: 'US', label: '미국' },
];

const CARRIER_OPTIONS = [
  { value: 'CJ', label: 'CJ대한통운' },
  { value: 'HJ', label: '한진' },
  { value: 'LT', label: '롯데' },
];

const MODES: readonly FieldMode[] = ['edit', 'view', 'disabled'];

export function FieldViewEditDemo() {
  const [mode, setMode] = useState<FieldMode>('edit');
  const [receiver, setReceiver] = useState('홍길동');
  const [password, setPassword] = useState('secret-1234');
  const [status, setStatus] = useState('배송중');
  const [country, setCountry] = useState('KR');
  const [warehouse, setWarehouse] = useState(''); // 미선택 유지 — view 의 빈칸 규칙 확인용
  const [carriers, setCarriers] = useState<readonly string[]>(['CJ', 'HJ']);
  const [orderDate, setOrderDate] = useState('2026-08-18');
  const [period, setPeriod] = useState({ start: '2026-08-01', end: '2026-08-18' });
  const [orderedAt, setOrderedAt] = useState('2026-08-18 09:30:00');
  const [memo, setMemo] = useState('경비실에 맡겨 주세요.\n부재 시 연락 바랍니다.');
  const [note, setNote] = useState('상담원만 고치는 칸');
  const [agreed, setAgreed] = useState(true);
  const [notify, setNotify] = useState(false);
  const [priority, setPriority] = useState('normal');
  const [submitted, setSubmitted] = useState('');

  const showFormData = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = [...new FormData(event.currentTarget).entries()]
      .map(([key, entry]) => `${key}=${String(entry)}`)
      .join(' · ');
    setSubmitted(entries === '' ? '(비어 있음)' : entries);
  };

  return (
    <form onSubmit={showFormData} className="flex w-full flex-col gap-4">
      {/* 모드 토글은 FormMode 밖이다 — 조작 UI 까지 잠그면 view 에서 빠져나올 수 없다. */}
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
        <FormGrid>
          <Field label="수취인" htmlFor="ve-receiver" required>
            <Input
              id="ve-receiver"
              name="receiver"
              value={receiver}
              onChange={(event) => setReceiver(event.target.value)}
            />
          </Field>

          <Field label="통관 비밀번호" htmlFor="ve-password">
            {/* view 에서 값 길이와 무관한 고정 ******** — 평문도 길이도 노출하지 않는다 */}
            <Input
              id="ve-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {/* 표시값 ≠ 편집값 — 컨트롤은 Badge 를 만들 수 없으니 호출부의 view 가 덮는다 */}
          <Field label="주문상태" htmlFor="ve-status" view={<Badge tone="primary">{status}</Badge>}>
            <Input
              id="ve-status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          </Field>

          <Field label="국가" htmlFor="ve-country">
            <Select
              id="ve-country"
              name="country"
              placeholder="선택"
              options={COUNTRY_OPTIONS}
              value={country}
              onValueChange={setCountry}
            />
          </Field>

          <Field label="창고" htmlFor="ve-warehouse" help="미선택 — view 에서 빈칸이어야 한다">
            <Select
              id="ve-warehouse"
              name="warehouse"
              placeholder="선택"
              options={[
                { value: 'ICN', label: '인천 1센터' },
                { value: 'GMP', label: '김포 2센터' },
              ]}
              value={warehouse}
              onValueChange={setWarehouse}
            />
          </Field>

          <Field label="배송사" htmlFor="ve-carriers">
            <MultiSelect
              id="ve-carriers"
              name="carriers"
              placeholder="전체"
              options={CARRIER_OPTIONS}
              value={carriers}
              onValueChange={setCarriers}
            />
          </Field>

          <Field label="주문일" htmlFor="ve-orderDate">
            <DatePicker
              id="ve-orderDate"
              name="orderDate"
              value={orderDate}
              onValueChange={setOrderDate}
            />
          </Field>

          <Field label="조회 기간" htmlFor="ve-period" className="col-span-full">
            <DateRangePicker
              start={period.start}
              end={period.end}
              startName="periodStart"
              endName="periodEnd"
              onRangeChange={setPeriod}
            />
          </Field>

          <Field label="주문일시" htmlFor="ve-orderedAt">
            <DateTimePicker
              id="ve-orderedAt"
              name="orderedAt"
              value={orderedAt}
              onValueChange={setOrderedAt}
            />
          </Field>

          {/* NativeSelect 는 view 를 유도할 수 없다(라벨이 children 안) — 콘솔 경고 + 편집 렌더 유지 */}
          <Field label="정렬 기준 (NativeSelect)" htmlFor="ve-sort">
            <NativeSelect id="ve-sort" name="sort" defaultValue="date">
              <option value="date">주문일순</option>
              <option value="name">수취인순</option>
            </NativeSelect>
          </Field>

          <Field label="개인정보 동의" htmlFor="ve-agreed">
            {/* 불리언 → 말 사전을 ui 는 모른다 — viewLabels 를 주입한다. 빼면 콘솔 경고가 뜬다 */}
            <Checkbox
              id="ve-agreed"
              name="agreed"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              viewLabels={{ on: '동의함', off: '동의 안 함' }}
            />
          </Field>

          <Field label="알림 수신" htmlFor="ve-notify">
            <Switch
              id="ve-notify"
              label="알림 수신"
              checked={notify}
              onCheckedChange={setNotify}
              viewLabels={{ on: '수신', off: '수신 안 함' }}
            />
          </Field>

          <Field label="우선순위" htmlFor="ve-priority">
            <RadioGroup
              id="ve-priority"
              name="priority"
              label="우선순위"
              value={priority}
              onValueChange={setPriority}
            >
              <Radio value="normal">일반</Radio>
              <Radio value="express">긴급</Radio>
            </RadioGroup>
          </Field>

          {/* 필드별 예외 — 명시 mode 가 FormMode 를 이긴다. 조회 화면에서 이 칸만 편집 */}
          <Field
            label="관리 메모"
            htmlFor="ve-note"
            mode="edit"
            help="mode='edit' 고정 — 조회 중에도 편집"
          >
            <Input
              id="ve-note"
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>

          <Field label="배송 메모" htmlFor="ve-memo" className="col-span-full">
            <Textarea
              id="ve-memo"
              name="memo"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </Field>
        </FormGrid>
      </FormMode>

      <div className="flex items-center gap-1.5">
        <Button type="submit" variant="outline-primary">
          전송값 보기
        </Button>
      </div>
      {submitted === '' ? null : (
        // 문서용 표시 — 폼이 실제로 실어 보내는 값이다. view 는 전부, disabled 는 잠긴 칸이 빠져야 한다.
        <p className="text-dl-xs text-dl-fg-subtle">
          전송값: <code className="font-dl-mono">{submitted}</code>
        </p>
      )}
    </form>
  );
}
