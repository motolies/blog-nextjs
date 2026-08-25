'use client';

import {
  Button,
  Card,
  CardHeader,
  Field,
  FormGrid,
  IconButton,
  Input,
  Select,
  showToast,
  Textarea,
} from '@hvy/ui';
import { Save, Search } from 'lucide-react';
import type { FormEvent } from 'react';

/**
 * 섹션이 셋인 긴 폼 — **격자를 나누지 않고 카드를 나눈다.**
 *
 * `FormGrid` 에 섹션 API 가 없는 이유가 여기서 보인다. `dl-form-grid` 는 `auto-fit` 이라
 * 열 수를 **컨테이너 폭**이 정하는데, 폭을 카드가 아니라 **바깥 폼이 쥐므로**(`max-w-4xl`)
 * 세 카드가 같은 폭이 되고 세 격자가 같은 열 수를 뽑는다 — 창을 줄이면 셋이 **동시에**
 * 접힌다. 카드마다 폭을 따로 주면 이 정렬이 조용히 깨지고, 그때 화면은 한 폼이 아니라
 * "격자가 세 벌"처럼 읽힌다.
 *
 * 앞의 두 카드는 **필드 순서를 같게** 두었다 — 제목계열 · URL계열 · 분류(Select) · 날짜 ·
 * 긴 텍스트(전폭). 열 격자가 같으니 대응하는 칸이 두 카드에서 같은 세로선 위에 온다.
 *
 * `col-span-full` 은 세 가지 이유로만 쓴다:
 *   ① 값이 길다(요약·메타 설명) ② 한 칸에 컨트롤이 여럿이라 220px 트랙에 안 들어간다
 *   (이미지 규격) ③ 여러 줄이다(대체 텍스트).
 * **기준은 컨트롤 개수가 아니라 최소 트랙 폭에 들어가는가**다 — 이 폼에 컨트롤이 둘인 칸이
 * 두 개 있는데 판정이 갈린다: 태그(입력 + 아이콘 버튼)는 트랙에 들어가 전폭이 아니고,
 * 이미지 규격(입력 + × + 입력 + 단위)은 못 들어가 전폭이다. 개수가 기준이었다면 둘이 같아야 한다.
 *
 * 상태를 두지 않는다. 이 예제가 증명하는 것은 배치이고, 배치는 값이 바뀌어도 변하지 않는다.
 * 값 배선·검증은 basic·form-save 예제가 갖는다 — 같은 것을 두 예제가 보여주면 어느 쪽이
 * 정본인지 흐려진다. 칸마다 `name` 이 있어 저장은 `FormData` 로 값을 그대로 읽는다.
 */

const CATEGORY_OPTIONS = [
  { value: 'DEV', label: '개발' },
  { value: 'ESSAY', label: '에세이' },
  { value: 'REVIEW', label: '리뷰' },
  { value: 'NOTE', label: '노트' },
];

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: '전체 공개' },
  { value: 'LINK', label: '링크가 있는 사람' },
  { value: 'PRIVATE', label: '비공개' },
];

const IMAGE_FORMAT_OPTIONS = [
  { value: 'WEBP', label: 'WebP' },
  { value: 'AVIF', label: 'AVIF' },
  { value: 'PNG', label: 'PNG' },
  { value: 'JPG', label: 'JPEG' },
];

