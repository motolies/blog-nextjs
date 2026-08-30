'use client';

import { Badge, Tab, TabList, TabPanel, Tabs } from '@hvy/ui';
import { useState } from 'react';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import type { LinkRootKey } from '@/types/linkTree';
import LinkTreeManager from './LinkTreeManager';

/**
 * 즐겨찾기 관리 — 공개(FAVORITE)와 관리자 전용(PLATFORM)을 탭으로 함께 다룬다.
 *
 * 두 트리는 구조가 같아 `LinkTreeManager` 하나를 루트 코드만 바꿔 재사용한다.
 * 탭 라벨의 Badge 와 공개 탭의 경고 배너는 장식이 아니라 **안전장치**다 —
 * 통합 화면에서는 내부 URL 을 공개 탭에 잘못 넣는 실수가 조용히 성공하고 즉시 전체에 노출된다.
 * 데이터 구조로는 막을 수 없어(둘 다 그냥 문자열 URL) 화면이 구분을 계속 보여줘야 한다.
 *
 * 기본 탭이 PLATFORM 인 것도 같은 이유다 — 자주 여는 탭이 기본이면 공개 탭으로 넘어갈 때
 * 탭 전환을 의식하게 된다. @hvy/ui Tabs 는 URL 을 모르므로(컴포넌트 주석) 상태는 로컬로 둔다
 * (/admin/memo 선례와 같다).
 */
export default function FavoriteAdminPage() {
  const [tab, setTab] = useState<LinkRootKey>('PLATFORM');

  return (
    <AdminPageFrame>
      <Tabs value={tab} onValueChange={(value) => setTab(value as LinkRootKey)}>
        <TabList label="즐겨찾기 관리 탭">
          <Tab value="PLATFORM">
            <span className="flex items-center gap-2">
              플랫폼
              <Badge tone="warning" size="xs">
                관리자 전용
              </Badge>
            </span>
          </Tab>
          <Tab value="FAVORITE">
            <span className="flex items-center gap-2">
              공개 즐겨찾기
              <Badge tone="primary" size="xs">
                전체 공개
              </Badge>
            </span>
          </Tab>
        </TabList>

        <TabPanel value="PLATFORM">
          <LinkTreeManager rootCode="PLATFORM" />
        </TabPanel>
        <TabPanel value="FAVORITE">
          <LinkTreeManager rootCode="FAVORITE" />
        </TabPanel>
      </Tabs>
    </AdminPageFrame>
  );
}
