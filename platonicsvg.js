/*
  MIT License
  Copyright (c) 2021 Hitoshi Harumi

  This software is released under the MIT License, see ./LICENSE
*/
class PlatonicSVG extends HTMLElement {


  constructor() {
    super();

    this.degree   = Math.PI/180;// Constant to use frequently.
    this.timerId  = null;       // To remove rendering callback loop when disconned.

    this.rotatedDegree = [0,0,0];// How much rotated from the "base faces."
    this.baseFaces     = null;   // Base coordinates of a solid's faces.
    this.svgFaces      = [];     // Actual SVG objects rendered on a screen whos
                                 // calculated by "rotatedDegree" and "baseFaces".
    
    this.firstChildSVG = null;   // For fast access to <this.firstChild>
  }


  connectedCallback() {
    // Params for initializing from attributes or default.

    // Define view which of Platon Solids, controlling with "solid" attr.
    // e.g) 12, dodeca, dodecahedron  all show dodecahedron.
    this.baseFaces = this.getInitialCoordinates(
      this.getAttribute("solid") || "12" 
    ); 

    // Define a direction the solid spin in 3D, and fps of a "tick".
    const dx  = parseInt((this.getAttribute("dx")  || 1));
    const dy  = parseInt((this.getAttribute("dy")  || 1));
    const dz  = parseInt((this.getAttribute("dz")  || 0));
    const fps = parseInt((this.getAttribute("fps") || 40));
    
    // For SVG solid representings, such as width, color, edge-width...etc.
    const width  = this.getAttribute("width")      || "256";
    const height = this.getAttribute("height")     || "256";
    const backc  = this.getAttribute("back-color") || "inherit";
    const edgec  = this.getAttribute("edge-color") || "#6E777C";
    const edgew  = this.getAttribute("edge-width") || "1px";
    const facec  = this.getAttribute("face-color") || "rgba(215,230,244, 0.8)";
    // For SVG elements class name for let CSS can control them.
    const containerCls = this.getAttribute("SVGClassName")  || "platonic-svg";
    const facesCls     = this.getAttribute("PolyhedronFaceClassName") || "platonic-face";


    // Create SVG Element and set them to this.svgFaces .
    // Almost of all setups get done.
    this.constructSVGElements(
      width, height,
      backc, edgec, facec, edgew,
      containerCls, facesCls
    );

    // For progress-bar like facility.
    // TODO: Is this facility necessary??
    this.progressMax = parseInt(this.getAttribute("progress-max") || 100);


    // Start to Rotate!
    this.timerId = setInterval(
      () => { this.rotate(dx, dy, dz); this.render();},
      1000/fps
      );
  }
  disconnectedCallback() {
    clearInterval(this.timerId);
  }


  // For progress-bar like facility.
  // TODO: Is needed?
  static get observedAttributes() {return ["progress-value"];}
  attributeChangedCallback(_n, _o, newvalue) {
    
    // get the integer part of calculated progressed counts.
    const latest = ((newvalue / this.progressMax) * this.svgFaces.length) | 0;
    const progressedFill = this.getAttribute("progressed-face-color") || "rgba(0,0,0,0.6)";
    const defaultFill = this.getAttribute("face-color") || "rgba(215,230,244, 0.8)";

    let isProgressed;
    let i = 0;
    for(const face of this.svgFaces){
      isProgressed = (i <= latest); 

      if(isProgressed){
        this.svgFaces[i].setAttribute("fill", progressedFill);
        this.svgFaces[i].classList.add("progressed");

      } else {
        this.svgFaces[i].setAttribute("fill", defaultFill);
        this.svgFaces[i].classList.remove("progressed");
      }

      i++;
    }
  }

  getInitialCoordinates(solidType) {

    let coordinates;

    switch(solidType) {

      case '4':
      case 'tetra':
      case 'tetrahedron':
      case 'simplex':
        coordinates = this.unitTetrahedron();
        break;

      case '6':
      case 'hexa':
      case 'hexahedron':
      case 'cube':
        coordinates = this.unitHexahedron();
        break;

      case '8':
      case 'octa':
      case 'octahedron':
        coordinates = this.unitOctahedron();
        break;

      case '12':
      case 'dodeca':
      case 'dodecahedron':
        coordinates = this.unitDodecahedron();
        break;

      case '20':
      case 'icosa':
      case 'icosahedron':
        coordinates = this.unitIcosahedron();
        break;
    }

    // Return a 128 times enlarged coordinates of the solid.
    // Number 128 has no meanings, but  
    return coordinates.map(
      (face)=>{
        return face.map( ([x,y,z]) => [128*x, 128*y, 128*z]);
      }
    );
  }

