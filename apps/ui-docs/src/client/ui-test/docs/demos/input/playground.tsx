'use client';

import { Field, Icon, Input, Textarea } from '@hvy/ui';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { BoolControl, EnumControl, PlaygroundGrid, TextControl } from '../../../playground';

/**
 * Input 플레이그라운드 — 상태 축 셋(mode·lock·masking)이 직교함을 직접 조합해 본다.
 * · lock: 시스템 채움 영구 불변 — mode 가 edit 여도 잠기고 값은 전송된다(readOnly)
 * · masking: 서버가 마스킹한 값 선언 — 전용 배색(기울임) + name 미전달(전송 제외)
 * · clearable 은 제어형 전용(× 는 onClear 를 부를 뿐 값을 직접 지우지 않는다) —
 *   lock 과 함께 켜면 × 가 사라진다(자물쇠↔× 상호 배타, 우선순위 자물쇠 > × > suffix)
 * · Textarea autosize: 내용을 따라 높이가 자란다(field-sizing: content, 상한 있음)
 */
const MODES = ['edit', 'view', 'disabled'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const ALIGNS = ['left', 'center'] as const;
const PREFIXES = ['none', 'search'] as const;
const SUFFIXES = ['none', 'kg', '₩'] as const;

export function InputPlaygroundDemo() {
  const [mode, setMode] = useState<(typeof MODES)[number]>('edit');
  const [lock, setLock] = useState(false);
  const [masking, setMasking] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [clearable, setClearable] = useState(true);
  const [size, setSize] = useState<(typeof SIZES)[number]>('md');
  const [align, setAlign] = useState<(typeof ALIGNS)[number]>('left');
  const [prefix, setPrefix] = useState<(typeof PREFIXES)[number]>('none');
  const [suffix, setSuffix] = useState<(typeof SUFFIXES)[number]>('none');
  const [placeholder, setPlaceholder] = useState('자동 / 저장 시 발급');
  const [value, setValue] = useState('홍길동');
  const [memo, setMemo] = useState('경비실에 맡겨 주세요.');
  const [autosize, setAutosize] = useState(true);

  const code = [
    '<Input',
    mode !== 'edit' ? ` mode="${mode}"` : '',
    lock ? ' lock' : '',
    masking ? ' masking' : '',
    clearable ? " clearable onClear={() => setValue('')}" : '',
    prefix !== 'none' ? ' prefix={<Icon icon={Search} />}' : '',
    suffix !== 'none' ? ` suffix="${suffix}"` : '',
    size !== 'md' ? ` size="${size}"` : '',
    align === 'center' ? ' align="center"' : '',
    ' value={value} … />',
    invalid ? '  // Field error → aria-invalid + danger 보더 + 헬퍼 텍스트' : '',
    `\n<Textarea${autosize ? ' autosize' : ''} value={memo} … />`,
  ].join('');

  return (
    <PlaygroundGrid
      controls={
        <>
          <EnumControl label="mode" value={mode} options={MODES} onChange={setMode} />
          <BoolControl label="lock" checked={lock} onChange={setLock} />
          <BoolControl label="masking" checked={masking} onChange={setMasking} />
          <BoolControl label="invalid" checked={invalid} onChange={setInvalid} />
          <BoolControl label="clearable" checked={clearable} onChange={setClearable} />
          <EnumControl label="prefix" value={prefix} options={PREFIXES} onChange={setPrefix} />
          <EnumControl label="suffix" value={suffix} options={SUFFIXES} onChange={setSuffix} />
          <EnumControl label="size" value={size} options={SIZES} onChange={setSize} />
          <EnumControl label="align" value={align} options={ALIGNS} onChange={setAlign} />
          <TextControl label="placeholder" value={placeholder} onChange={setPlaceholder} />
          <BoolControl label="autosize" checked={autosize} onChange={setAutosize} />
        </>
      }
      code={code}
    >
      <div className="flex w-64 flex-col gap-4">
        <Field
          label="수신자명"
          htmlFor="pg-input"
          error={invalid ? '헬퍼 텍스트 — 필수 입력 항목입니다' : undefined}
        >
          {/* clearable 은 제어형 전용이라 이 데모도 제어형이다 — view↔edit 왕복에도 값이 산다 */}
          <Input
            id="pg-input"
            mode={mode}
            lock={lock || undefined}
            masking={masking || undefined}
            size={size}
            align={align}
            placeholder={placeholder}
            clearable={clearable}
            onClear={() => setValue('')}
            prefix={prefix === 'none' ? undefined : <Icon icon={Search} className="size-4" />}
            suffix={suffix === 'none' ? undefined : suffix}
            value={masking ? 'a***@b.com' : value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Field label="배송 메모 (Textarea)" htmlFor="pg-textarea">
          <Textarea
            id="pg-textarea"
            mode={mode}
            lock={lock || undefined}
            masking={masking || undefined}
            size={size}
            autosize={autosize}
            value={masking ? '서울시 ********' : memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </Field>
      </div>
    </PlaygroundGrid>
  );
}
