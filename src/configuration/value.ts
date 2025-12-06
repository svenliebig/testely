import { ConfigurationTarget, window, workspace } from "vscode";
import { Logging } from "../utils/logger";

export class ConfigValue<T> {
  private value: T | undefined;

  constructor(private section: string, private key: string) {
    this.value = this.getConfigValue();
  }

  private getConfigValue(): T | undefined {
    return workspace.getConfiguration(this.section).get<T>(this.key);
  }

  public renew() {
    this.value = this.getConfigValue();
  }

  public async get(): Promise<T> {
    return this.value!;
  }

  public getKey(): string {
    return `${this.section}.${this.key}`;
  }

  public async set(value: T) {
    this.value = value;
    try {
      await workspace
        .getConfiguration(this.section)
        .update(this.key, value, ConfigurationTarget.Workspace);
    } catch (error) {
      Logging.error(
        `[ConfigValue] Failed to set config value for ${this.section}.${this.key}`,
        {
          error,
        }
      );
      window.showErrorMessage(
        `Failed to set config value for ${this.section}.${this.key}`
      );
    }
  }
}

export class OptionConfigValue<T> extends ConfigValue<T> {
  protected readonly options: Array<T>;

  constructor(section: string, key: string, options: Array<T>) {
    super(section, key);
    this.options = options;
  }
}

export class RequiredOptionConfigValue<
  T extends string
> extends OptionConfigValue<T> {
  private readonly prompt: string;

  constructor(section: string, key: string, options: Array<T>, prompt: string) {
    super(section, key, options);
    this.prompt = prompt;
  }

  public async get(): Promise<T> {
    let value: T | undefined = await super.get();

    while (!value) {
      Logging.info(
        `[RequiredOptionConfigValue] No value found for configuration, prompting user...`
      );

      const pick = await window.showQuickPick(
        this.options.map((option) => ({
          label: option,
          value: option,
        })),
        {
          title: this.prompt,
        }
      );

      value = pick?.value;

      if (value) {
        Logging.info(
          `[RequiredOptionConfigValue] Setting config value to ${value}`
        );
        await this.set(value);
      }
    }

    return value;
  }
}
