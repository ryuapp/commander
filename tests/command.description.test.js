import commander from "../index.js";
import { expect, test } from "vitest";

test("when set description then get description", () => {
  const program = new commander.Command();
  const description = "abcdef";
  program.description(description);
  expect(program.description()).toMatch(description);
});
