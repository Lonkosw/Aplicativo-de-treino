import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

let configurado = false;

/**
 * O timer de descanso continua valendo com o app em segundo plano, então
 * não basta um `setTimeout`: agendamos uma notificação local no sistema.
 * Isso não existe na web — lá seria uma Notification API sem agendamento
 * confiável.
 */
export async function prepararNotificacoes() {
  if (configurado) return;
  configurado = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('descanso', {
      name: 'Timer de descanso',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
      enableVibrate: true,
    });
  }

  const permissao = await Notifications.getPermissionsAsync();
  if (!permissao.granted && permissao.canAskAgain) {
    await Notifications.requestPermissionsAsync();
  }
}

export async function agendarFimDoDescanso(segundos: number, nomeExercicio: string) {
  if (segundos <= 0) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Descanso concluído',
        body: nomeExercicio ? `Próxima série: ${nomeExercicio}` : 'Hora da próxima série',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(segundos)),
        channelId: 'descanso',
      },
    });
  } catch {
    // Notificação é conveniência: se o usuário negou a permissão, o timer
    // na tela continua funcionando normalmente.
    return null;
  }
}

export async function cancelarNotificacao(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* já disparou ou foi removida */
  }
}

export function vibrarFimDoDescanso() {
  Vibration.vibrate([0, 400, 200, 400]);
}

export function toqueLeve() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function toqueSucesso() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
