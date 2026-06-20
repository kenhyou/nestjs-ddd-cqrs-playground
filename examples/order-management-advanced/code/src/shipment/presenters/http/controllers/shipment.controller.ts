import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ShipmentReadModel } from '@shipment/application/queries/dtos/shipment.read-model';
import { ShipmentService } from '@shipment/application/services/shipment.service';

// Inspection only — Shipment aggregates are created by event handlers, never HTTP.
@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string): Promise<ShipmentReadModel> {
    return this.shipmentService.getShipment(id);
  }
}
