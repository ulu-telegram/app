import { useMemo } from 'react';
import { getActions } from '../global';

import type { MenuItemContextAction } from '../components/ui/ListItem';
import { type ApiChat, type ApiUser } from '../api/types';

import { JUNE_TRACK_EVENTS, SERVICE_NOTIFICATIONS_USER_ID } from '../config';
import {
  getCanDeleteChat, isChatArchived, isChatChannel, isChatGroup,
  isUserId,
} from '../global/helpers';
import { compact } from '../util/iteratees';
import { IS_ELECTRON, IS_OPEN_IN_NEW_TAB_SUPPORTED } from '../util/windowEnvironment';
import useArchiver from './useArchiver';
import useDone from './useDone';
import { useJune } from './useJune';
import useLang from './useLang';
import useSnooze from './useSnooze';

const useChatContextActions = ({
  chat,
  user,
  folderId,
  isInbox,
  isPinned,
  isMuted,
  canChangeFolder,
  isSavedDialog,
  currentUserId,
  handleDelete,
  handleMute,
  handleChatFolderChange,
  handleReport,
}: {
  chat: ApiChat | undefined;
  user: ApiUser | undefined;
  folderId?: number;
  isInbox?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  canChangeFolder?: boolean;
  isSavedDialog?: boolean;
  currentUserId?: string;
  handleDelete?: NoneToVoidFunction;
  handleMute?: NoneToVoidFunction;
  handleChatFolderChange: NoneToVoidFunction;
  handleReport?: NoneToVoidFunction;
}, isInSearch = false) => {
  const lang = useLang();

  const { isSelf } = user || {};
  const isServiceNotifications = user?.id === SERVICE_NOTIFICATIONS_USER_ID;

  const { archiveChat } = useArchiver({ isManual: true });
  const { doneChat, isChatDone } = useDone();
  const { snooze } = useSnooze();
  const { track } = useJune();

  const deleteTitle = useMemo(() => {
    if (!chat) return undefined;

    if (isSavedDialog) {
      return lang('Delete');
    }

    if (isUserId(chat.id)) {
      return lang('DeleteChatUser');
    }

    if (getCanDeleteChat(chat)) {
      return lang('DeleteChat');
    }

    if (isChatChannel(chat)) {
      return lang('LeaveChannel');
    }

    return lang('Group.LeaveGroup');
  }, [chat, isSavedDialog, lang]);

  return useMemo(() => {
    if (!chat) {
      return undefined;
    }

    const {
      toggleChatPinned,
      toggleSavedDialogPinned,
      updateChatMutedState,
      toggleChatUnread,
      openChatInNewTab,
    } = getActions();

    const actionNotifyMe = {
      title: lang('NotifyMeHotkey'),
      icon: 'schedule',
      handler: () => {
        snooze({ chatId: chat.id });
        track(JUNE_TRACK_EVENTS.SNOOZE_CHAT, { source: 'Chat Context Menu' });
      },
    };

    const actionOpenInNewTab = IS_OPEN_IN_NEW_TAB_SUPPORTED && {
      title: IS_ELECTRON ? 'Open in new window' : 'Open in new tab',
      icon: 'open-in-new-tab',
      handler: () => {
        if (isSavedDialog) {
          openChatInNewTab({ chatId: currentUserId!, threadId: chat.id });
        } else {
          openChatInNewTab({ chatId: chat.id });
        }
      },
    };

    const togglePinned = () => {
      if (isSavedDialog) {
        toggleSavedDialogPinned({ id: chat.id });
      } else {
        toggleChatPinned({ id: chat.id, folderId: folderId! });
      }
    };

    const actionPin = isPinned
      ? {
        title: lang('UnpinFromTop'),
        icon: 'unpin',
        handler: togglePinned,
      }
      : {
        title: lang('PinToTop'),
        icon: 'pin',
        handler: togglePinned,
      };

    const actionDelete = {
      title: deleteTitle,
      icon: 'delete',
      destructive: true,
      handler: handleDelete,
    };

    if (isSavedDialog) {
      return compact([actionOpenInNewTab, actionPin, actionDelete]) as MenuItemContextAction[];
    }

    const actionAddToFolder = canChangeFolder ? {
      title: lang('ChatList.Filter.AddToFolder'),
      icon: 'folder',
      handler: handleChatFolderChange,
    } : undefined;

    const actionMute = isMuted
      ? {
        title: lang('ChatList.Unmute'),
        icon: 'unmute',
        handler: () => updateChatMutedState({ chatId: chat.id, isMuted: false }),
      }
      : {
        title: `${lang('ChatList.Mute')}...`,
        icon: 'mute',
        handler: handleMute,
      };

    if (isInSearch) {
      return compact([actionOpenInNewTab, actionPin, actionAddToFolder, actionMute]) as MenuItemContextAction[];
    }

    const actionMaskAsRead = (chat.unreadCount || chat.hasUnreadMark)
      ? {
        title:
        lang('MarkAsReadHotkey'),
        icon: 'readchats',
        handler: () => {
          toggleChatUnread({ id: chat.id });
          track(JUNE_TRACK_EVENTS.MARK_CHAT_READ, { source: 'Chat Context Menu' });
        },
      }
      : undefined;

    const actionMarkAsUnread = !(chat.unreadCount || chat.hasUnreadMark) && !chat.isForum
      ? {
        title: lang('MarkAsUnreadHotkey'),
        icon: 'unread',
        handler: () => {
          toggleChatUnread({ id: chat.id });
          track(JUNE_TRACK_EVENTS.MARK_CHAT_UNREAD, { source: 'Chat Context Menu' });
        },
      }
      : undefined;

    const actionDone = isChatDone(chat)
      ? {
        title: lang('MarkNotDone'),
        icon: 'select',
        handler: () => {
          doneChat({ id: chat.id, value: false });
          track(JUNE_TRACK_EVENTS.MARK_CHAT_NOT_DONE, { source: 'Chat Context Menu' });
        },
      }
      : {
        title: lang('MarkDone'),
        icon: 'select',
        handler: () => {
          doneChat({ id: chat.id, value: true });
          track(JUNE_TRACK_EVENTS.MARK_CHAT_DONE, { source: 'Chat Context Menu' });
        },
      };

    const actionArchive = isChatArchived(chat)
      ? {
        title: lang('Unarchive'),
        icon: 'unarchive',
        handler: () => {
          archiveChat({
            id: chat.id,
            value: false,
          });
        },
      }
      : {
        title: lang('Archive'),
        icon: 'archive',
        handler: () => {
          archiveChat({
            id: chat.id,
            value: true,
          });
        },
      };

    const canReport = handleReport && (isChatChannel(chat) || isChatGroup(chat) || (user && !user.isSelf));
    const actionReport = canReport
      ? { title: lang('ReportPeer.Report'), icon: 'flag', handler: handleReport }
      : undefined;

    const isInFolder = folderId !== undefined;

    return compact([
      ...[] || actionNotifyMe, // disable snooze
      !isSelf && !isServiceNotifications && !isInFolder && actionDone,
      actionMaskAsRead,
      actionMarkAsUnread,
      !isInbox && !isSelf && !isServiceNotifications && !isInFolder && actionArchive,
      !isSelf && actionMute,
      !isInbox && actionPin,
      actionOpenInNewTab,
      actionAddToFolder,
      actionReport,
      !isInbox && actionDelete,
    ]) as MenuItemContextAction[];
  }, [
    chat, user, canChangeFolder, lang, handleChatFolderChange, isPinned, isInSearch, isMuted, currentUserId,
    handleDelete, handleMute, handleReport, folderId, isSelf, isServiceNotifications, isSavedDialog, deleteTitle,
    isInbox, isChatDone, doneChat, archiveChat, snooze, track,
  ]);
};

export default useChatContextActions;
