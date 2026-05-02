import { Box, Chip, List, ListItem, Typography } from '@mui/material';
import { formatFileChangePath, parseFileChanges } from '../../../core/fileChanges.js';
import type { FileChangeStatus } from '../../../core/types.js';

export function FileChanges({ diffNameStatus, statusShort }: { diffNameStatus: string; statusShort: string }) {
  const files = parseFileChanges(diffNameStatus, statusShort);
  if (files.length === 0) return <Typography color="text.secondary">No file changes detected.</Typography>;
  return (
    <List dense disablePadding>
      {files.map((file) => (
        <ListItem
          key={`${file.status}:${formatFileChangePath(file)}`}
          disablePadding
          sx={{ alignItems: 'center', display: 'flex', gap: 1.25, py: 0.5 }}
        >
          <StatusDot status={file.status} />
          <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: 14 }}>{formatFileChangePath(file)}</Typography>
          <Chip
            label={labelForStatus(file.status)}
            size="small"
            color={colorForStatus(file.status)}
            variant="outlined"
            sx={{ minWidth: 82, textTransform: 'capitalize' }}
          />
        </ListItem>
      ))}
    </List>
  );
}

function StatusDot({ status }: { status: FileChangeStatus }) {
  return <Box aria-hidden sx={{ bgcolor: colorValueForStatus(status), borderRadius: '50%', height: 10, width: 10 }} />;
}

function labelForStatus(status: FileChangeStatus): string {
  return status[0].toUpperCase() + status.slice(1);
}

function colorForStatus(status: FileChangeStatus): 'success' | 'warning' | 'error' | 'info' {
  if (status === 'modified') return 'success';
  if (status === 'added') return 'warning';
  if (status === 'deleted') return 'error';
  return 'info';
}

function colorValueForStatus(status: FileChangeStatus): string {
  if (status === 'modified') return '#22c55e';
  if (status === 'added') return '#eab308';
  if (status === 'deleted') return '#ef4444';
  return '#38bdf8';
}
