const maxTrackedMentions = 10;

class Mentions {
  ignoring = new Set();

  data = [];

  processMessage(message) {
    if (!message.highlighted || message.ignored) {
      return;
    }
    this.add(message.user.displayName, message.timestamp);
  }

  add(user, timestamp) {
    const idx = this.data.findIndex((existing) => existing.user === user);
    const mention = { user, timestamp };
    if (idx === -1) {
      // User not already tracked
      const newLength = this.data.unshift(mention);
      if (newLength > maxTrackedMentions) {
        this.data.pop();
      }
    } else {
      // Update recency
      this.data[idx].timestamp = timestamp;
      this.data.splice(idx, 1);
      this.data.unshift(mention);
    }
  }

  resimulateMessages(messages) {
    // Only resimulate mentions that are within the time range shown on screen
    const allTimestamps = messages
      .map((message) => message.timestamp?.valueOf())
      .filter(Boolean);
    const cutoff = allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0;
    this.data = this.data.filter(
      (mention) =>
        mention.timestamp.valueOf() < cutoff &&
        !this.ignoring.has(mention.user.toLowerCase()),
    );

    for (const message of messages) {
      this.processMessage(message);
    }
  }
}

export default Mentions;
