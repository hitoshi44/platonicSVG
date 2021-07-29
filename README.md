# platonicSVG

platonicSVG is a simple custom element which shows a spinning Platonic Solid as SVG.
You can control which solid to show (Tetrahedron ~ Icosahedron), spinning direction and speed,
or color of the faces and strokes by changing element's attributes.

## Install

When you are using node 

```
npm install platonicsvg
```

or 

```
yarn add platonicsvg
```

When load from html directly, hosting yourself,

```html
<script src="./yourhost/svwc.js" type="text/javascript" charset="utf-8" async defer></script>
```

## Start to use.

Very simple. Just put the tag like a regular HTML element wherever you like.

```
<div>
  <platonic-svg></platonic-svg>
</div>
```

## Custom to use.

With setting attributes, you can control the SVG's behavior as below.

```html
 <platonic-spinner id="mySolid"

    solid=dodecahedron

    width=128
    height=128

    line-color=#3c3c3c
    line-width=1px
    face-color=rgba(32,32,128,0.6)

    dx=2
    dy=0
    dz=1

  ></platonic-spinner>

```

### Solid Type

With `solid` attribute, you can specify which solid to show.
Specify a number of faces (means using integer) is also OK.

`4`,  `tetra`, `tetrahedron`, `simplex` => Tetrahedron.
`6`,  `hexa`,  `hexahedron`,  `cube`    => Hexahedron.
`8`,  `octa`,  `octahedron`             => Octahedron.
`12`, `dodeca`,`dodecahedron`           => Dodecahedron.
`20`, `icosa`, `icosahedron`            => Icosahedron.

### Other Settings

Here is the table of rest of attributes you can control.

| Attribute Name | Description | Value Type | Default Value |
| -------------- | ----------- | :--------: | ------------: |
| width | width of the SVG frame containing a solid | integer | 256 |
| height| height of the SVG frame containing a solid | integer | 256 |
| back-color | SVG frame color | CSS color | inherit |
| edge-color | Solid edge's color | CSS color | #6E777C |
| edge-width | Solid edge's width | CSS color | 1px |
| face-color | Solid face's color | CSS color | rgba(215,230,244, 0.8) |
| SVGClassName | Class Name set to SVG element | string | "platonic-svg" |
| PolyhedronFaceClassName | Class Name set to a solid's faces | string | "platonic-face" |
| dx | x component of a spinning vector | integer | 1 |
| dy | y component of a spinning vector | integer | 1 |
| dz | z component of a spinning vector | integer | 0 |
| fps | frame per sec of spinning | integer | 40 |
| progress-max | same as "max" attribute of a progress tag| integer | 100 |
| progress-value | same as "value" attribute of a progress tag| integer | null |
| progressed-face-color | Solid face's color which represents progressed part | CSS color | rgba(0,0,0,0.6)|

## Other Utilities

platonicSVG expose a few utility for you.

### Z value

With the current SVG specifications, each child element can't be represent "z-index" by attributes. The "z order" only achieved by an order of elements.
So platonicSVG calculates "z-index" of each face-polygon from a original 3D coordinates and sort them by "z order" on every rendering process.

Note that this z value is stored as a property of each polygon object value, not in tag's attribute.

Internally, z axis projection is used.

### :hover thing

Thus platonicSVG has "z order", you can do :hover stuff just put your own style sheet.
When do that, don't forget to put `!important` on the style because each polygon has its own inline style by default.

```css
.platonic-face:hover{
  fill: #454C50 !important;
}
```

### "progress-value" attribute

By updating "progress-value" attribute, you can do slimilar thing to `progress` tag.It changes face color.

You can control the color by "progressed-face-color" attribute or set style to `.progressed`. Will collide to other style name? just using `platonic-svg > progressed`. Remember that you can change `platonic-svg` by setting "SVGClassName" attribute.