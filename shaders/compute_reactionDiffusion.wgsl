@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> stateinA: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateoutA: array<f32>;
@group(0) @binding(3) var<storage> stateinB: array<f32>;
@group(0) @binding(4) var<storage, read_write> stateoutB: array<f32>;

fn index( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return u32( (y % _res.y) * _res.x + ( x % _res.x ) );
}


fn laplacianKernel(center:vec3i, isModeB: bool) -> f32{
  
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
  let cell = vec3i(_cell);

  //params
  let DA = 1.0;
  let DB = 0.5;
  let f = 0.055;
  let k = 0.062;

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
            + (DB * b_lap )
            + (A * B*B)
            - ((k+f)*B)
            ), 0,1);
  
  stateoutA[index(cell.x, cell.y)] = newA;
  stateoutB[index(cell.x, cell.y)] = newB; 

}
