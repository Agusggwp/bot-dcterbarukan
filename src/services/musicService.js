import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  demuxProbe,
} from '@discordjs/voice';
import { Ytdl } from '@distube/ytdl-core';
import { guildRepository } from '../repositories/guildRepository.js';
import { broadcastMusicUpdate } from '../utils/dashboardEvents.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

class GuildMusicSubscription {
  constructor(guildId, textChannel, voiceChannel) {
    this.guildId = guildId;
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;
    this.queue = [];
    this.currentSong = null;
    this.currentResource = null;
    this.volume = 0.8;
    this.loopMode = 'off'; // 'off' | 'song' | 'queue'
    this.idleTimer = null;
    this.ytdl = new Ytdl();

    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    this.player = createAudioPlayer();
    this.connection.subscribe(this.player);

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.handleSongFinish();
    });

    this.player.on('error', (err) => {
      logger.error({ guildId: this.guildId, error: err.message }, 'AudioPlayer encountered an error');
      this.handleSongFinish();
    });

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        this.destroy();
      }
    });

    this.connection.on('error', (err) => {
      logger.warn({ guildId: this.guildId, error: err.message }, 'VoiceConnection error');
    });
  }

  resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.queue.length === 0 && !this.currentSong) {
        this.textChannel?.send({
          embeds: [AppEmbed.info('Musik Berhenti', 'Bot meninggalkan saluran suara karena tidak ada musik yang diputar.')]
        }).catch(() => null);
        this.destroy();
      }
    }, 180000); // 3 minutes idle
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  async playNext(notify = true) {
    if (this.queue.length === 0) {
      this.currentSong = null;
      this.currentResource = null;
      this.resetIdleTimer();
      return;
    }

    this.clearIdleTimer();
    const song = this.queue.shift();
    this.currentSong = song;

    try {
      const stream = this.ytdl.download(song.url, {
        filter: (format) => format.hasAudio && !format.hasVideo,
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
      });

      stream.on('error', (err) => {
        logger.error({ error: err.message, song: song.title }, 'Audio download stream error');
      });

      const probe = await demuxProbe(stream);
      const resource = createAudioResource(probe.stream, {
        inputType: probe.type,
        inlineVolume: true,
      });

      if (resource.volume) {
        resource.volume.setVolume(this.volume);
      }

      resource.playStream.on('error', (err) => {
        logger.error({ error: err.message, song: song.title }, 'Resource playStream error');
      });

      this.currentResource = resource;
      this.player.play(resource);
      musicService.broadcastState(this.guildId);

      if (notify) {
        const embed = AppEmbed.primary('▶️ Sedang Memutar Musik', `[${song.title}](${song.url})`)
          .addFields(
            { name: 'Durasi', value: song.duration || 'Live', inline: true },
            { name: 'Diminta oleh', value: `<@${song.requesterId}>`, inline: true },
            { name: 'Volume', value: `${Math.round(this.volume * 100)}%`, inline: true }
          )
          .setThumbnail(song.thumbnail || null);

        await this.textChannel?.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      logger.error({ error: err.message, song: song?.title }, 'Failed to stream audio track');
      musicService.broadcastState(this.guildId);
      if (notify) {
        this.textChannel?.send({
          embeds: [AppEmbed.error('Gagal Memutar Lagu', `Tidak dapat memutar [${song?.title || 'Unknown'}](${song?.url || ''}): ${err.message}`)]
        }).catch(() => null);
        this.playNext(true);
      } else {
        throw err;
      }
    }
  }

  handleSongFinish() {
    if (this.loopMode === 'song' && this.currentSong) {
      this.queue.unshift(this.currentSong);
    } else if (this.loopMode === 'queue' && this.currentSong) {
      this.queue.push(this.currentSong);
    }
    this.playNext(true);
    musicService.broadcastState(this.guildId);
  }

  pause() {
    const res = this.player.pause();
    musicService.broadcastState(this.guildId);
    return res;
  }

  resume() {
    const res = this.player.unpause();
    musicService.broadcastState(this.guildId);
    return res;
  }

  skip() {
    this.player.stop();
    musicService.broadcastState(this.guildId);
  }

  stop() {
    this.queue = [];
    this.currentSong = null;
    this.currentResource = null;
    this.player.stop();
    this.destroy();
    musicService.broadcastState(this.guildId);
  }

  setVolume(volPercent) {
    const vol = Math.max(0, Math.min(100, volPercent)) / 100;
    this.volume = vol;
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(vol);
    }
    musicService.broadcastState(this.guildId);
  }

  setLoop(mode) {
    this.loopMode = mode;
    musicService.broadcastState(this.guildId);
  }

  removeTrack(index) {
    if (typeof index === 'number' && index >= 0 && index < this.queue.length) {
      const removed = this.queue.splice(index, 1);
      musicService.broadcastState(this.guildId);
      return removed[0];
    }
    return null;
  }

  clearQueue() {
    this.queue = [];
    musicService.broadcastState(this.guildId);
  }

  destroy() {
    this.clearIdleTimer();
    this.queue = [];
    this.currentSong = null;
    this.currentResource = null;
    try {
      this.player.stop(true);
      this.connection.destroy();
    } catch {}
    musicService.subscriptions.delete(this.guildId);
    musicService.broadcastState(this.guildId);
  }
}

