import { useCallback, useEffect } from '../lib/teact/teact';
import { getGlobal } from '../global';

import { selectCurrentChat } from '../global/selectors';
import { IS_MAC_OS } from '../util/windowEnvironment';
import { useJune } from './useJune';
import useSnooze from './useSnooze';

function useShortcutCmdH() {
  const { snooze } = useSnooze();
  const { track } = useJune();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const global = getGlobal();
    const currentChatId = selectCurrentChat(global)?.id;
    if (((IS_MAC_OS && e.metaKey) || (!IS_MAC_OS && e.ctrlKey)) && e.code === 'KeyH') {
      e.preventDefault();
      if (currentChatId) {
        snooze({ chatId: currentChatId });
        track?.('Snooze chat', { source: 'Shortcut' });
      }
    }
  }, [snooze, track]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useShortcutCmdH;
