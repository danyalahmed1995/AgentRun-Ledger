import { Box, Chip, Divider, List, ListItemButton, Skeleton, Stack, Typography } from '@mui/material';
import type { SessionSummary } from '../../../core/types.js';

type Props = {
  sessions: SessionSummary[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
};

export function SessionList({ sessions, selectedId, loading, onSelect }: Props) {
  return (
    <Box component="aside" sx={{ bgcolor: '#1e293b', borderRight: '1px solid rgba(148,163,184,0.18)', p: 2.5 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>AgentRun Ledger</Typography>
        <Typography color="text.secondary" variant="body2">Local session receipts</Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: 'rgba(148,163,184,0.22)' }} />
      {loading ? (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={70} />
          <Skeleton variant="rounded" height={70} />
          <Skeleton variant="rounded" height={70} />
        </Stack>
      ) : sessions.length === 0 ? (
        <Typography color="text.secondary">No sessions yet.</Typography>
      ) : (
        <List disablePadding>
          {sessions.map((summary) => (
            <ListItemButton
              key={summary.session.id}
              selected={selectedId === summary.session.id}
              onClick={() => onSelect(summary.session.id)}
              sx={{
                alignItems: 'flex-start',
                borderRadius: 2,
                mb: 1,
                bgcolor: selectedId === summary.session.id ? 'rgba(56,189,248,0.16)' : 'transparent',
                '&.Mui-selected': { bgcolor: 'rgba(56,189,248,0.16)' }
              }}
            >
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>
                  #{summary.session.id} {summary.session.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                    <Chip size="small" label={summary.session.status} color={summary.session.status === 'active' ? 'success' : 'default'} />
                    <Chip size="small" label={`${summary.commandCount} cmds`} />
                    {summary.failedCount > 0 && <Chip size="small" label={`${summary.failedCount} failed`} color="error" />}
                </Box>
              </Box>
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
