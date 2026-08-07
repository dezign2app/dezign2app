import { generateAuthServer, BetterAuthServerOptions } from "./generateAuthServer";
import { generateAuthClient, BetterAuthClientOptions } from "./generateAuthClient";
import { generateAuthRoute } from "./generateAuthRoute";
import { generateGatewayMiddleware } from "./generateGatewayMiddleware";

export {
  generateAuthServer,
  generateAuthClient,
  generateAuthRoute,
  generateGatewayMiddleware,
};

export interface BetterAuthGeneratorBundle {
  serverConfig: string;
  clientConfig: string;
  routeHandler: string;
  gatewayMiddleware: string;
}

export function generateBetterAuthBundle(
  serverOptions?: BetterAuthServerOptions,
  clientOptions?: BetterAuthClientOptions
): BetterAuthGeneratorBundle {
  return {
    serverConfig: generateAuthServer(serverOptions),
    clientConfig: generateAuthClient(clientOptions),
    routeHandler: generateAuthRoute(),
    gatewayMiddleware: generateGatewayMiddleware(),
  };
}

