import { parse, resolve } from "path";
import { TextDocument, window, workspace } from "vscode";
import { Likelyness, Project } from ".";
import { configuration } from "../../configuration/configuration";
import { TestLocation } from "../../configuration/typescript";
import { Files, Path } from "../../utils/files";
import { logger } from "../../utils/logger";

export class TypeScriptProject implements Project {
  private readonly packageJson: Path;

  private readonly testFileExtensions = [".spec.ts", ".test.ts"];

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
    logger.logUsage("TypeScriptProject.isTestFile", {
      message: "Checking if file is a test file",
      filepath,
    });

    const { name } = parse(filepath);
    return this.testFileExtensions.some((ext) => name.endsWith(ext));
  }

  async getSourceFilePath(path: Path): Promise<Path> {
    logger.logUsage("TypeScriptProject.getSourceFilePath", {
      message: "Getting source file path",
      filepath: path,
    });

    const config = configuration.getTypescriptConfiguration();
    const testlocation = await config.getTestLocation();

    window.showInformationMessage("testlocation: " + testlocation);

    return path.replace(".spec.ts", ".ts");
  }

  async getTestFilePath(path: Path): Promise<Path> {
    logger.logUsage("TypeScriptProject.getTestFilePath", {
      message: "Getting test file path",
      filepath: path,
    });

    const config = configuration.getTypescriptConfiguration();
    const testlocation = await config.getTestLocation();

    // check if test exists in any strategy

    if (testlocation === TestLocation.SameDirectory) {
      return path.replace(".ts", ".spec.ts");
    }

    return path.replace(".ts", ".spec.ts");
  }

  responsibleFor(doc: TextDocument): Likelyness {
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
      logger.logUsage("TypeScriptProject.init", {
        message: "Found package.json file",
        packageJsonFile,
      });

      projects.push(new TypeScriptProject(packageJsonFile));
    }

    return projects;
  }

  private readonly strategies: Array<ResolveStrategy> = [
    {
      resolve: async (path: Path) => {
        for (const ext of this.testFileExtensions) {
          const testPath = path.replace(".ts", ext);

          if (await Files.exists(testPath)) {
            return {
              exists: true,
              path: testPath,
              strategy: TestLocation.SameDirectory,
            };
          }
        }

        return {
          exists: false,
          path: path,
          strategy: TestLocation.SameDirectory,
        };
      },
    },
    {
      resolve: async (path: Path) => {
        const { dir, name } = parse(path);
        const testPath = resolve(
          dir,
          "__test__",
          name.replace(".ts", ".spec.ts")
        );

        if (await Files.exists(testPath)) {
          return {
            exists: true,
            path: testPath,
            strategy: TestLocation.SameDirectoryNestedTest,
          };
        }

        return {
          exists: false,
          path: path,
          strategy: TestLocation.SameDirectoryNestedTest,
        };
      },
    },
    {
      resolve: async (path: Path) => {
        return {
          exists: true,
          path: path.replace(".ts", ".spec.ts"),
          strategy: TestLocation.SameDirectoryNestedTests,
        };
      },
    },
    {
      resolve: async (path: Path) => {
        return {
          exists: false,
          path: path.replace(".ts", ".spec.ts"),
          strategy: TestLocation.RootTestFolderNested,
        };
      },
    },
    {
      resolve: async (path: Path) => {
        return {
          exists: false,
          path: path.replace(".ts", ".spec.ts"),
          strategy: TestLocation.RootTestFolderFlat,
        };
      },
    },
  ];
}

type ResolveStrategyResult = {
  exists: boolean;
  path: Path;
  strategy: TestLocation;
};

interface ResolveStrategy {
  resolve(path: Path): Promise<ResolveStrategyResult>;
}
