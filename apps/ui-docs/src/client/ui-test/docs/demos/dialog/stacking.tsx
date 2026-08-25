'use client';

import { Button, ContentDialog, useConfirm } from '@hvy/ui';
import { useState } from 'react';

/**
 * 겹침 금지 — **콘솔을 열고** 확인하는 데모다.
 *
 * v3 규칙: 모달 위에 모달을 겹치지 않는다. 목업이 기록한 실제 사고(z-index 2147483646 위에
 * 2147483647)를 구조적으로 막는다.
 *
 * 검증 포인트:
 * · 열린 모달 안에서 또 모달을 열면 **개발 경고가 한 번** 뜬다(warnOnce 라 같은 종류는
 *   반복되지 않는다)
 * · 열린 모달을 리렌더시키는 버튼을 여러 번 눌러도 **경고가 늘지 않는다** — 카운트를
 *   렌더 중이 아니라 effect 에서 세기 때문이다. 오탐하는 경고는 곧 무시되는 경고이고,
 *   그러면 진짜 겹침을 못 잡는다
 * · useConfirm 은 이미 열려 있으면 두 번째 요청을 **경고 없이 거절한다** — 겹치기를
 *   코드로 막는 쪽이다(경고가 아니라 거절이라는 점이 다르다)
 * · StrictMode 이중 마운트에서도 카운트가 균형을 유지한다(cleanup 이 짝을 맞춘다)
 */
export function DialogStackingDemo() {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const askConfirm = useConfirm();
  const [confirmResult, setConfirmResult] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline-gray" onClick={() => setOuter(true)}>
          바깥 모달 열기
        </Button>
        <Button
          variant="outline-gray"
          onClick={async () => {
            // 이미 열려 있으면 provider 가 경고 없이 거절한다 — 겹침을 코드로 막는 경로다.
            const ok = await askConfirm({
              message: 'useConfirm 은 겹침을 거절한다.',
              confirmLabel: '확인',
            });
            setConfirmResult(ok ? '확인' : '취소 또는 거절');
          }}
        >
          useConfirm 동시 호출
        </Button>
      </div>
      {confirmResult === '' ? null : (
        <p className="text-dl-xs text-dl-fg-subtle">useConfirm 결과: {confirmResult}</p>
      )}

      <ContentDialog
        open={outer}
        onOpenChange={setOuter}
        title="바깥 모달"
        description="여기서 안쪽 모달을 열면 콘솔에 경고가 한 번 뜬다."
        size="md"
        footer={
          <Button variant="outline-strong" onClick={() => setOuter(false)}>
            닫기
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-dl-sm text-dl-fg">
            리렌더 횟수: <span className="font-dl-mono">{renderTick}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline-gray"
              onClick={() => setRenderTick((previous) => previous + 1)}
            >
              이 모달 리렌더 (경고가 늘면 안 된다)
            </Button>
            <Button size="sm" variant="outline-red" onClick={() => setInner(true)}>
              안쪽 모달 열기 (경고 발생)
            </Button>
          </div>
        </div>
      </ContentDialog>

      <ContentDialog
        open={inner}
        onOpenChange={setInner}
        title="안쪽 모달 — 이러면 안 된다"
        size="sm"
        footer={
          <Button variant="outline-strong" onClick={() => setInner(false)}>
            닫기
          </Button>
        }
      >
        <p className="text-dl-sm text-dl-fg">
          콘솔을 확인하세요. 같은 종류의 경고는 warnOnce 라 한 번만 뜹니다.
        </p>
      </ContentDialog>
    </div>
  );
}
