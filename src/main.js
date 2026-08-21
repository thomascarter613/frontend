import { render } from './controller/context.js';
import { bindPointerKeyboardEvents } from './controller/pointer-keyboard.js';
import { bindUiEvents } from './controller/ui-events.js';

bindUiEvents();
bindPointerKeyboardEvents();
render();
