import { bindRouteHistory, render } from './controller/context.js';
import { bindPointerKeyboardEvents } from './controller/pointer-keyboard.js';
import { bindUiEvents } from './controller/ui-events.js';

bindRouteHistory();
bindUiEvents();
bindPointerKeyboardEvents();
render();
