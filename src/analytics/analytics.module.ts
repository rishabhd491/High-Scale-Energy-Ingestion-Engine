import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TelemetryHistory } from '../telemetry/entities/telemetry-history.entity';
import { VehicleMeterMap } from '../telemetry/entities/vehicle-meter-map.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelemetryHistory, VehicleMeterMap]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
