/**
 * 클립보드에 텍스트를 쓰고 **실제 성공 여부**를 돌려준다.
 * 비보안 컨텍스트(http)나 권한 거부로 Clipboard API 가 막히면 execCommand 로 폴백하되,
 * 폴백의 반환값까지 확인한다 — 실패를 성공으로 표시하면 사용자가 빈 클립보드를 붙여넣게 된다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    // iOS Safari 는 select() 만으로 범위가 잡히지 않는다
    textarea.setSelectionRange(0, text.length);

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }
}
