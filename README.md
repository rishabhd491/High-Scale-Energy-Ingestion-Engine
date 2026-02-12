# High-Scale Energy Ingestion Engine

This project is a robust ingestion layer designed to handle telemetry data from Smart Meters (Grid Side) and EV Fleets (Vehicle Side). It correlates data streams to provide analytical insights into power efficiency and vehicle performance.

## Architectural Choices

### 1. Data Strategy: Hot vs. Cold Storage
To handle high-scale ingestion (14.4 million records daily) and provide fast analytics, the system implements a dual-storage strategy:

- **Operational Store (Hot):** Uses `meter_status` and `vehicle_status` tables. These tables store only the *latest* state of each device using **UPSERT** (Atomic Update) operations. This ensures that dashboard queries for "Current SoC" or "Last Voltage" are O(1) lookups by ID, avoiding scans of historical data.
- **Historical Store (Cold):** Uses the `telemetry_history` table. This is an **append-only** (INSERT) store that builds an audit trail for long-term reporting.

### 2. High-Scale Handling
With 10,000+ devices sending heartbeats every 60 seconds, the system handles ~166 writes per second.
- **Indexing:** The `telemetry_history` table has a composite index on `(deviceId, timestamp)`. This ensures that analytical queries for a specific vehicle over a 24-hour period are highly efficient index-range scans rather than full table scans.
- **Transactions:** Ingestion operations use database transactions to ensure that both the historical audit trail and the live state are updated atomically.

### 3. Data Correlation
The system introduces a `vehicle_meter_map` to link an EV to its corresponding Smart Meter. This allows the analytical endpoint to correlate `kwhDeliveredDc` (Vehicle) with `kwhConsumedAc` (Meter) to calculate the **Efficiency Ratio**.

## Setup & Running

### Prerequisites
- Docker and Docker Compose
- Node.js (v18+)

### Running the System
1. **Start the Database:**
   ```bash
   docker-compose up -d
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Start the Application:**
   ```bash
   npm run start:dev
   ```

## API Endpoints

### 1. Ingest Telemetry
**POST** `/v1/telemetry/ingest`

The endpoint is polymorphic and recognizes the type based on the payload.

**Meter Payload:**
```json
{
  "meterId": "M-123",
  "kwhConsumedAc": 150.5,
  "voltage": 230,
  "timestamp": "2024-03-20T10:00:00Z"
}
```

**Vehicle Payload:**
```json
{
  "vehicleId": "V-456",
  "soc": 85,
  "kwhDeliveredDc": 120.2,
  "batteryTemp": 35.5,
  "timestamp": "2024-03-20T10:00:00Z"
}
```

### 2. Map Vehicle to Meter
**POST** `/v1/telemetry/map`
```json
{
  "vehicleId": "V-456",
  "meterId": "M-123"
}
```

### 3. Analytical Performance
**GET** `/v1/analytics/performance/:vehicleId`

Returns a 24-hour summary of energy consumption, efficiency, and battery performance.

## Logic: Efficiency Ratio
Real-world power loss is calculated as:
`Efficiency = DC Delivered / AC Consumed`

A ratio below 85% may indicate hardware faults or energy leakage.
