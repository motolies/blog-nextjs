'use client';

import {
  Button,
  Card,
  CardHeader,
  DatePicker,
  Field,
  FormGrid,
  Input,
  Select,
  showToast,
  Textarea,
  useFieldErrors,
} from '@hvy/ui';
import { Save } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

/**
 * 상세 폼 한 장 — 카드 + 격자 + `Field`(라벨 위) + 저장 검증.
 *
 * 격자에는 열 수가 없다. `dl-form-grid` 가 `auto-fit` 이라 카드 폭이 정하고,
 * 한 줄을 다 쓰는 칸만 `col-span-full` 로 표시한다 — 배송지·메모처럼 값이 긴 칸이다.
 *
 * **입력 형식은 타이핑을 막지 않고 칸을 벗어날 때 정리한다.**
 * `onChange` 에서 문자를 걸러내면 controlled 입력의 커서가 문자열 끝으로 튀고
 * 한글 IME 조합 중 값이 깨진다. DatePicker 가 `normalizeDateText` 로 쓰는 규칙과
 * 같은 철학이고, 아래 순수 함수들이 그 패턴이다 — 앱은 함수만 가져가면 된다.
 *
 * 검증 규칙이 인라인인 이유: 실제 화면이라면 `packages/contracts` 의 zod 스키마(서버
 * 검증과 같은 것)를 쓰지만, 이 데모는 대응하는 계약이 없다 — 지어내지 않고 손 검증으로 둔다.
 */

const SERVICE_OPTIONS = [
  { value: 'AIR', label: '항공' },
  { value: 'SEA', label: '해상' },
  { value: 'EXP', label: '특송' },
];

/**
 * 결제금액이 허용하는 소수 자릿수. **통화를 아는 건 호출부의 몫이다** —
 * 금액 칸이 통화 목록과 통화별 자릿수를 들고 있으면 통화가 늘 때마다 칸을 고쳐야 한다.
 * 원화 칸이라면 이 값을 넘기지 않으면 된다(기본값 0 = 정수만).
 */
const AMOUNT_DECIMALS = 2;

/** 숫자와 하이픈만 남긴다 — 타이핑은 막지 않고 칸을 벗어날 때 정리한다. */
function normalizePhone(text: string): string {
  return text.replace(/[^0-9-]/g, '');
}

/** 자릿수만 본다 — 국내·해외 표기가 섞여 하이픈 위치는 규정하지 않는다. */
function isValidPhone(text: string): boolean {
  const digits = text.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 11;
}

/**
 * 전송값 — 콤마를 뺀 순수 숫자 문자열. 소수점이 여러 개면 첫 개만 남긴다.
 * 표시값(`1,234.5`)과 달리 이 값이 폼에 실려 나간다.
 */
function toAmountValue(text: string): string {
  const [whole = '', ...fraction] = text.replace(/[^0-9.]/g, '').split('.');
  return fraction.length > 0 ? `${whole}.${fraction.join('')}` : whole;
}

