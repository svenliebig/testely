import { existsSync, statSync } from "fs";
import { mkdir, readdir, stat } from "fs/promises";
import { join, relative, sep } from "path";
import { Logging } from "./logger";

export type Path = string;

export const Files = {
  getClosest,
  distance,
  exists,
  ensureDir,
};

async function getClosest(
  filename: string,
  origin: Path
): Promise<Path | null> {
  const res = await stat(origin);

  if (res.isDirectory()) {
    const dir = await readdir(origin);

    if (dir.includes(filename)) {
      return join(origin, filename);
    }
  }

  if (isSystemRootDirectory(origin)) {
    return null;
  }

  const index = origin.lastIndexOf(sep);

  if (!index) {
    return null;
  }

  const lower = origin.slice(0, index);
  return getClosest(filename, lower);
}

function isSystemRootDirectory(path: string): boolean {
  return path.split(sep).length === 2 || path.lastIndexOf(sep) === 0;
}

/**
 * The relative distance between two paths.
 * @param path - The path to the file.
 * @param other - The path to the other file.
 * @returns The relative distance between the two paths.
 */
function distance(path: Path, other: Path): number {
  return relative(path, other).split(sep).length;
}

async function exists(path: Path): Promise<boolean> {
  Logging.trace("[Files] Checking if file exists", {
    path,
  });
  try {
    await stat(path);
    return true;
  } catch (error) {
    return false;
  }
}

function isFolder(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

async function ensureDir(path: string) {
  if (existsSync(path)) {
    if (!isFolder(path)) {
      throw new Error(`Path is not a folder. Stop messing around. (${path})`);
    }
  } else {
    await mkdir(path, { recursive: true });
  }
}
