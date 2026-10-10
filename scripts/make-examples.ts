import {emptyProject} from '../src/model';
import {encode} from '../src/files';
import fs from 'node:fs/promises';
await fs.mkdir('examples',{recursive:true});
for(const name of ['TCP-study.canvasnote','Study-plan.canvasnote','Presentation.canvasnote'])await fs.rm('examples/'+name,{force:true});
await fs.writeFile('examples/Blank.canvasnote',await encode(emptyProject()));
console.log('Blank canvas file written');
