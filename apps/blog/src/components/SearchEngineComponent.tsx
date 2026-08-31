'use client';

import { Button, Input, Select } from '@hvy/ui';
import { ArrowUpRight, Search } from 'lucide-react';
import { useState } from 'react';

interface SearchEngine {
  id: string | number;
  name: string;
  url: string;
}

interface SearchEngineComponentProps {
  engines?: SearchEngine[];
}

export const SearchEngineComponent = ({ engines = [] }: SearchEngineComponentProps) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(engines[0]?.url ?? '');
  const [text, setText] = useState<string>('');
  // 맥북에서 한글 입력 상태를 관리하기 위함
  const [isComposing, setIsComposing] = useState<boolean>(false);
  // 높이·폰트·좌우 패딩은 전부 @hvy/ui 가 --dl-scale-* 로 낮춘다(lg 미만에서 42→36 · 14→13 · 16→13).
  // 예전 shadcn 시절의 h-12/text-sm/px-4 를 남겨두면 그 축소가 통째로 죽으므로 형태만 남긴다.
  // pill 은 디자인 의도라 유지 — --radius-2xl(28px)은 어느 높이에서도 절반을 넘어 형태가 불변이다.
  const controlClassName = 'rounded-2xl';

  const selectedEngine = engines.find((engine) => engine.url === selectedUrl) ?? engines[0];

  const host = (() => {
    try {
      return new URL(selectedEngine?.url ?? '').hostname.replace(/^www\./, '');
    } catch {
      return 'search endpoint';
    }
  })();

  const goSearch = () => {
    if (!selectedEngine?.url || text.length === 0) {
      return;
    }

    const searchUrl = selectedEngine.url.replace('%s', encodeURIComponent(text));
    window.open(searchUrl, '_blank');
  };

  return (
    <div className="surface-panel-strong w-full rounded-(--radius-panel) p-(--public-pad-panel) shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3 lg:mb-5">
        <div>
          <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
            Quick Search
          </p>
          <p className="public-muted-text public-text-body mt-2">
            현재 선택: <span className="font-medium text-dl-fg">{host}</span>
          </p>
        </div>
        {/* 글리프는 박스에서 유도한다 — 비율(40%)을 고정해야 축소해도 여백이 균일하다(Header 로고와 같은 기법) */}
        <span className="flex size-(--public-logo-size) shrink-0 items-center justify-center rounded-2xl bg-dl-tonal text-dl-tonal-fg">
          <Search className="size-[calc(var(--public-logo-size)*0.4)]" />
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(10rem,13.75rem)_minmax(0,1fr)_8.75rem] lg:gap-3">
        <Select
          value={selectedEngine?.url ?? ''}
          onValueChange={setSelectedUrl}
          placeholder="검색 엔진 선택"
          options={engines.map((engine) => ({ value: engine.url, label: engine.name }))}
          className={`${controlClassName} public-control-surface w-full border py-0 leading-none`}
        />

        <Input
          type="search"
          value={text}
          placeholder={selectedEngine?.name ? `${selectedEngine.name}에서 검색` : '검색어 입력'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!isComposing && e.key === 'Enter') {
              goSearch();
            }
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          className={`${controlClassName} public-control-surface border placeholder:text-[color:var(--public-text-subtle)] focus-visible:border-dl-primary focus-visible:ring-dl-primary`}
        />

        <Button
          variant="primary"
          type="button"
          onClick={goSearch}
          disabled={!selectedEngine?.url || text.length === 0}
          title="검색 엔진을 고르고 검색어를 입력하면 눌러진다"
          className={`${controlClassName} w-full bg-dl-primary text-dl-primary-fg hover:bg-dl-primary-hover disabled:bg-dl-locked-bg disabled:text-dl-locked-fg`}
        >
          <ArrowUpRight className="size-dl-ctl-ic-md" />
          Search
        </Button>
      </div>
    </div>
  );
};
