@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> state: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
        //casting to u32 is important to remove float math errors
    let idx : u32 =  2* (u32(pos.y) * u32(res.x) + u32(pos.x)); 
        

    let a = state[ idx ];
    let b = state[idx+1];

    let color = vec3f(clamp(floor(a-b),0,1));

    return vec4f(color, 1.);
}
