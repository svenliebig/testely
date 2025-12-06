import { writeFile } from "fs/promises";
import { parse, resolve } from "path";
import { RelativePattern, TextDocument, window, workspace } from "vscode";
import { Likelihood, Project } from ".";
import { configuration } from "../../configuration/configuration";
import {
  TypescriptConfigTestFileExtension,
  TypescriptConfigTestLocation,
} from "../../configuration/typescript";
import { Files, Path } from "../../utils/files";
import { Logging } from "../../utils/logger";
import { PROJECT_ERRORS } from "./errors";
import { ResolveStrategy } from "./types";

export class TypeScriptProject implements Project {
  private readonly packageJson: Path;
  private readonly config = configuration.getTypescriptConfiguration();

  private readonly testFileExtensions = [
    ".spec.ts",
    ".test.ts",
    ".spec.tsx",
    ".test.tsx",
  ];

  /**
   * @param packageJson - The path to the package.json file.
   */
  constructor(packageJson: Path) {
    this.packageJson = packageJson;
  }

  // TODO:
  // - There is more to it, we could resolve the dependencies, checkout
  //   if there is vitest, jest, mocha, ava, etc. and would need to resolve
  //   the test file extensions for each of them, or even check the configuration
  //   files to see if the user has configured the test file extensions differently.
  isTestFile(filepath: Path): boolean {
    Logging.trace("[TypeScriptProject] Checking if file is a test file", {
      filepath,
    });

    const { base } = parse(filepath);
    return this.testFileExtensions.some((ext) => base.endsWith(ext));
  }

  async getSourceFilePath(path: Path): Promise<Path> {
    Logging.trace("[TypeScriptProject] Getting source file path", {
      filepath: path,
    });

    const testlocation = await this.config.getTestLocation();

    const strategy = this.SOURCE_RESOLVE_STRATEGIES.find(
      (strategy) => strategy.strategy === testlocation
    );

    if (!strategy) {
      throw new Error(PROJECT_ERRORS.NO_STRATEGY_FOUND);
    }

    const result = await strategy.resolve(path);

    if (result.exists) {
      return result.path;
    }

    // check if test file exists in any strategy
    for (const strategy of this.SOURCE_RESOLVE_STRATEGIES.filter(
      (strategy) => strategy.strategy !== testlocation
    )) {
      const result = await strategy.resolve(path);

      if (result.exists) {
        window.showInformationMessage(
          "Found Source, but it was in the wrong location. Expected: " +
            testlocation +
            " but found the file in: " +
            strategy.strategy +
            " instead. Consider changing the test file location or the choosen strategy."
        );

        return result.path;
      }
    }

    throw new Error(PROJECT_ERRORS.NO_SOURCE_FILE_FOUND);
  }

  async getTestFilePath(path: Path): Promise<Path> {
    Logging.trace("[TypeScriptProject] Getting test file path", {
      filepath: path,
    });

    const testlocation = await this.config.getTestLocation();

    const strategy = this.TEST_RESOLVE_STRATEGIES.find(
      (strategy) => strategy.strategy === testlocation
    );

    if (!strategy) {
      throw new Error(PROJECT_ERRORS.NO_STRATEGY_FOUND);
    }

    Logging.debug("[TypeScriptProject] Resolving test file path", {
      strategy: strategy.strategy,
    });

    const result = await strategy.resolve(path);

    if (result.exists) {
      Logging.debug("[TypeScriptProject] Found test file", {
        filepath: result.path,
        strategy: strategy.strategy,
      });
      return result.path;
    }

    // check if test file exists in any strategy
    for (const strategy of this.TEST_RESOLVE_STRATEGIES.filter(
      (strategy) => strategy.strategy !== testlocation
    )) {
      Logging.debug("[TypeScriptProject] Checking test file in strategy", {
        strategy: strategy.strategy,
      });
      const result = await strategy.resolve(path);

      if (result.exists) {
        window.showInformationMessage(
          "Found Test, but it was in the wrong location. Expected: " +
            testlocation +
            " but found the file in: " +
            strategy.strategy +
            " instead. Consider changing the test file location or the choosen strategy."
        );

        Logging.debug("[TypeScriptProject] Found test file in wrong location", {
          filepath: result.path,
          strategy: strategy.strategy,
        });

        return result.path;
      }
    }

    // create file
    const { dir } = parse(result.path);
    await Files.ensureDir(dir);

    await writeFile(result.path, "", { encoding: "utf8" });

    return result.path;
  }

  responsibleFor(doc: TextDocument): Likelihood {
    if (
      doc.languageId !== "typescript" &&
      doc.languageId !== "typescriptreact"
    ) {
      return false;
    }

    return Files.distance(this.packageJson, doc.uri.fsPath);
  }

  static async init(): Promise<Array<TypeScriptProject>> {
    const projects: Array<TypeScriptProject> = [];

    const packageJsonFiles = await workspace.findFiles("package.json");

    for (const packageJsonFile of packageJsonFiles.map((file) => file.fsPath)) {
      Logging.debug("[TypeScriptProject] Found package.json file", {
        packageJsonFile,
      });

      projects.push(new TypeScriptProject(packageJsonFile));
    }

    return projects;
  }

  private async withTestExtension(base: string): Promise<string> {
    const ext = await this.config.getTestFileExtension();
    return this.addTestExtension(base, ext);
  }

  private addTestExtension(
    base: string,
    ext: TypescriptConfigTestFileExtension
  ): string {
    return base.replace(/\.ts(x?)$/g, (_, ...args) => `${ext}${args[0]}`);
  }

