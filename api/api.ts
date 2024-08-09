import { parse } from "@libs/xml";

const TOKEN = Deno.env.get("API_TOKEN");
const RequestorRef = "Caroster.io";

const apiFetch = async (
  query: string
): Promise<{ response: Response; result: any }> => {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${TOKEN}`);
  headers.append("Content-Type", "application/xml");
  const response = await fetch("https://api.opentransportdata.swiss/ojp20", {
    headers,
    method: "POST",
    body: query,
  });
  const xml = await response.text();
  const result = parse(xml);
  return { response, result };
};

// Doc: https://opentransportdata.swiss/fr/cookbook/stopeventservice/
export const getStopEventService = (
  stopPlaceRef: string,
  depArrTime: Date = new Date()
) =>
  apiFetch(`<?xml version="1.0" encoding="UTF-8"?>
<OJP xmlns="http://www.vdv.de/ojp" xmlns:siri="http://www.siri.org.uk/siri" version="2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vdv.de/ojp ../../../../OJP4/OJP.xsd">
  <OJPRequest>
      <siri:ServiceRequest>
          <siri:RequestTimestamp>${new Date().toISOString()}</siri:RequestTimestamp>
          <siri:RequestorRef>${RequestorRef}</siri:RequestorRef>
          <OJPStopEventRequest>
              <siri:RequestTimestamp>${new Date().toISOString()}</siri:RequestTimestamp>
              <siri:MessageIdentifier>1220</siri:MessageIdentifier>
              <Location>
                  <PlaceRef>
                      <siri:StopPointRef>${stopPlaceRef}</siri:StopPointRef>
                  </PlaceRef>
                  <DepArrTime>${depArrTime.toISOString()}</DepArrTime>
              </Location>
              <Params>
                  <NumberOfResults>5</NumberOfResults>
                  <StopEventType>departure</StopEventType>
                  <IncludePreviousCalls>false</IncludePreviousCalls>
                  <IncludeOnwardCalls>false</IncludeOnwardCalls>
                  <UseRealtimeData>full</UseRealtimeData>
                  <IncludeStopHierarchy>all</IncludeStopHierarchy>
              </Params>
          </OJPStopEventRequest>
      </siri:ServiceRequest>
  </OJPRequest>
</OJP>`);

// Doc: https://opentransportdata.swiss/fr/cookbook/OJPLocationInformationRequest/
export const getLocationInformationRequest = (textInput: string) =>
  apiFetch(`<OJP xmlns="http://www.vdv.de/ojp" xmlns:siri="http://www.siri.org.uk/siri" version="2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vdv.de/ojp ../../../../Downloads/OJP-changes_for_v1.1%20(1)/OJP-changes_for_v1.1/OJP.xsd">
  <OJPRequest>
      <siri:ServiceRequest>
          <siri:RequestTimestamp>${new Date().toISOString()}</siri:RequestTimestamp>
          <siri:RequestorRef>${RequestorRef}</siri:RequestorRef>
          <OJPLocationInformationRequest>
              <siri:RequestTimestamp>${new Date().toISOString()}</siri:RequestTimestamp>
              <siri:MessageIdentifier>1220</siri:MessageIdentifier>
              <InitialInput>
                  <Name>${textInput}</Name>
              </InitialInput>
              <Restrictions>
                  <Type>stop</Type>
                  <NumberOfResults>8</NumberOfResults>
                  <TopographicPlaceRef>23009621:2</TopographicPlaceRef>
              </Restrictions>
          </OJPLocationInformationRequest>
      </siri:ServiceRequest>
  </OJPRequest>
</OJP>`);
