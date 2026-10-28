import { PermissionFlagsBits } from 'discord.js';

export function validateHierarchy({ moderatorMember, targetMember, botMember }) {
  if (!targetMember) {
    return { valid: true };
  }

  // Guild owner immunity
  if (targetMember.id === targetMember.guild.ownerId) {
    return {
      valid: false,
      reason: 'Anda tidak dapat melakukan tindakan moderasi terhadap Pemilik Server (Server Owner).',
    };
  }

  // Self moderation prevention
  if (moderatorMember.id === targetMember.id) {
    return {
      valid: false,
      reason: 'Anda tidak dapat melakukan tindakan moderasi terhadap diri Anda sendiri.',
    };
  }

  // Bot target prevention
  if (botMember && targetMember.id === botMember.id) {
    return {
      valid: false,
      reason: 'Bot tidak dapat melakukan tindakan moderasi terhadap dirinya sendiri.',
    };
  }

  // Moderator vs Target Role Hierarchy (Owner bypasses role check)
  if (moderatorMember.id !== moderatorMember.guild.ownerId) {
    if (targetMember.roles.highest.position >= moderatorMember.roles.highest.position) {
      return {
        valid: false,
        reason: 'Hirarki Peran: Pengguna target memiliki posisi peran yang setara atau lebih tinggi dari Anda.',
      };
    }
  }

  // Bot vs Target Role Hierarchy
  if (botMember && targetMember.roles.highest.position >= botMember.roles.highest.position) {
    return {
      valid: false,
      reason: 'Hirarki Peran: Peran tertinggi Bot berada di bawah atau setara dengan peran pengguna target.',
    };
  }

  return { valid: true };
}

export function checkBotPermissions(channelOrGuild, requiredPermissions = []) {
  const me = channelOrGuild.guild ? channelOrGuild.guild.members.me : channelOrGuild.members?.me;
  if (!me) return { hasPermission: true };

  const perms = channelOrGuild.permissionsFor ? channelOrGuild.permissionsFor(me) : me.permissions;
  const missing = requiredPermissions.filter((perm) => !perms.has(perm));

  return {
    hasPermission: missing.length === 0,
    missing,
  };
}
