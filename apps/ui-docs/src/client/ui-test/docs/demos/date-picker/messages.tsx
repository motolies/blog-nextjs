'use client';

import { Button, DatePicker, Field, useFieldErrors } from '@hvy/ui';
import { type FormEvent, useRef } from 'react';

/**
 * 오류 메시지 배선 — **달력으로 골라도 오류가 지워지는지**가 요점이다.
 *
 * `Field` 는 자손의 DOM `input`/`change` 버블링으로 dirty 를 감지하는데, 달력 팝업은
 * Radix Portal 이라 Field 바깥에 렌더되고 값도 React 상태로 바뀐다. 그래서 DatePicker 가
 * 커밋 지점마다 `notifyDirty()` 를 직접 부르지 않으면 **날짜를 채웠는데도 "선택해 주세요"가
 * 남는다** — 실제로 그런 상태였고 이 예제가 그 회귀를 잡는 자리다.
 *
 * 확인 순서: 빈 칸으로 [검사] → 두 칸에 오류 → ① 위 칸은 달력에서 클릭, ② 아래 칸은
 * `20261231` 처럼 타이핑 후 Enter. **두 경로 모두** 오류가 즉시 사라져야 한다.
 */
export function DatePickerMessagesDemo() {
  const errors = useFieldErrors<'pickedDate' | 'typedDate'>();
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Partial<Record<'pickedDate' | 'typedDate', string>> = {};
    if (String(data.get('pickedDate') ?? '').trim() === '')
      next.pickedDate = '주문일을 선택해 주세요';
    if (String(data.get('typedDate') ?? '').trim() === '')
      next.typedDate = '출고일을 선택해 주세요';
    errors.setAll(next, formRef);
  };

  return (
    <form ref={formRef} onSubmit={submit} className="flex max-w-80 flex-col gap-4">
      <Field {...errors.bind('pickedDate')} label="주문일" htmlFor="dpm-picked" required>
        <DatePicker id="dpm-picked" name="pickedDate" />
      </Field>

      <Field
        {...errors.bind('typedDate')}
        label="출고일"
        htmlFor="dpm-typed"
        required
        help="타이핑으로 채워도 같은 결과여야 한다"
      >
        <DatePicker id="dpm-typed" name="typedDate" />
      </Field>

      <div className="flex gap-1.5">
        <Button type="submit" variant="primary">
          검사
        </Button>
        <Button onClick={errors.clearAll}>오류 지우기</Button>
      </div>
    </form>
  );
}
