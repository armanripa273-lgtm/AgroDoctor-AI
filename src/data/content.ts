import { Disease, Service } from '../types';
export const services: Service[] = [
  { id: 'diagnosis', title: 'AI-анализ', description: 'Фото листьев и симптомы', icon: 'scan-outline', color: '#FBE7DE', accent: '#BD5636' },
  { id: 'plants', title: 'Мои растения', description: 'Карточки и уход', icon: 'leaf-outline', color: '#CDEDDC', accent: '#236044' },
  { id: 'history', title: 'История', description: 'Полевой дневник', icon: 'calendar-outline', color: '#FFF2CE', accent: '#986B11' },
  { id: 'compare', title: 'Сравнение', description: 'Фото до и после', icon: 'images-outline', color: '#DFF1F5', accent: '#287889' },
  { id: 'advice', title: 'Рекомендации', description: 'План ухода', icon: 'bulb-outline', color: '#F8ECD0', accent: '#986B11', route: 'Details' },
  { id: 'reminders', title: 'Напоминания', description: 'Полив и подкормка', icon: 'notifications-outline', color: '#EFE4F6', accent: '#795C93', route: 'Details' },
  { id: 'map', title: 'Геолокация', description: 'Место наблюдения', icon: 'location-outline', color: '#DFF4EF', accent: '#287889', route: 'Details' },
  { id: 'catalog', title: 'Каталог болезней', description: 'Признаки и меры', icon: 'library-outline', color: '#DDEFE2', accent: '#236044' },
  { id: 'chat', title: 'AI-чат агронома', description: 'Спросите об уходе и наблюдениях', icon: 'chatbubble-ellipses-outline', color: '#F9E2E9', accent: '#A53B5A' }
];
export const diseases: Disease[] = [
  { id: 'late-blight', name: 'Фитофтороз', category: 'Грибковое', symptoms: 'Бурые пятна на листьях и плодах.', advice: 'Удалите поражённые части, уменьшите влажность и обратитесь к агроному.', color: '#FBE2D9', accent: '#D95D40', icon: 'bacteria-outline' },
  { id: 'powdery', name: 'Мучнистая роса', category: 'Грибковое', symptoms: 'Белый мучнистый налёт на листьях.', advice: 'Улучшите проветривание, не переувлажняйте листья.', color: '#E7F0D4', accent: '#59883A', icon: 'leaf' },
  { id: 'chlorosis', name: 'Хлороз', category: 'Дефицит питания', symptoms: 'Пожелтение листа при зелёных прожилках.', advice: 'Проверьте pH почвы и состав подкормки.', color: '#FFF1BC', accent: '#A77D0E', icon: 'leaf-circle-outline' },
  { id: 'aphids', name: 'Тля', category: 'Вредители', symptoms: 'Мелкие насекомые, липкие листья.', advice: 'Изолируйте растение, осмотрите нижнюю сторону листьев.', color: '#EEE5F2', accent: '#795C93', icon: 'bug-outline' },
  { id: 'root-rot', name: 'Корневая гниль', category: 'Грибковое', symptoms: 'Вялые листья и потемнение корней.', advice: 'Сократите полив, проверьте дренаж и корни.', color: '#DDF0F0', accent: '#347B85', icon: 'sprout-outline' },
  { id: 'sunburn', name: 'Солнечный ожог', category: 'Условия среды', symptoms: 'Светлые сухие пятна на освещённой стороне.', advice: 'Притените растение и адаптируйте его к свету постепенно.', color: '#F4E7C1', accent: '#9A7011', icon: 'weather-sunny' }
];
