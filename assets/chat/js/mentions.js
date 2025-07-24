const maxTrackedMentions = 10;

class Mentions {
  constructor() {
    this.users = [];
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
}

export default Mentions;
