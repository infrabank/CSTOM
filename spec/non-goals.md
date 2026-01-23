# Non-Goals

## Equipment Movement Non-Goals

The following capabilities are explicitly excluded from CSTOM's Equipment Movement tracking. These exclusions are intentional design decisions, not deferred features.

### Financial and Accounting

- **Depreciation Tracking**: CSTOM does not calculate, record, or report equipment depreciation. Asset valuation is the responsibility of financial systems.

- **Purchase and Procurement**: CSTOM does not manage purchase orders, vendor selection, or acquisition workflows. Equipment appears in CSTOM after procurement decisions are complete.

- **Billing and Charge-Back**: CSTOM does not generate invoices, track usage-based charges, or allocate costs for equipment usage. Financial reconciliation occurs outside this system.

- **Budget Management**: CSTOM does not track equipment budgets, spending limits, or capital expenditure planning.

### Inventory and Logistics

- **Warehouse Management**: CSTOM does not optimize storage locations, manage bin assignments, or track physical placement within facilities.

- **Stock Level Monitoring**: CSTOM does not maintain minimum stock thresholds, generate reorder alerts, or forecast equipment needs.

- **Barcode/RFID Integration**: CSTOM does not integrate with scanning hardware, automated identification systems, or real-time location tracking technologies.

- **Shipping and Logistics**: CSTOM does not manage carriers, shipping schedules, packaging requirements, or delivery tracking.

### Maintenance and Lifecycle

- **Preventive Maintenance Scheduling**: CSTOM does not generate maintenance schedules, track service intervals, or manage calibration requirements. Maintenance status is a point-in-time custodial state, not a workflow.

- **Warranty Tracking**: CSTOM does not record warranty terms, expiration dates, or claim history.

- **Condition Assessment**: CSTOM does not evaluate equipment condition, grade quality, or predict failure. Physical assessment occurs outside this system.

- **Disposal and Recycling**: CSTOM marks equipment as retired but does not manage disposal workflows, environmental compliance, or recycling processes.

### Operational Optimization

- **Utilization Analytics**: CSTOM does not calculate equipment utilization rates, identify underused assets, or recommend reallocation.

- **Capacity Planning**: CSTOM does not forecast equipment needs, model demand scenarios, or optimize fleet composition.

- **Equipment Sharing or Pooling**: CSTOM does not facilitate cross-contract equipment sharing, reservation systems, or availability calendars.

### Technical Integration

- **Equipment Monitoring**: CSTOM does not receive telemetry, health metrics, or operational data from equipment. Integration with monitoring systems is out of scope.

- **Configuration Management**: CSTOM does not track equipment configurations, firmware versions, or software licenses installed on equipment.

### Rationale

CSTOM exists to freeze decisions and establish accountability for IT maintenance contracts. Equipment Movement tracking serves this purpose by answering "Who had custody and why?" It does not attempt to replace specialized systems for asset management, logistics, or financial accounting. Organizations requiring these capabilities should integrate CSTOM with purpose-built systems for those domains.
