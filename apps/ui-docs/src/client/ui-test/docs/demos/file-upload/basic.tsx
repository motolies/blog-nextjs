'use client';

import { Field, FileUpload, FormGrid } from '@hvy/ui';
import { useState } from 'react';

/**
 * FileUpload 기본 — 단일 파일 + 확장자 제한.
 *
 * 볼 것:
 * · `accept=".pdf,.xlsx"` 한 값이 대화상자 필터와 선택 재검증 **양쪽**에 쓰인다 —
 *   대화상자에서 "모든 파일"로 바꿔 다른 확장자를 골라도 값으로 받지 않는다(이전 값 유지)
 * · 위반 시 오류 배색 + `onReject` 호출 — 안내 문구는 앱이 띄운다(`ui` 는 사전을 모른다.
 *   `buttonLabel` 이 필수인 이유와 같다). 다음 유효한 선택에서 오류가 풀린다
 * · × 는 고른 파일만 지운다 — 서버 파일 삭제는 앱의 몫
 * · `fileName`: 서버에 이미 있는 파일명 — 값이 비어 있을 때 대신 표시한다(교체 전 상태)
 */
export function FileUploadBasicDemo() {
  const [rejectedName, setRejectedName] = useState('');

  return (
    <div className="max-w-xl">
      <FormGrid>
        <Field
          label="정산 근거 자료"
          htmlFor="fu-evidence"
          error={
            rejectedName === '' ? undefined : `${rejectedName} — pdf·xlsx 만 업로드할 수 있습니다`
          }
          help="확장자 제한: .pdf, .xlsx"
        >
          <FileUpload
            id="fu-evidence"
            name="evidence"
            accept=".pdf,.xlsx"
            buttonLabel="파일 선택"
            placeholder="PDF 또는 XLSX"
            onReject={(file) => setRejectedName(file.name)}
            onValueChange={() => setRejectedName('')}
          />
        </Field>

        <Field label="계약서 교체" htmlFor="fu-contract" help="서버 파일명 표시 — 새로 고르면 교체">
          <FileUpload
            id="fu-contract"
            fileName="계약서_2026.pdf"
            accept=".pdf"
            buttonLabel="파일 선택"
          />
        </Field>
      </FormGrid>
    </div>
  );
}
