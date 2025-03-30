# Shelly Pro 3EM Emulator for Marstek Venus (In Homey)

This Homey app simulates a **Shelly Pro 3EM energy meter**, for integration with Marstek Venus.

---

## ⚙️ Features

- Simulates a working Shelly Pro 3EM device inside Homey
- Fetches power data from a HomeWizard P1 meter
- Sends formatted power data via UDP to a Marstek Venus battery system
- Supports 3-phase power: L1, L2, L3 + Total
- Works with Homey Insights & Flow
- Custom IP settings via device settings

---

## 🔧 Setup Instructions

1. Install this app on your Homey.
2. Add the device **"Shelly Pro 3EM Emulator"** via the Homey app.
3. Configure:
   - **HomeWizard IP**
   - **Marstek IP**
   - restart app
4. Update Interval = 5 sec
5. The device will now fetch power data at the chosen interval.

---
