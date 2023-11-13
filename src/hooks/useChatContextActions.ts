import { useMemo } from '../lib/teact/teact';
import { getActions } from '../global';

import type { ApiChat, ApiUser } from '../api/types';
import type { MenuItemContextAction } from '../components/ui/ListItem';

import { SERVICE_NOTIFICATIONS_USER_ID } from '../config';
import {
  getCanDeleteChat, isChatArchived, isChatChannel, isChatGroup,
  isUserId,
} from '../global/helpers';
import { compact } from '../util/iteratees';
import { IS_ELECTRON, IS_OPEN_IN_NEW_TAB_SUPPORTED } from '../util/windowEnvironment';
import useArchiver from './useArchiver';
import useLang from './useLang';
import useSnooze from './useSnooze';

const useChatContextActions = ({
  chat,
  user,
  folderId,
  isPinned,
  isMuted,
  canChangeFolder,
  handleDelete,
  handleMute,
  handleChatFolderChange,
  handleReport,
}: {
  chat: ApiChat | undefined;
  user: ApiUser | undefined;
  folderId?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  canChangeFolder?: boolean;
  handleDelete?: NoneToVoidFunction;
  handleMute?: NoneToVoidFunction;
  handleChatFolderChange: NoneToVoidFunction;
  handleReport?: NoneToVoidFunction;
}, isInSearch = false) => {
  const lang = useLang();

  const { isSelf } = user || {};
  const isServiceNotifications = user?.id === SERVICE_NOTIFICATIONS_USER_ID;

  const { archiveChat } = useArchiver({ isManual: true });
  const { snooze } = useSnooze();

  return useMemo(() => {
    if (!chat) {
      return undefined;
    }

    const {
      toggleChatPinned,
      updateChatMutedState,
      toggleChatUnread,
      openChatInNewTab,
    } = getActions();

    const actionNotifyMe = {
      title: lang('NotifyMeHotkey'),
      icon: 'schedule',
      handler: () => {
        snooze({ chatId: chat.id });
      },
    };

    const actionOpenInNewTab = IS_OPEN_IN_NEW_TAB_SUPPORTED && {
      title: IS_ELECTRON ? 'Open in new window' : 'Open in new tab',
      icon: 'open-in-new-tab',
      handler: () => {
        openChatInNewTab({ chatId: chat.id });
      },
    };

    const actionAddToFolder = canChangeFolder ? {
      title: lang('ChatList.Filter.AddToFolder'),
      icon: 'folder',
      handler: handleChatFolderChange,
    } : undefined;

    const actionPin = isPinned
      ? {
        title: lang('UnpinFromTop'),
        icon: 'unpin',
        handler: () => toggleChatPinned({ id: chat.id, folderId: folderId! }),
      }
      : { title: lang('PinToTop'), icon: 'pin', handler: () => toggleChatPinned({ id: chat.id, folderId: folderId! }) };

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
      ? { title: lang('MarkAsRead'), icon: 'readchats', handler: () => toggleChatUnread({ id: chat.id }) }
      : undefined;
    const actionMarkAsUnread = !(chat.unreadCount || chat.hasUnreadMark) && !chat.isForum
      ? { title: lang('MarkAsUnread'), icon: 'unread', handler: () => toggleChatUnread({ id: chat.id }) }
      : undefined;

    const actionArchive = isChatArchived(chat)
      ? {
        title: lang('MarkNotDone'),
        icon: 'unarchive',
        handler: () => {
          archiveChat({ id: chat.id, value: false });
        },
      }
      : {
        title: lang('MarkDone'),
        icon: 'archive',
        handler: () => {
          archiveChat({ id: chat.id, value: true });
        },
      };

    const canReport = handleReport && (isChatChannel(chat) || isChatGroup(chat) || (user && !user.isSelf));
    const actionReport = canReport
      ? { title: lang('ReportPeer.Report'), icon: 'flag', handler: handleReport }
      : undefined;

    const actionDelete = {
      title: isUserId(chat.id)
        ? lang('Delete')
        : lang(getCanDeleteChat(chat)
          ? 'DeleteChat'
          : (isChatChannel(chat) ? 'LeaveChannel' : 'Group.LeaveGroup')),
      icon: 'delete',
      destructive: true,
      handler: handleDelete,
    };

    const isInFolder = folderId !== undefined;

    return compact([
      actionNotifyMe,
      !isSelf && !isServiceNotifications && !isInFolder && actionArchive,
      actionMaskAsRead,
      actionMarkAsUnread,
      !isSelf && actionMute,
      actionPin,
      actionAddToFolder,
      actionReport,
      actionDelete,
    ]) as MenuItemContextAction[];
  }, [
    chat, user, canChangeFolder, lang, handleChatFolderChange, isPinned, isInSearch, isMuted,
    handleDelete, handleMute, handleReport, folderId, isSelf, isServiceNotifications, archiveChat, snooze,
  ]);
};

export default useChatContextActions;
