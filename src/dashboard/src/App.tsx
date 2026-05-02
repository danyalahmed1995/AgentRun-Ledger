import { useEffect, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider, Alert, createTheme } from '@mui/material';
import { fetchSession, fetchSessions } from './api.js';
import { SessionList } from './components/SessionList.js';
import { SessionDetail } from './components/SessionDetail.js';
import type { SessionDetail as SessionDetailType, SessionSummary } from '../../core/types.js';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#111827'
    },
    primary: {
      main: '#38bdf8'
    },
    success: {
      main: '#22c55e'
    },
    error: {
      main: '#ef4444'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1'
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
});

export function App() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SessionDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchSessions()
      .then((items) => {
        setSessions(items);
        setSelectedId(items[0]?.session.id ?? null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetchSession(selectedId)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, minHeight: '100vh', bgcolor: '#0f172a' }}>
        <SessionList sessions={sessions} selectedId={selectedId} loading={loadingSessions} onSelect={setSelectedId} />
        <Box component="main" sx={{ p: { xs: 2, md: 4 }, minWidth: 0 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loadingDetail ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 360 }}>
              <CircularProgress />
            </Box>
          ) : detail ? (
            <SessionDetail detail={detail} />
          ) : (
            <Alert severity="info">No session selected.</Alert>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
