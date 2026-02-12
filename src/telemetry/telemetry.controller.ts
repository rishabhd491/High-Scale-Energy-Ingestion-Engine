import { Controller, Post, Body, BadRequestException, Get, Param } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { MeterTelemetryDto } from './dto/meter-telemetry.dto';
import { VehicleTelemetryDto } from './dto/vehicle-telemetry.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Controller('v1/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('ingest')
  async ingest(@Body() body: any) {
    if (body.meterId) {
      const dto = plainToInstance(MeterTelemetryDto, body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException(errors);
      }
      await this.telemetryService.ingestMeter(dto);
      return { status: 'success', type: 'meter' };
    } else if (body.vehicleId) {
      const dto = plainToInstance(VehicleTelemetryDto, body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException(errors);
      }
      await this.telemetryService.ingestVehicle(dto);
      return { status: 'success', type: 'vehicle' };
    } else {
      throw new BadRequestException('Invalid telemetry type');
    }
  }

  @Post('map')
  async mapVehicleToMeter(@Body() body: { vehicleId: string; meterId: string }) {
    await this.telemetryService.mapVehicleToMeter(body.vehicleId, body.meterId);
    return { status: 'success' };
  }
}
