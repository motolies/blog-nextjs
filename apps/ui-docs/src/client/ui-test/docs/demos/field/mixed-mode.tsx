'use client';

import { Button, Field, type FieldMode, FormGrid, FormMode, Input } from '@hvy/ui';
import { useState } from 'react';

/**
 * 혼합 모드 — 폼 모드와 무관하게 자기 상태를 지키는 두 칸.
 *
 * 볼 것:
 * · `<Field mode="edit">` — 폼이 view 여도 이 칸만 편집이 열려 있다(**단독 상태 유지**).
 *   Field 로 감싼 칸은 Field 가 view 크롬(라벨 span 화·오류 배선 절단)을 그리므로
 *   컨트롤이 아니라 **Field 의 mode 가 오버라이드 지점**이다
 * · `lock` — 시스템 채움 영구 불변. 폼을 edit 로 토글해도 자물쇠와 편집 불가가 유지된다
 *   (lock 은 **모든 mode 를 이긴다** — 값은 readOnly 라 FormData 에는 실린다)
 * · view 는 입력 DOM 을 없애 폼 값이 안 나온다 — 그래서 이 폼은 제어형이다
 * · 모드 토글 버튼은 FormMode 밖이다 — 조작 UI 까지 잠그면 view 에서 빠져나올 수 없다
 */
const MODES: readonly FieldMode[] = ['edit', 'view'];

export function FieldMixedModeDemo() {
  const [mode, setMode] = useState<FieldMode>('view');
  const [author, setAuthor] = useState('홍길동');
  const [adminNote, setAdminNote] = useState('상담원만 고치는 칸 — 조회 중에도 편집');

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-1.5">
        {MODES.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={mode === entry ? 'primary' : 'outline-strong'}
            onClick={() => setMode(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>

      <FormMode value={mode}>
        <FormGrid>
          {/* 폼 모드를 따라간다 — view 에서 값 텍스트, edit 에서 편집 */}
          <Field label="작성자" htmlFor="mm-author">
            <Input
              id="mm-author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
          </Field>

          {/* 단독 상태 유지 — 명시 mode 가 FormMode 를 이긴다. 조회 화면에서도 열린 칸 */}
          <Field
            label="관리 메모"
            htmlFor="mm-adminNote"
            mode="edit"
            help="Field mode='edit' 고정 — 폼이 view 여도 편집"
          >
            <Input
              id="mm-adminNote"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
            />
          </Field>

          {/* lock 은 모든 mode 를 이긴다 — 폼을 edit 로 바꿔도 이 칸은 계속 잠겨 있다 */}
          <Field label="게시글 ID" htmlFor="mm-orderNo" help="lock — 폼이 edit 여도 불변">
            <Input
              id="mm-orderNo"
              lock
              defaultValue="POST-100024"
              placeholder="자동 / 저장 시 발급"
            />
          </Field>
        </FormGrid>
      </FormMode>
    </div>
  );
}
