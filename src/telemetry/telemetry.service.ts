import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MeterStatus } from './entities/meter-status.entity';
import { VehicleStatus } from './entities/vehicle-status.entity';
import { TelemetryHistory, TelemetryType } from './entities/telemetry-history.entity';
import { VehicleMeterMap } from './entities/vehicle-meter-map.entity';
import { MeterTelemetryDto } from './dto/meter-telemetry.dto';
import { VehicleTelemetryDto } from './dto/vehicle-telemetry.dto';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectRepository(MeterStatus)
    private meterStatusRepo: Repository<MeterStatus>,
    @InjectRepository(VehicleStatus)
    private vehicleStatusRepo: Repository<VehicleStatus>,
    @InjectRepository(TelemetryHistory)
    private historyRepo: Repository<TelemetryHistory>,
    @InjectRepository(VehicleMeterMap)
    private vehicleMeterMapRepo: Repository<VehicleMeterMap>,
    private dataSource: DataSource,
  ) {}

  async ingestMeter(dto: MeterTelemetryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. History Path (INSERT)
      const history = new TelemetryHistory();
      history.type = TelemetryType.METER;
      history.deviceId = dto.meterId;
      history.data = dto;
      history.timestamp = new Date(dto.timestamp);
      await queryRunner.manager.save(history);

      // 2. Live Path (UPSERT)
      await queryRunner.manager.upsert(
        MeterStatus,
        {
          meterId: dto.meterId,
          kwhConsumedAc: dto.kwhConsumedAc,
          voltage: dto.voltage,
          lastTimestamp: new Date(dto.timestamp),
        },
        ['meterId'],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async ingestVehicle(dto: VehicleTelemetryDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. History Path (INSERT)
      const history = new TelemetryHistory();
      history.type = TelemetryType.VEHICLE;
      history.deviceId = dto.vehicleId;
      history.data = dto;
      history.timestamp = new Date(dto.timestamp);
      await queryRunner.manager.save(history);

      // 2. Live Path (UPSERT)
      await queryRunner.manager.upsert(
        VehicleStatus,
        {
          vehicleId: dto.vehicleId,
          soc: dto.soc,
          kwhDeliveredDc: dto.kwhDeliveredDc,
          batteryTemp: dto.batteryTemp,
          lastTimestamp: new Date(dto.timestamp),
        },
        ['vehicleId'],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async mapVehicleToMeter(vehicleId: string, meterId: string) {
    await this.vehicleMeterMapRepo.upsert(
      { vehicleId, meterId },
      ['vehicleId'],
    );
  }
}
