// Speech to Text Service (Mock for Prototype)
// COMPLIANCE: Labeled as prototype/mock in all implementations

const speech = require('speech-recognition'); // placeholder

const SpeechToTextProvider = {
  // Mock implementation - actual would connect to STT API
  transcribeAudio: (audioFilePath) => {
    // For prototype: return hardcoded transcription
    return {
      success: true,
      text: `Diarrhea symptoms in {VillageName} at {Timestamp}`,
      isMock: true // EXPLICITLY MARKED AS PROTOTYPE
    };
  },

  processVoiceReport: (audioData) => {
    // PROTOTYPE BEHAVIOR: Simulate async processing
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          transcribed: `Fever and vomiting reported in {Location}`,
          metadata: {
            location: `{extractedLocation}`,
            timestamp: new Date()
          }
        })
      }, 500); // Simulate 500ms processing
    })
  }
};

module.exports = SpeechToTextProvider;