  constructSVGElements(width, height, backc, edgec, facec, edgew,
                       containerCls, facesCls) {
    const containerSVG =
      document.createElementNS("http://www.w3.org/2000/svg", "svg");
  
    // Set view configs on the container elems.   
    containerSVG.setAttribute('width'  , width);
    containerSVG.setAttribute('height' , height);
    containerSVG.setAttribute('viewBox', '-128 -128 256 256');
    containerSVG.setAttribute('style'  , ("background-color:"+backc+';'));
    containerSVG.classList.add(containerCls);

    // Create SVG polygons, which represent current positioned faces of solid.
    // And Append them into svgFaces, and containerSVG.
    this.baseFaces.forEach((face)=>{

      // Current Face of a solid.
      const polygon = 
        document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      
      // Set view configs on a polygon ()
      polygon.setAttribute("stroke-width",edgew)
      polygon.setAttribute("stroke",edgec);
      polygon.setAttribute("fill",facec);
      polygon.classList.add(facesCls);
      // Put the "coordinates info" into.
      polygon.setAttribute(
          "points",
          face.map(this.zProject).toString()
        );

      // svgFaces     is ref to polygons for later operations.
      // containerSVG is actual seen SVG on a screen.
      this.svgFaces.push(polygon);
      containerSVG.appendChild(polygon);
    });

    // Append the container and get the reference.
    this.appendChild(containerSVG);
    this.firstChildSVG = this.firstChild;
  }

  rotate(dx, dy, dz) {
    this.rotatedDegree[0] += dx;
    this.rotatedDegree[1] += dy;
    this.rotatedDegree[2] += dz;
  }

  render() {
    // Clear current SVG polygons, 
    // Create new SVG polygons with updated coordinates,
    // And append them to the container

    /*
    **  render() calculates next moment's coordinates by two info:
    **    this.baseFaces     : the initial coordinates of a solid
    **    this.rotatedDegree : how much rotated from the initial.
    **
    **  instead of using (rotation vector) and (current coordinates)
    **  to avoid to solid gently shrink (caused by cancellation stuff may be).
    */


    // Clear the currents.
    this.clearChild(this.firstChildSVG);


    // Create New 
    const [x, y, z] = this.rotatedDegree;
    const deg  = this.degree;
    const cosX = Math.cos(deg * x);
    const sinX = Math.sin(deg * x);
    const cosY = Math.cos(deg * y);
    const sinY = Math.sin(deg * y);
    const cosZ = Math.cos(deg * z);
    const sinZ = Math.sin(deg * z);

    let i = 0;
    this.baseFaces.forEach((face)=>{
      
      const coordinates = face.map((vertex)=>[
        (cosY*cosZ)*vertex[0]  +(sinX*sinY*cosZ - cosX*sinZ)*vertex[1]  +(cosX*sinY*cosZ + sinX*sinZ)*vertex[2],
        (cosY*sinZ)*vertex[0]  +(sinX*sinY*sinZ + cosX*cosZ)*vertex[1]  +(cosX*sinY*sinZ - sinX*cosZ)*vertex[2],
            (-sinY)*vertex[0]                   +(sinX*cosY)*vertex[1]                   +(cosX*cosY)*vertex[2]
        ]);
      
      this.svgFaces[i].setAttribute( "points", coordinates.map(this.zProject).toString() );
      // Add z property for sorting them later.
      this.svgFaces[i].z = this.getZIndex(coordinates);
      
      i++;
    });


    // Little Hacky.
    // Before appending new polygons, sort them by z-prop calculated in for loop.
    // Becaus SVG does NOT support Z index property now, 
    // order of child elements is the only way to represent Z index.
    const polygons = this.svgFaces.slice();
    polygons.sort(this.sortByZ);
    for(const p of polygons) {
      this.firstChildSVG.appendChild(p);
    }

  }


  getZIndex(faceCoordinates) {
    let sum = 0;
    faceCoordinates.forEach((vertex)=>{
      sum += vertex[2]; // sum z of each points of a face. 
    });
    sum *= 8096;// TODO: is this adequate?
    return sum | 0;// retrieve integer part
  }
  sortByZ(a,b){ 
    return(a.z - b.z);
  }

  //helpers
  zProject([x,y,z]){return [x,y]}
  clearChild(node) {
    while(node.firstChild){
      node.firstChild.remove()
    }
  }

