import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faHome,
  faPlane,
  faHeart,
  faChartBar,
  faUser,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faArrowLeft,
  faArrowRight,
  faMapMarkerAlt,
  faCalendar,
  faDollarSign,
  faBox,
  faCheck,
  faTimes,
  faSearch,
  faSort,
  faLandmark,
  faUtensils,
  faHotel,
  faCar,
  faSun,
  faMountain,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faHome,
  faPlane,
  faHeart,
  faChartBar,
  faUser,
  faPlus,
  faEdit,
  faTrash,
  faSave,
  faArrowLeft,
  faArrowRight,
  faMapMarkerAlt,
  faCalendar,
  faDollarSign,
  faBox,
  faCheck,
  faTimes,
  faSearch,
  faSort,
  faLandmark,
  faUtensils,
  faHotel,
  faCar,
  faSun,
  faMountain,
  faBriefcase
);

import './styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#app');
