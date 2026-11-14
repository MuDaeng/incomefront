import { focusFirstField, isFieldEnter } from '../../src/lib/keyboard';

const container = document.createElement('div');
const inner = document.createElement('input');
container.appendChild(inner);
const outside = document.createElement('div');

const key = (over: Partial<Parameters<typeof isFieldEnter>[0]> = {}) => ({
  key: 'Enter',
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  defaultPrevented: false,
  target: inner,
  currentTarget: container,
  nativeEvent: { isComposing: false },
  ...over,
});

describe('isFieldEnter', () => {
  it('일반 Enter는 다음 칸 이동으로 처리', () => {
    expect(isFieldEnter(key())).toBe(true);
  });

  it('Enter가 아니거나 조합키와 함께면 제외', () => {
    expect(isFieldEnter(key({ key: 'Tab' }))).toBe(false);
    expect(isFieldEnter(key({ shiftKey: true }))).toBe(false);
    expect(isFieldEnter(key({ ctrlKey: true }))).toBe(false);
  });

  it('한글 조합 중 Enter는 제외', () => {
    expect(isFieldEnter(key({ nativeEvent: { isComposing: true } }))).toBe(false);
  });

  it('컴포넌트가 이미 처리한 Enter는 제외', () => {
    expect(isFieldEnter(key({ defaultPrevented: true }))).toBe(false);
  });

  it('포털(팝업)에서 올라온 Enter는 제외', () => {
    expect(isFieldEnter(key({ target: outside }))).toBe(false);
  });
});

describe('focusFirstField', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('날짜 필드 섹션(spinbutton)을 먼저 찾는다', () => {
    const box = document.createElement('div');
    box.innerHTML =
      '<span role="spinbutton" tabindex="0">YYYY</span><input aria-hidden="true" tabindex="-1" />';
    document.body.appendChild(box);
    expect(focusFirstField(box)).toBe(true);
    expect(document.activeElement).toBe(box.querySelector('[role="spinbutton"]'));
  });

  it('숨김 input은 건너뛰고 보이는 input에 포커스', () => {
    const box = document.createElement('div');
    box.innerHTML = '<input type="hidden" /><input id="visible" />';
    document.body.appendChild(box);
    expect(focusFirstField(box)).toBe(true);
    expect(document.activeElement?.id).toBe('visible');
  });

  it('입력 요소가 없으면 false', () => {
    expect(focusFirstField(null)).toBe(false);
    expect(focusFirstField(document.createElement('div'))).toBe(false);
  });
});
