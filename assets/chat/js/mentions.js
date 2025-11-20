const maxTrackedMentions = 10;

// This class tracks recent mentions in chat messages for use in autocompletion
class Mentions {
  data = [];

  processMessage(message) {
    if (!message.highlighted || message.ignored) {
      return;
    }
    this.add(message.user.displayName, message.timestamp);
  }

  add(user, timestamp) {
    // Remove existing entry if present
    const idx = this.data.findIndex((existing) => existing.user === user);
    if (idx >= 0) {
      this.data.splice(idx, 1);
    }

    // Add to front and trim to maximum number of tracked mentions
    this.data.unshift({ user, timestamp });
    if (this.data.length > maxTrackedMentions) {
      this.data.pop();
    }
  }

  resimulateMessages(messages) {
    // Keep any mentions older than the oldest loaded message, as they cannot be resimulated
    const oldestTimestamp = messages.reduce(
      (min, message) => Math.min(min, message.timestamp?.valueOf()),
      Infinity,
    );
    this.data = this.data.filter(
      (mention) => mention.timestamp.valueOf() < oldestTimestamp,
    );

    for (const message of messages) {
      this.processMessage(message);
    }
  }
}

export default Mentions;
