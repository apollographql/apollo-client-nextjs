import { schema } from "@integration-test/shared/schema";
import { apiRouteHandler } from "@integration-test/shared/apiRoute";

export const action = apiRouteHandler({ schema });
