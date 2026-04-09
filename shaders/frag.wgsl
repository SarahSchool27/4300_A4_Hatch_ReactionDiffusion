@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> stateA: array<f32>;

@group(0) @binding(3) var<storage> stateB: array<f32>;



@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
        //casting to u32 is important to remove float math errors
    let idx : u32 = (u32(pos.y) * u32(res.x) + u32(pos.x)); 
        

    let a = stateA[ idx ];
    let b = stateB[ idx ];

    var color = vec3f(floor(a-b));
    //color = vec3f(b);

    return vec4f(color, 1.);
}
