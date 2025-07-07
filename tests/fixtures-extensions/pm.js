#!/usr/bin/env node

const process = require("node:process");
const { program } = require("../../");

program
  .command("try-ts", "test file extension lookup")
  .command("try-cjs", "test file extension lookup")
  .command("try-mjs", "test file extension lookup")
  .parse(process.argv);
