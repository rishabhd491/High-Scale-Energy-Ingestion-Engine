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

  @Get('ingest')
  getIngestInfo() {
    return {
      message: 'This is a POST endpoint for telemetry ingestion.',
      usage: 'Send a POST request with a Meter or Vehicle telemetry JSON body.',
      example: {
        meterId: 'M-123',
        kwhConsumedAc: 150.5,
        voltage: 230,
        timestamp: new Date().toISOString()
      }
    };
  }

  @Post('map')
  async mapVehicleToMeter(@Body() body: { vehicleId: string; meterId: string }) {
    await this.telemetryService.mapVehicleToMeter(body.vehicleId, body.meterId);
    return { status: 'success' };
  }

  @Get('map')
  getMapInfo() {
    return {
      message: 'This is a POST endpoint for vehicle-to-meter mapping.',
      usage: 'Send a POST request with vehicleId and meterId.',
      example: {
        vehicleId: 'V-456',
        meterId: 'M-123'
      }
    };
  }
}
