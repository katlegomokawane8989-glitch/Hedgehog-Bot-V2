const fs = require("fs");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "3.2",
    author: "NTKhang // xnil6x",
    countDown: 5,
    role: 0,
    description: "View command information with enhanced interface",
    category: "info",
    guide: {
      en: "{pn} [command] - View command details\n{pn} all - View all commands\n{pn} c [category] - View commands in category"
    }
  },

  langs: {
    en: {
      helpHeader: "╔══════◇◆◇══════╗\n"
                + "      BOT COMMAND LIST\n"
                + "╠══════◇◆◇══════╣",
      categoryHeader: "\n   ┌──── {category} ────┐\n",
      commandItem: "║ │ ❤️‍🩹 {name}",
      helpFooter: "║ └─────────────┘\n"
                + "╚══════◇◆◇══════╝",
      commandInfo: "╔══════◇◆◇══════╗\n"
                 + "║           COMMAND INFORMATION      \n"
                 + "╠══════◇◆◇══════╣\n"
                 + "║ 🏷️ Name: {name}\n"
                 + "║ 📝 Description: {description}\n"
                 + "║ 📂 Category: {category}\n"
                 + "║ 🔤 Aliases: {aliases}\n"
                 + "║ 🏷️ Version: {version}\n"
                 + "║ 🔒 Permissions: {role}\n"
                 + "║ ⏱️ Cooldown: {countDown}s\n"
                 + "║ 🔧 Use Prefix: {usePrefix}\n"
                 + "║ 👤 Author: {author}\n"
                 + "╠══════◇◆◇══════╣",
      usageHeader: "║ 🛠️ USAGE GUIDE",
      usageBody: " ║ {usage}",
      usageFooter: "╚══════◇◆◇══════╝",
      commandNotFound: "⚠️ Command '{command}' not found!",
      doNotHave: "None",
      roleText0: "👥 All Users",
      roleText1: "👑 Group Admins",
      roleText2: "⚡ Bot Admins",
      totalCommands: "📊 Total Commands: {total}\n"
                  + "Lonely BoT"
    }
  },

  onStart: async function({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const prefix = getPrefix(threadID);
    const commandName = args[0]?.toLowerCase();
    const bannerPath = path.join(__dirname, "assets", "20250319_111041.png");

    if (commandName === 'c' && args[1]) {
      const categoryArg = args[1].toUpperCase();
      const commandsInCategory = [];

      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;
        const category = cmd.config.category?.toUpperCase() || "GENERAL";
        if (category === categoryArg) {
          commandsInCategory.push({ name });
        }
      }

      if (commandsInCategory.length === 0) {
        return message.reply(`❌ No commands found in category: ${categoryArg}`);
      }

      let replyMsg = this.langs.en.helpHeader;
      replyMsg += this.langs.en.categoryHeader.replace(/{category}/g, categoryArg);

      commandsInCategory.sort((a, b) => a.name.localeCompare(b.name)).forEach(cmd => {
        replyMsg += this.langs.en.commandItem.replace(/{name}/g, cmd.name) + "\n";
      });

      replyMsg += this.langs.en.helpFooter;
      replyMsg += "\n" + this.langs.en.totalCommands.replace(/{total}/g, commandsInCategory.length);

      return message.reply(replyMsg);
    }

    if (!commandName || commandName === 'all') {
      const categories = new Map();

      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;

        const category = cmd.config.category?.toUpperCase() || "GENERAL";
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category).push({ name });
      }

      const sortedCategories = [...categories.keys()].sort();
      let replyMsg = this.langs.en.helpHeader.replace(/{prefix}/g, prefix);
      let totalCommands = 0;

      for (const category of sortedCategories) {
        const commandsInCategory = categories.get(category).sort((a, b) => a.name.localeCompare(b.name));
        totalCommands += commandsInCategory.length;

        replyMsg += this.langs.en.categoryHeader.replace(/{category}/g, category);

        commandsInCategory.forEach(cmd => {
          replyMsg += this.langs.en.commandItem.replace(/{name}/g, cmd.name) + "\n";
        });

        replyMsg += this.langs.en.helpFooter;
      }

      replyMsg += "\n" + this.langs.en.totalCommands.replace(/{total}/g, totalCommands);

      try {
        if (fs.existsSync(bannerPath)) {
          return message.reply({
            body: replyMsg,
            attachment: fs.createReadStream(bannerPath)
          });
        } else {
          return message.reply(replyMsg);
        }
      } catch (e) {
        console.error("Couldn't load help banner:", e);
        return message.reply(replyMsg);
      }
    }

    let cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) {
      return message.reply(this.langs.en.commandNotFound.replace(/{command}/g, commandName));
    }

    const config = cmd.config;
    const description = config.description?.en || config.description || "No description";
    const aliasesList = config.aliases?.join(", ") || this.langs.en.doNotHave;
    const category = config.category?.toUpperCase() || "GENERAL";

    let roleText;
    switch(config.role) {
      case 1: roleText = this.langs.en.roleText1; break;
      case 2: roleText = this.langs.en.roleText2; break;
      default: roleText = this.langs.en.roleText0;
    }

    let guide = config.guide?.en || config.usage || config.guide || "No usage guide available";
    if (typeof guide === "object") guide = guide.body;
    guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);

    let replyMsg = this.langs.en.commandInfo
      .replace(/{name}/g, config.name)
      .replace(/{description}/g, description)
      .replace(/{category}/g, category)
      .replace(/{aliases}/g, aliasesList)
      .replace(/{version}/g, config.version)
      .replace(/{role}/g, roleText)
      .replace(/{countDown}/g, config.countDown || 1)
      .replace(/{usePrefix}/g, typeof config.usePrefix === "boolean" ? (config.usePrefix ? "✅ Yes" : "❌ No") : "❓ Unknown")
      .replace(/{author}/g, config.author || "Unknown");

    replyMsg += "\n" + this.langs.en.usageHeader + "\n" +
                this.langs.en.usageBody.replace(/{usage}/g, guide.split("\n").join("\n ")) + "\n" +
                this.langs.en.usageFooter;

    return message.reply(replyMsg);
  }
};