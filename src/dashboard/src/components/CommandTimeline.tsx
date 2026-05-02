import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { CommandRecord, OutputSummary } from '../../../core/types.js';

export function CommandTimeline({ commands }: { commands: CommandRecord[] }) {
  if (commands.length === 0) return <Typography color="text.secondary">No commands yet.</Typography>;
  return (
    <Stack spacing={1.5}>
      {commands.map((command) => {
        const passed = command.exit_code === 0;
        const summary = parseJson<OutputSummary>(command.output_summary_json);
        return (
          <Accordion key={command.id} disableGutters sx={{
            bgcolor: '#0f172a',
            border: passed ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(239,68,68,0.72)',
            boxShadow: passed ? 'none' : '0 0 0 1px rgba(239,68,68,0.18), 0 0 18px rgba(239,68,68,0.18)'
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%' }}>
                {passed ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
                <Chip size="small" label={passed ? 'PASS' : 'FAIL'} color={passed ? 'success' : 'error'} />
                <Chip size="small" label={command.command_type ?? 'custom'} color="primary" variant="outlined" />
                <Chip size="small" label={`attempt ${command.attempt ?? 1}`} />
                {command.failure_reason && <Chip size="small" color="error" variant="outlined" label={command.failure_reason} />}
                <Typography component="code" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere', flex: 1 }}>{command.command}</Typography>
                <Typography color="text.secondary">{command.duration_ms}ms</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {command.failure_reason && <Chip size="small" color="error" variant="outlined" label={command.failure_reason} />}
                  <Chip size="small" label={`cwd: ${command.cwd ?? 'unknown'}`} />
                </Box>
                {summary && (
                  <Box sx={{ color: 'text.secondary' }}>
                    <Typography variant="body2">has_errors: {String(summary.has_errors)}</Typography>
                    <Typography variant="body2">has_warnings: {String(summary.has_warnings)}</Typography>
                    <Typography variant="body2">passed_tests: {summary.passed_tests ?? 'unknown'}</Typography>
                    <Typography variant="body2">failed_tests: {summary.failed_tests ?? 'unknown'}</Typography>
                  </Box>
                )}
                {command.git_diff_stat && (
                  <Box>
                    <Typography variant="subtitle2">Git diff stat</Typography>
                    <Box component="pre" sx={preSx}>{command.git_diff_stat}</Box>
                  </Box>
                )}
                <Box component="pre" sx={preSx}>{[command.stdout, command.stderr].filter(Boolean).join('\n') || 'No output captured.'}</Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}

const preSx = {
  bgcolor: '#020617',
  border: '1px solid rgba(148,163,184,0.16)',
  borderRadius: 2,
  color: '#e2e8f0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: 13,
  m: 0,
  maxHeight: 260,
  overflow: 'auto',
  p: 1.5,
  whiteSpace: 'pre-wrap'
};

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
