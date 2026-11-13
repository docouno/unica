precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Mixed base
 * @color
 * @default #6750dfff
 */
uniform vec4 u_base;
/**
 * @label Mixed high
 * @color
 * @default #6750dfff
 */
uniform vec4 u_high;
/**
 * @label Mixed low
 * @color
 * @default #6750dfff
 */
uniform vec4 u_low;
/**
 * @label Stripe ink
 * @color
 * @default #6750dfff
 */
uniform vec4 u_stripe;
/**
 * @label Lower profile ink
 * @color
 * @default #6750df33
 */
uniform vec4 u_profile;
/**
 * @label Far ink
 * @color
 * @default #6750df38
 */
uniform vec4 u_far;
/**
 * @label Lamp
 * @default 0
 */
uniform float u_lamp;
/**
 * @label Unknown
 * @default 0
 */
uniform float u_unknown;
/**
 * @label Logical RTL
 * @default 0
 */
uniform float u_rtl;
/**
 * @label Value (percent)
 * @default 42
 * @min 0
 * @max 100
 */
uniform float u_value;
/**
 * @label Track thickness
 * @default 8
 */
uniform float u_thickness;
/**
 * @label Halo length in thicknesses
 * @default 10
 */
uniform float u_halo_span;
/**
 * @label Layer (0 near, 1 lower profile, 2 material, 3 far)
 * @default 2
 */
uniform float u_layer;
/**
 * @label Cap radius
 * @default 999
 */
uniform float u_radius;

// This fill runs on a full-width, three-thickness carrier. It samples no
// framebuffer or backing. The track and text remain ordinary pen nodes.
// Colors and material equations are inherited from progress-material.glsl;
// the original halo control points are inherited from progress-halo.js.

float roundBoxDistance(vec2 point, vec2 halfSize, float radius) {
    vec2 q = abs(point) - halfSize + vec2(radius);
    return length(max(q, vec2(0.0)))
        + min(max(q.x, q.y), 0.0) - radius;
}

float barMask(vec2 point, float width, float top, float height) {
    if (width <= 0.0) return 0.0;
    vec2 halfSize = vec2(width, height) * 0.5;
    float radius = min(max(u_radius, 0.0), min(halfSize.x, halfSize.y));
    float distance = roundBoxDistance(
        point - vec2(halfSize.x, top + halfSize.y), halfSize, radius
    );
    return 1.0 - smoothstep(-0.5, 0.5, distance);
}

vec2 cubicPoint(vec2 a, vec2 b, vec2 c, vec2 d, float t) {
    float s = 1.0 - t;
    return s*s*s*a + 3.0*s*s*t*b + 3.0*s*t*t*c + t*t*t*d;
}

void dropEdge(
    vec2 point, vec2 a, vec2 b, inout float best, inout float inside
) {
    vec2 segment = b - a;
    float along = clamp(
        dot(point - a, segment) / max(dot(segment, segment), 0.000001),
        0.0, 1.0
    );
    best = min(best, length(point - a - along * segment));
    if ((a.y > point.y) != (b.y > point.y)) {
        float crossingX = a.x + (point.y - a.y) * segment.x / segment.y;
        if (point.x < crossingX) inside = 1.0 - inside;
    }
}

void dropCubic(
    vec2 point, vec2 scale, vec2 a, vec2 b, vec2 c, vec2 d,
    inout float best, inout float inside
) {
    vec2 previous = a * scale;
    for (int i = 1; i <= 16; i++) {
        vec2 next = cubicPoint(a, b, c, d, float(i) / 16.0) * scale;
        dropEdge(point, previous, next, best, inside);
        previous = next;
    }
}

float dropMask(vec2 point, vec2 size) {
    float best = 100000.0;
    float inside = 0.0;
    vec2 scale = size / 100.0;
    // The six original cubic segments, not a replacement ellipse or triangle.
    dropCubic(point, scale, vec2(0.0,50.0), vec2(18.0,50.0),
        vec2(24.0,40.0), vec2(44.0,24.0), best, inside);
    dropCubic(point, scale, vec2(44.0,24.0), vec2(68.0,7.0),
        vec2(83.0,4.0), vec2(92.0,9.0), best, inside);
    dropCubic(point, scale, vec2(92.0,9.0), vec2(98.0,10.0),
        vec2(100.0,27.0), vec2(100.0,50.0), best, inside);
    dropCubic(point, scale, vec2(100.0,50.0), vec2(100.0,73.0),
        vec2(98.0,90.0), vec2(92.0,91.0), best, inside);
    dropCubic(point, scale, vec2(92.0,91.0), vec2(83.0,96.0),
        vec2(68.0,93.0), vec2(44.0,76.0), best, inside);
    dropCubic(point, scale, vec2(44.0,76.0), vec2(24.0,60.0),
        vec2(18.0,50.0), vec2(0.0,50.0), best, inside);
    float distance = inside > 0.5 ? -best : best;
    return 1.0 - smoothstep(-0.5, 0.5, distance);
}