  // For initial coordinates of Platon Solids.
  // Very beutiful.
  unitTetrahedron() {
    const r2 = Math.sqrt(2);
    const r6 = Math.sqrt(6);

    const a = [        0,          0,   1  ];
    const b = [        0,  r2*(-2/3),  -1/3];
    const c = [r6*( 1/3),  r2*( 1/3),  -1/3];
    const d = [r6*(-1/3),  r2*( 1/3),  -1/3];

    return [
      [a,b,c],
      [a,b,d],
      [a,c,d],
      [b,c,d]
    ];
  }
  unitHexahedron() {
    const l = (1/3)*Math.sqrt(3);

    const a = [ l, l, l];
    const b = [ l,-l, l];
    const c = [-l,-l, l];
    const d = [-l, l, l];
    const e = [ l, l,-l];
    const f = [ l,-l,-l];
    const g = [-l,-l,-l];
    const h = [-l, l,-l];

    return [
      [a,b,c,d],
      [a,b,f,e],[b,c,g,f],[c,d,h,g],[a,d,h,e],
      [e,f,g,h]
    ];
  }
  unitOctahedron() {
    const l = 1;

    const a = [ 0, 0, l];
    const b = [ l, 0, 0];
    const c = [ 0, l, 0];
    const d = [-l, 0, 0];
    const e = [ 0,-l, 0];
    const f = [ 0, 0,-l];

    return [
      [a,b,c],[a,c,d],[a,d,e],[a,e,b],
      [f,b,c],[f,c,d],[f,d,e],[f,e,b]
    ]
  }
  unitDodecahedron() {
    const ratio = Math.sqrt(0.5 + Math.sqrt(5)/6) / (2 + Math.sqrt(5));
    const alpha = ((1 + Math.sqrt(5))/2) * ratio;
    const beta  =  (2 + Math.sqrt(5))    * ratio;
    const gamma = ((3 + Math.sqrt(5))/2) * ratio;

    const t1  = [ alpha, 0, beta];
    const t2  = [-alpha, 0, beta];
    const b1  = [ alpha, 0,-beta];
    const b2  = [-alpha, 0,-beta];

    const mt1 = [ gamma, gamma, gamma];
    const mt2 = [     0,  beta, alpha];
    const mt3 = [-gamma, gamma, gamma];
    const mt4 = [-gamma,-gamma, gamma];
    const mt5 = [     0, -beta, alpha];
    const mt6 = [ gamma,-gamma, gamma];

    const mb1 = [ gamma, gamma,-gamma];
    const mb2 = [     0,  beta,-alpha];
    const mb3 = [-gamma, gamma,-gamma];
    const mb4 = [-gamma,-gamma,-gamma];
    const mb5 = [     0, -beta,-alpha];
    const mb6 = [ gamma,-gamma,-gamma];

    const mm1 = [  beta, alpha, 0];
    const mm2 = [ -beta, alpha, 0];
    const mm3 = [ -beta,-alpha, 0];
    const mm4 = [  beta,-alpha, 0];

    return [
      [ t1,  t2, mt3, mt2, mt1],
      [ t1,  t2, mt4, mt5, mt6],
      [ t2, mt3, mm2, mm3, mt4],
      [ t1, mt1, mm1, mm4, mt6],
      [ b1,  b2, mb3, mb2, mb1],
      [ b1,  b2, mb4, mb5, mb6],
      [ b1, mb1, mm1, mm4, mb6],
      [ b2, mb3, mm2, mm3, mb4],

      [mt2, mt3, mm2, mb3, mb2],
      [mt1, mt2, mb2, mb1, mm1],
      [mt4, mm3, mb4, mb5, mt5],
      [mt6, mt5, mb5, mb6, mm4]
    ];
  }
  unitIcosahedron() {
    const ratio = Math.sqrt( 2/(5+Math.sqrt(5) ));
    const unit  = 1 * ratio;
    const gr    = ( (1+Math.sqrt(5))/2 ) * ratio;

    const t1 = [    0, unit,   gr];
    const t2 = [  -gr,    0, unit];
    const t3 = [    0,-unit,   gr];
    const t4 = [   gr,    0, unit];
    
    const b1 = [    0, unit,  -gr];
    const b2 = [  -gr,    0,-unit];
    const b3 = [    0,-unit,  -gr];
    const b4 = [   gr,    0,-unit];

    const m1 = [ unit,   gr,    0];
    const m2 = [-unit,   gr,    0];
    const m3 = [-unit,  -gr,    0];
    const m4 = [ unit,  -gr,    0];

    return [
      [t1, t2, t3], [t1, t3, t4],
      [t3, t4, m4], [t3, t2, m3], [t1, t2, m2], [t1, m1, t4],
      [t1, m2, m1], [t3, m3, m4],
      [m1, t4, b4], [t4, m4, b4], [t2, m3, b2], [t2, b2, m2],
      [b3, m3, m4], [m1, m2, b1],
      [b2, b3, m3], [b3, b4, m4], [b1, b4, m1], [b1, b2, m2],
      [b1, b2, b3], [b1, b3, b4]
    ]
  }
}
customElements.define('platonic-svg', PlatonicSVG);