import process from "node:process";
import { expect, test, vi } from "vitest";
import commander from "../index.js";

// Executable subcommand tests that didn't fit in elsewhere.

// This is the default behaviour when no default command and no action handlers
test("when no command specified and executable then display help", () => {
  // Optional. Suppress normal output to keep test output clean.
  const writeSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation(() => {});
  const program = new commander.Command();
  program
    .exitOverride((err) => {
      throw err;
    })
    .command("install", "install description");
  expect(() => {
    program.parse(["node", "test"]);
  }).toThrow("(outputHelp)");
  writeSpy.mockClear();
});
