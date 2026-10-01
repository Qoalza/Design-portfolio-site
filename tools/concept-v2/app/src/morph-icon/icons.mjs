import {svgToIcon} from 'morphicons/adapters';
import link02Svg from '../../public/figma/project-corvo/action-link.svg?raw';
import checkSvg from '../../public/figma/project-corvo/action-check.svg?raw';

// Parse exact Figma exports once. svgToIcon normalizes their 16 and 24 grids
// onto the shared morphing grid without replacing the stroked geometry.
export const link02Icon=svgToIcon(link02Svg);
export const checkIcon=svgToIcon(checkSvg);

// Link-02 has three source subpaths. Split the same Figma check centerline into
// three touching subpaths so each piece has one destination instead of making
// Morphicons duplicate the complete check during a 3 → 1 transition.
export const checkMorphIcon='M4 12L9 17M9 17L14.5 11.5M14.5 11.5L20 6';
