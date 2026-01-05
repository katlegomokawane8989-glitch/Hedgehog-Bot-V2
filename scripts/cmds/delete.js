const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "delete",
    aliases: ["del"],
    version: "1.0",
    author: "lonely",
    role: 2, // BOT ADMIN ONLY
    shortDescription: "Delete a command from the bot",
    longDescription: "Remove a command file and unload it from GoatBot",
    category: "system",
    guide: "{pn} <command name>"
  },

  onStart: async function ({ api, event, args }) {
    const cmdName = args[0];

    if (!cmdName) {
      return api.sendMessage(
        "❌ | Please provide a command name to delete.",
        event.threadID,
        event.messageID
      );
    }

    const cmdPath = path.join(__dirname, cmdName + ".js");

    if (!fs.existsSync(cmdPath)) {
      return api.sendMessage(
        `❌ | Command "${cmdName}" not found.`,
        event.threadID,
        event.messageID
      );
    }

    try {
      // Remove from require cache
      delete require.cache[require.resolve(cmdPath)];

      // Delete file
      fs.unlinkSync(cmdPath);

      // Remove from GoatBot command list
      global.GoatBot.commands.delete(cmdName);

      api.sendMessage(
        `✅ | Command "${cmdName}" has been deleted.`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      api.sendMessage(
        "❌ | Failed to delete the command.",
        event.threadID,
        event.messageID
      );
    }
  }
};