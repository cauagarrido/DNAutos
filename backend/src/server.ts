import app from "./app";
import { env } from "./config/env";
if (require.main === module) {
  const server = app.listen(env.port, () =>
    console.log(`DNAutos API listening on port ${env.port}`),
  );
  const stop = () => server.close(() => process.exit(0));
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}
export default app;
