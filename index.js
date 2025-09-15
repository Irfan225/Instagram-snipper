import 'dotenv/config';
import { IgApiClient, IgLoginRequiredError } from 'instagram-private-api';
import { promises as fs } from 'fs';
import axios from 'axios';
import { saveSession, loadSession } from './igSession.js';

// --- Konfigurasi dari .env ---
const {
  IG_USERNAME,
  IG_PASSWORD,
  WA_BOT_ENDPOINT,
  TARGET_ACCOUNTS,
  POLL_INTERVAL_MS,
  DUP_PERSIST_PATH,
  SESSION_FILE,
  FILTER_KEYWORDS,
  SEEN_FEEDS_FILE,
} = process.env;

const targetUsernames = TARGET_ACCOUNTS.split(',').map(u => u.trim());
const keywords = FILTER_KEYWORDS ? FILTER_KEYWORDS.toLowerCase().split(',') : [];
const pollInterval = parseInt(POLL_INTERVAL_MS, 10) || 10000;

// --- State Management ---
const ig = new IgApiClient();
let seenStoryIds = new Set();
let seenFeedIds = new Set();
const userIdToUsernameMap = new Map();

ig.state.generateDevice(IG_USERNAME);

// --- Fungsi Helper ---
async function loadSeenItems(filePath, seenSet, name) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    seenSet.clear();
    JSON.parse(data).forEach(id => seenSet.add(id));
    console.log(`✅ ${seenSet.size} item ${name} telah dimuat dari ${filePath}.`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`ℹ️ File ${filePath} tidak ditemukan, memulai dengan daftar kosong.`);
    } else {
      console.error(`❌ Gagal memuat ${filePath}:`, error);
    }
  }
}

async function saveSeenItems(filePath, seenSet) {
  try {
    await fs.writeFile(filePath, JSON.stringify([...seenSet]));
  } catch (error) {
    console.error(`❌ Gagal menyimpan ke ${filePath}:`, error);
  }
}

async function sendWhatsAppNotification(message) {
  if (!WA_BOT_ENDPOINT) {
    console.error('❌ WA_BOT_ENDPOINT tidak diatur di .env!');
    return;
  }
  try {
    await axios.post(WA_BOT_ENDPOINT, { text: message, tagall: true });
    console.log('🚀 Notifikasi WhatsApp (dengan tagall) terkirim!');
  } catch (error) {
    console.error('❌ Gagal mengirim notifikasi WhatsApp:', error.message);
  }
}

// --- Fungsi Pengecekan ---
async function checkFeeds() {
  console.log(`\n------------------\n[${new Date().toLocaleTimeString()}] 🏙️  Memeriksa feed...`);
  if (keywords.length === 0) {
    console.log('🟡 Tidak ada kata kunci filter, pengecekan feed dilewati.');
    return;
  }
  try {
    for (const [userId, username] of userIdToUsernameMap.entries()) {
      const userFeed = ig.feed.user(userId);
      const items = await userFeed.items();
      for (const item of items) {
        if (seenFeedIds.has(item.id)) continue;
        const caption = (item.caption?.text || '').toLowerCase();
        const hasKeyword = keywords.some(keyword => caption.includes(keyword));
        if (hasKeyword) {
          console.log(`✨ Ditemukan feed baru dari @${username} dengan kata kunci!`);
          const postUrl = `https://www.instagram.com/p/${item.code}/`;
          const message = `📢 Postingan baru dari @${username}\n📝 Caption: ${item.caption.text.substring(0, 100)}...\n🔗 Link: ${postUrl} \n byInfra225`;
          await sendWhatsAppNotification(message);
        }
        seenFeedIds.add(item.id);
      }
    }
    await saveSeenItems(SEEN_FEEDS_FILE, seenFeedIds);
    console.log('✅ Pemeriksaan feed selesai.');
  } catch (error) {
    console.error('❌ Terjadi error saat memeriksa feed:', error);
  }
}