class MusicService {
  constructor() {
    this.subscriptions = new Map(); // guildId -> GuildMusicSubscription
    this.ytdl = new Ytdl();
  }

  broadcastState(guildId) {
    try {
      const status = this.getStatus(guildId);
      broadcastMusicUpdate(guildId, status);
    } catch {}
  }

  getSubscription(guildId) {
    return this.subscriptions.get(guildId) || null;
  }

  async searchTrack(query) {
    if (query.startsWith('http://') || query.startsWith('https://')) {
      try {
        const info = await this.ytdl.getInfo(query);
        return {
          title: info.videoDetails.title,
          url: info.videoDetails.video_url || query,
          duration: info.videoDetails.lengthSeconds ? `${Math.floor(info.videoDetails.lengthSeconds / 60)}:${String(info.videoDetails.lengthSeconds % 60).padStart(2, '0')}` : 'Live',
          thumbnail: info.videoDetails.thumbnails?.[0]?.url || null,
        };
      } catch (err) {
        logger.warn({ error: err.message, query }, 'Failed to parse video info from direct URL');
      }
    }

    // Search via Ytdl
    try {
      const results = await this.ytdl.search(query);
      if (results && results.length > 0) {
        const track = results[0];
        return {
          title: track.title,
          url: track.url,
          duration: track.durationRaw || `${Math.floor((track.durationInSec || 0) / 60)}:${String((track.durationInSec || 0) % 60).padStart(2, '0')}`,
          thumbnail: track.thumbnails?.[0]?.url || null,
        };
      }
    } catch (err) {
      logger.error({ error: err.message, query }, 'Search failed on ytdl');
    }

    return null;
  }

  async play(guildId, query, member, textChannel, targetVoiceChannel = null) {
    const voiceChannel = targetVoiceChannel || member?.voice?.channel;
    if (!voiceChannel) {
      throw new Error('Anda harus bergabung ke saluran suara (Voice Channel) atau memilih saluran suara terlebih dahulu!');
    }

    // Check guild music settings
    const config = await guildRepository.getGuildConfig(guildId);
    if (textChannel && config.musicChannelId && config.musicChannelId !== textChannel.id && !targetVoiceChannel) {
      throw new Error(`Perintah musik hanya diizinkan di saluran <#${config.musicChannelId}>!`);
    }

    let sub = this.subscriptions.get(guildId);
    if (!sub || sub.connection.state.status === VoiceConnectionStatus.Destroyed) {
      sub = new GuildMusicSubscription(guildId, textChannel, voiceChannel);
      sub.volume = (config.musicDefaultVolume || 80) / 100;
      this.subscriptions.set(guildId, sub);
    } else {
      sub.textChannel = textChannel;
      if (sub.voiceChannel.id !== voiceChannel.id || sub.connection.state.status === VoiceConnectionStatus.Disconnected) {
        try {
          sub.connection.destroy();
        } catch {}
        sub.voiceChannel = voiceChannel;
        sub.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: true,
        });
        sub.connection.subscribe(sub.player);
      }
    }

    try {
      await entersState(sub.connection, VoiceConnectionStatus.Ready, 10000);
    } catch (connErr) {
      logger.error({ error: connErr.message, guildId }, 'VoiceConnection failed to reach Ready state');
      sub.destroy();
      throw new Error('Bot gagal terhubung ke Voice Channel. Pastikan bot memiliki izin Connect & Speak di saluran suara tersebut.');
    }

    const track = await this.searchTrack(query);
    if (!track) {
      throw new Error(`Tidak ditemukan lagu atau video untuk pencarian: \`${query}\``);
    }

    track.requesterId = member.id;
    track.requesterTag = member.user.tag;

    if (!sub.currentSong && sub.player.state.status === AudioPlayerStatus.Idle) {
      sub.queue.push(track);
      await sub.playNext(false);
      this.broadcastState(guildId);
      return { status: 'PLAYING', track };
    } else {
      sub.queue.push(track);
      this.broadcastState(guildId);
      return { status: 'QUEUED', track, position: sub.queue.length };
    }
  }

  getStatus(guildId) {
    const sub = this.subscriptions.get(guildId);
    if (!sub || (!sub.currentSong && sub.queue.length === 0)) {
      return {
        playing: false,
        currentSong: null,
        queue: [],
        volume: 80,
        loopMode: 'off',
      };
    }

    return {
      playing: sub.player.state.status === AudioPlayerStatus.Playing,
      paused: sub.player.state.status === AudioPlayerStatus.Paused,
      currentSong: sub.currentSong,
      queue: sub.queue,
      volume: Math.round(sub.volume * 100),
      loopMode: sub.loopMode,
    };
  }
}

export const musicService = new MusicService();
