interface StopEvent {
  from: string;
  to: string;
  departure: string;
  departureIn?: number;
  stopName: string;
  quay: string;
}

interface Place {
  name: string;
  stopRef: string;
  geoPosition: {
    latitude: number;
    longitude: number;
  };
}
