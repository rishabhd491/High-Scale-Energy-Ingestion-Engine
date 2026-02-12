import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TelemetryHistory, TelemetryType } from '../telemetry/entities/telemetry-history.entity';
import { VehicleMeterMap } from '../telemetry/entities/vehicle-meter-map.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(TelemetryHistory)
    private historyRepo: Repository<TelemetryHistory>,
    @InjectRepository(VehicleMeterMap)
    private vehicleMeterMapRepo: Repository<VehicleMeterMap>,
  ) {}

  async getVehiclePerformance(vehicleId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Find the mapped meterId
    const mapping = await this.vehicleMeterMapRepo.findOne({ where: { vehicleId } });
    if (!mapping) {
      // For the sake of this assignment, if no mapping exists, let's assume meterId = vehicleId_meter
      // In a real scenario, we would throw an error or handle it.
      // I'll throw an error to be strict.
      throw new NotFoundException(`No meter mapping found for vehicle ${vehicleId}`);
    }

    const { meterId } = mapping;

    // 2. Query historical data for both vehicle and meter
    // We use the composite index on (deviceId, timestamp)
    const [vehicleData, meterData] = await Promise.all([
      this.historyRepo.find({
        where: {
          deviceId: vehicleId,
          type: TelemetryType.VEHICLE,
          timestamp: Between(twentyFourHoursAgo, new Date()),
        },
        order: { timestamp: 'ASC' },
      }),
      this.historyRepo.find({
        where: {
          deviceId: meterId,
          type: TelemetryType.METER,
          timestamp: Between(twentyFourHoursAgo, new Date()),
        },
        order: { timestamp: 'ASC' },
      }),
    ]);

    if (vehicleData.length === 0 || meterData.length === 0) {
      return {
        message: 'Insufficient data for the last 24 hours',
        vehicleId,
        meterId,
      };
    }

    // 3. Calculate metrics
    // Total energy = Last reading - First reading (assuming accumulators)
    const firstVehicle = vehicleData[0].data;
    const lastVehicle = vehicleData[vehicleData.length - 1].data;
    const totalDc = lastVehicle.kwhDeliveredDc - firstVehicle.kwhDeliveredDc;

    const firstMeter = meterData[0].data;
    const lastMeter = meterData[meterData.length - 1].data;
    const totalAc = lastMeter.kwhConsumedAc - firstMeter.kwhConsumedAc;

    // Average battery temperature
    const avgTemp = vehicleData.reduce((sum, d) => sum + d.data.batteryTemp, 0) / vehicleData.length;

    // Efficiency Ratio (DC/AC)
    const efficiencyRatio = totalAc > 0 ? totalDc / totalAc : 0;

    return {
      vehicleId,
      meterId,
      timeRange: '24h',
      metrics: {
        totalEnergyConsumedAc: totalAc,
        totalEnergyDeliveredDc: totalDc,
        efficiencyRatio: parseFloat(efficiencyRatio.toFixed(4)),
        avgBatteryTemp: parseFloat(avgTemp.toFixed(2)),
      },
      readingCount: {
        vehicle: vehicleData.length,
        meter: meterData.length,
      },
    };
  }
}
