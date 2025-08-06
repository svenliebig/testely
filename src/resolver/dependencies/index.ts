interface Dependency {
  name: string;
  version: string;
}

interface JavaDependency extends Dependency {}
interface TypeScriptDependency extends Dependency {}
