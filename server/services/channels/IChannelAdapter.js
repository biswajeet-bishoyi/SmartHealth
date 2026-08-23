/**
 * Channel Adapters
 * ----------------
 * IChannelAdapter interface + SMS + IVR mock implementations.
 * Normalizes inbound SMS/IVR payloads into the same HealthReport/WaterReport shape.
 *
 * PROTOTYPE DISCLAIMER: SMS/IVR integration is architecture-only in this prototype.
 * Real telecom provider integration is a Phase 2 dependency.
 * Mock inbound payloads accepted via /api/channels/mock-inbound (admin/dev only).
 */

// ─── Interface ────────────────────────────────────────────────────────────────
class IChannelAdapter {
  /**
   * Parse a raw inbound channel payload into a normalized report.
   * @param {Object} rawPayload
   * @returns {{ reportType, data, sourceChannel }}
   */
  // eslint-disable-next-line no-unused-vars
  receive(rawPayload) {
    throw new Error('IChannelAdapter.receive() must be implemented');
  }
  channelName() { return 'UNKNOWN'; }
  isMock()      { return true; }
}

// ─── SMS Adapter ──────────────────────────────────────────────────────────────
// Expected format: "REPORT diarrhea 3 MAJULI" or "WATER dirty_water MAJULI HIGH"
class SmsChannelAdapter extends IChannelAdapter {
  channelName() { return 'SMS'; }
  isMock()      { return true; }

  receive({ from, body, village, district, state, userId }) {
    const parts = (body || '').trim().toUpperCase().split(/\s+/);
    const keyword = parts[0];

    if (keyword === 'REPORT') {
      const symptom = (parts[1] || 'other').toLowerCase();
      const affected = parseInt(parts[2]) || 1;
      const loc = parts[3] || village || 'Unknown';
      return {
        reportType: 'health',
        sourceChannel: 'SMS',
        data: {
          symptoms: [symptom],
          affectedPeople: affected,
          village: loc,
          district: district || loc,
          state: state || 'Assam',
          duration: 1,
          description: `[SMS] From ${from}: ${body}`,
          userId,
        },
      };
    } else if (keyword === 'WATER') {
      const issueType = (parts[1] || 'other').toLowerCase();
      const loc       = parts[2] || village || 'Unknown';
      const severity  = parts[3] || 'MEDIUM';
      return {
        reportType: 'water',
        sourceChannel: 'SMS',
        data: {
          issueType,
          severity,
          village: loc,
          district: district || loc,
          state: state || 'Assam',
          description: `[SMS] From ${from}: ${body}`,
          reportedBy: userId,
        },
      };
    }

    return { reportType: 'unknown', sourceChannel: 'SMS', raw: body };
  }
}

// ─── IVR Adapter ──────────────────────────────────────────────────────────────
// Accepts structured DTMF/IVR menu selections
// IVR menu: 1=symptoms, 2=water problem, 3=hear alerts, 4=language
class IvrChannelAdapter extends IChannelAdapter {
  channelName() { return 'IVR'; }
  isMock()      { return true; }

  receive({ from, selection, village, district, state, userId }) {
    const sel = parseInt(selection) || 0;

    if (sel === 1) {
      return {
        reportType: 'health',
        sourceChannel: 'IVR',
        data: {
          symptoms: ['other'],
          affectedPeople: 1,
          village: village || 'Unknown',
          district: district || 'Unknown',
          state: state || 'Assam',
          description: `[IVR] Symptom report from ${from}`,
          userId,
        },
      };
    } else if (sel === 2) {
      return {
        reportType: 'water',
        sourceChannel: 'IVR',
        data: {
          issueType: 'other',
          severity: 'MEDIUM',
          village: village || 'Unknown',
          district: district || 'Unknown',
          state: state || 'Assam',
          description: `[IVR] Water problem report from ${from}`,
          reportedBy: userId,
        },
      };
    }

    return { reportType: 'unknown', sourceChannel: 'IVR', selection };
  }
}

const smsAdapter = new SmsChannelAdapter();
const ivrAdapter = new IvrChannelAdapter();

module.exports = { IChannelAdapter, smsAdapter, ivrAdapter };
