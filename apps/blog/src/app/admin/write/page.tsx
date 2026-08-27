'use client';

import { useEffect } from 'react';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import PostModifyComponent from '@/components/post/PostModifyComponent';
import { usePostFormStore } from '@/store/usePostFormStore';

export default function NewPostPage() {
  const loadForModify = usePostFormStore((s) => s.loadForModify);
  useEffect(() => {
    loadForModify();
  }, [loadForModify]);

  return (
    <AdminPageFrame contentClassName="min-h-0">
      <PostModifyComponent />
    </AdminPageFrame>
  );
}
