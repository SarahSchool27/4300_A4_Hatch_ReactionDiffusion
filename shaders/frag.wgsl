@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> stateA: array<f32>;

@group(0) @binding(3) var<storage> stateB: array<f32>;

@group(0) @binding(5) var<uniform> isPaused: f32;



@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
        //casting to u32 is important to remove float math errors
    let idx : u32 = (u32(pos.y) * u32(res.x) + u32(pos.x)); 
        

    let a = stateA[ idx ];
    let b = stateB[ idx ];

    var color = vec3f((a-b));
    //color = vec3f(b);

    return vec4f(color, 1.);
    
}


/*
fn lighting(pos: vec4f)-> vec3f {


    let lapacian = array<f32, 9>(
    0.05, 0.2, 0.05,
    0.2, -1, 0.2,
    0.05, 0.2, 0.05
  );

  if(true){

    let sum = lapacian[0] * stateinA[ index(center.x-1, center.y - 1)] +
                        lapacian[1] *stateinA[ index(center.x, center.y - 1)] +
                        lapacian[2] *stateinA[ index(center.x + 1, center.y - 1) ] +

                        lapacian[3] *stateinA[ index(center.x-1, center.y)  ] +
                        lapacian[4] *stateinA[ index(center.x, center.y) ] +
                        lapacian[5] *stateinA[ index(center.x +1, center.y) ] +

                        lapacian[6] *stateinA[ index(center.x - 1, center.y + 1)] +
                        lapacian[7] *stateinA[ index(center.x, center.y + 1 )] +
                        lapacian[8] *stateinA[ index(center.x + 1, center.y + 1)];
    }

    return vec3f(1);
}
*/