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
    // Get the timestamp of the earliest message still loaded
    const allTimestamps = messages
      .map((message) => message.timestamp?.valueOf())
      .filter(Boolean); // Filter out messages without timestamps
    const cutoff = allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;

    // Keep only mentions older than this timestamp - newer ones can be resimulated as they are still loaded
    this.data = this.data.filter(
      (mention) => mention.timestamp.valueOf() < cutoff,
    );

    for (const message of messages) {
      this.processMessage(message);
    }
  }
}

export default Mentions;
