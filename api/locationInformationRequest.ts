import { get } from "../lib/func.ts";
import { getLocationInformationRequest } from "./api.ts";

export const findStops = async (
  input: string | Coordinates
): Promise<Stop[]> => {
  const textInput = typeof input === "string" ? input : undefined;
  const coordinates = isCoordinates(input) ? input : undefined;
  const { result } = await getLocationInformationRequest(
    textInput,
    coordinates
  );
  const placeResult = get<object[] | { Place: object }>(
    result,
    "OJP.OJPResponse.siri:ServiceDelivery.OJPLocationInformationDelivery.PlaceResult"
  );
  if (!placeResult) return [];
  else if (Array.isArray(placeResult))
    return placeResult.map(formatPlace).filter(uniqStopFilter);
  else if (placeResult.Place) return [formatPlace(placeResult)];
  else return [];
};

const isCoordinates = (input: string | Coordinates) =>
  typeof input === "object" && "latitude" in input && "longitude" in input;

const formatPlace = (item: object): Stop => ({
  name: get(item, "Place.StopPlace.StopPlaceName.Text.#text"),
  stopRef: get(item, "Place.StopPlace.StopPlaceRef"),
  geoPosition: {
    latitude: get(item, "Place.GeoPosition.siri:Latitude"),
    longitude: get(item, "Place.GeoPosition.siri:Longitude"),
  },
});

const uniqStopFilter = (stop: Stop, index: number, arr: Stop[]) => {
  const itemIndex = arr.findIndex(s => s.stopRef === stop.stopRef);
  return itemIndex === index;
};
