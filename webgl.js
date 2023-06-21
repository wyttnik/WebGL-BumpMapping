import * as glm from "gl-matrix";
import orangeVS from "./shaders/orangeVS";
import orangeFS from "./shaders/orangeFS";
import image_list from "./images/*";
import { OBJ } from "webgl-obj-loader";
import sphere from './models/sphere_obj';

/** @type {WebGLRenderingContext} */
let gl;

let ambientCoeff = 1.0, c1 = 0.0001, c2 = 0;
let model, nMatrix, orangeTexture, lightOuterValue = 1.0, propDig = 0.5, propMat = 0.5;
let meshes = {};
const app = {};
let proj_m;

main();

function main() {
  gl = document.getElementById("test").getContext("webgl2");

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  setupWebGL();

  app.carShaderProgram = initShaderProgram(orangeVS, orangeFS);
  
  setupTextures();

  meshes.sphere = new OBJ.Mesh(sphere);
  for (let i=0; i<meshes.sphere.vertices.length; ++i) {
    meshes.sphere.vertices[i] *= 7;
  }
  OBJ.initMeshBuffers(gl, meshes.sphere);
  meshes.sphere.angle = [0,0];

  initListeners();

  proj_m = initProjMatrix();

  requestAnimationFrame(render);
}

function initCommonUniforms(shaderProgram) {
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler0"), 0);
  gl.uniform2fv(gl.getUniformLocation(shaderProgram,"uTextSize"),[256,256]);

  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_proj"),false,proj_m);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uc1"), c1);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uc2"), c2);
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"uAmbientCoeff"), ambientCoeff);

  // lights
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uLightPosition"),[15,40,-60]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uAmbientLightColor"),[0.1,0.1,0.1]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uDiffuseLightColor"),[0.7,0.7,0.7]);
  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uSpecularLightColor"),[1.0,1.0,1.0]);

  // lights config
  gl.uniform1f(gl.getUniformLocation(shaderProgram,"ulightOuterValue"), lightOuterValue);
}

function initObjBuffers(shaderProgram, meshObj) {
  shaderProgram.vertexPosAttr = gl.getAttribLocation(shaderProgram, "a_pos");
  gl.enableVertexAttribArray(shaderProgram.vertexPosAttr);
  
  shaderProgram.vertexNormAttr = gl.getAttribLocation(shaderProgram, "a_norm");
  gl.enableVertexAttribArray(shaderProgram.vertexNormAttr);
  
  shaderProgram.textCoordAttr = gl.getAttribLocation(shaderProgram, "a_text");
  gl.enableVertexAttribArray(shaderProgram.textCoordAttr);

  
  if(!meshObj.textures.length){
    gl.disableVertexAttribArray(shaderProgram.textCoordAttr);
  }
  else{
    // if the texture vertexAttribArray has been previously
    // disabled, then it needs to be re-enabled
    gl.enableVertexAttribArray(shaderProgram.textCoordAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshObj.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textCoordAttr, 
      meshObj.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshObj.indexBuffer);

  // vartex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshObj.vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPosAttr, 
    meshObj.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  // normals positions
  gl.bindBuffer(gl.ARRAY_BUFFER, meshObj.normalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormAttr, 
    meshObj.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  // model
  model = glm.mat4.create();
  glm.mat4.translate(model,model,[0,0,-80]);
  glm.mat4.rotate(model,model,meshObj.angle[0],[0,1,0]);
  glm.mat4.rotate(model,model,meshObj.angle[1],[1,0,0]);

  // glm.mat4.translate(model,model,[offset[0], offset[1], offset[2]]);
  // glm.mat4.rotate(model,model,offsetAngle,[0,1,0]);
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram,"u_model"),false,model)
  initNormMatrix(model);
  gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram,"uNMatrix"),false,nMatrix)

  gl.uniform3fv(gl.getUniformLocation(shaderProgram,"uColor"),[255/255, 102/255, 0]);
}

function initShaderProgram(vsSource, fsSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)
  
    // Create the shader program
    const shaderProgram = gl.createProgram()
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
  
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram)}`)
      return null
    }
    return shaderProgram;
    //gl.useProgram(shaderProgram)
}
  
// creates a shader of the given type, uploads the source and compiles it.
function loadShader(type, source) {
    const shader = gl.createShader(type)

    // Send the source to the shader object
    gl.shaderSource(shader, source)

    // Compile the shader program
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
        gl.deleteShader(shader)
        return null
    }

    return shader
}

function setupTextures(){
  orangeTexture = gl.createTexture();
  setTexture([image_list['bump.png']], 
              [orangeTexture]);
}

function setupWebGL() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(gl.DEPTH_TEST)
  //gl.enable(gl.BLEND)
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
}

function setTexture(urls, textures) {
  for(let i = 0; i < urls.length; i++){
    gl.bindTexture(gl.TEXTURE_2D, textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([3*255/4, 3*255/4, 3*255/4, 255]));

    if (urls[i].length != 0) {
      let image = new Image();
      image.onload = function() {
        handleTextureLoaded(image, textures[i]);
      }
      // image.crossOrigin = "anonymous";
      image.src = urls[i];
    }
  }
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    // Yes, it's a power of 2. Generate mips.
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // No, it's not a power of 2. Turn off mips and set
    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function changeOrangePos(hor,vert) {
  meshes.sphere.angle[0] += hor;
  meshes.sphere.angle[1] += vert;
}

function initListeners(){
  window.addEventListener("keydown", e => {
    switch(e.key) {
      case "w": {
        changeOrangePos(0,-0.1);
        break;
      }
      case "s":{
        changeOrangePos(0,0.1);
        break;
      }
      case "a": {
        changeOrangePos(-0.1,0.0);
        break;
      }
      case "d": {
        changeOrangePos(0.1,0);
        break;
      }
    }
  });

  document.getElementById('myRange').oninput = () => {
    ambientCoeff = Number(document.getElementById('myRange').value) + 1.0;
  }

  document.getElementById('c1-range').oninput = () => {
    c1 = Number(document.getElementById('c1-range').value);
  }

  document.getElementById('c2-range').oninput = () => {
    c2 = Number(document.getElementById('c2-range').value);
  }
  
  document.getElementById('light-outer-range').value = 1.0;
  document.getElementById('light-outer-range').oninput = () => {
    lightOuterValue = Number(document.getElementById('light-outer-range').value);
  }
}

function initProjMatrix() {
  const proj = glm.mat4.create();
  glm.mat4.perspective(proj,  Math.PI / 10, 
    gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 500.0);
  return proj;
  
}

function initNormMatrix(model){
  nMatrix = glm.mat3.create();
  glm.mat3.normalFromMat4(nMatrix, model);
}

function render(){
  gl.viewport(0,0,gl.canvas.width, gl.canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT)

  gl.useProgram(app.carShaderProgram);
  initCommonUniforms(app.carShaderProgram);

  // Sphere
  initObjBuffers(app.carShaderProgram, meshes.sphere);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, orangeTexture);
  gl.drawElements(gl.TRIANGLES, meshes.sphere.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render)
}
