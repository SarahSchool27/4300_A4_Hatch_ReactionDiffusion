import { default as gulls } from 'https://cbcdn.githack.com/charlieroberts/gulls/raw/branch/main/gulls.js'
import { default as Video    } from './gulls/video.js'
import { default as Mouse    } from './gulls/mouse.js'

import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';


  async function run() {
  // start seagulls, by default it will use the first <canvas> element it
  // finds in your HTML page
  const sg = await gulls.init()

  // a simple vertex shader to make a quad
  const quadVertexShader = gulls.constants.vertex


  // our fragment shader
  //const fragmentShader =  await gulls.import('./shaders/header.wgsl') + await gulls.import( './shaders/default.wgsl' ) //doesn't work do to caching problems

  const fragmentShader = 
    `
    @group(0) @binding(0) var<uniform> res : vec2f;
    @group(0) @binding(1) var<uniform> frame : f32;
    @group(0) @binding(2) var backSampler: sampler;
    @group(0) @binding(3) var backBuffer: texture_2d<f32>;
    @group(0) @binding(4) var<uniform> mouse : vec3f;

    //user uniforms

    
    //Shader itself!!!!
    @fragment
    fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
      let p = pos.xy/res;
      var color = vec3f(0.);

      return vec4(color,1.0);
    } 

  `

  // our vertex + fragment shader together
  const shader = quadVertexShader + fragmentShader



  //get data for uniforms
  /*const slider = document.querySelector('#slider')*/



  //control scheme (USER Uniforms) ------------
  const PARAMS = {
    example: 10,
  };


  const pane = new Pane();

  //tweakplane uniforms
  let u_tp_sl_example = sg.uniform(PARAMS.example)

  //tweakplane bindings
  pane.addBinding(PARAMS, 'example',  {min:0, max:50})  
  .on('change', (ev) => {
    
    //console.log(ev.value.toFixed(2));
     u_tp_sl_rippleDens.value = ev.value.toFixed(2);
    //tell if last input 
    /*if (ev.last) {
      console.log('(last)');
    }*/
  });



  //end control scheme (USER Uniforms) ------------
  

  // ---- create System Uniforms--------
  let u_frame = sg.uniform(0)
  

  // set initial mouse values
  // Mouse.values[0] = x coordinate (between 0-1)
  // Mouse.values[1] = y coorcinate (between 0-1)
  // Mouse.values[2] = left mouse button (either 0 or 1)
  Mouse.init()
  const u_mouse = sg.uniform( Mouse.values )
  

  //Back buffer 
  const back = new Float32Array( gulls.width * gulls.height * 4 ) //four floats per pixel (rgba)
  const t_feedback = sg.texture( back ) 
  

  // create a render pass
  const renderPass = await sg.render({ 
    shader,
    // add a data array to specify uniforms / buffers / textures etc.
    data:[
      sg.uniform([ window.innerWidth, window.innerHeight ]),
      u_frame,
      sg.sampler(),
      t_feedback,
      u_mouse,

      //user uniforms
      
    ],
    //functions
    copy: t_feedback, //every frame copy frame to t_feedback

    onframe() {u_frame.value++;  u_mouse.value = Mouse.values}, //update frame count, update mouse pos
    //onframe() { u_mouse.value = Mouse.values } 

  })


  // html sliders value returns a string, so we'll convert it to a
  // floating point number with parseFloat()
  //slider.oninput = ()=> u_slider.value = parseFloat( slider.value )

  // run our render pass
  sg.run( renderPass )
}




run()