import { TypescriptConfigTestLocation } from "../../configuration/typescript";
import { Path } from "../../utils/files";

export type ResolveStrategyResult =
  | {
      exists: true;
      path: Path;
    }
  | {
      exists: false;
      path: Path;
    };

export interface ResolveStrategy {
  resolve(path: Path): Promise<ResolveStrategyResult>;
  strategy: TypescriptConfigTestLocation;
}
