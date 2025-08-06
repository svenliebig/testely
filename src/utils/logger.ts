import { env, TelemetrySender } from "vscode";

const sender: TelemetrySender = {
  sendEventData: (event: string, properties: Record<string, string>) => {
    console.log(event, properties);
  },
  sendErrorData: (error: Error, data?: Record<string, any>) => {
    console.error(error, data);
  },
};
export const logger = env.createTelemetryLogger(sender, {});
