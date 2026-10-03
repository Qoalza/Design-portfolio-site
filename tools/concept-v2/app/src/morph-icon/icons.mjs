import {svgToIcon} from 'morphicons/adapters';
import link02Svg from '../../public/figma/project-corvo/action-link.svg?raw';
import checkSvg from '../../public/figma/project-corvo/action-check.svg?raw';
import figmaSvg from '../../public/figma/project-figma.svg?raw';
import componentSvg from '../../public/figma/project-corvo/metric-component.svg?raw';
import stackSvg from '../../public/figma/project-corvo/metric-stak.svg?raw';
import metricIconSvg from '../../public/figma/project-corvo/metric-icon.svg?raw';

// Parse exact Figma exports once. svgToIcon normalizes their 16 and 24 grids
// onto the shared morphing grid without replacing the stroked geometry.
export const link02Icon=svgToIcon(link02Svg);
export const checkIcon=svgToIcon(checkSvg);
// The Figma export retains its parent rotation as an SVG transform. Morphicons
// only accepts centreline geometry, so this is the same 24px Medium arrow with
// that transform baked into its authored top-right orientation.
export const arrowAngleTopRightIcon='M5 19L19 5M9 5H19V15';
export const figmaIcon=svgToIcon(figmaSvg);
export const componentIcon=svgToIcon(componentSvg);
export const stackIcon=svgToIcon(stackSvg);
export const metricIcon=svgToIcon(metricIconSvg);

// Link-02 has three source subpaths. Split the same Figma check centerline into
// three touching subpaths so each piece has one destination instead of making
// Morphicons duplicate the complete check during a 3 → 1 transition.
export const checkMorphIcon='M4 12L9 17M9 17L14.5 11.5M14.5 11.5L20 6';
