export interface OrganizerSectorInventory {
  readonly eventId: string;
  readonly sectorId: string;
  readonly capacity: number | null;
  readonly reservedQuantity: number | null;
  readonly soldQuantity: number | null;
  readonly availableQuantity: number | null;
}

export interface CreateOrganizerSectorInventoryRequest {
  readonly eventId: string;
  readonly sectorId: string;
  readonly capacity: number;
}
