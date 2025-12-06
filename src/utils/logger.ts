import { env, OutputChannel, TelemetrySender, window } from "vscode";

let channel: OutputChannel;

function init() {
  channel = window.createOutputChannel("Testely");
}

const sender: TelemetrySender = {
  sendEventData: (event: string, properties: Record<string, string>) => {
    // telemtry not implemented
  },
  sendErrorData: (error: Error, data?: Record<string, any>) => {
    // telemtry not implemented
  },
};

export const Logging = {
  init,
  getChannel: () => channel,
  telemetry: env.createTelemetryLogger(sender, {}),
  error: (message: string, data?: Record<string, any>) => {
    console.error(message, data);
    channel?.appendLine(`[Error] ${message}: ${JSON.stringify(data)}`);
  },
  info: (message: string, data?: Record<string, any>) => {
    console.info(message, data);
    channel?.appendLine(`[Info] ${message}: ${JSON.stringify(data)}`);
  },
  warn: (message: string, data?: Record<string, any>) => {
    console.warn(message, data);
    channel?.appendLine(`[Warn] ${message}: ${JSON.stringify(data)}`);
  },
  debug: (message: string, data?: Record<string, any>) => {
    console.debug(message, data);
    channel?.appendLine(`[Debug] ${message}: ${JSON.stringify(data)}`);
  },
  trace: (message: string, data?: Record<string, any>) => {
    console.trace(message, data);
    channel?.appendLine(`[Trace] ${message}: ${JSON.stringify(data)}`);
  },
};
