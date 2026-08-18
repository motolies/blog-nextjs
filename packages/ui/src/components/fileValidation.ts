/**
 * FileUpload 의 확장자 검증 — `accept` 문자열이 **단일 진실 소스**다.
 *
 * 네이티브 `accept` 는 파일 대화상자의 필터일 뿐 강제가 아니다(드래그·"모든 파일" 전환으로
 * 우회된다). 그래서 같은 문자열을 여기서 파싱해 선택 결과를 다시 검증한다 — 두 값을
 * 따로 받으면 언젠가 어긋난다.
 *
 * `.ext` 토큰만 검증 대상이다 — MIME 토큰(`image/*` 등)은 브라우저 판정이 더 정확해
 * 네이티브에 맡긴다. React 에 의존하지 않는다(node 환경 단위 테스트 대상).
 */

/** accept 문자열에서 `.ext` 토큰만 소문자로 뽑는다 — MIME 토큰은 버린다. */
export function acceptedExtensions(accept: string | undefined): readonly string[] {
  if (!accept) return [];
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.startsWith('.') && token.length > 1);
}

/**
 * 파일명이 accept 의 확장자 제한을 통과하는가.
 * `.ext` 토큰이 하나도 없으면(미지정 또는 MIME 만) 항상 통과 — 검증할 계약이 없다.
 */
export function isAcceptedFile(accept: string | undefined, fileName: string): boolean {
  const extensions = acceptedExtensions(accept);
  if (extensions.length === 0) return true;
  const lower = fileName.toLowerCase();
  return extensions.some((extension) => lower.endsWith(extension));
}

/**
 * 파일 크기가 상한(바이트, 포함)을 통과하는가. 상한 미지정이면 항상 통과.
 * 네이티브 `accept` 처럼 대화상자가 걸러 주지 않는 축이라 **여기가 유일한 방어선**이다 —
 * 진짜 방어는 서버 몫이고 이것은 업로드 전에 알려 주는 UX 방어다.
 */
export function isAcceptedFileSize(maxSize: number | undefined, fileSize: number): boolean {
  if (maxSize === undefined) return true;
  return fileSize <= maxSize;
}
