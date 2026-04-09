import { default as gulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
import { default as Video    } from './gulls/video.js'
import { default as Mouse    } from './gulls/mouse.js'

import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
        

const sg      = await gulls.init(), 
            //gulls.init(false) will NOT resize the canvas, need to resize canvas manually externally
      frag    = await gulls.import( './shaders/frag.wgsl' ),
      compute = await gulls.import( 'shaders/compute_reactionDiffusion.wgsl'),
      render  = gulls.constants.vertex + frag,
      
      //set up buffer sizes
      size    = (window.innerWidth * window.innerHeight),//the two is for the two values chemical A and B
      stateA   = new Float32Array( size ),
      stateB   = new Float32Array( size )


//init buffer values
for( let i = 0; i < size; i++ ) { //traversing two first one is A and second is B
  stateA[ i ] = 1;  
  stateB [i] = 0; 
} 

//seed initial B values
let startSeed =10;

for (let y = Math.floor(window.innerHeight/2) - startSeed; y < Math.floor(window.innerHeight/2) + startSeed; y++){
    for (let x = Math.floor(window.innerWidth/2) - startSeed; x< Math.floor(window.innerWidth/2) + startSeed; x++){
        let array_pos = (y * window.innerWidth + x)
        stateB[(array_pos)] = 1;        
    }
}

//second shape of B
for (let y = Math.floor(window.innerHeight/2) - 1; y < Math.floor(window.innerHeight/2) + 1; y++){
     for (let x = Math.floor(window.innerWidth/4) - startSeed; x< Math.floor(window.innerWidth/4) + startSeed; x++){
        let array_pos = (y * window.innerWidth + x)
        stateB[(array_pos)] = 1;        
     }
}

/*
//rand init buffer values
for( let i = 0; i < size; i+=2 ) { //traversing two first one is A and second is B
  stateA[ i ] = Math.random(1);   //why is the last half row blank?
  stateB [i] =  Math.random(1); 
} */

//set up actual buffers
const statebufferA1 = sg.buffer( stateA )
const statebufferA2 = sg.buffer( stateA )

const statebufferB1 = sg.buffer( stateB )
const statebufferB2 = sg.buffer( stateB )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])

//debug
//console.log("res: "+ [window.innerWidth, window.innerHeight]);
//console.log("size: " + size)

const renderPass = await sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( statebufferA1, statebufferA2 ),
    sg.pingpong( statebufferB1, statebufferB2 )
  ]
})

const computePass = sg.compute({
  shader: compute,
  data: [ res,
    sg.pingpong( statebufferA1, statebufferA2 ),
    sg.pingpong( statebufferB1, statebufferB2 ) ],
  dispatchCount:  [Math.floor(gulls.width / 8), Math.floor(gulls.height/8), 1],
})

sg.run(computePass, renderPass )