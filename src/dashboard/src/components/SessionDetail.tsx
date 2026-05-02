import { Box, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import type { SessionDetail as SessionDetailType } from '../../../core/types.js';
import { assessSession } from '../../../core/sessionAssessment.js';
import { formatDuration } from '../../../core/time.js';
import { CommandTimeline } from './CommandTimeline.js';
import { FileChanges } from './FileChanges.js';
import { ReportPreview } from './ReportPreview.js';

type Props = {
  detail: SessionDetailType;
};

export function SessionDetail({ detail }: Props) {
  const assessment = assessSession(detail);
  const verdictColor = assessment.verdict === 'READY' ? 'success' : assessment.verdict === 'UNSTABLE' ? 'error' : 'warning';
  return (
    <Stack spacing={2.5}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{detail.title}</Typography>
          <Chip label={detail.status === 'completed' ? 'COMPLETED' : detail.status} color={detail.status === 'active' ? 'success' : detail.status === 'completed' ? 'primary' : 'default'} />
          <Chip label={assessment.verdict} color={verdictColor} />
          <Chip label={`Score ${assessment.score}/10`} color={assessment.score >= 8 ? 'success' : assessment.score >= 5 ? 'warning' : 'error'} variant="outlined" />
        </Box>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          #{detail.id} | {detail.branch_name ?? 'unknown branch'} | {detail.start_commit?.slice(0, 8) ?? 'unknown commit'}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Ended: {detail.ended_at ? new Date(detail.ended_at).toLocaleString() : 'Not ended'} | Duration: {formatDuration(detail.started_at, detail.ended_at)}
        </Typography>
        <Box sx={{ maxWidth: 360, mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={assessment.score * 10}
            color={assessment.score >= 8 ? 'success' : assessment.score >= 5 ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 999 }}
          />
          <Typography color="text.secondary" variant="caption">{assessment.scoreBreakdown.join(' | ')}</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Files</Typography>
              <FileChanges diffNameStatus={detail.after_diff_stat ?? detail.before_diff_stat ?? ''} statusShort={detail.after_status ?? detail.before_status ?? ''} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Notes</Typography>
              {detail.notes.length ? (
                <Stack spacing={1}>
                  {detail.notes.map((note) => (
                    <Typography key={note.id} color="text.secondary">{note.note}</Typography>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">No notes recorded.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Commands</Typography>
          <CommandTimeline commands={detail.commands} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Report</Typography>
          <ReportPreview sessionId={detail.id} />
        </CardContent>
      </Card>
    </Stack>
  );
}
