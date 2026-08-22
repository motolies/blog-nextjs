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
  const controlClassName = 'h-12 min-h-12 rounded-2xl text-sm';

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
    <div className="surface-panel-strong w-full rounded-(--radius-panel) p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
            Quick Search
          </p>
          <p className="public-muted-text mt-2 text-sm">
            현재 선택: <span className="font-medium text-dl-fg">{host}</span>
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-dl-tonal text-dl-tonal-fg">
          <Search className="h-4 w-4" />
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(10rem,13.75rem)_minmax(0,1fr)_8.75rem]">
        <Select
          value={selectedEngine?.url ?? ''}
          onValueChange={setSelectedUrl}
          placeholder="검색 엔진 선택"
          options={engines.map((engine) => ({ value: engine.url, label: engine.name }))}
          className={`${controlClassName} public-control-surface w-full border px-4 py-0 leading-none`}
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
          className={`${controlClassName} public-control-surface border px-4 placeholder:text-[color:var(--public-text-subtle)] focus-visible:border-dl-primary focus-visible:ring-dl-primary`}
        />

        <Button
          variant="primary"
          type="button"
          onClick={goSearch}
          disabled={!selectedEngine?.url || text.length === 0}
          title="검색 엔진을 고르고 검색어를 입력하면 눌러진다"
          className={`${controlClassName} w-full bg-dl-primary px-5 text-dl-primary-fg hover:bg-dl-primary-hover disabled:bg-dl-locked-bg disabled:text-dl-locked-fg`}
        >
          <ArrowUpRight className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
};
