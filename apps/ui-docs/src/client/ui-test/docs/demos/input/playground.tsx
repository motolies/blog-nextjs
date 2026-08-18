'use client';

import { Field, Input } from '@hvy/ui';
import { useState } from 'react';
import { BoolControl, EnumControl, PlaygroundGrid, TextControl } from '../../../playground';

/**
 * Input 플레이그라운드 — 잠금 3종(auto/readonly/disabled)의 배색은 같고 **의미만 다르다**.
 * auto·readonly 는 readOnly(값 전송됨), disabled 만 폼 전송에서 빠진다.
 */
const LOCKS = ['none', 'auto', 'readonly', 'disabled'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const ALIGNS = ['left', 'center'] as const;

export function InputPlaygroundDemo() {
  const [lock, setLock] = useState<(typeof LOCKS)[number]>('none');
  const [invalid, setInvalid] = useState(false);
  const [size, setSize] = useState<(typeof SIZES)[number]>('md');
  const [align, setAlign] = useState<(typeof ALIGNS)[number]>('left');
  const [placeholder, setPlaceholder] = useState('수신자명 입력');

  const lockProp = lock === 'none' ? undefined : lock;

  const code = [
    '<Input',
    lockProp ? ` lock="${lockProp}"` : '',
    size !== 'md' ? ` size="${size}"` : '',
    align === 'center' ? ' align="center"' : '',
    ` placeholder="${placeholder}" />`,
    invalid ? '  // Field error → aria-invalid + danger 보더 + 헬퍼 텍스트' : '',
  ].join('');

  return (
    <PlaygroundGrid
      controls={
        <>
          <EnumControl label="lock" value={lock} options={LOCKS} onChange={setLock} />
          <BoolControl label="invalid" checked={invalid} onChange={setInvalid} />
          <EnumControl label="size" value={size} options={SIZES} onChange={setSize} />
          <EnumControl label="align" value={align} options={ALIGNS} onChange={setAlign} />
          <TextControl label="placeholder" value={placeholder} onChange={setPlaceholder} />
        </>
      }
      code={code}
    >
      <Field
        label="수신자명"
        htmlFor="pg-input"
        error={invalid ? '헬퍼 텍스트 — 필수 입력 항목입니다' : undefined}
        className="w-64"
      >
        {/* lock 이 바뀔 때 defaultValue 를 다시 적용하려고 key 로 리마운트한다 (uncontrolled) */}
        <Input
          key={lock}
          id="pg-input"
          lock={lockProp}
          size={size}
          align={align}
          placeholder={placeholder}
          defaultValue={lock === 'readonly' ? '김***' : undefined}
        />
      </Field>
    </PlaygroundGrid>
  );
}
