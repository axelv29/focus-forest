export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionState
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  try {
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  } catch {
    return getNotificationPermission()
  }
}

export function sendNotification(title: string, body: string): boolean {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false
  }
  if (Notification.permission !== 'granted') {
    return false
  }
  try {
    new Notification(title, { body })
    return true
  } catch {
    return false
  }
}