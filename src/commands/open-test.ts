import { commands, TextDocument, Uri, window } from "vscode";
import { resolveProject } from "../resolver/project";
import { Logging } from "../utils/logger";

const ERRORS = {
  UNTITLED_DOCUMENT: "Untitled document cannot be opened as a test file.",
  ONLY_LOCAL_FILES: "Only local files can be opened as test files.",
  FAILED_TO_OPEN_TEST_FILE: "Failed to open test file.",
  NO_PROJECT_FOUND: "No project found for this file.",
};

export async function openTest(document: TextDocument) {
  Logging.info("[OpenTest] Opening test file", {
    document: document.uri.toString(),
  });

  try {
    if (document.isUntitled) {
      Logging.error(`[OpenTest] ${ERRORS.UNTITLED_DOCUMENT}`);
      window.showErrorMessage(ERRORS.UNTITLED_DOCUMENT);
      return;
    }

    if (document.uri.scheme !== "file") {
      Logging.error(`[OpenTest] ${ERRORS.ONLY_LOCAL_FILES}`);
      window.showErrorMessage(ERRORS.ONLY_LOCAL_FILES);
      return;
    }

    const project = resolveProject(document);

    if (!project) {
      Logging.error(`[OpenTest] ${ERRORS.NO_PROJECT_FOUND}`);
      window.showErrorMessage(ERRORS.NO_PROJECT_FOUND);
      return;
    }

    if (project.isTestFile(document.uri.fsPath)) {
      const sourceFilePath = await project.getSourceFilePath(
        document.uri.fsPath
      );

      await showDocument(sourceFilePath);
    } else {
      Logging.debug("[OpenTest] Getting test file path");
      const testFilePath = await project.getTestFilePath(document.uri.fsPath);

      Logging.debug("[OpenTest] Showing test file", {
        testFilePath,
      });
      await showDocument(testFilePath);
    }
  } catch (error) {
    Logging.error(`[OpenTest] ${ERRORS.FAILED_TO_OPEN_TEST_FILE}`, { error });
    window.showErrorMessage(ERRORS.FAILED_TO_OPEN_TEST_FILE);
  }
}

export async function showDocument(filePath: string) {
  Logging.trace("[OpenTest] Opening document", {
    filePath,
  });
  await commands.executeCommand("vscode.open", Uri.file(filePath));
}
