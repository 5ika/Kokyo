interface StopEvent {
  from: string;
  to: string;
  departure: string;
  departureIn?: number;
  stopName: string;
  quay: string;
  serviceName: string;
  serviceType: string;
  serviceTypeIcon: string;
}

interface Place {
  name: string;
  stopRef: string;
  geoPosition: {
    latitude: number;
    longitude: number;
  };
}
