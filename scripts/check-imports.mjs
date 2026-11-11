import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipped = new Set([
  "node_modules",
  "dist",
  ".git",
  "tmp",
  "test-results",
]);
const errors = [];
let imports = 0,
  files = 0;
function walk(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap((item) => {
    const name = path.join(folder, item.name);
    return item.isDirectory()
      ? skipped.has(item.name)
        ? []
        : walk(name)
      : /\.(?:[cm]?ts|tsx|[cm]js)$/.test(item.name)
        ? [name]
        : [];
  });
}
function optionsFor(file) {
  const config = path.join(
    root,
    file.startsWith(path.join(root, "frontend") + path.sep)
      ? "frontend/tsconfig.json"
      : "backend/tsconfig.json",
  );
  const read = ts.readConfigFile(config, ts.sys.readFile);
  if (read.error) throw new Error("Cannot read " + config);
  return {
    ...ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(config))
      .options,
    allowJs: true,
  };
}
function exactCase(file) {
  let parent = root;
  for (const piece of path.relative(root, file).split(path.sep)) {
    if (!fs.readdirSync(parent).includes(piece)) return false;
    parent = path.join(parent, piece);
  }
  return true;
}
for (const file of [
  "frontend/src",
  "backend/src",
  "backend/tests",
  "backend/scripts",
  "tests",
].flatMap((folder) => walk(path.join(root, folder)))) {
  files++;
  const ast = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    ),
    options = optionsFor(file);
  function check(node) {
    if (
      !node ||
      !ts.isStringLiteral(node) ||
      (!node.text.startsWith(".") && !node.text.startsWith("@/"))
    )
      return;
    imports++;
    const asset = path.resolve(path.dirname(file), node.text);
    const resolved =
      /\.(css|svg|png|json)$/.test(node.text) && fs.existsSync(asset)
        ? { resolvedFileName: asset }
        : ts.resolveModuleName(node.text, file, options, ts.sys).resolvedModule;
    if (!resolved) {
      errors.push(`${path.relative(root, file)}: unresolved ${node.text}`);
      return;
    }
    const target = path.resolve(resolved.resolvedFileName);
    if (!exactCase(target))
      errors.push(
        `${path.relative(root, file)}: incorrect import casing ${node.text}`,
      );
    for (const [from, to] of [
      ["frontend", "backend"],
      ["backend", "frontend"],
    ]) {
      if (
        file.startsWith(path.join(root, from) + path.sep) &&
        target.startsWith(path.join(root, to) + path.sep)
      )
        errors.push(`${path.relative(root, file)} imports private ${to} code`);
    }
  }
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      check(node.moduleSpecifier);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    )
      check(node.arguments[0]);
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Verified ${imports} local imports in ${files} source/test files, including path casing and frontend/backend boundaries.`,
  );
