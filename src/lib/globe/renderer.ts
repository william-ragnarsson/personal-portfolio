// The clay globe, ray-traced in a fragment shader.
//
// There is one WebGL2 context for the whole page, drawing into a canvas that
// never enters the document. Each globe on the page is a 2D canvas that copies
// the globe out of it and draws its own routes and pins on top. One context
// means one copy of the 8 MB land texture, and no juggling of the browser's
// cap on live contexts.
//
// The land is a 4096x2048 greyscale mask (public/globe/land.png, baked by
// scripts/bake-land.mjs). The coastline is the mask thresholded at 0.5; the
// soft relief is the gradient of a blurred mip level, so land looks pressed
// out of the sea like clay.

import { sunDir, type Camera } from "./math";

const BLUE: [number, number, number] = [0 / 255, 84 / 255, 162 / 255];
const YELLOW: [number, number, number] = [255 / 255, 197 / 255, 118 / 255];
const LAND_SRC = "/globe/land.png";

const VERT = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes,uShift,uTs;
uniform vec3 uC,uF,uR,uU,uSun,uOc,uLd;
uniform float uTan,uUnit,uBump,uShad,uFlat;
uniform sampler2D uTex;
out vec4 o;
const float PI=3.14159265;
void main(){
  vec2 q=(gl_FragCoord.xy-.5*uRes)/uUnit-uShift;
  vec3 rd=normalize(uF+(uR*q.x+uU*q.y)*uTan);
  float b=dot(uC,rd),c2=dot(uC,uC),h=b*b-c2+1.,dist=sqrt(max(c2-b*b,0.)),t=-b-sqrt(max(h,0.));
  vec3 p=normalize(uC+rd*max(t,0.));
  float pw=uTan/uUnit*max(-b,.05);
  float cov=b<0.?clamp((1.-dist)/pw+.5,0.,1.):0.;
  float lat=asin(clamp(p.y,-1.,1.)),lon=atan(p.x,p.z);
  vec2 st=vec2(lon/(2.*PI)+.5,.5-lat/PI),dx=dFdx(st),dy=dFdy(st);
  // Longitude wraps at the antimeridian; take the derivative that doesn't.
  float u2=fract(st.x+.5)-.5;
  vec2 dx2=vec2(dFdx(u2),dx.y),dy2=vec2(dFdy(u2),dy.y);
  if(abs(dx2.x)+abs(dy2.x)<abs(dx.x)+abs(dy.x)){dx=dx2;dy=dy2;}
  float m=textureGrad(uTex,st,dx,dy).r,fp=max(length(dx*uTs),length(dy*uTs)),w=max(fwidth(m),.002)*.75;
  // Everything above needs derivatives, so it runs for every pixel. The
  // relief below is the expensive part, and only the globe needs it.
  if(cov<=0.){o=vec4(0.);return;}
  float land=mix(smoothstep(.5-w,.5+w,m),m,smoothstep(1.,3.,fp));
  float cl=max(cos(lat),.15),L=2.5,du=exp2(L)/uTs.x,dv=exp2(L)/uTs.y;
  vec3 E=vec3(cos(lon),0.,-sin(lon)),N=vec3(-sin(lat)*sin(lon),cos(lat),-sin(lat)*cos(lon));
  float hc=textureLod(uTex,st,L).r;
  float gE=(textureLod(uTex,st+vec2(du,0.),L).r-textureLod(uTex,st-vec2(du,0.),L).r)/(4.*PI*du*cl);
  float gN=(textureLod(uTex,st-vec2(0.,dv),L).r-textureLod(uTex,st+vec2(0.,dv),L).r)/(2.*PI*dv);
  vec3 n=normalize(p-uBump*(gE*E+gN*N)),sT=uSun-dot(uSun,p)*p;
  vec2 off=vec2(dot(sT,E)/(2.*PI*cl),-dot(sT,N)/PI)*uShad;
  float sh=clamp((textureLod(uTex,st+off,L).r-hc)*1.6,0.,1.)*(1.-land);
  float wr=clamp(dot(n,uSun)*.5+.5,0.,1.),fac=clamp(dot(p,-rd),0.,1.);
  vec3 col=mix(uOc,uLd,land)*(.6+.48*pow(wr,1.4));
  col*=1.-.22*sh;
  col*=mix(.88,1.,pow(fac,.4));
  col=mix(col,mix(uOc,uLd,land),uFlat);
  o=vec4(col*cov,cov);
}`;

const UNIFORMS = [
  "uRes",
  "uShift",
  "uTs",
  "uC",
  "uF",
  "uR",
  "uU",
  "uSun",
  "uOc",
  "uLd",
  "uTan",
  "uUnit",
  "uBump",
  "uShad",
  "uFlat",
  "uTex",
] as const;
type Uniform = (typeof UNIFORMS)[number];

type State = {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  tex: WebGLTexture;
  u: Record<Uniform, WebGLUniformLocation | null>;
  size: [number, number];
  land: boolean;
};

// undefined = not tried yet, null = WebGL2 unavailable.
let state: State | null | undefined;
type LandImage = ImageBitmap | HTMLImageElement;
let landImage: Promise<LandImage | null> | null = null;
const landListeners = new Set<() => void>();

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

function create(): State | null {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  try {
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
    const u = {} as State["u"];
    for (const name of UNIFORMS) u[name] = gl.getUniformLocation(program, name);
    const next: State = {
      canvas,
      gl,
      program,
      vao: gl.createVertexArray()!,
      tex: gl.createTexture()!,
      u,
      size: [1, 1],
      land: false,
    };
    // A lost context (GPU reset, too many tabs) is rebuilt on the next draw.
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      if (state === next) state = undefined;
    });
    return next;
  } catch (err) {
    console.warn("[globe] WebGL2 setup failed", err);
    return null;
  }
}

function get(): State | null {
  if (state === undefined) {
    state = create();
    if (state) void upload(state);
  }
  return state;
}

/** True when this browser can draw the globe at all. */
export function globeSupported() {
  return get() !== null;
}

function decode(blob: Blob): Promise<LandImage> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function fetchLand() {
  landImage ??= fetch(LAND_SRC)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status}`))))
    .then(decode)
    .catch((err) => {
      console.warn("[globe] land texture failed to load", err);
      landImage = null;
      return null;
    });
  return landImage;
}

