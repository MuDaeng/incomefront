import { useCallback, useState } from 'react';
import { loadTaxMode, saveTaxMode, type TaxMode } from './dividendTax';

/** 세전/세후 선택. 마지막 선택을 localStorage에 남겨 배당금·기간 수익률 페이지가 같은 값을 쓴다 */
export function useTaxMode(): [TaxMode, (mode: TaxMode) => void] {
  const [mode, setMode] = useState<TaxMode>(loadTaxMode);
  const update = useCallback((next: TaxMode) => {
    setMode(next);
    saveTaxMode(next);
  }, []);
  return [mode, update];
}
