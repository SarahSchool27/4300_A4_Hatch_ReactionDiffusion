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
/*
for (let y = Math.floor(window.innerHeight/2) - 1; y < Math.floor(window.innerHeight/2) + 1; y++){
     for (let x = Math.floor(window.innerWidth/4) - startSeed; x< Math.floor(window.innerWidth/4) + startSeed; x++){
        let array_pos = (y * window.innerWidth + x)
        stateB[(array_pos)] = 1;        
     }
}*/


//rand init buffer values //looks like fungus on sides of screen
/*
for( let i = 0; i < size; i+=2 ) { //traversing two first one is A and second is B
  stateA[ i ] = Math.random(1);   //why is the last half row blank?
  stateB [i] =  Math.random(1); 
} 
*/

//set up actual buffers
const statebufferA1 = sg.buffer( stateA )
const statebufferA2 = sg.buffer( stateA )

const statebufferB1 = sg.buffer( stateB )
const statebufferB2 = sg.buffer( stateB )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])


//Set up tweakpane


  //control scheme (USER Uniforms) ------------
  const PARAMS = {
    Diffuse_A : 1.0,
    Diffuse_B : 0.5,
    feed : 0.055,
    kill_rate : 0.062,
    
    display_mode: 0.0,
    radial_scale: 0.5,
    pause: false,

  };


  const pane = new Pane();

  //tweakplane uniforms
  let RD_vars_storage = [PARAMS.Diffuse_A, PARAMS.Diffuse_B, PARAMS.feed, PARAMS.kill_rate];
  let u_tp_RD_vars = sg.uniform(RD_vars_storage);
  
  let u_tp_isPaused = sg.uniform(0.0);
  let u_tp_display_mode = sg.uniform(0.0);
  let u_tp_radial_scale = sg.uniform(2.0);


  //tweakplane bindings
  pane.addBinding(PARAMS, 'Diffuse_A',  {min:0.1, max:1.5})  
  .on('change', (ev) => {
    RD_vars_storage[0] = ev.value.toFixed(2);
    u_tp_RD_vars.value = RD_vars_storage;
  });
  pane.addBinding(PARAMS, 'Diffuse_B',  {min:0.1, max:1.5})  
  .on('change', (ev) => {
      RD_vars_storage[1] = ev.value.toFixed(2);
      u_tp_RD_vars.value = RD_vars_storage;
  });
  const bind_feed = pane.addBinding(PARAMS, 'feed',  {min:0.03, max:0.08, disabled: false})  
  .on('change', (ev) => {
    RD_vars_storage[2] = ev.value.toFixed(2);
    u_tp_RD_vars.value = RD_vars_storage;
  });
  const bind_kill_rate = pane.addBinding(PARAMS, 'kill_rate',  {min:0.055, max:0.064, disabled: false})  
  .on('change', (ev) => {
    RD_vars_storage[3] = ev.value.toFixed(2);
    u_tp_RD_vars.value = RD_vars_storage;
  });


  pane.addBinding(PARAMS,'display_mode', {
    options:{
        default : 0.0,
        kill_feed_gradient : 1.0,
        radial : 2.0,
    },
    })
    .on('change', (ev) => {
     u_tp_display_mode.value = PARAMS.display_mode;
    

     if(0.0== PARAMS.display_mode){
       bind_feed.disabled= false;
       bind_kill_rate.disabled = false;
     } else{
        bind_feed.disabled = true;
        bind_kill_rate.disabled = true;
     }

     if(2.0 == PARAMS.display_mode){
        bind_radial_scale.disabled = false;
     }else{
        bind_radial_scale.disabled = true;
     }


  });


  const bind_radial_scale = pane.addBinding(PARAMS, 'radial_scale',  {min:0.1, max:2, disabled: true})  
  .on('change', (ev) => {
    u_tp_radial_scale.value = ev.value.toFixed(2);
  });

  const btn = pane.addButton({
        title: 'Reset_Parameters',
   
    });

  btn.on('click', () => {
        PARAMS.Diffuse_A = 1.0;
        PARAMS.Diffuse_B = 0.5;
        PARAMS.feed = 0.055;
        PARAMS.kill_rate = 0.062;
        pane.refresh();
        console.log( PARAMS.Diffuse_A);
    });


  pane.addBinding(PARAMS, "pause") 
  .on('change', (ev) => {
    if(PARAMS.pause== true){
        u_tp_isPaused.value = 1.0;
    }else{
        u_tp_isPaused.value = 0.0;
    }
   
    console.log(u_tp_isPaused.value);
  });



//render passes
const renderPass = await sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( statebufferA1, statebufferA2 ),
    sg.pingpong( statebufferB1, statebufferB2 ),
    u_tp_isPaused,
    
  ]
})

const computePass = sg.compute({
  shader: compute,
  data: [ res,
    sg.pingpong( statebufferA1, statebufferA2 ),
    sg.pingpong( statebufferB1, statebufferB2 ),
    u_tp_RD_vars,
    u_tp_isPaused,
    u_tp_display_mode, 
    u_tp_radial_scale,
],
  dispatchCount:  [Math.floor(gulls.width / 8), Math.floor(gulls.height/8), 1],
  times: 8,
})

sg.run(computePass, renderPass );
