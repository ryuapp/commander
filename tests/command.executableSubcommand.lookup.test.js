import process from "node:process";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import util from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = util.promisify(childProcess.execFile);

// Calling node explicitly so pm works without file suffix cross-platform.
// This file does end-to-end tests actually spawning program.
// See also command.executableSubcommand.search.test.js

// Suppress false positive warnings due to use of testOrSkipOnWindows

const testOrSkipOnWindows = process.platform === "win32" ? test.skip : test;
const pm = path.join(__dirname, "./fixtures/pm");

// Ensure fixture files have execute permissions
beforeAll(async () => {
  const fixtureFiles = [
    "pm-default",
    "pm-install",
    "pm-silent",
    "pm-listen",
    "pm-search",
  ];

  for (const file of fixtureFiles) {
    const filePath = path.join(__dirname, "fixtures", file);
    try {
      await execFileAsync("chmod", ["+x", filePath]);
    } catch (_error) {
      // Ignore chmod errors on Windows or if file doesn't exist
    }
  }
});

test("when subcommand file missing then error", () => {
  expect.assertions(1);
  return execFileAsync("node", [pm, "list"]).catch((err) => {
    if (process.platform === "win32") {
      // Get uncaught thrown error on Windows

      expect(err.stderr).toBeDefined();
    } else {
      expect(err.stderr).toMatch(/Error: 'pm-list' does not exist/);
    }
  });
});

test("when alias subcommand file missing then error", () => {
  expect.assertions(1);
  return execFileAsync("node", [pm, "lst"]).catch((err) => {
    if (process.platform === "win32") {
      // Get uncaught thrown error on Windows

      expect(err.stderr).toBeDefined();
    } else {
      expect(err.stderr).toMatch(/Error: 'pm-list' does not exist/);
    }
  });
});

test("when subcommand file has no suffix then lookup succeeds", async () => {
  const { stdout } = await execFileAsync("node", [pm, "install"]);
  expect(stdout).toBe("install\n");
});

test("when alias subcommand file has no suffix then lookup succeeds", async () => {
  const { stdout } = await execFileAsync("node", [pm, "i"]);
  expect(stdout).toBe("install\n");
});

test("when subcommand target executablefile has no suffix then lookup succeeds", async () => {
  const { stdout } = await execFileAsync("node", [pm, "specifyInstall"]);
  expect(stdout).toBe("install\n");
});

test("when subcommand file suffix .js then lookup succeeds", async () => {
  const { stdout } = await execFileAsync("node", [pm, "publish"]);
  expect(stdout).toBe("publish\n");
});

test("when alias subcommand file suffix .js then lookup succeeds", async () => {
  const { stdout } = await execFileAsync("node", [pm, "p"]);
  expect(stdout).toBe("publish\n");
});

test("when subcommand target executablefile has suffix .js then lookup succeeds", async () => {
  const { stdout } = await execFileAsync("node", [pm, "specifyPublish"]);
  expect(stdout).toBe("publish\n");
});

testOrSkipOnWindows(
  "when subcommand file is symlink then lookup succeeds",
  async () => {
    const fixturesDir = path.join(__dirname, "fixtures");
    const pmlink = path.join(fixturesDir, "pmlink");
    const pmlinkInstall = path.join(fixturesDir, "pmlink-install");

    // Create symlinks before test
    if (fs.existsSync(pmlink)) fs.unlinkSync(pmlink);
    if (fs.existsSync(pmlinkInstall)) fs.unlinkSync(pmlinkInstall);
    fs.symlinkSync("./pm", pmlink);
    fs.symlinkSync("./pm-install", pmlinkInstall);

    // Add execute permissions using child_process
    await execFileAsync("chmod", ["+x", pmlink]);
    await execFileAsync("chmod", ["+x", pmlinkInstall]);

    try {
      const { stdout } = await execFileAsync("node", [pmlink, "install"]);
      expect(stdout).toBe("install\n");
    } finally {
      // Cleanup symlinks after test
      if (fs.existsSync(pmlink)) fs.unlinkSync(pmlink);
      if (fs.existsSync(pmlinkInstall)) fs.unlinkSync(pmlinkInstall);
    }
  },
);

testOrSkipOnWindows(
  "when subcommand file is double symlink then lookup succeeds",
  async () => {
    const fixturesDir = path.join(__dirname, "fixtures");
    const pmFile = path.join(fixturesDir, "pm");
    const otherDirPm = path.join(fixturesDir, "other-dir", "pm");
    const anotherDirPm = path.join(fixturesDir, "another-dir", "pm");

    // Create double symlinks before test
    // Ensure directories exist
    fs.mkdirSync(path.dirname(otherDirPm), { recursive: true });
    fs.mkdirSync(path.dirname(anotherDirPm), { recursive: true });

    if (fs.existsSync(otherDirPm)) fs.unlinkSync(otherDirPm);
    if (fs.existsSync(anotherDirPm)) fs.unlinkSync(anotherDirPm);
    fs.symlinkSync(pmFile, otherDirPm);
    fs.symlinkSync(otherDirPm, anotherDirPm);

    // Add execute permissions using child_process
    await execFileAsync("chmod", ["+x", otherDirPm]);
    await execFileAsync("chmod", ["+x", anotherDirPm]);

    try {
      const { stdout } = await execFileAsync("node", [anotherDirPm, "install"]);
      expect(stdout).toBe("install\n");
    } finally {
      // Cleanup symlinks and directories after test
      if (fs.existsSync(anotherDirPm)) fs.unlinkSync(anotherDirPm);
      if (fs.existsSync(otherDirPm)) fs.unlinkSync(otherDirPm);

      // Remove directories if empty
      try {
        fs.rmdirSync(path.dirname(anotherDirPm));
        fs.rmdirSync(path.dirname(otherDirPm));
      } catch (_e) {
        // Ignore errors if directories are not empty or don't exist
      }
    }
  },
);

test("when subcommand suffix is .mjs then lookup succeeds", async () => {
  const binLinkTs = path.join(__dirname, "fixtures-extensions", "pm.js");
  const { stdout } = await execFileAsync("node", [binLinkTs, "try-mjs"]);
  expect(stdout).toBe("found .mjs\n");
});

test("when subsubcommand then lookup sub-sub-command", async () => {
  const { stdout } = await execFileAsync("node", [pm, "cache", "clear"]);
  expect(stdout).toBe("cache-clear\n");
});