void main() {
    vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
    float thickness = max(u_thickness, 0.000001);
    float extent = u_unknown > 0.5
        ? u_resolution.x
        : u_resolution.x * clamp(u_value / 100.0, 0.0, 1.0);
    if (extent <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    float top = (u_resolution.y - thickness) * 0.5;
    float physicalStart = u_rtl > 0.5 ? u_resolution.x - extent : 0.0;
    vec2 materialPoint = vec2(p.x - physicalStart, p.y - top);

    if (u_layer < 0.5 || u_layer > 2.5) {
        if (u_lamp < 0.5 || u_unknown > 0.5) {
            gl_FragColor = vec4(0.0);
            return;
        }
        float haloLength = min(extent, u_halo_span * thickness);
        float haloHeight = min(3.0 * thickness, 0.3 * haloLength);
        float logicalX = u_rtl > 0.5 ? u_resolution.x - p.x : p.x;
        vec2 dropPoint = vec2(
            logicalX - (extent - haloLength),
            p.y - (u_resolution.y - haloHeight) * 0.5
        );
        if (dropPoint.x < -1.0 || dropPoint.x > haloLength + 1.0
            || dropPoint.y < -1.0 || dropPoint.y > haloHeight + 1.0) {
            gl_FragColor = vec4(0.0);
            return;
        }
        float ramp = clamp(dropPoint.x / max(haloLength, 0.000001), 0.0, 1.0);
        // progress-halo.js rounds its 45% near ink once to alpha 0x73.
        float alpha = (115.0 / 255.0) * ramp
            * dropMask(dropPoint, vec2(haloLength, haloHeight));
        if (u_layer > 2.5) {
            alpha *= u_far.a;
            gl_FragColor = vec4(u_far.rgb * alpha, alpha);
        } else {
            gl_FragColor = vec4(u_base.rgb * alpha, alpha);
        }
        return;
    }

    if (u_layer < 1.5) {
        if (u_lamp < 0.5 || u_unknown > 0.5) {
            gl_FragColor = vec4(0.0);
            return;
        }
        float alpha = u_profile.a * barMask(
            vec2(p.x - physicalStart, p.y), extent,
            top + thickness / 8.0, thickness
        );
        gl_FragColor = vec4(u_profile.rgb * alpha, alpha);
        return;
    }

    // Retain physical broad illumination and stripe coordinates. Only the cap
    // and measured extent follow the logical writing direction.
    float logicalMaterialX = u_rtl > 0.5
        ? extent - materialPoint.x : materialPoint.x;
    vec4 color = u_base;
    if (u_lamp > 0.5 && u_unknown < 0.5) {
        float distance = length(
            (materialPoint - vec2(extent * 0.2, 0.0))
            / vec2(extent, thickness * 1.7)
        );
        color = distance < 0.55
            ? mix(u_high, u_base, clamp(distance / 0.55, 0.0, 1.0))
            : mix(u_base, u_low, clamp((distance - 0.55) / 0.45, 0.0, 1.0));
        float capSpan = min(extent, 4.0 * thickness);
        float cap = clamp(
            1.0 - (extent - logicalMaterialX) / capSpan, 0.0, 1.0
        ) * u_high.a;
        color = vec4(mix(color.rgb, u_high.rgb, cap), 1.0);
    }
    if (u_unknown > 0.5) {
        float phase = mod(
            (materialPoint.x + materialPoint.y) / 1.4142135623730951, 20.0
        );
        float stripe = step(10.0, phase) * u_stripe.a;
        color = vec4(mix(color.rgb, u_stripe.rgb, stripe), 1.0);
    }
    float alpha = color.a * barMask(
        vec2(p.x - physicalStart, p.y), extent, top, thickness
    );
    gl_FragColor = vec4(color.rgb * alpha, alpha);
}
