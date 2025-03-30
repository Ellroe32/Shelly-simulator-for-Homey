'use strict';

const { Driver } = require('homey');

class ShellyPro3EMDriver extends Driver {
  async onInit() {
    this.log('✅ ShellyPro3EM Driver gestart');

    // Controleer of apparaten correct geladen zijn
    this.getDevices().forEach(device => {
      this.log(`📡 Geregistreerd apparaat: ${device.getName()}`);
      this.log('📋 Instellingen:', device.getSettings());
    });
  }

  async onPair(session) {
    this.log('🔗 Pairing gestart...');

    // Luistert naar apparaatselectie tijdens pairing
    session.setHandler('list_devices', async () => {
      this.log('📡 Apparaten ophalen...');

      return [
        {
          id: 'shellypro3em_1',
          name: 'ShellyPro3EM',
          data: { id: 'shellypro3em_1' },
          settings: {
            homeWizardIP: '192.168.178.29', // Standaard IP voor HomeWizard
            marstekIP: '192.168.178.187'    // Standaard IP voor Marstek
          }
        }
      ];
    });

    session.setHandler('add_device', async (device) => {
      this.log('✅ Apparaat toegevoegd:', device);
      return true;
    });
  }
}

module.exports = ShellyPro3EMDriver;

