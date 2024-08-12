import { Command } from "@cliffy/command";
import { Input, Select } from "@cliffy/prompt";
import { colors } from "@cliffy/ansi/colors";
import { Table } from "@cliffy/table";
import { findStopByName } from "./api/locationInformationRequest.ts";
import { getNextDepartures } from "./api/stopEvent.ts";

await new Command()
  .name("tccli")
  .option("-s, --stop <name>", "Nom de l'arrêt")
  .action(async options => {
    let stopInput = options.stop;
    if (!stopInput)
      stopInput = await Input.prompt({
        message: "Nom de l'arrêt",
      });

    const stopLists = await findStopByName(stopInput);
    const stopRef = await Select.prompt({
      message: "Sélectionner l'arrêt",
      options: stopLists.map(item => ({
        name: item.name,
        value: item.stopRef,
      })),
    });
    const nextDepartures = await getNextDepartures(stopRef);

    const tableRows = nextDepartures.map(item => [
      item.departure,
      `${item.departureIn} min`,
      item.serviceName,
      item.serviceType,
      item.to,
    ]);
    const table: Table = new Table()
      .header(
        ["Départ", "Dans", "Ligne", "Type", "Direction"].map(colors.bold.blue)
      )
      .body(tableRows)
      .columns([
        { minWidth: 10 },
        { minWidth: 10 },
        { minWidth: 10 },
        { minWidth: 10 },
      ]);
    console.log("");
    table.render();
  })
  .parse();
