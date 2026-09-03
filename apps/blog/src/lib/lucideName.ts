/**
 * lucide 아이콘 이름 변환 — kebab(`dynamicIconImports` 키) ↔ PascalCase(컴포넌트 이름 = DB 저장값).
 *
 * `lucideMeta.ts` 에서 떼어낸 이유: 이름 변환은 공개 홈이 쓰는 `lazyLinkIcon.tsx` 의 유일한 의존인데,
 * 카탈로그·한글 카테고리 제목·검색까지 든 모듈을 통째로 import 하면 Turbopack 이 그 전부를 홈
 * 청크에 실었다(실측 +15KB). 이 파일은 두 함수뿐이라 홈이 지불하는 비용이 최소가 된다.
 *
 * React·lucide 무의존, node 환경 vitest 로 검증한다(`lucideMeta.test.ts`).
 */

/**
 * lucide 의 kebab → PascalCase 규칙 재현. `createLucideIcon` 이 displayName 을 만들 때 쓰는
 * `toCamelCase`(`/^([A-Z])|[\s-_]+(\w)/g`) 위에 첫 글자 대문자화를 얹은 것과 같다.
 */
export function toPascalCase(kebab: string): string {
  const camel = kebab.replace(
    /^([A-Z])|[\s-_]+(\w)/g,
    (_match, p1: string | undefined, p2: string | undefined) =>
      p2 ? p2.toUpperCase() : (p1 ?? '').toLowerCase(),
  );
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * PascalCase → kebab 역변환. 대문자는 항상 새 세그먼트를 열고, 숫자는 **직전 세그먼트가 글자로
 * 시작했을 때만** 새 세그먼트를 연다 — 그래야 `Grid2x2→grid-2x2`, `FolderGit2→folder-git-2`,
 * `Rotate3d→rotate-3d`, `Clock12→clock-12` 가 모두 맞는다. lucide 이름 1,950개 전부에 대해
 * 왕복이 검증돼 있다. 유일한 예외는 `arrow-down-0-1` 처럼 lucide 가 `arrow-down-01` 별칭을 함께
 * 둔 4쌍인데, 두 키가 같은 모듈이라 어느 쪽으로 풀려도 같은 아이콘이다.
 */
export function toLucideKebab(pascal: string): string {
  const segments: string[] = [];
  let current = '';
  let digitLed = false;
  for (const ch of pascal) {
    const isUpper = ch >= 'A' && ch <= 'Z';
    const isDigit = ch >= '0' && ch <= '9';
    if (isUpper || (isDigit && current !== '' && !digitLed)) {
      if (current) segments.push(current);
      current = ch;
      digitLed = isDigit;
    } else {
      if (current === '') digitLed = isDigit;
      current += ch;
    }
  }
  if (current) segments.push(current);
  return segments.join('-').toLowerCase();
}
