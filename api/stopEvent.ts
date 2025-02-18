import { difference } from "@std/datetime/difference";
import { format } from "@std/datetime/format";
import { getStopEventService } from "./api.ts";
import { get } from "../lib/func.ts";

export const getNextDepartures = async (
  stopRef: string,
  depArrTime: Date = new Date()
): Promise<StopEvent[]> => {
  const { result } = await getStopEventService(stopRef, depArrTime);
  const stopEventResult =
    result.OJP.OJPResponse["siri:ServiceDelivery"]["OJPStopEventDelivery"][
      "StopEventResult"
    ];

  if (!stopEventResult) return [];

  return stopEventResult
    .map((stopEvent: any) => {
      const rawDatetime =
        get(
          stopEvent,
          "StopEvent.ThisCall.CallAtStop.ServiceDeparture.EstimatedTime"
        ) ||
        get(
          stopEvent,
          "StopEvent.ThisCall.CallAtStop.ServiceDeparture.TimetabledTime"
        );
      let datetime = null;
      let departureIn = null;
      if (rawDatetime) {
        datetime = new Date(rawDatetime);
        departureIn = difference(datetime, new Date(), { units: ["minutes"] });
      }
      const serviceType = get(
        stopEvent,
        "StopEvent.Service.ProductCategory.Name.Text.#text"
      );
      return {
        from: get(stopEvent, "StopEvent.Service.OriginText.Text.#text"),
        to: get(stopEvent, "StopEvent.Service.DestinationText.Text.#text"),
        departure: datetime && format(datetime, "HH:mm"),
        departureIn: departureIn?.minutes,
        serviceName: get(
          stopEvent,
          "StopEvent.Service.PublishedServiceName.Text.#text"
        ),
        serviceType,
        serviceTypeIcon: getServiceTypeIcon(serviceType),
        stopName: get(
          stopEvent,
          "StopEvent.ThisCall.CallAtStop.StopPointName.Text.#text"
        ),
        quay: get(
          stopEvent,
          "StopEvent.ThisCall.CallAtStop.PlannedQuay.Text.#text"
        ),
      } as StopEvent;
    })
    .sort(
      (eventA: StopEvent, eventB: StopEvent) =>
        eventA.departureIn - eventB.departureIn
    );
};

const getServiceTypeIcon = (serviceType: string) => {
  const icon = {
    Bus: "🚍",
    Tram: "🚊",
    Zug: "🚆",
    Schiff: "🛥️",
  }[serviceType];
  return icon || serviceType;
};