  private async withSourceExtension(base: string): Promise<string> {
    const ext = await this.config.getTestFileExtension();
    return base.replace(
      new RegExp(`\\${ext}(x?)$`),
      (_, ...args) => `.ts${args[0]}`
    );
  }

  private readonly TEST_RESOLVE_STRATEGIES: Array<ResolveStrategy> = [
    {
      resolve: async (path: Path) => {
        const testPath = await this.withTestExtension(path);

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
          };
        }

        return {
          exists: false,
          path: testPath,
        };
      },
      strategy: TypescriptConfigTestLocation.SameDirectory,
    },
    {
      resolve: async (path: Path) => {
        const { dir, base } = parse(path);
        const testPath = resolve(
          dir,
          "__test__",
          await this.withTestExtension(base)
        );

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
          };
        }

        return {
          exists: false,
          path: testPath,
        };
      },
      strategy: TypescriptConfigTestLocation.SameDirectoryNestedTest,
    },
    {
      resolve: async (path: Path) => {
        const { dir, base } = parse(path);
        const testPath = resolve(
          dir,
          "__tests__",
          await this.withTestExtension(base)
        );

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
          };
        }

        return {
          exists: false,
          path: testPath,
        };
      },
      strategy: TypescriptConfigTestLocation.SameDirectoryNestedTests,
    },
    {
      resolve: async (path: Path) => {
        return {
          exists: false,
          path: "",
        };
      },
      strategy: TypescriptConfigTestLocation.RootTestFolderNested,
    },
    {
      resolve: async (path: Path) => {
        const { dir: packageJsonDir } = parse(this.packageJson);
        const { base } = parse(path);

        const possibilities = ["test", "tests"];

        for (const possibility of possibilities) {
          if (await Files.exists(resolve(packageJsonDir, possibility))) {
            const result = await this.testExists(
              resolve(packageJsonDir, possibility),
              base
            );

            if (result.exists) {
              return {
                exists: true,
                path: result.path,
              };
            }
          }
        }

        return {
          exists: false,
          path: "",
        };
      },
      strategy: TypescriptConfigTestLocation.RootTestFolderFlat,
    },
  ];

  private readonly SOURCE_RESOLVE_STRATEGIES: Array<ResolveStrategy> = [
    {
      resolve: async (path: Path) => {
        const { dir, base } = parse(path);
        const testPath = resolve(dir, await this.withSourceExtension(base));

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
          };
        }

        return {
          exists: false,
          path: testPath,
        };
      },
      strategy: TypescriptConfigTestLocation.SameDirectory,
    },
    {
      resolve: async (path: Path) => {
        const { dir, base } = parse(path);
        const testPath = resolve(
          dir,
          "..",
          await this.withSourceExtension(base)
        );

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
          };
        }

        return {
          exists: false,
          path: testPath,
        };
      },
      strategy: TypescriptConfigTestLocation.SameDirectoryNestedTest,
    },
    {
      resolve: async (path: Path) => {
        const { dir, base } = parse(path);
        const testPath = resolve(
          dir,
          "..",
          await this.withSourceExtension(base)
        );

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
          };
        }

        return {
          exists: false,
          path: testPath,
        };
      },
      strategy: TypescriptConfigTestLocation.SameDirectoryNestedTests,
    },
    {
      resolve: async (path: Path) => {
        return {
          exists: false,
          path: "",
        };
      },
      strategy: TypescriptConfigTestLocation.RootTestFolderNested,
    },
    {
      resolve: async (path: Path) => {
        const { base } = parse(path);
        const { dir: packageJsonDir } = parse(this.packageJson);
        const filename = await this.withSourceExtension(base);

        const files = await workspace.findFiles(
          new RelativePattern(packageJsonDir, `**/${filename}`)
        );

        if (files.length === 0) {
          return {
            exists: false,
            path: "",
          };
        }

        if (files.length === 1) {
          return {
            exists: true,
            path: files[0].fsPath,
          };
        }

        const pick = await window.showQuickPick(
          files.map((file) => ({
            label: file.fsPath.replace(packageJsonDir, ""),
            value: file.fsPath,
          })),
          {
            title:
              "Found multiple possible source files, please select the correct one. ",
          }
        );

        if (pick) {
          return {
            exists: true,
            path: pick.value,
          };
        }

        return {
          exists: false,
          path: "",
        };
      },
      strategy: TypescriptConfigTestLocation.RootTestFolderFlat,
    },
  ];

  private async testExists(
    path: Path,
    sourceFileName: string
  ): Promise<{ exists: boolean; path: Path }> {
    const { base } = parse(sourceFileName);
    const testPath = resolve(path, await this.withTestExtension(base));

    if (await Files.exists(testPath)) {
      return {
        exists: true,
        path: testPath,
      };
    }

    const expectedExtension = await this.config.getTestFileExtension();

    for (const ext of Object.values(TypescriptConfigTestFileExtension)) {
      const testPath = resolve(path, this.addTestExtension(base, ext));

      if (await Files.exists(testPath)) {
        window.showInformationMessage(
          "Found Test, but it didn't have the expected extension. Expected: " +
            expectedExtension +
            " but found the file in: " +
            ext +
            " instead. Consider changing the test file extension."
        );

        return {
          exists: true,
          path: testPath,
        };
      }
    }

    return {
      exists: false,
      path: "",
    };
  }
}
