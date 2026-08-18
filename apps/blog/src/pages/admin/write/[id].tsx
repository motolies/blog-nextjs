import { useRouter } from 'next/router';
import { useEffect } from 'react';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import PostModifyComponent from '@/components/post/PostModifyComponent';
import { usePostFormStore } from '@/store/usePostFormStore';

export default function ModifyPostPage() {
  const router = useRouter();
  const loadForModify = usePostFormStore((s) => s.loadForModify);
  const postId = router.query.id as string;

  useEffect(() => {
    if (!router.isReady) return;
    loadForModify(postId);
  }, [loadForModify, postId, router.isReady]);

  return (
    <AdminPageFrame contentClassName="min-h-0">
      <PostModifyComponent />
    </AdminPageFrame>
  );
}
