module.exports = {
  config: {
    name: "respect",
    version: "1.0",
    author: "lonely",
    role: 2, // BOT ADMIN only, GoatBot v2 handles this
    shortDescription: "Bot admin adds themselves as group admin",
    longDescription: "Bot admin uses this command to get promoted to group admin if bot is admin",
    category: "group",
    guide: "{pn}"
  },

  onStart: async function({ api, event }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    // Only works in groups
    if (!event.isGroup) {
      return api.sendMessage(
        "❌ | This command only works in groups.",
        threadID,
        event.messageID
      );
    }

    try {
      // Promote sender (bot admin) to group admin
      await api.changeAdminStatus(threadID, senderID, true);

      api.sendMessage(
        "🫡 𝗥𝗘𝗦𝗣𝗘𝗖𝗧\n\nYou are now a group admin!",
        threadID,
        event.messageID
      );
    } catch (err) {
      api.sendMessage(
        "❌ | I must be a group admin first to promote you.",
        threadID,
        event.messageID
      );
    }
  }
};