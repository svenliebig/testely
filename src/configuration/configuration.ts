import { ConfigurationChangeEvent, workspace } from "vscode";
import { TypescriptConfiguration } from "./typescript";

interface Config {
  key: string;
  renew: () => void;
}

export class Configuration {
  private configs: Array<Config> = [new TypescriptConfiguration()];

  constructor() {
    workspace.onDidChangeConfiguration(this.onConfigChange, this);
  }

  private onConfigChange(event: ConfigurationChangeEvent) {
    for (const config of this.configs) {
      if (event.affectsConfiguration(config.key)) {
        config.renew();
      }
    }
  }

  public getTypescriptConfiguration(): TypescriptConfiguration {
    return this.configs.find(
      (config) => config instanceof TypescriptConfiguration
    ) as TypescriptConfiguration;
  }
}

export const configuration = new Configuration();