export function FormGridSectionsDemo() {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    showToast(`저장되었습니다 — ${[...data.keys()].length}개 항목`);
  };

  return (
    <form onSubmit={submit}>
      {/* 앱 셸 재현(app-chrome 의 main 이 같은 값이다) — 흰 카드끼리는 배경이 갈려야
          세 덩어리로 읽힌다. 폭도 여기 한 곳에서만 정한다. */}
      <div className="flex max-w-4xl flex-col gap-dl-gutter rounded-dl-container bg-dl-canvas p-dl-gutter">
        <Card>
          <CardHeader title="게시글" />
          {/* Card 가 py-2.5, CardHeader 가 mb-3 을 이미 갖는다 — 격자에 여백을 덧대지 않는다. */}
          <FormGrid>
            <Field label="제목" htmlFor="fgs-post-subject" required>
              <Input
                id="fgs-post-subject"
                name="subject"
                defaultValue="Next.js App Router 이행 메모"
              />
            </Field>
            {/* 컨트롤이 둘인데 전폭이 아니다 — 짧은 입력 + 아이콘 버튼이라 한 트랙에 들어간다.
                `min-w-0` 이 없으면 dl-field 의 width:100% 가 트랙을 밀고 나간다.
                IconButton 기본 size 는 sm(36) 이라 입력(42)과 6px 어긋난다 — md 로 맞춘다. */}
            <Field label="태그" htmlFor="fgs-post-tags">
              <div className="flex items-center gap-1.5">
                <Input id="fgs-post-tags" name="tags" className="min-w-0" defaultValue="nextjs" />
                <IconButton icon={Search} label="태그 사전에서 찾기" size="md" />
              </div>
            </Field>
            <Field label="카테고리" htmlFor="fgs-post-category" required>
              <Select
                id="fgs-post-category"
                name="category"
                placeholder="선택"
                options={CATEGORY_OPTIONS}
              />
            </Field>
            <Field label="작성일" htmlFor="fgs-post-date" required>
              <Input id="fgs-post-date" name="writtenAt" defaultValue="2026-07-15" />
            </Field>
            {/* 값이 길어 한 줄을 다 쓴다 — 열 개수에 묶인 숫자가 아니라 col-span-full 이다. */}
            <Field label="요약" htmlFor="fgs-post-summary" required className="col-span-full">
              <Input
                id="fgs-post-summary"
                name="summary"
                defaultValue="Pages Router 에서 App Router 로 옮기며 겪은 것들을 정리했다."
              />
            </Field>
          </FormGrid>
        </Card>

        <Card>
          <CardHeader title="발행 설정" />
          <FormGrid>
            {/* 비한국어 값을 한 칸 남긴다 — 한글·라틴·CJK 가 같은 줄에서 어떻게 앉는지
                (줄 높이·말줄임) 조판을 확인하는 자리다. */}
            <Field label="메타 제목" htmlFor="fgs-meta-title" required>
              <Input
                id="fgs-meta-title"
                name="metaTitle"
                defaultValue="Next.js App Router 移行メモ"
              />
            </Field>
            <Field label="정규 URL" htmlFor="fgs-meta-canonical">
              <Input
                id="fgs-meta-canonical"
                name="canonicalUrl"
                defaultValue="/posts/app-router-notes"
              />
            </Field>
            <Field label="공개 범위" htmlFor="fgs-meta-visibility" required>
              <Select
                id="fgs-meta-visibility"
                name="visibility"
                placeholder="선택"
                options={VISIBILITY_OPTIONS}
              />
            </Field>
            <Field label="발행일" htmlFor="fgs-meta-date" required>
              <Input id="fgs-meta-date" name="publishedAt" defaultValue="2026-07-20" />
            </Field>
            <Field
              label="메타 설명"
              htmlFor="fgs-meta-description"
              required
              className="col-span-full"
            >
              <Input
                id="fgs-meta-description"
                name="metaDescription"
                defaultValue="App Router 이행에서 실제로 막혔던 지점과 해결 방법."
              />
            </Field>
          </FormGrid>
        </Card>

        <Card>
          <CardHeader title="대표 이미지" />
          <FormGrid>
            <Field label="파일명" htmlFor="fgs-img-name" required>
              <Input id="fgs-img-name" name="imageName" defaultValue="app-router-cover" />
            </Field>
            <Field label="형식" htmlFor="fgs-img-format" required>
              <Select
                id="fgs-img-format"
                name="imageFormat"
                placeholder="선택"
                options={IMAGE_FORMAT_OPTIONS}
              />
            </Field>
            <Field label="용량(KB)" htmlFor="fgs-img-size" required>
              <Input id="fgs-img-size" name="imageSize" inputMode="decimal" defaultValue="148.2" />
            </Field>
            {/* 한 칸에 컨트롤이 넷이라 전폭이다. 각 입력에 id 를 **직접** 준다 — 생략하면
                둘 다 Field 컨텍스트의 htmlFor 를 물려받아 id 가 중복된다(field.tsx 의
                `overrides.id ?? context.id`). 라벨이 붙지 않는 쪽은 aria-label 로 이름을 준다. */}
            <Field
              label="이미지 규격"
              htmlFor="fgs-img-w"
              help="가로 × 세로"
              className="col-span-full"
            >
              <div className="flex items-center gap-1.5">
                <Input id="fgs-img-w" name="imageWidth" className="min-w-0" defaultValue="1200" />
                <span className="shrink-0 text-dl-fg-muted text-dl-sm">×</span>
                <Input
                  id="fgs-img-h"
                  name="imageHeight"
                  className="min-w-0"
                  aria-label="세로"
                  defaultValue="630"
                />
                <span className="shrink-0 text-dl-fg-muted text-dl-sm">px</span>
              </div>
            </Field>
            {/* 여러 줄이라 전폭이다 — 한 트랙(220px)이면 두세 단어마다 줄이 바뀐다. */}
            <Field label="대체 텍스트" htmlFor="fgs-img-alt" className="col-span-full">
              <Textarea
                id="fgs-img-alt"
                name="imageAlt"
                placeholder="스크린리더가 읽을 설명 · 이미지가 안 뜰 때 대신 보이는 문구"
              />
            </Field>
          </FormGrid>
        </Card>

        {/* 저장 단위가 폼 전체 하나라서 어느 카드에도 속하지 않는다 — 카드 안에 넣으면
            "이 섹션만 저장"이라는 없는 기능을 암시한다. 카드가 하나뿐인 basic 예제가
            카드 안 하단(border-t)에 둘 수 있었던 것과 갈리는 지점이다. */}
        <div className="flex justify-end gap-1.5">
          <Button variant="outline-strong">취소</Button>
          <Button type="submit" variant="primary" icon={Save}>
            저장
          </Button>
        </div>
      </div>
    </form>
  );
}
