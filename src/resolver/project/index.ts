import { TextDocument } from "vscode";
import { TypeScriptProject } from "./typescript";

/**
 * The likelihood if a project is responsible to handle a file,
 * the lower the number the more likely the project is responsible.
 */
export type Likelihood = false | number;

export interface Project {
  responsibleFor(doc: TextDocument): Likelihood;
  isTestFile(path: string): boolean;
  getSourceFilePath(path: string): Promise<string>;
  getTestFilePath(path: string): Promise<string>;
}

class UnknownProject implements Project {
  constructor() {}

  responsibleFor(doc: TextDocument): Likelihood {
    return false;
  }

  isTestFile(path: string): boolean {
    throw new Error("Can't call isTestFile on UnknownProject");
  }

  getSourceFilePath(path: string): Promise<string> {
    throw new Error("Can't call getSourceFilePath on UnknownProject");
  }

  getTestFilePath(path: string): Promise<string> {
    throw new Error("Can't call getTestFilePath on UnknownProject");
  }
}

class JavaProject extends UnknownProject implements Project {
  constructor() {
    super();
  }
}

export function resolveProject(source: TextDocument): Project | undefined {
  let p = undefined;
  let l = 0;

  for (const project of projects) {
    const likelihood = project.responsibleFor(source);
    if (likelihood !== false && (p === undefined || likelihood < l)) {
      p = project;
      l = likelihood;
    }
  }

  return p;
}

export const Projects = {
  init,
};

let projects: Array<Project> = [];

async function init() {
  const tsProjects = await TypeScriptProject.init();
  projects.push(...tsProjects);
}
