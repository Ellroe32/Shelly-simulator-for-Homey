'use strict';

const Homey = require('homey');

class ShellySimulatorApp extends Homey.App {
  async onInit() {
    this.log('🚀 Shelly Simulator App is gestart');
  }
}

module.exports = ShellySimulatorApp;

