'use client';

import { Switch } from '@hvy/ui';
import { useState } from 'react';

/**
 * Switch 상태 전수 — 트랙 36×20 규격. 라벨이 옆에 있어도 자체 label prop 이 필수다
 * (스크린리더용 이름). 비활성(mode="disabled") off/on 의 배색이 다른 것을 함께 확인한다.
 * 비활성 두 개는 비제어(defaultChecked)다 — 관리형이 되어 onCheckedChange 더미가 필요 없다.
 */
export function SwitchStatesDemo() {
  const [on, setOn] = useState(true);

  return (
    <div className="flex flex-col gap-2.5">
      <Switch checked={on} onCheckedChange={setOn} label="Switch" />
      <Switch defaultChecked={false} mode="disabled" label="Disabled" />
      <Switch defaultChecked mode="disabled" label="Disabled + On" />
    </div>
  );
}
