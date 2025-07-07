const process = require("node:process");
process.kill(process.pid, "SIGINT");
