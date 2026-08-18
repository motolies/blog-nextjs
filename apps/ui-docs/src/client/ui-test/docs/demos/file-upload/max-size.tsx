'use client';

import { FileUpload, showToast } from '@hvy/ui';

/**
 * 크기 상한(maxSize, 바이트) — 확장자와 달리 대화상자가 걸러 주지 않는 축이라
 * 선택 시 검증한다. 위반 파일은 값으로 받지 않고 reason('extension' | 'size')으로
 * 알린다 — 문구는 앱이 사유별로 고른다(ui 는 사전을 모른다).
 */
export function FileUploadMaxSizeDemo() {
  return (
    <div className="max-w-md">
      <FileUpload
        accept=".pdf,.xlsx"
        maxSize={1024 * 1024}
        buttonLabel="파일 선택"
        placeholder="PDF·XLSX, 1MB 이하"
        onReject={(file, reason) =>
          showToast(
            reason === 'size'
              ? `${file.name} — 1MB 를 초과합니다`
              : `${file.name} — 허용되지 않는 형식입니다`,
            'error',
          )
        }
      />
    </div>
  );
}
