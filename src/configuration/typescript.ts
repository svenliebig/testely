import { EXTENSION_CONFIG_KEY } from "./key";
import { RequiredOptionConfigValue } from "./value";

export enum TypescriptConfigTestLocation {
  SameDirectory = "same directory (next to the source file)",
  SameDirectoryNestedTest = "same directory (nested in __test__)",
  SameDirectoryNestedTests = "same directory (nested in __tests__)",
  RootTestFolderFlat = "root test folder (flat)",
  RootTestFolderNested = "root test folder (structured)",
}

export enum TypescriptConfigTestFileExtension {
  Spec = ".spec.ts",
  Test = ".test.ts",
}

const key = "typescript" as const;

export class TypescriptConfiguration {
  public readonly key = `${EXTENSION_CONFIG_KEY}.${key}`;

  private readonly configs = {
    testLocation: new RequiredOptionConfigValue<TypescriptConfigTestLocation>(
      EXTENSION_CONFIG_KEY,
      `${key}.location`,
      Object.values(TypescriptConfigTestLocation),
      "Select a test location strategy for this project."
    ),
    testFileExtension:
      new RequiredOptionConfigValue<TypescriptConfigTestFileExtension>(
        EXTENSION_CONFIG_KEY,
        `${key}.fileExtension`,
        Object.values(TypescriptConfigTestFileExtension),
        "Select a test file extension for this project."
      ),
  };

  constructor() {}

  public renew() {
    this.configs.testLocation.renew();
  }

  public async getTestLocation(): Promise<TypescriptConfigTestLocation> {
    return await this.configs.testLocation.get();
  }

  public async getTestFileExtension(): Promise<TypescriptConfigTestFileExtension> {
    return await this.configs.testFileExtension.get();
  }
}
