const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const execFileAsync = util.promisify(childProcess.execFile);

// Calling node explicitly so pm works without file suffix cross-platform.
// This file does end-to-end tests actually spawning program.
// See also command.executableSubcommand.search.test.js

// Suppress false positive warnings due to use of testOrSkipOnWindows
/* eslint-disable jest/no-standalone-expect */

const testOrSkipOnWindows = process.platform === "win32" ? test.skip : test;
const pm = path.join(__dirname, "./fixtures/pm");

test("when subcommand file missing then error", () => {
  expect.assertions(1);
  return execFileAsync("node", [pm, "list"]).catch((err) => {
    if (process.platform === "win32") {
      // Get uncaught thrown error on Windows
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.stderr).toBeDefined();
    } else {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.stderr).toMatch(/Error: 'pm-list' does not exist/);
    }
  });
});

test("when alias subcommand file missing then error", () => {
  expect.assertions(1);
  return execFileAsync("node", [pm, "lst"]).catch((err) => {
    if (process.platform === "win32") {
      // Get uncaught thrown error on Windows
      // eslint-disable-next-line jest/no-conditional-expect
      expect(err.stderr).toBeDefined();
    } else {
      // eslint-disable-next-line jest/no-conditional-expect
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
    fs.symlinkSync("./pm", pmlink);
    fs.symlinkSync("./pm-install", pmlinkInstall);

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

    fs.symlinkSync(pmFile, otherDirPm);
    fs.symlinkSync(otherDirPm, anotherDirPm);

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
      } catch (e) {
        // Ignore errors if directories are not empty or don't exist
      }
    }
  },
);

test("when subcommand suffix is .ts then lookup succeeds", async () => {
  // We support looking for ts files for ts-node in particular, but don't need to test ts-node itself.
  // The subcommand is both plain JavaScript code for this test.
  const binLinkTs = path.join(__dirname, "fixtures-extensions", "pm.js");
  // childProcess.execFile('node', ['-r', 'ts-node/register', binLinkTs, 'install'], function(_error, stdout, stderr) {
  const { stdout } = await execFileAsync("node", [binLinkTs, "try-ts"]);
  expect(stdout).toBe("found .ts\n");
});

test("when subcommand suffix is .cjs then lookup succeeds", async () => {
  const binLinkTs = path.join(__dirname, "fixtures-extensions", "pm.js");
  const { stdout } = await execFileAsync("node", [binLinkTs, "try-cjs"]);
  expect(stdout).toBe("found .cjs\n");
});

test("when subcommand suffix is .mjs then lookup succeeds", async () => {
  const binLinkTs = path.join(__dirname, "fixtures-extensions", "pm.js");
  const { stdout } = await execFileAsync("node", [binLinkTs, "try-mjs"]);
  expect(stdout).toBe("found .mjs\n");
});

test("when subsubcommand then lookup sub-sub-command", async () => {
  const { stdout } = await execFileAsync("node", [pm, "cache", "clear"]);
  expect(stdout).toBe("cache-clear\n");
});
