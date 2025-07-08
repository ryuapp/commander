import process from "node:process";
import { program } from "../../index.js";

program
  .command("clear", "clear the cache")
  .command("validate", "validate the cache", { isDefault: true })
  .parse(process.argv);
