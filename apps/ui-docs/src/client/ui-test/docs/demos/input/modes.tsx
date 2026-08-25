'use client';

import { Field, FormMode, Input, Textarea } from '@hvy/ui';

/**
 * Input·Textarea 3모드 정적 대비 — 열마다 `FormMode` 로 감아 같은 값을 세 모드로 그린다.
 * 열은 서로 독립 인스턴스다(모드 왕복·값 보존은 Field 문서의 3모드 데모가 다룬다).
 *
 * 볼 것:
 * · view: 값 텍스트만 남고 행 높이는 편집 컨트롤과 같다(VALUE_MIN_H 파리티)
 * · password: 값 길이와 무관한 고정 ******** — 평문도 길이도 노출하지 않는다
 * · lock × 모드: lock 은 **모든 mode 를 이긴다** — disabled 모드에서도 자물쇠가 유지되고,
 *   edit 로 돌아와도 여전히 편집 불가다(값은 readOnly 라 FormData 에는 실린다)
 * · Textarea view: 줄바꿈 보존(whitespace-pre-wrap)
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function InputModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="작성자" htmlFor={`im-${mode}-author`}>
              <Input id={`im-${mode}-author`} defaultValue="홍길동" />
            </Field>
            <Field label="통관 비밀번호" htmlFor={`im-${mode}-pw`}>
              <Input id={`im-${mode}-pw`} type="password" defaultValue="secret-1234" />
            </Field>
            <Field label="게시글 ID" htmlFor={`im-${mode}-orderNo`}>
              <Input id={`im-${mode}-orderNo`} lock placeholder="자동 / 저장 시 발급" />
            </Field>
            <Field label="요약" htmlFor={`im-${mode}-memo`}>
              <Textarea
                id={`im-${mode}-memo`}
                defaultValue={'경비실에 맡겨 주세요.\n부재 시 연락 바랍니다.'}
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
