/* Every theme the app knows, in the order the tabs show them. A new theme (films, say) is one more file in this folder,
   registered here: the screen makes the tabs and the buttons from this list, and the rules never look at it. */
import type { Pack } from '../teams';
import { futebol } from './futebol';
import { blueLock } from './blue-lock';
import { naruto } from './naruto';
import { dragonBall } from './dragon-ball';
import { avatar } from './avatar';
import { cavaleiros } from './cavaleiros';
import { streetFighter } from './street-fighter';
import { mortalKombat } from './mortal-kombat';
import { defJam } from './def-jam';
import { nintendo } from './nintendo';
import { sonic } from './sonic';
import { piratas } from './piratas';
import { senhorAneis } from './senhor-aneis';
import { got } from './got';
import { mitologiaGrega } from './mitologia-grega';
import { mitologiaEgipcia } from './mitologia-egipcia';

export const PACKS: Pack[] = [futebol, blueLock, naruto, dragonBall, avatar, cavaleiros, streetFighter, mortalKombat, defJam, nintendo, sonic, piratas, senhorAneis, got, mitologiaGrega, mitologiaEgipcia];
export { TEAMS_CHECKED } from './futebol';
