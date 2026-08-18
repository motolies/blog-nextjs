'use client';

import { Field, FileUpload, FormMode } from '@hvy/ui';

/**
 * FileUpload 3모드 + lock — 열마다 `FormMode` 로 감은 정적 대비.
 *
 * 볼 것:
 * · view: 파일명 텍스트만 남는다(빈값이면 빈칸 — placeholder 금지 규칙)
 * · disabled: 박스·버튼이 남은 채 비활성 — FormData 에서 빠진다(네이티브 규약)
 * · lock: [파일 선택] 버튼 **자체가 사라진다** — 영구 불변 칸에 비활성 버튼은
 *   거짓 어포던스다. 자물쇠는 어느 모드에서도 유지된다(lock 은 모든 mode 를 이긴다)
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function FileUploadModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="정산서" htmlFor={`fum-${mode}-report`}>
              <FileUpload
                id={`fum-${mode}-report`}
                fileName="정산서_7월.pdf"
                accept=".pdf"
                buttonLabel="파일 선택"
              />
            </Field>
            <Field label="빈 값" htmlFor={`fum-${mode}-empty`}>
              <FileUpload
                id={`fum-${mode}-empty`}
                accept=".pdf"
                buttonLabel="파일 선택"
                placeholder="PDF 파일"
              />
            </Field>
            <Field label="사업자등록증 (lock)" htmlFor={`fum-${mode}-locked`}>
              <FileUpload
                id={`fum-${mode}-locked`}
                lock
                fileName="사업자등록증.pdf"
                buttonLabel="파일 선택"
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
