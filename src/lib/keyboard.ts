interface KeyEventLike {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  defaultPrevented: boolean;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  nativeEvent: { isComposing?: boolean };
}

/**
 * 입력칸에서 "다음으로 넘어가기"로 처리할 Enter인지.
 * - 한글 IME 조합 중 Enter는 글자 확정용이라 제외
 * - 조합키(Shift/Ctrl/Alt/Meta)와 함께 누른 Enter 제외
 * - 컴포넌트가 이미 처리한 Enter(Autocomplete 옵션 선택 등, preventDefault) 제외
 * - 포털로 띄운 팝업(달력 등)에서 React 트리를 타고 올라온 이벤트 제외
 */
export function isFieldEnter(e: KeyEventLike): boolean {
  if (e.key !== 'Enter') return false;
  if (e.nativeEvent.isComposing) return false;
  if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return false;
  if (e.defaultPrevented) return false;
  const container = e.currentTarget as Node | null;
  const target = e.target as Node | null;
  if (container && target && typeof container.contains === 'function' && !container.contains(target)) {
    return false;
  }
  return true;
}

/**
 * 컨테이너 안의 첫 입력 요소에 포커스한다.
 * MUI X 날짜 필드는 섹션(role="spinbutton")에 포커스해야 하므로 먼저 찾는다.
 */
export function focusFirstField(container: HTMLElement | null): boolean {
  if (!container) return false;
  const el =
    container.querySelector<HTMLElement>('[role="spinbutton"]') ??
    container.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([aria-hidden="true"]):not([disabled]), textarea:not([disabled])',
    );
  if (!el) return false;
  el.focus();
  return true;
}
