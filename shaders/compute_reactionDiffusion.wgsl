@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> stateinA: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateoutA: array<f32>;
@group(0) @binding(3) var<storage> stateinB: array<f32>;
@group(0) @binding(4) var<storage, read_write> stateoutB: array<f32>;

/*RD_vars = [Diffuse_A, Diffuse_B, feed, kill_rate]*/
@group(0) @binding(5) var<uniform> RD_vars : vec4f;

@group(0) @binding(6) var<uniform> isPaused : f32;

@group(0) @binding(7) var<uniform> display_mode : f32;

@group(0) @binding(8) var<uniform> radial_scale : f32;


fn index( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return u32( (y % _res.y) * _res.x + ( x % _res.x ) );
}


fn laplacianKernel(center:vec3i, isModeB:bool) -> f32{
  
  let lapacian = array<f32, 9>(
    0.05, 0.2, 0.05,
    0.2, -1, 0.2,
    0.05, 0.2, 0.05
  );

  if(!isModeB){

    let sum = lapacian[0] * stateinA[ index(center.x-1, center.y - 1)] +
                        lapacian[1] *stateinA[ index(center.x, center.y - 1)] +
                        lapacian[2] *stateinA[ index(center.x + 1, center.y - 1) ] +

                        lapacian[3] *stateinA[ index(center.x-1, center.y)  ] +
                        lapacian[4] *stateinA[ index(center.x, center.y) ] +
                        lapacian[5] *stateinA[ index(center.x +1, center.y) ] +

                        lapacian[6] *stateinA[ index(center.x - 1, center.y + 1)] +
                        lapacian[7] *stateinA[ index(center.x, center.y + 1 )] +
                        lapacian[8] *stateinA[ index(center.x + 1, center.y + 1)];

    return f32(sum);

  } else{

    let sum = lapacian[0] * stateinB[ index(center.x-1, center.y - 1)] +
                        lapacian[1] *stateinB[ index(center.x, center.y - 1)] +
                        lapacian[2] *stateinB[ index(center.x + 1, center.y - 1) ] +

                        lapacian[3] *stateinB[ index(center.x-1, center.y)  ] +
                        lapacian[4] *stateinB[ index(center.x, center.y) ] +
                        lapacian[5] *stateinB[ index(center.x +1, center.y) ] +

                        lapacian[6] *stateinB[ index(center.x - 1, center.y + 1)] +
                        lapacian[7] *stateinB[ index(center.x, center.y + 1 )] +
                        lapacian[8] *stateinB[ index(center.x + 1, center.y + 1)];


    return f32(sum);


  }
}


@compute
@workgroup_size(8,8)
fn cs( @builtin(global_invocation_id) _cell:vec3u ) {

  //if edge value no change
  if(!(_cell.x == 0 || _cell.x == u32(res.x)
  || _cell.y == 0 || _cell.y == u32(res.y))){

    if(isPaused == 0.0){
      let cell = vec3i(_cell);

      //params
      let DA = RD_vars[0];
      let DB = RD_vars[1];
      var f = RD_vars[2];
      var k = RD_vars[3];

      //if in style map mode
      // kill rate varies along the x axis (from .045 to .07)
      //feed rate varies along the y axis (from .01 to .1)
      if(display_mode == 1.0){
        let uv = vec2f( f32(cell.x) /res.x, f32(cell.y)/ res.y);
        k = uv.x * 0.035 + 0.045;
        f = uv.y * 0.09 + 0.01;

      }else if(display_mode == 2.0){//radial
        let uv = vec2f( f32(cell.x) /res.x, f32(cell.y)/ res.y);
        let midpoint = vec2f(0.5,0.5);

        let distance = length(midpoint - uv);

        k = distance * radial_scale * 0.035 + 0.045;
        f = distance * radial_scale * 0.09 + 0.01;

      }


      let A = stateinA[index(cell.x, cell.y)];
      let B = stateinB[index(cell.x, cell.y)];
      
      let a_lap = laplacianKernel(cell, false);
      let b_lap = laplacianKernel(cell, true);

      let newA =clamp(
                (A 
                + (DA * a_lap) 
                - (A * B*B) 
                + (f*(1-A))
                ), 0,1);

      let newB =clamp(
                (B 
                + (DB * b_lap)
                + (A * B*B)
                - ((k+f)*B)
                ), 0,1);
      
      stateoutA[index(cell.x, cell.y)] = newA;
      stateoutB[index(cell.x, cell.y)] = newB; 
    }
  }
}