async function checkStories() {
  console.log(`\n------------------\n[${new Date().toLocaleTimeString()}] 🕵️  Memeriksa story...`);
  try {
    const targetUserIds = Array.from(userIdToUsernameMap.keys());
    if (targetUserIds.length === 0) return;
    const reelsFeed = ig.feed.reelsMedia({ userIds: targetUserIds });
    const storyItems = await reelsFeed.items();
    if (storyItems.length === 0) return;
    for (const item of storyItems) {
      const storyId = item.id;
      const userId = item.user.pk.toString();
      const username = userIdToUsernameMap.get(userId);
      if (!username || seenStoryIds.has(storyId)) continue;
      let link = null;
      const linkStickerData = item.story_link_stickers?.[0]?.story_link;
      if (linkStickerData && linkStickerData.url) {
        link = linkStickerData.url;
      } else {
        const ctaLink = item.story_cta?.[0];
        if (ctaLink && ctaLink.web_uri) {
          link = ctaLink.web_uri;
        }
      }
      if (link) {
        console.log(`✨ Ditemukan story baru dengan LINK dari @${username}!`);
        const message = `📢 Story baru dari @${username}\n🔗 Link: ${link} \n by Infra225`;
        await sendWhatsAppNotification(message);
      }
      seenStoryIds.add(storyId);
    }
    await saveSeenItems(DUP_PERSIST_PATH, seenStoryIds);
    console.log('✅ Pemeriksaan story selesai.');
  } catch (error) {
    if (error instanceof IgLoginRequiredError) {
        // ... (Error handling-nya bisa disatukan di satu tempat jika mau, tapi ini sudah cukup)
    }
  }
}

// --- Alur Utama Program ---
(async () => {
  console.log('🤖 Snipper Instagram Story & Feed dijalankan...');
  await loadSeenItems(DUP_PERSIST_PATH, seenStoryIds, 'story');
  await loadSeenItems(SEEN_FEEDS_FILE, seenFeedIds, 'feed');

  const sessionData = await loadSession();
  if (sessionData) {
    await ig.state.deserialize(sessionData);
    console.log('🔑 Login menggunakan session yang ada.');
  } else {
    console.log(`🔑 Mencoba login sebagai ${IG_USERNAME}...`);
    await ig.account.login(IG_USERNAME, IG_PASSWORD);
    await saveSession(await ig.state.serialize());
  }

  console.log('🗺️  Membuat peta ID Pengguna ke Username...');
  for (const username of targetUsernames) {
    try {
      const userId = await ig.user.getIdByUsername(username);
      userIdToUsernameMap.set(userId.toString(), username);
      console.log(` -> ${username} = ${userId}`);
    } catch (e) {
      console.warn(`⚠️  Tidak dapat menemukan pengguna: ${username}`);
    }
  }
  
  const runChecks = async () => {
    try {
        await Promise.all([
            checkStories(),
            checkFeeds()
        ]);
        const serialized = await ig.state.serialize();
        delete serialized.constants;
        await saveSession(serialized);
        console.log('✅ Sesi diperbarui setelah semua pengecekan selesai.');
    } catch (error) {
        if (error instanceof IgLoginRequiredError) {
            console.error('❌ Sesi tidak valid atau kedaluwarsa. Menghapus sesi lama dan memulai ulang...');
            try {
                await fs.unlink(SESSION_FILE);
            } catch (e) {
                // File mungkin sudah tidak ada, abaikan error ini
            }
            console.log('🔄 Aplikasi akan berhenti. PM2 akan merestart secara otomatis.');
            process.exit(1);
        } else {
            console.error('❌ Terjadi error tak terduga di siklus pengecekan:', error);
        }
    }
  };

  console.log(`🎯 Target: [${Array.from(userIdToUsernameMap.values()).join(', ')}]. Interval: ${pollInterval / 1000} detik.`);
  await runChecks();
  setInterval(runChecks, pollInterval);

})();