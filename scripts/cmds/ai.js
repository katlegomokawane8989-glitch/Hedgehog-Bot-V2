const axios = require("axios");
const validUrl = require("valid-url");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const TMP_DIR = path.join(__dirname, "tmp");

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000
  });
  fs.writeFileSync(filePath, res.data);
  return fs.createReadStream(filePath);
};

const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply("✅ Conversation reset.");
  } catch {
    return message.reply("❌ Reset failed.");
  }
};

const handleAIRequest = async (api, event, userInput, message) => {
  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  let content = userInput;
  let imageUrl = null;

  if (event.messageReply?.attachments?.[0]?.type === "photo") {
    imageUrl = event.messageReply.attachments[0].url;
  }

  const urlMatch = content.match(/https?:\/\/\S+/);
  if (urlMatch && validUrl.isWebUri(urlMatch[0])) {
    imageUrl = urlMatch[0];
    content = content.replace(urlMatch[0], "").trim();
  }

  if (!content && !imageUrl) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply("💬 Send a message or image.");
  }

  try {
    const res = await axios.post(
      API_ENDPOINT,
      {
        uid: event.senderID,
        message: content,
        image_url: imageUrl
      },
      { timeout: 25000 }
    );

    const {
      reply,
      image_url,
      music_data,
      video_data,
      shotti_data,
      lyrics_data
    } = res.data;

    let body = reply || "✅ Lonely AI Response";

    // 🔥 FILTER: Replace any Shizu name with "Lonely"
    body = body
      .replace(/🎀\s*𝗦𝗵𝗶𝘇𝘂/gi, "💙 𝗟𝗼𝗻𝗲𝗹𝘆")
      .replace(/𝗦𝗵𝗶𝘇𝘂/gi, "𝗟𝗼𝗻𝗲𝗹𝘆")
      .replace(/Shizu/gi, "Lonely");

    const attachments = [];
    const tasks = [];

    if (image_url) tasks.push(downloadFile(image_url, "jpg"));
    if (music_data?.downloadUrl) tasks.push(downloadFile(music_data.downloadUrl, "mp3"));
    if (video_data?.downloadUrl) tasks.push(downloadFile(video_data.downloadUrl, "mp4"));
    if (shotti_data?.videoUrl) tasks.push(downloadFile(shotti_data.videoUrl, "mp4"));

    const results = await Promise.allSettled(tasks);
    results.forEach(r => {
      if (r.status === "fulfilled") attachments.push(r.value);
    });

    if (lyrics_data?.lyrics) {
      body += `\n\n🎵 ${lyrics_data.track_name}\n${lyrics_data.lyrics.slice(0, 1200)}`;
    }

    const sent = await message.reply({
      body,
      attachment: attachments.length ? attachments : undefined
    });

    if (sent?.messageID) {
      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "ai",
        author: event.senderID
      });
    }

    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply("⚠️ Lonely AI is busy. Try again later.");
  }
};

module.exports = {
  config: {
    name: "ai",
    aliases: [],
    version: "2.1.1",
    author: "Aryan Chauhan",
    role: 0,
    category: "ai",
    longDescription: {
      en: "Lonely AI – fast chat, image, music, video & lyrics"
    },
    guide: {
      en: `.ai [message]
• Chat • Image • Music • Video
• lyrics [song name]
• shoti
• clear / reset`
    }
  },

  onStart: async ({ api, event, args, message }) => {
    const input = args.join(" ").trim();
    if (!input) return message.reply("❗ Please enter a message.");

    if (["clear", "reset"].includes(input.toLowerCase()))
      return resetConversation(api, event, message);

    return handleAIRequest(api, event, input, message);
  },

  onReply: async ({ api, event, Reply, message }) => {
    if (event.senderID !== Reply.author) return;
    const input = event.body?.trim();
    if (!input) return;

    if (["clear", "reset"].includes(input.toLowerCase()))
      return resetConversation(api, event, message);

    return handleAIRequest(api, event, input, message);
  },

  onChat: async ({ api, event, message }) => {
    if (!event.body?.toLowerCase().startsWith("ai ")) return;
    return handleAIRequest(
      api,
      event,
      event.body.slice(3).trim(),
      message
    );
  }
};