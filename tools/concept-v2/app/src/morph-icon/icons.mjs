import {svgToIcon} from 'morphicons/adapters';
import link02Svg from '../../public/figma/project-corvo/action-link.svg?raw';
import checkSvg from '../../public/figma/project-corvo/action-check.svg?raw';

// Parse exact Figma exports once. svgToIcon normalizes their 16 and 24 grids
// onto the shared morphing grid without replacing the stroked geometry.
export const link02Icon=svgToIcon(link02Svg);
export const checkIcon=svgToIcon(checkSvg);
