import * as log from "@std/log";

log.setup({
  handlers: {
    stringFmt: new log.ConsoleHandler("DEBUG", {
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
