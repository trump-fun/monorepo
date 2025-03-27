import { toast } from 'sonner';

/**
 * Display a success toast notification
 * @param title The title of the toast
 * @param description Optional description for the toast
 */
export const showSuccessToast = (title: string, description?: string) => {
  toast.success(title, {
    icon: '🎉',
    description,
    duration: 3000,
  });
};

/**
 * Display a Trump-style success toast notification for bets
 * @param title The title of the toast (will be partially converted to uppercase)
 * @param description Optional description for the toast
 */
export const showBetSuccessToast = (title: string, description?: string) => {
  // Convert some words to ALL CAPS in Trump style
  const trumpStyle = title
    .replace(/successful/gi, 'SUCCESSFUL')
    .replace(/bet/gi, 'BET')
    .replace(/placed/gi, 'PLACED')
    .replace(/win/gi, 'WIN')
    .replace(/big/gi, 'BIG');

  console.log('SHOWING BET SUCCESS TOAST:', trumpStyle);

  // Use a custom class that properly handles both light and dark mode
  toast(trumpStyle, {
    icon: '💰',
    description,
    duration: 5000,
    position: 'bottom-right',
    className: 'dark-mode-toast',
  });
};

/**
 * Display an error toast notification
 * @param title The title of the toast
 * @param description Optional description for the toast
 */
export const showErrorToast = (title: string, description?: string) => {
  toast.error(title, {
    description,
    duration: 5000,
  });
};

/**
 * Display an info toast notification
 * @param title The title of the toast
 * @param description Optional description for the toast
 */
export const showInfoToast = (title: string, description?: string) => {
  toast.info(title, {
    description,
    duration: 5000,
  });
};
