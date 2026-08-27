import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTsid } from 'tsid-ts';
import { buildSearchHref } from '@/lib/searchHref';
import { searchObjectInit } from '@/model/searchObject';

/**
 * 헤더·모바일 드로어가 공유하는 빠른 검색 입력 훅.
 * 입력값을 검색 조건(base64 JSON)으로 감싸 /search 로 라우팅한다.
 * 검색 페이지를 벗어나면 입력값을 초기화한다.
 */
export function useQuickSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchText, setSearchText] = useState<string>('');

  useEffect(() => {
    if (!pathname.startsWith('/search')) {
      setSearchText('');
    }
  }, [pathname]);

  // 현재 입력값으로 검색 조건을 구성해 /search 로 이동
  const submitSearch = () => {
    const keywords = searchText.trim() ? [{ id: getTsid().toString(), name: searchText }] : [];
    const condition = {
      ...searchObjectInit,
      ...{
        searchCondition: {
          keywords,
          logic: 'AND',
        },
      },
    };
    router.push(buildSearchHref(condition));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitSearch();
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return { searchText, onChange, onKeyDown, submitSearch };
}
