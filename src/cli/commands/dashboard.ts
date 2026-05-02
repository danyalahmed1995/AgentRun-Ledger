import { startDashboardServer } from '../../server/dashboardServer.js';

export async function dashboardCommand(options: { port: string }): Promise<void> {
  const port = Number(options.port);
  if (!Number.isInteger(port) || port <= 0) throw new Error('Port must be a positive integer.');
  await startDashboardServer(process.cwd(), port);
}
