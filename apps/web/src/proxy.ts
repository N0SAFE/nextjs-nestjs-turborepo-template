// middleware.ts

import { stackMiddlewares } from "./middlewares/utils/stackMiddlewares";
import { withHeaders } from "./middlewares/WithHeaders";
import * as HealthCheckMiddleware from "./middlewares/WithHealthCheck";
import * as AuthMiddleware from "./middlewares/WithAuth";
import * as EnvMiddleware from "./middlewares/WithEnv";
// import * as WithTiming from './middlewares/WithTiming'
import type { Middleware } from "./middlewares/utils/types";


const middlewares = [
  // WithTiming, // use this to know the timing of each request in the middleware stack
  EnvMiddleware,
  HealthCheckMiddleware,
  // WithRedirect,
  AuthMiddleware,
  withHeaders,
] satisfies Middleware[];

export default stackMiddlewares(middlewares);
