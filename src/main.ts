// Entry point: wires the listeners, exposes the test handle, paints the screen and registers the service worker.
import './styles.css';
import { Core } from './core';
import { initEvents } from './app/events';
import { render } from './app/render';
import { S, ui } from './app/state';
import { initUpdates } from './app/update';

initEvents();
window.__APP = { Core, ui, get S() { return S; } };
render();
initUpdates();