async function upload(s: State) {
  const img = await fetchLand();
  if (!img || state !== s) return;
  const { gl } = s;
  gl.bindTexture(gl.TEXTURE_2D, s.tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  if (aniso) {
    gl.texParameterf(
      gl.TEXTURE_2D,
      aniso.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)),
    );
  }
  s.size = [img.width, img.height];
  s.land = true;
  for (const cb of landListeners) cb();
}

/**
 * Start fetching the land texture without drawing anything. Pages call this
 * once the browser is idle, so the first globe is ready before it's reached.
 */
export function preloadGlobe() {
  get();
}

/** True once the land texture is on the GPU and globes can be drawn. */
export const landReady = () => state?.land === true;

/** Called once the land texture is on the GPU — globes drawn before that
 *  were only the backdrop, so they should repaint. */
export function onLandReady(cb: () => void) {
  landListeners.add(cb);
  return () => {
    landListeners.delete(cb);
  };
}

/**
 * Draws the globe for `cam` into `ctx`, which must be a canvas `dpr` times the
 * camera's CSS size. Only the globe's bounding square is shaded and copied.
 * `flat` (0..1) evens the clay's light and shadow out to the plain palette.
 * Returns false (drawing nothing) until the land texture has arrived.
 */
export function drawGlobe(ctx: CanvasRenderingContext2D, cam: Camera, dpr: number, flat = 0): boolean {
  const s = get();
  if (!s || !s.land) return false;
  const { gl, u } = s;
  const W = Math.max(2, Math.round(cam.W * dpr));
  const H = Math.max(2, Math.round(cam.H * dpr));
  if (s.canvas.width !== W || s.canvas.height !== H) {
    s.canvas.width = W;
    s.canvas.height = H;
  }

  // The silhouette's bounding box in device px, plus a pixel of antialiasing.
  const pad = 2;
  const x0 = Math.max(0, Math.floor((cam.cx - cam.r) * dpr) - pad);
  const y0 = Math.max(0, Math.floor((cam.cy - cam.r) * dpr) - pad);
  const x1 = Math.min(W, Math.ceil((cam.cx + cam.r) * dpr) + pad);
  const y1 = Math.min(H, Math.ceil((cam.cy + cam.r) * dpr) + pad);
  if (x1 <= x0 || y1 <= y0) return true;

  gl.viewport(0, 0, W, H);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(x0, H - y1, x1 - x0, y1 - y0);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(s.program);
  gl.bindVertexArray(s.vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, s.tex);
  gl.uniform1i(u.uTex, 0);
  gl.uniform2f(u.uRes, W, H);
  gl.uniform2f(u.uShift, cam.shift[0], cam.shift[1]);
  gl.uniform2f(u.uTs, s.size[0], s.size[1]);
  gl.uniform3fv(u.uC, cam.C);
  gl.uniform3fv(u.uF, cam.F);
  gl.uniform3fv(u.uR, cam.R);
  gl.uniform3fv(u.uU, cam.Up);
  gl.uniform3fv(u.uSun, sunDir(cam));
  gl.uniform3fv(u.uOc, BLUE);
  gl.uniform3fv(u.uLd, YELLOW);
  gl.uniform1f(u.uTan, cam.tan);
  gl.uniform1f(u.uUnit, cam.unit * dpr);
  gl.uniform1f(u.uBump, 0.006);
  gl.uniform1f(u.uShad, 0.014);
  gl.uniform1f(u.uFlat, flat);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disable(gl.SCISSOR_TEST);

  // Copy in the same task as the draw: the drawing buffer isn't preserved.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(s.canvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
  return true;
}
