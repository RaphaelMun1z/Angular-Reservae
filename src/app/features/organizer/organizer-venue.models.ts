export interface OrganizerVenueSector {
  readonly id: string;
  readonly name: string;
  readonly capacity: number | null;
  readonly price: number | null;
}

export interface OrganizerVenue {
  readonly id: string;
  readonly name: string;
  readonly city: string | null;
  readonly state: string | null;
  readonly totalCapacity: number | null;
  readonly sectors: readonly OrganizerVenueSector[];
}
