'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import PostModifyComponent from '@/components/post/PostModifyComponent';
import { usePostFormStore } from '@/store/usePostFormStore';

export default function ModifyPostPage() {
  // App Router 의 useParams 는 첫 렌더부터 값이 있다 — isReady 류 대기 분기가 필요 없다
  const { id } = useParams<{ id: string }>();
  const loadForModify = usePostFormStore((s) => s.loadForModify);

  useEffect(() => {
    loadForModify(id);
  }, [loadForModify, id]);

  return (
    <AdminPageFrame contentClassName="min-h-0">
      <PostModifyComponent />
    </AdminPageFrame>
  );
}
