// Utilidad para mejorar interacciones en web sin tocar estilos.
// Aporta onClick y manejo de teclado (Enter/Espacio) además de onPress.
import { Platform } from 'react-native';

export function pressProps(onPress) {
  const handler = typeof onPress === 'function' ? onPress : () => {};
  if (Platform.OS === 'web') {
    return {
      onPress: handler,
      onClick: handler,
      role: 'button',
      tabIndex: 0,
      onKeyDown: (e) => {
        if (e && (e.key === 'Enter' || e.key === ' ')) handler();
      },
    };
  }
  return { onPress: handler };
}

