import { EXTENSION_CONFIG_KEY } from "./key";
import { RequiredOptionConfigValue } from "./value";

export enum TestLocation {
  SameDirectory = "same directory (next to the source file)",
  SameDirectoryNestedTest = "same directory (nested in __test__)",
  SameDirectoryNestedTests = "same directory (nested in __tests__)",
  RootTestFolderFlat = "root test folder (flat)",
  RootTestFolderNested = "root test folder (structured)",
}

const key = "typescript" as const;

export class TypescriptConfiguration {
  public readonly key = `${EXTENSION_CONFIG_KEY}.${key}`;

  private readonly configs = {
    testLocation: new RequiredOptionConfigValue<TestLocation>(
      EXTENSION_CONFIG_KEY,
      `${key}.location`,
      Object.values(TestLocation),
      "Select a test location strategy for this project."
    ),
  };

  constructor() {}

  public renew() {
    this.configs.testLocation.renew();
  }

  public async getTestLocation(): Promise<TestLocation> {
    return await this.configs.testLocation.get();
  }
}
