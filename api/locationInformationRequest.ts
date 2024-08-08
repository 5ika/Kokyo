import { get } from "../lib/func.ts";
import { getLocationInformationRequest } from "./api.ts";

export const findStopByName = async (textInput: string): Promise<Place[]> => {
  const { result } = await getLocationInformationRequest(textInput);
  const placeResult = get<object[]>(
    result,
    "OJP.OJPResponse.siri:ServiceDelivery.OJPLocationInformationDelivery.PlaceResult"
  );
  return placeResult.map(item => ({
    name: get(item, "Place.StopPlace.StopPlaceName.Text.#text"),
    stopRef: get(item, "Place.StopPlace.StopPlaceRef"),
    geoPosition: {
      latitude: get(item, "Place.GeoPosition.siri:Latitude"),
      longitude: get(item, "Place.GeoPosition.siri:Longitude"),
    },
  }));
};