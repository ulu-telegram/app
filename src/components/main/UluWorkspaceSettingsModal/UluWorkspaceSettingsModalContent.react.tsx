import React, {
  useCallback, useEffect,
} from 'react';
import { getActions } from '../../../global';

import captureEscKeyListener from '../../../util/captureEscKeyListener';

import WorkspaceCreator from './WorkspaceCreator.react';

import styles from './UluWorkspaceSettingsModalContent.module.scss';

export type OwnProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
};

const UluWorkspaceSettingsModalContent: React.FC<OwnProps> = ({ isOpen, onClose, workspaceId }) => {
  const {
    showNotification,
  } = getActions();

  const close = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const onWorkspaceUpdate = useCallback(() => {
    close();
    showNotification({ message: 'Workspace updated successfully.' });
  }, [close, showNotification]);

  const onWorkspaceCreate = useCallback(() => {
    close();
    showNotification({ message: 'Workspace created successfully.' });
  }, [close, showNotification]);

  const onWorkspaceDelete = useCallback(() => {
    showNotification({ message: 'Workspace deleted successfully.' });
    close();
  }, [close, showNotification]);

  useEffect(() => {
    // Если окно видимо, подписываемся на событие нажатия клавиши Esc
    return isOpen ? captureEscKeyListener(close) : undefined;
  }, [close, isOpen]);

  return (
    <div
      className={styles.wrapper}
    >
      <span className={styles.goBack}>
        <div className={styles.iconWrapper}>
          <i className={`${styles.icon} icon icon-arrow-left`} onClick={close} />
        </div>
      </span>
      { isOpen && (
        <WorkspaceCreator
          className={styles.workspaceCreator}
          workspaceId={workspaceId}
          onCreate={onWorkspaceCreate}
          onDelete={onWorkspaceDelete}
          onUpdate={onWorkspaceUpdate}
        />
      ) }
    </div>
  );
};

export default UluWorkspaceSettingsModalContent;
