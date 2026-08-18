import { describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox';
import { DatePicker } from './date-picker';
import { DateRangePicker } from './date-range-picker';
import { DateTimePicker, DateTimeRangePicker } from './date-time-picker';
import { FileUpload } from './file-upload';
import { Input, Textarea } from './input';
import { MultiSelect } from './multi-select';
import { NumberInput } from './number-input';
import { Radio, RadioGroup } from './radio';
import { NativeSelect, Select } from './select';
import { Switch } from './switch';

/**
 * 상태 계약의 **타입 회귀 방어** — 렌더하지 않는다(엘리먼트 생성만, node 환경).
 *
 * 비활성 표기는 `mode="disabled"` 하나다 — 컨트롤의 `disabled` boolean prop 은 타입에서
 * 제거됐고, 아래 `@ts-expect-error` 들이 그 제거를 `tsc` 로 강제한다. 누군가 prop 을
 * 되살리면 "unused @ts-expect-error" 로 컴파일이 깨져 회귀가 드러난다.
 */

const OPTIONS = [{ value: 'a', label: 'A' }] as const;

describe('상태 계약 — disabled prop 제거', () => {
  it('전 컨트롤이 mode="disabled" 를 받고 disabled boolean 은 타입 오류다', () => {
    const elements = [
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <Input key="input" disabled />,
      <Input key="input-ok" mode="disabled" lock masking />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <Textarea key="textarea" disabled />,
      <Textarea key="textarea-ok" mode="disabled" autosize />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <Select key="select" options={OPTIONS} placeholder="선택" disabled />,
      <Select key="select-ok" options={OPTIONS} placeholder="선택" mode="disabled" clearable />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <NativeSelect key="native" disabled />,
      <NativeSelect key="native-ok" mode="disabled" />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <MultiSelect key="multi" options={OPTIONS} placeholder="선택" disabled />,
      <MultiSelect key="multi-ok" options={OPTIONS} placeholder="선택" mode="disabled" />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <Checkbox key="checkbox" disabled />,
      <Checkbox key="checkbox-ok" mode="disabled" invalid />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <RadioGroup key="radio" disabled>
        <Radio value="a">A</Radio>
      </RadioGroup>,
      <RadioGroup key="radio-ok" mode="disabled">
        <Radio value="a">A</Radio>
      </RadioGroup>,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <Switch key="switch" label="스위치" disabled />,
      <Switch key="switch-ok" label="스위치" mode="disabled" defaultChecked />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <DatePicker key="date" disabled />,
      <DatePicker key="date-ok" mode="disabled" lock clearable />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <DateRangePicker key="range" disabled />,
      <DateRangePicker key="range-ok" mode="disabled" lock />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <DateTimePicker key="datetime" disabled />,
      <DateTimePicker key="datetime-ok" mode="disabled" lock clearable />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <DateTimeRangePicker key="dtrange" disabled />,
      <DateTimeRangePicker key="dtrange-ok" mode="disabled" lock />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <FileUpload key="file" buttonLabel="파일 선택" disabled />,
      <FileUpload key="file-ok" buttonLabel="파일 선택" mode="disabled" lock accept=".pdf" />,
      // @ts-expect-error disabled 는 제거됐다 — mode="disabled" 를 쓴다
      <NumberInput key="number" disabled />,
      <NumberInput key="number-ok" mode="disabled" lock />,
    ];
    expect(elements.length).toBeGreaterThan(0);
  });

  it('구 FieldLock enum 표기는 타입 오류다 — lock 은 boolean', () => {
    const elements = [
      // @ts-expect-error lock 은 boolean 이다 — 'auto' 는 lock, 'readonly' 는 masking 으로
      <Input key="lock-enum" lock="auto" />,
      // @ts-expect-error masking 은 boolean 선언이다 — 클라이언트 변환 프리셋은 없다
      <Input key="masking-preset" masking="phone" />,
    ];
    expect(elements.length).toBe(2);
  });
});
