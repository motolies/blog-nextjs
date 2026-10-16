import { base64Decode, base64Encode } from '@/util/base64Util';

/**
 * 본문 mermaid 코드블록의 순수 로직 — DOM·mermaid 에 의존하지 않아 node 환경에서 단위 테스트한다.
 *
 * 본문에는 두 형태가 섞여 있다.
 * - 과거 글: `<code class="language-plaintext language-mermaid">` (에디터 언어 목록에 mermaid 가 없던 시절)
 * - 이후 글: `<code class="language-mermaid">`
 * 클래스 셀렉터는 토큰 단위로 매칭하므로 하나의 셀렉터로 둘 다 잡힌다.
 */
export const MERMAID_CODE_SELECTOR = 'pre > code.language-mermaid';

/** 다이어그램 글꼴 — 사이트 전역 폰트 스택과 같다. 본문 뷰어와 /util/mermaid 가 공유한다. */
export const MERMAID_FONT_FAMILY = '"JetBrains Mono", "D2Coding", monospace';

/**
 * 읽을 수 있는 최소 축소 배율. mermaid 기본 글자 16px × 0.7 ≈ 11px 이 모바일 가독 하한이다.
 * 이보다 더 줄여야 본문 폭에 들어가는 다이어그램은 축소를 멈추고 가로 스크롤로 넘긴다.
 */
export const MIN_READABLE_SCALE = 0.7;

export type FitMode =
  | { readonly mode: 'fit' }
  | { readonly mode: 'scroll'; readonly width: number };

/**
 * 본문 폭과 SVG 원래 폭(viewBox)으로 표시 방식을 고른다.
 * - fit: 원래 크기 이하로만 표시하고 넘치면 본문 폭에 맞춰 줄인다(mermaid 의 max-width 가 확대를 막는다)
 * - scroll: 최소 배율로 고정한 폭을 돌려주고, 호출부가 캔버스 안 가로 스크롤로 보여 준다
 * 측정값이 아직 없거나 비정상이면 fit 으로 둔다 — 잘못된 폭을 박는 것보다 안전하다.
 */
export function pickFitMode(containerWidth: number, naturalWidth: number): FitMode {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(naturalWidth) ||
    containerWidth <= 0 ||
    naturalWidth <= 0
  ) {
    return { mode: 'fit' };
  }
  if (containerWidth / naturalWidth >= MIN_READABLE_SCALE) {
    return { mode: 'fit' };
  }
  return { mode: 'scroll', width: Math.round(naturalWidth * MIN_READABLE_SCALE) };
}

/**
 * 크게 보기 모달의 첫 배율. 화면 맞춤으로 읽을 수 있으면 맞춤, 최소 배율 아래로 떨어지면
 * (세로 모바일의 넓은 다이어그램 등) 원본 크기로 연다 — 맞춤이 본문보다 더 작게 보이는 역전을 막는다.
 */
export function pickViewerZoom(
  canvasWidth: number,
  canvasHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): 'fit' | 'actual' {
  const sizes = [canvasWidth, canvasHeight, naturalWidth, naturalHeight];
  if (sizes.some((size) => !Number.isFinite(size) || size <= 0)) return 'fit';
  const fitScale = Math.min(canvasWidth / naturalWidth, canvasHeight / naturalHeight);
  return fitScale >= MIN_READABLE_SCALE ? 'fit' : 'actual';
}

const CODE_CLASS_ATTR = /(<code\b[^>]*?\sclass=)(["'])([^"']*)\2/gi;
const PLAINTEXT_CLASS = 'language-plaintext';
const LANGUAGE_PREFIX = 'language-';

/**
 * 코드블록의 `language-plaintext language-X` 이중 클래스를 `language-X` 하나로 정리한다.
 *
 * 에디터(CKEditor)는 class 목록에서 **처음 만나는** 등록 언어를 고르므로, 이중 클래스 글을
 * 그대로 열면 plaintext 로 읽혀 X 는 GHS 의 잔여 클래스로만 남는다. 그 상태로 마크다운 모드를
 * 왕복하면 변환기가 첫 클래스만 읽어 X 가 사라진다 — 로드 시 한 번 정리해 이 손실을 막는다.
 * X 가 등록 언어가 아니면 정리하지 않는다(plaintext 를 지우면 에디터가 언어를 잃는다).
 */
export function normalizeCodeBlockClasses(html: string, languages: readonly string[]): string {
  if (!html.includes(PLAINTEXT_CLASS)) return html;
  const registered = new Set(languages);

  return html.replace(CODE_CLASS_ATTR, (whole, prefix: string, quote: string, value: string) => {
    const tokens = value.split(/\s+/).filter(Boolean);
    if (!tokens.includes(PLAINTEXT_CLASS)) return whole;

    const hasRegisteredLanguage = tokens.some(
      (token) =>
        token !== PLAINTEXT_CLASS &&
        token.startsWith(LANGUAGE_PREFIX) &&
        registered.has(token.slice(LANGUAGE_PREFIX.length)),
    );
    if (!hasRegisteredLanguage) return whole;

    const next = tokens.filter((token) => token !== PLAINTEXT_CLASS).join(' ');
    return `${prefix}${quote}${next}${quote}`;
  });
}

const EDITOR_HASH_KEY = 'code';

/**
 * /util/mermaid 로 소스를 넘기는 해시를 만든다.
 * 쿼리 대신 해시를 쓰는 이유: 서버로 전송되지 않아 액세스 로그에 본문 일부가 남지 않는다.
 */
export function buildMermaidEditorHash(code: string): string {
  return `#${EDITOR_HASH_KEY}=${base64Encode(code)}`;
}

/** 본문 다이어그램을 새 탭의 mermaid 에디터로 여는 주소. */
export function mermaidEditorHref(code: string): string {
  return `/util/mermaid${buildMermaidEditorHash(code)}`;
}

/** buildMermaidEditorHash 의 역. 키가 없거나 디코딩에 실패하면 null — 호출부는 기본 예제로 돌아간다. */
export function parseMermaidEditorHash(hash: string): string | null {
  const encoded = new URLSearchParams(hash.replace(/^#/, '')).get(EDITOR_HASH_KEY);
  if (!encoded) return null;
  try {
    const code = base64Decode(encoded);
    return code.trim() ? code : null;
  } catch {
    return null;
  }
}
