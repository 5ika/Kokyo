import { get } from "../lib/func.ts";
import { getLocationInformationRequest } from "./api.ts";

export const findStopByName = async (textInput: string): Promise<Stop[]> => {
  const { result } = await getLocationInformationRequest(textInput);
  const placeResult = get<object[] | { Place: object }>(
    result,
    "OJP.OJPResponse.siri:ServiceDelivery.OJPLocationInformationDelivery.PlaceResult"
  );
  if (!placeResult) return [];
  else if (Array.isArray(placeResult)) return placeResult.map(formatPlace);
  else if (placeResult.Place) return [formatPlace(placeResult)];
  else return [];
};

const formatPlace = (item: object): Stop => ({
  name: get(item, "Place.StopPlace.StopPlaceName.Text.#text"),
  stopRef: get(item, "Place.StopPlace.StopPlaceRef"),
  geoPosition: {
    latitude: get(item, "Place.GeoPosition.siri:Latitude"),
    longitude: get(item, "Place.GeoPosition.siri:Longitude"),
  },
});
