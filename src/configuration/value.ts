import { window, workspace } from "vscode";
import { logger } from "../utils/logger";

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
        .update(this.key, value, false);
    } catch (error) {
      logger.logError("ConfigValue.set", {
        error,
        section: this.section,
        key: this.key,
      });
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
    }

    if (value) {
      await this.set(value);
      return value;
    }

    return value;
  }
}
