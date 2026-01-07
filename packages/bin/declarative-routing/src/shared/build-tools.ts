import path from "path";
import fs from "fs-extra";
import { parseModule } from "magicast";
import { glob } from "glob";

import { getConfig, absoluteFilePath } from "../config";
import type { Config } from "../config";
import { buildFileFromTemplate, buildStringFromTemplate } from "../template";
import { getDiffContent, upperFirst, jsClean, showDiff } from "../shared/utils";

type RouteInfo = {
  importPath: string;
  infoPath: string;
  importKey: string;
  verbs: string[];
  pathTemplate: string;
  hasPage: boolean;
  hasLayout: boolean;
};

const paths: Record<string, RouteInfo> = {};

const ignore = ["**/node_modules/**", "dist/**", "**/dist/**"];

const VERB_KEYS: Record<string, string[]> = {
  GET: ["result"],
  POST: ["body", "result"],
  DELETE: [],
  UPDATE: ["body", "result"]
};

export function removeFileFromCache(fpath: string) {
  delete paths[fpath];
}

function fixPath(config: Config, path: string) {
  // Strip route groups (folders wrapped in parentheses) from path
  // e.g., "/(app)/showcase" -> "/showcase", "/(auth)/auth/signin" -> "/auth/signin"
  let result = path.replace(/\/\([^)]+\)/g, "");
  
  // If we end up with empty string, it means the path was just a route group like "/(app)"
  if (result === "" || result === "/") {
    result = "/";
  }
  
  const { stripRoutePrefix } = config;
  if (!stripRoutePrefix) return result;
  if (result === `/${stripRoutePrefix}`) return "/";
  return result.replace(
    stripRoutePrefix.endsWith("/") ? stripRoutePrefix : stripRoutePrefix + "/",
    ""
  );
}

async function writeRoutes(silent: boolean = false) {
  const config = getConfig();
  const imports: Set<string> = new Set();
  for (const { verbs } of Object.values(paths)) {
    if (verbs.length > 0) {
      for (const verb of verbs) {
        imports.add(`make${upperFirst(verb.toLowerCase())}Route`);
      }
    } else {
      imports.add("makeRoute");
    }
  }

  const sortedPaths = Object.values(paths).sort((a, b) =>
    a.pathTemplate.localeCompare(b.pathTemplate)
  );

  const pageRoutes: {
    pathTemplate: string;
    importKey: string;
  }[] = [];
  const apiRoutes: {
    pathTemplate: string;
    importKey: string;
    verb: string;
    upperVerb: string;
    lowerVerb: string;
    isNotDELETE: boolean
  }[] = [];
  for (const { verbs, pathTemplate, importKey } of sortedPaths) {
    if (verbs.length === 0) {
      pageRoutes.push({
        pathTemplate: fixPath(config, pathTemplate),
        importKey
      });
    } else {
      for (const verb of verbs) {
        apiRoutes.push({
          pathTemplate: fixPath(config, pathTemplate),
          importKey,
          verb,
          upperVerb: upperFirst(verb.toLowerCase()),
          lowerVerb: verb.toLowerCase(),
          isNotDELETE: verb !== "DELETE",
        });
      }
    }
  }

  const code = await buildStringFromTemplate("shared/index.ts.template", {
    imports: Array.from(imports).sort().join(", "),
    routeImports: sortedPaths,
    pageRoutes,
    apiRoutes
  });

  const routesPath = path.resolve(config.routes, "index.ts");
  const oldCode = fs.existsSync(routesPath)
    ? fs.readFileSync(routesPath).toString()
    : "";

  let report = "";
  if (oldCode !== code) {
    report = getDiffContent(oldCode, code) || "";
    if (!silent) {
      showDiff(report);
    }
    fs.writeFileSync(routesPath, code);
  }

  return report;
}

