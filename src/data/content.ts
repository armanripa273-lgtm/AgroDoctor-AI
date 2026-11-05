import { Disease, Service } from '../types';
export const services: Service[] = [
  { id: 'diagnosis', title: 'AI-анализ', description: 'Фото и симптомы', icon: 'scan-outline', color: '#FBE2D9', accent: '#D95D40' },
  { id: 'plants', title: 'Мои растения', description: 'Карточки и уход', icon: 'leaf-outline', color: '#E7F0D4', accent: '#59883A' },
  { id: 'history', title: 'История', description: 'Наблюдения во времени', icon: 'calendar-outline', color: '#FFF1BC', accent: '#A77D0E' },
  { id: 'compare', title: 'Сравнение фото', description: 'До и после', icon: 'images-outline', color: '#DDF0F0', accent: '#347B85' },
  { id: 'advice', title: 'Рекомендации', description: 'Уход за растением', icon: 'bulb-outline', color: '#F4E7C1', accent: '#9A7011', route: 'Details' },
  { id: 'reminders', title: 'Напоминания', description: 'Полив и подкормка', icon: 'notifications-outline', color: '#EEE5F2', accent: '#795C93', route: 'Details' },
  { id: 'map', title: 'Геолокация', description: 'Место наблюдения', icon: 'location-outline', color: '#DDF0F0', accent: '#347B85', route: 'Details' },
  { id: 'catalog', title: 'Каталог болезней', description: 'Симптомы и меры', icon: 'library-outline', color: '#E7F0D4', accent: '#59883A' },
  { id: 'chat', title: 'AI-чат', description: 'Вопросы и помощь по разделам', icon: 'chatbubble-ellipses-outline', color: '#FBE2D9', accent: '#D95D40' }
];
export const diseases: Disease[] = [
  { id: 'late-blight', name: 'Фитофтороз', category: 'Грибковое', symptoms: 'Бурые пятна на листьях и плодах.', advice: 'Удалите поражённые части, уменьшите влажность и обратитесь к агроному.', color: '#FBE2D9', accent: '#D95D40', icon: 'bacteria-outline' },
  { id: 'powdery', name: 'Мучнистая роса', category: 'Грибковое', symptoms: 'Белый мучнистый налёт на листьях.', advice: 'Улучшите проветривание, не переувлажняйте листья.', color: '#E7F0D4', accent: '#59883A', icon: 'leaf' },
  { id: 'chlorosis', name: 'Хлороз', category: 'Дефицит питания', symptoms: 'Пожелтение листа при зелёных прожилках.', advice: 'Проверьте pH почвы и состав подкормки.', color: '#FFF1BC', accent: '#A77D0E', icon: 'leaf-circle-outline' },
  { id: 'aphids', name: 'Тля', category: 'Вредители', symptoms: 'Мелкие насекомые, липкие листья.', advice: 'Изолируйте растение, осмотрите нижнюю сторону листьев.', color: '#EEE5F2', accent: '#795C93', icon: 'bug-outline' },
  { id: 'root-rot', name: 'Корневая гниль', category: 'Грибковое', symptoms: 'Вялые листья и потемнение корней.', advice: 'Сократите полив, проверьте дренаж и корни.', color: '#DDF0F0', accent: '#347B85', icon: 'sprout-outline' },
  { id: 'sunburn', name: 'Солнечный ожог', category: 'Условия среды', symptoms: 'Светлые сухие пятна на освещённой стороне.', advice: 'Притените растение и адаптируйте его к свету постепенно.', color: '#F4E7C1', accent: '#9A7011', icon: 'weather-sunny' }
];
