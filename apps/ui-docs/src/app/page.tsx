import { InventoryGallery } from '../client/ui-test/inventory-gallery';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 개요 — barrel export 전수 목록(부패 방지 장치). */
export default function UiDocsOverviewPage() {
  return <InventoryGallery />;
}
