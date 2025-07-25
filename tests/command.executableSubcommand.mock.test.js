import process from "node:process";
import { expect, test, vi } from "vitest";
import commander from "../index.js";
import childProcess from "node:child_process";
import EventEmitter from "node:events";

// Using mock to allow try/catch around what is otherwise out-of-stack error handling.
// Injecting errors, these are not end-to-end tests.

function makeSystemError(code) {
  // We can not make an actual SystemError, but our usage is lightweight so easy to match.
  const err = new Error();
  err.code = code;
  return err;
}

// Suppress false positive warnings due to use of testOrSkipOnWindows

const testOrSkipOnWindows = process.platform === "win32" ? test.skip : test;

testOrSkipOnWindows(
  "when subcommand executable missing (ENOENT) then throw custom message",
  () => {
    // If the command is not found, we show a custom error with an explanation and offer
    // some advice for possible fixes.
    const mockProcess = new EventEmitter();
    const spawnSpy = vi
      .spyOn(childProcess, "spawn")
      .mockImplementation(() => {
        return mockProcess;
      });
    const program = new commander.Command();
    program.exitOverride();
    program.command("executable", "executable description");
    program.parse(["executable"], { from: "user" });
    expect(() => {
      mockProcess.emit("error", makeSystemError("ENOENT"));
    }).toThrow("use the executableFile option to supply a custom name"); // part of custom message
    spawnSpy.mockRestore();
  },
);

testOrSkipOnWindows(
  "when subcommand executable not executable (EACCES) then throw custom message",
  () => {
    const mockProcess = new EventEmitter();
    const spawnSpy = vi
      .spyOn(childProcess, "spawn")
      .mockImplementation(() => {
        return mockProcess;
      });
    const program = new commander.Command();
    program.exitOverride();
    program.command("executable", "executable description");
    program.parse(["executable"], { from: "user" });
    expect(() => {
      mockProcess.emit("error", makeSystemError("EACCES"));
    }).toThrow("not executable"); // part of custom message
    spawnSpy.mockRestore();
  },
);

test("when subcommand executable fails with other error and exitOverride then return in custom wrapper", () => {
  // The existing behaviour is to just silently fail for unexpected errors, as it is happening
  // asynchronously in spawned process and client can not catch errors.
  const mockProcess = new EventEmitter();
  const spawnSpy = vi.spyOn(childProcess, "spawn").mockImplementation(() => {
    return mockProcess;
  });
  const program = new commander.Command();
  program._checkForMissingExecutable = () => {}; // suppress error, call mocked spawn
  program.exitOverride((err) => {
    throw err;
  });
  program.command("executable", "executable description");
  program.parse(["executable"], { from: "user" });
  let caughtErr;
  try {
    mockProcess.emit("error", makeSystemError("OTHER"));
  } catch (err) {
    caughtErr = err;
  }
  expect(caughtErr.code).toEqual("commander.executeSubCommandAsync");
  expect(caughtErr.nestedError.code).toEqual("OTHER");
  spawnSpy.mockRestore();
});

test("when subcommand executable fails with other error then exit", () => {
  // The existing behaviour is to just silently fail for unexpected errors, as it is happening
  // asynchronously in spawned process and client can not catch errors.
  const mockProcess = new EventEmitter();
  const spawnSpy = vi.spyOn(childProcess, "spawn").mockImplementation(() => {
    return mockProcess;
  });
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
  const program = new commander.Command();
  program._checkForMissingExecutable = () => {}; // suppress error, call mocked spawn
  program.command("executable", "executable description");
  program.parse(["executable"], { from: "user" });
  mockProcess.emit("error", makeSystemError("OTHER"));
  expect(exitSpy).toHaveBeenCalledWith(1);
  exitSpy.mockRestore();
  spawnSpy.mockRestore();
});
