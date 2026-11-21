// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// React Router 7은 TextEncoder를 쓰는데 CRA(Jest 27)의 jsdom에는 없다
import { TextDecoder, TextEncoder } from 'util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

// 페이지 테스트는 MUI 다이얼로그·Autocomplete를 실제로 그려서 느린 환경(CI, 전체 실행)에서 기본 5초를 넘길 수 있다
jest.setTimeout(20000);