/** 표시용 정리 — 정수부에만 천단위 콤마를 붙인다. **소수부는 자르지 않는다.** */
function normalizeAmount(text: string): string {
  const value = toAmountValue(text);
  if (value === '') return '';
  const [whole = '', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/**
 * 금액 검사. `decimals` 를 주지 않으면 **정수만** 허용한다.
 *
 * 자릿수를 정규화가 아니라 여기서 보는 이유: **값을 조용히 자르지 않기 위해서다.**
 * 사용자가 친 `1000.555` 를 `1000.55` 로 바꿔 저장하면 잘려나간 사실이 화면에 남지 않는다.
 * 그래서 값은 그대로 두고 오류 문구로 알린다.
 */
function isValidAmount(text: string, decimals = 0): boolean {
  const value = toAmountValue(text);
  const amount = Number(value);
  if (value === '' || !Number.isFinite(amount) || amount <= 0) return false;
  return (value.split('.')[1] ?? '').length <= decimals;
}

type FormState = {
  receiver: string;
  phone: string;
  orderDate: string;
  service: string;
  amount: string;
  address: string;
  memo: string;
};

/** 결제금액만 비워 둔다 — 저장을 한 번 누르면 오류 표시가 바로 보인다. */
const INITIAL: FormState = {
  receiver: '김민준',
  phone: '010-1234-5678',
  orderDate: '2026-07-15',
  service: '',
  amount: '',
  address: '서울특별시 강남구 테헤란로 123, 4층',
  memo: '',
};

type FieldName = 'receiver' | 'phone' | 'orderDate' | 'amount' | 'address';

export function FormGridBasicDemo() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const errors = useFieldErrors<FieldName>();
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** 화면값에서 파생된 전송값. hidden 입력과 아래 미리보기가 같은 값을 쓴다. */
  const amountValue = toAmountValue(form.amount);

  /**
   * 검증은 **실제 전송값**(FormData)을 읽는다 — 화면값만 통과하고 전송값은 깨지는
   * 상태를 만들지 않으려면 검사 대상이 실제로 나가는 값이어야 한다.
   */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (name: string) => String(data.get(name) ?? '').trim();

    const next: Partial<Record<FieldName, string>> = {};

    if (read('receiver') === '') next.receiver = '수신자명을 입력해 주세요';

    const phone = read('phone');
    if (phone === '') next.phone = '연락처를 입력해 주세요';
    else if (!isValidPhone(phone)) next.phone = '숫자 8~11자리로 입력해 주세요';

    if (read('orderDate') === '') next.orderDate = '주문일을 선택해 주세요';

    // 콤마가 빠진 hidden 값이다 — 화면의 `1,234.5` 가 아니라 `1234.5` 를 본다.
    const amount = read('amount');
    if (amount === '') next.amount = '결제금액을 입력해 주세요';
    else if (!isValidAmount(amount, AMOUNT_DECIMALS))
      next.amount = `0보다 큰 숫자, 소수점 ${AMOUNT_DECIMALS}자리까지 입력해 주세요`;

    if (read('address') === '') next.address = '배송지를 입력해 주세요';

    // setAll 은 오류가 없을 때 true — 오류가 있으면 표시·포커스까지 끝났으니 여기서 멈춘다.
    if (!errors.setAll(next, formRef)) return;
    showToast('저장되었습니다');
  };

  const reset = () => {
    setForm(INITIAL);
    errors.clearAll();
  };

  return (
    <div className="flex flex-col gap-2">
      <form ref={formRef} onSubmit={submit}>
        <Card className="max-w-4xl">
          <CardHeader title="주문 등록" />

          <FormGrid className="py-2.5">
            <Field {...errors.bind('receiver')} label="수신자명" htmlFor="fg-receiver" required>
              <Input
                id="fg-receiver"
                name="receiver"
                value={form.receiver}
                onChange={(event) => set('receiver', event.target.value)}
              />
            </Field>

            <Field
              {...errors.bind('phone')}
              label="연락처"
              htmlFor="fg-phone"
              required
              help="숫자와 - 만 남기고 정리한다"
            >
              <Input
                id="fg-phone"
                name="phone"
                inputMode="numeric"
                value={form.phone}
                onChange={(event) => set('phone', event.target.value)}
                onBlur={(event) => set('phone', normalizePhone(event.target.value))}
              />
            </Field>

            <Field {...errors.bind('orderDate')} label="주문일" htmlFor="fg-date" required>
              <DatePicker
                id="fg-date"
                name="orderDate"
                value={form.orderDate}
                onValueChange={(value) => set('orderDate', value)}
              />
            </Field>

            <Field label="서비스타입" htmlFor="fg-service">
              <Select
                id="fg-service"
                name="service"
                placeholder="선택"
                options={SERVICE_OPTIONS}
                value={form.service}
                onValueChange={(value) => set('service', value)}
              />
            </Field>

            <Field label="주문번호" htmlFor="fg-orderNo">
              <Input id="fg-orderNo" lock="auto" placeholder="자동 / 저장 시 발급" />
            </Field>

            <Field
              {...errors.bind('amount')}
              label="결제금액"
              htmlFor="fg-amount"
              required
              help={`0보다 큰 숫자 · 소수점 ${AMOUNT_DECIMALS}자리까지`}
            >
              {/* 표시용이라 name 이 없다 — 화면에는 콤마가 있고 전송값에는 없어야 한다.
                  Select 가 커스텀 트리거 뒤에 hidden 을 두는 것과 같은 구조다(select.tsx).
                  DatePicker 가 "입력 자신이 값을 들어 hidden 이 불필요하다"고 적은 것과는
                  반대 사례다 — 날짜는 표시값과 전송값이 같아서 그럴 수 있었다. */}
              <Input
                id="fg-amount"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(event) => set('amount', event.target.value)}
                onBlur={(event) => set('amount', normalizeAmount(event.target.value))}
              />
              <input type="hidden" name="amount" value={amountValue} />
            </Field>

            <Field
              {...errors.bind('address')}
              label="배송지"
              htmlFor="fg-address"
              required
              className="col-span-full"
            >
              <Input
                id="fg-address"
                name="address"
                value={form.address}
                onChange={(event) => set('address', event.target.value)}
              />
            </Field>

            <Field label="메모" htmlFor="fg-memo" className="col-span-full">
              <Textarea
                id="fg-memo"
                name="memo"
                placeholder="배송 시 참고할 내용"
                value={form.memo}
                onChange={(event) => set('memo', event.target.value)}
              />
            </Field>
          </FormGrid>

          <div className="flex justify-end gap-1.5 border-t border-dl-divider py-2.5">
            <Button variant="outline-strong" onClick={reset}>
              취소
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              저장
            </Button>
          </div>
        </Card>
      </form>

      {/* 문서용 표시 — 폼이 실제로 실어 보내는 값이다. 콤마가 빠져 있어야 한다. */}
      <p className="text-dl-xs text-dl-fg-subtle">
        전송값:{' '}
        <code className="font-dl-mono">
          amount={amountValue === '' ? '(비어 있음)' : amountValue}
        </code>
      </p>
    </div>
  );
}