export async function parseInfoFile(fpath: string) {
  const config = getConfig();
  const { importPathPrefix } = config;

  let _importPathPrefix: string;

  switch (config.mode) {
    case "qwikcity":
      _importPathPrefix = importPathPrefix || "~/routes";
      break;
    default:
      _importPathPrefix = importPathPrefix || "@/app";
      break;
  }

  const newPath: RouteInfo = {
    importPath: `${_importPathPrefix}/${fpath}`.replace(/.ts$/, ""),
    infoPath: `/${fpath}`,
    importKey: "",
    verbs: [],
    pathTemplate: "",
    hasPage: false,
    hasLayout: false
  };

  const code: string = fs
    .readFileSync(absoluteFilePath(config, fpath))
    .toString();
  const mod = parseModule(code);
  newPath.importKey = newPath.importKey || mod.exports.Route?.name || "tempKey";

  // Read page and layout flags from the info file
  newPath.hasPage = mod.exports.page === true;
  newPath.hasLayout = mod.exports.layout === true;

  for (const verb of ["GET", "POST", "DELETE", "PUT"]) {
    if (mod.exports[verb]) {
      newPath.verbs.push(verb);
    }
  }

  newPath.pathTemplate = `/${path.parse(fpath).dir.split(path.sep).join("/")}`;

  paths[fpath] = newPath;

  return newPath.verbs.length || 1;
}

async function createInfoFile(config: Config, fpath: string, hasPage: boolean, hasLayout: boolean) {
  let infoFile: string;

  switch (config.mode) {
    case "qwikcity":
      infoFile = path.join(path.dirname(fpath), "routeInfo.ts");
      break;
    default:
      // Single route.info.ts file with page/layout flags
      infoFile = path.join(path.dirname(fpath), "route.info.ts");
      break;
  }

  const absPath = absoluteFilePath(config, infoFile);
  const pathElements = path
    .parse(infoFile)
    .dir.split(path.sep)
    .filter((v) => v.length);

  let name = "Home";
  if (pathElements.length) {
    name = pathElements.map((p) => upperFirst(jsClean(p))).join("");
  }

  const params: string[] = [];
  for (const elem of pathElements) {
    if (elem.startsWith("[[...") && elem.endsWith("]]")) {
      params.push(`${jsClean(elem)}: z.string().array().optional()`);
    } else if (elem.startsWith("[...") && elem.endsWith("]")) {
      params.push(`${jsClean(elem)}: z.string().array()`);
    } else if (elem.startsWith("[") && elem.endsWith("]")) {
      params.push(`${jsClean(elem)}: z.string()`);
    }
  }

  // Check for API verbs if this is an API route file
  const verbs: string[] = [];
  const sourceBasename = path.basename(fpath);
  if (sourceBasename.startsWith("route.")) {
    const code: string = fs
      .readFileSync(absoluteFilePath(config, fpath))
      .toString();
    for (const verb of Object.keys(VERB_KEYS)) {
      if (code.includes(`function ${verb}(`)) {
        verbs.push(verb);
      }
    }
  }

  await buildFileFromTemplate("shared/info.ts.template", absPath, {
    name,
    params,
    hasPage,
    hasLayout,
    verbs: verbs.map((verb) => ({ 
      verb, 
      upperVerb: upperFirst(verb.toLowerCase()),
      keys: VERB_KEYS[verb] 
    }))
  });
}

export async function checkRouteFile(filePath: string) {
  const config = getConfig();
  let infoFile: string;

  switch (config.mode) {
    case "qwikcity":
      infoFile = filePath.split("/").slice(0, -1).concat("routeInfo.ts").join("/");
      break;
    default:
      // Single route.info.ts file per directory
      infoFile = path.join(path.dirname(filePath), "route.info.ts");
      break;
  }
  
  const absPath = absoluteFilePath(config, infoFile);
  const dir = path.dirname(filePath);
  
  // Check what source files exist in this directory
  const hasPage = findSourceFile(config, dir, ["page.js", "page.ts", "page.jsx", "page.tsx"]) !== null;
  const hasLayout = findSourceFile(config, dir, ["layout.js", "layout.ts", "layout.jsx", "layout.tsx"]) !== null;
  
  if (!fs.existsSync(absPath)) {
    // Create new info file
    await createInfoFile(config, filePath, hasPage, hasLayout);
    return true;
  } else {
    // Sync existing info file's page/layout flags
    await syncInfoFileFlags(config, infoFile, hasPage, hasLayout);
    return false;
  }
}

/**
 * Syncs the page/layout flags in an existing route.info.ts file.
 * Updates the file if the flags are out of sync.
 */
