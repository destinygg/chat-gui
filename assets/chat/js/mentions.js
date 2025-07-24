const maxTrackedMentions = 10;

class Mentions {
  constructor() {
    this.users = [];
    this.backlog = [];
  }

  processMessage(message) {
    if (!message.highlighted || message.ignored) {
      return;
    }
    this.add(message.user);
  }

  add(user) {
    const idx = this.users.findIndex(
      (existing) => existing.displayName === user.displayName,
    );
    if (idx === -1) {
      // User not already tracked
      const newLength = this.users.unshift(user);
      if (newLength > maxTrackedMentions) {
        this.users.pop();
      }
    } else {
      // Update recency
      this.users.splice(idx, 1);
      this.users.unshift(user);
    }
  }

  // Backlog system to work around race condition in issue #679.
  // This can be completely removed if that issue is resolved.
  queueBacklog(message) {
    this.backlog.push(message);
  }

  flushBacklog() {
    for (const message of this.backlog) {
      this.processMessage(message);
    }
    this.backlog = [];
  }
}

export default Mentions;
