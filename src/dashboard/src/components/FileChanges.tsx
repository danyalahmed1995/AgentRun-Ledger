import { Alert, Box, Chip, List, ListItem, Stack, Typography } from '@mui/material';
import { formatFileChangePath, groupFileChanges, hasManyUntrackedFiles, parseFileChanges } from '../../../core/fileChanges.js';
import type { FileChange, FileChangeStatus } from '../../../core/types.js';

export function FileChanges({ diffNameStatus, statusShort }: { diffNameStatus: string; statusShort: string }) {
  const files = parseFileChanges(diffNameStatus, statusShort);
  if (files.length === 0) return <Typography color="text.secondary">No file changes detected.</Typography>;
  return (
    <Box>
      {files.length > 10 && (
        <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mb: 1 }}>
          Showing {files.length} changed files
        </Typography>
      )}
      {hasManyUntrackedFiles(files) && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 1.25, py: 0.25 }}>
          Many untracked files detected. Commit your project baseline to make future sessions cleaner.
        </Alert>
      )}
      <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mb: 1 }}>
        Compared to HEAD. Untracked files are included.
      </Typography>
      <Box
        sx={{
          maxHeight: 320,
          overflowY: 'auto',
          pr: 0.5,
          scrollbarColor: 'rgba(148, 163, 184, 0.45) transparent',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: 8
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(148, 163, 184, 0.35)',
            borderRadius: 999
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          }
        }}
      >
        <Stack spacing={1.25}>
          {groupFileChanges(files).map((group) => (
            <Box key={group.title}>
              <Typography color="text.secondary" variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.25 }}>
                {group.title}
              </Typography>
              <List dense disablePadding>
                {group.changes.map((file) => (
                  <FileChangeRow key={`${file.status}:${formatFileChangePath(file)}`} file={file} />
                ))}
              </List>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function FileChangeRow({ file }: { file: FileChange }) {
  return (
    <ListItem
      disablePadding
      sx={{ alignItems: 'center', display: 'flex', gap: 1, minHeight: 30, py: 0.25 }}
    >
      <StatusDot status={file.status} />
      <Typography sx={{ flex: 1, fontFamily: 'monospace', fontSize: 13, minWidth: 0, overflowWrap: 'anywhere' }}>
        {formatFileChangePath(file)}
      </Typography>
      <Chip
        label={labelForStatus(file)}
        size="small"
        color={colorForStatus(file.status)}
        variant="outlined"
        sx={{ flexShrink: 0, minWidth: 78, textTransform: 'capitalize' }}
      />
    </ListItem>
  );
}

function StatusDot({ status }: { status: FileChangeStatus }) {
  return <Box aria-hidden sx={{ bgcolor: colorValueForStatus(status), borderRadius: '50%', height: 10, width: 10 }} />;
}

function labelForStatus(file: FileChange): string {
  if (file.source === 'untracked') return 'Untracked';
  return file.status[0].toUpperCase() + file.status.slice(1);
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
