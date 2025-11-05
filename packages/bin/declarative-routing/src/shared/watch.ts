import { getConfig } from "../config";
import {
  updateBuildFiles,
  parseInfoFile,
  checkRouteFile,
  removeFileFromCache
} from "./build-tools";
import fs from "fs-extra";
import { parseModule } from "magicast";
import { absoluteFilePath } from "../config";

const fileMap: Record<string, boolean> = {};
let realTime = false;
let allFilesProcessed = false;

// Cache to store relevant file content hashes
const fileContentCache: Record<string, string> = {};

const allCompleted = () => {
  return Object.values(fileMap).every((v) => v);
};

const checkForFinishedProcessing = async () => {
  if (allCompleted()) {
    if (allFilesProcessed) {
      realTime = true;
      await updateBuildFiles();
    }
  } else {
    console.log(
      `Waiting for: ${Object.keys(fileMap).filter((k) => !fileMap[k])}`
    );
  }
};

const isInfoFile = (path: string) => {
  const config = getConfig();
  let matcher: RegExp;
  switch (config.mode) {
    case "qwikcity":
      matcher = /routeInfo\.ts$/;
      break;
    default:
      matcher = /\.info\.ts(x?)$/;
      break;
  }

  return path.match(matcher);
};

const isRouteFile = (path: string) => {
  const config = getConfig();
  let matcher: RegExp;
  switch (config.mode) {
    case "qwikcity":
      matcher = /index\.(js|jsx|ts|tsx)$/;
      break;

    default:
      matcher = /(page|route)\.(js|jsx|ts|tsx)$/;
      break;
  }
  return path.match(matcher);
};

/**
 * Extract only the relevant parts of an info file that affect route generation
 */
const extractRelevantInfoContent = (path: string): string | null => {
  try {
    const config = getConfig();
    const code = fs.readFileSync(absoluteFilePath(config, path)).toString();
    const mod = parseModule(code);
    
    // Extract only the parts that matter for route generation
    const routeName = mod.exports.Route?.name || "";
    const verbs = ["GET", "POST", "DELETE", "PUT"].filter(verb => mod.exports[verb]);
    
    // Create a hash of relevant content
    return JSON.stringify({
      name: routeName,
      verbs: verbs.sort(),
      // Path will change if file is moved, which is already detected
    });
  } catch (error) {
    // If parsing fails, treat as changed to be safe
    return null;
  }
};

/**
 * Check if the relevant content of a file has actually changed
 */
const hasRelevantChanges = (path: string): boolean => {
  if (!isInfoFile(path)) {
    // For non-info files (route files), always rebuild
    // since we need to check if verbs were added/removed
    return true;
  }
  
  const newContent = extractRelevantInfoContent(path);
  const oldContent = fileContentCache[path];
  
  if (newContent === null) {
    // Parsing failed, assume changed
    return true;
  }
  
  if (oldContent === undefined) {
    // First time seeing this file
    fileContentCache[path] = newContent;
    return true;
  }
  
  if (oldContent !== newContent) {
    // Content changed
    fileContentCache[path] = newContent;
    return true;
  }
  
  // No relevant changes
  return false;
};

export const processFile = (path: string) => {
  // Check if relevant changes occurred
  if (!hasRelevantChanges(path)) {
    // Skip rebuild silently - no need to log every skipped file
    return;
  }
  
  if (realTime) {
    if (isInfoFile(path)) {
      parseInfoFile(path).then(async () => await updateBuildFiles());
    } else if (isRouteFile(path)) {
      checkRouteFile(path).then(async () => await updateBuildFiles());
    }
  } else {
    if (isInfoFile(path)) {
      fileMap[path] = false;
      parseInfoFile(path).then(() => {
        fileMap[path] = true;
        checkForFinishedProcessing();
      });
    } else if (isRouteFile(path)) {
      fileMap[path] = false;
      checkRouteFile(path).then(() => {
        fileMap[path] = true;
        checkForFinishedProcessing();
      });
    }
  }
};

export const finishedProcessing = () => {
  allFilesProcessed = true;
  checkForFinishedProcessing();
};

export function fileRemoved(fpath: string) {
  delete fileContentCache[fpath];
  removeFileFromCache(fpath);
  updateBuildFiles();
}
