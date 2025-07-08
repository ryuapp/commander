#!/usr/bin/env node

import process from "node:process";
import { program } from "../../index.js";

program
  .command("try-ts", "test file extension lookup")
  .command("try-cjs", "test file extension lookup")
  .command("try-mjs", "test file extension lookup")
  .parse(process.argv);