async function syncInfoFileFlags(config: Config, infoFile: string, hasPage: boolean, hasLayout: boolean) {
  const absPath = absoluteFilePath(config, infoFile);
  const code = fs.readFileSync(absPath).toString();
  
  // Check current values
  const currentPageMatch = code.match(/^export const page = (true|false);/m);
  const currentLayoutMatch = code.match(/^export const layout = (true|false);/m);
  
  const currentPage = currentPageMatch ? currentPageMatch[1] === "true" : undefined;
  const currentLayout = currentLayoutMatch ? currentLayoutMatch[1] === "true" : undefined;
  
  // If flags are missing or incorrect, update the file
  if (currentPage !== hasPage || currentLayout !== hasLayout) {
    let newCode = code;
    
    if (currentPageMatch) {
      newCode = newCode.replace(
        /^export const page = (true|false);/m,
        `export const page = ${hasPage};`
      );
    } else {
      // Insert after imports
      newCode = newCode.replace(
        /(import[^;]+;\n*)+/,
        `$&\n// Auto-generated flags - DO NOT EDIT manually, these are synced by dr:build\nexport const page = ${hasPage};\n`
      );
    }
    
    if (currentLayoutMatch) {
      newCode = newCode.replace(
        /^export const layout = (true|false);/m,
        `export const layout = ${hasLayout};`
      );
    } else if (!newCode.includes("export const layout")) {
      // Insert after page flag
      newCode = newCode.replace(
        /export const page = (true|false);/,
        `export const page = ${hasPage};\nexport const layout = ${hasLayout};`
      );
    }
    
    fs.writeFileSync(absPath, newCode);
  }
}

/**
 * Finds a source file in a directory from a list of possible filenames.
 * Returns the filename if found, null otherwise.
 */
function findSourceFile(config: Config, dir: string, filenames: string[]): string | null {
  for (const filename of filenames) {
    const filePath = path.join(dir, filename);
    const absPath = absoluteFilePath(config, filePath);
    if (fs.existsSync(absPath)) {
      return filename;
    }
  }
  return null;
}

export async function buildFiles(silent: boolean = false) {
  const config = getConfig();

  let routePatterns: string[];
  switch (config.mode) {
    case "qwikcity":
      routePatterns = [
        "**/index.{jsx,tsx}",
        "**/index@*.{jsx,tsx}",
        "index.{jsx,tsx}",
        "index@*.{jsx,tsx}"
      ];
      break;
    default:
      // Detect page.tsx, layout.tsx, route.ts (API)
      // Each directory gets a single route.info.ts with page/layout flags
      routePatterns = [
        "**/page.{js,ts,jsx,tsx}",
        "**/layout.{js,ts,jsx,tsx}",
        "**/route.{js,ts,jsx,tsx}",
        "page.{js,ts,jsx,tsx}",
        "layout.{js,ts,jsx,tsx}",
        "route.{js,ts,jsx,tsx}"
      ];
      break;
  }

  // Find all route files and create/sync info files
  const routes = await glob(routePatterns, {
    cwd: config.src,
    posix: true,
    ignore
  });

  // Group by directory to avoid creating duplicate info files
  const directoriesProcessed = new Set<string>();
  let routesAdded = 0;
  
  for (const route of routes) {
    const dir = path.dirname(route);
    if (!directoriesProcessed.has(dir)) {
      directoriesProcessed.add(dir);
      if (await checkRouteFile(route)) {
        routesAdded++;
      }
    }
  }
  
  if (!silent && routesAdded > 0) {
    console.log(`Added ${routesAdded} new info files`);
  }

  let infoPatterns: string[];
  switch (config.mode) {
    case "qwikcity":
      infoPatterns = ["**/routeInfo.{js,ts,jsx,tsx}"];
      break;
    default:
      // Single route.info.ts pattern
      infoPatterns = [
        "**/route.info.{js,ts,jsx,tsx}",
        "route.info.{js,ts,jsx,tsx}"
      ];
      break;
  }

  // Parse all route.info.ts files
  const infoFiles = await glob(infoPatterns, {
    cwd: config.src,
    posix: true,
    ignore
  });

  // Parse all info files first
  for (const info of infoFiles) {
    await parseInfoFile(info);
  }

  // Export all routes that have a page, layout, or API verbs
  // Layout-only routes are also exported for their utility methods (Link, etc.)
  const validInfoFiles = Object.entries(paths).filter(([_, routeInfo]) => {
    if (config.mode === "qwikcity") return true;
    
    // Export routes that have a page, layout, or are API routes
    return routeInfo.hasPage || routeInfo.hasLayout || routeInfo.verbs.length > 0;
  });

  const routeCount = validInfoFiles.reduce((sum, [_, info]) => sum + (info.verbs.length || 1), 0);
  
  if (!silent) {
    console.log(`${routeCount} total routes (${Object.keys(paths).length} info files, ${validInfoFiles.length} exported)`);
  }

  // Clear paths and re-add only valid ones for export
  const allPaths = { ...paths };
  for (const key of Object.keys(paths)) {
    delete paths[key];
  }
  for (const [key, info] of validInfoFiles) {
    paths[key] = info;
  }

  const diff = await writeRoutes(silent);

  // Restore all paths for other operations
  for (const [key, info] of Object.entries(allPaths)) {
    paths[key] = info;
  }

  if (config.openapi) {
    await writeOpenAPI(config);
  }

  return {
    routesAdded,
    routeCount,
    diff
  };
}

