import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PlantReminder } from '../types';
import { saveReminder } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function createLocalReminder(input: Omit<PlantReminder, 'id' | 'notificationId' | 'active'>) {
  const id = `reminder-${Date.now()}`;
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Разреши уведомления AgroDoctor AI в настройках телефона.');

  let channelId: string | undefined;
  if (Platform.OS === 'android') {
    channelId = 'plant-care';
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Напоминания о растениях',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const trigger: Notifications.NotificationTriggerInput = input.repeatDaily
    ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: new Date(input.scheduledAt).getHours(), minute: new Date(input.scheduledAt).getMinutes(), ...(channelId ? { channelId } : {}) }
    : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(input.scheduledAt), ...(channelId ? { channelId } : {}) };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, data: { reminderId: id, plantId: input.plantId }, sound: 'default', ...(channelId ? { channelId } : {}) },
    trigger,
  });
  const reminder: PlantReminder = { ...input, id, notificationId, active: true };
  await saveReminder(reminder);
  return reminder;
}

export async function cancelLocalReminder(reminder: PlantReminder) {
  await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
}
