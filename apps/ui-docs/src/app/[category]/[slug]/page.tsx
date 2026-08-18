import { notFound } from 'next/navigation';
import { DocPage } from '../../_docs/doc-page';
import { findDoc } from '../../_docs/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 문서 페이지 라우트 — 유일한 렌더 엔진. 문서별 정적 폴더를 두지 않는 이유:
 * force-dynamic 껍데기를 문서마다 복제하게 되고, 어차피 전 페이지가
 * force-dynamic 이라 정적 세그먼트의 빌드타임 이점도 없다. 새 문서는 라우트 추가
 * 없이 레지스트리 등록만으로 열린다.
 */
export default async function UiDocSlugPage({
  params,
}: {
  readonly params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  const doc = findDoc(category, slug);
  if (!doc) notFound();

  return <DocPage doc={doc} />;
}
