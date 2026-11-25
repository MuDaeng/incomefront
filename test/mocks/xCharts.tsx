/**
 * 테스트용 MUI X Charts 대체 모듈 (vite.config.ts test.alias가 '@mui/x-charts/*'를 여기로 연결).
 * 실제 차트는 d3(ESM 전용)를 쓰고 jsdom에서 크기를 잴 수 없어서, 페이지 테스트는 차트를 그리지 않고
 * 숫자·표·문구만 확인한다.
 */
import type { ReactNode } from 'react';

const Empty = (_props: Record<string, unknown>) => null;
const Passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>;

export const BarChart = Empty;
export const LineChart = Empty;
export const PieChart = Empty;
export const ChartsContainer = Passthrough;
export const ChartsAxisHighlight = Empty;
export const ChartsGrid = Empty;
export const ChartsReferenceLine = Empty;
export const ChartsTooltipContainer = Passthrough;
export const ChartsXAxis = Empty;
export const ChartsYAxis = Empty;
export const useAxesTooltip = () => null;
const scale = Object.assign((_v: unknown) => 0, { bandwidth: () => 0, step: () => 0 });
export const useXScale = () => scale;
export const useYScale = () => scale;
