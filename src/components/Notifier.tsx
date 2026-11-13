import { Alert, Snackbar } from '@mui/material';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type Severity = 'success' | 'error' | 'info';
type Notify = (message: string, severity?: Severity) => void;

const NotifierContext = createContext<Notify>(() => undefined);

export function NotifierProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ key: number; message: string; severity: Severity } | null>(
    null,
  );
  const notify = useCallback<Notify>((message, severity = 'success') => {
    setState({ key: Date.now(), message, severity });
  }, []);

  return (
    <NotifierContext.Provider value={notify}>
      {children}
      <Snackbar
        key={state?.key}
        open={!!state}
        autoHideDuration={4000}
        onClose={() => setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          variant="filled"
          severity={state?.severity ?? 'success'}
          onClose={() => setState(null)}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {state?.message}
        </Alert>
      </Snackbar>
    </NotifierContext.Provider>
  );
}

export const useNotify = () => useContext(NotifierContext);
