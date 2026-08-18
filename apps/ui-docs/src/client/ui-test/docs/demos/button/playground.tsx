'use client';

import { Button } from '@hvy/ui';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { BoolControl, EnumControl, PlaygroundGrid } from '../../../playground';

/**
 * Button 플레이그라운드 — props 를 실시간으로 조합한다. 조작한 상태가 곧 아래 코드다.
 * variant 5종(primary 채움 + outline 4색) × size 5단(테마 스케일 유도 —
 * default 에서 32/36/42/46/52, QA 3단 sm 36 · md 42 · xl 52 를 보존).
 */
const VARIANTS = [
  'primary',
  'outline-primary',
  'outline-strong',
  'outline-gray',
  'outline-red',
] as const;

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export function ButtonPlaygroundDemo() {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('outline-gray');
  const [size, setSize] = useState<(typeof SIZES)[number]>('md');
  const [withIcon, setWithIcon] = useState(true);
  const [busy, setBusy] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const code = [
    `<Button variant="${variant}" size="${size}"`,
    withIcon ? ' icon={Save}' : '',
    busy ? ' busy' : '',
    disabled ? ' disabled title="왜 못 누르는지 적는 자리"' : '',
    '>저장</Button>',
  ].join('');

  return (
    <PlaygroundGrid
      controls={
        <>
          <EnumControl label="variant" value={variant} options={VARIANTS} onChange={setVariant} />
          <EnumControl label="size" value={size} options={SIZES} onChange={setSize} />
          <BoolControl label="icon" checked={withIcon} onChange={setWithIcon} />
          <BoolControl label="busy" checked={busy} onChange={setBusy} />
          <BoolControl label="disabled" checked={disabled} onChange={setDisabled} />
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
        저장
      </Button>
    </PlaygroundGrid>
  );
}
