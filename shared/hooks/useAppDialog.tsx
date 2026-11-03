// ─────────────────────────────────────────────
//  shared/hooks/useAppDialog.tsx
//  Hook con API compatible con `Alert.alert(title, message, buttons)`
//  pero que funciona igual en Web y en Móvil.
//
//  Uso:
//    const { alert, DialogUI } = useAppDialog();
//    alert('Eliminar', '¿Estás seguro?', [
//      { text: 'Cancelar', style: 'cancel' },
//      { text: 'Eliminar', style: 'destructive', onPress: () => doDelete() },
//    ]);
//    // ...
//    return (<View>{DialogUI}...</View>);
// ─────────────────────────────────────────────
import { useCallback, useState } from 'react';
import AppDialog, { AppDialogButton } from '@/shared/components/ui/AppDialog';

interface DialogState {
  title: string;
  message?: string;
  buttons: AppDialogButton[];
  dismissible: boolean;
}

export function useAppDialog() {
  const [state, setState] = useState<DialogState | null>(null);

  const hide = useCallback(() => setState(null), []);

  const alert = useCallback((title: string, message?: string, buttons?: AppDialogButton[], options?: { dismissible?: boolean }) => {
    setState({ title, message, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }], dismissible: options?.dismissible !== false });
  }, []);

  const handlePressButton = useCallback((button: AppDialogButton) => {
    hide();
    // El modal se cierra primero y luego se ejecuta la acción (navegación,
    // eliminar, etc.) para evitar parpadeos y para que funcione igual
    // en Web y Móvil.
    if (button.onPress) setTimeout(button.onPress, 0);
  }, [hide]);

  const DialogUI = state ? (
    <AppDialog
      visible
      title={state.title}
      message={state.message}
      buttons={state.buttons}
      onRequestClose={state.dismissible ? hide : () => {}}
      dismissible={state.dismissible}
      onPressButton={handlePressButton}
    />
  ) : null;

  return { alert, DialogUI };
}