export async function updateBuildFiles(silent: boolean = false) {
  const config = getConfig();

  await writeRoutes(silent);

  if (config.openapi) {
    await writeOpenAPI(config);
  }
}

async function writeOpenAPI(config: Config) {
  if (!config.openapi) return;

  let template = fs.readFileSync(config.openapi.template).toString();

  const imports: string[] = [];
  const registrations: string[] = [];

  const pathPrefix = config.routes
    .replace("./", "")
    .split("/")
    .map(() => "..")
    .join("/");

  for (const path of Object.values(paths)) {
    if (path.verbs.length > 0) {
      imports.push(
        await buildStringFromTemplate("shared/openapi-import.template", {
          importKey: path.importKey,
          pathPrefix,
          srcDir: (config.src || "").replace("./", ""),
          import: path.infoPath.replace(".ts", "")
        })
      );
      for (const verb of path.verbs) {
        registrations.push(
          await buildStringFromTemplate("shared/openapi-register.template", {
            lowerVerb: verb.toLowerCase(),
            pathTemplate: path.pathTemplate.replace(/\[(.*)\]/g, '{$1}'),
            verb,
            importKey: path.importKey,
            isNotDELETE: verb !== "DELETE",
            isPOSTorPUT: verb === "PUT" || verb === "POST"
          })
        );
      }
    }
  }

  template = template.replace(/\/\/ \{\{IMPORTS\}\}/, imports.join("\n"));
  template = template.replace(
    /\/\/ \{\{REGISTRATIONS\}\}/,
    registrations.join("\n")
  );

  fs.writeFileSync(config.openapi.target, template);
}

export async function buildREADME(
  pkgMgr: string,
  mode: "nextjs" | "react-router" | "qwikcity"
) {
  const sortedPaths = Object.values(paths).sort((a, b) =>
    a.importPath.localeCompare(b.importPath)
  );

  let tasks: string[] = [];
  for (const { infoPath, verbs, importKey, pathTemplate } of sortedPaths) {
    if (verbs.length > 0) {
      for (const verb of verbs) {
        tasks.push(`\`${infoPath}\`: Add typing for \`${verb}\``);
        tasks.push(
          `Convert \`${verb}\` fetch calls to \`${pathTemplate}\` to \`${verb.toLowerCase()}${importKey}(...)\` calls`
        );
      }
    } else {
      tasks.push(
        `\`${infoPath}\`: Add search typing to if the page supports search paramaters`
      );
      tasks.push(
        `Convert \`Link\` components for \`${pathTemplate}\` to \`<${importKey}.Link>\``
      );
      if (infoPath.includes("[")) {
        tasks.push(
          `Convert \`params\` typing in \`${infoPath.replace(
            ".info",
            ""
          )}\` to \`z.infer<>\``
        );
      }
    }
  }

  const routes: {
    pathTemplate: string;
    verb: string;
    importKey: string;
    usage: string;
  }[] = [];
  for (const { pathTemplate, verbs, importKey } of sortedPaths) {
    if (verbs.length > 0) {
      for (const verb of verbs) {
        routes.push({
          pathTemplate,
          verb,
          importKey,
          usage: `${verb.toLowerCase()}${importKey}(...)`
        });
      }
    } else {
      routes.push({
        pathTemplate,
        verb: "-",
        importKey,
        usage: `<${importKey}.Link>`
      });
    }
  }

  const config = getConfig();

  await buildFileFromTemplate(
    `${mode}/README.md.template`,
    path.resolve(config.routes, "./README.md"),
    {
      tasks,
      routes,
      packageManager: pkgMgr === "npm" ? "npm run" : pkgMgr
    }
  );
}
