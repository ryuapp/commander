import process from "node:process";
process.kill(process.pid, "SIGINT");
