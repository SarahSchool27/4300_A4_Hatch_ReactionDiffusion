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
    @group(0) @binding(5) var<uniform> slider_rippleDens : f32;
    @group(0) @binding(6) var<uniform> user_color : vec3f;
    @group(0) @binding(7) var<uniform> do_backgroundWave_large : f32;
    @group(0) @binding(8) var<uniform> do_backgroundWave_small : f32;
    @group(0) @binding(9) var<uniform> grid_mode : f32;
    @group(0) @binding(10) var<uniform> main_dens : f32;
    @group(0) @binding(11) var<uniform> main_height : f32;

    // NOTE THAT THERE IS A DIFFERENT GROUP NUMBER FOR THE
    // VIDEO TEXTURE BELOW. This lets gulls easily rebind
    // the texture for each frame, without having to rebind
    // the other variables in group 0. Given the new group,
    // the binding index resets to 0.
    @group(1) @binding(0) var videoBuffer:    texture_external;
    
    //Shader itself!!!!
    @fragment
    fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
      let p = pos.xy/res;
      var color = vec3f(0.);

      //line
  		var line_p1 = p;
      line_p1.y -= .5;
      line_p1.y += 0.1*sin(1*line_p1.x + frame/100);
      var line_1 = pow(abs(.0025/line_p1.y ),3.);
	  	color += 1 - line_1;
      

      //line2
  		var line_p2 = p;
      line_p2.y -= .5;
      var height_modifier =  0.5* cos(frame/200) * main_height;
      line_p2.y += height_modifier*sin(main_dens*line_p2.x + frame/100) + (line_p1.y*2);
      var line_2 = pow(abs(.0025/line_p2.y ),3.);
	  	color -= vec3(line_2);

      var line_p3 =p;
      line_p3.y -= .5;
      line_p3.y +=  1.2*height_modifier*sin(main_dens*line_p2.x + frame/100) + (line_p1.y*2);
      var line_3 = pow(abs(.0025/line_p3.y ),3.);
	  	color -= vec3(line_3);

      
      let mask_line1 = vec3(step(0., line_p1.y));
      let mask_line2 = vec3(step(0., line_p2.y));

      let top_mask = min(1- mask_line1, mask_line2);
      let bottom_mask = min(mask_line1, 1- mask_line2);
      let combined_mask = max(top_mask, bottom_mask);
      let node_mask = min(line_1 ,line_2);
      


      //make noise for video
      var st =p;
      st += noise(st*20)*sin(frame/1000);

      let large_noise_mask = smoothstep( 0.01, 0.5, noise(((p+line_p1*do_backgroundWave_large)+frame/8000)*5));
      let small_noise_mask = smoothstep(0.01,0.5,noise((st +line_p1*do_backgroundWave_small)*10));
      let noise_mask =  vec3(clamp(3 * min(large_noise_mask, small_noise_mask),0,1));

      //get video
      let video_mask = max(combined_mask, noise_mask);
      let video = textureSampleBaseClampToEdge( videoBuffer, backSampler, p);
      
      color -= video_mask;
      color = max( video_mask * video.rgb * user_color, color);


      let horizantal_mask = step(0.5, p.y);

      if (grid_mode == 0 ){ //default
        color -= 1 - vec3(rippleGrid(p, slider_rippleDens, 10, false));
      } else if(grid_mode == 1){ //mirrored
        color -= 1 - (vec3(rippleGrid(p, slider_rippleDens, 10, false))*(horizantal_mask)
        + vec3(rippleGrid(p, slider_rippleDens, 10, true))*(1-horizantal_mask));
      } else if(grid_mode == 2){//top_only
        color -= 1 - (vec3(1.0)*(horizantal_mask)
        + vec3(rippleGrid(p, slider_rippleDens, 10, true))*(1-horizantal_mask));
      
      } else if(grid_mode == 3){ //bottom only
        color -= 1 - (vec3(rippleGrid(p, slider_rippleDens, 10, false))*(horizantal_mask)
        + vec3(1)*(1-horizantal_mask));
      }else if(grid_mode == 4){//overlap
        color -= 1 - vec3(rippleGrid(p, slider_rippleDens, 10, false));
        color -= 1 - vec3(rippleGrid(p, slider_rippleDens, 10, true));
      }
      

      color += vec3(node_mask);

      //color = vec3(horizantal_mask);

      


      return vec4(color,1.0);

    } 

    fn rippleGrid(p : vec2f, ripple_dens : f32, ripple_height : f32, doOffset : bool) -> vec3f{
      let PI = 3.14159;

      //grid code
      var mod_p = p;

      if(doOffset == true){ 
        mod_p.y += sin(mod_p.x*ripple_dens +PI)/ripple_height;
      }else if (doOffset == false){
        mod_p.y += sin(mod_p.x*ripple_dens)/ripple_height;
      }
      mod_p.x += frame/1000;
      var grid_pos = grid(mod_p, 20.0, 40.0); //multiplication for grid
      var color : vec3f = vec3f(0.0);
      color = abs(floor(grid_pos.y) % 2) * vec3(0.5,0.5,0.5); //has to be abs or flip results on the negative
      //p.x += 0.1 * floor(grid_pos.y) % 2;

      grid_pos = fract(grid_pos); //actually make grid
      
      //mod_p = p.xy * 0.5 + 0.5*p.xy/res; //weird results


      grid_pos += sin(PI*mod_p.y);
      let circles   = distance( grid_pos, vec2(.5) );
      let threshold = smoothstep( .25,.275, circles );

      

      color += vec3f(threshold);

      color = clamp(color, vec3(0.0), vec3(1.0));
      
      return color;
    
    }


    fn grid(p : vec2f, rows : f32, cols : f32) -> vec2f{
      var grid_pos: vec2f = vec2(p.x * cols, p.y * rows);
      return grid_pos;

    }


        
    //0 indexed
    fn isGridCoord(p : vec2f, query_row: f32, query_col: f32, rows : f32, cols : f32,)-> f32{
        var grid_pos: vec2f = vec2(p.x * cols, p.y * rows);


        //row, col
        if( floor(grid_pos.y) == query_row && floor(grid_pos.x) == query_col){
          return 1.0;
        } else {
        return 0.0;
        }
    }


    // Gradient Noise by Inigo Quilez - iq/2013
    // https://www.shadertoy.com/view/XdXGW8
    fn noise( st : vec2f) -> f32{
        let  i: vec2f = floor(st);
        let  f : vec2f= fract(st);

        let  u : vec2f = f*f*(3.0-2.0*f);

        return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                        dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                    mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                        dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
    }

    fn random2(st : vec2f) -> vec2f{
      var p = st;
      p = vec2( dot(p,vec2(127.1,311.7)),
                dot(p,vec2(269.5,183.3)) );
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }

  `

  // our vertex + fragment shader together
  const shader = quadVertexShader + fragmentShader



  //get data for uniforms
  /*const slider = document.querySelector('#slider')*/



  //control scheme (USER Uniforms) ------------
  const PARAMS = {
    rippleDens: 10,
    grid_mode: 0.0,
    
    main_dens : 5.0,
    main_height : 1.0,
    
    tint_color: {r: 0.29, g: 0.39, b: 0.27},
    do_backgroundWave_large : true,
    do_backgroundWave_small :true,
    do_invert_background_movement : false

  };


  const pane = new Pane();

  //tweakplane uniforms
  let u_tp_sl_rippleDens = sg.uniform(PARAMS.rippleDens)
  let u_tp_v3_color = sg.uniform(Object.values(PARAMS.tint_color))
  let u_do_backgroundWave_large = sg.uniform(PARAMS.do_backgroundWave_large);
  let u_do_backgroundWave_small = sg.uniform(PARAMS.do_backgroundWave_small);
  let u_grid_mode = sg.uniform(PARAMS.grid_mode);
  let u_mainDens = sg.uniform(PARAMS.main_dens);
  let u_main_height = sg.uniform(PARAMS.main_height);

  //tweakplane bindings
  pane.addBinding(PARAMS, 'rippleDens',  {min:0, max:50})  
  .on('change', (ev) => {
    
    //console.log(ev.value.toFixed(2));
     u_tp_sl_rippleDens.value = ev.value.toFixed(2);
    //tell if last input 
    /*if (ev.last) {
      console.log('(last)');
    }*/
  });

  pane.addBinding(PARAMS,'grid_mode', {
    options:{
        default : 0.0,
        mirrored : 1.0,
        top_only : 2.0,
        bottom_only : 3.0,
        overlap : 4.0,
        off: 5.0
    },
    })
    .on('change', (ev) => {
     u_grid_mode.value = PARAMS.grid_mode;
     //console.log(Object.values(PARAMS.tint_color));
  });

  pane.addBinding(PARAMS, 'main_dens',  {min:1, max:12})  
  .on('change', (ev) => {
    
    //console.log(ev.value.toFixed(2));
     u_mainDens.value = ev.value.toFixed(2);
    //tell if last input 
    /*if (ev.last) {
      console.log('(last)');
    }*/
  });


  pane.addBinding(PARAMS, 'main_height',  {min:-3, max:3})  
  .on('change', (ev) => {
    
    //console.log(ev.value.toFixed(2));
     u_main_height.value = ev.value.toFixed(2);
    //tell if last input 
    /*if (ev.last) {
      console.log('(last)');
    }*/
  });
  
  pane.addBinding(PARAMS, 'tint_color', {color: {type: 'float'}})
   .on('change', (ev) => {
     u_tp_v3_color.value = Object.values(PARAMS.tint_color);
     //console.log(Object.values(PARAMS.tint_color));
  });

  pane.addBinding(PARAMS, 'do_backgroundWave_large')
    .on('change', (ev)=> {
      if(PARAMS.do_backgroundWave_large == true){
        u_do_backgroundWave_large.value =  1.0;
      }else{
        u_do_backgroundWave_large.value =  0.0;
      }
    });
  

  pane.addBinding(PARAMS, 'do_backgroundWave_small')
    .on('change', (ev)=> {
      if(PARAMS.do_backgroundWave_small == true){
        u_do_backgroundWave_small.value =  1.0;
      }else{
        u_do_backgroundWave_small.value =  0.0;
      }
      

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
  
  //video
  await Video.init()


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
      u_tp_sl_rippleDens,
      u_tp_v3_color,
      u_do_backgroundWave_large,
      u_do_backgroundWave_small,
      u_grid_mode,
      u_mainDens,
      u_main_height,


      sg.video( Video.element )
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