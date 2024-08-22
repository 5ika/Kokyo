import * as log from "@std/log";
import { LevelName } from "@std/log";

const LOG_LEVEL = Deno.env.get("LOG_LEVEL") || "INFO";

log.setup({
  handlers: {
    stringFmt: new log.ConsoleHandler(LOG_LEVEL as LevelName, {
      formatter: rec =>
        `${rec.datetime.toLocaleString()} [${rec.levelName}] ${rec.msg}`,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["stringFmt"],
    },
  },
});

export default log;
