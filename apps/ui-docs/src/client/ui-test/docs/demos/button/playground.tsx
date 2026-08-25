'use client';

import { Button } from '@hvy/ui';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { expr, jsxTag } from '../../../code-snippet';
import {
  BoolControl,
  ControlGroup,
  EnumControl,
  PlaygroundGrid,
  TextControl,
} from '../../../playground';

/**
 * Button 플레이그라운드 — props 를 실시간으로 조합한다. 조작한 상태가 곧 아래 코드다.
 * variant 5종(primary 채움 + outline 4색) × size 5단(테마 스케일 유도 —
 * default 에서 32/36/42/46/52, QA 3단 sm 36 · md 42 · xl 52 를 보존).
 *
 * 라벨을 축으로 둔 이유: 긴 라벨에서 아이콘 간격·최소 폭·줄바꿈 거동이 갈리는데
 * 문구가 고정이면 그걸 볼 수 없다. 비워 두면 아이콘만 남는 모양도 확인된다
 * (그 경우 접근성 이름이 사라지므로 IconButton 을 써야 한다는 것도 함께 드러난다).
 */
const VARIANTS = [
  'primary',
  'outline-primary',
  'outline-strong',
  'outline-gray',
  'outline-red',
  'ghost',
] as const;

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/** 초기 상태 = 이 컴포넌트의 "기본 구성" 선언이기도 하다 — 초기화가 이 값으로 되돌린다. */
const INITIAL = {
  variant: 'outline-gray',
  size: 'md',
  label: '저장',
  withIcon: true,
  busy: false,
  disabled: false,
} as const;

export function ButtonPlaygroundDemo() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>(INITIAL.variant);
  const [size, setSize] = useState<(typeof SIZES)[number]>(INITIAL.size);
  const [label, setLabel] = useState<string>(INITIAL.label);
  const [withIcon, setWithIcon] = useState<boolean>(INITIAL.withIcon);
  const [busy, setBusy] = useState<boolean>(INITIAL.busy);
  const [disabled, setDisabled] = useState<boolean>(INITIAL.disabled);

  // props 객체가 아래 실제 JSX 의 거울이다 — 키 순서까지 같게 두어 눈으로 대조한다.
  const code = jsxTag(
    'Button',
    {
      variant,
      size,
      icon: withIcon ? expr('Save') : undefined,
      busy,
      disabled,
      title: disabled ? '왜 못 누르는지 적는 자리' : undefined,
    },
    label,
  );

  return (
    <PlaygroundGrid
      onReset={() => {
        setVariant(INITIAL.variant);
        setSize(INITIAL.size);
        setLabel(INITIAL.label);
        setWithIcon(INITIAL.withIcon);
        setBusy(INITIAL.busy);
        setDisabled(INITIAL.disabled);
      }}
      controls={
        <>
          <ControlGroup title="모양">
            <EnumControl label="variant" value={variant} options={VARIANTS} onChange={setVariant} />
            <EnumControl label="size" value={size} options={SIZES} onChange={setSize} />
          </ControlGroup>
          <ControlGroup title="상태" note="busy 와 disabled 는 뜻이 다르다">
            <BoolControl label="icon" checked={withIcon} onChange={setWithIcon} />
            <BoolControl label="busy" checked={busy} onChange={setBusy} />
            <BoolControl label="disabled" checked={disabled} onChange={setDisabled} />
          </ControlGroup>
          <ControlGroup title="내용">
            <TextControl
              label="라벨"
              value={label}
              onChange={setLabel}
              placeholder="비우면 아이콘만"
            />
          </ControlGroup>
        </>
      }
      code={code}
    >
      <Button
        variant={variant}
        size={size}
        icon={withIcon ? Save : undefined}
        busy={busy}
        disabled={disabled}
        title={disabled ? '컨트롤에서 비활성으로 켠 상태다' : undefined}
      >
        {label}
      </Button>
    </PlaygroundGrid>
  );
}
