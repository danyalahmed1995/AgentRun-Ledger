import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchReport, generateReport } from '../api.js';

export function ReportPreview({ sessionId }: { sessionId: number }) {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport(sessionId).then(setReport).catch(() => setReport('Report unavailable.'));
  }, [sessionId]);

  async function onGenerate() {
    setLoading(true);
    try {
      setReport(await generateReport(sessionId));
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    await navigator.clipboard.writeText(report);
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={onGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate report'}
        </Button>
        <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={onCopy} disabled={!report}>
          Copy report
        </Button>
      </Stack>
      <Box component="pre" sx={{
        bgcolor: '#f8fafc',
        borderRadius: 2,
        color: '#111827',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 13,
        maxHeight: 440,
        overflow: 'auto',
        p: 2,
        whiteSpace: 'pre-wrap'
      }}>
        {report}
      </Box>
    </Stack>
  );
}
