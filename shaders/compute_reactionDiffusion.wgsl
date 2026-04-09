@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> statein: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateout: array<f32>;

fn index( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return 2* u32( (y % _res.y) * _res.x + ( x % _res.x ) );
}

fn indexB( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return (2*u32((y % _res.y) * _res.x + ( x % _res.x ) )) + 1;
}

fn laplacianKernel(center:vec3i, isModeB: bool) -> u32{
  
  let lapacian = array<f32, 9>(
    0.05, 0.2, 0.05,
    0.2, -1, 0.2,
    0.05, 0.2, 0.05
  );

  let modifierForB = u32(isModeB);
  
  let sum = lapacian[0] * statein[ index(center.x - 1, center.y - 1)               + modifierForB] +
                        lapacian[1] *statein[ index(center.x - 1, center.y)        + modifierForB] +
                        lapacian[2] *statein[ index(center.x - 1, center.y + 1)    + modifierForB] +

                        lapacian[3] *statein[ index(center.x, center.y - 1)        + modifierForB] +
                        lapacian[4] *statein[ index(center.x, center.y)            + modifierForB] +
                        lapacian[4] *statein[ index(center.x, center.y + 1)        + modifierForB] +

                        lapacian[5] *statein[ index(center.x + 1, center.y - 1)    + modifierForB] +
                        lapacian[6] *statein[ index(center.x + 1, center.y)        + modifierForB] +
                        lapacian[7] *statein[ index(center.x + 1, center.y + 1)    + modifierForB];

  return u32(sum);
}


@compute
@workgroup_size(8,8)
fn cs( @builtin(global_invocation_id) _cell:vec3u ) {
  let cell = vec3i(_cell);

  //params
  let DA = 1.0;
  let DB = 0.5;
  let f = 0.055;
  let k = 0.0; //0.062;

  let A = statein[index(cell.x, cell.y)];
  let B = statein[indexB(cell.x, cell.y)];
   
  let a_lap = f32(laplacianKernel(cell, false));
  let b_lap = f32(laplacianKernel(cell, true));

  let newA = A + DA * a_lap- A * B*B - f*(1-A);
  let newB = B + DB * b_lap + A * B*B - ((k+f)*B);
  
  stateout[index(cell.x, cell.y)] = newA;
  stateout[indexB(cell.x, cell.y)] = newB; 

}
