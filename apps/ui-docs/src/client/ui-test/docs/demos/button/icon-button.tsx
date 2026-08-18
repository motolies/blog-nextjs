'use client';

import { IconButton } from '@hvy/ui';
import { Columns3, FileSpreadsheet, type LucideIcon, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BoolControl, EnumControl, PlaygroundGrid } from '../../../playground';

/**
 * IconButton 플레이그라운드 — 비활성 규칙이 텍스트 버튼과 다르다(아이콘만 흐려진다).
 * tone 마다 실제 사용처의 아이콘을 붙인다 — 조합이 명세와 같아야 확인의 의미가 있다.
 */
const TONES = ['neutral', 'primary', 'danger', 'excel'] as const;

const ICON_SIZES = ['sm', 'md'] as const;

// [컴포넌트 참조, 코드 표기용 이름] 쌍 — 코드 스니펫에 실제 import 이름을 보여준다
const TONE_ICON: Readonly<Record<(typeof TONES)[number], readonly [LucideIcon, string]>> = {
  neutral: [Columns3, 'Columns3'],
  primary: [Plus, 'Plus'],
  danger: [Trash2, 'Trash2'],
  excel: [FileSpreadsheet, 'FileSpreadsheet'],
};

export function IconButtonDemo() {
  const [tone, setTone] = useState<(typeof TONES)[number]>('neutral');
  const [iconSize, setIconSize] = useState<(typeof ICON_SIZES)[number]>('md');
  const [disabled, setDisabled] = useState(false);

  const code = [
    `<IconButton tone="${tone}" icon={${TONE_ICON[tone][1]}} iconSize="${iconSize}" label="…"`,
    disabled ? ' disabled title="…"' : '',
    ' />',
  ].join('');

  return (
    <PlaygroundGrid
      controls={
        <>
          <EnumControl label="tone" value={tone} options={TONES} onChange={setTone} />
          <EnumControl
            label="iconSize"
            value={iconSize}
            options={ICON_SIZES}
            onChange={setIconSize}
          />
          <BoolControl label="disabled" checked={disabled} onChange={setDisabled} />
        </>
      }
      code={code}
    >
      <IconButton
        tone={tone}
        icon={TONE_ICON[tone][0]}
        iconSize={iconSize}
        label={`${tone} 데모`}
        disabled={disabled}
        title={disabled ? '컨트롤에서 비활성으로 켠 상태다' : undefined}
      />
    </PlaygroundGrid>
  );
}
