/* Every theme the app knows, in the order the tabs show them. A new theme (films, say) is one more file in this folder,
   registered here: the screen makes the tabs and the buttons from this list, and the rules never look at it. */
import type { Pack } from '../teams';
import { futebol } from './futebol';
import { blueLock } from './blue-lock';
import { naruto } from './naruto';
import { dragonBall } from './dragon-ball';
import { streetFighter } from './street-fighter';
import { mortalKombat } from './mortal-kombat';

export const PACKS: Pack[] = [futebol, blueLock, naruto, dragonBall, streetFighter, mortalKombat];
export { TEAMS_CHECKED } from './futebol';
