import { Disease, Service } from '../types';
export const services: Service[] = [
  { id: 'diagnosis', title: 'AI-анализ', description: 'Фото и симптомы', icon: 'scan-outline', color: '#DDF3E8' },
  { id: 'plants', title: 'Мои растения', description: 'Карточки и уход', icon: 'leaf-outline', color: '#E5F0FF' },
  { id: 'history', title: 'История', description: 'Наблюдения во времени', icon: 'calendar-outline', color: '#FFF0D6' },
  { id: 'compare', title: 'Сравнение фото', description: 'До и после', icon: 'images-outline', color: '#F2E9FF' },
  { id: 'advice', title: 'Рекомендации', description: 'Уход за растением', icon: 'bulb-outline', color: '#FFF7CE', route: 'Details' },
  { id: 'reminders', title: 'Напоминания', description: 'Полив и подкормка', icon: 'notifications-outline', color: '#FFE6E6', route: 'Details' },
  { id: 'map', title: 'Геолокация', description: 'Место наблюдения', icon: 'location-outline', color: '#DFF5F4', route: 'Details' },
  { id: 'catalog', title: 'Каталог болезней', description: 'Симптомы и меры', icon: 'library-outline', color: '#EDEBFF' }
  ,{ id: 'chat', title: 'AI-чат', description: 'Вопросы и помощь по разделам', icon: 'chatbubble-ellipses-outline', color: '#DDF3E8' }
];
export const diseases: Disease[] = [
  { id: 'late-blight', name: 'Фитофтороз', category: 'Грибковое', symptoms: 'Бурые пятна на листьях и плодах.', advice: 'Удалите поражённые части, уменьшите влажность и обратитесь к агроному.', color: '#FCE4E2', icon: 'bacteria-outline' },
  { id: 'powdery', name: 'Мучнистая роса', category: 'Грибковое', symptoms: 'Белый мучнистый налёт на листьях.', advice: 'Улучшите проветривание, не переувлажняйте листья.', color: '#F6F0DD', icon: 'leaf' },
  { id: 'chlorosis', name: 'Хлороз', category: 'Дефицит питания', symptoms: 'Пожелтение листа при зелёных прожилках.', advice: 'Проверьте pH почвы и состав подкормки.', color: '#FFF4B8', icon: 'leaf-circle-outline' },
  { id: 'aphids', name: 'Тля', category: 'Вредители', symptoms: 'Мелкие насекомые, липкие листья.', advice: 'Изолируйте растение, осмотрите нижнюю сторону листьев.', color: '#E9E4FA', icon: 'bug-outline' },
  { id: 'root-rot', name: 'Корневая гниль', category: 'Грибковое', symptoms: 'Вялые листья и потемнение корней.', advice: 'Сократите полив, проверьте дренаж и корни.', color: '#E1F0EA', icon: 'sprout-outline' },
  { id: 'sunburn', name: 'Солнечный ожог', category: 'Условия среды', symptoms: 'Светлые сухие пятна на освещённой стороне.', advice: 'Притените растение и адаптируйте его к свету постепенно.', color: '#FFE7CC', icon: 'weather-sunny' }
];
