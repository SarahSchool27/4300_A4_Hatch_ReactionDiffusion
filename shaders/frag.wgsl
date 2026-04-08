@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> state: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
    let idx : u32 = u32( 2*(pos.y * res.x + pos.x)); //why minus one?


    let v = state[ idx ];
    let b = state[idx+1];

    var c = 0.0;
    if(pos.x < 4 && pos.x >2){
        c = 1.0;
    }

    return vec4f(v,0.0,c, 1.);
}
