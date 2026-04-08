import { default as gulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
import { default as Video    } from './gulls/video.js'
import { default as Mouse    } from './gulls/mouse.js'

import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
        

const sg      = await gulls.init(),
      frag    = await gulls.import( './shaders/frag.wgsl' ),
      compute = await gulls.import( 'shaders/compute_reactionDiffusion.wgsl'),
      render  = gulls.constants.vertex + frag,
      
      //set up buffer sizes
      size    = (2*window.innerWidth * window.innerHeight),//the two is for the two values chemical A and B
      state   = new Float32Array( size )


//init buffer values
for( let i = 0; i < size; i+=2 ) { //traversing two first one is A and second is B
  state[ i ] = 1;   //why is the last half row blank?
  state [i+1] = 0; 
} 

console.log(state[0]+", " + state[1]+", " + state[2]+ ", " + state[3])


//set intial b's

let startSeed =5;

for (let y = Math.floor(window.innerHeight/2) - startSeed; y < Math.floor(window.innerHeight/2) + startSeed; y++){
    for (let x = Math.floor(window.innerWidth/2) - startSeed; x< Math.floor(window.innerWidth/2) + startSeed; x++){
        let array_pos = (y * window.innerWidth + x)
        state[(2*array_pos)+1] = 1;

        
    }
}


//set up actual buffers
const statebuffer1 = sg.buffer( state )
const statebuffer2 = sg.buffer( state )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])

//debug
console.log("res: "+ [window.innerWidth, window.innerHeight]);
console.log("size: " + size)

const renderPass = await sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( statebuffer1, statebuffer2 )
  ]
})

const computePass = sg.compute({
  shader: compute,
  data: [ res, sg.pingpong( statebuffer1, statebuffer2 ) ],
  dispatchCount:  [Math.floor(gulls.width / 8), Math.floor(gulls.height/8), 1],
})

sg.run(computePass, renderPass )