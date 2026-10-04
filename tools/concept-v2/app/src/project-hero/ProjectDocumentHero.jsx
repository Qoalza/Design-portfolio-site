import {ProjectResponsiveHero} from './ProjectResponsiveHero';
import {ProjectRasterHero} from './ProjectRasterHero';
import {layoutHeroDefinition} from './layout-document-adapter.mjs';
import {rasterHeroDefinition,rasterHeroRevision} from './raster-document-adapter.mjs';

export function ProjectDocumentHero({project}){
 const hero=project.redesign.hero;
 if(hero.kind==='layout')return <ProjectResponsiveHero key={JSON.stringify(hero)} definition={layoutHeroDefinition(project)}/>;
 if(hero.kind==='raster')return <ProjectRasterHero key={rasterHeroRevision(project)} definition={rasterHeroDefinition(project)}/>;
 throw new Error('Expected a validated project Hero document.');
}
