import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { MeterStatus } from './entities/meter-status.entity';
import { VehicleStatus } from './entities/vehicle-status.entity';
import { TelemetryHistory } from './entities/telemetry-history.entity';
import { VehicleMeterMap } from './entities/vehicle-meter-map.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeterStatus,
      VehicleStatus,
      TelemetryHistory,
      VehicleMeterMap,
    ]),
  ],
  providers: [TelemetryService],
  controllers: [TelemetryController],
  exports: [TelemetryService],
})
export class TelemetryModule {}
