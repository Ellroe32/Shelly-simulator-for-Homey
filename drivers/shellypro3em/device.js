'use strict';

const Homey = require('homey');
const dgram = require('dgram');
const axios = require('axios');

class ShellyPro3emDevice extends Homey.Device {
  async onInit() {
    this.log('🚀 ShellyPro3EM Simulator gestart');

    this.loadSettings();
    this.socket = dgram.createSocket('udp4');

    // Luister op UDP berichten
    this.socket.on('message', (msg, rinfo) => {
      try {
        const text = msg.toString();
        this.log('📥 RAW UDP ontvangen:', text);
        const data = JSON.parse(text);
        this.log('📥 Geparsed van', rinfo.address, rinfo.port, data);

        if (!data.method || data.method === 'EM.GetStatus') {
          this.sendUdpMessage(rinfo.address, rinfo.port);
        }

      } catch (err) {
        this.error('❌ Ongeldige JSON ontvangen:', err.message);
      }
    });

    this.sendHelloMessage();
    this.startUpdateLoops();
  }

  loadSettings() {
    this.homeWizardIP = this.getSetting('homeWizardIP') || '192.168.178.29';
    this.marstekIP = this.getSetting('marstekIP') || '192.168.178.187';
    this.marstekPort = 22222;
    this.updateInterval = 5; // in seconden (teruggezet naar 5s)
    this.lastUdpSent = 0; // voor throttling
    this.udpThrottleMs = 4000; // minimaal 4s tussen UDP berichten
  }

  startUpdateLoops() {
    if (this.powerInterval) clearInterval(this.powerInterval);
    if (this.udpInterval) clearInterval(this.udpInterval);

    this.log(`🔁 Start update loops: Power elke ${this.updateInterval}s, UDP elke ${this.updateInterval}s`);

    this.powerInterval = setInterval(() => {
      this.updatePowerData();
    }, this.updateInterval * 1000);

    this.udpInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastUdpSent > this.udpThrottleMs) {
        this.sendUdpMessage();
        this.lastUdpSent = now;
      } else {
        this.log('⏱️ UDP throttled');
      }
    }, this.updateInterval * 1000);
  }

  async updatePowerData() {
    if (!this.homeWizardIP) {
      this.error('⚠️ Geen geldig HomeWizard IP');
      return;
    }

    try {
      const response = await axios.get(`http://${this.homeWizardIP}/api/v1/data`, { timeout: 5000 });
      const data = response.data || {};

      this.powerL1 = data.active_power_l1_w || 0;
      this.powerL2 = data.active_power_l2_w || 0;
      this.powerL3 = data.active_power_l3_w || 0;
      this.totalPower = this.powerL1 + this.powerL2 + this.powerL3;

      this.log(`⚡ Vermogen: Totaal=${this.totalPower}W | L1=${this.powerL1}W | L2=${this.powerL2}W | L3=${this.powerL3}W`);

      await this.setCapabilityValue('measure_power', this.totalPower).catch(this.error);
      await this.setCapabilityValue('measure_power.l1', this.powerL1).catch(this.error);
      await this.setCapabilityValue('measure_power.l2', this.powerL2).catch(this.error);
      await this.setCapabilityValue('measure_power.l3', this.powerL3).catch(this.error);

    } catch (error) {
      this.error('❌ Fout bij ophalen HomeWizard data:', error.message);
    }
  }

  sendUdpMessage(targetIP = this.marstekIP, targetPort = this.marstekPort) {
    try {
      const payload = {
        id: "0",
        src: `shellypro3em-${this.getId()}`,
        dst: "Marstek",
        method: "EM.StatusResponse",
        code: 200,
        error: null,
        ack: true,
        params: {
          a_act_power: this.powerL1,
          b_act_power: this.powerL2,
          c_act_power: this.powerL3,
          total_act_power: this.totalPower,
          status: "ok"
        }
      };

      const buffer = Buffer.from(JSON.stringify(payload));

      this.socket.send(buffer, 0, buffer.length, targetPort, targetIP, (err) => {
        if (err) {
          this.error('❌ UDP verzendfout:', err.message);
        } else {
          this.log(`✅ UDP verzonden naar ${targetIP}:${targetPort}`);
        }
      });
    } catch (err) {
      this.error('❌ Fout bij genereren/verzenden UDP:', err.message);
    }
  }

  sendHelloMessage() {
    const hello = {
      id: "hello-1",
      src: `shellypro3em-${this.getId()}`,
      dst: "Marstek",
      method: "EM.Hello",
      params: {
        device: "ShellyPro3EM",
        model: "simulator",
        fw: "1.0.0"
      }
    };

    const buffer = Buffer.from(JSON.stringify(hello));
    this.socket.send(buffer, 0, buffer.length, this.marstekPort, this.marstekIP, (err) => {
      if (err) {
        this.error('❌ Fout bij verzenden van Hello:', err.message);
      } else {
        this.log(`👋 Hello verzonden naar ${this.marstekIP}:${this.marstekPort}`);
      }
    });
  }

  async onSettings({ changedKeys }) {
    this.log('⚙️ Instellingen gewijzigd:', changedKeys);
    this.loadSettings();
    this.startUpdateLoops();
    await this.updatePowerData();
  }

  onDeleted() {
    this.log('❌ Simulator verwijderd');
    if (this.powerInterval) clearInterval(this.powerInterval);
    if (this.udpInterval) clearInterval(this.udpInterval);
    if (this.socket) this.socket.close();
  }
}

module.exports = ShellyPro3emDevice;
