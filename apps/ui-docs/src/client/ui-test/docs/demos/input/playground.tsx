'use client';

import { CONTROL_SIZES, type ControlSize, Field, Icon, Input, Textarea } from '@hvy/ui';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { expr, jsxTag } from '../../../code-snippet';
import {
  BoolControl,
  ControlGroup,
  EnumControl,
  NumberControl,
  PlaygroundGrid,
  TextControl,
} from '../../../playground';

/**
 * Input 플레이그라운드 — 상태 축 셋(mode·lock·masking)이 직교함을 직접 조합해 본다.
 * · lock: 시스템 채움 영구 불변 — mode 가 edit 여도 잠기고 값은 전송된다(readOnly)
 * · masking: 서버가 마스킹한 값 선언 — 전용 배색(기울임) + name 미전달(전송 제외)
 * · clearable 은 제어형 전용(× 는 onClear 를 부를 뿐 값을 직접 지우지 않는다) —
 *   lock 과 함께 켜면 × 가 사라진다(자물쇠↔× 상호 배타, 우선순위 자물쇠 > × > suffix)
 * · showCount 는 **maxLength 와 맞물린다** — 상한이 없으면 셀 수는 있어도 남은 양을 못 센다.
 *   두 축을 함께 켜고 꺼 보면 그 의존이 드러난다
 * · Textarea autosize: 내용을 따라 높이가 자란다(field-sizing: content, 상한 있음)
 */
const MODES = ['edit', 'view', 'disabled'] as const;
const ALIGNS = ['left', 'center'] as const;
const PREFIXES = ['none', 'search'] as const;
const SUFFIXES = ['none', '자', '회'] as const;

/** 초기 상태 = 이 컴포넌트의 "기본 구성" 선언이기도 하다 — 초기화가 이 값으로 되돌린다. */
const INITIAL = {
  mode: 'edit',
  lock: false,
  masking: false,
  invalid: false,
  clearable: true,
  size: 'md',
  align: 'left',
  prefix: 'none',
  suffix: 'none',
  placeholder: '자동 / 저장 시 발급',
  value: '홍길동',
  memo: '초안은 자동 저장됩니다.',
  autosize: true,
  maxLength: 20,
  showCount: false,
} as const;

export function InputPlaygroundDemo() {
  const [mode, setMode] = useState<(typeof MODES)[number]>(INITIAL.mode);
  const [lock, setLock] = useState<boolean>(INITIAL.lock);
  const [masking, setMasking] = useState<boolean>(INITIAL.masking);
  const [invalid, setInvalid] = useState<boolean>(INITIAL.invalid);
  const [clearable, setClearable] = useState<boolean>(INITIAL.clearable);
  const [size, setSize] = useState<ControlSize>(INITIAL.size);
  const [align, setAlign] = useState<(typeof ALIGNS)[number]>(INITIAL.align);
  const [prefix, setPrefix] = useState<(typeof PREFIXES)[number]>(INITIAL.prefix);
  const [suffix, setSuffix] = useState<(typeof SUFFIXES)[number]>(INITIAL.suffix);
  const [placeholder, setPlaceholder] = useState<string>(INITIAL.placeholder);
  const [value, setValue] = useState<string>(INITIAL.value);
  const [memo, setMemo] = useState<string>(INITIAL.memo);
  const [autosize, setAutosize] = useState<boolean>(INITIAL.autosize);
  const [maxLength, setMaxLength] = useState<number>(INITIAL.maxLength);
  const [showCount, setShowCount] = useState<boolean>(INITIAL.showCount);

  const code = [
    jsxTag('Input', {
      mode: mode === 'edit' ? undefined : mode,
      lock,
      masking,
      clearable,
      onClear: clearable ? expr("() => setValue('')") : undefined,
      prefix: prefix === 'none' ? undefined : expr('<Icon icon={Search} />'),
      suffix: suffix === 'none' ? undefined : suffix,
      size: size === 'md' ? undefined : size,
      align: align === 'left' ? undefined : align,
      maxLength: showCount ? maxLength : undefined,
      showCount,
      value: expr('value'),
    }),
    invalid ? '// Field error → aria-invalid + danger 보더 + 헬퍼 텍스트' : '',
    jsxTag('Textarea', { autosize, value: expr('memo') }),
  ]
    .filter((line) => line !== '')
    .join('\n');

  return (
    <PlaygroundGrid
      onReset={() => {
        setMode(INITIAL.mode);
        setLock(INITIAL.lock);
        setMasking(INITIAL.masking);
        setInvalid(INITIAL.invalid);
        setClearable(INITIAL.clearable);
        setSize(INITIAL.size);
        setAlign(INITIAL.align);
        setPrefix(INITIAL.prefix);
        setSuffix(INITIAL.suffix);
        setPlaceholder(INITIAL.placeholder);
        setValue(INITIAL.value);
        setMemo(INITIAL.memo);
        setAutosize(INITIAL.autosize);
        setMaxLength(INITIAL.maxLength);
        setShowCount(INITIAL.showCount);
      }}
      controls={
        <>
          <ControlGroup title="상태" note="셋은 직교한다 — lock 은 mode 를 이긴다">
            <EnumControl label="mode" value={mode} options={MODES} onChange={setMode} />
            <BoolControl label="lock" checked={lock} onChange={setLock} />
            <BoolControl label="masking" checked={masking} onChange={setMasking} />
            <BoolControl label="invalid" checked={invalid} onChange={setInvalid} />
          </ControlGroup>
          <ControlGroup title="장식" note="자물쇠 > × > suffix 순으로 자리를 다툰다">
            <BoolControl label="clearable" checked={clearable} onChange={setClearable} />
            <EnumControl label="prefix" value={prefix} options={PREFIXES} onChange={setPrefix} />
            <EnumControl label="suffix" value={suffix} options={SUFFIXES} onChange={setSuffix} />
          </ControlGroup>
          <ControlGroup title="치수·문구">
            <EnumControl label="size" value={size} options={CONTROL_SIZES} onChange={setSize} />
            <EnumControl label="align" value={align} options={ALIGNS} onChange={setAlign} />
            <TextControl label="placeholder" value={placeholder} onChange={setPlaceholder} />
            <BoolControl label="showCount" checked={showCount} onChange={setShowCount} />
            <NumberControl
              label="maxLength"
              value={maxLength}
              onChange={setMaxLength}
              min={1}
              max={200}
              presets={[10, 20, 100]}
              hint={showCount ? undefined : 'showCount 를 켜야 카운터가 보인다'}
            />
            <BoolControl label="autosize" checked={autosize} onChange={setAutosize} />
          </ControlGroup>
        </>
      }
      code={code}
    >
      <div className="flex w-64 flex-col gap-4">
        <Field
          label="제목"
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
            maxLength={showCount ? maxLength : undefined}
            showCount={showCount}
            value={masking ? 'a***@b.com' : value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Field label="요약 (Textarea)" htmlFor="pg-textarea">
          <Textarea
            id="pg-textarea"
            mode={mode}
            lock={lock || undefined}
            masking={masking || undefined}
            size={size}
            autosize={autosize}
            value={masking ? '비공개 메모 ********' : memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </Field>
      </div>
    </PlaygroundGrid>
  );
}
